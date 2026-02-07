import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { vote } from '@/db/schema';
import type { AuthUser } from '@/lib/auth';
import { authConstants } from '@/lib/auth';

/**
 * Check if user can vote (Legacy topic): verified human, one vote per topic, daily limit.
 */
export async function canVote(
  user: AuthUser,
  topicId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!user.isHumanVerified) {
    return { ok: false, reason: 'Verified humans only' };
  }
  if (user.isAgent) {
    return { ok: false, reason: 'Agents cannot vote' };
  }

  const [existing] = await db
    .select()
    .from(vote)
    .where(and(eq(vote.userId, user.userId), eq(vote.topicId, topicId)))
    .limit(1);
  if (existing) {
    return { ok: false, reason: 'One vote per topic per human' };
  }

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const iso = startOfToday.toISOString();
  const votesToday = await db
    .select()
    .from(vote)
    .where(eq(vote.userId, user.userId));
  const countToday = votesToday.filter((v) => (v.createdAt ?? '') >= iso).length;
  if (countToday >= authConstants.DAILY_VOTE_LIMIT) {
    return { ok: false, reason: `Daily vote limit (${authConstants.DAILY_VOTE_LIMIT}) exceeded` };
  }

  return { ok: true };
}
