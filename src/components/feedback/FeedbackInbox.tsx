import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeedbackForm } from "./FeedbackForm";
import { markGuestFeedbackHandled, replyToFeedback } from "@/lib/feedback/actions";
import type { loadFeedback } from "@/lib/feedback/inbox";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London",
});

function Message({ body, date, author }: { body: string; date: string; author: string }) {
  return <li className="rounded-xl bg-muted p-4">
    <p className="text-sm font-semibold">{author} <time className="font-normal text-muted-foreground" dateTime={date}>{dateFormat.format(new Date(date))}</time></p>
    <p className="mt-2 whitespace-pre-wrap break-words">{body}</p>
  </li>;
}

export function feedbackPageNumber(raw?: string) {
  const value = Number(raw ?? 0);
  return Number.isSafeInteger(value) && value >= 0 && value <= 100000 ? value : 0;
}

export function FeedbackInbox({ data, admin = false, page }: {
  data: Awaited<ReturnType<typeof loadFeedback>>;
  admin?: boolean;
  page: number;
}) {
  if (!data) return <p role="alert">The feedback inbox is temporarily unavailable. Please try again.</p>;
  const path = admin ? "/admin/feedback" : "/feedback";
  const { thread, list, replies } = data;
  return <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
    <section aria-label="Enquiries" className="space-y-3">
      {!list.length && <p className="text-muted-foreground">No enquiries on this page.</p>}
      {list.map(item => <Link key={item.id} href={`${path}?page=${page}&thread=${item.id}`}
        aria-current={thread?.id === item.id ? "page" : undefined}
        className="block break-words rounded-xl border p-4 hover:bg-muted aria-[current=page]:border-primary">
        <strong>{item.subject}</strong>
        <p className="text-sm text-muted-foreground">{item.category} · {admin && (item.guest_email ? "Guest · " : "Member · ")}
          {item.awaiting_support ? (admin ? "Needs reply" : "Awaiting support") : "Replied"}</p>
      </Link>)}
      <nav aria-label="Enquiry pages" className="flex gap-4 text-sm text-primary">
        {page > 0 && <Link href={`${path}?page=${page - 1}`}>Previous</Link>}
        {data.next !== null && <Link href={`${path}?page=${data.next}`}>Next</Link>}
      </nav>
    </section>
    {thread && <section className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <h2 className="break-words text-xl font-bold">{thread.subject}</h2>
      <ol className="space-y-3">
        <Message body={thread.body} date={thread.created_at} author={admin ? (thread.guest_email ? "Guest" : "Member") : "You"} />
        {replies.length === 100 && <li className="text-sm text-muted-foreground">Showing the latest 100 replies.</li>}
        {replies.map(reply => <Message key={reply.id} body={reply.body} date={reply.created_at}
          author={reply.from_support ? "CupidMatch support" : admin ? "Member" : "You"} />)}
      </ol>
      {thread.guest_email ? <div className="space-y-3">
        <p className="break-all text-sm">Guest email · {thread.guest_email}</p>
        <a className="inline-block font-semibold text-primary underline"
          href={`mailto:${encodeURIComponent(thread.guest_email)}?subject=${encodeURIComponent(`Re: ${thread.subject}`)}`}>Reply by email</a>
        {thread.awaiting_support && <form action={markGuestFeedbackHandled.bind(null, thread.id)}>
          <Button variant="outline" type="submit">Mark as replied</Button>
        </form>}
      </div> : <FeedbackForm key={thread.id} action={replyToFeedback.bind(null, thread.id, admin)} reply />}
    </section>}
  </div>;
}
