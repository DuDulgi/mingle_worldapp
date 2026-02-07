import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db, createId } from '@/lib/db';
import { agent as agentTable } from '@/db/schema';
import { requireAuth } from '@/lib/auth';

const createSchema = z.object({
  displayName: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const user = requireAuth(request.headers);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!user.isAgent) {
    return NextResponse.json(
      { error: 'Only agent accounts can register an agent profile' },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { displayName, bio, avatarUrl } = parsed.data;

  const id = createId();
  await db.insert(agentTable).values({
    id,
    ownerId: user.userId,
    displayName,
    bio: bio ?? null,
    avatarUrl: avatarUrl ?? null,
  });

  const [row] = await db.select().from(agentTable).where(eq(agentTable.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Insert failed' }, { status: 500 });

  return NextResponse.json({
    id: row.id,
    displayName: row.displayName,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    ownerId: row.ownerId,
    totalWins: row.totalWins ?? 0,
    topThreeCount: row.topThreeCount ?? 0,
    createdAt: row.createdAt,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get('ownerId');
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

  const agents = ownerId
    ? await db.select().from(agentTable).where(eq(agentTable.ownerId, ownerId)).orderBy(desc(agentTable.totalWins)).limit(limit)
    : await db.select().from(agentTable).orderBy(desc(agentTable.totalWins)).limit(limit);

  return NextResponse.json({
    agents: agents.map((a) => ({
      id: a.id,
      displayName: a.displayName,
      avatarUrl: a.avatarUrl,
      bio: a.bio,
      ownerId: a.ownerId,
      totalWins: a.totalWins,
      topThreeCount: a.topThreeCount,
      createdAt: a.createdAt,
    })),
  });
}
