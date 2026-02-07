# Sign in with World ID + NextAuth (참고용)

**현재 앱은 "World App으로 로그인" (IDKit 위젯) 방식만 사용합니다.** 아래는 [world-id-nextauth-template](https://github.com/worldcoin/world-id-nextauth-template) 기준 참고용입니다.

## 두 가지 로그인 방식

| 방식 | 설명 | 필요한 설정 |
|------|------|-------------|
| **IDKit (위젯)** | 앱 내에서 World App 열기 → proof 검증 | App ID, Action, Allowed origins |
| **NextAuth (Redirect)** | id.worldcoin.org로 리다이렉트 → 콜백 | Client ID, Client Secret, **Redirect URI** |

이 문서는 **NextAuth(Redirect)** 방식 설정입니다.

---

## 1. Developer Portal 설정

1. [World ID Developer Portal](https://developer.worldcoin.org) 로그인 후 앱 선택.
2. **Redirect URIs** (또는 Callback URLs)에 아래를 **정확히** 추가:
   - 로컬: `http://localhost:3000/api/auth/callback/worldcoin`
   - 배포: `https://<your-domain>/api/auth/callback/worldcoin`
3. **Client ID** = 앱의 App ID (`app_...`).
4. **Client Secret**은 포털에서 발급(표시/복사). `.env`에만 넣고 Git에 올리지 마세요.

참고: [Sign In Reference](https://docs.world.org/world-id/reference/sign-in) — Redirect URI는 포털에 등록된 값과 일치해야 합니다.

---

## 2. 환경 변수 (.env)

템플릿과 동일하게 다음을 설정합니다.

```env
NEXTAUTH_URL=http://localhost:3000
# 생성: openssl rand -base64 32
NEXTAUTH_SECRET=여기에_랜덤_문자열

# 포털에서 확인 (Client ID = App ID, Client Secret 발급)
WLD_CLIENT_ID=app_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WLD_CLIENT_SECRET=포털에서_발급한_시크릿
```

- **로컬**: `NEXTAUTH_URL=http://localhost:3000`
- **배포**: `NEXTAUTH_URL=https://<your-domain>`
- `WLD_CLIENT_ID`를 비워두면 `NEXT_PUBLIC_WORLD_APP_ID`를 사용합니다.

---

## 3. 앱에서 사용

- **로그인 버튼**: "Sign in with World ID (Redirect)"를 누르면 `id.worldcoin.org`로 이동 후, 로그인 완료 시 위에서 등록한 **Redirect URI**로 돌아옵니다.
- **세션**: NextAuth 세션(JWT)으로 로그인 상태가 유지됩니다. `getServerSession(authWorldConfig)` 또는 클라이언트 `useSession()`으로 확인할 수 있습니다.

---

## 4. 요약 체크리스트

| 순서 | 할 일 |
|------|--------|
| 1 | Developer Portal → 앱 → **Redirect URIs**에 `http://localhost:3000/api/auth/callback/worldcoin` 추가 |
| 2 | 같은 앱에서 **Client Secret** 발급 |
| 3 | `.env`에 `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `WLD_CLIENT_ID`, `WLD_CLIENT_SECRET` 설정 |
| 4 | 개발 서버 재시작 후 "Sign in with World ID (Redirect)" 클릭 |

---

**참고**: Sign in with World ID v1(OIDC)는 2026년 1월 31일 종료 예정입니다. 장기적으로는 IDKit + proof 검증 방식을 우선 고려하세요. ([Deprecation](https://docs.world.org/world-id/sign-in/deprecation))
