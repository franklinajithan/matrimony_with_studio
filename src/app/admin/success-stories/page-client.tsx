"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminResource,
  adminMutation,
} from "@/components/admin/use-admin-resource";
import {
  WorkspaceHeading,
  ResourceState,
  Pager,
} from "@/components/admin/workspace-ui";
type Story = {
  id: string;
  couple_names: string;
  story_text: string;
  photo_url: string | null;
  status: string;
  admin_notes: string | null;
  submitted_at: string;
  updated_at: string | null;
};
function ReviewCard({
  story,
  onSave,
}: {
  story: Story;
  onSave: () => Promise<void>;
}) {
  const [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function decide(status: string) {
    if (note.trim().length < 10) {
      setMessage("Add a reason of at least 10 characters.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await adminMutation("/api/admin/success-stories", {
        storyId: story.id,
        status,
        note,
        expectedUpdatedAt: story.updated_at,
      });
      await onSave();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="flex flex-col gap-4 rounded-2xl border bg-white p-5">
      <div>
        <p className="text-xs font-semibold uppercase text-violet-700">
          {story.status}
        </p>
        <h2 className="mt-1 text-lg font-bold">{story.couple_names}</h2>
        <p className="mt-1 text-xs text-slate-500">
          Submitted {new Date(story.submitted_at).toLocaleDateString("en-GB")}
        </p>
      </div>
      {story.photo_url && /^https?:\/\//.test(story.photo_url) && (
        <img
          src={story.photo_url}
          alt="Submitted couple photo"
          loading="lazy"
          referrerPolicy="no-referrer"
          className="max-h-64 w-full rounded-xl object-contain"
        />
      )}
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
        {story.story_text}
      </p>
      {story.admin_notes && (
        <p className="rounded-lg bg-slate-50 p-3 text-xs">
          Previous review: {story.admin_notes}
        </p>
      )}
      <label className="mt-auto text-sm">
        Decision reason
        <Textarea
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-2"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {[
          ["approved", "Approve"],
          ["rejected", "Reject"],
          ["pending", "Return to review"],
        ]
          .filter(([status]) => status !== story.status)
          .map(([status, label]) => (
            <Button
              key={status}
              variant={status === "rejected" ? "destructive" : "outline"}
              disabled={busy}
              onClick={() => void decide(status)}
            >
              {label}
            </Button>
          ))}
      </div>
      {message && (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      )}
    </article>
  );
}
export default function Stories() {
  const [status, setStatus] = useState("pending"),
    [page, setPage] = useState(1);
  const { data, error, loading, refresh } = useAdminResource<{
    stories: Story[];
    total: number;
  }>(`/api/admin/success-stories?status=${status}&page=${page}`);
  return (
    <div className="space-y-6">
      <WorkspaceHeading
        title="Success stories"
        description="Read each submission in full, then approve, reject or return it for review. Every decision records your reason in the audit history."
        refresh={() => void refresh()}
      />
      <label className="block max-w-xs text-sm">
        Status
        <select
          className="mt-2 h-10 w-full rounded-md border bg-white px-3"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {["pending", "approved", "rejected", "all"].map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All stories" : s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <ResourceState
        loading={loading}
        error={error}
        empty={!data?.stories.length}
      />
      {!loading && !error && (
        <>
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data?.stories.map((s) => (
              <ReviewCard
                key={`${s.id}-${s.updated_at}`}
                story={s}
                onSave={refresh}
              />
            ))}
          </div>
          <Pager page={page} total={data?.total ?? 0} onPage={setPage} />
        </>
      )}
    </div>
  );
}
