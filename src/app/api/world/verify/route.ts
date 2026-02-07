import { NextRequest, NextResponse } from 'next/server';
import { verifyCloudProof, type ISuccessResult } from '@worldcoin/idkit';
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
  const hasDb = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
  if (!hasDb) {
    return NextResponse.json(
      { error: 'DB not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN on Vercel (Settings → Environment Variables), then redeploy.' },
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
  const proofPayload: ISuccessResult = {
    proof: proof.proof as string,
    merkle_root: proof.merkle_root as string,
    nullifier_hash: proof.nullifier_hash as string,
    verification_level: (proof.verification_level as ISuccessResult['verification_level']) ?? 'orb',
  };

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
      const hint = ' Developer Portal에서 App ID·Action 이름·Allowed origins(배포 URL) 확인 후 재배포.';
      return NextResponse.json(
        {
          error: 'World cloud verification failed.' + hint,
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
    const message = err.message;
    console.error('World verify error:', message);
    console.error(err.stack);
    let userMessage = message;
    if (typeof message === 'string') {
      if (message.includes('world_nullifier') || message.includes('no such column')) {
        userMessage = message + ' 로컬에서 npm run db:push 후 Turso에 스키마 반영됐는지 확인하세요.';
      } else if (message.includes('401') || message.includes('SERVER_ERROR') || message.includes('LibsqlError')) {
        userMessage = 'DB 연결 실패. Vercel에 TURSO_DATABASE_URL, TURSO_AUTH_TOKEN 설정 후 재배포하세요.';
      } else if (message.includes('fetch') || message.includes('ECONNREFUSED') || message.includes('network')) {
        userMessage = 'World API 호출 실패. 잠시 후 재시도하거나 Developer Portal·Allowed origins 확인.';
      }
    }
    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}
