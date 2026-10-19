import { z } from "zod";
import { requireServerAdmin } from "@/lib/auth/admin";
import { context, failure, json, readBody } from "@/lib/horoscope/server";
import { providerConfigured } from "@/lib/horoscope/provider";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await requireServerAdmin())) return json({ error: "Forbidden" }, 403);
  try {
    const { db, settings } = await context();
    const { data: metrics, error } = await db.rpc("horoscope_admin_metrics");
    if (error) throw error;
    return json({
      settings,
      metrics,
      providerConfigured: providerConfigured(),
    });
  } catch (e) {
    return failure(e);
  }
}
const schema = z
  .object({
    horoscope_enabled: z.boolean(),
    horoscope_upload_enabled: z.boolean(),
    ai_horoscope_matching_enabled: z.boolean(),
    matching_rule_sets: z.array(z.string()).max(0),
    retention_days: z.number().int().min(1).max(90),
    daily_ai_limit: z.number().int().min(1).max(20),
  })
  .strict();
export async function PATCH(request: Request) {
  if (!(await requireServerAdmin())) return json({ error: "Forbidden" }, 403);
  try {
    const { db } = await context(request, true);
    const body = await readBody(request);
    if (body.member) {
      const parsed = z
        .object({ member: z.string().uuid(), restricted: z.boolean() })
        .strict()
        .safeParse(body);
      if (!parsed.success) return json({ error: "Invalid restriction" }, 400);
      const { error } = await db.rpc("horoscope_admin_restrict", {
        p_user: parsed.data.member,
        p_restricted: parsed.data.restricted,
      });
      if (error) throw error;
      return json({ saved: true });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return json({ error: "Invalid settings" }, 400);
    if (
      (parsed.data.horoscope_upload_enabled ||
        parsed.data.ai_horoscope_matching_enabled) &&
      !providerConfigured()
    )
      return json(
        {
          error:
            "Configure dedicated horoscope provider credentials/model and complete provider privacy review before enabling AI/upload.",
        },
        400,
      );
    const { error } = await db.rpc("horoscope_admin_settings", {
      p_settings: parsed.data,
    });
    if (error) throw error;
    return json({ saved: true });
  } catch (e) {
    return failure(e);
  }
}
