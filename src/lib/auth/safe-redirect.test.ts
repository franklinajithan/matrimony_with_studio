import { describe, expect, it } from "vitest";
import { loginUrl, safeInternalPath } from "@/lib/auth/safe-redirect";

describe("safeInternalPath", () => {
  it("allows in-app relative paths", () => {
    expect(safeInternalPath("/onboarding")).toBe("/onboarding");
    expect(safeInternalPath("/dashboard/edit-profile")).toBe("/dashboard/edit-profile");
  });

  it("rejects open redirects", () => {
    expect(safeInternalPath("https://evil.example")).toBe("/dashboard");
    expect(safeInternalPath("//evil.example")).toBe("/dashboard");
    expect(safeInternalPath("/\\evil.example")).toBe("/dashboard");
    expect(safeInternalPath("login")).toBe("/dashboard");
  });

  it("rejects auth callback loops", () => {
    expect(safeInternalPath("/auth/callback")).toBe("/dashboard");
    expect(safeInternalPath("/login?next=/dashboard")).toBe("/dashboard");
  });

  it("builds a login url with a safe next param", () => {
    expect(loginUrl("/onboarding")).toBe("/login?next=%2Fonboarding");
    expect(loginUrl("https://evil.example")).toBe("/login");
  });
});
