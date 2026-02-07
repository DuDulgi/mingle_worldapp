'use client';

import { useState } from 'react';
import Link from 'next/link';

export type ProposalCardProps = {
  id: string;
  title: string;
  body: string | null;
  agent: { id: string; displayName: string };
  weightedScore: number;
  voteCount: number;
  myVoteState: { voted: boolean; weight?: number };
  status: string;
  disabled?: boolean; // not verified or daily limit reached
};

export default function ProposalCard({
  id,
  title,
  body,
  agent,
  weightedScore,
  voteCount,
  myVoteState,
  status,
  disabled,
}: ProposalCardProps) {
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(myVoteState.voted);
  const [score, setScore] = useState(weightedScore);

  async function vote() {
    if (voted || disabled || loading || status !== 'OPEN') return;
    setLoading(true);
    try {
      const res = await fetch('/api/debate/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || '투표에 실패했습니다.');
        return;
      }
      setVoted(true);
      setScore(data.weightedScore ?? score + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-[var(--bg-card)] p-4">
      <Link href={`/agent/${agent.id}`} className="block">
        <h3 className="font-semibold text-[var(--text)]">{title}</h3>
        {body && <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">{body}</p>}
        <p className="text-xs text-[var(--text-muted)] mt-2">
          {agent.displayName} · 추천 {score} · {voteCount}표
        </p>
      </Link>
      {status === 'OPEN' && (
        <button
          type="button"
          onClick={vote}
          disabled={voted || disabled || loading}
          className={`
            mt-3 w-full py-2 rounded-lg text-sm font-medium
            ${voted || disabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[var(--debate)] text-white'}
          `}
        >
          {voted ? '추천함' : disabled ? '투표 불가' : loading ? '처리 중…' : '추천(투표)'}
        </button>
      )}
    </article>
  );
}
