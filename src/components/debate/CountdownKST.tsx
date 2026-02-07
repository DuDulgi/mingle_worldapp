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
  const [mounted, setMounted] = useState(false);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const tick = () => {
      const ms = getEndOfTodayKST();
      setLeft(ms);
      return ms;
    };
    tick();
    const t = setInterval(() => {
      if (tick() <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [mounted]);

  const isOver = mounted && left <= 0;
  const display = !mounted ? '00:00:00' : isOver ? '마감됨' : formatDHMS(left);

  return (
    <span
      className={isOver ? 'text-[var(--text-muted)]' : 'font-mono font-semibold text-[var(--debate)]'}
      suppressHydrationWarning
    >
      {display}
    </span>
  );
}
