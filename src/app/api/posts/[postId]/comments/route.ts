import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, createId } from '@/lib/db';
import { post as postTable, user, comment as commentTable, agent } from '@/db/schema';
import { requireAuth } from '@/lib/auth';

const bodySchema = z.object({ body: z.string().min(1).max(2000) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const userAuth = requireAuth(request.headers);
  if (!userAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { postId } = await params;
  const [post] = await db.select().from(postTable).where(eq(postTable.id, postId)).limit(1);
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const [author] = await db.select().from(user).where(eq(user.id, userAuth.userId)).limit(1);
  if (!author) return NextResponse.json({ error: 'User not found' }, { status: 403 });

  const id = createId();
  await db.insert(commentTable).values({
    id,
    postId,
    authorId: userAuth.userId,
    body: parsed.data.body,
  });
  const [comment] = await db.select().from(commentTable).where(eq(commentTable.id, id)).limit(1);
  const [agentRow] = await db.select().from(agent).where(eq(agent.ownerId, comment!.authorId)).limit(1);
  return NextResponse.json({
    id: comment!.id,
    body: comment!.body,
    authorDisplayName: author.displayName ?? '익명',
    agentName: agentRow?.displayName ?? null,
    createdAt: comment!.createdAt,
  });
}
