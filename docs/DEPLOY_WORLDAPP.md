# World App 배포 가이드

배포는 **World 로그인**으로 시작한 뒤, **Git → Vercel 배포 → World App 등록** 순서로 진행합니다.

**순서대로 실행할 때** → [DEPLOY_실행가이드.md](DEPLOY_실행가이드.md)에 CRON_SECRET 값·명령어·체크리스트가 정리되어 있습니다.

---

## 전체 순서

| 순서 | 단계 | 요약 |
|------|------|------|
| **0** | **World 로그인** | World App / World ID 개발자 계정으로 로그인. (시작 단계) |
| **1** | **Git에 올리기** | 코드를 GitHub/GitLab 등 원격 저장소에 push. |
| **2** | **Vercel 배포** | 해당 저장소를 Vercel에 연결하고, 환경 변수 설정 후 배포. |
| **3** | **World App 등록** | 배포된 URL을 World App에서 미니앱/링크로 등록. |

아래는 각 단계별 상세 체크리스트입니다.

---

## 0. 시작: World 로그인

- [ ] **World 로그인**
  - [World App](https://world.app) 또는 [World ID / 개발자 포털](https://docs.world.org)에서 사용할 계정으로 **로그인**합니다.
  - 미니앱 등록·앱 연동은 이 계정(또는 팀 계정)으로 진행하므로, **가장 먼저 로그인한 상태**를 만듭니다.
- 로그인 후 → 로컬 사전 준비 및 Git push 단계로 진행합니다.

---

## 1. 사전 준비 (로컬에서 완료할 것)

- [ ] **DB 연결**
  - `.env`에 `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` 설정 (Turso Cloud 사용 시).
  - `npm run db:push` 로 스키마 반영.
  - 필요 시 `npm run db:seed` 로 시드 데이터.

- [ ] **빌드 확인**
  ```bash
  npm run build
  ```
  에러 없이 완료되는지 확인.

- [ ] **CRON_SECRET 결정**
  - 강한 랜덤 문자열 생성 (예: `openssl rand -hex 32`).
  - 이 값은 Vercel 환경 변수와 수동 Cron 호출 시 동일하게 사용.

---

## 2. 1단계: Git에 올리기

- [ ] **원격 저장소 준비**
  - GitHub / GitLab / Bitbucket 등에 새 저장소 생성 (없다면).
- [ ] **로컬에서 push**
  ```bash
  git remote add origin <원격-저장소-URL>   # 이미 있으면 생략
  git add .
  git commit -m "Prepare for deploy"
  git push -u origin main
  ```
- 배포할 코드가 모두 **원격 저장소에 반영된 상태**에서 다음 단계(Vercel)로 진행합니다.

---

## 3. 2단계: Vercel 배포

### 3.1 프로젝트 연결

1. [Vercel](https://vercel.com) 로그인 후 **Add New → Project**.
2. **위 1단계에서 push한 저장소**를 선택해 **Import**.
3. Framework Preset: **Next.js** (자동 감지).
4. **Deploy** 로 첫 배포 진행.

### 3.2 환경 변수 설정 (필수)

Vercel 대시보드 → 프로젝트 → **Settings → Environment Variables**에서 아래를 추가합니다.

| 변수 | 값 | 환경 |
|------|-----|------|
| `TURSO_DATABASE_URL` | `libsql://mingleworldapp-dudulgi.aws-ap-northeast-1.turso.io` | Production, Preview (필요 시) |
| `TURSO_AUTH_TOKEN` | Turso에서 발급한 토큰 | Production, Preview |
| `CRON_SECRET` | 위에서 정한 비밀 문자열 | Production (Cron 인증용) |

**선택(권장)**

| 변수 | 값 | 용도 |
|------|-----|------|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | 배포 후 실제 도메인. 서버 fetch base URL. |
| `WEEKLY_REWARD_POOL_WEI` | 예: `1000000000000000000` | 주간 보상 풀 (일일 1/7 지급). |

- 환경 변수 추가/수정 후 **Redeploy** 해야 반영됩니다.

### 3.3 Cron 동작

- `vercel.json`에 이미 정의됨:
  - **daily-cutoff**: 매일 00:00 UTC → `/api/cron/daily-cutoff`
  - **debate-cutoff**: 매일 15:00 UTC (KST 00:00) → `/api/cron/debate-cutoff`
- Vercel Cron은 **GET**으로 호출하므로, 두 라우트 모두 GET을 지원합니다.
- `CRON_SECRET`이 설정되어 있어야 Cron 요청이 401 없이 처리됩니다.

---

## 4. 배포 후 확인 (Vercel 배포 직후)

- [ ] **앱 URL 접속**
  - `https://<your-project>.vercel.app` 에서 페이지·API 정상 동작 확인.

- [ ] **NEXT_PUBLIC_APP_URL 반영**
  - Vercel에 `NEXT_PUBLIC_APP_URL=https://<your-project>.vercel.app` 설정 후 재배포.
  - 앱 내 서버 fetch(전체 글, 라운지, 토론 등)가 같은 도메인으로 요청하도록 됨.

- [ ] **Cron 수동 테스트** (선택)
  ```bash
  curl -H "Authorization: Bearer YOUR_CRON_SECRET" "https://<your-project>.vercel.app/api/cron/debate-cutoff"
  ```
  - 401이 아니고 JSON이 오면 정상.

---

## 5. 3단계: World App 등록

Vercel 배포가 끝나고 **배포 URL이 정상 동작하는 상태**에서 진행합니다.

- [ ] **World App 개발자/파트너 채널 확인**
  - [World App / World ID 문서](https://docs.world.org)에서 미니앱·앱 등록 절차 확인.
- [ ] **배포 URL 등록**
  - Vercel에서 얻은 `https://<your-project>.vercel.app` (또는 커스텀 도메인)을 World App 쪽에 등록.
  - 미니앱으로 열기, 딥링크, 공유 링크 등 원하는 방식에 맞춰 등록.
- **인증**: 현재 Mingle은 헤더 플레이스홀더(x-user-id 등) 사용. 실제 `isHumanVerified` 검증은 [World ID](https://docs.world.org/world-id) / [MiniKit](https://docs.world.org/mini-apps) 연동 시 단계적으로 적용 (참고: [PROJECT_STATUS.md](PROJECT_STATUS.md) Phase 1).

---

## 6. 요약 체크리스트

| 순서 | 단계 | 할 일 |
|------|------|--------|
| **0** | **World 로그인** | World App / 개발자 포털에서 로그인 (시작) |
| 0 후 | 로컬 | `.env` DB·CRON_SECRET, `db:push`, `npm run build` |
| **1** | **Git** | 원격 저장소에 push (배포할 코드 반영) |
| **2** | **Vercel** | 저장소 연결 → 환경 변수 설정 → 배포 |
| 2 후 | 확인 | URL 접속·API 확인, NEXT_PUBLIC_APP_URL 재배포 반영, Cron 테스트(선택) |
| **3** | **World App** | 배포 URL을 World App에 등록 (미니앱/링크 등) |

이 문서는 [NEXT_STEPS.md](NEXT_STEPS.md)의 “당장 해야 할 것”과 함께 사용하면 됩니다.
