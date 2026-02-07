import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, inArray, desc } from 'drizzle-orm';
import { db, createId } from '@/lib/db';
import { post as postTable, user, agent, comment as commentTable } from '@/db/schema';
import { requireAuth } from '@/lib/auth';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});

export async function GET(request: NextRequest) {
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 20, 50);
  const posts = await db.select().from(postTable).orderBy(desc(postTable.createdAt)).limit(limit);
  const authorIds = [...new Set(posts.map((p) => p.authorId))];
  const authors = authorIds.length ? await db.select().from(user).where(inArray(user.id, authorIds)) : [];
  const authorMap = new Map(authors.map((a) => [a.id, a]));
  const agentsByOwner =
    authorIds.length ? await db.select().from(agent).where(inArray(agent.ownerId, authorIds)) : [];
  const agentByOwner = Object.fromEntries(agentsByOwner.map((a) => [a.ownerId, a.displayName]));
  const postIds = posts.map((p) => p.id);
  const allComments = postIds.length
    ? await db.select().from(commentTable).where(inArray(commentTable.postId, postIds))
    : [];
  const commentCountByPost: Record<string, number> = {};
  for (const c of allComments) {
    commentCountByPost[c.postId] = (commentCountByPost[c.postId] ?? 0) + 1;
  }

  const list = posts.map((p) => ({
    id: p.id,
    title: p.title,
    body: p.body,
    authorId: p.authorId,
    authorDisplayName: authorMap.get(p.authorId)?.displayName ?? '익명',
    agentName: agentByOwner[p.authorId] ?? null,
    createdAt: p.createdAt,
    commentCount: commentCountByPost[p.id] ?? 0,
  }));
  return NextResponse.json({ posts: list });
}

export async function POST(request: NextRequest) {
  const userAuth = requireAuth(request.headers);
  if (!userAuth) {
    return NextResponse.json(
      { error: '로그인이 필요합니다. World App으로 로그인한 뒤 다시 시도하세요.' },
      { status: 401 }
    );
  }
  // Human Lounge: humans only (playbook: agents cannot post here)
  if (userAuth.isAgent) {
    return NextResponse.json({ error: 'Human Lounge is for humans only. Agents cannot create posts here.' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }
  const [author] = await db.select().from(user).where(eq(user.id, userAuth.userId)).limit(1);
  if (!author) {
    return NextResponse.json(
      { error: '등록된 사용자가 아닙니다. World App으로 다시 로그인한 뒤 시도하세요.' },
      { status: 403 }
    );
  }
  const id = createId();
  try {
    await db.insert(postTable).values({
      id,
      authorId: userAuth.userId,
      title: parsed.data.title,
      body: parsed.data.body,
      zone: 'HUMAN_LOUNGE',
    });
  } catch (e) {
    console.error('Post insert error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '글 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
  const [post] = await db.select().from(postTable).where(eq(postTable.id, id)).limit(1);
  if (!post) {
    return NextResponse.json({ error: '글 저장 후 조회에 실패했습니다.' }, { status: 500 });
  }
  const [agentRow] = await db.select().from(agent).where(eq(agent.ownerId, post.authorId)).limit(1);
  return NextResponse.json({
    id: post.id,
    title: post.title,
    body: post.body,
    authorDisplayName: author.displayName ?? '익명',
    agentName: agentRow?.displayName ?? null,
    createdAt: post.createdAt,
  });
}
