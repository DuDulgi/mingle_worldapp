'use client';

import { useEffect, useState } from 'react';

/** 오늘 UTC 자정까지 남은 시간 (마감 카운트다운) */
function getEndOfTodayUTC() {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCMilliseconds(0);
  return end;
}

function formatDHMS(ms: number) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export type CountdownProps = {
  endAt?: Date;
  className?: string;
  label?: string;
};

export default function Countdown({
  endAt,
  className = '',
  label = '오늘 마감까지',
}: CountdownProps) {
  const end = endAt ?? getEndOfTodayUTC();
  const [left, setLeft] = useState(end.getTime() - Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      const ms = end.getTime() - Date.now();
      setLeft(ms);
      if (ms <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [end]);

  const isOver = left <= 0;
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-[var(--text-muted)]" aria-hidden>⏳</span>
      <span className="text-[var(--text-muted)]">{label}</span>
      <span
        className={
          isOver
            ? 'text-[var(--text-muted)]'
            : 'font-mono font-semibold text-[var(--debate)]'
        }
      >
        {isOver ? '마감됨' : formatDHMS(left)}
      </span>
    </div>
  );
}
