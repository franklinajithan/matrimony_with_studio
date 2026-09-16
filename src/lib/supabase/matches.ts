import { supabase } from "./client";
import { Timestamp } from "./timestamp";
import type { MatchRequestRow } from "./types";

type Row = Record<string, any>;

function mapRequest(row: Row | null): MatchRequestRow | null {
  if (!row) return null;
  return {
    id: row.id,
    senderUid: row.sender_id,
    receiverUid: row.receiver_id,
    status: row.status,
    createdAt: Timestamp.fromISO(row.created_at),
    updatedAt: Timestamp.fromISO(row.updated_at),
  };
}

export async function getMatchRequest(id: string): Promise<MatchRequestRow | null> {
  const { data, error } = await supabase.from("match_requests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return mapRequest(data);
}

export async function createMatchRequest(params: {
  id: string;
  senderUid: string;
  receiverUid: string;
}) {
  const { error } = await supabase.from("match_requests").upsert({
    id: params.id,
    sender_id: params.senderUid,
    receiver_id: params.receiverUid,
    status: "pending",
  });
  if (error) throw error;
}

export async function updateMatchRequestStatus(
  id: string,
  status: MatchRequestRow["status"]
) {
  const { error } = await supabase.from("match_requests").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function sendInterest(params: {
  senderUid: string;
  receiverUid: string;
  message?: string;
}): Promise<{ id: string }> {
  if (!params.senderUid || !params.receiverUid) {
    throw new Error("Both members are required to send an interest.");
  }
  if (params.senderUid === params.receiverUid) {
    throw new Error("You cannot send an interest to yourself.");
  }

  const id = `${params.senderUid}_${params.receiverUid}`;

  const { data: existing, error: existingError } = await supabase
    .from("match_requests")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    if (existing.status === "pending") {
      throw new Error("You've already sent an interest to this person.");
    }
    if (existing.status === "accepted") {
      throw new Error("You are already connected with this person.");
    }
    // Allow re-send after decline/withdraw by resetting to pending.
    const { error: updateError } = await supabase
      .from("match_requests")
      .update({
        status: "pending",
        message: params.message || null,
        withdrawn_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateError) throw updateError;
    return { id };
  }

  const { error } = await supabase.from("match_requests").insert({
    id,
    sender_id: params.senderUid,
    receiver_id: params.receiverUid,
    status: "pending",
    message: params.message || null,
  });
  if (error) throw error;
  return { id };
}

export async function withdrawInterest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from("match_requests")
    .update({
      status: "withdrawn",
      withdrawn_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) throw error;
}

export async function acceptInterest(requestId: string): Promise<void> {
  const { data, error } = await supabase
    .from("match_requests")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id, sender_id, receiver_id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("That interest request is no longer pending.");
}

export async function declineInterest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from("match_requests")
    .update({ status: "declined" })
    .eq("id", requestId);
  if (error) throw error;
}

export async function listSentRequests(senderId: string): Promise<MatchRequestRow[]> {
  const { data, error } = await supabase
    .from("match_requests")
    .select("*")
    .eq("sender_id", senderId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapRequest(row)!);
}

/** Receiver IDs the member has already sent an interest to (any status). */
export async function listSentInterestReceiverIds(senderId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("match_requests")
    .select("receiver_id")
    .eq("sender_id", senderId);
  if (error) throw error;
  return (data || [])
    .map((row) => String((row as { receiver_id?: string }).receiver_id || ""))
    .filter(Boolean);
}

export async function deleteMatchRequest(id: string) {
  const { error } = await supabase.from("match_requests").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToMatchRequest(
  id: string,
  onChange: (request: MatchRequestRow | null) => void,
  onError?: (error: Error) => void
): () => void {
  const load = async () => {
    try {
      onChange(await getMatchRequest(id));
    } catch (error) {
      onError?.(error as Error);
    }
  };

  void load();
  const channel = supabase
    .channel(`match-request:${id}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "match_requests", filter: `id=eq.${id}` },
      () => {
        void load();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function listPendingRequests(receiverId: string): Promise<MatchRequestRow[]> {
  const { data, error } = await supabase
    .from("match_requests")
    .select("*")
    .eq("receiver_id", receiverId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapRequest(row)!);
}

export async function countPendingRequests(receiverId: string): Promise<number> {
  const { count, error } = await supabase
    .from("match_requests")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", receiverId)
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}

export async function listAcceptedConnections(userId: string): Promise<MatchRequestRow[]> {
  const { data, error } = await supabase
    .from("match_requests")
    .select("*")
    .eq("status", "accepted")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapRequest(row)!);
}

export async function countAcceptedConnections(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("match_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
  if (error) throw error;
  return count ?? 0;
}

/** Accepted connections updated after `sinceIso` (or within `withinDays`) — used for "new connection" badges. */
export async function countRecentAcceptedConnections(
  userId: string,
  withinDays = 14,
  sinceIso?: string | null
): Promise<number> {
  const since = sinceIso ? new Date(sinceIso) : new Date();
  if (!sinceIso) {
    since.setDate(since.getDate() - withinDays);
  }
  const { count, error } = await supabase
    .from("match_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .gte("updated_at", since.toISOString());
  if (error) throw error;
  return count ?? 0;
}

export function subscribeToPendingRequests(
  receiverId: string,
  onChange: (requests: MatchRequestRow[]) => void,
  onError?: (error: Error) => void
): () => void {
  const load = async () => {
    try {
      const { data, error } = await supabase
        .from("match_requests")
        .select("*")
        .eq("receiver_id", receiverId)
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      onChange((data || []).map((row) => mapRequest(row)!));
    } catch (error) {
      onError?.(error as Error);
    }
  };

  void load();
  const channel = supabase
    .channel(`pending-requests:${receiverId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "match_requests", filter: `receiver_id=eq.${receiverId}` },
      () => {
        void load();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
