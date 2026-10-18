import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";
export function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !getSupabaseUrl())
    throw new Error("Server-side provider storage is not configured");
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function serviceConfigured() {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}
