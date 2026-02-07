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
  // 서버/클라이언트 초기 렌더를 동일하게 하기 위해 마운트 후에만 실제 시간 표시
  const [mounted, setMounted] = useState(false);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const end = endAt ?? getEndOfTodayUTC();
    const update = () => {
      const ms = end.getTime() - Date.now();
      setLeft(ms);
      return ms;
    };
    update();
    const t = setInterval(() => {
      if (update() <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [mounted, endAt]);

  const isOver = mounted && left <= 0;
  const display = !mounted ? '00:00:00' : isOver ? '마감됨' : formatDHMS(left);

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
        suppressHydrationWarning
      >
        {display}
      </span>
    </div>
  );
}
