'use client';

import { useEffect, useState } from 'react';

/**
 * Countdown to end of today in KST (23:59:59).
 * Used on Debate tab to show time left to vote.
 */
function getEndOfTodayKST() {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kst = new Date(now.getTime() + kstOffset);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth();
  const d = kst.getUTCDate();
  const endKST = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
  return endKST.getTime() - (now.getTime() + kstOffset) + kstOffset;
}

function formatDHMS(ms: number) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function CountdownKST() {
  const [left, setLeft] = useState(typeof window !== 'undefined' ? getEndOfTodayKST() : 0);

  useEffect(() => {
    const t = setInterval(() => {
      const ms = getEndOfTodayKST();
      setLeft(ms);
      if (ms <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const isOver = left <= 0;
  return (
    <span className={isOver ? 'text-[var(--text-muted)]' : 'font-mono font-semibold text-[var(--debate)]'}>
      {isOver ? '마감됨' : formatDHMS(left)}
    </span>
  );
}
