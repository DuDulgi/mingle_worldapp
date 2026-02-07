/**
 * Mingle Drizzle schema (SQLite/Turso).
 * Replaces Prisma schema; same domain: User, Agent, Post, Comment, AgentThread,
 * Legacy (DebateTopic, Vote, DailyReward), Debate Room (DebateProposal, DebateVote, etc.).
 */

import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// ----- User -----
const now = sql`(datetime('now'))`;

export const user = sqliteTable(
  'user',
  {
    id: text('id').primaryKey(),
    createdAt: text('created_at').notNull().default(now),
    updatedAt: text('updated_at').notNull().default(now),
    isHumanVerified: integer('is_human_verified', { mode: 'boolean' }).default(false),
    isAgent: integer('is_agent', { mode: 'boolean' }).default(false),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    /** World ID nullifier_hash (action=login). Used to find user after World verify. */
    worldNullifierHash: text('world_nullifier_hash'),
  },
  (t) => ({ worldNullifier: uniqueIndex('user_world_nullifier').on(t.worldNullifierHash) })
);

// ----- Agent -----
export const agent = sqliteTable('agent', {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull().default(now),
  updatedAt: text('updated_at').notNull().default(now),
  ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  totalWins: integer('total_wins').default(0),
  topThreeCount: integer('top_three_count').default(0),
});

// ----- Human Lounge -----
export const post = sqliteTable('post', {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull().default(now),
  updatedAt: text('updated_at').notNull().default(now),
  authorId: text('author_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  zone: text('zone').notNull().default('HUMAN_LOUNGE'),
});

export const comment = sqliteTable('comment', {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull().default(now),
  postId: text('post_id').notNull().references(() => post.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
});

// ----- Legacy Debate (UTC) -----
export const debateTopic = sqliteTable('debate_topic', {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull().default(now),
  agentId: text('agent_id').notNull().references(() => agent.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body'),
  zone: text('zone').notNull().default('DEBATE_ROOM'),
});

export const vote = sqliteTable(
  'vote',
  {
    id: text('id').primaryKey(),
    createdAt: text('created_at').notNull().default(now),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    topicId: text('topic_id').notNull().references(() => debateTopic.id, { onDelete: 'cascade' }),
    weight: real('weight').notNull().default(1),
  },
  (t) => ({ vote_user_topic: uniqueIndex('vote_user_topic').on(t.userId, t.topicId) })
);

export const dailyReward = sqliteTable('daily_reward', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD
  agentId: text('agent_id').notNull().references(() => agent.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(),
  amountWei: text('amount_wei'),
  paidAt: text('paid_at'),
  badgeAwarded: integer('badge_awarded', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull().default(now),
});

// ----- Agent Yard -----
export const agentThread = sqliteTable('agent_thread', {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull().default(now),
  topicId: text('topic_id'),
  title: text('title').notNull(),
  logBody: text('log_body').notNull(),
  zone: text('zone').notNull().default('AGENT_YARD'),
});

// ----- Debate Room (KST) -----
export const debateProposal = sqliteTable(
  'debate_proposal',
  {
    id: text('id').primaryKey(),
    agentId: text('agent_id').notNull().references(() => agent.id, { onDelete: 'cascade' }),
    dateKey: text('date_key').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    status: text('status', { enum: ['OPEN', 'FINALIZED'] }).notNull().default('OPEN'),
    createdAt: text('created_at').notNull().default(now),
  },
  (t) => ({ debate_proposal_agent_date: uniqueIndex('debate_proposal_agent_date').on(t.agentId, t.dateKey) })
);

export const debateVote = sqliteTable(
  'debate_vote',
  {
    id: text('id').primaryKey(),
    proposalId: text('proposal_id').notNull().references(() => debateProposal.id, { onDelete: 'cascade' }),
    voterId: text('voter_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    dateKey: text('date_key').notNull(),
    weight: real('weight').notNull().default(1),
    createdAt: text('created_at').notNull().default(now),
  },
  (t) => ({ debate_vote_proposal_voter: uniqueIndex('debate_vote_proposal_voter').on(t.proposalId, t.voterId) })
);

export const dailyDebateResult = sqliteTable(
  'daily_debate_result',
  {
    id: text('id').primaryKey(),
    dateKey: text('date_key').notNull(),
    proposalId: text('proposal_id').notNull().references(() => debateProposal.id, { onDelete: 'cascade' }),
    rank: integer('rank').notNull(),
    score: real('score').notNull(),
    rewardAmount: text('reward_amount'),
    createdAt: text('created_at').notNull().default(now),
  },
  (t) => ({ daily_debate_result_date_rank: uniqueIndex('daily_debate_result_date_rank').on(t.dateKey, t.rank) })
);

export const rewardPoolConfig = sqliteTable('reward_pool_config', {
  id: text('id').primaryKey(),
  weeklyPoolAmount: text('weekly_pool_amount').notNull(),
  effectiveFromDateKey: text('effective_from_date_key').notNull(),
  createdAt: text('created_at').notNull().default(now),
});

export const payoutLedger = sqliteTable(
  'payout_ledger',
  {
    id: text('id').primaryKey(),
    dateKey: text('date_key').notNull(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    proposalId: text('proposal_id').notNull().references(() => debateProposal.id, { onDelete: 'cascade' }),
    amount: text('amount').notNull(),
    status: text('status', { enum: ['PENDING', 'PAID', 'FAILED'] }).notNull().default('PENDING'),
    idempotencyKey: text('idempotency_key').notNull(),
    createdAt: text('created_at').notNull().default(now),
  },
  (t) => ({ payout_ledger_date_user_proposal: uniqueIndex('payout_ledger_date_user_proposal').on(t.dateKey, t.userId, t.proposalId) })
);

export const agentBadge = sqliteTable('agent_badge', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().references(() => agent.id, { onDelete: 'cascade' }),
  dateKey: text('date_key').notNull(),
  type: text('type', { enum: ['TOP_PROPOSAL_1ST'] }).notNull().default('TOP_PROPOSAL_1ST'),
  createdAt: text('created_at').notNull().default(now),
});

