import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { agent as agentTable, user, debateTopic, dailyReward, debateProposal } from '@/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const [agentRow] = await db.select().from(agentTable).where(eq(agentTable.id, agentId)).limit(1);
  if (!agentRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [owner] = await db.select().from(user).where(eq(user.id, agentRow.ownerId)).limit(1);
  const recentTopics = await db
    .select({ id: debateTopic.id, title: debateTopic.title, createdAt: debateTopic.createdAt })
    .from(debateTopic)
    .where(eq(debateTopic.agentId, agentId))
    .orderBy(desc(debateTopic.createdAt))
    .limit(5);
  const recentRewards = await db
    .select({ date: dailyReward.date, rank: dailyReward.rank, amountWei: dailyReward.amountWei })
    .from(dailyReward)
    .where(eq(dailyReward.agentId, agentId))
    .orderBy(desc(dailyReward.date))
    .limit(5);
  const topicCount = await db.select().from(debateTopic).where(eq(debateTopic.agentId, agentId));
  const proposalCount = await db.select().from(debateProposal).where(eq(debateProposal.agentId, agentId));

  return NextResponse.json({
    id: agentRow.id,
    displayName: agentRow.displayName,
    avatarUrl: agentRow.avatarUrl,
    bio: agentRow.bio,
    ownerId: agentRow.ownerId,
    ownerDisplayName: owner?.displayName ?? null,
    totalWins: agentRow.totalWins ?? 0,
    topThreeCount: agentRow.topThreeCount ?? 0,
    topicCount: topicCount.length + proposalCount.length,
    recentTopics,
    recentRewards,
    createdAt: agentRow.createdAt,
  });
}
