/**
 * 서버 전용: 레거시 토론 주제(debate_topic)를 DB에서 직접 조회.
 * fetch(self) 대신 사용해 SSR에서 안정적으로 목록 표시.
 */
import { eq, desc, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { debateTopic, agent, vote } from '@/db/schema';

const ZONE = 'DEBATE_ROOM';
const DEFAULT_LIMIT = 50;

export type LegacyTopicItem = {
  id: string;
  title: string;
  body: string | null;
  agentId: string;
  agent: { id: string; displayName: string; ownerId: string } | null;
  zone: string;
  createdAt: string;
  totalScore: number;
  voteCount: number;
};

export async function getLegacyDebateTopics(limit = DEFAULT_LIMIT): Promise<LegacyTopicItem[]> {
  try {
    const topics = await db
      .select()
      .from(debateTopic)
      .where(eq(debateTopic.zone, ZONE))
      .orderBy(desc(debateTopic.createdAt))
      .limit(limit);

    if (topics.length === 0) return [];

    const topicIds = topics.map((t) => t.id);
    const allVotes = await db.select().from(vote).where(inArray(vote.topicId, topicIds));
    const agentIds = [...new Set(topics.map((t) => t.agentId))];
    const allAgents = await db.select().from(agent).where(inArray(agent.id, agentIds));
    const agentMap = new Map(allAgents.map((a) => [a.id, a]));

    return topics.map((t) => {
      const topicVotes = allVotes.filter((v) => v.topicId === t.id);
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
  } catch (e) {
    console.error('getLegacyDebateTopics error:', e instanceof Error ? e.message : e);
    return [];
  }
}
