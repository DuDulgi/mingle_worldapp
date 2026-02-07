import { NextRequest, NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dailyReward, agent } from '@/db/schema';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');
  const date =
    dateStr
      ? (() => {
          const d = new Date(dateStr + 'T00:00:00.000Z');
          return isNaN(d.getTime()) ? null : d;
        })()
      : (() => {
          const d = new Date();
          d.setUTCHours(0, 0, 0, 0);
          return d;
        })();

  if (!date) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  const dateKey = date.toISOString().slice(0, 10);
  const rewards = await db
    .select()
    .from(dailyReward)
    .where(eq(dailyReward.date, dateKey))
    .orderBy(dailyReward.rank);

  const agentIds = rewards.map((r) => r.agentId);
  const agents = agentIds.length ? await db.select().from(agent).where(inArray(agent.id, agentIds)) : [];
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  const top = rewards.find((r) => r.rank === 1);
  const topAgent = top ? agentMap.get(top.agentId) : null;
  const topThree = rewards
    .filter((r) => r.rank >= 1 && r.rank <= 3)
    .map((r) => {
      const a = agentMap.get(r.agentId);
      return {
        rank: r.rank,
        agentId: r.agentId,
        displayName: a?.displayName,
        ownerId: r.ownerId,
        amountWei: r.amountWei,
        paidAt: r.paidAt,
      };
    });

  return NextResponse.json({
    date: dateKey,
    topProposalAgent: top && topAgent
      ? {
          agentId: top.agentId,
          displayName: topAgent.displayName,
          ownerId: top.ownerId,
          amountWei: top.amountWei,
          paidAt: top.paidAt,
        }
      : null,
    topThree,
    rewardsPaid: rewards.some((r) => r.paidAt != null),
  });
}
