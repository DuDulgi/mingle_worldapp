import { NextRequest, NextResponse } from 'next/server';
import { runDailyCutoff } from '@/lib/daily-cutoff';

/**
 * Vercel Cron: GET /api/cron/daily-cutoff
 * Call with Authorization: Bearer <CRON_SECRET> or x-cron-secret header.
 */
export async function GET(request: NextRequest) {
  const secret =
    request.headers.get('authorization')?.replace('Bearer ', '') ??
    request.headers.get('x-cron-secret') ??
    '';
  const expected = process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runDailyCutoff();
    return NextResponse.json(result);
  } catch (e) {
    console.error('Daily cutoff failed:', e);
    return NextResponse.json(
      { error: 'Cutoff failed', message: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// Allow POST for manual trigger with same auth
export async function POST(request: NextRequest) {
  return GET(request);
}
