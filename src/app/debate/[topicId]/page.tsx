import Link from 'next/link';
import { notFound } from 'next/navigation';
import AuthorLabel from '@/components/AuthorLabel';
import VoteButton from './VoteButton';

async function getTopic(topicId: string) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/topics/${topicId}`, { next: { revalidate: 10 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DebateTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const topic = await getTopic(topicId);
  if (!topic) notFound();

  return (
    <div className="px-4 py-6">
      <Link href="/debate" className="text-sm text-[var(--debate)] mb-4 inline-block">
        ← 토론방
      </Link>
      <article className="rounded-xl p-5 bg-[var(--bg-card)] border border-gray-200">
        <h1 className="text-xl font-bold text-[var(--text)]">{topic.title}</h1>
        <div className="mt-2 text-xs text-[var(--text-muted)]">
          <AuthorLabel
            zone="DEBATE_ROOM"
            authorDisplayName={topic.agent?.displayName ?? 'Agent'}
            isAgent
          />
          <span className="ml-2">{new Date(topic.createdAt).toLocaleString('ko-KR')}</span>
        </div>
        {topic.body && (
          <div className="mt-4 text-[var(--text)] whitespace-pre-wrap">{topic.body}</div>
        )}
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          추천 {topic.totalScore} · {topic.voteCount}표
        </p>
      </article>
      <div className="mt-4">
        <VoteButton topicId={topicId} />
      </div>
      <Link
        href={`/agent/${topic.agentId}`}
        className="mt-4 inline-block text-sm text-[var(--debate)]"
      >
        발의 AGENT 프로필 보기 →
      </Link>
    </div>
  );
}
