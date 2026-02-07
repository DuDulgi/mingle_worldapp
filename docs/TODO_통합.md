# 해야 할 일 통합 정리

**docs 폴더 문서 전부를 분석**한 뒤, 산발적으로 적힌 TODO·남은 일·기술 부채를 **우선순위별로 한 문서에 정리**한 것입니다.  
각 항목 옆에 출처 문서를 표기했습니다.

---

## 진행 완료 (자동 실행된 항목)

- [x] **§4 문서·기술 부채** — ARCHITECTURE.md(PostgreSQL/Prisma → Drizzle+Turso), OPERATIONS.md(prisma migrate → drizzle-kit), PROJECT_STATUS.md(1.2 DB (Prisma) → Drizzle+Turso) 반영 완료.
- [x] **§1 중 실행 가능 항목** — `npm run db:push`(스키마 반영), `npm run db:seed`(시드 데이터), `npm run build`(빌드 확인) 실행 완료. (World 로그인, .env/토큰 설정, Git push, Vercel 배포, World App 등록은 사용자 직접 진행.)

---

## 분석한 문서 목록

| 문서 | 용도 |
|------|------|
| PROJECT_STATUS.md | 현황, 구현 체크리스트, 남은 TODO, 기술 부채, 로드맵 |
| NEXT_STEPS.md | 당장·단기·중기 할 일 체크리스트 |
| DEPLOY_WORLDAPP.md | World 로그인 → Git → Vercel → World App 등록 순서 |
| DRIZZLE_TURSO.md | DB 연결, 마이그레이션, 시드 |
| OPERATIONS.md | Cron 보안, 어뷰징, 장애·롤백, 환경 변수 |
| BUSINESS_RULES.md | 투표·제안·컷오프·보상 규칙 (참고) |
| ARCHITECTURE.md | 시스템 구조, Cron UTC/KST (참고) |
| DOMAIN_MODEL.md | Legacy vs Debate Room (참고) |
| API_DEBATE.md, DEBATE_ROOM_PROTOCOL.md, DAILY_REWARD_POLICY.md | API·프로토콜·보상 정책 (참고) |
| AGENT_PLAYBOOK.md, AGENT_PERSONA_TEMPLATES.md | 에이전트 규칙·페르소나 (참고) |
| PRISMA_MIGRATE.md | 레거시 참고, 실제는 DRIZZLE_TURSO |

---

## 1. 당장 해야 할 것 (배포까지)

배포·운영을 위해 **지금 단계에서 처리할 일**입니다.  
상세 절차는 [DEPLOY_WORLDAPP.md](DEPLOY_WORLDAPP.md), [NEXT_STEPS.md](NEXT_STEPS.md)를 따르면 됩니다.

| # | 할 일 | 출처 |
|---|--------|------|
| 1 | **World 로그인** — World App / World ID 개발자 포털에서 로그인 (시작 단계) | DEPLOY_WORLDAPP |
| 2 | **.env 확인** — 없으면 `cp .env.example .env`, 비밀값은 .env에만 두기 | NEXT_STEPS, DRIZZLE_TURSO |
| 3 | **Turso Auth Token** — Turso Cloud 사용 시 .env에 `TURSO_AUTH_TOKEN` 설정 | NEXT_STEPS, DRIZZLE_TURSO |
| 4 | **스키마 반영** — `npm run db:push` 로 테이블 생성 | NEXT_STEPS, DRIZZLE_TURSO, DEPLOY_WORLDAPP |
| 5 | **시드 데이터** (선택) — `npm run db:seed` | NEXT_STEPS, DRIZZLE_TURSO |
| 6 | **빌드 확인** — `npm run build` 에러 없이 완료 | DEPLOY_WORLDAPP |
| 7 | **CRON_SECRET 결정** — 강한 랜덤 값 생성, .env와 Vercel env에 동일하게 설정 | NEXT_STEPS, OPERATIONS, DEPLOY_WORLDAPP |
| 8 | **Git에 올리기** — 원격 저장소에 push (배포할 코드 반영) | DEPLOY_WORLDAPP |
| 9 | **Vercel 배포** — 저장소 연결, 환경 변수(`TURSO_*`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL` 등) 설정 후 배포 | DEPLOY_WORLDAPP, NEXT_STEPS |
| 10 | **배포 후 확인** — URL 접속·API 동작 확인, `NEXT_PUBLIC_APP_URL` 설정 후 재배포, Cron 수동 테스트(선택) | DEPLOY_WORLDAPP |
| 11 | **World App 등록** — 배포 URL을 World App에서 미니앱/링크로 등록 | DEPLOY_WORLDAPP, NEXT_STEPS |

---

## 2. 단기 (MVP 안정화)

배포 후 **서비스 안정화·신뢰도**를 위한 작업입니다.  
[PROJECT_STATUS.md](PROJECT_STATUS.md) Phase 1, [NEXT_STEPS.md](NEXT_STEPS.md) 단기와 대응합니다.

| # | 할 일 | 출처 |
|---|--------|------|
| 1 | **Legacy 토론 정리** — Legacy(UTC)와 Debate Room(KST) 공존. Debate Room만 사용하도록 단계적 제거 또는 마이그레이션 후 API·Cron 정리 | PROJECT_STATUS, NEXT_STEPS, DOMAIN_MODEL |
| 2 | **인증 고도화** — 헤더 플레이스홀더 → World ID / World Chain 연동으로 `isHumanVerified` 실검증 | PROJECT_STATUS, NEXT_STEPS, OPERATIONS |
| 3 | **배포 URL 정리** — `NEXT_PUBLIC_APP_URL`·localhost 하드코드 제거, 배포 환경별 설정 정리 | PROJECT_STATUS, NEXT_STEPS |
| 4 | **테스트·CI** — DB 의존 Vitest를 테스트 전용 DB 또는 mocking으로 CI 안정화 | PROJECT_STATUS, NEXT_STEPS |
| 5 | **어뷰징 보완** (선택) — World ID 연동 후 다계정 탐지, 신규 계정 기간 연장, rate limit·스팸 신고 플로우 | OPERATIONS |

---

## 3. 중기 (기능 확장)

[PROJECT_STATUS.md](PROJECT_STATUS.md) Phase 2·3, [NEXT_STEPS.md](NEXT_STEPS.md) 중기와 대응합니다.

| # | 할 일 | 출처 |
|---|--------|------|
| 1 | **알림** — 실시간/푸시 연동 (현재 플레이스홀더) | PROJECT_STATUS, NEXT_STEPS |
| 2 | **Human Lounge 신고/차단** — 실제 처리 로직 구현 | PROJECT_STATUS, NEXT_STEPS |
| 3 | **PayoutLedger 실제 지급** — 온체인·결제 등 외부 시스템 연동, 전송 실패 시 PAID 롤백 정책 정의 | PROJECT_STATUS, NEXT_STEPS, OPERATIONS |

---

## 4. 문서·기술 부채 정리

문서 정합성과 유지보수를 위한 수정입니다.

| # | 할 일 | 출처 |
|---|--------|------|
| 1 | **ARCHITECTURE.md** — "PostgreSQL (Prisma)" → Drizzle + Turso(libSQL) 반영 | ARCHITECTURE |
| 2 | **OPERATIONS.md** — "마이그레이션은 prisma migrate deploy" → Drizzle 기준(drizzle-kit push/migrate)으로 수정 | OPERATIONS |
| 3 | **PROJECT_STATUS.md** — "1.2 DB (Prisma)" → "DB (Drizzle + Turso)" 등 Prisma 언급 갱신 | PROJECT_STATUS |

---

## 5. 요약 (우선순위 순)

1. **당장** — World 로그인 → .env·DB·CRON_SECRET → Git → Vercel 배포 → World App 등록 (DEPLOY_WORLDAPP 순서대로).
2. **단기** — Legacy 토론 정리, World ID 인증, 배포 URL 정리, 테스트·CI.
3. **중기** — 알림, Human Lounge 신고/차단, PayoutLedger 실제 지급.
4. **문서** — ARCHITECTURE·OPERATIONS·PROJECT_STATUS의 Prisma/DB 표현을 Drizzle/Turso 기준으로 정리.

진행 시 [NEXT_STEPS.md](NEXT_STEPS.md)의 체크박스를 함께 활용하면 됩니다.
