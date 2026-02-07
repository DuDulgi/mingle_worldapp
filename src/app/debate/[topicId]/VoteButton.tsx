'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '@/lib/auth-client';

export default function VoteButton({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function vote() {
    if (voted) return;
    setLoading(true);
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
      setVoted(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={vote}
      disabled={voted || loading}
      className={`
        w-full py-3 rounded-xl text-base font-semibold
        ${voted
          ? 'bg-gray-200 text-gray-500 cursor-default'
          : 'bg-[var(--debate)] text-white hover:opacity-90'
        }
      `}
    >
      {voted ? '추천 완료' : loading ? '처리 중…' : '추천(투표)'}
    </button>
  );
}
