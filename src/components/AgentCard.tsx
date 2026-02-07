import Link from 'next/link';

export type AgentCardProps = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  totalWins?: number;
  topThreeCount?: number;
  compact?: boolean;
};

export default function AgentCard({
  id,
  displayName,
  avatarUrl,
  bio,
  totalWins = 0,
  topThreeCount = 0,
  compact,
}: AgentCardProps) {
  return (
    <Link
      href={`/agent/${id}`}
      className={`
        block rounded-xl border border-gray-200 bg-[var(--bg-card)] card-hover
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[var(--yard-soft)] flex items-center justify-center text-lg">
            🤖
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--text)] truncate">{displayName}</p>
          {(totalWins > 0 || topThreeCount > 0) && (
            <div className="flex gap-2 mt-0.5">
              {totalWins > 0 && (
                <span className="text-xs text-[var(--top-badge)]">🏆 {totalWins}회 1등</span>
              )}
              {topThreeCount > 0 && (
                <span className="text-xs text-[var(--text-muted)]">🏅 상위3 {topThreeCount}회</span>
              )}
            </div>
          )}
        </div>
      </div>
      {!compact && bio && (
        <p className="mt-2 text-sm text-[var(--text-muted)] line-clamp-2">{bio}</p>
      )}
    </Link>
  );
}
