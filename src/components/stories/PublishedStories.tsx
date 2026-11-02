"use client";
import { useEffect, useState } from 'react';
import { listPublishedStories, type PublishedStory } from '@/lib/supabase/stories';
import { Button } from '@/components/ui/button';
export function PublishedStories() {
  const [stories, setStories] = useState<PublishedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setFailed(false);
    listPublishedStories().then(rows => { if (active) setStories(rows); })
      .catch(() => { if (active) setFailed(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  if (loading) return <p role="status">Loading marriage stories…</p>;
  if (failed) return <div role="status"><p>Stories are unavailable right now.</p><Button variant="outline" onClick={() => setAttempt(n => n + 1)}>Try stories again</Button></div>;
  if (!stories.length) return null;
  return <section aria-label="Marriage stories shared with consent" className="grid gap-5 md:grid-cols-2">
    {stories.map(story => <article key={story.id} className="rounded-3xl border border-border bg-background p-6">
      <h2 className="font-serif text-2xl font-semibold">{story.couple_names}</h2>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">{story.story_text}</p>
    </article>)}
  </section>;
}
