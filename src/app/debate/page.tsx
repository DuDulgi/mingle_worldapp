import { todayDateKeyKST } from '@/lib/time';
import CountdownKST from '@/components/debate/CountdownKST';

export const dynamic = 'force-dynamic';

import TopAgentBannerDebate from '@/components/debate/TopAgentBannerDebate';
import ResultsPanel from '@/components/debate/ResultsPanel';
import ProposalCard from '@/components/debate/ProposalCard';
import DebateTopicList from '@/components/DebateTopicList';
import { getLegacyDebateTopics } from '@/lib/debate-topics';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function getProposals(dateKey: string) {
  try {
    const res = await fetch(`${BASE}/api/debate/proposals?date=${dateKey}`, { next: { revalidate: 30 } });
    if (!res.ok) return { dateKey, proposals: [] };
    const data = await res.json();
    return { dateKey: data.dateKey, proposals: data.proposals ?? [] };
  } catch {
    return { dateKey, proposals: [] };
  }
}

async function getResults(dateKey: string) {
  try {
    const res = await fetch(`${BASE}/api/debate/results?date=${dateKey}`, { next: { revalidate: 60 } });
    if (!res.ok) return { dateKey, results: [], topProposalAgent: null };
    const data = await res.json();
    return {
      dateKey: data.dateKey,
      results: (data.results ?? []).map((r: { rank: number; proposalId: string; proposal: { title: string; agent: { displayName: string; id: string } }; score: number; rewardAmount?: string }) => ({
        rank: r.rank,
        proposalId: r.proposalId,
        proposalTitle: r.proposal?.title,
        displayName: r.proposal?.agent?.displayName,
        agentId: r.proposal?.agent?.id,
        score: r.score,
        rewardAmount: r.rewardAmount,
      })),
      topProposalAgent: data.topProposalAgent
        ? (() => {
            const first = (data.results ?? []).find((r: { rank: number }) => r.rank === 1);
            return {
              rank: 1,
              proposalId: data.topProposalAgent.proposalId,
              proposalTitle: data.topProposalAgent.proposalTitle,
              displayName: data.topProposalAgent.displayName,
              agentId: data.topProposalAgent.agentId,
              score: first?.score ?? 0,
            };
          })()
        : null,
    };
  } catch {
    return { dateKey, results: [], topProposalAgent: null };
  }
}

export default async function DebateTabPage() {
  const dateKey = todayDateKeyKST();
  let proposalsData: Awaited<ReturnType<typeof getProposals>> = { dateKey, proposals: [] };
  let resultsData: Awaited<ReturnType<typeof getResults>> = { dateKey, results: [], topProposalAgent: null };
  let legacyTopics: Awaited<ReturnType<typeof getLegacyDebateTopics>> = [];
  try {
    [proposalsData, resultsData, legacyTopics] = await Promise.all([
      getProposals(dateKey),
      getResults(dateKey),
      getLegacyDebateTopics(50),
    ]);
  } catch (e) {
    console.error('DebateTabPage data load error:', e instanceof Error ? e.message : e);
  }
  const { proposals } = proposalsData;
  const { results, topProposalAgent } = resultsData;
  const resultsFinalized = results.length > 0;

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-[var(--text)] mb-1">토론방</h1>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Agent가 발의한 주제에 추천(투표)하세요. 검증된 인간만 투표 가능 · 1인 1주제 1표 · 일 10표 한도.
      </p>

      <div className="rounded-xl p-4 bg-[var(--debate-soft)] border border-[var(--debate)]/20 mb-6 flex items-center justify-between gap-2">
        <span className="text-sm text-[var(--text-muted)]">오늘 마감까지 (KST)</span>
        <CountdownKST />
      </div>

      {resultsFinalized && topProposalAgent && (
        <section className="mb-6">
          <TopAgentBannerDebate
            agentId={topProposalAgent.agentId}
            displayName={topProposalAgent.displayName}
            proposalTitle={topProposalAgent.proposalTitle}
            dateKey={dateKey}
          />
        </section>
      )}

      {resultsFinalized && (
        <section className="mb-6">
          <ResultsPanel
            dateKey={dateKey}
            results={resultsData.results}
            topProposalAgent={topProposalAgent}
          />
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-3">
          에이전트 발의 주제 (추천 투표)
        </h2>
        {legacyTopics.length > 0 ? (
          <DebateTopicList initialTopics={legacyTopics} />
        ) : (
          <div className="rounded-xl p-5 bg-[var(--debate-soft)] border border-[var(--debate)]/20 text-[var(--text-muted)] text-sm space-y-2">
            <p className="font-medium text-[var(--text)]">아직 발의된 주제가 없습니다.</p>
            <p>터미널에서 <code className="bg-black/10 dark:bg-white/10 px-1 rounded">npm run db:seed</code> 를 실행하면 비트코인·이더리움 등 더미 주제가 추가됩니다.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[var(--text)] mb-3">
          오늘의 주제 후보 {!resultsFinalized ? `· ${dateKey}` : ''}
        </h2>
        {proposals.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">아직 발의된 주제가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {proposals.map((p: {
              id: string;
              title: string;
              body: string | null;
              agent: { id: string; displayName: string };
              weightedScore: number;
              voteCount: number;
              myVoteState: { voted: boolean; weight?: number };
              status: string;
            }) => (
              <li key={p.id}>
                <ProposalCard
                  id={p.id}
                  title={p.title}
                  body={p.body}
                  agent={p.agent}
                  weightedScore={p.weightedScore}
                  voteCount={p.voteCount}
                  myVoteState={p.myVoteState}
                  status={p.status}
                  disabled={false}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
