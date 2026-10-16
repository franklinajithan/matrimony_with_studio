"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdminResource } from "@/components/admin/use-admin-resource";
import { ResourceState, Pager } from "@/components/admin/workspace-ui";
type Block = {
  id: string;
  blocked_id: string;
  display_name: string;
  created_at: string;
};
export function BlockedMembers() {
  const [page, setPage] = useState(1),
    [busy, setBusy] = useState<string | null>(null),
    [confirm, setConfirm] = useState<string | null>(null),
    [message, setMessage] = useState("");
  const { data, error, loading, refresh } = useAdminResource<{
    blocks: Block[];
    total: number;
  }>(`/api/members/block?page=${page}`);
  async function unblock(id: string) {
    setBusy(id);
    setMessage("");
    try {
      const response = await fetch(
        `/api/members/block?memberId=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Unable to unblock this member");
      setConfirm(null);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to unblock");
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <h2 className="text-xl font-bold">Blocked members</h2>
      <p className="text-sm leading-6 text-slate-500">
        Unblocking allows future interaction. It does not restore an old
        connection, and a block made by the other member remains in effect.
      </p>
      <ResourceState
        loading={loading}
        error={error}
        empty={!data?.blocks.length}
      />
      {!loading && !error && (
        <>
          <ul className="divide-y">
            {data?.blocks.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-semibold">{b.display_name || "Member"}</p>
                  <p className="text-xs text-slate-500">
                    Blocked {new Date(b.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
                {confirm === b.blocked_id ? (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      disabled={busy !== null}
                      onClick={() => void unblock(b.blocked_id)}
                    >
                      Confirm unblock
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy !== null}
                      onClick={() => setConfirm(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setConfirm(b.blocked_id)}
                  >
                    Unblock
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <Pager
            page={page}
            total={data?.total ?? 0}
            size={20}
            onPage={setPage}
          />
        </>
      )}
      {message && (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      )}
    </section>
  );
}
