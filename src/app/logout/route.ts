import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/auth/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeInternalPath(searchParams.get("next"), "/");

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL(next, origin));
  const jar = await cookies();
  for (const cookie of jar.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
      });
    }
  }

  return response;
}
