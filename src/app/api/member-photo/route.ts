import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const deny = (status: number) => NextResponse.json({ error: status === 401 ? "Sign in required" : "Photo unavailable" }, { status, headers: { "Cache-Control": "no-store" } });
/** Reserved for explicit media-private/<owner path> references, never legacy public media. */
export async function GET(request: NextRequest) {
 try {
  const memberId = request.nextUrl.searchParams.get("memberId");
  if (!memberId || !uuid.test(memberId)) return deny(404);
  const client = await createSupabaseServerClient();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return deny(401);
  const viewerId = auth.user.id;
  const live = await client.rpc("account_session_is_live");
  if (live.error || live.data !== true) return deny(403);
  const { data: viewer, error: viewerError } = await client.from("profiles").select("id,deletion_requested_at,suspended_at,deactivated_at").eq("id", viewerId).maybeSingle();
  if (viewerError || !viewer || viewer.deletion_requested_at || viewer.suspended_at || viewer.deactivated_at) return deny(403);
  if (viewerId !== memberId) {
    const blocked = await client.rpc("are_blocked", { user_a: viewerId, user_b: memberId });
    if (blocked.error || blocked.data !== false) return deny(403);
  }
  const admin = createSupabaseAdminClient();
  const { data: profile, error } = await admin.from("profiles").select("id,photo_url,photo_privacy,is_published,suspended_at,deletion_requested_at,deactivated_at").eq("id", memberId).maybeSingle();
  if (error || !profile || profile.suspended_at || profile.deletion_requested_at || profile.deactivated_at) return deny(404);
  const isOwner = viewerId === memberId;
  if (!isOwner && !profile.is_published) return deny(404);
  if (!isOwner && !["members", "connections"].includes(profile.photo_privacy)) return deny(403);
  if (!isOwner && profile.photo_privacy === "connections") {
    const a = viewerId < memberId ? viewerId : memberId, b = viewerId < memberId ? memberId : viewerId;
    const { data: connection, error: connectionError } = await admin.from("connections").select("member_a_id").eq("member_a_id", a).eq("member_b_id", b).maybeSingle();
    if (connectionError || !connection) return deny(403);
  }
  const value = String(profile.photo_url || ""), prefix = "media-private/";
  if (!value.startsWith(prefix)) return deny(404);
  const storagePath = value.slice(prefix.length);
  if (!storagePath.startsWith(`users/${memberId}/`) || /[%\\?#\u0000-\u0020]/.test(storagePath) || storagePath.split('/').some(part => !part || part === '.' || part === '..')) return deny(404);
  const { data: signed, error: signError } = await admin.storage.from("media-private").createSignedUrl(storagePath, 300);
  if (signError || !signed?.signedUrl) return deny(404);
  return NextResponse.json({ url: signed.signedUrl, expiresIn: 300 }, { headers: { "Cache-Control": "no-store, private" } });
 } catch { return deny(503); }
}
