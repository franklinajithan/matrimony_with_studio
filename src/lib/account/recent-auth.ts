/** Only call with a token verified by Auth, never with an unverified browser JWT. */
export function hasRecentAuthentication(claims: { amr?: { method: string; timestamp: number }[] }, now = Date.now()) {
  return claims.amr?.some(({ method, timestamp }) =>
    ['password', 'otp', 'oauth', 'totp'].includes(method) && Number.isFinite(timestamp) &&
    timestamp * 1000 <= now + 30_000 && now - timestamp * 1000 <= 5 * 60_000
  ) === true;
}
