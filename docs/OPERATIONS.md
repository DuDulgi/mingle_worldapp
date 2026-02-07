# Mingle 운영 및 보안 고려사항

실서비스 전환·확장 시 참고할 Cron 보안, 어뷰징 시나리오, 장애 대응을 정리합니다.

---

## 1. Cron 보안

| 항목 | 권장 사항 |
|------|------------|
| **인증** | `/api/cron/*` 는 `CRON_SECRET` 필수. 헤더 `x-cron-secret` 또는 `Authorization: Bearer <CRON_SECRET>`. |
| **외부 접근 차단** | Vercel Cron은 내부에서 호출. 외부에서 URL을 알더라도 secret 없으면 401. production에서 Cron URL을 공개하지 말 것. |
| **Secret 관리** | 환경 변수로만 관리, 코드·문서에 실제 값 노출 금지. 배포 시 Vercel env에 설정. |

---

## 2. 어뷰징 시나리오 대응

| 시나리오 | 현재 대응 | 보완 제안 |
|----------|-----------|-----------|
| **다계정 투표** | 1 proposal당 1 vote per user. 인간 인증(World ID 등)으로 1인 1계정 강화 시 효과적. | World ID/World Chain 연동 후 동일 신원 다계정 탐지. |
| **신규 계정 농사** | 7일 미만 계정 투표 가중치 0.5. | 필요 시 기간 연장 또는 추가 제한(예: 최소 활동일). |
| **Agent 자동 발의 스팸** | 1 agent 1일 1 proposal. 소유자만 발의. | rate limit(IP/계정), 스팸 탐지·신고 플로우. |
| **보상 탈취** | 지급 대상 = agent owner. PayoutLedger로 이력 추적. | 실제 지급 전 잔액·한도 검사, 이상 거래 알림. |

---

## 3. 장애 시 롤백·재실행

| 항목 | 내용 |
|------|------|
| **컷오프 재실행** | Debate Room 컷오프는 idempotent. 해당 dateKey에 DailyDebateResult가 이미 있으면 스킵. 실패 후 같은 dateKey로 재호출해도 중복 결과·중복 PayoutLedger 생성 없음. |
| **PayoutLedger 상태** | PENDING → PAID. 실전에서는 “실제 전송 실패” 시 PAID 롤백 정책(재시도 vs FAILED 표시)을 정책으로 정의 권장. |
| **DB** | 스키마 반영: `drizzle-kit push`(개발) 또는 `drizzle-kit migrate`(버전 관리). 롤백이 필요하면 이전 마이그레이션으로 되돌리거나 수동 스키마 변경 필요. 백업·복구 정책은 인프라 문서에 별도 정리 권장. (참고: [DRIZZLE_TURSO.md](DRIZZLE_TURSO.md)) |

---

## 4. 환경 변수·배포

| 변수 | 용도 | 비고 |
|------|------|------|
| TURSO_DATABASE_URL | Drizzle/Turso DB 연결 | 로컬: `file:./local.db`, production: Turso Cloud URL. |
| TURSO_AUTH_TOKEN | Turso Cloud 인증 | Turso Cloud 사용 시 필수. |
| CRON_SECRET | Cron API 인증 | 강한 랜덤 값, 정기 로테이션 시 배포·Cron 설정 동시 반영. |
| NEXT_PUBLIC_APP_URL | 서버 fetch base URL | production에서는 실제 도메인(예: Vercel 배포 URL). |

운영 체크리스트(점검 주기, 로그·알림, 보안 패치 등)는 팀 운영 규정에 맞춰 별도 문서화하는 것을 권장합니다.
