import { NextRequest } from "next/server";
import { z } from "zod";
import { growthMilestones } from "@/lib/analytics/growth-events";
import { activityPage } from "@/lib/analytics/pages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const event = z.object({
  visit: z.string().uuid(),
  view: z.string().uuid(),
  page: z.string().max(80),
  source: z.enum(["Google", "Bing", "Other search", "Social", "Referral", "Direct", "Internal"]),
  campaign: z.object({
    channel: z.enum(["google", "instagram", "facebook", "whatsapp", "bing", "tiktok", "linkedin", "newsletter", "other"]),
    name: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,47}$/),
  }).optional(),
  seconds: z.number().int().min(0).max(14400),
});

const growthEvent = z.object({ visit: z.string().uuid(), milestone: z.enum(growthMilestones) }).strict();

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
  const agent = request.headers.get("user-agent") ?? "";
  const milestone = growthEvent.safeParse(input);
  if (milestone.success) {
    if (/bot|crawler|spider|headless/i.test(agent)) return new Response(null, { status: 204 });
    const { error } = await createSupabaseAdminClient().from("visitor_growth_events").upsert({
      visit_id: milestone.data.visit, milestone: milestone.data.milestone,
    }, { onConflict: "visit_id,milestone", ignoreDuplicates: true });
    return new Response(null, { status: error ? 503 : 204 });
  }
  const result = event.safeParse(input);
  if (!result.success || activityPage(result.data.page) !== result.data.page) {
    return new Response(null, { status: 400 });
  }
  if (/bot|crawler|spider|headless/i.test(agent)) return new Response(null, { status: 204 });
  const country = request.headers.get("x-vercel-ip-country") ?? "";
  const { data } = result;
  const db = createSupabaseAdminClient();
  const { error } = await db.rpc("record_visitor_activity", {
    p_visit: data.visit, p_page_id: data.view, p_page: data.page,
    p_country: /^[A-Z]{2}$/.test(country) ? country : null,
    p_browser: browserFamily(agent), p_source: data.source, p_seconds: data.seconds,
  });
  if (error) return new Response(null, { status: 503 });
  if (data.campaign) {
    const { error: attributionError } = await db.from("visitor_campaigns").upsert({
      visit_id: data.visit, channel: data.campaign.channel, name: data.campaign.name,
    }, { onConflict: "visit_id", ignoreDuplicates: true });
    if (attributionError) return new Response(null, { status: 503 });
  }
  return new Response(null, { status: 204 });
}
