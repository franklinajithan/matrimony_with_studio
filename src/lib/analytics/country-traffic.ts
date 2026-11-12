import { type NextRequest } from "next/server";
import { searchPages } from "./pages";
import { getSupabaseUrl } from "@/lib/supabase/env";

const publicPages = new Set(searchPages);

export function publicNavigationCountry(request: NextRequest): string | null {
  if (request.method !== "GET" || request.headers.get("sec-fetch-mode") !== "navigate"
    || request.headers.get("sec-fetch-dest") !== "document") return null;
  if (!publicPages.has(request.nextUrl.pathname.replace(/\/$/, "") || "/")) return null;
  if (request.cookies.get("cm_analytics")?.value === "no") return null;
  if (request.headers.has("next-router-prefetch") || request.headers.has("rsc")
    || /prefetch|prerender/i.test(request.headers.get("sec-purpose") ?? request.headers.get("purpose") ?? "")
    || /bot|crawler|spider|headless/i.test(request.headers.get("user-agent") ?? "")) return null;

  const country = request.headers.get("x-vercel-ip-country");
  return country && /^[A-Z]{2}$/.test(country) && country !== "XX" ? country : "ZZ";
}

export async function recordCountryPageLoad(country: string) {
  try {
    const url = getSupabaseUrl();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return;
    const response = await fetch(new URL("/rest/v1/rpc/record_country_page_load", url), {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_country: country }),
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!response.ok) console.warn("Country traffic counter could not be saved", response.status);
  } catch {
    console.warn("Country traffic counter request failed");
  }
}
