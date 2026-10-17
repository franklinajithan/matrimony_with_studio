import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validOrigin } from "@/lib/admin/http";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .max(100000)
    .safeParse(new URL(request.url).searchParams.get("page") || 1);
  if (!page.success)
    return NextResponse.json(
      { error: "Invalid page" },
      { status: 400, headers },
    );
  const db = await createSupabaseServerClient(),
    { data: auth, error } = await db.auth.getUser();
  if (error || !auth.user)
    return NextResponse.json(
      { error: "Your session expired. Sign in again." },
      { status: 401, headers },
    );
  const saved = await db
    .from("shortlist")
    .select("id,shortlisted_id,created_at", { count: "exact" })
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((page.data - 1) * 20, page.data * 20 - 1);
  if (saved.error)
    return NextResponse.json(
      { error: "Unable to load your shortlist. Please retry." },
      { status: 503, headers },
    );
  const ids = (saved.data || []).map((row) => row.shortlisted_id as string);
  // The privacy-safe discovery projection excludes blocked, unpublished, paused and suspended people.
  const profiles = ids.length
    ? await db
        .from("discovery_profiles")
        .select("id,display_name,photo_url,location,profession")
        .in("id", ids)
    : { data: [], error: null };
  if (profiles.error)
    return NextResponse.json(
      { error: "Unable to load profiles. Please retry." },
      { status: 503, headers },
    );
  return NextResponse.json(
    {
      total: saved.count || 0,
      page: page.data,
      items: (saved.data || []).map((row) => ({
        id: row.id,
        profileId: row.shortlisted_id,
        savedAt: row.created_at,
        profile:
          profiles.data?.find((person) => person.id === row.shortlisted_id) ||
          null,
      })),
    },
    { headers },
  );
}
export async function DELETE(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json(
      { error: "Invalid origin" },
      { status: 403, headers },
    );
  const parsed = z
    .object({ id: z.string().uuid() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid shortlist item" },
      { status: 400, headers },
    );
  const db = await createSupabaseServerClient(),
    { data: auth, error } = await db.auth.getUser();
  if (error || !auth.user)
    return NextResponse.json(
      { error: "Sign in again" },
      { status: 401, headers },
    );
  const result = await db
    .from("shortlist")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", auth.user.id)
    .select("id");
  if (result.error)
    return NextResponse.json(
      { error: "Unable to remove this item. Please retry." },
      { status: 503, headers },
    );
  return NextResponse.json({ removed: !!result.data?.length }, { headers });
}
