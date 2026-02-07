# DEPLOY_WORLDAPP 실행 가이드 (순서대로 진행)

[DEPLOY_WORLDAPP.md](DEPLOY_WORLDAPP.md) 순서대로 **지금 할 수 있는 것**을 정리한 문서입니다.  
아래 순서대로 진행하세요.

---

## §0. World 로그인 (직접 진행)

1. 브라우저에서 [World App](https://world.app) 또는 [World ID / 개발자 포털](https://docs.world.org) 접속.
2. 사용할 계정으로 **로그인**.
3. 미니앱 등록은 이 계정으로 하므로, 먼저 로그인한 상태를 유지.

---

## §1. 사전 준비 (로컬)

### 1.1 DB 연결 — 이미 완료됨

- `.env`에 `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` 설정되어 있음 (이미 연결 확인됨).
- `npm run db:push` — 실행 완료.
- `npm run db:seed` — 실행 완료.

### 1.2 빌드 확인 — 이미 완료됨

- `npm run build` — 통과됨.

### 1.3 CRON_SECRET 설정 (직접 진행)

1. 터미널에서 **한 번만** 실행해 비밀값 생성:
   ```bash
   openssl rand -hex 32
   ```
2. 나온 문자열을 복사해 **`.env`**에 다음처럼 추가:
   ```
   CRON_SECRET=여기에_생성된_64자_문자열_붙여넣기
   ```
3. **Vercel 배포 시**에도 **같은 값**을 **Settings → Environment Variables**에 `CRON_SECRET`으로 추가.
4. 이 값은 코드·문서에 올리지 말고, `.env`와 Vercel에만 두세요.

---

## §2. Git에 올리기 (직접 진행)

현재 프로젝트에 Git 저장소가 없을 수 있습니다. 아래를 **순서대로** 실행하세요.

### 2.1 저장소가 없는 경우

```bash
cd /Users/imhyeongjun/Downloads/WORLDAPP
git init
git branch -m main
git add .
git commit -m "Prepare for deploy"
```

### 2.2 원격 저장소 연결 및 push

1. GitHub / GitLab / Bitbucket에서 **새 저장소** 생성 (빈 저장소, README 없이).
2. 아래 실행 (`<원격-저장소-URL>`을 실제 URL로 바꿈).

```bash
git remote add origin <원격-저장소-URL>
git push -u origin main
```

- 이미 `git init`과 `commit`이 되어 있다면 `git remote add origin ...` 과 `git push -u origin main` 만 하면 됩니다.

---

## §3. Vercel 배포 (직접 진행)

1. [Vercel](https://vercel.com) 로그인 → **Add New → Project**.
2. **§2에서 push한 저장소**를 선택해 **Import**.
3. Framework: **Next.js** (자동 감지) → **Deploy** 로 첫 배포.
4. 배포 후 **Settings → Environment Variables**에서 아래 추가.

| 변수 | 값 |
|------|-----|
| `TURSO_DATABASE_URL` | `libsql://mingleworldapp-dudulgi.aws-ap-northeast-1.turso.io` |
| `TURSO_AUTH_TOKEN` | (Turso에서 발급한 토큰 — .env와 동일한 값) |
| `CRON_SECRET` | §1.3에서 생성해 .env에 넣은 값과 **동일한 값** |

5. 환경 변수 저장 후 **Redeploy** 한 번 실행.

---

## §4. 배포 후 확인 (직접 진행)

1. `https://<your-project>.vercel.app` 접속해 페이지·API 동작 확인.
2. Vercel에 **NEXT_PUBLIC_APP_URL** = `https://<your-project>.vercel.app` 추가 후 **재배포**.
3. (선택) Cron 테스트:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" "https://<your-project>.vercel.app/api/cron/debate-cutoff"
   ```
   - `YOUR_CRON_SECRET`을 §1.3에서 정한 값으로 바꿈. 401이 아니고 JSON이 오면 정상.

---

## §5. World App 등록 (직접 진행)

1. [World App / World ID 문서](https://docs.world.org)에서 미니앱·앱 등록 절차 확인.
2. 배포 URL `https://<your-project>.vercel.app` 를 World App 쪽에 등록 (미니앱/링크 등).

---

## 요약 체크리스트

| 순서 | 내용 | 상태 |
|------|------|------|
| §0 | World 로그인 | [ ] 직접 진행 |
| §1 | DB·빌드 (완료) / CRON_SECRET을 .env에 추가 | [ ] CRON_SECRET만 추가 |
| §2 | git init → commit → remote add → push | [ ] 직접 진행 |
| §3 | Vercel Import → 환경 변수 → Redeploy | [ ] 직접 진행 |
| §4 | URL 확인, NEXT_PUBLIC_APP_URL, Cron 테스트 | [ ] 직접 진행 |
| §5 | World App에 배포 URL 등록 | [ ] 직접 진행 |

이 가이드는 [DEPLOY_WORLDAPP.md](DEPLOY_WORLDAPP.md)와 함께 사용하세요.
