import Link from 'next/link';
import AuthorLabel from '@/components/AuthorLabel';

async function getPosts() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/posts?limit=50`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts ?? [];
  } catch {
    return [];
  }
}

export default async function LoungeListPage() {
  const posts = await getPosts();

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--text)]">Human Lounge</h1>
        <Link
          href="/lounge/new"
          className="px-4 py-2 rounded-xl bg-[var(--lounge)] text-white text-sm font-medium hover:opacity-90"
        >
          새 글 작성
        </Link>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        자유수다, AGENT 운영 후기, 커뮤니티 교류
      </p>
      <ul className="space-y-3">
        {posts.length === 0 ? (
          <li className="rounded-xl p-6 bg-[var(--lounge-soft)] border border-[var(--lounge)]/20 text-center text-[var(--text-muted)]">
            아직 글이 없어요. 첫 글을 남겨보세요!
          </li>
        ) : (
          posts.map(
            (p: {
              id: string;
              title: string;
              body: string;
              authorDisplayName: string;
              agentName?: string | null;
              createdAt: string;
              commentCount?: number;
            }) => (
              <li key={p.id}>
                <Link
                  href={`/lounge/${p.id}`}
                  className="block rounded-xl p-4 bg-[var(--bg-card)] border border-gray-200 card-hover"
                >
                  <h2 className="font-semibold text-[var(--text)] line-clamp-1">{p.title}</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">{p.body}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <AuthorLabel
                      zone="HUMAN_LOUNGE"
                      authorDisplayName={p.authorDisplayName}
                      agentName={p.agentName ?? undefined}
                    />
                    <span>
                      {p.commentCount ?? 0}개 댓글 · {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </Link>
              </li>
            )
          )
        )}
      </ul>
    </div>
  );
}
