import { NextRequest, NextResponse } from 'next/server';
import { verifyCloudProof } from '@worldcoin/idkit';
import { eq } from 'drizzle-orm';
import { db, createId, now } from '@/lib/db';
import { user as userTable } from '@/db/schema';

const APP_ID = process.env.WORLD_APP_ID ?? process.env.NEXT_PUBLIC_WORLD_APP_ID;
const ACTION = process.env.WORLD_ACTION ?? process.env.NEXT_PUBLIC_WORLD_ACTION ?? 'login';

export async function POST(request: NextRequest) {
  if (!APP_ID || !APP_ID.startsWith('app_')) {
    return NextResponse.json(
      { error: 'World App ID not configured' },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const proof = body as Record<string, unknown>;
  const hasProof = proof && typeof proof.proof === 'string' && typeof proof.nullifier_hash === 'string' && typeof proof.merkle_root === 'string';
  if (!hasProof) {
    const keys = body && typeof body === 'object' ? Object.keys(body as object).join(', ') : 'none';
    console.error('World verify 400: missing or invalid proof fields. Body keys:', keys);
    return NextResponse.json(
      { error: 'Missing proof fields (proof, nullifier_hash, merkle_root)', receivedKeys: keys },
      { status: 400 }
    );
  }
  const proofPayload = proof as { proof: string; merkle_root: string; nullifier_hash: string; verification_level?: string };

  try {
    const result = await verifyCloudProof(
      proofPayload,
      APP_ID as `app_${string}`,
      ACTION
    );
    if (!result.success) {
      // 이미 이 액션으로 검증된 사용자 → World가 검증 완료로 본 사람이므로 DB 조회 또는 신규 생성 후 로그인 성공
      if (result.code === 'max_verifications_reached') {
        const nullifierHash = proofPayload.nullifier_hash;
        const ts = now();
        const existing = await db.select().from(userTable).where(eq(userTable.worldNullifierHash, nullifierHash)).limit(1);
        let userId: string;
        if (existing[0]) {
          userId = existing[0].id;
          await db.update(userTable).set({ updatedAt: ts, isHumanVerified: true }).where(eq(userTable.id, userId));
        } else {
          userId = createId();
          await db.insert(userTable).values({
            id: userId,
            createdAt: ts,
            updatedAt: ts,
            isHumanVerified: true,
            isAgent: false,
            worldNullifierHash: nullifierHash,
          });
        }
        const displayToken = `mingle_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        return NextResponse.json({
          success: true,
          token: displayToken,
          userId,
          isHumanVerified: true,
        });
      }
      console.error('World verify: cloud proof rejected', {
        code: result.code,
        detail: result.detail,
        attribute: result.attribute,
      });
      return NextResponse.json(
        {
          error: 'World cloud verification failed',
          code: result.code,
          detail: result.detail ?? undefined,
        },
        { status: 400 }
      );
    }

    const nullifierHash = proofPayload.nullifier_hash;
    const ts = now();

    const existing = await db.select().from(userTable).where(eq(userTable.worldNullifierHash, nullifierHash)).limit(1);

    let userId: string;
    if (existing[0]) {
      userId = existing[0].id;
      await db.update(userTable).set({ updatedAt: ts, isHumanVerified: true }).where(eq(userTable.id, userId));
    } else {
      userId = createId();
      await db.insert(userTable).values({
        id: userId,
        createdAt: ts,
        updatedAt: ts,
        isHumanVerified: true,
        isAgent: false,
        worldNullifierHash: nullifierHash,
      });
    }

    const displayToken = `mingle_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    return NextResponse.json({
      success: true,
      token: displayToken,
      userId,
      isHumanVerified: true,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('World verify error:', err.message);
    console.error(err.stack);
    const message = err.message;
    const hint =
      typeof message === 'string' && (message.includes('world_nullifier') || message.includes('no such column'))
        ? ' Run: npm run db:push'
        : '';
    return NextResponse.json(
      { error: message + hint },
      { status: 500 }
    );
  }
}
