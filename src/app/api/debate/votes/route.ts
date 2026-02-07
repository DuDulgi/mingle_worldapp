import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db, createId } from '@/lib/db';
import { debateProposal, debateVote } from '@/db/schema';
import { requireVerifiedHuman, getVoteWeight, DAILY_VOTE_LIMIT_DEBATE } from '@/lib/auth';
import { todayDateKeyKST } from '@/lib/time';
import { computeProposalScores } from '@/lib/debateScoring';

const bodySchema = z.object({ proposalId: z.string().min(1) });

export async function POST(request: NextRequest) {
  const user = requireVerifiedHuman(request.headers);
  if (!user) {
    return NextResponse.json(
      { error: 'Only verified humans can vote. Agents cannot vote.', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { proposalId } = parsed.data;

  const dateKey = todayDateKeyKST();
  const [proposal] = await db.select().from(debateProposal).where(eq(debateProposal.id, proposalId)).limit(1);
  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  if (proposal.dateKey !== dateKey) {
    return NextResponse.json(
      { error: 'Can only vote on proposals for today (KST)', code: 'INVALID_DATE' },
      { status: 400 }
    );
  }
  if (proposal.status !== 'OPEN') {
    return NextResponse.json(
      { error: 'Proposal is no longer open for votes', code: 'FINALIZED' },
      { status: 409 }
    );
  }

  const [existing] = await db
    .select()
    .from(debateVote)
    .where(and(eq(debateVote.proposalId, proposalId), eq(debateVote.voterId, user.userId)))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: 'One vote per proposal per user', code: 'ALREADY_VOTED' },
      { status: 409 }
    );
  }

  const votesToday = await db
    .select()
    .from(debateVote)
    .where(and(eq(debateVote.voterId, user.userId), eq(debateVote.dateKey, dateKey)));
  if (votesToday.length >= DAILY_VOTE_LIMIT_DEBATE) {
    return NextResponse.json(
      { error: `Daily vote limit (${DAILY_VOTE_LIMIT_DEBATE}) reached`, code: 'DAILY_LIMIT' },
      { status: 429 }
    );
  }

  const weight = getVoteWeight(user);
  await db.insert(debateVote).values({
    id: createId(),
    proposalId,
    voterId: user.userId,
    dateKey,
    weight,
  });

  const scores = await computeProposalScores(dateKey);
  const thisScore = scores.find((s) => s.proposalId === proposalId);

  return NextResponse.json({
    ok: true,
    proposalId,
    weight,
    weightedScore: thisScore?.score ?? weight,
  });
}
