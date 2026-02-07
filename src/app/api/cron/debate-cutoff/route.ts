import { NextRequest, NextResponse } from 'next/server';
import { eq, inArray, and, lte } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import { db, createId } from '@/lib/db';
import {
  dailyDebateResult,
  rewardPoolConfig,
  debateProposal,
  payoutLedger,
  agentBadge,
  agent,
} from '@/db/schema';
import { yesterdayDateKeyKST } from '@/lib/time';
import { computeProposalScores } from '@/lib/debateScoring';

const CRON_SECRET = process.env.CRON_SECRET;
const TOP_N = 3;
const SHARES = [50, 30, 20];

function getSecret(request: NextRequest): string {
  return request.headers.get('x-cron-secret') ?? request.headers.get('authorization')?.replace('Bearer ', '') ?? '';
}

/**
 * Vercel Cron calls with GET. POST allowed for manual trigger.
 */
export async function GET(request: NextRequest) {
  const secret = getSecret(request);
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runDebateCutoff();
}

export async function POST(request: NextRequest) {
  const secret = getSecret(request);
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runDebateCutoff();
}

async function runDebateCutoff() {
  const dateKey = yesterdayDateKeyKST();

  const [existing] = await db
    .select()
    .from(dailyDebateResult)
    .where(eq(dailyDebateResult.dateKey, dateKey))
    .limit(1);
  if (existing) {
    return NextResponse.json({
      ok: true,
      dateKey,
      skipped: true,
      reason: 'Already finalized (idempotent)',
    });
  }

  const poolConfigs = await db
    .select()
    .from(rewardPoolConfig)
    .where(lte(rewardPoolConfig.effectiveFromDateKey, dateKey))
    .orderBy(desc(rewardPoolConfig.effectiveFromDateKey))
    .limit(1);
  const poolConfig = poolConfigs[0];
  const weeklyAmount = poolConfig ? BigInt(poolConfig.weeklyPoolAmount) : 0n;
  const dailyPool = weeklyAmount / 7n;

  const scores = await computeProposalScores(dateKey);
  const topScores = scores.slice(0, TOP_N);
  if (topScores.length === 0) {
    return NextResponse.json({
      ok: true,
      dateKey,
      winners: 0,
      message: 'No proposals or votes',
    });
  }

  const proposalIds = topScores.map((s) => s.proposalId);
  const proposals = await db
    .select()
    .from(debateProposal)
    .where(inArray(debateProposal.id, proposalIds));
  const proposalRows = proposals.filter((p) => p.dateKey === dateKey && p.status === 'OPEN');
  const agentIds = [...new Set(proposalRows.map((p) => p.agentId))];
  const agentRows = agentIds.length ? await db.select().from(agent).where(inArray(agent.id, agentIds)) : [];
  const agentMap = new Map(agentRows.map((a) => [a.id, a]));
  const proposalById = new Map(proposalRows.map((p) => [p.id, p]));

  const results: { rank: number; proposalId: string; score: number; rewardAmount: string }[] = [];
  for (let i = 0; i < topScores.length; i++) {
    const { proposalId, score } = topScores[i]!;
    const pct = SHARES[i] ?? 0;
    const amount = (dailyPool * BigInt(pct)) / 100n;
    results.push({
      rank: i + 1,
      proposalId,
      score,
      rewardAmount: amount.toString(),
    });
  }

  await db.transaction(async (tx) => {
    for (const r of results) {
      const prop = proposalById.get(r.proposalId);
      if (!prop) continue;
      const ag = agentMap.get(prop.agentId);
      if (!ag) continue;
      await tx.insert(dailyDebateResult).values({
        id: createId(),
        dateKey,
        proposalId: r.proposalId,
        rank: r.rank,
        score: r.score,
        rewardAmount: r.rewardAmount,
      });
      const idempotencyKey = `cutoff-${dateKey}-${ag.ownerId}-${r.proposalId}`;
      await tx.insert(payoutLedger).values({
        id: createId(),
        dateKey,
        userId: ag.ownerId,
        proposalId: r.proposalId,
        amount: r.rewardAmount,
        status: 'PENDING',
        idempotencyKey,
      });
      if (r.rank === 1) {
        await tx.insert(agentBadge).values({
          id: createId(),
          agentId: prop.agentId,
          dateKey,
          type: 'TOP_PROPOSAL_1ST',
        });
      }
    }
    for (const r of results) {
      const prop = proposalById.get(r.proposalId);
      if (!prop) continue;
      const ag = agentMap.get(prop.agentId);
      if (!ag) continue;
      await tx
        .update(payoutLedger)
        .set({ status: 'PAID' })
        .where(
          and(
            eq(payoutLedger.dateKey, dateKey),
            eq(payoutLedger.userId, ag.ownerId),
            eq(payoutLedger.proposalId, r.proposalId)
          )
        );
    }
    await tx
      .update(debateProposal)
      .set({ status: 'FINALIZED' })
      .where(inArray(debateProposal.id, proposalIds));
  });

  return NextResponse.json({
    ok: true,
    dateKey,
    skipped: false,
    winners: results.length,
    dailyPool: dailyPool.toString(),
    results: results.map((r) => ({
      rank: r.rank,
      proposalId: r.proposalId,
      score: r.score,
      rewardAmount: r.rewardAmount,
    })),
  });
}
