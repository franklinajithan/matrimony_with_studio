"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminResource,
  adminMutation,
} from "@/components/admin/use-admin-resource";
import { ResourceState } from "@/components/admin/workspace-ui";
type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: string;
  updated_at: string;
  created_at: string;
  member_id: string | null;
  assigned_to: string | null;
};
type Message = {
  id: string;
  body: string;
  is_staff: boolean;
  created_at: string;
};
export function SupportThread({
  ticketId,
  staff = false,
}: {
  ticketId: string;
  staff?: boolean;
}) {
  const prefix = staff ? "/api/admin/support" : "/api/support",
    url = `${prefix}/${ticketId}`;
  const { data, error, loading, refresh } = useAdminResource<{
    ticket: Ticket;
    messages: Message[];
  }>(url);
  const [body, setBody] = useState(""),
    [requestId, setRequestId] = useState(() => crypto.randomUUID()),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [status, setStatus] = useState(""),
    [reason, setReason] = useState("");
  async function reply(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await adminMutation(url, { body, requestId });
      setBody("");
      setRequestId(crypto.randomUUID());
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to send reply");
    } finally {
      setBusy(false);
    }
  }
  async function update(claim: boolean | null) {
    if (!data) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status || data.ticket.status,
          claim,
          reason,
          expectedUpdatedAt: data.ticket.updated_at,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update");
      setReason("");
      setStatus("");
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to update");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" asChild>
          <Link href={staff ? "/admin/support" : "/support"}>
            Back to requests
          </Link>
        </Button>
        <Button variant="outline" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
      <ResourceState loading={loading} error={error} empty={false} />
      {!loading && !error && data && (
        <>
          <section className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-semibold capitalize text-violet-700">
              {data.ticket.category} · {data.ticket.status.replaceAll("_", " ")}
            </p>
            <h1 className="mt-2 break-words text-2xl font-bold">
              {data.ticket.subject}
            </h1>
            <p className="mt-2 text-xs text-slate-500">
              Created {new Date(data.ticket.created_at).toLocaleString("en-GB")}
            </p>
            {staff && (
              <p className="mt-3 text-xs text-slate-500">
                {data.ticket.assigned_to ? "Assigned to staff" : "Unassigned"} ·{" "}
                <Link
                  className="underline"
                  href={`/admin/users/edit/${data.ticket.member_id}`}
                >
                  Member details
                </Link>
              </p>
            )}
          </section>
          <section aria-label="Support conversation" className="space-y-3">
            {data.messages.map((m) => (
              <article
                key={m.id}
                className={`rounded-2xl border p-5 ${m.is_staff ? "border-violet-100 bg-violet-50" : "bg-white"}`}
              >
                <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                  <p className="font-semibold">
                    {m.is_staff ? "CupidMatch support" : "Member"}
                  </p>
                  <time dateTime={m.created_at}>
                    {new Date(m.created_at).toLocaleString("en-GB")}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
                  {m.body}
                </p>
              </article>
            ))}
          </section>
          <p className="text-xs text-slate-500">
            Showing up to 200 recent messages. Use Refresh to check for new
            replies.
          </p>
          <form
            onSubmit={reply}
            className="space-y-3 rounded-2xl border bg-white p-5"
          >
            <label className="block text-sm font-semibold">
              Reply
              <Textarea
                required
                maxLength={4000}
                rows={4}
                value={body}
                disabled={busy}
                onChange={(e) => {
                  setBody(e.target.value);
                  setRequestId(crypto.randomUUID());
                }}
                className="mt-2"
              />
            </label>
            <p className="text-xs text-slate-500">
              Replying to a resolved request reopens the conversation.
            </p>
            <Button disabled={busy || !body.trim()}>
              {busy ? "Saving…" : "Send reply"}
            </Button>
          </form>
          {staff && (
            <section className="space-y-4 rounded-2xl border bg-white p-5">
              <h2 className="text-lg font-bold">Manage request</h2>
              <label className="block text-sm">
                Status
                <select
                  className="ml-2 h-10 rounded-md border bg-white px-3"
                  value={status || data.ticket.status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {["open", "in_progress", "waiting_on_member", "resolved"].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s.replaceAll("_", " ")}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="block text-sm">
                Reason for change
                <Textarea
                  minLength={10}
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy || reason.trim().length < 10}
                  onClick={() => void update(null)}
                >
                  Save status
                </Button>
                <Button
                  variant="outline"
                  disabled={busy || reason.trim().length < 10}
                  onClick={() => void update(true)}
                >
                  Assign to me
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    busy ||
                    reason.trim().length < 10 ||
                    !data.ticket.assigned_to
                  }
                  onClick={() => void update(false)}
                >
                  Release assignment
                </Button>
              </div>
            </section>
          )}
        </>
      )}
      {message && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {message}
        </p>
      )}
    </div>
  );
}
