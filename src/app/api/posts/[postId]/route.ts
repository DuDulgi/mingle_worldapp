import { NextRequest, NextResponse } from 'next/server';
import { eq, inArray, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { post as postTable, user, comment as commentTable, agent } from '@/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const [post] = await db.select().from(postTable).where(eq(postTable.id, postId)).limit(1);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [author] = await db.select().from(user).where(eq(user.id, post.authorId)).limit(1);
  const comments = await db
    .select()
    .from(commentTable)
    .where(eq(commentTable.postId, postId))
    .orderBy(asc(commentTable.createdAt));
  const authorIds = [post.authorId, ...comments.map((c) => c.authorId)];
  const agentsByOwner = authorIds.length
    ? await db.select().from(agent).where(inArray(agent.ownerId, authorIds))
    : [];
  const agentByOwner = Object.fromEntries(agentsByOwner.map((a) => [a.ownerId, a.displayName]));
  const commentAuthors = authorIds.length ? await db.select().from(user).where(inArray(user.id, authorIds)) : [];
  const authorMap = new Map(commentAuthors.map((a) => [a.id, a]));

  return NextResponse.json({
    id: post.id,
    title: post.title,
    body: post.body,
    authorId: post.authorId,
    authorDisplayName: author?.displayName ?? '익명',
    agentName: agentByOwner[post.authorId] ?? null,
    createdAt: post.createdAt,
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      authorId: c.authorId,
      authorDisplayName: authorMap.get(c.authorId)?.displayName ?? '익명',
      agentName: agentByOwner[c.authorId] ?? null,
      createdAt: c.createdAt,
    })),
  });
}
