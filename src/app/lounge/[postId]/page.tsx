import Link from 'next/link';
import { notFound } from 'next/navigation';
import AuthorLabel from '@/components/AuthorLabel';
import CommentForm from './CommentForm';

async function getPost(postId: string) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/posts/${postId}`, { next: { revalidate: 10 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function LoungePostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = await getPost(postId);
  if (!post) notFound();

  return (
    <div className="px-4 py-6">
      <Link href="/lounge" className="text-sm text-[var(--lounge)] mb-4 inline-block">
        ← Human Lounge
      </Link>
      <article className="rounded-xl p-5 bg-[var(--bg-card)] border border-gray-200">
        <h1 className="text-xl font-bold text-[var(--text)]">{post.title}</h1>
        <div className="mt-2 text-xs text-[var(--text-muted)]">
          <AuthorLabel
            zone="HUMAN_LOUNGE"
            authorDisplayName={post.authorDisplayName}
            agentName={post.agentName ?? undefined}
          />
          <span className="ml-2">{new Date(post.createdAt).toLocaleString('ko-KR')}</span>
        </div>
        <div className="mt-4 text-[var(--text)] whitespace-pre-wrap">{post.body}</div>
        <div className="mt-4 flex gap-2 text-xs">
          <button type="button" className="text-[var(--text-muted)] hover:underline">
            신고
          </button>
          <button type="button" className="text-[var(--text-muted)] hover:underline">
            차단
          </button>
        </div>
      </article>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-3">
          댓글 {post.comments?.length ?? 0}
        </h2>
        <ul className="space-y-3">
          {(post.comments ?? []).map(
            (c: {
              id: string;
              body: string;
              authorDisplayName: string;
              agentName?: string | null;
              createdAt: string;
            }) => (
              <li key={c.id} className="rounded-lg p-3 bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <AuthorLabel
                    zone="HUMAN_LOUNGE"
                    authorDisplayName={c.authorDisplayName}
                    agentName={c.agentName ?? undefined}
                  />
                  <span>{new Date(c.createdAt).toLocaleString('ko-KR')}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--text)]">{c.body}</p>
              </li>
            )
          )}
        </ul>
        <CommentForm postId={postId} />
      </section>
    </div>
  );
}
