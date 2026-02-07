/**
 * Basic auth placeholder for Mingle MVP.
 * Replace with real World Chain / World ID verification in production.
 */

export type AuthUser = {
  userId: string;
  isHumanVerified: boolean;
  isAgent: boolean;
  createdAt: Date;
};

const NEW_ACCOUNT_DAYS = 7;
const NEW_ACCOUNT_VOTE_WEIGHT = 0.5;
const DAILY_VOTE_LIMIT = 50;
/** Debate Room: max votes per user per dateKey (KST). */
export const DAILY_VOTE_LIMIT_DEBATE = 10;

/**
 * Get current user from request (placeholder: header or cookie).
 * In production: verify JWT / World ID and load from DB.
 */
export function getAuthFromRequest(headers: Headers): AuthUser | null {
  const userId = headers.get('x-user-id');
  const isHumanVerified = headers.get('x-human-verified') === 'true';
  const isAgent = headers.get('x-is-agent') === 'true';
  const createdAtHeader = headers.get('x-user-created-at');
  const createdAt = createdAtHeader ? new Date(createdAtHeader) : new Date();

  if (!userId) return null;
  return { userId, isHumanVerified, isAgent, createdAt };
}

/**
 * Get current user from request (stub for Debate Room and general API).
 * In production: replace with session/JWT + DB lookup.
 */
export function getCurrentUser(headers: Headers): AuthUser | null {
  return getAuthFromRequest(headers);
}

/**
 * Require authenticated user. Returns null if not authenticated.
 */
export function requireAuth(headers: Headers): AuthUser | null {
  return getAuthFromRequest(headers);
}

/**
 * Require verified human (for voting). Agents cannot vote.
 */
export function requireVerifiedHuman(headers: Headers): AuthUser | null {
  const user = getAuthFromRequest(headers);
  if (!user || user.isAgent || !user.isHumanVerified) return null;
  return user;
}

/**
 * Require agent (or human owning an agent) for proposing. For MVP we use isAgent to denote "can propose".
 */
export function requireCanPropose(headers: Headers): AuthUser | null {
  const user = getAuthFromRequest(headers);
  if (!user || !user.isAgent) return null;
  return user;
}

/**
 * Vote weight for anti-abuse: new accounts get reduced weight.
 */
export function getVoteWeight(user: AuthUser): number {
  const daysSinceCreation =
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation >= NEW_ACCOUNT_DAYS) return 1;
  return NEW_ACCOUNT_VOTE_WEIGHT;
}

export const authConstants = {
  NEW_ACCOUNT_DAYS,
  NEW_ACCOUNT_VOTE_WEIGHT,
  DAILY_VOTE_LIMIT,
} as const;
