"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPage } from "@/app/admin/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getServerAuthUser } from "@/lib/supabase/server";

const message = z.string().trim().min(1).max(4000);
const submission = z.object({
  category: z.enum(["Feedback", "Technical issue", "General enquiry"]),
  subject: z.string().trim().min(1).max(120),
  body: message,
});
const guestEmail = z.string().trim().max(254).email().transform(value => value.toLowerCase());

export async function openFeedback(_state: string, form: FormData) {
  const user = await getServerAuthUser();
  const input = submission.safeParse(Object.fromEntries(form));
  const email = guestEmail.safeParse(form.get("email"));
  if (!input.success || (!user && !email.success)) {
    return "Enter a valid subject, message and email address where required.";
  }
  const { data, error } = await createSupabaseAdminClient().rpc("open_feedback_thread", {
    p_member: user?.id ?? null,
    p_email: user ? null : email.data,
    p_category: input.data.category,
    p_subject: input.data.subject,
    p_body: input.data.body,
  });
  if (error?.code === "P0001") return "You’ve sent several enquiries recently. Please try again in an hour.";
  if (error || !data) return "Your enquiry could not be sent. Please try again.";
  revalidatePath("/admin", "layout");
  redirect(user ? `/feedback?thread=${data}` : "/feedback?sent=1");
}

export async function replyToFeedback(
  thread: string, support: boolean, _state: string, form: FormData
) {
  const user = support ? await requireAdminPage() : await getServerAuthUser();
  if (!user) return "Sign in again to send your reply.";
  const body = message.safeParse(form.get("body"));
  if (!body.success || !z.string().uuid().safeParse(thread).success) return "Enter a valid reply.";
  const { data, error } = await createSupabaseAdminClient().rpc("reply_to_feedback", {
    p_thread: thread,
    p_member: support ? null : user.id,
    p_support: support,
    p_body: body.data,
  });
  if (error || !data) return "Your reply could not be sent. Please try again.";
  revalidatePath("/admin", "layout");
  revalidatePath("/feedback");
  return "";
}

export async function markGuestFeedbackHandled(thread: string) {
  await requireAdminPage();
  if (!z.string().uuid().safeParse(thread).success) return;
  const { error } = await createSupabaseAdminClient().from("feedback_threads")
    .update({ awaiting_support: false }).eq("id", thread).is("member_id", null);
  if (error) throw new Error("Could not update the enquiry.");
  revalidatePath("/admin", "layout");
}
