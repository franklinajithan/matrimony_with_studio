import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const deny = (status: number) => NextResponse.json({ error: status === 401 ? "Sign in required" : "Photo unavailable" }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Future private-media access endpoint. Never use this for the public "media"
 * bucket. It issues a five-minute signed URL only for an owner's registered
 * primary photo stored in the separate private "media-private" bucket.
 */
export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("memberId");
  if (!memberId || !uuid.test(memberId)) return deny(404);
  const client = await createSupabaseServerClient();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return deny(401);
  const viewerId = auth.user.id;

  // The viewer's active session is enforced by the database access policies.
  const { data: viewer, error: viewerError } = await client
    .from("profiles").select("id,deletion_requested_at,suspended_at").eq("id", viewerId).maybeSingle();
  if (viewerError || !viewer || viewer.deletion_requested_at || viewer.suspended_at) return deny(403);

  let admin;
  try { admin = createSupabaseAdminClient(); } catch { return deny(503); }
  const { data: profile, error } = await admin.from("profiles")
    .select("id,photo_url,photo_privacy,is_published,suspended_at,deletion_requested_at")
    .eq("id", memberId).maybeSingle();
  if (error || !profile || profile.suspended_at || profile.deletion_requested_at) return deny(404);
  const isOwner = viewerId === memberId;
  if (!isOwner && !profile.is_published) return deny(404);
  if (!isOwner && profile.photo_privacy === "hidden") return deny(403);
  if (!isOwner && profile.photo_privacy === "connections") {
    const a = viewerId < memberId ? viewerId : memberId;
    const b = viewerId < memberId ? memberId : viewerId;
    const { data: connection, error: connectionError } = await admin.from("connections")
      .select("member_a_id").eq("member_a_id", a).eq("member_b_id", b).maybeSingle();
    if (connectionError || !connection) return deny(403);
  }

  const value = String(profile.photo_url || "");
  const marker = "/object/public/media-private/";
  const signedMarker = "/object/sign/media-private/";
  const storagePath = value.startsWith(`users/${memberId}/`) ? value
    : value.includes(marker) ? value.split(marker)[1].split("?")[0]
    : value.includes(signedMarker) ? value.split(signedMarker)[1].split("?")[0] : "";
  if (!storagePath || !storagePath.startsWith(`users/${memberId}/`) || storagePath.includes("..")) return deny(404);
  const { data: signed, error: signError } = await admin.storage.from("media-private").createSignedUrl(storagePath, 300);
  if (signError || !signed?.signedUrl) return deny(404);
  return NextResponse.json({ url: signed.signedUrl, expiresIn: 300 }, { headers: { "Cache-Control": "no-store, private" } });
}
