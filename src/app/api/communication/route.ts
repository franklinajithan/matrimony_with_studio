import { turnServer, callingConfigured } from "@/lib/communication/turn";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutationError, validOrigin } from "@/lib/admin/http";
const input = z.object({
  action: z.enum([
    "messages",
    "send",
    "read",
    "incoming",
    "call_start",
    "call_read",
    "call_accept",
    "call_reject",
    "call_end",
    "call_unavailable",
    "call_signal",
    "call_answer",
  ]),
  payload: z.record(z.unknown()).default({}),
});
export async function POST(request: Request) {
  if (!validOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  if (!data.user)
    return NextResponse.json({ error: "Sign in again" }, { status: 401 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 42000)
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const parsed = input.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  if (parsed.data.action === "call_start" && !callingConfigured())
    return NextResponse.json(
      {
        error:
          "Calling is unavailable until the calling service is configured and verified.",
      },
      { status: 503 },
    );
  const { data: result, error } = await db.rpc("communication", {
    p_action: parsed.data.action,
    p_payload: parsed.data.payload,
  });
  if (error) return mutationError(error);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function GET(request: Request) {
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  if (!data.user)
    return NextResponse.json({ error: "Sign in again" }, { status: 401 });
  const chatId = new URL(request.url).searchParams.get("chatId");
  if (!callingConfigured() || !chatId)
    return NextResponse.json(
      { callingEnabled: false, iceServers: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  const permission = await db.rpc("communication", {
    p_action: "calling_config",
    p_payload: { chatId },
  });
  if (permission.error) return mutationError(permission.error);
  if (!permission.data?.allowed)
    return NextResponse.json(
      {
        error:
          "Calling requires an eligible membership or an incoming call from your connection.",
      },
      { status: 403 },
    );
  try {
    return NextResponse.json(
      { callingEnabled: true, iceServers: [turnServer(data.user.id)] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Calling service is unavailable" },
      { status: 503 },
    );
  }
}
