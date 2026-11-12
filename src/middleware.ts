import { type NextFetchEvent, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

import { publicNavigationCountry, recordCountryPageLoad } from "@/lib/analytics/country-traffic";

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const response = await updateSession(request);
  const country = response.ok ? publicNavigationCountry(request) : null;
  if (country) event.waitUntil(recordCountryPageLoad(country));
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
