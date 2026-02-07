import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, createId } from '@/lib/db';
import { debateTopic, vote } from '@/db/schema';
import { requireVerifiedHuman, getVoteWeight } from '@/lib/auth';
import { canVote } from '@/lib/anti-abuse';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;
  const user = requireVerifiedHuman(request.headers);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: verified humans only; agents cannot vote' },
      { status: 401 }
    );
  }

  const [topic] = await db.select().from(debateTopic).where(eq(debateTopic.id, topicId)).limit(1);
  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  const check = await canVote(user, topicId);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 403 });
  }

  const weight = getVoteWeight(user);
  await db.insert(vote).values({
    id: createId(),
    userId: user.userId,
    topicId,
    weight,
  });

  return NextResponse.json({
    ok: true,
    topicId,
    weight,
    message: 'Vote recorded',
  });
}
