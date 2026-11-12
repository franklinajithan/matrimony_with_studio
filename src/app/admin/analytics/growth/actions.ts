"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPage } from "../../guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function reviewProfileReport(form: FormData) {
  const admin = await requireAdminPage();
  const id = z.string().uuid().safeParse(form.get("id"));
  const decision = z.enum(["resolved", "dismissed"]).safeParse(form.get("decision"));
  const days = form.get("days") === "30" ? "30" : "7";
  const destination = `/admin/analytics/growth?days=${days}`;
  if (!id.success || !decision.success) redirect(`${destination}&review=error#action-queue`);
  const now = new Date().toISOString();
  const { data, error } = await createSupabaseAdminClient().from("reports")
    .update({ status: decision.data, reviewed_by: admin.id, reviewed_at: now, updated_at: now })
    .eq("id", id.data).in("status", ["pending", "reviewing"]).select("id").maybeSingle();
  redirect(`${destination}&review=${error ? "error" : data ? "saved" : "closed"}#action-queue`);
}
