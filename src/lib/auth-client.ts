/**
 * 클라이언트: World 로그인 후 저장된 userId를 API 요청 헤더로 사용.
 * localStorage 키: mingle_user_id, mingle_human_verified
 */

const USER_ID_KEY = 'mingle_user_id';
const HUMAN_VERIFIED_KEY = 'mingle_human_verified';

export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_ID_KEY);
}

export function isStoredHumanVerified(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(HUMAN_VERIFIED_KEY) === 'true';
}

export function setStoredAuth(userId: string, isHumanVerified: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_ID_KEY, userId);
  localStorage.setItem(HUMAN_VERIFIED_KEY, String(isHumanVerified));
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(HUMAN_VERIFIED_KEY);
  localStorage.removeItem('mingle_world_verified');
  localStorage.removeItem('mingle_display_token');
}

/** API 요청 시 넣을 헤더. 로그인 안 되어 있으면 빈 객체. */
export function getAuthHeaders(): Record<string, string> {
  const userId = getStoredUserId();
  if (!userId) return {};
  const headers: Record<string, string> = {
    'x-user-id': userId,
    'x-human-verified': isStoredHumanVerified() ? 'true' : 'false',
    'x-is-agent': 'false',
  };
  return headers;
}
