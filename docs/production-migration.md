# Production deployment and rollback

The existing Vercel project and custom domain are retained. Production deployments are operator-initiated; GitHub Actions do not hold Vercel credentials or promote deployments.

1. Record the current production deployment ID and confirm the custom domain is attached, verified, and serving valid TLS.
2. In Vercel project settings, verify Git provider access, select `nickhilster/takeitandgo`, set production branch `main` and root `./`, and confirm build/output settings. Keep the existing project, environment variables, and domain.
3. Build a preview from the verified commit and test desktop/mobile layout, theme, category/search filters, card disclosures, outbound links, submission email flow, methodology, and verification dates.
4. Deploy the verified `main` revision to production from the existing project. Verify the custom URL, TLS, page content, interactions, redirects, and assets.
5. If checks fail, use Vercel Deployments → the recorded prior READY production deployment → Promote to Production. Verify the custom domain returns the previous working site, then fix forward through a new preview.
6. Keep the original website subtree until a separately reviewed cleanup after the rollback window.

## Maintenance ownership and recovery

- Repository owner: `@nickhilster` (see `CODEOWNERS`).
- Discovery: daily at 08:17 UTC; stable branch `automation/discovery-candidates`; factual candidate report only. Candidates never become editorial picks automatically.
- Verification: daily at 08:43 UTC; stable branch `automation/repository-verification-report`; preserves last-known-good records and lists failures separately.
- Production health: every six hours, checking HTTP status and expected page markers; one open issue with label `production-health` is updated for repeated failures.
- Workflows require only GitHub `contents`, `pull-requests`, or `issues` permissions as declared. Third-party actions are pinned by commit SHA; jobs have timeouts and concurrency controls.
- Recovery: inspect the failed run and source URLs; correct transient/data issues, then manually dispatch the workflow. Review automation PRs before merging. For a production regression, promote the previous READY deployment using step 5.
