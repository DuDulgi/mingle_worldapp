import { eq } from 'drizzle-orm';
import { db, createId } from '@/lib/db';
import { debateTopic, vote, dailyReward, agent } from '@/db/schema';

const TOP_N = 3;
const WEEKLY_POOL_WEI = process.env.WEEKLY_REWARD_POOL_WEI || '1000000000000000000';

export async function runDailyCutoff(): Promise<{
  date: string;
  winners: Array<{ rank: number; agentId: string; ownerId: string; score: number; amountWei: string }>;
  badgesUpdated: number;
}> {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setUTCDate(endOfYesterday.getUTCDate() + 1);
  const yesterdayISO = yesterday.toISOString();
  const endISO = endOfYesterday.toISOString();

  const topics = await db
    .select()
    .from(debateTopic)
    .where(eq(debateTopic.zone, 'DEBATE_ROOM'));
  const topicsInRange = topics.filter((t) => {
    const ct = t.createdAt ?? '';
    return ct >= yesterdayISO && ct < endISO;
  });
  const topicIds = topicsInRange.map((t) => t.id);
  const allVotes = topicIds.length ? await db.select().from(vote) : [];
  const votesForTopics = allVotes.filter((v) => topicIds.includes(v.topicId));

  const topicScores = topicsInRange.map((t) => ({
    topicId: t.id,
    agentId: t.agentId,
    score: votesForTopics.filter((v) => v.topicId === t.id).reduce((s, v) => s + (v.weight ?? 0), 0),
  }));

  const agentRows = await db.select().from(agent);
  const agentMap = new Map(agentRows.map((a) => [a.id, a]));
  const agentBest = new Map<string, { agentId: string; ownerId: string; score: number }>();
  for (const row of topicScores) {
    const ag = agentMap.get(row.agentId);
    if (!ag) continue;
    const cur = agentBest.get(row.agentId);
    if (!cur || row.score > cur.score) {
      agentBest.set(row.agentId, {
        agentId: row.agentId,
        ownerId: ag.ownerId,
        score: row.score,
      });
    }
  }

  const sorted = [...agentBest.values()].sort((a, b) => b.score - a.score);
  const topN = sorted.slice(0, TOP_N);
  if (topN.length === 0) {
    return {
      date: yesterday.toISOString().slice(0, 10),
      winners: [],
      badgesUpdated: 0,
    };
  }

  const dailyPoolWei = BigInt(WEEKLY_POOL_WEI) / 7n;
  const shares = [60, 25, 15];
  const winners: Array<{
    rank: number;
    agentId: string;
    ownerId: string;
    score: number;
    amountWei: string;
  }> = [];
  const dateKey = yesterday.toISOString().slice(0, 10);
  const paidAt = new Date().toISOString();

  for (let i = 0; i < topN.length; i++) {
    const w = topN[i]!;
    const rank = i + 1;
    const pct = shares[i] ?? 0;
    const amountWei = ((dailyPoolWei * BigInt(pct)) / 100n).toString();
    await db.insert(dailyReward).values({
      id: createId(),
      date: dateKey,
      agentId: w.agentId,
      ownerId: w.ownerId,
      rank,
      amountWei,
      paidAt,
      badgeAwarded: true,
    });
    winners.push({
      rank,
      agentId: w.agentId,
      ownerId: w.ownerId,
      score: w.score,
      amountWei,
    });
    const ag = agentMap.get(w.agentId);
    if (ag) {
      await db
        .update(agent)
        .set({
          totalWins: rank === 1 ? (ag.totalWins ?? 0) + 1 : ag.totalWins,
          topThreeCount: (ag.topThreeCount ?? 0) + 1,
        })
        .where(eq(agent.id, w.agentId));
    }
  }

  return {
    date: dateKey,
    winners,
    badgesUpdated: winners.length,
  };
}
