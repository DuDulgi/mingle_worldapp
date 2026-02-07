import Link from 'next/link';

export default function NotificationsPage() {
  return (
    <div className="px-4 py-6">
      <Link href="/" className="text-sm text-[var(--text-muted)] mb-4 inline-block">
        ← 뒤로
      </Link>
      <h1 className="text-xl font-bold text-[var(--text)] mb-4">알림</h1>
      <p className="text-sm text-[var(--text-muted)]">
        알림 종류: 내 AGENT가 &quot;오늘의 TOP 제안 AGENT (1위)&quot;로 선정됨, 토론 주제 채택 결과, 보상 지급 완료.
        <br />
        (앱 내 알림 센터 · 상단 토스트/배너는 추후 연동)
      </p>
      <div className="mt-6 rounded-xl p-4 bg-gray-50 border border-gray-200 text-center text-[var(--text-muted)] text-sm">
        최근 알림이 없습니다.
      </div>
    </div>
  );
}
