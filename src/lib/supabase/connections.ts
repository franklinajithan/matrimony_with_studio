import { supabase } from "./client";
import { Timestamp } from "./timestamp";
import { listAcceptedConnections } from "./matches";

export interface Connection {
  id: string;
  memberAId: string;
  memberBId: string;
  connectedAt: Timestamp;
  createdFromRequestId: string | null;
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = error.message || "";
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /Could not find the table .*connections/i.test(message) ||
    /relation .*connections.* does not exist/i.test(message)
  );
}

function mapConnection(row: Record<string, unknown>): Connection {
  return {
    id: String(row.id),
    memberAId: String(row.member_a_id),
    memberBId: String(row.member_b_id),
    connectedAt: Timestamp.fromISO(row.connected_at as string | null) || Timestamp.now(),
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

  if (error) {
    if (isMissingTableError(error)) {
      const accepted = await listAcceptedConnections(userA);
      return accepted.some(
        (row) =>
          (row.senderUid === userA && row.receiverUid === userB) ||
          (row.senderUid === userB && row.receiverUid === userA)
      );
    }
    throw error;
  }
  return Boolean(data);
}

export async function createConnection(
  userA: string,
  userB: string,
  requestId?: string
): Promise<void> {
  const [smaller, larger] = userA < userB ? [userA, userB] : [userB, userA];

  const { error } = await supabase.from("connections").upsert(
    {
      member_a_id: smaller,
      member_b_id: larger,
      created_from_request_id: requestId || null,
    },
    { onConflict: "member_a_id,member_b_id" }
  );

  if (error) {
    if (isMissingTableError(error)) {
      // Table not provisioned yet — accepted match_requests still represent the connection.
      return;
    }
    throw error;
  }
}

export async function removeConnection(userA: string, userB: string): Promise<void> {
  // Server checks auth.uid() and that the caller belongs to the relationship.
  // Removing a connection and retiring accepted interests must be atomic:
  // client-side sequential deletes leave stale accepted requests on failure.
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user || user.id !== userA) throw new Error("Authentication required.");

  const { data, error } = await supabase.rpc("remove_my_connection", {
    p_other_member_id: userB,
  });
  if (error) throw error;
  if (data !== true) throw new Error("Connection removal was not confirmed.");
}

async function listConnectionsFromAcceptedRequests(userId: string): Promise<Connection[]> {
  const accepted = await listAcceptedConnections(userId);
  return accepted.map((row) => {
    const [memberAId, memberBId] =
      row.senderUid < row.receiverUid
        ? [row.senderUid, row.receiverUid]
        : [row.receiverUid, row.senderUid];
    return {
      id: String(row.id),
      memberAId,
      memberBId,
      connectedAt: row.updatedAt || row.createdAt || Timestamp.now(),
      createdFromRequestId: String(row.id),
    };
  });
}

export async function listConnections(userId: string, limit = 50): Promise<Connection[]> {
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .or(`member_a_id.eq.${userId},member_b_id.eq.${userId}`)
    .order("connected_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error)) {
      return listConnectionsFromAcceptedRequests(userId);
    }
    throw error;
  }
  return (data || []).map(mapConnection);
}

export async function countConnections(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .or(`member_a_id.eq.${userId},member_b_id.eq.${userId}`);

  if (error) {
    if (isMissingTableError(error)) {
      const rows = await listConnectionsFromAcceptedRequests(userId);
      return rows.length;
    }
    throw error;
  }
  return count ?? 0;
}
