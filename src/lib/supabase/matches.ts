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
