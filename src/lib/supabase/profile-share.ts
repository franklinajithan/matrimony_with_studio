import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { resolveMediaUrl } from "@/lib/supabase/storage";

export const PROFILE_SHARE_TTL_MS = 24 * 60 * 60 * 1000;
export const PROFILE_SHARE_MAX_ACTIVE = 3;
export const PROFILE_SHARE_MAX_CREATE_PER_DAY = 10;

/** Limited public payload for a valid temporary profile share. */
export type SharedProfilePublic = {
  linkId: string;
  profileId: string;
  expiresAt: string;
  displayName: string;
  age: number | null;
  location: string | null;
  profession: string | null;
  bio: string | null;
  photoURL: string | null;
  isVerified: boolean;
};

export type ProfileShareLinkRow = {
  id: string;
  profileId: string;
  ownerId: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
};

function createRawShareToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  // URL-safe base64 without padding
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** SHA-256 hex digest of the raw token (what we store / look up). */
export async function hashShareToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token.trim());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function isPlausibleToken(token: string): boolean {
  // 32 bytes → ~43 base64url chars; accept hex legacy length too
  return /^[A-Za-z0-9_-]{32,64}$/.test(token.trim());
}

function mapResolved(row: Record<string, unknown>): SharedProfilePublic {
  const ageRaw = row.age_years;
  const age =
    typeof ageRaw === "number" && Number.isFinite(ageRaw)
      ? ageRaw
      : ageRaw != null && Number.isFinite(Number(ageRaw))
        ? Number(ageRaw)
        : null;

  return {
    linkId: String(row.link_id),
    profileId: String(row.profile_id),
    expiresAt: String(row.expires_at),
    displayName: String(row.display_name || "Member").slice(0, 80),
    age: age != null && age >= 18 && age <= 120 ? age : null,
    location: typeof row.location === "string" && row.location.trim() ? row.location.trim().slice(0, 120) : null,
    profession:
      typeof row.profession === "string" && row.profession.trim()
        ? row.profession.trim().slice(0, 120)
        : null,
    bio: typeof row.bio === "string" && row.bio.trim() ? row.bio.trim().slice(0, 600) : null,
    photoURL: resolveMediaUrl(
      typeof row.photo_url === "string" && row.photo_url.trim() ? row.photo_url.trim() : ""
    ) || null,
    isVerified: Boolean(row.is_verified),
  };
}

/** Anon-capable client for public token resolution (no cookies required). */
function createAnonClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) throw new Error("Supabase is not configured.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Server-side resolve: hash token → RPC. Returns null for invalid/expired/revoked/
 * unpublished profiles. Never returns private fields.
 */
export async function resolveSharedProfile(
  rawToken: string
): Promise<SharedProfilePublic | null> {
  if (!isPlausibleToken(rawToken)) return null;
  const tokenHash = await hashShareToken(rawToken);
  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("resolve_profile_share", {
    p_token_hash: tokenHash,
  });
  if (error) {
    console.error("resolve_profile_share failed", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  return mapResolved(row as Record<string, unknown>);
}

export async function createProfileShareLink(ownerId: string): Promise<{
  token: string;
  urlPath: string;
  expiresAt: string;
  linkId: string;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user || user.id !== ownerId) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, is_published, display_name")
    .eq("id", ownerId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error("Profile not found");
  if (!profile.is_published) {
    throw new Error("Publish your profile before sharing a temporary link.");
  }

  const now = Date.now();
  const dayAgo = new Date(now - PROFILE_SHARE_TTL_MS).toISOString();

  const { count: createdToday, error: countDayError } = await supabase
    .from("profile_share_links")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .gte("created_at", dayAgo);
  if (countDayError) throw countDayError;
  if ((createdToday ?? 0) >= PROFILE_SHARE_MAX_CREATE_PER_DAY) {
    throw new Error("Share limit reached. Try again later.");
  }

  const { count: activeCount, error: activeError } = await supabase
    .from("profile_share_links")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString());
  if (activeError) throw activeError;
  if ((activeCount ?? 0) >= PROFILE_SHARE_MAX_ACTIVE) {
    throw new Error(
      "You already have the maximum number of active share links. Revoke one to create another."
    );
  }

  const token = createRawShareToken();
  const tokenHash = await hashShareToken(token);
  const expiresAt = new Date(now + PROFILE_SHARE_TTL_MS).toISOString();

  const { data: inserted, error: insertError } = await supabase
    .from("profile_share_links")
    .insert({
      profile_id: ownerId,
      owner_id: ownerId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select("id, expires_at")
    .single();
  if (insertError) throw insertError;

  return {
    token,
    urlPath: `/share/profile/${token}`,
    expiresAt: inserted.expires_at as string,
    linkId: inserted.id as string,
  };
}

export async function revokeProfileShareLink(linkId: string, ownerId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== ownerId) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("profile_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("owner_id", ownerId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Share link not found or already revoked.");
}

export async function listActiveProfileShareLinks(
  ownerId: string
): Promise<ProfileShareLinkRow[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== ownerId) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("profile_share_links")
    .select("id, profile_id, owner_id, expires_at, revoked_at, created_at")
    .eq("owner_id", ownerId)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data || []).map((row) => ({
    id: String(row.id),
    profileId: String(row.profile_id),
    ownerId: String(row.owner_id),
    expiresAt: String(row.expires_at),
    revokedAt: row.revoked_at ? String(row.revoked_at) : null,
    createdAt: String(row.created_at),
  }));
}
