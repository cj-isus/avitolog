// Checks local research artifacts, without executing any discovered project.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const base = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(base);
const read = p => fs.readFileSync(path.join(base, p), 'utf8').replace(/^\uFEFF/, '');
const json = p => JSON.parse(read(p));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const checks = [];
function check(name, success, detail) { checks.push({name, result: success ? 'pass' : 'fail', detail}); }
function csv(input) {
  const result = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') { if (quoted && input[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && c === ',') { row.push(value); value = ''; }
    else if (!quoted && c === '\n') { row.push(value.replace(/\r$/, '')); result.push(row); row = []; value = ''; }
    else value += c;
  }
  if (value || row.length) { row.push(value); result.push(row); }
  if (quoted) throw new Error('Unclosed CSV quote');
  return result;
}
const broad = json('data/github-repositories.json');
const deep = json('data/deep-reviews.json');
const coverage = json('data/search-coverage.json');
const manifest = json('data/snapshot-manifest.json');
const broadRows = csv(read('data/github-repositories.csv'));
const deepRows = csv(read('data/deep-reviews.csv'));
const names = broad.repositories.map(e => e.full_name.toLowerCase());
const deepNames = deep.entries.map(e => e.repo.toLowerCase());
check('broad_unique_count', broad.repository_count === 1811 && names.length === 1811 && new Set(names).size === 1811 && new Set(broad.repositories.map(e => e.id)).size === 1811, {records: names.length, unique_names: new Set(names).size});
check('broad_csv_json', broadRows.length - 1 === 1811 && broadRows.every(r => r.length === broadRows[0].length), {csv_records: broadRows.length - 1});
const broadNameCol = broadRows[0].indexOf('full_name');
check('broad_csv_identity', broadNameCol >= 0 && broadRows.slice(1).every(r => names.includes(r[broadNameCol].toLowerCase())), 'CSV names match JSON');
check('metadata_evidence_boundary', broad.repositories.every(e => e.metadata_only === true && e.runtime_tested === false), 'All broad records are metadata-only and unexecuted');
check('curated_counts', deep.entries.length === 37 && new Set(deepNames).size === 37 && deep.adjacent_entries.length === 6 && deep.unresolved_candidates.length === 1, {entries: deep.entries.length, adjacent: deep.adjacent_entries.length, unresolved: deep.unresolved_candidates.length});
check('curated_csv_json', deepRows.length - 1 === 37 && deepRows.every(r => r.length === deepRows[0].length), {csv_records: deepRows.length - 1});
check('curated_csv_identity', deepRows.slice(1).every((r, i) => r[0].toLowerCase() === deepNames[i]), 'CSV order and repo names match JSON');
const levels = {};
for (const e of deep.entries) levels[e.review_level] = (levels[e.review_level] ?? 0) + 1;
check('review_levels', levels.selected_source_review === 35 && levels.readme_review === 1 && levels.repository_index_only_source_unavailable === 1, levels);
check('curated_evidence_fields', deep.entries.every(e => e.checked_on === '2026-11-05' && e.runtime_verification === 'not_run' && e.license && e.sources.length && e.sources.every(s => {try {const u = new URL(s.url); return ['https:','http:'].includes(u.protocol);} catch {return false;}})), 'All cards have date, license description, source URLs and no-runtime status');
const sourceIssues = [];
for (const e of deep.entries) {
  if (e.head_sha && !/^[a-f0-9]{40}$/i.test(e.head_sha)) sourceIssues.push(e.repo + ': invalid head_sha');
  for (const s of e.sources) {
    const pinned = s.url.match(/\/blob\/([a-f0-9]{40})\//i);
    if (pinned && e.head_sha && pinned[1] !== e.head_sha) sourceIssues.push(e.repo + ': source SHA differs from head_sha');
  }
}
check('pinned_sha_consistency', sourceIssues.length === 0, sourceIssues);
check('coverage_counts', coverage.repository_count === 1811 && coverage.searches.filter(x => x.status === 'ok').length === 22, {successful_pages: coverage.searches.filter(x => x.status === 'ok').length});
const hashChecks = manifest.files.map(x => ({file: x.file, matches: sha(path.join(base, 'data', x.file)) === x.sha256, bytes_match: fs.statSync(path.join(base, 'data', x.file)).size === x.bytes}));
check('sealed_snapshot_hashes', hashChecks.every(x => x.matches && x.bytes_match), hashChecks);
const attachmentHash = sha(path.join(base, 'inputs/user-research-2026-11-05.txt'));
check('user_input_integrity', attachmentHash === 'e7b0b5cde98d4f68db1220516272aeef1b66950a744f37a845e8487c720a285f', attachmentHash);

const reportPath = path.join(base, 'data/knowledgebase-validation.json');
fs.writeFileSync(reportPath, '{}\n');
const mdFiles = [];
function walk(dir) {for (const item of fs.readdirSync(dir, {withFileTypes:true})) { if (['.git', '.artifacts', 'node_modules', 'evidence'].includes(item.name)) continue; const p = path.join(dir, item.name); if (item.isDirectory()) walk(p); else if (item.name.endsWith('.md')) mdFiles.push(p); }}
walk(root);
const linkIssues = [];
let localLinks = 0;
for (const file of mdFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const [, target] of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const local = decodeURIComponent(target.replace(/^<|>$/g, '').split('#')[0]);
    const resolved = path.resolve(path.dirname(file), local);
    localLinks++;
    if (!fs.existsSync(resolved)) linkIssues.push({file: path.relative(root, file), target});
  }
}
check('local_markdown_links', linkIssues.length === 0, {markdown_files: mdFiles.length, checked_local_links: localLinks, missing: linkIssues});
const outside = deep.entries.filter(e => !new Set(names).has(e.repo.toLowerCase())).map(e => e.repo);
check('snapshot_membership_flags', deep.entries.every(e => e.in_broad_snapshot === names.includes(e.repo.toLowerCase())), {curated_outside_broad: outside});
const report = {checked_at_utc: new Date().toISOString(), status: checks.every(c => c.result === 'pass') ? 'pass' : 'fail', scope: 'Local data, links, counts, hashes and evidence labels; not live Avito/runtime/valuation validation', checks, known_unavailable_candidate: '6oT9lpa/parser-avito: indexed only, live API/README404 per source review', network_link_checks: 'Key primary sources were read during research; this validator checks URL syntax and local link existence, not HTTP reachability of every external URL.'};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({status:report.status, checks:checks.map(({name,result})=>({name,result})), broad_count:names.length, curated_count:deep.entries.length, adjacent_count:deep.adjacent_entries.length, local_links:localLinks}));
if (report.status !== 'pass') {console.error(JSON.stringify(checks.filter(c => c.result === 'fail'))); process.exitCode = 1;}
