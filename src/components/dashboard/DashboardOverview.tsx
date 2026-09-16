"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberAvatar } from "@/components/dashboard/MemberAvatar";
import { auth, onAuthStateChanged } from "@/lib/supabase/auth";
import {
  loadDashboardOverview,
  type CountResult,
  type DashboardOverviewData,
  type DiscoveryPerson,
} from "@/lib/supabase/dashboard";
import { likeProfile } from "@/lib/supabase/likes";
import {
  firstName,
  formatLanguageList,
  formatLookingFor,
  formatRelocation,
} from "@/lib/onboarding/readiness";
import { useToast } from "@/hooks/use-toast";

function countText(result: CountResult) {
  return result.status === "error" ? "—" : String(result.value);
}

function OverviewSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-5" aria-hidden="true">
      <Skeleton className="h-44 w-full rounded-[28px]" />
      <Skeleton className="h-10 w-56 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
      <Skeleton className="h-20 rounded-2xl" />
    </div>
  );
}

function DiscoveryCard({ person, onInterest, sending }: {
  person: DiscoveryPerson;
  onInterest: (id: string) => void;
  sending: boolean;
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-[#eadde7] bg-white shadow-[0_12px_34px_rgba(75,32,67,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(75,32,67,0.13)]">
      <Link href={`/profile/${person.id}`} className="block bg-gradient-to-br from-[#f8e9f0] via-[#f3eef8] to-[#fff8f1] p-4">
        <MemberAvatar
          name={person.displayName}
          photoURL={person.photoURL}
          className="mx-auto h-40 w-40 rounded-[26px] border-4 border-white text-2xl shadow-md sm:h-44 sm:w-44"
          alt={`Profile photo of ${person.displayName}`}
        />
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/profile/${person.id}`} className="text-lg font-semibold text-[#3b1837] hover:text-primary">
              {person.displayName}{person.age ? <span className="font-normal text-[#745d70]">, {person.age}</span> : null}
            </Link>
            {person.isVerified ? (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-[#6d5b69]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> Verified profile
              </p>
            ) : null}
          </div>
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm text-[#745d70]">
          {[person.profession, person.location].filter(Boolean).join(" · ") || "View their profile to learn more"}
        </p>
        {person.sharedPreference ? (
          <p className="mt-2 inline-flex rounded-full bg-[#f5eafa] px-2.5 py-1 text-xs font-medium text-[#713c78]">{person.sharedPreference}</p>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="min-h-11 rounded-xl border-[#dcc9d8] bg-white">
            <Link href={`/profile/${person.id}`}>View profile</Link>
          </Button>
          <Button className="min-h-11 rounded-xl" disabled={sending} onClick={() => onInterest(person.id)}>
            {sending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Heart className="mr-1.5 h-4 w-4" />}
            Interest
          </Button>
        </div>
      </div>
    </article>
  );
}

export function DashboardOverview() {
  const { toast } = useToast();
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      setData(await loadDashboardOverview(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your overview.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authReady || !userId) {
      if (authReady && !userId) setLoading(false);
      return;
    }
    void load();
  }, [authReady, load, userId]);

  const handleInterest = async (profileId: string) => {
    if (!userId) return;
    setLikingId(profileId);
    try {
      await likeProfile(userId, profileId);
      toast({ title: "Interest sent", description: "They will see this in their interests." });
    } catch (err) {
      toast({
        title: "Could not send interest",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLikingId(null);
    }
  };

  if (loading) return <div role="status"><span className="sr-only">Loading your overview</span><OverviewSkeleton /></div>;

  if (error || !data) {
    return (
      <Card className="mx-auto max-w-3xl border-border">
        <CardHeader><CardTitle>We could not load your overview</CardTitle><CardDescription>{error || "Something went wrong."}</CardDescription></CardHeader>
        <CardContent><Button onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button></CardContent>
      </Card>
    );
  }

  const { profile, draft, readiness } = data;
  const displayName = firstName(profile.displayName || "there");
  const countries = (draft.preferredSettlement?.length ? draft.preferredSettlement.join(", ") : draft.country) || null;
  const languages = formatLanguageList(draft.languages);
  const lookingFor = formatLookingFor(draft.lookingFor);
  const relocation = formatRelocation(draft.relocationOpenness);
  const hasConversation = data.recent.status === "ok" && data.recent.items.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-8">
      <section className="relative overflow-hidden rounded-[30px] border border-[#eadce5] bg-[radial-gradient(circle_at_88%_12%,rgba(184,113,172,0.20),transparent_34%),linear-gradient(135deg,#fffaf4_0%,#fff_45%,#f8eef7_100%)] p-5 shadow-[0_14px_45px_rgba(67,31,61,0.08)] sm:p-7">
        <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full border border-[#dcb8d4]/50" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
          <MemberAvatar name={profile.displayName || "Member"} photoURL={profile.photoURL || draft.photoURL} className="h-20 w-20 border-4 border-white text-lg shadow-md" />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8d5b84]">Your CupidMatch journey</p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#351532] sm:text-3xl">Welcome, {displayName}</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#745d70] sm:text-base">Find someone who shares your values, your outlook and the life you want to build.</p>
          </div>
          <Button asChild size="lg" className="min-h-12 rounded-xl px-5 shadow-sm">
            <Link href="/discover">Discover matches<ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="matches-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b668f]">Chosen around your preferences</p>
            <h2 id="matches-heading" className="mt-1 text-2xl font-semibold text-[#351532]">Suggested matches</h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/discover">Explore all<ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>

        {data.discovery.status === "ok" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.discovery.people.slice(0, 3).map((person) => (
              <DiscoveryCard key={person.id} person={person} sending={likingId === person.id} onInterest={handleInterest} />
            ))}
          </div>
        ) : data.discovery.status === "unpublished" ? (
          <div className="rounded-3xl border border-[#eadde7] bg-white px-6 py-8 text-center shadow-sm">
            <Sparkles className="mx-auto h-8 w-8 text-[#9b668f]" />
            <h3 className="mt-3 text-lg font-semibold text-[#351532]">Complete your profile to meet the right people</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[#745d70]">Your profile stays private until you publish it. Once ready, we can show real members who fit your preferences.</p>
            <Button asChild className="mt-5 rounded-xl"><Link href={readiness.primaryAction.href}>Continue my profile</Link></Button>
          </div>
        ) : data.discovery.status === "empty" ? (
          <div className="rounded-3xl border border-[#eadde7] bg-[linear-gradient(135deg,#fff,#fbf2f7)] px-6 py-8 text-center shadow-sm">
            <Heart className="mx-auto h-8 w-8 text-[#a56b97]" />
            <h3 className="mt-3 text-lg font-semibold text-[#351532]">No close matches yet</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[#745d70]">We won’t invent profiles to fill this space. Widen a preference or explore the community to see more real members.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild className="rounded-xl"><Link href="/onboarding?step=2">Adjust preferences</Link></Button>
              <Button asChild variant="outline" className="rounded-xl"><Link href="/discover">Explore all profiles</Link></Button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-[#eadde7] bg-white px-6 py-8 text-center">
            <p className="text-sm text-[#745d70]">Matches could not be loaded right now.</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button>
          </div>
        )}
        <Button asChild variant="outline" className="w-full rounded-xl sm:hidden"><Link href="/discover">Explore all profiles</Link></Button>
      </section>

      <section aria-label="Your activity" className="grid overflow-hidden rounded-2xl border border-[#eadde7] bg-white shadow-sm sm:grid-cols-3">
        <Link href="/dashboard/interests" className="flex items-center gap-3 p-4 hover:bg-[#fff8fb] sm:border-r sm:border-[#eee2ea]">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#faedf3] text-[#9a4f78]"><Heart className="h-4 w-4" /></span>
          <span><strong className="block text-lg text-[#351532]">{countText(data.receivedInterests)}</strong><span className="text-xs text-[#745d70]">Received interests</span></span>
        </Link>
        <Link href="/connections" className="flex items-center gap-3 border-t border-[#eee2ea] p-4 hover:bg-[#fff8fb] sm:border-r sm:border-t-0">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f1edfb] text-[#7254a1]"><Users className="h-4 w-4" /></span>
          <span><strong className="block text-lg text-[#351532]">{countText(data.connections)}</strong><span className="text-xs text-[#745d70]">Connections</span></span>
        </Link>
        <Link href="/messages" className="flex items-center gap-3 border-t border-[#eee2ea] p-4 hover:bg-[#fff8fb] sm:border-t-0">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#edf8f4] text-[#367b66]"><MessageCircle className="h-4 w-4" /></span>
          <span><strong className="block text-lg text-[#351532]">{countText(data.unreadMessages)}</strong><span className="text-xs text-[#745d70]">Unread messages</span></span>
        </Link>
      </section>

      {hasConversation ? (
        <section aria-labelledby="conversation-heading" className="rounded-3xl border border-[#eadde7] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b668f]">Keep the connection moving</p>
              <h2 id="conversation-heading" className="mt-1 text-xl font-semibold text-[#351532]">Continue your conversation</h2>
              <p className="mt-1 text-sm text-[#745d70]">{data.recent.items[0].title}</p>
            </div>
            <Button asChild className="rounded-xl"><Link href={data.recent.items[0].href}>Open conversation<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="rounded-3xl border border-[#eadde7] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b668f]">Small improvements, better introductions</p>
              <h2 className="mt-1 text-xl font-semibold text-[#351532]">Your profile is {readiness.percent}% complete</h2>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl"><Link href={readiness.primaryAction.href}>{readiness.primaryAction.label}</Link></Button>
          </div>
          <Progress value={readiness.percent} className="mt-5 h-2.5 bg-[#f0e7ed]" aria-label="Profile completion" />
          <p className="mt-3 text-sm text-[#745d70]">
            {readiness.isPublished ? "Your profile is published and ready to be discovered." : "Finish the most useful details, then publish when you’re comfortable."}
          </p>
        </section>

        <aside className="rounded-3xl border border-[#eadde7] bg-[#fffaf6] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold text-[#351532]"><SlidersHorizontal className="h-4 w-4 text-[#9b668f]" />Preferences</h2>
            <Link href="/onboarding?step=2" className="text-sm font-medium text-primary hover:underline">Edit</Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[lookingFor, countries, languages, relocation].filter(Boolean).map((value) => (
              <span key={value} className="max-w-full truncate rounded-full border border-[#e5d4df] bg-white px-3 py-1.5 text-xs text-[#634f60]">{value}</span>
            ))}
            {![lookingFor, countries, languages, relocation].some(Boolean) ? <span className="text-sm text-[#745d70]">No preferences set yet.</span> : null}
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-[#eadde7] pt-4 text-xs text-[#745d70]">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Privacy controls remain in your hands.
          </div>
        </aside>
      </div>
    </div>
  );
}
