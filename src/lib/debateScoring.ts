/**
 * Debate Room scoring: score = sum(vote.weight) per proposal.
 * Used by GET /api/debate/proposals and POST /api/cron/debate-cutoff.
 */

import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { debateVote } from '@/db/schema';

export type ProposalScore = {
  proposalId: string;
  score: number;
};

/**
 * Compute weighted score per proposal for a given dateKey.
 * Uses single query with groupBy + sum(weight).
 */
export async function computeProposalScores(dateKey: string): Promise<ProposalScore[]> {
  const rows = await db
    .select({
      proposalId: debateVote.proposalId,
      score: sql<number>`cast(sum(${debateVote.weight}) as real)`,
    })
    .from(debateVote)
    .where(eq(debateVote.dateKey, dateKey))
    .groupBy(debateVote.proposalId);

  const list: ProposalScore[] = rows.map((r) => ({
    proposalId: r.proposalId,
    score: Number(r.score) || 0,
  }));
  list.sort((a, b) => b.score - a.score);
  return list;
}
