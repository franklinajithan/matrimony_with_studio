import { context, failure, json, readBody } from "@/lib/horoscope/server";
import { saveSchema } from "@/lib/horoscope/schema";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { db, user, settings } = await context();
    const owner = new URL(request.url).searchParams.get("member") || user.id;
    if (!/^[0-9a-f-]{36}$/i.test(owner))
      return json({ error: "Invalid member" }, 400);
    // Owners can export/delete even when the rollout is paused.
    if (owner === user.id) {
      const { data, error } = await db
        .from("horoscope_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (new URL(request.url).searchParams.get("export") === "1") {
        const [documents, extractions, consents] = await Promise.all([
          db.from("horoscope_documents").select("*").eq("owner_id", user.id),
          db.from("horoscope_extractions").select("*").eq("owner_id", user.id),
          db.from("horoscope_consents").select("*").eq("user_id", user.id),
        ]);
        if (documents.error || extractions.error || consents.error)
          throw new Error("Export unavailable");
        return json({
          profile: data,
          documents: documents.data,
          extractions: extractions.data,
          consents: consents.data,
          exported_at: new Date().toISOString(),
        });
      }
      const { data: qaAllowed } = await db.rpc("horoscope_qa_member_allowed");
      const effectiveSettings = { ...settings, horoscope_enabled: qaAllowed === true, horoscope_upload_enabled: false, ai_horoscope_matching_enabled: false };
      return json({ profile: data, settings: effectiveSettings });
    }
    const { data, error } = await db.rpc("horoscope_view", { p_owner: owner });
    if (error)
      return json({ error: "This horoscope is unavailable or private." }, 403);
    return json({ profile: data, settings });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(request: Request) {
  try {
    const { db, settings } = await context(request, true);
    const { data: qaAllowed, error: qaError } = await db.rpc("horoscope_qa_member_allowed");
    if (qaError || qaAllowed !== true) return json({ error: "Horoscope editing is available only to approved QA members." }, 403);
    // QA approval activates manual editing only; uploads and AI remain gated.
    if (qaAllowed !== true)
      return json({ error: "Horoscope editing is paused." }, 403);
    const parsed = saveSchema.safeParse(await readBody(request));
    if (!parsed.success)
      return json(
        { error: parsed.error.issues.map((x) => x.message).join(" ") },
        400,
      );
    const { data, error } = await db.rpc("horoscope_save", {
      p_payload: parsed.data,
    });
    if (error)
      return json(
        {
          error:
            error.code === "40001"
              ? "Your horoscope changed. Reload before saving."
              : "Could not save. Check your details and retry.",
        },
        error.code === "40001" ? 409 : 400,
      );
    return json({ profile: data });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const { db, user } = await context(request, true);
    const { data: documents, error: readError } = await db
      .from("horoscope_documents")
      .select("storage_path")
      .eq("owner_id", user.id);
    if (readError) throw readError;
    if (documents?.length) {
      const { error } = await db.storage
        .from("horoscope-private")
        .remove(documents.map((d) => d.storage_path));
      if (error) throw error;
    }
    const { error } = await db.rpc("horoscope_delete");
    if (error) throw error;
    return json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
