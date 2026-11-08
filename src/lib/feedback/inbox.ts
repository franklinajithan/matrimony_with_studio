import "server-only";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function loadFeedback(memberId: string | null, selected?: string, page = 0) {
  const db = createSupabaseAdminClient();
  let inbox = db.from("feedback_threads")
    .select("id, category, subject, awaiting_support, guest_email, updated_at");
  inbox = memberId ? inbox.eq("member_id", memberId) : inbox.order("awaiting_support", { ascending: false });
  inbox = inbox.order("updated_at", { ascending: false }).order("id").range(page * 25, page * 25 + 25);


  let detail = db.from("feedback_threads")
    .select("id, category, subject, awaiting_support, guest_email, body, created_at")
    .eq("id", selected ?? "");
  if (memberId) detail = detail.eq("member_id", memberId);
  const [list, active] = await Promise.all([
    inbox,
    z.string().uuid().safeParse(selected).success ? detail.maybeSingle() : null,
  ]);
  if (list.error || active?.error) return null;

  const thread = active?.data;
  const replies = thread ? await db.from("feedback_replies")
    .select("id, from_support, body, created_at").eq("thread_id", thread.id)
    .order("id", { ascending: false }).limit(100) : null;
  if (replies?.error) return null;

  return {
    list: list.data.slice(0, 25),
    next: list.data.length > 25 ? page + 1 : null,
    thread,
    replies: replies?.data.reverse() ?? [],
  };
}

export async function countFeedbackNeedingReply() {
  try {
    const { count, error } = await createSupabaseAdminClient().from("feedback_threads")
      .select("id", { head: true, count: "exact" }).eq("awaiting_support", true);
    return error ? null : count;
  } catch {
    return null;
  }
}
