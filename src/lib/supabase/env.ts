const stripQuotes = (value?: string) => value?.replace(/^["']|["']$/g, "");

export function getSupabaseUrl(): string {
  return stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_URL) || "";
}

export function getSupabaseAnonKey(): string {
  return (
    stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    ""
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function getSiteUrl(): string {
  return (
    stripQuotes(process.env.NEXT_PUBLIC_SITE_URL) ||
    (typeof window !== "undefined" ? window.location.origin : "")
  );
}
