# World App / World ID 트러블슈팅

## "해당 요청을 찾을 수 없습니다" 오류

**증상**: "World App이 다른 앱이나 웹사이트의 요청을 처리하기 위해 열렸지만, 해당 요청을 찾을 수 없습니다."

이 메시지는 **World App이 우리 앱의 검증 요청을 인식하지 못할 때** 나옵니다. 아래를 **순서대로** 진행하세요.

---

## 진행 순서 (체크리스트)

| 순서 | 할 일 | 완료 |
|------|--------|------|
| 1 | [Developer Portal](https://developer.worldcoin.org) 로그인 → 앱 선택 → **Actions**에 이름 `login` 추가 | ☐ |
| 2 | 같은 앱에서 **Allowed origins**에 `http://localhost:3000`(로컬) 또는 배포 URL 추가 | ☐ |
| 3 | `.env`의 `NEXT_PUBLIC_WORLD_APP_ID`가 포털 앱 ID와 같은지 확인 | ☐ |
| 4 | `.env` 수정했다면 개발 서버 재시작(`npm run dev`) 또는 배포 재배포 | ☐ |
| 5 | World App 완전 종료 후 다시 실행 → 웹에서 "World App으로 로그인" 재시도 | ☐ |

---

## 1. World ID Developer Portal에서 Action 등록

우리 앱은 **action 이름**으로 `login`(또는 `.env`의 `NEXT_PUBLIC_WORLD_ACTION`)을 사용합니다.

- [World ID Developer Portal](https://developer.worldcoin.org) 로그인
- 사용 중인 **앱** 선택 (App ID: `NEXT_PUBLIC_WORLD_APP_ID`와 동일한 앱)
- **Actions** (또는 "Verification actions") 메뉴로 이동
- **action 이름을 정확히 `login`으로 하나 추가**  
  - 다른 이름(예: `sign-in`)을 쓰면 안 됨. 코드의 `NEXT_PUBLIC_WORLD_ACTION`(기본값 `login`)과 **완전히 동일**해야 함.  
  - 포털에서 다른 이름을 쓴다면 `.env`에 `NEXT_PUBLIC_WORLD_ACTION=그이름`으로 맞춰 주세요.
- 저장 후, World App을 완전히 종료했다가 다시 열고 웹에서 "World App으로 로그인"을 다시 시도

---

## 2. App ID 확인

- `.env`의 `NEXT_PUBLIC_WORLD_APP_ID`가 Developer Portal에 보이는 **앱 ID**와 동일한지 확인
- 해당 앱이 **삭제/비활성화**되지 않았는지 확인
- 테스트용/프로덕션용 앱을 구분해 쓴다면, 지금 접속한 사이트(예: localhost vs 배포 URL)에 맞는 앱 ID를 쓰는지 확인

---

## 3. 도메인(출처) 허용

웹에서 IDKit을 띄울 때, **현재 접속한 도메인**이 해당 앱의 허용 목록에 있어야 합니다.

- Developer Portal → 해당 앱 → **Allowed origins** / **Domains** / **Web origins** 설정
- **로컬 개발**: `http://localhost:3000` 추가 (필요 시 `http://127.0.0.1:3000`도 추가)
- **배포 URL**: `https://<your-project>.vercel.app` 또는 사용 중인 실제 도메인 추가
- 저장 후 다시 시도


---

## 4. 환경 변수와 재시작

- `.env` 수정 후에는 **개발 서버를 재시작**해야 `NEXT_PUBLIC_*` 값이 반영됩니다.  
  `npm run dev` 중이었다면 Ctrl+C 후 다시 `npm run dev`.
- Vercel 등 배포 환경에서는 환경 변수 변경 후 **재배포**가 필요합니다.

---

## 5. 요약 체크리스트

| 확인 항목 | 내용 |
|----------|------|
| Action 이름 | Developer Portal에 **`login`**(또는 `NEXT_PUBLIC_WORLD_ACTION`과 동일한 값) 등록 |
| App ID | `NEXT_PUBLIC_WORLD_APP_ID`와 포털 앱 ID 일치, 앱 활성 상태 |
| 도메인 | localhost / 배포 URL이 앱의 Allowed origins에 포함 |
| 재시작 | `.env` 변경 후 dev 서버 재시작 또는 배포 환경 재배포 |

공식 문서: [World ID Docs](https://docs.world.org) → Developer Portal, Actions, Web integration 참고.

---

## "Verification Declined" / "We couldn't complete your request" 오류

이 메시지는 **World App 검증은 됐는데, 우리 서버(`/api/world/verify`)에서 처리에 실패했을 때** IDKit이 띄웁니다.

| 확인 | 할 일 |
|------|--------|
| **DB 스키마** | `user` 테이블에 `world_nullifier_hash` 컬럼이 있어야 합니다. **한 번만** 실행: `npm run db:push` |
| **서버 로그** | 터미널에서 `World verify error:` 또는 `World verify: cloud proof rejected` 로그 확인 (DB 오류, World API 거부 등) |
| **재시도** | 일시적인 오류일 수 있으니 World App 종료 후 다시 로그인 시도 |

**`max_verifications_reached` (이미 이 액션으로 검증함)**

- World ID는 **같은 사람이 같은 action으로 여러 번 검증하는 것**을 제한합니다.
- **이미 우리 DB에 있는 사용자**라면: 서버에서 `nullifier_hash`로 조회해 로그인 성공으로 처리합니다. 다시 "World App으로 로그인"하면 됩니다.
- **처음 로그인한 적이 없는데** 이 오류가 뜨면: 다른 앱/사이트에서 같은 App ID·action으로 이미 검증했거나, 이전에 우리 앱에서 로그인한 뒤 DB가 초기화된 경우일 수 있습니다. Developer Portal에서 앱별 검증 횟수 정책을 확인하세요.

---

**실제 오류 내용 확인 방법**

1. **서버 터미널** (`npm run dev` 실행 중인 창)  
   - `World verify: cloud proof rejected` → World 측 검증 거부. `code`, `detail` 확인.  
   - `World verify error:` → 우리 서버/DB 예외. 아래 스택 트레이스 확인.
2. **브라우저 개발자 도구** → **Network** 탭 → "World App으로 로그인" 시도 → `verify` 요청 클릭 → **Response** 탭에서 `error`, `code`, `detail` 확인.
