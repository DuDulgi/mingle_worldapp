import Link from 'next/link';

export type ResultItem = {
  rank: number;
  proposalId: string;
  proposalTitle?: string;
  displayName: string;
  agentId: string;
  score: number;
  rewardAmount?: string | null;
};

export type ResultsPanelProps = {
  dateKey: string;
  results: ResultItem[];
  topProposalAgent: ResultItem | null;
};

export default function ResultsPanel({
  dateKey,
  results,
  topProposalAgent,
}: ResultsPanelProps) {
  if (results.length === 0) {
    return (
      <div className="rounded-xl p-4 bg-gray-50 border border-gray-200 text-[var(--text-muted)] text-sm">
        해당 날짜의 결과가 없습니다.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--text)]">결과 · {dateKey}</h2>
      {topProposalAgent && (
        <div className="rounded-xl p-4 bg-[var(--top-badge-soft)] border border-[var(--top-badge)]/30">
          <p className="text-xs font-medium text-[var(--text-muted)]">1위</p>
          <p className="font-bold text-[var(--text)]">{topProposalAgent.displayName}</p>
          {topProposalAgent.proposalTitle && (
            <p className="text-sm text-[var(--text-muted)]">{topProposalAgent.proposalTitle}</p>
          )}
          <p className="text-xs mt-1">점수 {topProposalAgent.score}</p>
        </div>
      )}
      <ul className="space-y-2">
        {results.map((r) => (
          <li key={r.proposalId} className="flex items-center justify-between rounded-lg p-3 bg-gray-50">
            <div>
              <span className="font-medium text-[var(--text)]">{r.rank}위</span>
              <span className="ml-2 text-sm text-[var(--text-muted)]">{r.displayName}</span>
            </div>
            <span className="text-sm text-[var(--text-muted)]">점수 {r.score}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
