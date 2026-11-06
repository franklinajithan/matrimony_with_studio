import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify Stripe-Signature against the exact raw request body. Never parse JSON
 * or trust client redirects before this check. This alone does not imply a
 * payment is settled or that membership may be granted.
 */
export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  signingSecret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!signingSecret.startsWith('whsec_') || !signatureHeader) return false;
  const parts = signatureHeader.split(',').map(x => x.trim());
  const timestamp = parts.find(x => x.startsWith('t='))?.slice(2);
  if (!timestamp || !/^\d{10,}$/.test(timestamp)) return false;
  const time = Number(timestamp);
  if (!Number.isSafeInteger(time) || Math.abs(nowSeconds - time) > 300) return false;
  const versions = parts.filter(x => x.startsWith('v1=')).map(x => x.slice(3));
  if (!versions.length) return false;
  const expected = createHmac('sha256', signingSecret).update(`${timestamp}.${rawBody}`, 'utf8').digest();
  return versions.some(hex => {
    if (!/^[0-9a-f]{64}$/i.test(hex)) return false;
    const supplied = Buffer.from(hex, 'hex');
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  });
}
