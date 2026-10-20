import assert from 'node:assert/strict';
import fs from 'node:fs';
import YAML from 'yaml';

const files = ['ci.yml', 'discovery.yml', 'verify.yml', 'health.yml', 'workflow-check.yml'];
for (const name of files) {
  const source = fs.readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8');
  const workflow = YAML.parse(source);
  assert.ok(workflow.jobs && Object.keys(workflow.jobs).length > 0, `${name} must define a job`);
  assert.match(source, /^permissions:/m, `${name} must declare explicit permissions`);
  for (const match of source.matchAll(/^\s+uses:\s+([^\s]+)$/gm)) {
    assert.match(match[1], /@[0-9a-f]{40}$/i, `${name} action must be pinned to a commit SHA: ${match[1]}`);
  }
  assert.match(source, /^\s+timeout-minutes:/m, `${name} jobs must have a timeout`);
  for (const job of Object.values(workflow.jobs)) {
    assert.ok(job.steps?.length, `${name} jobs must define steps`);
    assert.ok(job['timeout-minutes'] > 0, `${name} jobs must have a positive timeout`);
  }
}
console.log('Workflow YAML and security checks passed: valid syntax, explicit permissions, pinned actions, bounded jobs.');
