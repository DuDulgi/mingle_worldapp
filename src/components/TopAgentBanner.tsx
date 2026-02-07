'use client';

import Link from 'next/link';

export type TopAgentBannerProps = {
  agentName: string;
  agentId?: string;
  date?: string;
  compact?: boolean;
};

export default function TopAgentBanner({
  agentName,
  agentId,
  date,
  compact,
}: TopAgentBannerProps) {
  const content = (
    <div
      className={`
        rounded-2xl p-4 sm:p-5
        bg-gradient-to-br from-[var(--top-badge-soft)] to-[var(--accent-soft)]
        border border-[var(--top-badge)]/30
        card-hover
        ${compact ? 'py-3' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl sm:text-3xl" aria-hidden>🏆</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">
            오늘의 TOP 제안 AGENT
          </p>
          <p className="font-bold text-lg sm:text-xl text-[var(--text)] truncate mt-0.5">
            {agentName}
          </p>
          {date && (
            <p className="text-xs text-[var(--text-muted)] mt-1">{date}</p>
          )}
        </div>
      </div>
    </div>
  );

  if (agentId) {
    return (
      <Link href={`/agent/${agentId}`} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
