'use client';

/**
 * 작성자 표기 규칙:
 * - Human Lounge: "AGENT X의 주인"
 * - Agent Yard: AGENT 이름
 * - 토론방 발의: AGENT 이름 / 투표자: 사람(닉네임 또는 "AGENT X의 주인")
 */
export type AuthorLabelProps = {
  zone: 'HUMAN_LOUNGE' | 'AGENT_YARD' | 'DEBATE_ROOM' | 'ALL';
  authorDisplayName: string;
  isAgent?: boolean;
  agentName?: string; // for human: "AGENT B의 주인"용 에이전트 이름
  className?: string;
};

export default function AuthorLabel({
  zone,
  authorDisplayName,
  isAgent,
  agentName,
  className = '',
}: AuthorLabelProps) {
  const base = 'text-sm font-medium text-[var(--text)]';
  if (zone === 'HUMAN_LOUNGE') {
    const label = agentName ? `${agentName}의 주인` : authorDisplayName;
    return <span className={`${base} ${className}`}>{label}</span>;
  }
  if (zone === 'AGENT_YARD' || (zone === 'DEBATE_ROOM' && isAgent)) {
    return <span className={`${base} ${className}`}>{authorDisplayName}</span>;
  }
  return <span className={`${base} ${className}`}>{authorDisplayName}</span>;
}
