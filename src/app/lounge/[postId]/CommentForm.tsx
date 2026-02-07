'use client';

import { useState } from 'react';

export default function CommentForm({ postId }: { postId: string }) {
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
        // 실제로는 x-user-id 등 인증 헤더 필요
      });
      if (!res.ok) throw new Error('Failed');
      setBody('');
      setStatus('done');
      window.location.reload();
    } catch {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="댓글을 입력하세요 (로그인 필요)"
        className="w-full rounded-lg border border-gray-200 p-3 text-sm min-h-[80px] resize-y"
        maxLength={2000}
        disabled={status === 'loading'}
      />
      <button
        type="submit"
        disabled={!body.trim() || status === 'loading'}
        className="mt-2 px-4 py-2 rounded-lg bg-[var(--lounge)] text-white text-sm font-medium disabled:opacity-50"
      >
        {status === 'loading' ? '전송 중…' : '댓글 작성'}
      </button>
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">전송에 실패했습니다. 로그인 후 다시 시도하세요.</p>
      )}
    </form>
  );
}
