import { randomUUID, createHash } from "node:crypto";
import {
  validateDocument as validate,
  prepareForVision,
  MAX_BYTES,
} from "@/lib/horoscope/files";
import { context, failure, json, readBody } from "@/lib/horoscope/server";
import { extractDocument, providerConfigured } from "@/lib/horoscope/provider";
export const dynamic = "force-dynamic";
export const maxDuration = 90;
export async function GET(request: Request) {
  try {
    const { db, user } = await context();
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      if (!/^[0-9a-f-]{36}$/i.test(id))
        return json({ error: "Invalid document" }, 400);
      const { data: d, error } = await db
        .from("horoscope_documents")
        .select("storage_path,expires_at")
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();
      if (error || !d || new Date(d.expires_at) <= new Date())
        return json({ error: "Document unavailable" }, 404);
      const { data: signed, error: sign } = await db.storage
        .from("horoscope-private")
        .createSignedUrl(d.storage_path, 60);
      if (sign) throw sign;
      return json({ url: signed.signedUrl });
    }
    const { data, error } = await db
      .from("horoscope_documents")
      .select("id,mime_type,processing_state,expires_at,created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return json({ documents: data, providerConfigured: providerConfigured() });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { db, user, settings } = await context(request, true);
    if (!settings.horoscope_enabled || !settings.horoscope_upload_enabled)
      return json({ error: "Document upload is paused." }, 403);
    if (Number(request.headers.get("content-length") || 0) > MAX_BYTES + 100000)
      return json({ error: "File exceeds 3 MB." }, 413);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Choose a file." }, 400);
    const bytes = Buffer.from(await file.arrayBuffer());
    await validate(bytes, file.type);
    const { error: limit } = await db.rpc("horoscope_claim_action", {
      p_action: "upload",
    });
    if (limit)
      return json(
        { error: "Upload limit reached or access unavailable." },
        429,
      );
    const id = randomUUID();
    const { data: document, error: register } = await db.rpc(
      "horoscope_register_document",
      {
        p_id: id,
        p_mime: file.type,
        p_sha256: createHash("sha256").update(bytes).digest("hex"),
      },
    );
    if (register) throw register;
    if (document.id !== id) return json({ document, duplicate: true });
    const { error } = await db.storage
      .from("horoscope-private")
      .upload(document.storage_path, bytes, {
        contentType: file.type,
        upsert: false,
      });
    if (error) {
      await db.rpc("horoscope_remove_document", { p_id: id });
      throw error;
    }
    return json({
      document: {
        id,
        mime_type: file.type,
        expires_at: document.expires_at,
        processing_state: "uploaded",
      },
      owner: user.id,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(request: Request) {
  try {
    const { db, user, settings } = await context(request, true);
    if (!settings.horoscope_enabled || !settings.horoscope_upload_enabled)
      return json({ error: "Extraction is paused." }, 403);
    const body = await readBody(request);
    if (
      !body ||
      !/^[0-9a-f-]{36}$/i.test(body.id) ||
      body.processingConsent !== true
    )
      return json(
        { error: "Confirm third-party processing consent for this document." },
        400,
      );
    if (!providerConfigured())
      return json(
        {
          error:
            "OCR is not configured. Your document stays private; you can enter details manually.",
        },
        503,
      );
    const { data: document, error } = await db
      .from("horoscope_documents")
      .select("*")
      .eq("id", body.id)
      .eq("owner_id", user.id)
      .single();
    if (error || !document || new Date(document.expires_at) <= new Date())
      return json({ error: "Document unavailable or expired." }, 404);
    const { error: limit } = await db.rpc("horoscope_claim_action", {
      p_action: "extract",
    });
    if (limit) return json({ error: "Daily extraction limit reached." }, 429);
    const { data: blob, error: download } = await db.storage
      .from("horoscope-private")
      .download(document.storage_path);
    if (download || !blob) throw download;
    const bytes = Buffer.from(await blob.arrayBuffer());
    await validate(bytes, document.mime_type);
    const prepared = await prepareForVision(bytes, document.mime_type);
    const payload = await extractDocument(prepared.bytes, prepared.mime);
    // Recheck consent/ownership after the provider call; deletion while processing must win.
    const { data: extraction, error: save } = await db.rpc(
      "horoscope_record_extraction",
      {
        p_document: document.id,
        p_payload: payload,
        p_version: `vision-v1:${process.env.HOROSCOPE_GEMINI_MODEL}`,
      },
    );
    if (save) throw save;
    return json({ extraction });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const { db, user } = await context(request, true);
    const { id } = await readBody(request);
    if (!/^[0-9a-f-]{36}$/i.test(id))
      return json({ error: "Invalid document" }, 400);
    const { data: d, error } = await db
      .from("horoscope_documents")
      .select("storage_path")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (d) {
      const { error: remove } = await db.storage
        .from("horoscope-private")
        .remove([d.storage_path]);
      if (remove) throw remove;
      const { error: deleted } = await db.rpc("horoscope_remove_document", {
        p_id: id,
      });
      if (deleted) throw deleted;
    }
    return json({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
