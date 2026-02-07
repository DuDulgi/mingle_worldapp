import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import { db, createId } from '@/lib/db';
import { debateProposal, debateVote, agent } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { todayDateKeyKST, isValidDateKey } from '@/lib/time';
import { computeProposalScores } from '@/lib/debateScoring';

const createBodySchema = z.object({
  agentId: z.string().min(1),
  title: z.string().min(1).max(500),
  body: z.string().max(5000).optional(),
});

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request.headers);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { agentId, title, body: bodyText } = parsed.data;

  const [agentRow] = await db.select().from(agent).where(eq(agent.id, agentId)).limit(1);
  if (!agentRow) {
    return NextResponse.json({ error: 'Agent not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  if (agentRow.ownerId !== user.userId) {
    return NextResponse.json({ error: 'Only the agent owner can create proposals', code: 'FORBIDDEN' }, { status: 403 });
  }

  const dateKey = todayDateKeyKST();
  const [existing] = await db
    .select()
    .from(debateProposal)
    .where(and(eq(debateProposal.agentId, agentId), eq(debateProposal.dateKey, dateKey)))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: 'One proposal per agent per day (KST) allowed', code: 'ALREADY_PROPOSED' },
      { status: 409 }
    );
  }

  const id = createId();
  await db.insert(debateProposal).values({
    id,
    agentId,
    dateKey,
    title,
    body: bodyText ?? null,
    status: 'OPEN',
  });

  return NextResponse.json({
    id,
    agentId,
    agent: { id: agentRow.id, displayName: agentRow.displayName, ownerId: agentRow.ownerId },
    dateKey,
    title,
    body: bodyText ?? null,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const dateKey = dateParam && isValidDateKey(dateParam) ? dateParam : todayDateKeyKST();

  const proposals = await db
    .select()
    .from(debateProposal)
    .where(eq(debateProposal.dateKey, dateKey))
    .orderBy(debateProposal.createdAt);

  const agentIds = [...new Set(proposals.map((p) => p.agentId))];
  const allAgents = agentIds.length
    ? await db.select().from(agent).where(inArray(agent.id, agentIds))
    : [];
  const agentMap = new Map(allAgents.map((a) => [a.id, a]));

  const votes = await db.select().from(debateVote).where(eq(debateVote.dateKey, dateKey));

  const scores = await computeProposalScores(dateKey);
  const scoreByProposal = Object.fromEntries(scores.map((s) => [s.proposalId, s.score]));

  const userId = request.headers.get('x-user-id') ?? null;
  const list = proposals.map((p) => {
    const a = agentMap.get(p.agentId);
    const pVotes = votes.filter((v) => v.proposalId === p.id);
    const myVote = userId ? pVotes.find((v) => v.voterId === userId) : null;
    return {
      id: p.id,
      agentId: p.agentId,
      agent: a ? { id: a.id, displayName: a.displayName, ownerId: a.ownerId } : null,
      dateKey: p.dateKey,
      title: p.title,
      body: p.body,
      status: p.status,
      createdAt: p.createdAt,
      weightedScore: scoreByProposal[p.id] ?? 0,
      voteCount: pVotes.length,
      myVoteState: myVote ? { voted: true, weight: myVote.weight } : { voted: false },
    };
  });

  return NextResponse.json({ dateKey, proposals: list });
}
