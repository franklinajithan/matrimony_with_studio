import { z } from "zod";
import { requireServerAdmin } from "@/lib/auth/admin";
import { context, failure, json, readBody } from "@/lib/horoscope/server";
import { providerConfigured } from "@/lib/horoscope/provider";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await requireServerAdmin())) return json({ error: "Forbidden" }, 403);
  try {
    const { db, settings } = await context();
    const { data: metrics, error } = await db.rpc("horoscope_admin_metrics");
    if (error) throw error;
    const adminDb = createSupabaseAdminClient();
    const { data: qaMembers, error: qaError } = await adminDb.from("horoscope_qa_allowlist").select("user_id,added_at").order("added_at", { ascending: false }).limit(100);
    if (qaError) throw qaError;
    return json({
      qaMembers: qaMembers || [],
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
    if (body.qaMember) {
      const parsed = z.object({ qaMember: z.string().uuid(), approved: z.boolean() }).strict().safeParse(body);
      if (!parsed.success) return json({ error: "Invalid QA member" }, 400);
      const adminDb = createSupabaseAdminClient();
      const { data: profile, error: profileError } = await adminDb.from("profiles").select("id,suspended_at,deletion_requested_at").eq("id", parsed.data.qaMember).maybeSingle();
      if (profileError || !profile || profile.suspended_at || profile.deletion_requested_at) return json({ error: "Active member not found" }, 404);
      const result = parsed.data.approved ? await adminDb.from("horoscope_qa_allowlist").upsert({ user_id: parsed.data.qaMember }, { onConflict: "user_id" }) : await adminDb.from("horoscope_qa_allowlist").delete().eq("user_id", parsed.data.qaMember);
      if (result.error) throw result.error;
      return json({ saved: true });
    }
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
    if (parsed.data.horoscope_enabled || parsed.data.horoscope_upload_enabled || parsed.data.ai_horoscope_matching_enabled) return json({ error: "Horoscope activation requires completed QA and a separate release approval. Test member enrolment alone does not enable the feature." }, 409);
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
