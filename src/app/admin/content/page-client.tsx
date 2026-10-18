"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useAdminResource,
  adminMutation,
} from "@/components/admin/use-admin-resource";
import {
  WorkspaceHeading,
  ResourceState,
  Pager,
} from "@/components/admin/workspace-ui";
type Member = {
  id: string;
  display_name: string;
  bio: string | null;
  photo_url: string | null;
  additional_photo_urls: string[];
  is_published: boolean;
};
type Decision = {
  memberId: string;
  name: string;
  kind: "photo" | "bio" | "unpublish";
  content: string | null;
};
export default function Content() {
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [decision, setDecision] = useState<Decision | null>(null),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const { data, error, loading, refresh } = useAdminResource<{
    members: Member[];
    total: number;
  }>(`/api/admin/content?search=${encodeURIComponent(query)}&page=${page}`);
  function choose(
    member: Member,
    kind: Decision["kind"],
    content: string | null,
  ) {
    setDecision({
      memberId: member.id,
      name: member.display_name,
      kind,
      content,
    });
    setReason("");
    setMessage("");
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!decision) return;
    setBusy(true);
    setMessage("");
    try {
      await adminMutation("/api/admin/content", { ...decision, reason });
      setDecision(null);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to moderate");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <WorkspaceHeading
        title="Content moderation"
        description="Review member photos and biographies. Remove inappropriate content or unpublish a profile, with a recorded reason."
        refresh={() => void refresh()}
      />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim());
          setPage(1);
        }}
      >
        <Input
          aria-label="Search member content"
          placeholder="Search by member name or ID"
          maxLength={100}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button>Search</Button>
      </form>
      <ResourceState
        loading={loading}
        error={error}
        empty={!data?.members.length}
      />
      {!loading && !error && (
        <>
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data?.members.map((m) => (
              <article
                key={m.id}
                className="space-y-4 rounded-2xl border bg-white p-5"
              >
                <div>
                  <h2 className="font-bold">
                    {m.display_name || "Unnamed member"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {m.is_published ? "Published" : "Unpublished"}
                  </p>
                  <p className="mt-1 break-all text-xs text-slate-400">
                    {m.id}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ...new Set(
                      [
                        m.photo_url,
                        ...(Array.isArray(m.additional_photo_urls)
                          ? m.additional_photo_urls
                          : []),
                      ].filter(
                        (url): url is string =>
                          typeof url === "string" && /^https?:\/\//.test(url),
                      ),
                    ),
                  ].map((url) => (
                    <div key={url} className="space-y-2">
                      <img
                        src={url}
                        alt={`Photo submitted by ${m.display_name || "member"}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                      <Button
                        className="w-full"
                        size="sm"
                        variant="outline"
                        onClick={() => choose(m, "photo", url)}
                      >
                        Remove photo
                      </Button>
                    </div>
                  ))}
                </div>
                {m.bio && (
                  <>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                      {m.bio}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => choose(m, "bio", m.bio)}
                    >
                      Remove biography
                    </Button>
                  </>
                )}
                {m.is_published && (
                  <Button
                    variant="destructive"
                    onClick={() => choose(m, "unpublish", null)}
                  >
                    Unpublish profile
                  </Button>
                )}
              </article>
            ))}
          </div>
          <Pager page={page} total={data?.total ?? 0} onPage={setPage} />
        </>
      )}
      <Dialog
        open={!!decision}
        onOpenChange={(open) => {
          if (!open && !busy) setDecision(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm content moderation</DialogTitle>
            <DialogDescription>
              {decision?.kind === "unpublish"
                ? "Unpublish the profile"
                : "Remove the selected content"}{" "}
              for {decision?.name}. The decision and reason will be recorded.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <label className="block text-sm">
              Reason
              <Textarea
                required
                minLength={10}
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2"
              />
            </label>
            {message && (
              <p role="alert" className="text-sm text-red-700">
                {message}
              </p>
            )}
            <Button variant="destructive" disabled={busy}>
              {busy ? "Saving…" : "Confirm decision"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
