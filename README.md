# Take It and Go

An independent Astro site for [takeitandgo.teambotics.app](https://takeitandgo.teambotics.app), with a human-curated list of useful open-source projects. This repository is designed to become the standalone source for the existing Vercel project; the domain and Vercel project stay in place.

## Run locally

```bash
npm ci
npm run dev
```

Build and validate before opening a pull request:

```bash
npm run validate
npm run build
npm run smoke
```

## Editorial picks and automation

- `data/picks.json` is the editorial source of truth. Every project has a person-written description, rationale, audience, and quickstart.
- `data/discovery.json` defines the GitHub topic searches, thresholds, and license allowlist.
- `data/discovery-candidates.json` contains sourced research leads. Discovery never adds a project to `picks.json`; a person must review and approve every new pick.
- `data/observed.json` records material changes for curated repositories and separately lists current verification failures. Verification preserves prior records on API failures and writes a bounded report only when tracked data changes.
- GitHub Actions use public-repository standard runners. Discovery runs daily at 08:17 UTC, repository verification at 08:43 UTC, and production health every six hours. No paid LLM or external search service is used; workflows can be manually dispatched.
- Candidate discovery checks repository status, activity, stars, an allowlisted SPDX license, and README presence. It never checks out or executes candidate code.
- Candidate reports keep source links and factual metadata, not upstream repository description text. Asset and dependency licensing is documented in [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
- Discovery refreshes candidate facts each run and preserves each candidate's first `discovered_at` date. Its stable automation branch changes only the candidate report; editorial picks are never changed automatically.
- CI validates data, regression behavior, pinned workflow actions and permissions, dependency security audit, workflow syntax, production build, and built-page smoke checks. The health workflow checks HTTP availability and expected content, then updates one issue labelled `production-health` for repeated failures.
- Workflows use explicit minimum permissions, SHA-pinned actions, bounded timeouts, and concurrency groups. `CODEOWNERS` assigns review ownership to the repository owner. Inspect Actions logs and automation PR diffs before accepting updates; manually rerun after correcting a failure cause.
- GitHub metadata in the page is fetched at build time and can be absent if the GitHub API is unavailable. It is not browser-refreshed. The public page explains the curation and verification method and displays the last material verification date when available.

Repository submissions can be proposed as issues or pull requests. Submissions and candidate reports are not endorsements. Do not include secrets or private data in an issue.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the review rules. Keep editorial copy changes human-authored and explain the practical value of a pick with verifiable sources.

## Deployment boundary

The existing Vercel project `takeitandgo` and `takeitandgo.teambotics.app` domain are retained. Connect it to this repository with root directory `./`, verify a preview, and deploy production through the documented operator procedure. See [`docs/production-migration.md`](docs/production-migration.md). GitHub Actions never deploy to production.

## License

Original Take It and Go source and documentation are released under the [MIT License](LICENSE). Third-party assets and dependency packages retain their own terms; see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
