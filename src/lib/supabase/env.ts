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
  const configured = stripQuotes(process.env.NEXT_PUBLIC_SITE_URL)?.replace(/\/$/, "");
  if (configured) return configured;

  // Localhost is useful only while deliberately running the development server.
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    return window.location.origin;
  }

  // Never generate production auth emails with a localhost redirect if the
  // environment variable is accidentally missing from a deployment.
  return PRODUCTION_SITE_URL;
}
