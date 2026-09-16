"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Heart, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberAvatar } from "@/components/dashboard/MemberAvatar";
import { auth, onAuthStateChanged } from "@/lib/supabase/auth";
import { listReceivedLikes, listSentLikes, unlikeProfile, type LikeRow } from "@/lib/supabase/likes";
import { listProfilesByIds } from "@/lib/supabase/profiles";
import type { Profile } from "@/lib/supabase/types";
import { calculateAge } from "@/lib/utils";
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";

type InterestList = { status: "ok"; rows: LikeRow[] } | { status: "error"; message: string };

export default function InterestsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [received, setReceived] = useState<InterestList | null>(null);
  const [sent, setSent] = useState<InterestList | null>(null);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null));
    return () => unsubscribe();
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [receivedResult, sentResult] = await Promise.allSettled([
      listReceivedLikes(userId),
      listSentLikes(userId),
    ]);

    const receivedRows = receivedResult.status === "fulfilled" ? receivedResult.value : [];
    const sentRows = sentResult.status === "fulfilled" ? sentResult.value : [];

    setReceived(
      receivedResult.status === "fulfilled"
        ? { status: "ok", rows: receivedResult.value }
        : {
            status: "error",
            message:
              receivedResult.reason instanceof Error
                ? receivedResult.reason.message
                : "Could not load received interests.",
          }
    );
    setSent(
      sentResult.status === "fulfilled"
        ? { status: "ok", rows: sentResult.value }
        : {
            status: "error",
            message:
              sentResult.reason instanceof Error ? sentResult.reason.message : "Could not load sent interests.",
          }
    );

    try {
      const ids = [
        ...receivedRows.map((row) => row.likerId),
        ...sentRows.map((row) => row.likedId),
      ];
      const people = await listProfilesByIds(ids);
      setProfiles(new Map(people.map((person) => [person.id, person])));
    } catch {
      setProfiles(new Map());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) void load();
  }, [load, userId]);

  const handleUnlike = async (likedId: string) => {
    if (!userId) return;
    await unlikeProfile(userId, likedId);
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Loading interests
      </div>
    );
  }

  return (
    <PageFrame>
      <PageHero
        eyebrow="Interest inbox"
        title="Interests"
        description="Review who has reached out, and track requests you’ve sent."
      />
      <InterestSection
        title="Received"
        description="Members who have expressed interest in your profile."
        list={received}
        resolveId={(row) => row.likerId}
        profiles={profiles}
        onRetry={() => void load()}
        empty="No received interests yet."
      />
      <InterestSection
        title="Sent"
        description="People you have expressed interest in."
        list={sent}
        resolveId={(row) => row.likedId}
        profiles={profiles}
        onRetry={() => void load()}
        empty="You have not sent any interests yet."
        onUnlike={handleUnlike}
      />
    </PageFrame>
  );
}

function InterestSection({
  title,
  description,
  list,
  resolveId,
  profiles,
  onRetry,
  empty,
  onUnlike,
}: {
  title: string;
  description: string;
  list: InterestList | null;
  resolveId: (row: LikeRow) => string;
  profiles: Map<string, Profile>;
  onRetry: () => void;
  empty: string;
  onUnlike?: (id: string) => void;
}) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!list || list.status === "error" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{list?.message || "Could not load this list."}</p>
            <Button variant="outline" onClick={onRetry} className="min-h-11">
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          </div>
        ) : list.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-3">
            {list.rows.map((row) => {
              const id = resolveId(row);
              const person = profiles.get(id);
              const name = person?.displayName || "Member";
              const age = person?.ageYears ?? calculateAge(person?.dob);
              return (
                <li key={`${row.likerId}-${row.likedId}`} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <MemberAvatar name={name} photoURL={person?.photoURL} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/profile/${id}`} className="font-medium hover:text-primary">
                      {name}
                      {age ? <span className="font-normal text-muted-foreground">, {age}</span> : null}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      {[person?.profession, person?.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {onUnlike ? (
                    <Button variant="ghost" size="sm" onClick={() => onUnlike(id)} aria-label={`Withdraw interest in ${name}`}>
                      <Heart className="h-4 w-4 fill-primary text-primary" />
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/profile/${id}`}>View</Link>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
