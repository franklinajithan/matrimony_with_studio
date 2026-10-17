import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/notifications",
  "/support",
  "/family-circle",
  "/future-map",
  "/discover",
  "/interests",
  "/connections",
  "/verification",
  "/verify-phone",
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
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  let response = NextResponse.next({ request });
  const { pathname, search } = request.nextUrl;
  const finish = (target: NextResponse) => {
    if (target !== response) {
      response.cookies.getAll().forEach(cookie => target.cookies.set(cookie));
    }
    target.headers.set("Cache-Control", "private, no-store");
    return target;
  };
  const unavailable = () => finish(new NextResponse(
    "Sign-in is temporarily unavailable. Please refresh this page in a moment.",
    { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "30" } },
  ));

  if (!url || !key) {
    return isProtectedPath(pathname) ? unavailable() : finish(response);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options?: any }>,
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let user;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    if (result.error && (result.error.status || 0) >= 500 && isProtectedPath(pathname)) return unavailable();
  } catch {
    return isProtectedPath(pathname) ? unavailable() : finish(response);
  }

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = `next=${encodeURIComponent(`${pathname}${search}`)}`;
    return finish(NextResponse.redirect(redirectUrl));
  }

  const isAuthPage = AUTH_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (user && isAuthPage && pathname !== "/signup/check-email") {
    const next = safeInternalPath(
      request.nextUrl.searchParams.get("next"),
      "/dashboard",
    );
    return finish(NextResponse.redirect(new URL(next, request.url)));
  }

  return finish(response);
}
