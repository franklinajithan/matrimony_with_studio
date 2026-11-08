"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function FeedbackForm({ action, reply = false, guest = false }: {
  action: (state: string, form: FormData) => Promise<string>;
  reply?: boolean;
  guest?: boolean;
}) {
  const [error, submit, pending] = useActionState(action, "");
  return <form action={submit} className="space-y-4">
    {!reply && <>
      {guest && <label className="block space-y-1"><span>Email for your reply</span>
        <Input name="email" type="email" autoComplete="email" maxLength={254} required />
      </label>}
      <label className="block space-y-1"><span>Category</span>
        <select name="category" className="block h-10 w-full rounded-md border border-input bg-background px-3">
          <option>Feedback</option><option>Technical issue</option><option>General enquiry</option>
        </select>
      </label>
      <label className="block space-y-1"><span>Subject</span>
        <Input name="subject" maxLength={120} required />
      </label>
    </>}
    <label className="block space-y-1"><span>{reply ? "Your reply" : "Message"}</span>
      <Textarea name="body" maxLength={4000} rows={reply ? 3 : 6} required />
    </label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Sending…" : reply ? "Send reply" : "Send enquiry"}</Button>
  </form>;
}
