const stripQuotes = (value?: string) => value?.replace(/^["']|["']$/g, "");

const PRODUCTION_SITE_URL = "https://matrimony-with-studio.vercel.app";

export function getSupabaseUrl(): string {
  return stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_URL) || "";
}

export function getSupabaseAnonKey(): string {
  return (
    stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    ""
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function getSiteUrl(): string {
  // OAuth initiated in the browser must return to the exact origin that
  // initiated sign-in, including preview and custom domains. Otherwise the
  // PKCE verifier cookie remains on the original host and login fails.
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const configured = stripQuotes(process.env.NEXT_PUBLIC_SITE_URL)?.replace(/\/$/, "");
  if (configured) return configured;

  // Server-generated email links need a stable public fallback.
  return PRODUCTION_SITE_URL;
}
