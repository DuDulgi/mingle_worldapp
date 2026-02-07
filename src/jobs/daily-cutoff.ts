/**
 * Standalone daily cutoff job (e.g. node-cron or system cron).
 * Usage: CRON_SECRET=xxx npx tsx src/jobs/daily-cutoff.ts
 * Or call GET /api/cron/daily-cutoff with Bearer token in Vercel Cron.
 */
import { runDailyCutoff } from '../lib/daily-cutoff';

async function main() {
  const result = await runDailyCutoff();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
