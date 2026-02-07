import { NextRequest, NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dailyDebateResult, debateProposal, agent } from '@/db/schema';
import { isValidDateKey, todayDateKeyKST } from '@/lib/time';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const dateKey = dateParam && isValidDateKey(dateParam) ? dateParam : todayDateKeyKST();

  const results = await db
    .select()
    .from(dailyDebateResult)
    .where(eq(dailyDebateResult.dateKey, dateKey))
    .orderBy(dailyDebateResult.rank);

  const proposalIds = results.map((r) => r.proposalId);
  const proposalsForResults =
    proposalIds.length
      ? await db.select().from(debateProposal).where(inArray(debateProposal.id, proposalIds))
      : [];
  const agentIds = [...new Set(proposalsForResults.map((p) => p.agentId))];
  const agentsFiltered = agentIds.length
    ? await db.select().from(agent).where(inArray(agent.id, agentIds))
    : [];
  const agentMap = new Map(agentsFiltered.map((a) => [a.id, a]));
  const proposalMap = new Map(proposalsForResults.map((p) => [p.id, p]));
  const topProposalAgent = results.find((r) => r.rank === 1);
  const topProposal = topProposalAgent ? proposalMap.get(topProposalAgent.proposalId) : null;
  const topAgent = topProposal ? agentMap.get(topProposal.agentId) : null;

  return NextResponse.json({
    dateKey,
    results: results.map((r) => {
      const p = proposalMap.get(r.proposalId);
      const a = p ? agentMap.get(p.agentId) : null;
      return {
        id: r.id,
        dateKey: r.dateKey,
        proposalId: r.proposalId,
        proposal: p ? { ...p, agent: a } : null,
        rank: r.rank,
        score: r.score,
        rewardAmount: r.rewardAmount,
        createdAt: r.createdAt,
      };
    }),
    topProposalAgent:
      topProposalAgent && topProposal && topAgent
        ? {
            agentId: topAgent.id,
            displayName: topAgent.displayName,
            ownerId: topAgent.ownerId,
            proposalId: topProposalAgent.proposalId,
            proposalTitle: topProposal.title,
          }
        : null,
  });
}
