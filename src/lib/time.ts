/**
 * KST (Asia/Seoul) dateKey helpers for Debate Room.
 * dateKey = "YYYY-MM-DD" in Korea Standard Time.
 * Used for: proposal date, vote date, daily cutoff, results, payout.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Get current dateKey (YYYY-MM-DD) in KST.
 */
export function todayDateKeyKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse "YYYY-MM-DD" to Date at start of that day in KST (then as UTC for storage).
 * Use for querying by dateKey.
 */
export function dateKeyToStartOfDayKST(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return new Date(NaN);
  // Start of day in KST: 00:00 KST = previous day 15:00 UTC (when dateKey is D)
  const utc = Date.UTC(y, m - 1, d) - KST_OFFSET_MS;
  return new Date(utc);
}

/**
 * End of day KST for dateKey (23:59:59.999 KST).
 */
export function dateKeyToEndOfDayKST(dateKey: string): Date {
  const start = dateKeyToStartOfDayKST(dateKey);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Validate dateKey format YYYY-MM-DD.
 */
export function isValidDateKey(dateKey: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && !isNaN(dateKeyToStartOfDayKST(dateKey).getTime());
}

/**
 * Next dateKey (for "tomorrow" in KST).
 */
export function nextDateKey(dateKey: string): string {
  const start = dateKeyToStartOfDayKST(dateKey).getTime();
  const nextStart = start + 24 * 60 * 60 * 1000;
  const kst = new Date(nextStart + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Yesterday's dateKey in KST. Use for cron: when job runs at 00:00 KST (15:00 UTC), finalize this day.
 */
export function yesterdayDateKeyKST(): string {
  const today = todayDateKeyKST();
  const start = dateKeyToStartOfDayKST(today).getTime();
  const yesterdayStart = start - 24 * 60 * 60 * 1000;
  const kst = new Date(yesterdayStart + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
