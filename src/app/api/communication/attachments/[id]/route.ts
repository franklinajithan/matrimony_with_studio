import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError } from "@/lib/admin/http";
import { validAttachment } from "@/lib/communication/files";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  if (!data.user)
    return NextResponse.json({ error: "Sign in again" }, { status: 401 });
  const chatId = new URL(request.url).searchParams.get("chatId");
  const { data: attachment, error } = await db.rpc("communication", {
    p_action: "attachment_get",
    p_payload: { id, chatId },
  });
  if (error) return mutationError(error);
  const download = await db.storage
    .from("message-attachments")
    .download(attachment.path);
  if (download.error || !download.data)
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  const bytes = new Uint8Array(await download.data.arrayBuffer());
  if (!validAttachment(bytes, attachment.mimeType))
    return NextResponse.json(
      { error: "File failed validation" },
      { status: 422 },
    );
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `attachment; filename="attachment"; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'",
    },
  });
}
