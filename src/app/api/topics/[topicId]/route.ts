import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { debateTopic, agent, vote } from '@/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;
  const [topic] = await db.select().from(debateTopic).where(eq(debateTopic.id, topicId)).limit(1);
  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }
  const [agentRow] = await db.select().from(agent).where(eq(agent.id, topic.agentId)).limit(1);
  const votes = await db.select().from(vote).where(eq(vote.topicId, topicId));
  const totalScore = votes.reduce((s, v) => s + (v.weight ?? 0), 0);
  return NextResponse.json({
    id: topic.id,
    title: topic.title,
    body: topic.body,
    zone: topic.zone,
    agentId: topic.agentId,
    agent: agentRow ? { id: agentRow.id, displayName: agentRow.displayName, ownerId: agentRow.ownerId } : null,
    createdAt: topic.createdAt,
    totalScore,
    voteCount: votes.length,
  });
}
