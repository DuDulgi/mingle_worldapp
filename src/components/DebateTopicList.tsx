'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthorLabel from '@/components/AuthorLabel';
import { getAuthHeaders } from '@/lib/auth-client';

type Topic = {
  id: string;
  title: string;
  body?: string | null;
  agentId: string;
  agent: { id: string; displayName: string; ownerId: string } | null;
  totalScore: number;
  voteCount: number;
  createdAt: string;
};

export default function DebateTopicList({ initialTopics }: { initialTopics: Topic[] }) {
  const [topics, setTopics] = useState(initialTopics);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);

  async function vote(topicId: string) {
    if (voted.has(topicId)) return;
    setLoading(topicId);
    try {
      const res = await fetch(`/api/topics/${topicId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || '투표에 실패했습니다. 검증된 인간만 투표할 수 있어요.');
        return;
      }
      setVoted((prev) => new Set(prev).add(topicId));
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topicId
            ? { ...t, totalScore: t.totalScore + 1, voteCount: t.voteCount + 1 }
            : t
        )
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : '네트워크 오류가 났어요. 다시 시도해 주세요.';
      alert(msg);
    } finally {
      setLoading(null);
    }
  }

  if (topics.length === 0) {
    return (
      <div className="rounded-xl p-6 bg-[var(--debate-soft)] border border-[var(--debate)]/20 text-center text-[var(--text-muted)]">
        오늘 발의된 주제가 없습니다.
      </div>
    );
  }

  return (
    <ul className="space-y-3" id="topic-list">
      {topics.map((t) => {
        const hasVoted = voted.has(t.id);
        return (
          <li
            key={t.id}
            id={`topic-${t.id}`}
            className="rounded-xl p-4 bg-[var(--bg-card)] border border-gray-200"
          >
            <Link href={`/debate/${t.id}`} className="block">
              <h3 className="font-semibold text-[var(--text)]">{t.title}</h3>
              {t.body && (
                <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">{t.body}</p>
              )}
              <div className="mt-2 text-xs text-[var(--text-muted)]">
                <AuthorLabel
                  zone="DEBATE_ROOM"
                  authorDisplayName={t.agent?.displayName ?? 'Agent'}
                  isAgent
                />
                <span className="ml-2">추천 {t.totalScore} · {t.voteCount}표</span>
              </div>
            </Link>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => vote(t.id)}
                disabled={hasVoted || loading === t.id}
                className={`
                  w-full py-2 rounded-lg text-sm font-medium
                  ${hasVoted
                    ? 'bg-gray-200 text-gray-500 cursor-default'
                    : 'bg-[var(--debate)] text-white hover:opacity-90'
                  }
                `}
              >
                {hasVoted ? '추천함' : loading === t.id ? '처리 중…' : '추천(투표)'}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
