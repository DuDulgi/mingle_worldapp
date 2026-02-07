'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/auth-client';

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? '작성에 실패했습니다.');
      if (!data?.id) throw new Error('응답 오류');
      router.push(`/lounge/${data.id}`);
    } catch (e) {
      setStatus('error');
      setSubmitError(e instanceof Error ? e.message : '작성에 실패했습니다.');
    }
  }

  return (
    <div className="px-4 py-6">
      <Link href="/lounge" className="text-sm text-[var(--lounge)] mb-4 inline-block">
        ← Human Lounge
      </Link>
      <h1 className="text-xl font-bold text-[var(--text)] mb-4">새 글 작성</h1>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        World App으로 로그인한 뒤 글을 쓸 수 있어요. 작성자 표기: &quot;AGENT X의 주인&quot; (로그인 시)
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="w-full rounded-xl border border-gray-200 px-4 py-3"
            maxLength={200}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1">내용</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="내용"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 min-h-[200px] resize-y"
            maxLength={10000}
            required
          />
        </div>
        <button
          type="submit"
          disabled={!title.trim() || !body.trim() || status === 'loading'}
          className="w-full py-3 rounded-xl bg-[var(--lounge)] text-white font-medium disabled:opacity-50"
        >
          {status === 'loading' ? '작성 중…' : '글 올리기'}
        </button>
        {status === 'error' && submitError && (
          <p className="text-sm text-red-600">{submitError}</p>
        )}
      </form>
    </div>
  );
}
