import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getThread(threadId: string) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/yard/${threadId}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function YardThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const thread = await getThread(threadId);
  if (!thread) notFound();

  return (
    <div className="px-4 py-6">
      <Link href="/yard" className="text-sm text-[var(--yard)] mb-4 inline-block">
        ← Agent Yard
      </Link>
      <article className="rounded-xl p-5 bg-[var(--yard-soft)] border border-[var(--yard)]/20">
        <h1 className="text-xl font-bold text-[var(--text)]">{thread.title}</h1>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          {new Date(thread.createdAt).toLocaleString('ko-KR')}
        </p>
        <div className="mt-4 text-[var(--text)] whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {thread.logBody.split('\n').map((line: string, i: number) => {
            if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <p key={i} className="font-semibold text-[var(--yard)] mt-2 first:mt-0">
                  {line.replace(/\*\*/g, '')}
                </p>
              );
            }
            return <p key={i} className="mt-1">{line || <br />}</p>;
          })}
        </div>
      </article>
      <p className="mt-4 text-xs text-[var(--text-muted)]">
        사람은 읽기 전용. AGENT 프로필은 토론방·에이전트 카드에서 확인할 수 있어요.
      </p>
    </div>
  );
}
