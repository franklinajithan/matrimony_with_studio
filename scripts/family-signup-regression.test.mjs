import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const signup = readFileSync("src/app/(auth)/signup/signup-form.tsx", "utf8");
const auth = readFileSync("src/lib/supabase/auth.ts", "utf8");

test("email signup requires adult self-registration acknowledgement", () => {
  assert.match(signup, /adultConsent:\s*z\.boolean\(\)\.refine\(\(val\) => val === true/);
  assert.match(signup, /adultConsent:\s*false/);
  assert.match(signup, /name="adultConsent"/);
  assert.match(signup, /creating this account for myself/);
});

test("family guidance does not claim delegated access", () => {
  assert.match(signup, /href="\/family-assisted-matrimony"/);
  assert.match(signup, /adult member should register and control their own account/);
});

test("registration pause check remains in email signup", () => {
  assert.match(auth, /fetch\('\/api\/registration'/);
  assert.match(auth, /access\.enabled !== true/);
});

test("existing email confirmation handling remains", () => {
  assert.match(signup, /result\.needsEmailConfirmation/);
  assert.match(signup, /\/signup\/check-email/);
});
