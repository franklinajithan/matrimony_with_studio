import Link from "next/link";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { FeedbackInbox, feedbackPageNumber } from "@/components/feedback/FeedbackInbox";
import { openFeedback } from "@/lib/feedback/actions";
import { loadFeedback } from "@/lib/feedback/inbox";
import { getServerAuthUser } from "@/lib/supabase/server";

export const metadata = { title: "Feedback & support", robots: { index: false, follow: true } };

export default async function FeedbackPage({ searchParams }: {
  searchParams: Promise<{ thread?: string; sent?: string; new?: string; page?: string }>;
}) {
  const [user, query] = await Promise.all([getServerAuthUser(), searchParams]);
  const page = feedbackPageNumber(query.page);
  return <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 pb-28">
    <header className="space-y-2">
      <h1 className="font-headline text-4xl font-bold text-primary">Feedback &amp; support</h1>
      <p className="text-muted-foreground">Share feedback, report a problem, or ask CupidMatch for help.</p>
    </header>
    {user && <nav className="flex gap-5 text-sm font-semibold text-primary">
      <Link href="/feedback">My enquiries</Link>
      <Link href="/feedback?new=1">New enquiry</Link>
    </nav>}
    {!user && query.sent === "1" && <p role="status" className="rounded-xl bg-muted p-4">Thank you. We received your enquiry and will reply to the email address you provided.</p>}
    {!user && <p className="text-sm text-muted-foreground">Guests receive replies by email. <Link className="underline" href="/login?next=%2Ffeedback">Sign in</Link> to keep replies in your CupidMatch account.</p>}
    {!user || query.new === "1" ? <section className="max-w-xl rounded-xl border bg-card p-5">
      <h2 className="mb-4 text-xl font-semibold">New enquiry</h2>
      <FeedbackForm action={openFeedback} guest={!user} />
    </section> : <FeedbackInbox data={await loadFeedback(user.id, query.thread, page)} page={page} />}
  </div>;
}
