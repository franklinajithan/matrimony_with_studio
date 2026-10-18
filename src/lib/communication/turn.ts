import "server-only";
import { createHmac } from "node:crypto";
/** Coturn TURN REST credentials: a user-bound ten-minute expiry, signed only on the server. */
export function turnServer(memberId: string, now = Date.now()) {
  const secret = process.env.TURN_AUTH_SECRET,
    url = process.env.TURN_URL;
  if (!secret || secret.length < 32 || !url || !/^turns?:[^\s]+$/.test(url))
    throw new Error("TURN service is not configured");
  const username = `${Math.floor(now / 1000) + 600}:${memberId}`;
  return {
    urls: url,
    username,
    credential: createHmac("sha1", secret).update(username).digest("base64"),
  };
}
export function callingConfigured() {
  return (
    process.env.CALLING_ENABLED === "true" &&
    !!process.env.TURN_URL &&
    (process.env.TURN_AUTH_SECRET?.length || 0) >= 32
  );
}
