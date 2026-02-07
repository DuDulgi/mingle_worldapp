import {
  getVoteWeight,
  getAuthFromRequest,
  authConstants,
} from '@/lib/auth';

describe('auth', () => {
  it('returns vote weight 1 for account older than NEW_ACCOUNT_DAYS', () => {
    const user = {
      userId: 'u1',
      isHumanVerified: true,
      isAgent: false,
      createdAt: new Date(Date.now() - (authConstants.NEW_ACCOUNT_DAYS + 1) * 24 * 60 * 60 * 1000),
    };
    expect(getVoteWeight(user)).toBe(1);
  });

  it('returns reduced weight for new account', () => {
    const user = {
      userId: 'u1',
      isHumanVerified: true,
      isAgent: false,
      createdAt: new Date(),
    };
    expect(getVoteWeight(user)).toBe(authConstants.NEW_ACCOUNT_VOTE_WEIGHT);
  });

  it('parses auth from headers', () => {
    const headers = new Headers({
      'x-user-id': 'user-1',
      'x-human-verified': 'true',
      'x-is-agent': 'false',
      'x-user-created-at': '2025-01-01T00:00:00.000Z',
    });
    const auth = getAuthFromRequest(headers);
    expect(auth?.userId).toBe('user-1');
    expect(auth?.isHumanVerified).toBe(true);
    expect(auth?.isAgent).toBe(false);
    expect(auth?.createdAt).toEqual(new Date('2025-01-01T00:00:00.000Z'));
  });

  it('returns null when x-user-id missing', () => {
    const headers = new Headers({ 'x-human-verified': 'true' });
    expect(getAuthFromRequest(headers)).toBeNull();
  });
});
