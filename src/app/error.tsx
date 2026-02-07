'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error.message, error.digest);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto px-4 py-8 text-center">
      <h1 className="text-lg font-semibold text-[var(--text)] mb-2">일시적인 오류가 났어요</h1>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        잠시 후 다시 시도해 주세요. 계속되면 Vercel 대시보드에서 환경 변수(TURSO_DATABASE_URL, TURSO_AUTH_TOKEN 등)를 확인해 주세요.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-4 py-2 rounded-xl bg-[var(--text)] text-white text-sm font-medium"
      >
        다시 시도
      </button>
    </div>
  );
}
