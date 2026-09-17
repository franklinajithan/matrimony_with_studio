import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/supabase/server";
import { createProfileShareLink, listActiveProfileShareLinks, revokeProfileShareLink } from "@/lib/supabase/profile-share";

export const runtime = "nodejs";

export async function GET() {
  const user = await getServerAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const links = await listActiveProfileShareLinks(user.id);
    return NextResponse.json({ links });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not list share links." }, { status: 400 });
  }
}

/** Create a 48-hour token for the selected published profile. */
export async function POST(request: Request) {
  const user = await getServerAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let profileId = user.id;
    try {
      const body = (await request.json()) as { profileId?: string };
      if (typeof body.profileId === "string" && body.profileId.trim()) profileId = body.profileId.trim();
    } catch {
      // Keep backwards compatibility with the existing own-profile share action.
    }
    const created = await createProfileShareLink(user.id, profileId);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL)?.replace(/\/$/, "");
    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^https?:\/\//, "");
    const vercelHost = process.env.VERCEL_URL?.replace(/^https?:\/\//, "");
    const origin = appUrl || (productionHost ? `https://${productionHost}` : vercelHost ? `https://${vercelHost}` : null);
    return NextResponse.json({
      linkId: created.linkId,
      token: created.token,
      path: created.urlPath,
      url: origin ? `${origin}${created.urlPath}` : created.urlPath,
      expiresAt: created.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create share link.";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : message.toLowerCase().includes("limit") ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const user = await getServerAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let linkId = "";
  try {
    const body = (await request.json()) as { linkId?: string };
    linkId = typeof body.linkId === "string" ? body.linkId.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!linkId) return NextResponse.json({ error: "linkId is required." }, { status: 400 });
  try {
    await revokeProfileShareLink(linkId, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not revoke share link." }, { status: 400 });
  }
}