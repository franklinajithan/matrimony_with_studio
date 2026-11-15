import "server-only";
import Link from "next/link";
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";
import { Briefcase, MapPin } from "lucide-react";
import { PhotoPreview } from "@/components/profile/PhotoPreview";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { mapProfile } from "@/lib/supabase/profiles";
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
    .select("id,display_name,dob,location,profession,is_published,suspended_at,photo_url,additional_photo_urls,extra", { count: "exact" })
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
            <div className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 lg:gap-5 xl:grid-cols-4">
              {data.map(profile => {
                const member = mapProfile(profile);
                const name = profile.display_name?.trim() || "Unnamed profile";
                const age = calculateAge(profile.dob ?? undefined);
                const photos = [
                  ...(member?.photoURL ? [{ url: member.photoURL, grayscale: member.profilePhotoGrayscale }] : []),
                  ...(member?.additionalPhotoUrls ?? []),
                ].filter((photo, index, all) => photo.url && all.findIndex(item => item.url === photo.url) === index);
                const cover = photos[0];
                return (
                  <Card key={profile.id} className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border-border shadow-sm">
                    <div className="h-44 w-full shrink-0 overflow-hidden bg-accent sm:h-52 md:h-56">
                      {cover ? (
                        <PhotoPreview photos={photos} index={0} name={name}>
                          <button type="button" aria-label={`Enlarge photos of ${name}`} className="block h-full w-full cursor-zoom-in focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={cover.url} alt="" loading="lazy" className={`h-full w-full object-cover${cover.grayscale ? " grayscale" : ""}`} />
                          </button>
                        </PhotoPreview>
                      ) : (
                        <div aria-hidden className="flex h-full items-center justify-center text-4xl font-semibold text-primary">{name[0]}</div>
                      )}
                    </div>
                    <CardContent className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
                      <h2 className="break-words text-sm font-semibold leading-tight sm:text-base">
                        {name}{age ? <span className="font-normal text-muted-foreground">, {age}</span> : null}
                      </h2>
                      {profile.profession && <p className="flex items-start gap-1 text-xs text-muted-foreground sm:text-sm">
                        <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="min-w-0 break-words">{profile.profession}</span>
                      </p>}
                      {profile.location && <p className="flex items-start gap-1 text-xs text-muted-foreground sm:text-sm">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="min-w-0 break-words">{profile.location}</span>
                      </p>}
                      <p className="text-xs font-medium text-muted-foreground">
                        {profile.suspended_at ? "Suspended" : profile.is_published ? "Published" : "Unpublished"}
                      </p>
                    </CardContent>
                    <CardFooter className="mt-auto border-t border-border p-2 sm:p-3">
                      <Link className="inline-flex min-h-11 w-full items-center justify-center rounded-md border px-2 text-center text-xs font-medium text-primary hover:bg-accent sm:text-sm" href={`/admin/users/edit/${profile.id}`}>
                        View member details
                      </Link>
                    </CardFooter>
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
