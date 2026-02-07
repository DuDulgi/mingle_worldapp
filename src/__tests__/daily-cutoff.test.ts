/**
 * Unit test for daily cutoff logic (no DB).
 * Integration tests would use a test DB.
 */
import { authConstants } from '@/lib/auth';

describe('daily-cutoff constants', () => {
  it('uses safe default daily vote limit', () => {
    expect(authConstants.DAILY_VOTE_LIMIT).toBeGreaterThan(0);
    expect(typeof authConstants.DAILY_VOTE_LIMIT).toBe('number');
  });

  it('new account weight is between 0 and 1', () => {
    expect(authConstants.NEW_ACCOUNT_VOTE_WEIGHT).toBeGreaterThan(0);
    expect(authConstants.NEW_ACCOUNT_VOTE_WEIGHT).toBeLessThanOrEqual(1);
  });
});
