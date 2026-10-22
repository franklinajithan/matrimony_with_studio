import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Collect before deleting, otherwise removing objects shifts subsequent pages.
async function removeFolder(db: SupabaseClient, bucket: string, prefix: string) {
  const paths: string[] = [];
  async function visit(folder: string) {
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await db.storage.from(bucket).list(folder, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
      if (error) throw new Error("File cleanup unavailable");
      for (const item of data || []) {
        const path = `${folder}/${item.name}`;
        if (item.id) paths.push(path);
        else await visit(path);
      }
      if (!data || data.length < 100) break;
    }
  }
  await visit(prefix);
  for (let offset = 0; offset < paths.length; offset += 100) {
    const { error } = await db.storage.from(bucket).remove(paths.slice(offset, offset + 100));
    if (error) throw new Error("File cleanup failed");
  }
}

export async function POST(request: Request) {
  const admin = await requireServerAdmin();
  if (!admin) return json({ error: "Forbidden" }, 403);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Invalid origin" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const { memberId, email } = body || {};
  if (typeof memberId !== "string" || !uuid.test(memberId) || typeof email !== "string" || !email.trim()) return json({ error: "Member and confirmation email required" }, 400);
  if (memberId === admin.id) return json({ error: "You cannot delete your own administrator account" }, 403);
  try {
    const db = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await db.from("profiles").select("id,is_admin").eq("id", memberId).single();
    if (profileError || !profile) return json({ error: "Member not found" }, 404);
    if (profile.is_admin) return json({ error: "Administrator accounts cannot be deleted here" }, 403);
    const { data: account, error: accountError } = await db.auth.admin.getUserById(memberId);
    if (accountError || !account.user?.email) return json({ error: "Unable to verify login account" }, 503);
    if (account.user.email.toLowerCase() !== email.trim().toLowerCase()) return json({ error: "Confirmation email does not match the account" }, 400);

    const [current, legacy] = await Promise.all([
      db.from("member_subscriptions").select("stripe_subscription_id,status").eq("user_id", memberId),
      db.from("user_subscriptions").select("provider_subscription_id,status").eq("user_id", memberId),
    ]);
    if (current.error || legacy.error) throw new Error("Billing check failed");
    const ended = new Set(["canceled", "cancelled", "expired", "refunded"]);
    if (current.data?.some(s => s.stripe_subscription_id && !ended.has(s.status)) || legacy.data?.some(s => s.provider_subscription_id && !ended.has(s.status))) {
      return json({ error: "Cancel the paid subscription with the payment provider before deleting this member" }, 409);
    }

    // Ban first to prevent fresh sign-ins during cleanup. A failed cleanup can be retried.
    const { error: banError } = await db.auth.admin.updateUserById(memberId, { ban_duration: "876000h" });
    if (banError) throw new Error("Unable to disable login");
    const { data: buckets, error: bucketsError } = await db.storage.listBuckets();
    if (bucketsError) throw new Error("Unable to check uploaded files");
    for (const [bucket, prefix] of [["media", `users/${memberId}`], ["horoscope-private", memberId]]) {
      if (buckets?.some(b => b.id === bucket)) await removeFolder(db, bucket, prefix);
    }
    // These rows use SET NULL rather than CASCADE and may contain personal payloads.
    const { error: storiesError } = await db.from("success_stories").delete().eq("submitted_by_uid", memberId);
    if (storiesError) throw new Error("Unable to remove member stories");
    const { error: eventsError } = await db.from("subscription_events").delete().eq("user_id", memberId);
    if (eventsError) throw new Error("Unable to remove billing events");
    // Retain administrative action/timestamp, but erase profile changes and identifiers.
    const { error: auditError } = await db.from("admin_audit_log").update({ metadata: {}, target_id: null }).eq("target_id", memberId);
    if (auditError) throw new Error("Unable to erase audit details");
    // Hard deletion releases the email. FK cascades remove profile, chats, photos'
    // references, preferences, connections, subscriptions and horoscope records.
    const { error: deleteError } = await db.auth.admin.deleteUser(memberId, false);
    if (deleteError) throw new Error("Account deletion failed");
    return json({ message: "Member permanently deleted. The same email can now register a new account." });
  } catch {
    return json({ error: "Permanent deletion could not complete. The account may be disabled and some files removed. Retry deletion; contact support if it continues." }, 503);
  }
}
