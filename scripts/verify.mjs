import { github, picks, readJson, repoSlug, writeJsonIfChanged } from './data.mjs';

const observed = readJson('data/observed.json');
let changed = 0;
let failuresChanged = 0;
const previousFailures = observed.failures ?? {};
const failures = {};
for (const pick of picks) {
  const slug = repoSlug(pick.repo);
  try {
    const repo = await github(`/repos/${slug}`);
    const latestRelease = repo.pushed_at;
    const next = {
      name: repo.full_name,
      source: `https://api.github.com/repos/${repo.full_name}`,
      html_url: repo.html_url,
      archived: repo.archived,
      disabled: repo.disabled,
      stars: repo.stargazers_count,
      open_issues: repo.open_issues_count,
      pushed_at: latestRelease,
      license: repo.license?.spdx_id ?? null,
      default_branch: repo.default_branch,
      last_verified: new Date().toISOString(),
    };
    const previous = observed.repositories[slug.toLowerCase()];
    const comparable = ({ last_verified, ...value }) => value;
    if (!previous || JSON.stringify(comparable(previous)) !== JSON.stringify(comparable(next))) {
      observed.repositories[slug.toLowerCase()] = next;
      changed++;
    }
    if (previousFailures[slug.toLowerCase()]) failuresChanged++;
  } catch (error) {
    // Keep the prior record so transient API failures never remove provenance or editorial entries.
    const failureKey = slug.toLowerCase();
    const message = error.message;
    failures[failureKey] = previousFailures[failureKey]?.reason === message
      ? previousFailures[failureKey]
      : { source: `https://api.github.com/repos/${slug}`, first_failed_at: new Date().toISOString(), reason: message };
    if (JSON.stringify(previousFailures[slug.toLowerCase()] ?? null) !== JSON.stringify(failures[slug.toLowerCase()])) failuresChanged++;
    console.warn(`Could not verify ${slug}; keeping the prior observation: ${error.message}`);
  }
}
observed.schema_version = 1;
observed.failures = failures;
const updated = writeJsonIfChanged('data/observed.json', observed);
console.log(`${changed} material repository change(s); ${Object.keys(failures).length} current verification failure(s); ${failuresChanged} failure-state change(s); file ${updated ? 'updated' : 'unchanged'}.`);
