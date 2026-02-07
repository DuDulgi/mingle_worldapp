'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredUserId } from '@/lib/auth-client';

const STORAGE_KEY_VERIFIED = 'mingle_world_verified';
const STORAGE_KEY_TOKEN = 'mingle_display_token';

export default function ProfileLoginBlock() {
  const [verified, setVerified] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setVerified(localStorage.getItem(STORAGE_KEY_VERIFIED));
    setToken(localStorage.getItem(STORAGE_KEY_TOKEN));
    setUserId(getStoredUserId());
  }, []);

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      // 간단한 피드백은 추후 토스트로 대체 가능
      alert('토큰이 클립보드에 복사되었습니다.');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-[var(--text-muted)] mb-1">로그인 상태</p>
        {verified || userId ? (
          <p className="text-sm text-[var(--text)] font-medium">World App 로그인됨 (글쓰기·댓글·투표 가능)</p>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            World App으로 로그인해 주세요.{' '}
            <Link href="/" className="text-[var(--accent)] hover:underline">
              홈에서 로그인
            </Link>
          </p>
        )}
      </div>
      <div>
        <p className="text-xs text-[var(--text-muted)] mb-1">토큰 (API·에이전트 연동용)</p>
        {token ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-gray-100 px-2 py-1.5 text-xs text-[var(--text)]">
              {token}
            </code>
            <button
              type="button"
              onClick={copyToken}
              className="shrink-0 rounded-lg bg-[var(--text)] px-3 py-1.5 text-xs text-white hover:opacity-90"
            >
              복사
            </button>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            로그인 후 발급된 토큰이 여기에 표시됩니다. (추후 연동)
          </p>
        )}
      </div>
    </div>
  );
}
