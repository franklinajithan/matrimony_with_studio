import { Readable, pipeline } from "node:stream";
import { createGzip } from "node:zlib";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serviceClient, serviceConfigured } from "@/lib/supabase/service";
import { accountArchive, type ExportPage } from "@/lib/account/archive";
import { validOrigin } from "@/lib/admin/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
async function prepare(request: Request) {
  if (
    !validOrigin(request) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return NextResponse.json(
      { error: "Open account settings to download your data." },
      { status: 403, headers },
    );
  const db = await createSupabaseServerClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user)
    return NextResponse.json(
      { error: "Your session expired. Sign in again." },
      { status: 401, headers },
    );
  if (!serviceConfigured())
    return NextResponse.json(
      {
        error:
          "File archives are not configured. Use the JSON export in account settings.",
      },
      { status: 503, headers },
    );
  return { db, userId: data.user.id };
}
export async function HEAD(request: Request) {
  const ready = await prepare(request);
  return ready instanceof Response ? ready : new Response(null, { headers });
}
export async function GET(request: Request) {
  const ready = await prepare(request);
  if (ready instanceof Response) return ready;
  const { db, userId } = ready;
  const reservation = await db.rpc("reserve_account_export");
  if (reservation.error)
    return NextResponse.json(
      {
        error:
          reservation.error.code === "22023"
            ? "Up to three archives per hour. Retry later."
            : "Unable to start export. Retry later or use the JSON export.",
      },
      { status: reservation.error.code === "22023" ? 429 : 503, headers },
    );
  const privileged = serviceClient();
  const archive = accountArchive({
    memberId: userId,
    signal: request.signal,
    page: async (dataset, after) => {
      const { data, error } = await db.rpc("account_export_page", {
        p_dataset: dataset,
        p_after: after,
      });
      if (error)
        throw new Error("Dataset unavailable. Retry or contact support.");
      return data as ExportPage;
    },
    download: async (bucket, path) => {
      const { data, error } = await privileged.storage.from(bucket).download(
        path,
        {},
        {
          signal: AbortSignal.any([
            request.signal,
            AbortSignal.timeout(15_000),
          ]),
        },
      );
      if (error || !data || data.size > 10 * 1024 * 1024)
        throw new Error("File unavailable");
      return new Uint8Array(await data.arrayBuffer());
    },
  });
  const stream = createGzip();
  pipeline(Readable.from(archive), stream, () => {
    /* Web response observes stream failures. */
  });
  request.signal.addEventListener("abort", () => stream.destroy(), {
    once: true,
  });
  return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
    headers: {
      ...headers,
      "Content-Type": "application/gzip",
      "Content-Disposition":
        'attachment; filename="cupidmatch-account-export.tar.gz"',
      "X-Accel-Buffering": "no",
    },
  });
}
