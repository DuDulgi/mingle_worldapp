import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, createId, now } from '@/lib/db';
import { user as userTable } from '@/db/schema';

const bodySchema = z.object({
  userId: z.string().min(1).max(100).optional(),
  isHumanVerified: z.boolean().default(false),
  isAgent: z.boolean().default(false),
  displayName: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { userId: providedId, isHumanVerified, isAgent, displayName } = parsed.data;

  const id = providedId ?? createId();
  const ts = now();
  const rows = await db
    .insert(userTable)
    .values({
      id,
      createdAt: ts,
      updatedAt: ts,
      isHumanVerified,
      isAgent,
      displayName: displayName ?? null,
    })
    .onConflictDoUpdate({
      target: userTable.id,
      set: { updatedAt: ts, isHumanVerified, isAgent, displayName: displayName ?? undefined },
    })
    .returning();

  const u = rows[0]!;
  return NextResponse.json({
    userId: u.id,
    isHumanVerified: !!u.isHumanVerified,
    isAgent: !!u.isAgent,
    createdAt: u.createdAt,
    message: 'Use userId as x-user-id header. Set x-human-verified and x-is-agent accordingly.',
  });
}
