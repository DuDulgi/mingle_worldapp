'use client';

import { useState } from 'react';
import { IDKitWidget, VerificationLevel, type ISuccessResult } from '@worldcoin/idkit';

const APP_ID = process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}` | undefined;
const ACTION = process.env.NEXT_PUBLIC_WORLD_ACTION || 'login';

export default function WorldLogin() {
  const handleVerify = async (proof: ISuccessResult) => {
    const res = await fetch('/api/world/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proof),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[World verify]', res.status, data);
      }
      throw new Error(data?.error ?? '검증에 실패했습니다.');
    }
    if (typeof window !== 'undefined') {
      if (data.token) localStorage.setItem('mingle_display_token', data.token);
      if (data.userId) {
        const { setStoredAuth } = await import('@/lib/auth-client');
        setStoredAuth(data.userId, data.isHumanVerified === true);
      }
    }
  };

  const onSuccess = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mingle_world_verified', '1');
    }
    window.location.reload();
  };

  if (!APP_ID || !APP_ID.startsWith('app_')) {
    return (
      <section className="rounded-2xl p-5 bg-[var(--bg-card)] border border-gray-200">
        <p className="text-sm font-medium text-[var(--text)] mb-1">World App 로그인</p>
        <p className="text-xs text-[var(--text-muted)]">
          World Developer Portal에서 App ID를 발급받은 뒤, 환경 변수 <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_WORLD_APP_ID</code>를 설정해 주세요.
        </p>
      </section>
    );
  }

  const [showHelp, setShowHelp] = useState(false);

  return (
    <section className="rounded-2xl p-5 bg-[var(--bg-card)] border border-gray-200">
      <p className="text-sm font-medium text-[var(--text)] mb-3">World App으로 로그인</p>
      <IDKitWidget
        app_id={APP_ID}
        action={ACTION}
        verification_level={VerificationLevel.Orb}
        onSuccess={onSuccess}
        handleVerify={handleVerify}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={open}
            className="w-full py-3 px-4 rounded-xl bg-[var(--text)] text-white font-medium text-sm hover:opacity-90 transition"
          >
            World App으로 로그인
          </button>
        )}
      </IDKitWidget>
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          {showHelp ? '▼' : '▶'} 「요청을 찾을 수 없습니다」 오류가 뜨나요?
        </button>
        {showHelp && (
          <ol className="mt-2 pl-4 text-xs text-[var(--text-muted)] space-y-1.5 list-decimal">
            <li>
              <a href="https://developer.worldcoin.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Developer Portal</a> 로그인 → 앱 선택 → <strong>Actions</strong>에 이름 <strong>&quot;{ACTION}&quot;</strong> 추가 후 저장
            </li>
            <li>
              같은 앱에서 <strong>Allowed origins</strong>에 <strong>지금 접속한 주소</strong> 추가 (예: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">https://your-app.vercel.app</code> 또는 로컬이면 <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">http://localhost:3000</code>)
            </li>
            <li>
              World App을 <strong>완전히 종료</strong>한 뒤 다시 실행하고, 여기서 로그인 다시 시도
            </li>
          </ol>
        )}
      </div>
    </section>
  );
}
