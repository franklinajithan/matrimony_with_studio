import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serviceClient, serviceConfigured } from "@/lib/supabase/service";
import { extractStoragePath } from "@/lib/supabase/storage";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const path = q.get("path");
  if (
    !path ||
    path.length > 400 ||
    path.includes("..") ||
    !/^(users|success_stories)\/[a-zA-Z0-9_./-]+$/.test(path)
  )
    return new NextResponse(null, { status: 404 });
  const db = await createSupabaseServerClient();
  let storage = db;
  const token = q.get("token");
  if (token) {
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(token) || !serviceConfigured())
      return new NextResponse(null, { status: 404 });
    let allowed = false;
    if (q.get("shareType") === "profile") {
      const result = await db.rpc("resolve_profile_share", {
        p_token_hash: createHash("sha256").update(token).digest("hex"),
      });
      const row = Array.isArray(result.data) ? result.data[0] : null;
      allowed = !!row && extractStoragePath(row.photo_url) === path;
    } else if (q.get("shareType") === "biodata") {
      const result = await db.rpc("resolve_biodata_share", { p_token: token });
      const row = Array.isArray(result.data) ? result.data[0] : null;
      allowed =
        !!row &&
        row.snapshot?.visibility?.includePhoto === true &&
        extractStoragePath(row.snapshot?.content?.photoUrl) === path;
    }
    if (!allowed) return new NextResponse(null, { status: 404 });
    storage = serviceClient();
  }
  if (!token) {
    const permission = await db.rpc("media_reference_allowed", {
      p_path: path,
    });
    if (permission.error || permission.data !== true)
      return new NextResponse(null, { status: 404 });
    if (serviceConfigured()) storage = serviceClient();
  }
  const result = await storage.storage.from("media").download(path);
  if (result.error || !result.data)
    return new NextResponse(null, { status: 404 });
  const type = result.data.type;
  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ].includes(type)
  )
    return new NextResponse(null, { status: 415 });
  return new NextResponse(result.data, {
    headers: {
      "Content-Type": type,
      "Content-Disposition":
        type === "application/pdf"
          ? 'attachment; filename="document.pdf"'
          : "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'",
      "Referrer-Policy": "no-referrer",
    },
  });
}
