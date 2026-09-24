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
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";
import { auth, onAuthStateChanged } from "@/lib/supabase/auth";
import {
  loadDashboardOverview,
  type CountResult,
  type DashboardOverviewData,
  type DiscoveryPerson,
} from "@/lib/supabase/dashboard";
import { sendInterest } from "@/lib/supabase/matches";
import {
  firstName,
  formatLanguageList,
  formatLookingFor,
  formatRelocation,
} from "@/lib/onboarding/readiness";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n/I18nProvider";
import { getMessages } from "@/components/i18n/messages";

function countText(result: CountResult) {
  return result.status === "error" ? "—" : String(result.value);
}

function OverviewSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-5" aria-hidden="true">
      <Skeleton className="h-44 w-full rounded-[28px]" />
      <Skeleton className="h-10 w-56 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        <Skeleton className="aspect-[3/4] w-full min-w-0 rounded-2xl" />
        <Skeleton className="aspect-[3/4] w-full min-w-0 rounded-2xl" />
        <Skeleton className="hidden aspect-[3/4] w-full min-w-0 rounded-2xl md:block" />
        <Skeleton className="hidden aspect-[3/4] w-full min-w-0 rounded-2xl xl:block" />
      </div>
      <Skeleton className="h-20 rounded-2xl" />
    </div>
  );
}

function DiscoveryCard({
  person,
  onInterest,
  sending,
  interested,
  labels,
}: {
  person: DiscoveryPerson;
  onInterest: (id: string) => void;
  sending: boolean;
  interested: boolean;
  labels: ReturnType<typeof getMessages>["overview"];
}) {
  const meta = [person.profession, person.location].filter(Boolean).join(" · ");

  return (
    <article className="group flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#eadde7] bg-white shadow-[0_8px_22px_rgba(75,32,67,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(75,32,67,0.12)]">
      <Link
        href={`/profile/${person.id}`}
        className="block bg-gradient-to-br from-[#f8e9f0] via-[#f3eef8] to-[#fff8f1] p-1.5 sm:p-2.5"
      >
        <div className="relative mx-auto aspect-square w-full max-w-[9.5rem] overflow-hidden rounded-xl sm:max-w-[11rem] sm:rounded-2xl">
          <MemberAvatar
            name={person.displayName}
            photoURL={person.photoURL}
            className="h-full w-full rounded-xl border-2 border-white text-base shadow-sm sm:rounded-2xl sm:text-lg"
            alt={`Profile photo of ${person.displayName}`}
          />
        </div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2 sm:gap-2 sm:p-3">
        <div className="min-w-0">
          <Link
            href={`/profile/${person.id}`}
            className="block truncate text-[13px] font-semibold leading-tight text-[#3b1837] hover:text-primary sm:text-sm"
          >
            <span className="truncate">{person.displayName}</span>
            {person.age ? (
              <span className="font-normal text-[#745d70]">, {person.age}</span>
            ) : null}
          </Link>
          {person.isVerified ? (
            <p className="mt-0.5 flex items-center gap-0.5 text-[10px] text-[#6d5b69] sm:text-[11px]">
              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
              <span className="truncate">{labels.verified}</span>
            </p>
          ) : null}
        </div>
        <p className="line-clamp-2 min-h-0 text-[11px] leading-snug text-[#745d70] sm:min-h-[2.25rem] sm:text-xs">
          {meta || "View profile for more"}
        </p>
        {person.sharedPreference ? (
          <p className="hidden truncate rounded-full bg-[#f5eafa] px-2 py-0.5 text-[10px] font-medium text-[#713c78] sm:inline-flex">
            {person.sharedPreference}
          </p>
        ) : null}
        <div className="mt-auto grid grid-cols-2 gap-1 pt-0.5 sm:gap-1.5 sm:pt-1">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 min-w-0 rounded-lg border-[#dcc9d8] bg-white px-1.5 text-[11px] sm:h-9 sm:px-2 sm:text-xs"
          >
            <Link href={`/profile/${person.id}`}>{labels.view}</Link>
          </Button>
          <Button
            size="sm"
            className="h-8 min-w-0 rounded-lg px-1.5 text-[11px] sm:h-9 sm:px-2 sm:text-xs"
            variant={interested ? "secondary" : "default"}
            disabled={sending || interested}
            onClick={() => onInterest(person.id)}
            aria-label={interested ? "Interest sent" : "Send interest"}
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin sm:mr-1" />
            ) : (
              <Heart
                className={`h-3.5 w-3.5 shrink-0 sm:mr-1 ${interested ? "fill-current text-primary" : ""}`}
              />
            )}
            <span className="truncate">{interested ? labels.sent : labels.interest}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function DashboardOverview() {
  const { toast } = useToast();
  const { language } = useI18n();
  const t = getMessages(language).overview;
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [interestedIds, setInterestedIds] = useState<Set<string>>(() => new Set());

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
    if (!userId || interestedIds.has(profileId)) return;
    setLikingId(profileId);
    try {
      await sendInterest({
        senderUid: userId,
        receiverUid: profileId,
      });
      setInterestedIds((prev) => new Set(prev).add(profileId));
      setData((prev) => {
        if (!prev || prev.discovery.status !== "ok") return prev;
        const people = prev.discovery.people.filter((person) => person.id !== profileId);
        return {
          ...prev,
          discovery: people.length > 0 ? { status: "ok", people } : { status: "empty" },
        };
      });
      toast({ title: "Interest sent", description: "They will see this in their interests." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again.";
      const already = message.toLowerCase().includes("already");
      if (already) {
        setInterestedIds((prev) => new Set(prev).add(profileId));
        setData((prev) => {
          if (!prev || prev.discovery.status !== "ok") return prev;
          const people = prev.discovery.people.filter((person) => person.id !== profileId);
          return {
            ...prev,
            discovery: people.length > 0 ? { status: "ok", people } : { status: "empty" },
          };
        });
      }
      toast({
        title: already ? "Already sent" : "Could not send interest",
        description: message,
        variant: already ? "default" : "destructive",
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
        <CardContent><Button onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />{t.tryAgain}</Button></CardContent>
      </Card>
    );
  }

  const { profile, draft, readiness } = data;
  const displayName = firstName(profile.displayName || "there");
  const countries = (draft.preferredSettlement?.length ? draft.preferredSettlement.join(", ") : draft.country) || null;
  const languages = formatLanguageList(draft.languages);
  const lookingFor = formatLookingFor(draft.lookingFor);
  const relocation = formatRelocation(draft.relocationOpenness);
  const conversation =
    data.recent.status === "ok" && data.recent.items.length > 0 ? data.recent.items[0] : null;

  return (
    <PageFrame>
      <PageHero
        eyebrow={t.journey}
        title={`${t.welcome}, ${displayName}`}
        description={t.hero}
        leading={
          <MemberAvatar
            name={profile.displayName || "Member"}
            photoURL={profile.photoURL || draft.photoURL}
            className="h-20 w-20 border-4 border-white text-lg shadow-md"
          />
        }
        actions={
          <Button asChild size="lg" className="min-h-12 rounded-xl px-5 shadow-sm">
            <Link href="/discover">
              {t.discover}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="matches-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b668f]">{t.chosen}</p>
            <h2 id="matches-heading" className="mt-1 text-2xl font-semibold text-[#351532]">{t.suggested}</h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/discover">{t.exploreAll}<ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>

        {data.discovery.status === "ok" ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {data.discovery.people.slice(0, 8).map((person) => (
              <DiscoveryCard
                key={person.id}
                person={person}
                sending={likingId === person.id}
                interested={interestedIds.has(person.id)}
                onInterest={handleInterest}
                labels={t}
              />
            ))}
          </div>
        ) : data.discovery.status === "unpublished" ? (
          <div className="rounded-3xl border border-[#eadde7] bg-white px-6 py-8 text-center shadow-sm">
            <Sparkles className="mx-auto h-8 w-8 text-[#9b668f]" />
            <h3 className="mt-3 text-lg font-semibold text-[#351532]">Complete your profile to meet the right people</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[#745d70]">Your profile stays private until you publish it. Once ready, we can show real members who fit your preferences.</p>
            <Button asChild className="mt-5 rounded-xl"><Link href={readiness.primaryAction.href}>{t.continueProfile}</Link></Button>
          </div>
        ) : data.discovery.status === "empty" ? (
          <div className="rounded-3xl border border-[#eadde7] bg-[linear-gradient(135deg,#fff,#fbf2f7)] px-6 py-8 text-center shadow-sm">
            <Heart className="mx-auto h-8 w-8 text-[#a56b97]" />
            <h3 className="mt-3 text-lg font-semibold text-[#351532]">{t.noMatches}</h3>
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
          <span><strong className="block text-lg text-[#351532]">{countText(data.receivedInterests)}</strong><span className="text-xs text-[#745d70]">{t.received}</span></span>
        </Link>
        <Link href="/connections" className="flex items-center gap-3 border-t border-[#eee2ea] p-4 hover:bg-[#fff8fb] sm:border-r sm:border-t-0">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f1edfb] text-[#7254a1]"><Users className="h-4 w-4" /></span>
          <span><strong className="block text-lg text-[#351532]">{countText(data.connections)}</strong><span className="text-xs text-[#745d70]">{t.connections}</span></span>
        </Link>
        <Link href="/messages" className="flex items-center gap-3 border-t border-[#eee2ea] p-4 hover:bg-[#fff8fb] sm:border-t-0">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#edf8f4] text-[#367b66]"><MessageCircle className="h-4 w-4" /></span>
          <span><strong className="block text-lg text-[#351532]">{countText(data.unreadMessages)}</strong><span className="text-xs text-[#745d70]">{t.unread}</span></span>
        </Link>
      </section>

      {conversation ? (
        <section aria-labelledby="conversation-heading" className="rounded-3xl border border-[#eadde7] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b668f]">Keep the connection moving</p>
              <h2 id="conversation-heading" className="mt-1 text-xl font-semibold text-[#351532]">Continue your conversation</h2>
              <p className="mt-1 text-sm text-[#745d70]">{conversation.title}</p>
            </div>
            <Button asChild className="rounded-xl"><Link href={conversation.href}>Open conversation<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="rounded-3xl border border-[#eadde7] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b668f]">Small improvements, better introductions</p>
              <h2 className="mt-1 text-xl font-semibold text-[#351532]">{t.profileComplete.replace("{percent}", String(readiness.percent))}</h2>
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
            <h2 className="flex items-center gap-2 font-semibold text-[#351532]"><SlidersHorizontal className="h-4 w-4 text-[#9b668f]" />{t.preferences}</h2>
            <Link href="/onboarding?step=2" className="text-sm font-medium text-primary hover:underline">{t.edit}</Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[lookingFor, countries, languages, relocation].filter(Boolean).map((value) => (
              <span key={value} className="max-w-full truncate rounded-full border border-[#e5d4df] bg-white px-3 py-1.5 text-xs text-[#634f60]">{value}</span>
            ))}
            {![lookingFor, countries, languages, relocation].some(Boolean) ? <span className="text-sm text-[#745d70]">{t.none}</span> : null}
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-[#eadde7] pt-4 text-xs text-[#745d70]">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> {t.privacy}
          </div>
        </aside>
      </div>
    </PageFrame>
  );
}
