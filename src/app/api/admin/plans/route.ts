import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireServerAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
const RequestSchema = z.object({
  code: z.enum(["free", "plus", "premium"]),
  monthlyPricePence: z.number().int().min(0).max(100000),
  threeMonthPricePence: z.number().int().min(1).max(600000).nullable(),
  sixMonthPricePence: z.number().int().min(1).max(1200000).nullable(),
  entitlements: z.record(z.union([z.boolean(), z.number().int().min(0).max(100000), z.null()])),
  expectedUpdatedAt: z.string().datetime({offset:true}),
}).strict();

export async function GET() {
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("subscription_plans").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: "Could not load plans" }, { status: 503, headers });
  return NextResponse.json({ plans: data }, { headers });
}

export async function PATCH(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403, headers });
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  const input = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Invalid plan values" }, { status: 400, headers });
  const v = input.data;
  if (v.code === "free" && (v.monthlyPricePence !== 0 || v.threeMonthPricePence !== null || v.sixMonthPricePence !== null))
    return NextResponse.json({ error: "Free must remain free" }, { status: 400, headers });
  const db = await createSupabaseServerClient();
  const {data,error} = await db.rpc("admin_update_subscription_plan", {
    p_code: v.code,
    p_monthly_price_pence: v.monthlyPricePence,
    p_three_month_price_pence: v.threeMonthPricePence,
    p_six_month_price_pence: v.sixMonthPricePence,
    p_entitlements: v.entitlements,
    p_expected_updated_at: v.expectedUpdatedAt,
  });
  if (error) return NextResponse.json({
    error: error.code === "40001" ? "Prices changed since you opened the form. Refresh and review before saving."
      : error.code === "42501" ? "Administrator permission required."
      : "Could not save the plan. Check feature values and database migration.",
  }, { status: error.code === "40001" ? 409 : error.code === "42501" ? 403 : 503, headers });
  return NextResponse.json({ plan: data }, { headers });
}
