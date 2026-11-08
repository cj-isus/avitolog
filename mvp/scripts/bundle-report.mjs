import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { lstat, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const reportDirectory = resolve(root, '.artifacts');
const reportPath = resolve(reportDirectory, 'bundled-runtime.json');
const lockPath = resolve(root, 'package-lock.json');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const collectedTargets = new Map();
let pendingWrite = Promise.resolve();

async function regularOutput(path, directory) {
  try {
    const entry = await lstat(path);
    if (entry.isSymbolicLink() || (directory ? !entry.isDirectory() : !entry.isFile())) throw new Error(`Unsafe bundle-report output: ${path}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function packageModuleId(id) {
  if (id.startsWith('\0')) return null;
  const clean = id.split('?')[0];
  const path = isAbsolute(clean) ? relative(root, clean) : clean;
  const normalized = path.split(sep).join('/');
  if (!normalized.startsWith('node_modules/')) {
    if (clean.replaceAll('\\', '/').includes('/node_modules/')) throw new Error(`Bundled dependency outside the MVP root: ${id}`);
    return null;
  }
  if (normalized.includes('\\') || normalized.split('/').some((part) => !part || part === '.' || part === '..')) throw new Error(`Unsafe emitted module id: ${id}`);
  return normalized;
}

function virtualRuntimeAttribution(id) {
  // These IDs are generated from the installed package sources reviewed in REUSE.md.
  if (id.startsWith('\0vite/')) return { packageLockPath: 'node_modules/vite', attribution: 'Vite-generated browser runtime virtual module.' };
  if (id.startsWith('\0virtual:wxt-')) return { packageLockPath: 'node_modules/wxt', attribution: 'WXT virtual entrypoint template or plugin loader runtime.' };
  if (id === '\0rolldown/runtime.js') return { packageLockPath: 'node_modules/rolldown', attribution: 'Rolldown-generated interop runtime; installed dist/shared/rolldown-runtime source and original notices reviewed.' };
  return null;
}

async function writeReport(name, packageLockSha256, modules, virtualModules) {
  if (hash(await readFile(lockPath)) !== packageLockSha256) throw new Error('The package lock changed during the build.');
  await regularOutput(reportDirectory, true);
  await regularOutput(reportPath, false);
  await mkdir(reportDirectory, { recursive: true });
  let previous = { schemaVersion: 1, targets: [] };
  try {
    previous = JSON.parse(await readFile(reportPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (previous.schemaVersion !== 1 || !Array.isArray(previous.targets)) throw new Error('Unrecognized bundle report; remove it before rebuilding.');
  const otherTargets = previous.targets.filter((target) => target.name !== name && target.packageLockSha256 === packageLockSha256);
  const target = {
    name,
    packageLockSha256,
    modules: [
      ...[...modules].map(([id, renderedLength]) => ({ id, renderedLength })),
      ...[...virtualModules].flatMap(([id, renderedLength]) => {
        const attribution = virtualRuntimeAttribution(id);
        return attribution ? [{ id, renderedLength, ...attribution }] : [];
      }),
    ].sort((a, b) => compare(a.id, b.id)),
    virtualModules: [...virtualModules].sort(([a], [b]) => compare(a, b)).map(([id, renderedLength]) => ({ id, renderedLength })),
  };
  const report = { schemaVersion: 1, targets: [...otherTargets, target].sort((a, b) => compare(a.name, b.name)) };
  const bytes = `${JSON.stringify(report, null, 2)}\n`;
  const temporaryPath = `${reportPath}.tmp-${process.pid}`;
  await regularOutput(temporaryPath, false);
  await writeFile(temporaryPath, bytes);
  await rename(temporaryPath, reportPath);
}

/**
 * Reports positive-length package modules associated with emitted Rollup chunks.
 * WXT uses several Vite builds in one process; their modules accumulate per target.
 * The next process starts a fresh target while preserving the other compatible target.
 * @param {'preview' | 'extension'} target
 * @returns {import('vite').Plugin}
 */
export function emittedRuntimeReport(target) {
  if (!['preview', 'extension'].includes(target)) throw new Error('Unknown bundle report target.');
  const packageLockSha256 = hash(readFileSync(lockPath));
  const key = `${target}:${packageLockSha256}`;
  if (!collectedTargets.has(key)) collectedTargets.set(key, { modules: new Map(), virtualModules: new Map() });
  const { modules, virtualModules } = collectedTargets.get(key);
  return {
    name: `avitolog-runtime-inventory-${target}`,
    apply: 'build',
    enforce: 'post',
    async generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue;
        for (const [id, metadata] of Object.entries(output.modules)) {
          if (!Number.isFinite(metadata.renderedLength)) throw new Error(`Bundler omitted renderedLength for ${id}`);
          if (metadata.renderedLength <= 0) continue;
          if (id.startsWith('\0')) {
            const relativeVirtualId = id.replaceAll(root, '<mvp>').replaceAll(root.split(sep).join('/'), '<mvp>');
            virtualModules.set(relativeVirtualId, Math.max(virtualModules.get(relativeVirtualId) ?? 0, metadata.renderedLength));
          }
          const relativeId = packageModuleId(id);
          if (relativeId) modules.set(relativeId, Math.max(modules.get(relativeId) ?? 0, metadata.renderedLength));
        }
      }
      pendingWrite = pendingWrite.then(() => writeReport(target, packageLockSha256, modules, virtualModules));
      await pendingWrite;
    },
  };
}
