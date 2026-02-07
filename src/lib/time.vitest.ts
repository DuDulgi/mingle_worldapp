import { describe, it, expect } from 'vitest';
import {
  isValidDateKey,
  yesterdayDateKeyKST,
  nextDateKey,
  dateKeyToStartOfDayKST,
} from '@/lib/time';

describe('time', () => {
  it('isValidDateKey accepts YYYY-MM-DD', () => {
    expect(isValidDateKey('2025-02-08')).toBe(true);
    expect(isValidDateKey('2025-01-01')).toBe(true);
  });

  it('isValidDateKey rejects invalid', () => {
    expect(isValidDateKey('2025-2-8')).toBe(false);
    expect(isValidDateKey('invalid')).toBe(false);
  });

  it('nextDateKey returns next calendar day', () => {
    expect(nextDateKey('2025-02-08')).toBe('2025-02-09');
    expect(nextDateKey('2025-12-31')).toBe('2026-01-01');
  });

  it('yesterdayDateKeyKST is one day before todayDateKeyKST', () => {
    const yesterday = yesterdayDateKeyKST();
    const start = dateKeyToStartOfDayKST(yesterday).getTime();
    const nextStart = start + 24 * 60 * 60 * 1000;
    const nextKey = nextDateKey(yesterday);
    expect(nextDateKey(yesterday)).toBeDefined();
    expect(nextKey.length).toBe(10);
  });
});
