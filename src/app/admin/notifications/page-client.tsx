"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminResource,
  adminMutation,
} from "@/components/admin/use-admin-resource";
import {
  WorkspaceHeading,
  ResourceState,
} from "@/components/admin/workspace-ui";
type Notice = {
  id: string;
  member_id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};
export default function Notifications() {
  const { data, error, loading, refresh } = useAdminResource<{
    notices: Notice[];
  }>("/api/admin/notifications");
  const [memberId, setMemberId] = useState(""),
    [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [confirm, setConfirm] = useState(false);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await adminMutation("/api/admin/notifications", {
        memberId,
        title,
        body,
      });
      setMessage("Notification sent to the member inbox.");
      setTitle("");
      setBody("");
      setConfirm(false);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to send");
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <WorkspaceHeading
        title="Member notifications"
        description="Send an individual service notice to a member’s in-app inbox. Review the recipient and message before sending."
        refresh={() => void refresh()}
      />
      <form
        onSubmit={send}
        onChange={() => setConfirm(false)}
        className="space-y-4 rounded-2xl border bg-white p-5"
      >
        <label className="block text-sm">
          Recipient member ID
          <Input
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="mt-2"
          />
        </label>
        <label className="block text-sm">
          Title
          <Input
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2"
          />
        </label>
        <label className="block text-sm">
          Message
          <Textarea
            required
            maxLength={2000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-2"
          />
        </label>
        {confirm && (
          <div role="status" className="rounded-xl bg-violet-50 p-4 text-sm">
            <p className="break-all font-semibold">To: {memberId}</p>
            <p className="mt-2 font-bold">{title}</p>
            <p className="mt-2 whitespace-pre-wrap">{body}</p>
          </div>
        )}
        <Button disabled={busy}>
          {busy
            ? "Sending…"
            : confirm
              ? "Confirm and send"
              : "Review notification"}
        </Button>
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
      </form>
      <h2 className="text-xl font-bold">Recent delivery history</h2>
      <p className="text-xs text-slate-500">
        Most recent 100 notifications. Read status reflects the member inbox.
      </p>
      <ResourceState
        loading={loading}
        error={error}
        empty={!data?.notices.length}
      />
      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.notices.map((n) => (
            <article
              key={n.id}
              className="space-y-3 rounded-2xl border bg-white p-5"
            >
              <p className="text-xs font-semibold text-violet-700">
                {n.read_at ? "Read" : "Unread"} ·{" "}
                {new Date(n.created_at).toLocaleDateString("en-GB")}
              </p>
              <h3 className="font-bold">{n.title}</h3>
              <p className="whitespace-pre-wrap break-words text-sm">
                {n.body}
              </p>
              <p className="break-all text-xs text-slate-400">
                Member: {n.member_id}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
