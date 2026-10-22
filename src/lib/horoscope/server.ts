import "server-only";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const noStore = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
};
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: noStore });
}
export async function context(request?: Request, write = false) {
  const db = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();
  if (authError || !user) throw new Error("Sign in required");
  if (
    write &&
    (!request || request.headers.get("origin") !== new URL(request.url).origin)
  )
    throw new Error("Invalid origin");
  const { data: settings, error } = await db
    .from("horoscope_settings")
    .select("*")
    .single();
  if (error || !settings) throw new Error("Horoscope service unavailable");
  return { db, user, settings };
}
export function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const status =
    message === "Sign in required"
      ? 401
      : message === "Invalid origin"
        ? 403
        : message.startsWith("Enter ") || message.startsWith("Invalid ")
          ? 400
          : 503;
  return json(
    {
      error:
        status === 503 ? "Horoscope unavailable. Please retry later." : message,
    },
    status,
  );
}
export async function readBody(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 100000)
    throw new Error("Invalid request size");
  const text = await request.text();
  if (text.length > 100000) throw new Error("Invalid request size");
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error("Invalid JSON request");
    return body;
  } catch {
    throw new Error("Invalid JSON request");
  }
}
