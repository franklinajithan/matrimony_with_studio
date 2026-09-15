import { supabase } from "./client";
import { Timestamp } from "./timestamp";

export interface Connection {
  id: string;
  memberAId: string;
  memberBId: string;
  connectedAt: Timestamp;
  createdFromRequestId: string | null;
}

function mapConnection(row: Record<string, unknown>): Connection {
  return {
    id: String(row.id),
    memberAId: String(row.member_a_id),
    memberBId: String(row.member_b_id),
    connectedAt: Timestamp.fromISO(row.connected_at as string | null),
    createdFromRequestId: row.created_from_request_id ? String(row.created_from_request_id) : null,
  };
}

export async function areConnected(userA: string, userB: string): Promise<boolean> {
  const [smaller, larger] = userA < userB ? [userA, userB] : [userB, userA];
  
  const { data, error } = await supabase
    .from("connections")
    .select("id")
    .eq("member_a_id", smaller)
    .eq("member_b_id", larger)
    .maybeSingle();
  
  if (error) throw error;
  return Boolean(data);
}

export async function createConnection(
  userA: string,
  userB: string,
  requestId?: string
): Promise<void> {
  const [smaller, larger] = userA < userB ? [userA, userB] : [userB, userA];
  
  const { error } = await supabase
    .from("connections")
    .upsert(
      {
        member_a_id: smaller,
        member_b_id: larger,
        created_from_request_id: requestId || null,
      },
      { onConflict: "member_a_id,member_b_id" }
    );
  
  if (error) throw error;
}

export async function removeConnection(userA: string, userB: string): Promise<void> {
  const [smaller, larger] = userA < userB ? [userA, userB] : [userB, userA];
  
  const { error} = await supabase
    .from("connections")
    .delete()
    .eq("member_a_id", smaller)
    .eq("member_b_id", larger);
  
  if (error) throw error;
}

export async function listConnections(userId: string, limit = 50): Promise<Connection[]> {
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .or(`member_a_id.eq.${userId},member_b_id.eq.${userId}`)
    .order("connected_at", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return (data || []).map(mapConnection);
}

export async function countConnections(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .or(`member_a_id.eq.${userId},member_b_id.eq.${userId}`);
  
  if (error) throw error;
  return count ?? 0;
}
