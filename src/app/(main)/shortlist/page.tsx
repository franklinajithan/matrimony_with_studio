"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/dashboard/MemberAvatar";
type Item = {
  id: string;
  profileId: string;
  savedAt: string;
  profile: null | {
    display_name: string;
    photo_url: string | null;
    location: string | null;
    profession: string | null;
  };
};
export default function ShortlistPage() {
  const [page, setPage] = useState(1),
    [data, setData] = useState<{ items: Item[]; total: number } | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState<string | null>(null),
    [loading, setLoading] = useState(false),
    [notice, setNotice] = useState("");
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/shortlist?page=" + page, {
            signal,
            cache: "no-store",
          }),
          result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Unable to load shortlist.");
        if (!signal?.aborted) {
          if (page > Math.max(1, Math.ceil(result.total / 20)))
            setPage(Math.max(1, Math.ceil(result.total / 20)));
          else setData(result);
        }
      } catch (error) {
        if (!signal?.aborted) {
          setData(null);
          setError((error as Error).message);
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page],
  );
  useEffect(() => {
    const abort = new AbortController();
    void load(abort.signal);
    return () => abort.abort();
  }, [load]);
  async function remove(id: string) {
    setBusy(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/shortlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to remove.");
      setNotice("Removed from your shortlist.");
      await load();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-semibold">Your shortlist</h1>
        <p className="mt-2 text-muted-foreground">
          Saved profiles are private to you. Unavailable profiles stay hidden
          and can be removed.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/discover">Find matches</Link>
      </Button>
      {error ? (
        <div role="alert" className="space-y-2">
          <p>{error}</p>
          <Button onClick={() => void load()}>Retry</Button>
          <Link className="ml-3 underline" href="/login?next=%2Fshortlist">
            Sign in again
          </Link>
        </div>
      ) : null}
      {notice ? <p role="status">{notice}</p> : null}
      {loading ? <p role="status">Loading your shortlist…</p> : null}
      {!loading && data?.total === 0 ? (
        <p>
          No saved profiles yet. Use the bookmark button while finding matches.
        </p>
      ) : null}
      {!loading && data ? (
        <>
          <p className="text-sm text-muted-foreground">
            {data.total} saved · Page {page} of{" "}
            {Math.max(1, Math.ceil(data.total / 20))}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {data.items.map((item) => (
              <article
                key={item.id}
                className="flex min-w-0 items-center gap-3 rounded-xl border p-4"
              >
                <MemberAvatar
                  name={item.profile?.display_name || "Unavailable profile"}
                  photoURL={item.profile?.photo_url}
                />
                <div className="min-w-0 flex-1">
                  {item.profile ? (
                    <>
                      <Link
                        className="font-semibold underline"
                        href={"/profile/" + item.profileId}
                      >
                        {item.profile.display_name || "Member"}
                      </Link>
                      <p className="break-words text-sm text-muted-foreground">
                        {[item.profile.profession, item.profile.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Profile no longer available
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!busy}
                  onClick={() => void remove(item.id)}
                  aria-label={
                    "Remove " +
                    (item.profile?.display_name || "unavailable profile") +
                    " from shortlist"
                  }
                >
                  {busy === item.id ? "Removing…" : "Remove"}
                </Button>
              </article>
            ))}
          </div>
          <nav aria-label="Shortlist pages" className="flex items-center gap-3">
            <Button
              variant="outline"
              disabled={page <= 1 || loading || !!busy}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page * 20 >= data.total || loading || !!busy}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </nav>
        </>
      ) : null}
    </main>
  );
}
