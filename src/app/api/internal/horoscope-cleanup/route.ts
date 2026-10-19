import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { json } from "@/lib/horoscope/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") || "";
  const expected = Buffer.from(`Bearer ${secret || ""}`);
  const supplied = Buffer.from(header);
  if (
    !secret ||
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  )
    return json({ error: "Forbidden" }, 403);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    return json({ error: "Cleanup backend not configured" }, 503);
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.rpc("horoscope_cleanup_candidates");
  if (error) return json({ error: "Cleanup unavailable" }, 503);
  if (data?.length) {
    const { error: remove } = await db.storage
      .from("horoscope-private")
      .remove(data.map((d: { storage_path: string }) => d.storage_path));
    if (remove)
      return json({ error: "Source deletion failed; will retry" }, 503);
  }
  const { error: metadata } = await db.rpc("horoscope_cleanup_metadata");
  if (metadata)
    return json({ error: "Metadata cleanup failed; will retry" }, 503);
  return json({ removed: data?.length || 0 });
}
