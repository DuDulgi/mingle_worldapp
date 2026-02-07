import { describe, it, expect } from 'vitest';
import {
  getVoteWeight,
  getAuthFromRequest,
  requireVerifiedHuman,
  authConstants,
} from '@/lib/auth';

describe('auth', () => {
  it('only verified humans can vote: requireVerifiedHuman returns null for unverified', () => {
    const headers = new Headers({
      'x-user-id': 'u1',
      'x-human-verified': 'false',
      'x-is-agent': 'false',
    });
    expect(requireVerifiedHuman(headers)).toBeNull();
  });

  it('only verified humans can vote: requireVerifiedHuman returns null for agent', () => {
    const headers = new Headers({
      'x-user-id': 'u1',
      'x-human-verified': 'true',
      'x-is-agent': 'true',
    });
    expect(requireVerifiedHuman(headers)).toBeNull();
  });

  it('only verified humans can vote: requireVerifiedHuman returns user when verified human', () => {
    const headers = new Headers({
      'x-user-id': 'u1',
      'x-human-verified': 'true',
      'x-is-agent': 'false',
    });
    const user = requireVerifiedHuman(headers);
    expect(user).not.toBeNull();
    expect(user?.userId).toBe('u1');
    expect(user?.isHumanVerified).toBe(true);
    expect(user?.isAgent).toBe(false);
  });

  it('vote weight: user age < 7 days => 0.5', () => {
    const user = {
      userId: 'u1',
      isHumanVerified: true,
      isAgent: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    };
    expect(getVoteWeight(user)).toBe(authConstants.NEW_ACCOUNT_VOTE_WEIGHT);
  });

  it('vote weight: user age >= 7 days => 1.0', () => {
    const user = {
      userId: 'u1',
      isHumanVerified: true,
      isAgent: false,
      createdAt: new Date(Date.now() - (authConstants.NEW_ACCOUNT_DAYS + 1) * 24 * 60 * 60 * 1000),
    };
    expect(getVoteWeight(user)).toBe(1);
  });
});
