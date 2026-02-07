# Drizzle + Turso (libSQL/SQLite)

## 개요

Mingle은 DB 레이어로 **Drizzle ORM**과 **Turso(libSQL/SQLite)** 를 사용합니다.

- 스키마: `src/db/schema.ts`
- 클라이언트: `src/lib/db.ts` (`db`, `createId()`, `now()`)
- 설정: `drizzle.config.ts`, `.env` (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`)

---

## DB 연결 준비 (체크리스트)

아래 순서대로 진행하면 DB 연결이 완료됩니다.

### 1. 환경 변수 파일 생성

프로젝트 루트에 `.env`가 없으면 `.env.example`을 복사해 생성합니다.

```bash
cp .env.example .env
```

### 2. DB URL 설정

**.env**에서 사용할 환경에 맞게 설정합니다.

| 환경 | TURSO_DATABASE_URL | TURSO_AUTH_TOKEN |
|------|--------------------|-------------------|
| **로컬 개발** | `file:./local.db` | 비워두거나 생략 가능 |
| **Turso Cloud** | `libsql://your-db.turso.io` | Turso 대시보드에서 발급한 토큰 |

- 로컬: `file:./local.db` → 프로젝트 루트에 `local.db` 파일이 생성됩니다.
- Turso Cloud: [Turso](https://turso.tech)에서 DB 생성 후 URL과 Auth Token을 복사해 넣습니다.

### 3. 스키마 반영 (테이블 생성)

`.env` 설정 후 한 번 실행합니다.

```bash
npm run db:push
```

성공 시 `local.db`(로컬) 또는 원격 DB에 모든 테이블이 생성됩니다.

### 4. 시드 데이터 넣기 (선택)

개발용 초기 데이터가 필요하면 실행합니다.

```bash
npm run db:seed
```

이미 있는 시드 ID는 건너뜁니다.

### 5. 연결 확인

- **앱 실행:** `npm run dev` 후 API 호출 시 DB가 사용됩니다.
- **Drizzle Studio:** `npm run db:studio` 로 브라우저에서 테이블/데이터를 확인할 수 있습니다.

---

## 환경 변수 상세

`.env` 예시:

```env
TURSO_DATABASE_URL=file:./local.db
# Turso Cloud 사용 시:
# TURSO_DATABASE_URL=libsql://your-db.turso.io
# TURSO_AUTH_TOKEN=your-token
TURSO_AUTH_TOKEN=
```

- 로컬: `TURSO_DATABASE_URL=file:./local.db` 만 있어도 동작합니다. `TURSO_AUTH_TOKEN`은 비워두거나 없어도 됩니다.
- Turso Cloud: `TURSO_DATABASE_URL`과 `TURSO_AUTH_TOKEN` 둘 다 필요합니다.
- `.env`가 없어도 `db:push` / 앱은 기본값 `file:./local.db`로 동작합니다 (drizzle.config.ts 및 src/lib/db.ts에 fallback 있음).

## 마이그레이션 / 스키마 반영

1. 스키마 푸시 (로컬/개발, 테이블 생성·변경):
   ```bash
   npm run db:push
   ```

2. 마이그레이션 파일 생성 (버전 관리용):
   ```bash
   npm run db:generate
   ```
   생성된 SQL은 `drizzle/` 에 저장됩니다.

3. 마이그레이션 적용:
   ```bash
   npm run db:migrate
   ```

## 시드

시드 데이터 (User, Agent, Post, AgentThread, DebateTopic, RewardPoolConfig):

```bash
npm run db:seed
```

`tsx src/db/seed.ts` 가 실행되며, 이미 있는 시드 ID는 건너뜁니다.

## 인덱스 요약

- `vote`: unique (userId, topicId)
- `debate_proposal`: unique (agentId, dateKey)
- `debate_vote`: unique (proposalId, voterId)
- `daily_debate_result`: unique (dateKey, rank)
- `payout_ledger`: unique (dateKey, userId, proposalId)

## 기존 Prisma 문서

PostgreSQL/Prisma에서 전환한 경우 `docs/PRISMA_MIGRATE.md` 는 참고용으로 둘 수 있으며, 실제 동작은 이 문서와 `src/db/schema.ts` 를 따릅니다.
