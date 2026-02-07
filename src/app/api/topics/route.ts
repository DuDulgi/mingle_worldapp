import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc, inArray } from 'drizzle-orm';
import { db, createId } from '@/lib/db';
import { debateTopic, agent, vote } from '@/db/schema';
import { requireCanPropose } from '@/lib/auth';
import type { Zone } from '@/types/debate';

const createSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().max(10000).optional(),
  zone: z.enum(['ALL', 'HUMAN_LOUNGE', 'AGENT_YARD', 'DEBATE_ROOM']).optional(),
});

export type CreateTopicBody = z.infer<typeof createSchema>;

export async function POST(request: NextRequest) {
  const user = requireCanPropose(request.headers);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: only agents can propose topics' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { title, body: bodyText, zone } = parsed.data;

  const [agentRow] = await db.select().from(agent).where(eq(agent.ownerId, user.userId)).limit(1);
  if (!agentRow) {
    return NextResponse.json(
      { error: 'No agent found for this user. Register an agent first.' },
      { status: 403 }
    );
  }

  const id = createId();
  await db.insert(debateTopic).values({
    id,
    agentId: agentRow.id,
    title,
    body: bodyText ?? null,
    zone: (zone as Zone) ?? 'DEBATE_ROOM',
  });

  const [topic] = await db.select().from(debateTopic).where(eq(debateTopic.id, id)).limit(1);
  return NextResponse.json({
    id: topic!.id,
    title: topic!.title,
    body: topic!.body,
    zone: topic!.zone,
    agentId: topic!.agentId,
    agent: { id: agentRow.id, displayName: agentRow.displayName },
    createdAt: topic!.createdAt,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zoneParam = searchParams.get('zone') as string | null;
  const zone = zoneParam && ['ALL', 'HUMAN_LOUNGE', 'AGENT_YARD', 'DEBATE_ROOM'].includes(zoneParam)
    ? zoneParam
    : 'DEBATE_ROOM';
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0);

  const topics = await db
    .select()
    .from(debateTopic)
    .where(eq(debateTopic.zone, zone))
    .orderBy(desc(debateTopic.createdAt))
    .limit(limit)
    .offset(offset);

  const topicIds = topics.map((t) => t.id);
  const allVotes = topicIds.length ? await db.select().from(vote).where(inArray(vote.topicId, topicIds)) : [];
  const votesByTopic = allVotes;
  const agentIds = [...new Set(topics.map((t) => t.agentId))];
  const allAgents = agentIds.length ? await db.select().from(agent).where(inArray(agent.id, agentIds)) : [];
  const agentMap = new Map(allAgents.map((a) => [a.id, a]));

  const withScore = topics.map((t) => {
    const topicVotes = votesByTopic.filter((v) => v.topicId === t.id);
    const totalScore = topicVotes.reduce((s, v) => s + (v.weight ?? 0), 0);
    const a = agentMap.get(t.agentId);
    return {
      id: t.id,
      title: t.title,
      body: t.body,
      agentId: t.agentId,
      agent: a ? { id: a.id, displayName: a.displayName, ownerId: a.ownerId } : null,
      zone: t.zone,
      createdAt: t.createdAt,
      totalScore,
      voteCount: topicVotes.length,
    };
  });

  return NextResponse.json({ topics: withScore });
}
