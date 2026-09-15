/** Columns members must never set on create/update. */
export const PRIVILEGED_PROFILE_FIELDS = [
  "id",
  "uid",
  "is_admin",
  "isAdmin",
  "is_verified",
  "isVerified",
  "subscription_plan",
  "subscriptionPlan",
  "subscription_entitlements",
  "subscriptionEntitlements",
  "email",
] as const;

export const DISCOVERY_FIELDS = [
  "id",
  "display_name",
  "bio",
  "photo_url",
  "data_ai_hint",
  "location",
  "profession",
  "country",
  "region",
  "languages",
  "is_verified",
  "additional_photo_urls",
  "age_years",
  "created_at",
  "updated_at",
] as const;

export type PrivilegedField = (typeof PRIVILEGED_PROFILE_FIELDS)[number];

export function stripPrivilegedFields<T extends Record<string, unknown>>(
  input: T
): Omit<T, PrivilegedField> {
  const result = { ...input };
  for (const field of PRIVILEGED_PROFILE_FIELDS) {
    delete result[field];
  }
  return result;
}

export function isEmptyDefault(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
}

/** Keep existing column values when the incoming patch is an empty default. */
export function omitEmptyDefaults(
  patch: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (typeof value === "boolean" || typeof value === "number") {
      result[key] = value;
      continue;
    }
    if (isEmptyDefault(value)) continue;
    result[key] = value;
  }
  return result;
}
