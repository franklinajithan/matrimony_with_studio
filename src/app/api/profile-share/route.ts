import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/supabase/server";
import {
  createProfileShareLink,
  listActiveProfileShareLinks,
  revokeProfileShareLink,
} from "@/lib/supabase/profile-share";

export const runtime = "nodejs";

/** List active share links for the signed-in member. */
export async function GET() {
  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const links = await listActiveProfileShareLinks(user.id);
    return NextResponse.json({ links });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not list share links.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Create a new 24-hour share link (raw token returned once). */
export async function POST() {
  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const created = await createProfileShareLink(user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    const vercelHost = process.env.VERCEL_URL?.replace(/^https?:\/\//, "");
    const origin = appUrl || (vercelHost ? `https://${vercelHost}` : null);

    return NextResponse.json({
      linkId: created.linkId,
      token: created.token,
      path: created.urlPath,
      url: origin ? `${origin}${created.urlPath}` : created.urlPath,
      expiresAt: created.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create share link.";
    const status =
      message.toLowerCase().includes("unauthorized")
        ? 401
        : message.toLowerCase().includes("limit")
          ? 429
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Revoke an active share link. Body: { linkId: string } */
export async function DELETE(request: Request) {
  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let linkId = "";
  try {
    const body = (await request.json()) as { linkId?: string };
    linkId = typeof body.linkId === "string" ? body.linkId.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!linkId) {
    return NextResponse.json({ error: "linkId is required." }, { status: 400 });
  }
  try {
    await revokeProfileShareLink(linkId, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not revoke share link.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
