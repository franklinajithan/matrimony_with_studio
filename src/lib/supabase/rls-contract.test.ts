import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DISCOVERY_FIELDS } from "@/lib/supabase/privileged";

const sql = fs.readFileSync(
  path.resolve(process.cwd(), "supabase/migrations/20260915_phase2a_auth_onboarding.sql"),
  "utf8"
);

describe("Phase 2A SQL policies", () => {
  it("keeps unpublished profiles out of discovery and private fields off the view", () => {
    expect(sql).toContain("profiles_select_own_or_admin");
    expect(sql).toContain("id = auth.uid() or public.is_admin()");
    expect(sql).toContain("where is_published = true");
    expect(sql).toContain("revoke all on table public.profiles from anon");
    expect(sql).toContain("grant select on table public.discovery_profiles to authenticated");
    expect(sql).not.toMatch(/profiles_select_public[\s\S]*using \(true\)/);
    expect(sql).toContain("Members cannot change subscription entitlements");
    expect(sql).toContain("media_insert_own_folder");
    expect(sql).toContain("set public = false");
    for (const field of DISCOVERY_FIELDS) {
      expect(sql).toContain(field);
    }
    expect(sql).toContain("public.age_from_dob(dob) as age_years");
    expect(sql).toContain("grant select on table public.discovery_profiles to authenticated");
  });
});
