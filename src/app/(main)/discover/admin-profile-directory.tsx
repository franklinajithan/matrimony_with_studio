import "server-only";
import Link from "next/link";
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { calculateAge } from "@/lib/utils";

const PAGE_SIZE = 24;

export async function AdminProfileDirectory({ page }: { page?: string | string[] }) {
  const requested = typeof page === "string" ? Number(page) : 1;
  const current = Number.isSafeInteger(requested) && requested >= 1 && requested <= Math.floor(Number.MAX_SAFE_INTEGER / PAGE_SIZE)
    ? requested
    : 1;
  const offset = (current - 1) * PAGE_SIZE;
  const client = await createSupabaseServerClient();
  const { data, error, count } = await client.from("profiles")
    .select("id,display_name,dob,location,profession,is_published,suspended_at", { count: "exact" })
    .order("display_name", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) console.error("Admin Matches profile query failed", { code: error.code });
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <PageFrame>
      <PageHero eyebrow="Admin" title="All member profiles" showTitle />
      {error ? <p role="alert">Unable to load profiles. Reload the page to try again.</p> : (
        <>
          <p className="text-sm text-muted-foreground">{total} {total === 1 ? "profile" : "profiles"}</p>
          {data.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.map(profile => {
                const age = calculateAge(profile.dob ?? undefined);
                return (
                  <Card key={profile.id}>
                    <CardContent className="space-y-2 p-4">
                      <h2 className="break-words font-semibold">{profile.display_name?.trim() || "Unnamed profile"}{age ? `, ${age}` : ""}</h2>
                      {[profile.location, profile.profession].filter(Boolean).map((value, index) => (
                        <p key={index} className="break-words text-sm text-muted-foreground">{value}</p>
                      ))}
                      <p className="text-sm text-muted-foreground">
                        {profile.suspended_at ? "Suspended" : profile.is_published ? "Published" : "Unpublished"}
                      </p>
                      <Link className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4" href={`/admin/users/edit/${profile.id}`}>
                        View member details
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : <p>{total ? "There are no profiles on this page." : "No member profiles found."}</p>}
          {current > 1 || pages > 1 ? (
            <nav aria-label="Member profile pages" className="flex flex-wrap items-center gap-4 text-sm">
              {current > pages ? <Link className="underline" href="/discover">First page</Link> : (
                <>
                  {current > 1 && <Link className="underline" href={`/discover?page=${current - 1}`}>Previous</Link>}
                  <span>Page {current} of {pages}</span>
                  {current < pages && <Link className="underline" href={`/discover?page=${current + 1}`}>Next</Link>}
                </>
              )}
            </nav>
          ) : null}
        </>
      )}
    </PageFrame>
  );
}
