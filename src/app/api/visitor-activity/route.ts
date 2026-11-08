import { NextRequest } from "next/server";
import { z } from "zod";
import { activityPage } from "@/lib/analytics/pages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const event = z.object({
  visit: z.string().uuid(),
  view: z.string().uuid(),
  page: z.string().max(80),
  source: z.enum(["Google", "Bing", "Other search", "Social", "Referral", "Direct", "Internal"]),
  seconds: z.number().int().min(0).max(14400),
});

function browserFamily(agent: string) {
  if (/Edg(?:e|A|iOS)?\//i.test(agent)) return "Edge";
  if (/OPR\/|Opera/i.test(agent)) return "Opera";
  if (/SamsungBrowser\//i.test(agent)) return "Samsung Internet";
  if (/Firefox\/|FxiOS\//i.test(agent)) return "Firefox";
  if (/Chrome\/|CriOS\//i.test(agent)) return "Chrome";
  return /Safari\//i.test(agent) ? "Safari" : "Other";
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin !== request.nextUrl.origin || request.cookies.get("cm_analytics")?.value !== "yes") {
    return new Response(null, { status: 403 });
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 403 });
  const body = await request.text();
  if (body.length > 512) return new Response(null, { status: 413 });
  let input: unknown;
  try { input = JSON.parse(body); } catch { return new Response(null, { status: 400 }); }
  const result = event.safeParse(input);
  if (!result.success || activityPage(result.data.page) !== result.data.page) {
    return new Response(null, { status: 400 });
  }
  const agent = request.headers.get("user-agent") ?? "";
  if (/bot|crawler|spider|headless/i.test(agent)) return new Response(null, { status: 204 });
  const country = request.headers.get("x-vercel-ip-country") ?? "";
  const { data } = result;
  const { error } = await createSupabaseAdminClient().rpc("record_visitor_activity", {
    p_visit: data.visit, p_page_id: data.view, p_page: data.page,
    p_country: /^[A-Z]{2}$/.test(country) ? country : null,
    p_browser: browserFamily(agent), p_source: data.source, p_seconds: data.seconds,
  });
  return new Response(null, { status: error ? 503 : 204 });
}
