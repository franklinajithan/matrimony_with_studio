import { NextResponse } from "next/server";
import { getServerSubscription } from "@/lib/subscriptions/server";
import { usageDecision, type MeteredFeature } from "@/lib/subscriptions/usage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FEATURES = new Set<MeteredFeature>([
  "interestsPerMonth",
  "profileSharesPerMonth",
  "biodataTemplates",
  "profileBoostsPerMonth",
]);
export async function GET(
  _request: Request,
  context: { params: Promise<{ feature: string }> },
) {
  const { user, plan } = await getServerSubscription();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { feature } = await context.params;
  if (!FEATURES.has(feature as MeteredFeature))
    return NextResponse.json(
      { error: "Unknown metered feature" },
      { status: 404 },
    );
  const now = new Date();
  const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from("subscription_usage")
    .select("used_count")
    .eq("user_id", user.id)
    .eq("feature_key", feature)
    .eq("period_start", period)
    .maybeSingle();
  if (
    error ||
    (data && (!Number.isInteger(data.used_count) || data.used_count < 0))
  )
    return NextResponse.json(
      { error: "Usage could not be loaded. Please retry." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  return NextResponse.json(
    usageDecision(
      plan.entitlements,
      feature as MeteredFeature,
      data?.used_count ?? 0,
    ),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
