"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdminResource } from "@/components/admin/use-admin-resource";
import { ResourceState } from "@/components/admin/workspace-ui";
type Notice = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};
export default function Inbox() {
  const { data, error, loading, refresh } = useAdminResource<{
    notices: Notice[];
  }>("/api/members/notices");
  const [busy, setBusy] = useState<string | null>(null),
    [message, setMessage] = useState("");
  async function mark(id: string) {
    setBusy(id);
    setMessage("");
    try {
      const response = await fetch("/api/members/notices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Unable to mark this notice as read.");
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to update notice");
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <h1 className="text-3xl font-bold">Your service notices</h1>
      <p className="text-sm text-slate-500">
        Updates from the CupidMatch team. Showing your most recent 50 notices.
      </p>
      <Button variant="outline" onClick={() => void refresh()}>
        Refresh
      </Button>
      {message && <p role="alert">{message}</p>}
      <ResourceState
        loading={loading}
        error={error}
        empty={!data?.notices.length}
      />
      {!loading &&
        !error &&
        data?.notices.map((n) => (
          <article
            key={n.id}
            className="space-y-3 rounded-2xl border bg-white p-5"
          >
            <p className="text-xs text-slate-500">
              {new Date(n.created_at).toLocaleString("en-GB")} ·{" "}
              {n.read_at ? "Read" : "Unread"}
            </p>
            <h2 className="font-bold">{n.title}</h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-6">
              {n.body}
            </p>
            {!n.read_at && (
              <Button
                variant="outline"
                disabled={busy !== null}
                onClick={() => void mark(n.id)}
              >
                {busy === n.id ? "Saving…" : "Mark as read"}
              </Button>
            )}
          </article>
        ))}
    </div>
  );
}
