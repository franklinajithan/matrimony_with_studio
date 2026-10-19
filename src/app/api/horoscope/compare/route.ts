import { z } from "zod";
import { context, failure, json, readBody } from "@/lib/horoscope/server";
import { compareSharedFields } from "@/lib/horoscope/comparison";
import {
  explainComparison,
  providerConfigured,
} from "@/lib/horoscope/provider";
export const dynamic = "force-dynamic";
export const maxDuration = 90;
const requestSchema = z
  .object({ member: z.string().uuid(), ai: z.boolean().default(false) })
  .strict();
export async function POST(request: Request) {
  try {
    const { db, user, settings } = await context(request, true);
    const parsed = requestSchema.safeParse(await readBody(request));
    if (!parsed.success)
      return json({ error: "Invalid comparison request" }, 400);
    const body = parsed.data;
    const { data: allowed, error } = await db.rpc("horoscope_can_compare", {
      p_other: body.member,
    });
    if (error || !allowed)
      return json(
        {
          error:
            "Both members must allow comparison and reciprocal horoscope access.",
        },
        403,
      );
    const { data: a, error: ea } = await db.rpc("horoscope_view", {
      p_owner: user.id,
    });
    const { data: b, error: eb } = await db.rpc("horoscope_view", {
      p_owner: body.member,
    });
    if (ea || eb || !a || !b)
      return json({ error: "Horoscopes unavailable." }, 403);
    // The requester receives the same partial redaction as the other member. Hidden facts never enter a report/provider.
    const first = {
      ...a,
      fields: Object.fromEntries(
        Object.entries(a.fields).filter(([key]) =>
          a.shared_fields.includes(key),
        ),
      ),
    };
    const comparison = compareSharedFields(first, b);
    let aiExplanation = null;
    if (body.ai === true) {
      if (
        !settings.ai_horoscope_matching_enabled ||
        !a.ai_consent ||
        !b.ai_consent ||
        !providerConfigured()
      )
        return json(
          {
            error:
              "AI explanations require both members’ AI consent and a configured, enabled provider.",
          },
          403,
        );
    }
    const { error: limit } = await db.rpc("horoscope_claim_action", {
      p_action: body.ai === true ? "ai_explanation" : "compare",
    });
    if (limit) return json({ error: "Daily request limit reached." }, 429);
    if (body.ai) {
      aiExplanation = await explainComparison(comparison);
    }
    // No stale result may be returned if consent, blocking, visibility or chart versions changed while generating.
    const { data: current, error: changed } = await db.rpc(
      "horoscope_report_current",
      {
        p_other: body.member,
        p_own_revision: a.revision,
        p_other_revision: b.revision,
      },
    );
    if (changed || !current)
      return json(
        {
          error:
            "Permissions or horoscope data changed. Request a new comparison.",
        },
        409,
      );
    const { data: reportId, error: saveError } = await db.rpc(
      "horoscope_store_report",
      {
        p_other: body.member,
        p_own_revision: a.revision,
        p_other_revision: b.revision,
        p_report: { comparison, aiExplanation },
      },
    );
    if (saveError)
      return json(
        { error: "Permissions changed before the report could be saved." },
        409,
      );
    return json({
      id: reportId,
      comparison,
      aiExplanation,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      notice:
        "A cultural/traditional aid, not a scientific prediction or guarantee of relationship success. Shared downloads cannot be revoked from a recipient’s device.",
    });
  } catch (e) {
    return failure(e);
  }
}
