import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";

/** Never import into client components. Call only after server authorization. */
export function createSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Permanent deletion is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
