import { FeedbackInbox, feedbackPageNumber } from "@/components/feedback/FeedbackInbox";
import { loadFeedback } from "@/lib/feedback/inbox";
import { requireAdminPage } from "../guard";

export default async function AdminFeedbackPage({ searchParams }: {
  searchParams: Promise<{ thread?: string; page?: string }>;
}) {
  await requireAdminPage();
  const query = await searchParams;
  const page = feedbackPageNumber(query.page);
  return <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="font-headline text-3xl font-bold">Feedback inbox</h1>
      <p className="text-muted-foreground">Reply to member conversations here and respond to guest enquiries by email.</p>
    </header>
    <FeedbackInbox data={await loadFeedback(null, query.thread, page)} page={page} admin />
  </div>;
}
