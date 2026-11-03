"use client";
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { withdrawStoryConsent } from '@/lib/supabase/stories';
import { Button } from '@/components/ui/button';
type OwnStory = { id: string; couple_names: string; publication_consent: boolean; status: string };
export function StoryConsentControls() {
  const [stories, setStories] = useState<OwnStory[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) return;
        const { data, error } = await supabase.from('success_stories').select('id,couple_names,publication_consent,status').eq('submitted_by_uid', auth.user.id).order('submitted_at', { ascending: false }).limit(50);
        if (error) throw error;
        if (active) setStories(data || []);
      } catch { if (active) setMessage('Your story consent controls are unavailable. Refresh to try again.'); }
    })();
    return () => { active = false; };
  }, []);
  const withdraw = async (id: string) => {
    if (lock.current) return;
    lock.current = true; setBusy(id); setMessage('');
    try {
      await withdrawStoryConsent(id);
      setStories(rows => rows.map(row => row.id === id ? { ...row, publication_consent: false, status: 'rejected' } : row));
      setMessage('Consent withdrawn. Your story is no longer available in the public story feed.');
    } catch { setMessage('Could not withdraw consent. Refresh and try again.'); }
    finally { lock.current = false; setBusy(null); }
  };
  return <section aria-label="Your story publication consent" className="space-y-3 border-t border-border pt-5">
    <h2 className="font-serif text-xl font-semibold">Your story publication consent</h2>
    <p className="text-sm text-muted-foreground">Withdraw permission to show a submitted marriage story on CupidMatch.</p>
    {stories.map(story => <div key={story.id} className="space-y-2 rounded-xl border border-border p-3">
      <p className="break-words font-medium">{story.couple_names}</p>
      {story.publication_consent ? <Button variant="outline" disabled={busy !== null} onClick={() => void withdraw(story.id)}>{busy === story.id ? 'Withdrawing…' : 'Withdraw publication consent'}</Button> : <p className="text-sm text-muted-foreground">No active publication consent</p>}
    </div>)}
    <p role="status" className="text-sm">{message}</p>
  </section>;
}
