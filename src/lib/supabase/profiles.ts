import { supabase } from "./client";
import { Timestamp } from "./timestamp";
import type { Profile, StoredPhoto } from "./types";
import { omitEmptyDefaults, stripPrivilegedFields } from "./privileged";
import { resolveMediaUrl } from "./storage";

type ProfileRow = Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function mapStoredPhotos(raw: unknown): StoredPhoto[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const photo = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const storagePath = typeof photo.storagePath === "string" ? photo.storagePath : undefined;
    const rawUrl = typeof photo.url === "string" ? photo.url : storagePath || "";
    return {
      id: String(photo.id || storagePath || `photo-${index}`),
      url: resolveMediaUrl(rawUrl),
      hint: typeof photo.hint === "string" ? photo.hint : "profile photo",
      storagePath,
    };
  });
}

function mapCommentNotifications(
  raw: unknown
): Profile["commentNotifications"] {
  if (!raw || typeof raw !== "object") return {};
  const result: Profile["commentNotifications"] = {};
  for (const [key, value] of Object.entries(raw as Record<string, any>)) {
    result[key] = {
      count: Number(value?.count || 0),
      lastSeen: Timestamp.fromISO(value?.lastSeen || value?.last_seen),
    };
  }
  return result;
}

export function mapProfile(row: ProfileRow | null): Profile | null {
  if (!row) return null;
  const id = String(row.id);
  const dob = asString(row.dob);
  const ageYears =
    typeof row.age_years === "number"
      ? row.age_years
      : row.age_years != null
        ? Number(row.age_years)
        : undefined;
  return {
    id,
    uid: id,
    email: (row.email as string | null) ?? null,
    displayName: asString(row.display_name),
    bio: asString(row.bio),
    photoURL: resolveMediaUrl(asString(row.photo_url)),
    dataAiHint: asString(row.data_ai_hint),
    location: asString(row.location),
    profession: asString(row.profession),
    height: asString(row.height),
    dob,
    ageYears: Number.isFinite(ageYears) ? ageYears : undefined,
    religion: asString(row.religion),
    caste: asString(row.caste),
    language: asString(row.language),
    hobbies: asString(row.hobbies),
    favoriteMovies: asString(row.favorite_movies),
    favoriteMusic: asString(row.favorite_music),
    educationLevel: asString(row.education_level),
    smokingHabits: asString(row.smoking_habits),
    drinkingHabits: asString(row.drinking_habits),
    sunSign: asString(row.sun_sign),
    moonSign: asString(row.moon_sign),
    nakshatra: asString(row.nakshatra),
    horoscopeInfo: asString(row.horoscope_info),
    horoscopeFileName: asString(row.horoscope_file_name),
    horoscopeFileUrl: resolveMediaUrl(asString(row.horoscope_file_url)),
    additionalPhotoUrls: mapStoredPhotos(row.additional_photo_urls),
    isAdmin: Boolean(row.is_admin),
    isVerified: Boolean(row.is_verified),
    isPublished: Boolean(row.is_published),
    onboardingStep: Number(row.onboarding_step || 0),
    onboardingDraft: (row.onboarding_draft as Record<string, unknown>) || {},
    country: asString(row.country),
    region: asString(row.region),
    languages: Array.isArray(row.languages) ? (row.languages as string[]) : [],
    relationshipIntentions: (row.relationship_intentions as Record<string, unknown>) || {},
    valuesLifestyle: (row.values_lifestyle as Record<string, unknown>) || {},
    culturalFamily: (row.cultural_family as Record<string, unknown>) || {},
    settlement: (row.settlement as Record<string, unknown>) || {},
    photoPrivacy: asString(row.photo_privacy, "members") as Profile["photoPrivacy"],
    lastSeenLikeNotificationsTimestamp: Timestamp.fromISO(
      row.last_seen_like_notifications_at as string | null
    ),
    lastSeenCommentNotificationsTimestamp: Timestamp.fromISO(
      row.last_seen_comment_notifications_at as string | null
    ),
    commentNotifications: mapCommentNotifications(row.comment_notifications),
    extra: (row.extra as Record<string, unknown>) || {},
    createdAt: Timestamp.fromISO(row.created_at as string | null),
    updatedAt: Timestamp.fromISO(row.updated_at as string | null),
  };
}

const CAMEL_TO_SNAKE: Record<string, string> = {
  displayName: "display_name",
  photoURL: "photo_url",
  dataAiHint: "data_ai_hint",
  favoriteMovies: "favorite_movies",
  favoriteMusic: "favorite_music",
  educationLevel: "education_level",
  smokingHabits: "smoking_habits",
  drinkingHabits: "drinking_habits",
  sunSign: "sun_sign",
  moonSign: "moon_sign",
  horoscopeInfo: "horoscope_info",
  horoscopeFileName: "horoscope_file_name",
  horoscopeFileUrl: "horoscope_file_url",
  additionalPhotoUrls: "additional_photo_urls",
  isAdmin: "is_admin",
  isVerified: "is_verified",
  isPublished: "is_published",
  onboardingStep: "onboarding_step",
  onboardingDraft: "onboarding_draft",
  photoPrivacy: "photo_privacy",
  lastSeenLikeNotificationsTimestamp: "last_seen_like_notifications_at",
  lastSeenCommentNotificationsTimestamp: "last_seen_comment_notifications_at",
  commentNotifications: "comment_notifications",
  relationshipIntentions: "relationship_intentions",
  valuesLifestyle: "values_lifestyle",
  culturalFamily: "cultural_family",
  email: "email",
  bio: "bio",
  location: "location",
  profession: "profession",
  height: "height",
  dob: "dob",
  religion: "religion",
  caste: "caste",
  language: "language",
  hobbies: "hobbies",
  nakshatra: "nakshatra",
  country: "country",
  region: "region",
  languages: "languages",
  settlement: "settlement",
};

const IGNORE_KEYS = new Set([
  "id",
  "uid",
  "searchTerms",
  "createdAt",
  "updatedAt",
  "search_text",
  "ageYears",
  "age_years",
  "isAdmin",
  "is_admin",
  "isVerified",
  "is_verified",
  "subscriptionPlan",
  "subscription_plan",
  "subscriptionEntitlements",
  "subscription_entitlements",
  "email",
  "isPublished",
  "is_published",
]);

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

export function profileInputToRow(userData: Record<string, any>): Record<string, unknown> {
  const sanitized = stripPrivilegedFields(userData);
  const row: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(sanitized)) {
    if (IGNORE_KEYS.has(key) || value === undefined) continue;
    const column = CAMEL_TO_SNAKE[key] || (key.includes("_") ? key : null);
    if (!column) continue;
    if (IGNORE_KEYS.has(column)) continue;

    if (
      column === "last_seen_like_notifications_at" ||
      column === "last_seen_comment_notifications_at"
    ) {
      row[column] = toIso(value);
    } else if (column === "comment_notifications" && value && typeof value === "object") {
      row[column] = Object.fromEntries(
        Object.entries(value as Record<string, any>).map(([noteKey, note]) => [
          noteKey,
          {
            count: Number(note?.count || 0),
            lastSeen: toIso(note?.lastSeen || note?.last_seen),
          },
        ])
      );
    } else {
      row[column] = value;
    }
  }

  return omitEmptyDefaults(row);
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data: own, error: ownError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (ownError) throw ownError;
  if (own) return mapProfile(own);

  const { data: published, error: publishedError } = await supabase
    .from("discovery_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (publishedError) throw publishedError;
  return mapProfile(published);
}

export async function listProfiles(options?: {
  limit?: number;
  offset?: number;
  excludeId?: string;
}): Promise<Profile[]> {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from("discovery_profiles")
    .select("*")
    .order("display_name", { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (options?.excludeId) {
    query = query.neq("id", options.excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => mapProfile(row)!);
}

export async function listProfilesByIds(ids: string[]): Promise<Profile[]> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return [];
  const { data, error } = await supabase.from("discovery_profiles").select("*").in("id", unique);
  if (error) throw error;
  return (data || []).map((row) => mapProfile(row)!);
}

export async function searchProfiles(term: string, limit = 20): Promise<Profile[]> {
  const cleaned = term.trim();
  if (!cleaned) return [];
  const pattern = `%${cleaned.replace(/[%_,]/g, " ").trim()}%`;

  const { data, error } = await supabase
    .from("discovery_profiles")
    .select("*")
    .or(
      `display_name.ilike."${pattern}",profession.ilike."${pattern}",location.ilike."${pattern}"`
    )
    .order("display_name", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((row) => mapProfile(row)!);
}

export async function createUserProfile(userId: string, userData: Record<string, any>) {
  const row = {
    id: userId,
    ...profileInputToRow(userData),
  };
  const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
  if (error) throw error;
  return true;
}

export async function updateUserProfile(userId: string, userData: Record<string, any>) {
  const row = profileInputToRow(userData);
  if (Object.keys(row).length === 0) return true;
  const { error } = await supabase.from("profiles").update(row).eq("id", userId);
  if (error) throw error;
  return true;
}

export async function updateAllUsersSearchTerms() {
  return true;
}

export function subscribeToProfiles(
  onChange: (profiles: Profile[]) => void,
  onError?: (error: Error) => void
): () => void {
  const load = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("display_name", { ascending: true, nullsFirst: false });
      if (error) throw error;
      onChange((data || []).map((row) => mapProfile(row)!));
    } catch (error) {
      onError?.(error as Error);
    }
  };

  void load();
  const channel = supabase
    .channel("profiles-admin")
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
      void load();
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
