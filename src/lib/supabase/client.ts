import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const stripQuotes = (value?: string) => value?.replace(/^["']|["']$/g, "");

const supabaseUrl =
  stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_URL) || "https://placeholder.supabase.co";
const supabaseAnonKey =
  stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || "placeholder-anon-key";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function isSupabaseConfigured(): boolean {
  return Boolean(
    stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      stripQuotes(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
