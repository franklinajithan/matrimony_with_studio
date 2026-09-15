import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./env";

export { isSupabaseConfigured, getSupabaseAnonKey, getSupabaseUrl } from "./env";

function createBrowserSupabase(): SupabaseClient {
  const url = getSupabaseUrl() || "https://placeholder.supabase.co";
  const key = getSupabaseAnonKey() || "placeholder-anon-key";

  if (typeof window === "undefined") {
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return createBrowserClient(url, key, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
    },
  });
}

export const supabase: SupabaseClient = createBrowserSupabase();
