import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
export function verifyEmailSignature(
  body: string,
  headers: Headers,
  secret: string,
  now = Date.now(),
) {
  const id = headers.get("svix-id") || "",
    stamp = headers.get("svix-timestamp") || "";
  if (
    !/^msg_[a-zA-Z0-9_-]{1,200}$/.test(id) ||
    !/^\d{10,12}$/.test(stamp) ||
    Math.abs(now / 1000 - Number(stamp)) > 300 ||
    !/^whsec_[a-zA-Z0-9+/=]+$/.test(secret)
  )
    throw new Error("Invalid webhook signature");
  const expected = createHmac("sha256", Buffer.from(secret.slice(6), "base64"))
    .update(`${id}.${stamp}.${body}`)
    .digest();
  const valid = (headers.get("svix-signature") || "")
    .split(" ")
    .some((part) => {
      const [version, encoded] = part.split(",");
      if (version !== "v1" || !encoded) return false;
      const actual = Buffer.from(encoded, "base64");
      return (
        actual.length === expected.length && timingSafeEqual(actual, expected)
      );
    });
  if (!valid) throw new Error("Invalid webhook signature");
  return id;
}
