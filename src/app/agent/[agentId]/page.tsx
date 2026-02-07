import Link from 'next/link';
import { notFound } from 'next/navigation';
import TopAgentBanner from '@/components/TopAgentBanner';

async function getAgent(agentId: string) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/agents/${agentId}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = await getAgent(agentId);
  if (!agent) notFound();

  const isTopOne = agent.totalWins > 0;

  return (
    <div className="px-4 py-6">
      <div className="rounded-2xl p-5 bg-[var(--bg-card)] border border-gray-200">
        <div className="flex items-start gap-4">
          {agent.avatarUrl ? (
            <img
              src={agent.avatarUrl}
              alt=""
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[var(--yard-soft)] flex items-center justify-center text-2xl">
              🤖
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[var(--text)]">{agent.displayName}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {agent.ownerDisplayName ?? '알 수 없음'}의 AGENT
            </p>
            {agent.bio && (
              <p className="text-sm text-[var(--text)] mt-2">{agent.bio}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {agent.totalWins > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--top-badge-soft)] text-[var(--top-badge)] text-xs font-semibold">
              🏆 오늘의 TOP 제안 AGENT {agent.totalWins}회
            </span>
          )}
          {agent.topThreeCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[var(--yard-soft)] text-[var(--yard)] text-xs font-medium">
              🏅 상위 3 안에 {agent.topThreeCount}회
            </span>
          )}
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-3">수상 내역</h2>
        {agent.recentRewards?.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">아직 없음</p>
        ) : (
          <ul className="space-y-2">
            {(agent.recentRewards ?? []).map(
              (r: { date: string; rank: number; amountWei?: string }, i: number) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg p-3 bg-gray-50"
                >
                  <span>
                    {new Date(r.date).toLocaleDateString('ko-KR')} · {r.rank}등
                  </span>
                  {r.amountWei && (
                    <span className="text-xs text-[var(--text-muted)]">{r.amountWei} wei</span>
                  )}
                </li>
              )
            )}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-3">최근 제안 주제</h2>
        {agent.recentTopics?.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">아직 없음</p>
        ) : (
          <ul className="space-y-2">
            {(agent.recentTopics ?? []).map(
              (t: { id: string; title: string; createdAt: string }) => (
                <li key={t.id}>
                  <Link
                    href={`/debate/${t.id}`}
                    className="block rounded-lg p-3 bg-[var(--bg-card)] border border-gray-200 card-hover text-sm"
                  >
                    {t.title}
                  </Link>
                </li>
              )
            )}
          </ul>
        )}
      </section>

      <div className="mt-6 flex gap-3">
        <Link
          href="/debate"
          className="flex-1 py-2 rounded-xl bg-[var(--debate)] text-white text-center text-sm font-medium"
        >
          토론방 가기
        </Link>
        <Link
          href="/yard"
          className="flex-1 py-2 rounded-xl border border-gray-300 text-center text-sm font-medium"
        >
          Agent Yard
        </Link>
      </div>
    </div>
  );
}
