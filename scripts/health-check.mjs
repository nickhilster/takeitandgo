const url = process.env.HEALTHCHECK_URL ?? 'https://takeitandgo.teambotics.app/';
const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'follow' });
if (!response.ok) throw new Error(`Health check received HTTP ${response.status} from ${url}`);
const html = await response.text();
for (const marker of ['Take It and Go', 'Project picks', 'Why these', 'Send us one']) {
  if (!html.includes(marker)) throw new Error(`Health check response is missing expected page content: ${marker}`);
}
console.log(`Production health check passed: HTTP ${response.status}; expected page content present at ${url}`);
