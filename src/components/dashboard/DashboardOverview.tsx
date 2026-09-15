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
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PairedOrbit } from "@/components/decorative/PairedOrbit";
import { CulturalLinePattern } from "@/components/decorative/CulturalLinePattern";
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
  formatPhotoPrivacy,
  formatRelocation,
} from "@/lib/onboarding/readiness";
import { calculateAge } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function CountValue({ result }: { result: CountResult }) {
  if (result.status === "error") {
    return <span className="text-sm font-medium text-destructive">Unavailable</span>;
  }
  return <span className="text-xl font-semibold text-foreground">{result.value}</span>;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

function DiscoveryCard({
  person,
  onInterest,
  sending,
}: {
  person: DiscoveryPerson;
  onInterest: (id: string) => void;
  sending: boolean;
}) {
  const age = person.age ?? undefined;
  return (
    <article className="flex gap-3 rounded-xl border border-border bg-card p-3">
      <MemberAvatar
        name={person.displayName}
        photoURL={person.photoURL}
        className="h-16 w-16 rounded-xl"
        alt={`Profile photo of ${person.displayName}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/profile/${person.id}`}
              className="font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {person.displayName}
              {age ? <span className="font-normal text-muted-foreground">, {age}</span> : null}
            </Link>
            {person.isVerified ? (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Identity verified
              </p>
            ) : null}
          </div>
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {[person.profession, person.location].filter(Boolean).join(" · ") || "Details visible on their profile"}
        </p>
        {person.sharedPreference ? (
          <p className="mt-1 text-xs text-primary">{person.sharedPreference}</p>
        ) : null}
        <div className="mt-3 flex gap-2">
          <Button asChild size="sm" variant="outline" className="min-h-10">
            <Link href={`/profile/${person.id}`}>View profile</Link>
          </Button>
          <Button
            size="sm"
            className="min-h-10"
            disabled={sending}
            onClick={() => onInterest(person.id)}
          >
            {sending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Heart className="mr-1 h-4 w-4" />}
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
      const overview = await loadDashboardOverview(userId);
      setData(overview);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load your overview.";
      setError(message);
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

  if (loading) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading your overview</span>
        <OverviewSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>We could not load your overview</CardTitle>
          <CardDescription>{error || "Something went wrong."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void load()} className="min-h-11">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { profile, draft, readiness } = data;
  const displayName = profile.displayName || "there";
  const age = profile.ageYears ?? calculateAge(profile.dob);
  const countries =
    (draft.preferredSettlement && draft.preferredSettlement.length > 0
      ? draft.preferredSettlement.join(", ")
      : draft.country) || null;
  const languages = formatLanguageList(draft.languages);
  const relocation = formatRelocation(draft.relocationOpenness);
  const lookingFor = formatLookingFor(draft.lookingFor);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section
        aria-labelledby="welcome-heading"
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6"
      >
        <CulturalLinePattern position="top-right" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 opacity-40 motion-reduce:hidden" aria-hidden="true">
          <PairedOrbit size="sm" animate={false} />
        </div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <MemberAvatar
            name={profile.displayName || "Member"}
            photoURL={profile.photoURL || draft.photoURL}
            className="h-20 w-20 text-lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="welcome-heading" className="text-2xl font-semibold tracking-tight text-foreground">
                Welcome back, {firstName(displayName)}
              </h2>
              <Badge variant="outline" className="capitalize">
                {readiness.state}
              </Badge>
            </div>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Let’s take the next step towards a meaningful connection.
            </p>
            {age ? <p className="mt-1 text-sm text-muted-foreground">{age} years old</p> : null}
          </div>
          <Button asChild className="min-h-11 shrink-0">
            <Link href={readiness.primaryAction.href}>
              {readiness.primaryAction.label}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Profile readiness</CardTitle>
              <CardDescription>
                {readiness.isComplete
                  ? readiness.isPublished
                    ? "Your profile is published."
                    : "Your profile is complete. Publish when you are ready — a completed profile still needs an explicit publish."
                  : "Complete the remaining details when you have a moment."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {readiness.filled} of {readiness.total} core details
                  </span>
                  <span className="font-medium text-foreground">{readiness.percent}%</span>
                </div>
                <Progress
                  value={readiness.percent}
                  className="h-2 bg-[#EFECE8] motion-reduce:transition-none"
                  aria-label="Profile readiness"
                  aria-valuetext={`${readiness.percent} percent complete`}
                />
              </div>
              {!readiness.isPublished ? (
                <p className="text-sm text-muted-foreground">Only you can see your draft.</p>
              ) : null}
              {readiness.nextActions.length > 0 ? (
                <ul className="space-y-2">
                  {readiness.nextActions.map((action) => (
                    <li key={action.id}>
                      <Link
                        href={action.href}
                        className="inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        {action.label}
                        <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>

          <section aria-labelledby="activity-heading">
            <h2 id="activity-heading" className="sr-only">
              Activity overview
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href="/dashboard/interests"
                className="rounded-xl border border-border bg-card p-4 outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  Received interests
                </p>
                <div className="mt-2">
                  <CountValue result={data.receivedInterests} />
                </div>
                {data.receivedInterests.status === "error" ? (
                  <button type="button" onClick={() => void load()} className="mt-2 text-xs text-primary underline">
                    Retry
                  </button>
                ) : null}
              </Link>
              <Link
                href="/messages"
                className="rounded-xl border border-border bg-card p-4 outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Connections
                </p>
                <div className="mt-2">
                  <CountValue result={data.connections} />
                </div>
                {data.connections.status === "error" ? (
                  <button type="button" onClick={() => void load()} className="mt-2 text-xs text-primary underline">
                    Retry
                  </button>
                ) : null}
              </Link>
              <Link
                href="/messages"
                className="rounded-xl border border-border bg-card p-4 outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Unread messages
                </p>
                <div className="mt-2">
                  <CountValue result={data.unreadMessages} />
                </div>
                {data.unreadMessages.status === "error" ? (
                  <button type="button" onClick={() => void load()} className="mt-2 text-xs text-primary underline">
                    Retry
                  </button>
                ) : null}
              </Link>
            </div>
          </section>

          <section aria-labelledby="explore-heading" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 id="explore-heading" className="text-lg font-semibold text-foreground">
                People to explore
              </h2>
              {data.discovery.status === "ok" ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/discover">See all</Link>
                </Button>
              ) : null}
            </div>

            {data.discovery.status === "unpublished" ? (
              <Card className="border-border">
                <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                  <div className="relative mb-4" aria-hidden="true">
                    <PairedOrbit size="sm" animate={false} />
                  </div>
                  <h3 className="text-lg font-semibold">Publish your profile to start discovering people</h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Completing and publishing your profile is the next step. Other members will not see a draft.
                  </p>
                  <Button asChild className="mt-5 min-h-11">
                    <Link href={readiness.primaryAction.href}>Continue my profile</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {data.discovery.status === "empty" ? (
              <Card className="border-border">
                <CardContent className="px-6 py-10 text-center">
                  <h3 className="text-lg font-semibold">Your next connection is still ahead.</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your preferences or check back as the community grows.
                  </p>
                  <Button asChild variant="outline" className="mt-5 min-h-11">
                    <Link href="/onboarding?step=2">Review preferences</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {data.discovery.status === "error" ? (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Discovery is unavailable</CardTitle>
                  <CardDescription>
                    We could not load people to explore right now. {data.discovery.message}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => void load()} variant="outline" className="min-h-11">
                    <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                    Try again
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {data.discovery.status === "ok" ? (
              <div className="grid gap-3 md:grid-cols-2">
                {data.discovery.people.map((person) => (
                  <DiscoveryCard
                    key={person.id}
                    person={person}
                    sending={likingId === person.id}
                    onInterest={handleInterest}
                  />
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
                Partner preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <PreferenceRow label="Looking for" value={lookingFor} />
              <PreferenceRow label="Countries" value={countries} />
              <PreferenceRow label="Languages" value={languages} />
              <PreferenceRow label="Relocation" value={relocation} />
              <PreferenceRow label="Age range" value={null} />
              <Button asChild variant="outline" className="mt-2 min-h-11 w-full">
                <Link href="/onboarding?step=2">Edit preferences</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
                Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Visibility: </span>
                {profile.isPublished
                  ? "Published — visible to eligible members in discovery"
                  : "Draft — only you can see this profile"}
              </p>
              <p>
                <span className="text-muted-foreground">Photos: </span>
                {formatPhotoPrivacy(draft.photoPrivacy)}
              </p>
              <Button asChild variant="outline" className="min-h-11 w-full">
                <Link href="/dashboard/privacy">Manage privacy</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <section id="recent-activity" aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="sr-only">
          Recent activity
        </h2>
        <RecentActivity data={data} onRetry={() => void load()} />
      </section>
    </div>
  );
}

function PreferenceRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("max-w-[60%] text-right", !value && "text-muted-foreground")}>
        {value || "Not set"}
      </span>
    </div>
  );
}

function RecentActivity({
  data,
  onRetry,
}: {
  data: DashboardOverviewData;
  onRetry: () => void;
}) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {data.recent.status === "error" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">We could not load recent activity.</p>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : data.recent.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing new yet. When someone expresses interest or you connect, it will appear here.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.recent.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded-md text-sm text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
