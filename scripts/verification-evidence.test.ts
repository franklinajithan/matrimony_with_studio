import assert from "node:assert/strict";
import test from "node:test";
import { verificationStatus } from "../src/lib/auth/verification-status";

test("each verification status requires its own evidence", () => {
  const reviewed = verificationStatus({ email: "member@example.test", email_confirmed_at: "confirmed", phone: "+447700900000" }, { status: "approved", reviewed_at: "reviewed" });
  assert.deepEqual(reviewed, { emailConfirmed: true, phoneConfirmed: false, profileReviewed: true, identityChecked: null });

  const rejected = verificationStatus({ email_confirmed_at: "stale", phone: "+447700900000", phone_confirmed_at: "confirmed" }, { status: "rejected", reviewed_at: "reviewed" });
  assert.deepEqual(rejected, { emailConfirmed: false, phoneConfirmed: true, profileReviewed: false, identityChecked: null });
  assert.equal(verificationStatus({}, { status: "approved", reviewed_at: null }).profileReviewed, false);
});
