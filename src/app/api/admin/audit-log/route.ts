import { NextResponse } from "next/server";
import { requireServerAdmin } from "@/lib/auth/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const timestamp = /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
const csvCell = (value: unknown) => {
  const str = String(value ?? "");
  return '"' + (/^[=+@\-\t\r\n]/.test(str) ? "'" + str : str).replace(/"/g, '""') + '"';
};
function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !value.startsWith("0000")
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function validTime(value: string) {
  const match = timestamp.exec(value);
  return !!match && validDate(match[1]) && Number.isFinite(Date.parse(value));
}
export async function GET(request: Request) {
  if (!await requireServerAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  const params = new URL(request.url).searchParams;
  const action = (params.get("action") || "").trim();
  const target = (params.get("target") || "").trim();
  const actor = (params.get("actor") || "").trim();
  const from = params.get("from") || ""; const to = params.get("to") || "";
  const cursor = params.get("cursor") || ""; const format = params.get("format") || "json";
  const boundary = cursor.split("|");
  if (action.length > 100 || target.length > 100 || (actor && !uuid.test(actor))
    || (from && !validDate(from)) || (to && !validDate(to)) || (from && to && from > to)
    || !["csv", "json"].includes(format)
    || (cursor && (boundary.length !== 2 || !validTime(boundary[0]) || !uuid.test(boundary[1]))))
    return NextResponse.json({ error: "Invalid filters or page cursor. Refresh and try again." }, { status: 400, headers });
  const exportCsv = format === "csv";
  try {
    const db = await createSupabaseServerClient();
    let query = db.from("admin_audit_log").select("id,actor_id,action,target_type,target_id,created_at")
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(exportCsv ? 1000 : 51);
    if (action) query = query.ilike("action", `%${action.replace(/[%_,()]/g, "")}%`);
    if (target) query = query.or(`target_type.ilike.%${target.replace(/[%_,()]/g, "")}%,target_id.ilike.%${target.replace(/[%_,()]/g, "")}%`);
    if (actor) query = query.eq("actor_id", actor);
    if (from) query = query.gte("created_at", from + "T00:00:00.000Z");
    // Exclusive next-day midnight preserves events in the final microseconds.
    if (to) query = query.lt("created_at", new Date(Date.parse(to) + 86400000).toISOString());
    if (cursor) {
      // Keep the exact database timestamp: JS Date truncates microseconds.
      const [time, id] = boundary;
      query = query.or(`created_at.lt.${time},and(created_at.eq.${time},id.lt.${id})`);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (exportCsv) {
      const columns = ["created_at", "action", "target_type", "target_id", "actor_id"] as const;
      const csv = "\uFEFF" + columns.join(",") + "\r\n" + (data || []).map(row => columns.map(key => csvCell(row[key])).join(",")).join("\r\n");
      return new Response(csv, { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="cupidmatch-admin-audit.csv"', "X-Export-Limit": "1000" } });
    }
    const items = (data || []).slice(0, 50);
    const last = items[items.length - 1];
    return NextResponse.json({ events: items, nextCursor: (data || []).length > 50 && last ? `${last.created_at}|${last.id}` : null, limit: 50 }, { headers });
  } catch {
    return NextResponse.json({ error: "Audit records unavailable. Please retry." }, { status: 503, headers });
  }
}
