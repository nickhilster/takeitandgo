import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'takeitandgo-regression-'));
const copy = (relative) => fs.copyFileSync(path.join(root, relative), path.join(temp, relative));
for (const relative of ['package.json', 'package-lock.json', 'data/discovery.json', 'data/discovery-candidates.json', 'data/picks.json', 'data/observed.json']) {
  fs.mkdirSync(path.dirname(path.join(temp, relative)), { recursive: true });
  copy(relative);
}
fs.mkdirSync(path.join(temp, 'scripts'));
for (const relative of ['data.mjs', 'discover.mjs', 'verify.mjs']) copy(`scripts/${relative}`);

const candidatesPath = path.join(temp, 'data/discovery-candidates.json');
const before = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
assert.ok(before.candidates.length > 0);
const retainedDate = before.candidates[0].discovered_at;

let searchCalls = 0;
const fakeFetch = `
globalThis.fetch = async (input) => {
 const u = new URL(input);
 const body = u.pathname === '/search/repositories'
   ? { items: [{ full_name: 'nextlevelbuilder/ui-ux-pro-max-skill', name: 'ui-ux-pro-max-skill', html_url: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill', stargazers_count: 999999, language: 'TypeScript', pushed_at: '2026-10-20T00:00:00Z', fork: false, archived: false, disabled: false, description: 'ignored', license: {spdx_id: 'MIT'} }] }
   : {};
 return new Response(JSON.stringify(body), {status: 200, headers: {'content-type':'application/json', etag: '"stable"'}});
};
`;
const child = spawnSync(process.execPath, ['--input-type=module', '-e', `${fakeFetch}\nprocess.chdir(${JSON.stringify(temp)}); await import(${JSON.stringify(pathToFileURL(path.join(temp, 'scripts/discover.mjs')).href)});`], { cwd: temp, encoding: 'utf8' });
assert.equal(child.status, 0, child.stderr);
const refreshed = JSON.parse(fs.readFileSync(candidatesPath, 'utf8')).candidates.find((candidate) => candidate.repo.endsWith('/nextlevelbuilder/ui-ux-pro-max-skill'));
assert.equal(refreshed.discovered_at, retainedDate, 'refresh must retain original discovery date');
assert.equal(refreshed.stars, 999999, 'existing candidate factual metadata must refresh');
assert.ok(!JSON.stringify(refreshed).includes('ignored'), 'upstream prose must not enter candidate records');

const observedPath = path.join(temp, 'data/observed.json');
const oldObserved = JSON.parse(fs.readFileSync(observedPath, 'utf8'));
globalThis.fetch = async () => new Response(JSON.stringify({message:'Not Found'}), {status:404, headers:{'content-type':'application/json'}});
// Exercise last-known-good preservation and failure recording in the same process with a temporary script.
const verifyImport = `
globalThis.fetch = async () => new Response(JSON.stringify({message:'Not Found'}), {status:404, headers:{'content-type':'application/json'}});
process.chdir(${JSON.stringify(temp)});
await import(${JSON.stringify(pathToFileURL(path.join(temp, 'scripts/verify.mjs')).href)});
`;
const verify = spawnSync(process.execPath, ['--input-type=module', '-e', verifyImport], { cwd: temp, encoding: 'utf8' });
assert.equal(verify.status, 0, verify.stderr);
const afterObserved = JSON.parse(fs.readFileSync(observedPath, 'utf8'));
assert.deepEqual(afterObserved.repositories, oldObserved.repositories, 'temporary API failures must preserve observations');
assert.equal(Object.keys(afterObserved.failures).length, Object.keys(oldObserved.repositories).length, 'failure records must be separate');
console.log('Data regressions passed: metadata refresh, discovery-date preservation, last-known-good integrity, separate failures.');

