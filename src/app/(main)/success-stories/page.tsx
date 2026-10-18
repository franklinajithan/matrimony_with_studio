import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
type Story = {
  id: string;
  couple_names: string;
  story_text: string;
  photo_url: string | null;
};
export default async function SuccessStories() {
  let stories: Story[] = [];
  let unavailable = false;
  try {
    const db = await createSupabaseServerClient();
    const { data, error } = await db.rpc("published_success_stories");
    if (error) throw error;
    stories = data ?? [];
  } catch {
    unavailable = true;
  }
  return (
    <div className="space-y-8 py-8">
      <section className="rounded-3xl border border-rose-100 bg-rose-50 px-6 py-12 text-center">
        <h1 className="text-3xl font-bold text-slate-950 sm:text-5xl">
          CupidMatch success stories
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          Real stories shared by our community and reviewed by the CupidMatch
          team.
        </p>
        <Button asChild className="mt-6">
          <Link href="/success-stories/submit">Share your story</Link>
        </Button>
      </section>
      {unavailable ? (
        <p role="alert" className="rounded-2xl border p-6">
          Stories are temporarily unavailable. Please try again later.
        </p>
      ) : stories.length === 0 ? (
        <p className="py-10 text-center text-slate-500">
          Our community’s stories will appear here after review.
        </p>
      ) : (
        <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <article
              key={s.id}
              className="overflow-hidden rounded-2xl border bg-white"
            >
              {s.photo_url && /^https?:\/\//.test(s.photo_url) && (
                <img
                  src={s.photo_url}
                  alt={s.couple_names}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
              <div className="p-6">
                <h2 className="text-xl font-bold">{s.couple_names}</h2>
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                  {s.story_text}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
