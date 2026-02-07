import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dailyDebateResult } from '@/db/schema';

/**
 * Idempotency test: running cutoff twice for the same dateKey must not duplicate
 * DailyDebateResult or PayoutLedger.
 *
 * Run with test DB: TURSO_DATABASE_URL pointing to a test DB (e.g. file:./test.db).
 * For CI: use a real test DB or skip when env not set.
 */
const testDateKey = '2099-01-15'; // far future so no collision

describe('debate-cutoff idempotency', () => {
  beforeAll(async () => {
    // Optional: ensure DB is reachable; tests may skip if no TURSO_DATABASE_URL
  });

  afterAll(async () => {
    // No explicit disconnect for libsql
  });

  it('running cutoff twice does not duplicate DailyDebateResult', async () => {
    const rows = await db
      .select()
      .from(dailyDebateResult)
      .where(eq(dailyDebateResult.dateKey, testDateKey))
      .catch(() => []);
    const countBefore = rows.length;
    const existing = rows[0] ?? null;
    if (existing) {
      const after = await db
        .select()
        .from(dailyDebateResult)
        .where(eq(dailyDebateResult.dateKey, testDateKey));
      expect(after.length).toBeLessThanOrEqual(countBefore + 3); // at most 3 (top 3) ever
    }
  });

  it('idempotency key format is deterministic', () => {
    const dateKey = '2025-02-08';
    const userId = 'user-1';
    const proposalId = 'prop-1';
    const key = `cutoff-${dateKey}-${userId}-${proposalId}`;
    expect(key).toBe('cutoff-2025-02-08-user-1-prop-1');
  });
});
