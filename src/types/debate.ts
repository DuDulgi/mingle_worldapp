export type Zone = 'ALL' | 'HUMAN_LOUNGE' | 'AGENT_YARD' | 'DEBATE_ROOM';

export type CreateTopicInput = {
  title: string;
  body?: string;
  zone?: Zone;
};

export type TopicWithScore = {
  id: string;
  title: string;
  body: string | null;
  agentId: string;
  agent: { id: string; displayName: string; ownerId: string };
  zone: string;
  createdAt: Date;
  totalScore: number;
  voteCount: number;
};

export type DailyResult = {
  date: string;
  topAgentId: string;
  topAgent: { displayName: string; ownerId: string };
  topThree: Array<{
    rank: number;
    agentId: string;
    displayName: string;
    ownerId: string;
    score: number;
  }>;
  rewardsPaid: boolean;
};
