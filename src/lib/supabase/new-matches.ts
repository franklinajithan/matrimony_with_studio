import {
  hasPartnerPreferences,
  matchesNewProfile,
  partnerPreferencesFromProfile,
} from "@/lib/matching/preferences";
import { supabase } from "./client";
import { mapProfile } from "./profiles";
import type { Profile } from "./types";

export type MatchVisit = { previous: string | null; opened: string };
export type NewMatchesResult =
  | { status: "unpublished" | "preferences" | "first-visit" | "empty" | "error" }
  | { status: "ok"; people: Profile[] };

export async function readMatchVisit(): Promise<MatchVisit> {
  const { data, error } = await supabase.rpc("dashboard_match_visit");
  if (error) throw error;
  return data;
}

export async function acknowledgeMatchVisit(visit: MatchVisit) {
  const { error } = await supabase.rpc("dashboard_match_visit", { p_acknowledge: visit.opened });
  if (error) throw error;
}

type CandidateRow = { available_at: string; member_id: string; profile: Record<string, unknown> };

export async function loadNewMatches(member: Profile, visit: MatchVisit): Promise<NewMatchesResult> {
  if (!member.isPublished) return { status: "unpublished" };
  const preferences = partnerPreferencesFromProfile(member);
  if (!hasPartnerPreferences(preferences)) return { status: "preferences" };
  if (!visit.previous) return { status: "first-visit" };

  const people: Profile[] = [];
  let cursor: CandidateRow | undefined;
  do {
    const { data, error } = await supabase.rpc("dashboard_new_match_candidates", {
      p_since: visit.previous,
      p_until: visit.opened,
      p_before_at: cursor?.available_at ?? null,
      p_before_id: cursor?.member_id ?? null,
    }).order("available_at", { ascending: false }).order("member_id", { ascending: false });
    if (error) throw error;

    const rows: CandidateRow[] = data ?? [];
    for (const row of rows) {
      const candidate = mapProfile(row.profile);
      if (candidate && matchesNewProfile(candidate, member, preferences)) people.push(candidate);
      if (people.length === 6) return { status: "ok", people };
    }
    cursor = rows.length === 100 ? rows.at(-1) : undefined;
  } while (cursor);

  return people.length ? { status: "ok", people } : { status: "empty" };
}
