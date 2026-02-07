# 앞으로 할 일 정리

Mingle 프로젝트에서 **당신이 진행할 작업**을 우선순위·단계별로 정리한 문서입니다.  
상세 현황은 [PROJECT_STATUS.md](PROJECT_STATUS.md)를 참고하세요.

**docs 전체를 분석해 한 번에 보고 싶다면** → [TODO_통합.md](TODO_통합.md) 참고.

---

## 0. 진행 완료된 항목 (코드/문서 반영됨)

- [x] **Cron GET 지원** — Vercel Cron은 GET 호출. `/api/cron/debate-cutoff`에 GET 핸들러 추가됨.
- [x] **배포 가이드** — [DEPLOY_WORLDAPP.md](DEPLOY_WORLDAPP.md)에 Vercel 환경 변수, Cron, World App 연동 참고 작성.
- [x] **OPERATIONS.md** — DB 환경 변수를 Drizzle/Turso(`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) 기준으로 갱신.
- [x] **빌드 가능 상태** — `tsconfig` target ES2020(BigInt), Drizzle 스키마 uniqueIndex extraConfig 객체 형태로 수정. `npm run build` 통과.

---

## 1. 당장 해야 할 것

### 1.1 DB 연결 마무리

- [ ] **`.env` 파일 확인**
  - 프로젝트 루트에 `.env`가 있는지 확인.
  - 없으면: `cp .env.example .env`
  - **주의:** `.env.example`에는 실제 비밀값을 넣지 마세요. 토큰은 반드시 `.env`에만 넣고, `.env`는 Git에 커밋되지 않습니다.

- [ ] **Turso Auth Token 설정** (Turso Cloud 사용 시)
  - `.env`에 `TURSO_AUTH_TOKEN`을 Turso 대시보드 또는 `turso db tokens create mingleworldapp-dudulgi` 로 발급한 값으로 채우기.
  - `.env.example`에 토큰을 넣었다면 **즉시 제거**하고, 이미 커밋했다면 Turso에서 토큰 재발급(revoke 후 새로 생성) 권장.

- [ ] **스키마 반영**
  ```bash
  npm run db:push
  ```

- [ ] **시드 데이터** (개발용 초기 데이터가 필요할 때)
  ```bash
  npm run db:seed
  ```

- [ ] **연결 확인**
  - `npm run dev` 후 앱에서 API 호출이 정상인지 확인.
  - 필요 시 `npm run db:studio` 로 테이블/데이터 확인.

### 1.2 배포·운영 설정

- [ ] **Vercel(또는 호스팅) 환경 변수**
  - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` 설정.
  - Cron 사용 시 `CRON_SECRET` 설정.
  - 필요 시 `WEEKLY_REWARD_POOL_WEI`, `NEXT_PUBLIC_APP_URL` 등 설정.

- [ ] **CRON_SECRET**
  - `.env`의 `CRON_SECRET`을 빈 값이 아닌 안전한 비밀값으로 변경.
  - Vercel Cron이 호출하는 `/api/cron/daily-cutoff`, `/api/cron/debate-cutoff` 인증에 사용됨.

### 1.3 World App 배포

- [ ] **Vercel 배포 및 World App까지 열기**  
  → 전체 단계는 **[DEPLOY_WORLDAPP.md](DEPLOY_WORLDAPP.md)** 참고.
  - Vercel 프로젝트 연결, 환경 변수(`TURSO_*`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`) 설정 후 배포.
  - 배포 URL을 World App에서 링크/미니앱으로 열 수 있음. World ID 실검증은 단기 단계에서 연동.

---

## 2. 단기 (MVP 안정화)

- [ ] **Legacy 토론 정리**
  - Legacy(UTC) 토론과 Debate Room(KST)이 공존 중. Debate Room만 사용하도록 단계적 제거 또는 마이그레이션 후 API·Cron 정리.

- [ ] **인증 고도화**
  - 현재는 헤더 플레이스홀더(x-user-id 등). 프로덕션에서는 World ID / World Chain 연동으로 `isHumanVerified` 실검증.

- [ ] **배포 URL 정리**
  - 일부 페이지가 `NEXT_PUBLIC_APP_URL` 또는 localhost 하드코드. 배포 환경별로 설정 정리.

- [ ] **테스트·CI**
  - DB 의존 Vitest는 테스트 전용 DB 또는 mocking으로 CI 안정화.

---

## 3. 중기 (기능 확장)

- [ ] **알림**
  - 실시간/푸시 연동 (현재 플레이스홀더).

- [ ] **Human Lounge**
  - 신고/차단 실제 처리 로직.

- [ ] **PayoutLedger**
  - 실제 지급 연동(온체인·결제 등).

---

## 4. 참고 문서

| 문서 | 용도 |
|------|------|
| [DEPLOY_WORLDAPP.md](DEPLOY_WORLDAPP.md) | **World App 배포** — Vercel 배포, 환경 변수, Cron, World App 연동 |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | 전체 현황, 체크리스트, 기술 부채, 로드맵 |
| [DRIZZLE_TURSO.md](DRIZZLE_TURSO.md) | DB 연결 준비, 마이그레이션, 시드 |
| [OPERATIONS.md](OPERATIONS.md) | Cron 보안, 어뷰징, 장애·롤백 |
| [BUSINESS_RULES.md](BUSINESS_RULES.md) | 투표·컷오프·보상 규칙 |

---

*이 문서는 앞으로 할 일 체크리스트용입니다. 완료한 항목은 `[ ]`를 `[x]`로 바꿔가며 사용하면 됩니다.*
