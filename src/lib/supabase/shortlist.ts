import { supabase } from "./client";
import { Timestamp } from "./timestamp";

export interface ShortlistEntry {
  id: string;
  userId: string;
  shortlistedId: string;
  createdAt: Timestamp;
}

function mapShortlistEntry(row: Record<string, unknown>): ShortlistEntry {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    shortlistedId: String(row.shortlisted_id),
    createdAt: Timestamp.fromISO(row.created_at as string | null) ?? Timestamp.now(),
  };
}

export async function isShortlisted(userId: string, profileId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("shortlist")
    .select("id")
    .eq("user_id", userId)
    .eq("shortlisted_id", profileId)
    .maybeSingle();
  
  if (error) throw error;
  return Boolean(data);
}

export async function getShortlistedIds(userId: string, profileIds: string[]): Promise<Set<string>> {
  if (profileIds.length === 0) return new Set();
  
  const { data, error } = await supabase
    .from("shortlist")
    .select("shortlisted_id")
    .eq("user_id", userId)
    .in("shortlisted_id", profileIds);
  
  if (error) throw error;
  return new Set((data || []).map((row) => row.shortlisted_id as string));
}

export async function addToShortlist(userId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("shortlist")
    .upsert(
      { user_id: userId, shortlisted_id: profileId },
      { onConflict: "user_id,shortlisted_id" }
    );
  
  if (error) throw error;
}

export async function removeFromShortlist(userId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("shortlist")
    .delete()
    .eq("user_id", userId)
    .eq("shortlisted_id", profileId);
  
  if (error) throw error;
}

export async function listShortlist(userId: string, limit = 50): Promise<ShortlistEntry[]> {
  const { data, error } = await supabase
    .from("shortlist")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return (data || []).map(mapShortlistEntry);
}

export async function countShortlist(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("shortlist")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  
  if (error) throw error;
  return count ?? 0;
}
