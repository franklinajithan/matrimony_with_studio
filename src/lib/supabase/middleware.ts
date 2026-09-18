import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/biodata",
  "/messages",
  "/onboarding",
  "/profile-setup",
  "/settings",
  "/search",
  "/suggestions",
  "/admin",
];

const AUTH_ONLY_PREFIXES = ["/login", "/signup"];

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return true;
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function updateSession(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  let response = NextResponse.next({ request });

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = `next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(redirectUrl);
  }

  const isAuthPage = AUTH_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (user && isAuthPage && pathname !== "/signup/check-email") {
    const next = safeInternalPath(request.nextUrl.searchParams.get("next"), "/onboarding");
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (user && pathname === "/forgot-password") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
