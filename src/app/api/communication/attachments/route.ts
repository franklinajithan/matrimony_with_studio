import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError, validOrigin } from "@/lib/admin/http";
import { validAttachment } from "@/lib/communication/files";
export async function POST(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  if (Number(request.headers.get("content-length")) > 5500000)
    return NextResponse.json(
      { error: "Maximum file size is 5MB" },
      { status: 413 },
    );
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  if (!data.user)
    return NextResponse.json({ error: "Sign in again" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file"),
    chatId = form?.get("chatId");
  if (
    !(file instanceof File) ||
    typeof chatId !== "string" ||
    file.size > 5242880
  )
    return NextResponse.json(
      { error: "Choose a JPEG, PNG, WebP or PDF up to 5MB" },
      { status: 400 },
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validAttachment(bytes, file.type))
    return NextResponse.json(
      { error: "The file contents do not match an accepted file type" },
      { status: 400 },
    );
  const name =
    file.name.replace(/[\r\n\x00-\x1f/\\]/g, "_").slice(0, 150) || "attachment";
  const { data: reservation, error } = await db.rpc("communication", {
    p_action: "attachment_reserve",
    p_payload: { chatId, name, mimeType: file.type, size: file.size },
  });
  if (error) return mutationError(error);
  const { error: uploadError } = await db.storage
    .from("message-attachments")
    .upload(reservation.path, bytes, { contentType: file.type, upsert: false });
  if (uploadError)
    return NextResponse.json(
      { error: "Upload failed. Please retry." },
      { status: 503 },
    );
  const ready = await db.rpc("communication", {
    p_action: "attachment_ready",
    p_payload: { chatId, id: reservation.id },
  });
  if (ready.error) return mutationError(ready.error);
  return NextResponse.json(
    { id: reservation.id, name },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
