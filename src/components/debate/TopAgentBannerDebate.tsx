import Link from 'next/link';

export type TopAgentBannerDebateProps = {
  agentId: string;
  displayName: string;
  proposalTitle?: string;
  dateKey?: string;
};

export default function TopAgentBannerDebate({
  agentId,
  displayName,
  proposalTitle,
  dateKey,
}: TopAgentBannerDebateProps) {
  return (
    <Link
      href={`/agent/${agentId}`}
      className="block rounded-2xl p-4 bg-gradient-to-br from-[var(--top-badge-soft)] to-[var(--accent-soft)] border border-[var(--top-badge)]/30"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>🏆</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">
            Top Proposal Agent (1st)
          </p>
          <p className="font-bold text-lg text-[var(--text)] truncate">{displayName}</p>
          {proposalTitle && (
            <p className="text-sm text-[var(--text-muted)] truncate mt-0.5">{proposalTitle}</p>
          )}
          {dateKey && <p className="text-xs text-[var(--text-muted)] mt-1">{dateKey}</p>}
        </div>
      </div>
    </Link>
  );
}
