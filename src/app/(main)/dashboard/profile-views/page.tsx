"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdminResource } from "@/components/admin/use-admin-resource";
import { ResourceState, Pager } from "@/components/admin/workspace-ui";
type Visitor = {
  id: string;
  display_name: string;
  photo_url: string | null;
  viewed_at: string;
};
export default function ProfileViews() {
  const [page, setPage] = useState(1);
  const { data, error, loading, refresh } = useAdminResource<{
    locked: boolean;
    viewers: Visitor[];
    total: number;
  }>(`/api/members/activity?page=${page}`);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Who viewed your profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Recent member visits from the last 90 days. Private browsing, staff
            review visits and blocked members are excluded.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
      <ResourceState loading={loading} error={error} empty={false} />
      {!loading &&
        !error &&
        data &&
        (data.locked ? (
          <section className="space-y-4 rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold">
              Profile visitors is a Premium feature
            </h2>
            <p className="text-sm text-slate-500">
              An active Premium membership or introductory trial lets you see
              recent visitors.
            </p>
            <Button asChild>
              <Link href="/pricing">View membership options</Link>
            </Button>
          </section>
        ) : (
          <>
            <ResourceState
              loading={false}
              error=""
              empty={!data.viewers.length}
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.viewers.map((v) => (
                <article
                  key={v.id}
                  className="flex items-center gap-3 rounded-2xl border bg-white p-5"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={v.photo_url || undefined} alt="" />
                    <AvatarFallback>
                      {(v.display_name || "M").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/profile/${v.id}`}
                      className="font-semibold text-violet-800"
                    >
                      {v.display_name || "Member"}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      Last visited{" "}
                      {new Date(v.viewed_at).toLocaleString("en-GB")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            <Pager page={page} total={data.total} size={20} onPage={setPage} />
          </>
        ))}
    </div>
  );
}
