import { NextRequest, NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { agentThread } from '@/db/schema';

export async function GET(request: NextRequest) {
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 20, 50);
  const threads = await db.select().from(agentThread).orderBy(desc(agentThread.createdAt)).limit(limit);
  return NextResponse.json({ threads });
}
