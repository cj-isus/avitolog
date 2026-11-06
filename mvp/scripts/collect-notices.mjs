#!/usr/bin/env node
// Reads metadata and text files only. Dependency modules and lifecycle scripts are never loaded.
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, realpath, unlink, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const GENERATOR = 'avitolog-collect-notices/v1';
const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--check')) throw new Error('Only --check is supported.');
const checkOnly = args.includes('--check');
const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const output = resolve(root, 'public', 'licenses');
const summaryPath = resolve(root, 'THIRD-PARTY-NOTICES.md');
const lockBytes = await readFile(resolve(root, 'package-lock.json'));
const lock = JSON.parse(lockBytes.toString('utf8'));
if (!lock.packages || lock.lockfileVersion < 2) throw new Error('A package-lock v2/v3 packages map is required.');
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const posix = (path) => path.split(sep).join('/');
const safeSegment = (value) => value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 140);
const namedNotice = /^(?:licen[cs]es?|notices?|copying|copyright(?:notice)?)(?:[._-].*)?$/i;
const thirdPartyNotice = /^(?:third[-_ ]?party)[-_. ]*(?:licen[cs]es?|notices?)(?:[._-].*)?$/i;
const namedLicense = /^(?:licen[cs]es?|copying)(?:[._-].*)?$/i;
const inside = (base, target) => {
  const rel = relative(base, target);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel));
};
if (!inside(root, output) || output === root) throw new Error('Unsafe output directory.');
const toOutput = (path) => {
  if (!path || path.includes('\\') || path.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`Unsafe managed path: ${path}`);
  }
  const target = resolve(output, ...path.split('/'));
  if (!inside(output, target) || target === output) throw new Error(`Output escapes licenses/: ${path}`);
  return target;
};
async function exists(path) {
  try { await lstat(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
async function noSymlinkAncestors(path) {
  if (!inside(root, path)) throw new Error(`Path escapes MVP root: ${path}`);
  let current = root;
  for (const part of relative(root, path).split(sep).filter(Boolean)) {
    current = join(current, part);
    if (!(await exists(current))) continue;
    if ((await lstat(current)).isSymbolicLink()) throw new Error(`Refusing symlink: ${current}`);
    if (!inside(root, await realpath(current))) throw new Error(`Resolved path escapes MVP root: ${current}`);
  }
}
async function listNoticeFiles(packageRoot) {
  const found = [];
  let visited = 0;
  async function walk(dir, inNoticeDirectory = false, depth = 0) {
    if (depth > 30) throw new Error(`Notice traversal depth exceeded: ${dir}`);
    const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) => compare(a.name, b.name));
    for (const entry of entries) {
      if (++visited > 100000) throw new Error(`Notice traversal size exceeded: ${packageRoot}`);
      if (entry.isSymbolicLink()) throw new Error(`Refusing symlink in dependency: ${join(dir, entry.name)}`);
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        await walk(path, inNoticeDirectory || namedNotice.test(entry.name) || thirdPartyNotice.test(entry.name), depth + 1);
      } else if (entry.isFile() && (inNoticeDirectory || namedNotice.test(entry.name) || thirdPartyNotice.test(entry.name))) {
        if (!inside(packageRoot, await realpath(path))) throw new Error(`Notice source escapes package: ${path}`);
        found.push(path);
      }
    }
  }
  await walk(packageRoot);
  return found.sort(compare);
}
const rootMetadata = lock.packages[''] ?? {};
const direct = new Set(Object.keys({ ...rootMetadata.dependencies, ...rootMetadata.optionalDependencies }));
const selected = Object.entries(lock.packages)
  .filter(([path, metadata]) => path !== '' && metadata.dev !== true)
  .sort(([a], [b]) => compare(a, b));
const files = new Map();
const packages = [];
for (const [lockPath, metadata] of selected) {
  if (!lockPath.startsWith('node_modules/') || lockPath.includes('\\') || lockPath.split('/').some((p) => p === '..' || p === '.')) {
    throw new Error(`Unsupported or unsafe lock path: ${lockPath}`);
  }
  if (metadata.link) throw new Error(`Linked packages require explicit notice handling: ${lockPath}`);
  const packageRoot = resolve(root, ...lockPath.split('/'));
  await noSymlinkAncestors(packageRoot);
  const inferredName = lockPath.slice(lockPath.lastIndexOf('node_modules/') + 'node_modules/'.length);
  const record = {
    name: inferredName,
    version: metadata.version ?? 'unknown',
    lockPath,
    direct: direct.has(inferredName) && lockPath === `node_modules/${inferredName}`,
    devOptional: metadata.devOptional === true,
    optional: metadata.optional === true,
    declaredLicense: metadata.license ?? 'unknown',
    installedLicense: 'unknown',
    licenseTextStatus: 'unknown_missing_file',
    repository: null,
    resolved: metadata.resolved ?? null,
    integrity: metadata.integrity ?? null,
    files: [],
    warnings: [],
  };
  if (!(await exists(join(packageRoot, 'package.json')))) {
    record.licenseTextStatus = 'unknown_package_not_installed';
    record.warnings.push('Selected lock entry is not installed; no license text was fabricated.');
    packages.push(record);
    continue;
  }
  await noSymlinkAncestors(join(packageRoot, 'package.json'));
  const installed = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  if (installed.name !== inferredName || installed.version !== metadata.version) {
    throw new Error(`Installed name/version differs from lock: ${lockPath}`);
  }
  record.installedLicense = installed.license ?? 'unknown';
  record.repository = installed.repository ?? null;
  const folder = `packages/${safeSegment(record.name)}@${safeSegment(record.version)}--${sha256(lockPath).slice(0, 10)}`;
  const noticePaths = await listNoticeFiles(packageRoot);
  let hasLicense = false;
  for (const source of noticePaths) {
    const packageRelative = posix(relative(packageRoot, source));
    const data = await readFile(source);
    const destination = `${folder}/${packageRelative}`;
    toOutput(destination);
    files.set(destination, data);
    hasLicense ||= packageRelative.split('/').some((part) => namedLicense.test(part));
    record.files.push({
      sourcePath: `${lockPath}/${packageRelative}`,
      copiedPath: destination,
      sha256: sha256(data),
      bytes: data.byteLength,
    });
  }
  if (hasLicense) record.licenseTextStatus = 'collected_original_files';
  else record.warnings.push('No conventionally named LICENSE/LICENCE/COPYING file found in the installed package; declared metadata is not a substitute.');
  if (record.name === 'lucide-react') {
    const lucideLicense = record.files.find((file) => file.sourcePath.endsWith('/LICENSE'));
    const content = lucideLicense ? files.get(lucideLicense.copiedPath).toString('utf8') : '';
    if (!content.includes('ISC License') || !content.includes('The MIT License (MIT)') || !content.includes('Feather')) {
      record.warnings.push('Expected Lucide ISC + Feather MIT notices were not both detected; review before distribution.');
    }
    record.noticeDetail = 'The original LICENSE includes ISC and the MIT notice for listed Feather-derived icons; preserved without modification.';
  }
  if (record.name === 'react-remove-scroll-bar' && record.version === '2.3.8' && !hasLicense) {
    record.sourceRecoveryReview = {
      checkedOn: '2026-11-06',
      npmVersionMetadata: 'https://registry.npmjs.org/react-remove-scroll-bar/2.3.8',
      reportedGitHead: 'b3b1287aad81def2e2ae707274b74531b61ddbaf',
      attemptedExactSource: 'https://raw.githubusercontent.com/theKashey/react-remove-scroll-bar/b3b1287aad81def2e2ae707274b74531b61ddbaf/LICENSE',
      outcome: 'Exact gitHead and version tag lookups returned 404 through GitHub connector; version-matched original text was not recovered. No master/other-version text substituted.',
      collectorNetworkAccess: false,
    };
  }
  packages.push(record);
}
const missing = packages.filter((pkg) => pkg.licenseTextStatus !== 'collected_original_files');
const warnings = packages.flatMap((pkg) => pkg.warnings.map((warning) => `${pkg.name}@${pkg.version}: ${warning}`));
const licenseCounts = {};
for (const pkg of packages) {
  const key = typeof pkg.declaredLicense === 'string' ? pkg.declaredLicense : JSON.stringify(pkg.declaredLicense);
  licenseCounts[key] = (licenseCounts[key] ?? 0) + 1;
}
const manifest = {
  schemaVersion: 1,
  generator: GENERATOR,
  packageLock: { sourcePath: 'package-lock.json', sha256: sha256(lockBytes), lockfileVersion: lock.lockfileVersion },
  selection: 'Every non-root package-lock packages entry with dev !== true; installed files copied byte-for-byte. Includes optional/devOptional/type packages conservatively; not a bundler reachability analysis.',
  scopeLimits: [
    'Dependency code is not executed. No network fetches or npm lifecycle scripts are used by this collector.',
    'Only conventionally named LICENSE/LICENCE/NOTICE/COPYING/CopyrightNotice/third-party notice files and notice directories are collected; inline source headers and nonstandard names require separate review.',
    'Declared license fields are preserved metadata, not an automatic compatibility or completeness guarantee.',
    'The AVITOLOG application license has not been selected; third-party licenses do not license the original application or authorize access to Avito.',
  ],
  totals: { selectedLockLocations: packages.length, directPackages: packages.filter((pkg) => pkg.direct).length, originalFiles: files.size, missingLicenseTexts: missing.length, declaredLicenses: licenseCounts },
  packages,
  warnings,
  managedFiles: [...files.keys(), 'THIRD-PARTY-NOTICES.md', 'manifest.json'].sort(compare),
};
function md(value) { return String(typeof value === 'string' ? value : JSON.stringify(value)).replaceAll('|', '\\|').replaceAll('\n', ' '); }
function renderSummary(prefix) {
  const lines = [
    '# Third-party notices — АВИТОЛОГ MVP', '',
    'Generated by `node scripts/collect-notices.mjs` from the installed packages selected by `package-lock.json` (`dev !== true`). Run `node scripts/collect-notices.mjs --check` to compare generated files without writing.', '',
    `Lock SHA-256: \`${manifest.packageLock.sha256}\`. Package locations: **${packages.length}**; direct runtime dependencies: **${manifest.totals.directPackages}**; original notice files: **${files.size}**; packages without an original license text: **${missing.length}**.`, '',
    'This is a conservative production-lock inventory, including optional/type packages where npm marks them non-dev. It is not a claim that every listed module is emitted by the bundler. Original files are copied byte-for-byte, including nested vendored notices. See the machine-readable [manifest](' + prefix + 'manifest.json) for versions, source paths, hashes, declarations and limitations.', '',
    '**The license for the original AVITOLOG application has not been selected.** The licenses below do not make this project MIT, grant permission to interact with Avito, or establish automatic legal compatibility. Build-tool licenses, inline source headers, assets outside these packages and nonstandard notice filenames require separate distribution review.', '',
    '## Missing original license text', '',
    ...(missing.length ? missing.map((pkg) => `- **${md(pkg.name)}@${md(pkg.version)}**: ${md(pkg.licenseTextStatus)}. Lock declaration: \`${md(pkg.declaredLicense)}\`; installed package declaration: \`${md(pkg.installedLicense)}\`. No replacement license was invented. See its manifest record for recovery evidence.`) : ['No missing conventionally named license files were detected in this selected installation.']), '',
    '## Preserved package notices', '',
    '| Package | Version | Declared license | Original files |',
    '|---|---|---|---|',
    ...packages.map((pkg) => `| ${md(pkg.name)}${pkg.direct ? ' (direct)' : ''}${pkg.devOptional ? ' (devOptional)' : ''} | ${md(pkg.version)} | ${md(pkg.declaredLicense)} | ${pkg.files.length ? pkg.files.map((file) => `[${md(file.sourcePath.slice(pkg.lockPath.length + 1))}](${prefix}${file.copiedPath.split('/').map(encodeURIComponent).join('/')})`).join(', ') : '**unknown — missing file**'} |`), '',
    'Lucide: the copied original LICENSE retains both ISC and the full MIT notice for the listed Feather-derived icons. Composite and vendored notices, including victory-vendor, are retained as supplied; npm license metadata has not replaced their text.', '',
    '## Reproduction and limitations', '',
    '- Install the exact lockfile in the intended environment before collecting; missing or mismatched installations are reported or rejected.',
    '- The collector uses only Node built-ins, reads files as data, rejects symlinks/escaping paths and writes only its managed licenses directory plus this summary.',
    '- No timestamp is inserted: identical lock and notice bytes yield identical generated files. Source/copy SHA-256 values are recorded in the manifest.',
    '- A successful collection/check proves the described file inventory and byte preservation. It does not prove license compatibility, complete attribution, a successful build, or browser/store acceptance.', '',
  ];
  return Buffer.from(lines.join('\n'), 'utf8');
}
files.set('THIRD-PARTY-NOTICES.md', renderSummary(''));
files.set('manifest.json', Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8'));
const rootSummary = renderSummary('public/licenses/');
await noSymlinkAncestors(output);
await noSymlinkAncestors(summaryPath);
let previous = null;
if (await exists(toOutput('manifest.json'))) {
  previous = JSON.parse(await readFile(toOutput('manifest.json'), 'utf8'));
  if (previous.generator !== GENERATOR || !Array.isArray(previous.managedFiles)) throw new Error('Unrecognized existing licenses manifest; refusing to overwrite.');
}
const previousManaged = new Set(previous?.managedFiles ?? []);
async function outputFiles(dir = output) {
  if (!(await exists(dir))) return [];
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlink in output: ${path}`);
    if (entry.isDirectory()) result.push(...await outputFiles(path));
    else if (entry.isFile()) result.push(posix(relative(output, path)));
    else throw new Error(`Unexpected special output file: ${path}`);
  }
  return result.sort(compare);
}
const existingFiles = await outputFiles();
for (const path of existingFiles) {
  if (!previousManaged.has(path)) throw new Error(`Unmanaged existing file in licenses/: ${path}`);
}
if (checkOnly) {
  const differences = [];
  for (const [path, expected] of files) {
    const target = toOutput(path);
    if (!(await exists(target)) || !(await readFile(target)).equals(expected)) differences.push(path);
  }
  for (const path of existingFiles) if (!files.has(path)) differences.push(`stale:${path}`);
  if (!(await exists(summaryPath)) || !(await readFile(summaryPath)).equals(rootSummary)) differences.push('THIRD-PARTY-NOTICES.md (MVP root)');
  if (differences.length) throw new Error(`Generated notices differ: ${differences.join(', ')}`);
} else {
  // Only obsolete files explicitly owned by this generator are removed; no recursive deletion.
  for (const path of previousManaged) {
    if (files.has(path)) continue;
    const target = toOutput(path);
    await noSymlinkAncestors(target);
    if (await exists(target)) {
      if (!(await lstat(target)).isFile()) throw new Error(`Not a managed regular file: ${target}`);
      await unlink(target);
    }
  }
  for (const [path, data] of files) {
    const target = toOutput(path);
    await noSymlinkAncestors(target);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data);
  }
  await writeFile(summaryPath, rootSummary);
}
console.log(`${checkOnly ? 'Checked' : 'Collected'} ${packages.length} production-lock package locations, ${manifest.totals.originalFiles} original files; ${missing.length} missing license text(s).`);
for (const warning of warnings) console.warn(`NOTICE REVIEW: ${warning}`);
