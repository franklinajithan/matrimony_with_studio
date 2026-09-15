import { describe, expect, it } from "vitest";
import {
  DISCOVERY_FIELDS,
  omitEmptyDefaults,
  PRIVILEGED_PROFILE_FIELDS,
  stripPrivilegedFields,
} from "@/lib/supabase/privileged";

describe("privileged profile fields", () => {
  it("strips owner, role, verification and subscription fields", () => {
    const stripped = stripPrivilegedFields({
      displayName: "Amina",
      isAdmin: true,
      is_verified: true,
      subscription_plan: "elite",
      subscriptionEntitlements: { ai: true },
      email: "hidden@example.com",
      id: "other-user",
      bio: "Hello",
    });

    expect(stripped).toEqual({ displayName: "Amina", bio: "Hello" });
    expect(PRIVILEGED_PROFILE_FIELDS).toContain("is_admin");
    expect(PRIVILEGED_PROFILE_FIELDS).toContain("subscription_entitlements");
  });

  it("does not treat empty strings as updates", () => {
    expect(omitEmptyDefaults({ display_name: "Amina", bio: "", location: "  " })).toEqual({
      display_name: "Amina",
    });
  });

  it("keeps date of birth out of discovery columns", () => {
    expect(DISCOVERY_FIELDS).not.toContain("dob");
    expect(DISCOVERY_FIELDS).not.toContain("email");
    expect(DISCOVERY_FIELDS).not.toContain("is_admin");
    expect(DISCOVERY_FIELDS).toContain("age_years");
    expect(DISCOVERY_FIELDS).toContain("display_name");
  });
});
