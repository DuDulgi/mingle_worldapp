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
| `TURSO_DATABASE_URL` | `libsql://...turso.io` 형태 URL | Production, Preview |
| `TURSO_AUTH_TOKEN` | Turso에서 발급한 토큰 | Production, Preview |
| `CRON_SECRET` | 위에서 정한 비밀 문자열 | Production (Cron 인증용) |
| `NEXT_PUBLIC_WORLD_APP_ID` | Developer Portal 앱 ID (예: `app_xxx`) | Production, Preview |
| `NEXT_PUBLIC_WORLD_ACTION` | 액션 이름 (예: `login`) | Production, Preview |

**선택(권장)**

| 변수 | 값 | 용도 |
|------|-----|------|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | 배포 후 실제 도메인. 서버 fetch base URL. |
| `WEEKLY_REWARD_POOL_WEI` | 예: `1000000000000000000` | 주간 보상 풀 (일일 1/7 지급). |

- 환경 변수 추가/수정 후 **Redeploy** 해야 반영됩니다.

### 3.3 배포 실패 시 확인 (Build Failed)

1. **Vercel 대시보드** → 해당 프로젝트 → **Deployments** → 실패한 배포 클릭 → **Building** 로그 끝부분의 **에러 메시지** 확인.
2. **자주 나오는 원인**
   - **환경 변수 누락**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` 없으면 DB 사용 코드에서 실패할 수 있음. (빌드 시점에는 사용하지 않지만 런타임에서 사용.)
   - **Node 버전**: Vercel은 기본 Node 18.x. 문제 시 프로젝트 **Settings → General → Node.js Version** 에서 20 선택 후 재배포.
   - **postinstall 실패**: `scripts/patch-idkit-dialog.cjs` 가 실패해도 빌드는 계속되도록 되어 있음. 다른 postinstall/스크립트가 있다면 확인.
3. **로컬에서 빌드 재현**: 터미널에서 `npm run build` 실행해 같은 에러가 나오는지 확인.

### 3.4 Cron 동작

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
- **"요청을 찾을 수 없습니다" 오류**가 나면 → [WORLD_APP_트러블슈팅.md](WORLD_APP_트러블슈팅.md)에서 **Action 등록**과 **도메인 허용**을 확인하세요.

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
