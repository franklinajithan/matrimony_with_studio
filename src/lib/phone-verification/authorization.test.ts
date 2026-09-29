import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260929180000_phone_verification.sql"), "utf8");
const sendRoute = fs.readFileSync(path.resolve(process.cwd(), "src/app/api/phone-verification/send-otp/route.ts"), "utf8");
const verifyRoute = fs.readFileSync(path.resolve(process.cwd(), "src/app/api/phone-verification/verify-otp/route.ts"), "utf8");

describe("phone verification security contract", () => {
  it("keeps verification state server controlled", () => {
    expect(migration).toContain("Members cannot set phone verification state directly");
    expect(migration).toContain("Phone verification state is server controlled");
    expect(migration).toContain("sync_verified_phone_from_auth");
    expect(migration).toContain("from auth.users where id=v_uid");
    expect(migration).toContain("grant execute on function public.sync_verified_phone_from_auth() to authenticated");
  });
  it("does not recreate or widen discovery profiles", () => {
    expect(migration).not.toMatch(/create\s+(or\s+replace\s+)?view\s+public\.discovery_profiles/i);
    expect(migration).not.toContain("phone_verification_codes");
  });
  it("delegates OTP generation and delivery to Supabase Auth", () => {
    expect(sendRoute).toContain("supabase.auth.updateUser({ phone })");
    expect(sendRoute).not.toContain("Math.random");
    expect(sendRoute).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(verifyRoute).toContain('type: "phone_change"');
    expect(verifyRoute).toContain('supabase.rpc("sync_verified_phone_from_auth")');
  });
});
