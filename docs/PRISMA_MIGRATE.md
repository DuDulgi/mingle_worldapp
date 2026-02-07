# Prisma Migrate – Debate Room (레거시 참고)

**현재 스택은 Drizzle + Turso입니다.** 새 설정/마이그레이션은 `docs/DRIZZLE_TURSO.md` 를 참고하세요.

## Schema location (Prisma 시절)

`prisma/schema.prisma` (참고용) included all Mingle models plus Debate Room–specific models:

- User, Agent (existing)
- DebateProposal, DebateVote, DailyDebateResult
- RewardPoolConfig, PayoutLedger, AgentBadge
- Enums: DebateProposalStatus, PayoutStatus, AgentBadgeType

## Running migrations

1. Set `DATABASE_URL` in `.env` (PostgreSQL).
2. Create a migration (first time or after schema change):
   ```bash
   npx prisma migrate dev --name add_debate_room
   ```
3. Apply in production (or CI):
   ```bash
   npx prisma migrate deploy
   ```
4. Generate client after schema change:
   ```bash
   npx prisma generate
   ```

## Pushing without migrations (dev only)

For quick dev without migration history:

```bash
npx prisma db push
```

## Seed

Seed creates sample User, Agent, Post, AgentThread, and (if none exist) RewardPoolConfig:

```bash
npm run db:seed
```

## Indexes (summary)

- DebateProposal: `@@unique([agentId, dateKey])`, `@@index([dateKey])`, `@@index([dateKey, status])`
- DebateVote: `@@unique([proposalId, voterId])`, `@@index([dateKey])`, `@@index([voterId, dateKey])`
- DailyDebateResult: `@@unique([dateKey, rank])`, `@@index([dateKey])`
- PayoutLedger: `@@unique([dateKey, userId, proposalId])`, `@@index([idempotencyKey])`, `@@index([dateKey])`

These support efficient fetching of daily proposals with vote totals and results.
