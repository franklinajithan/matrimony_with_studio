import { supabase } from "./client";
import { Timestamp } from "./timestamp";

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  reason: string | null;
  reference: string;
  createdAt: Timestamp;
}

function mapBlock(row: Record<string, unknown>): Block {
  return {
    id: String(row.id),
    blockerId: String(row.blocker_id),
    blockedId: String(row.blocked_id),
    reason: row.reason ? String(row.reason) : null,
    reference: String(row.reference || "Unavailable member"),
    createdAt: Timestamp.fromISO(row.created_at as string | null) ?? Timestamp.now(),
  };
}

export async function areBlocked(userA: string, userB: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("are_blocked", { user_a: userA, user_b: userB });
  if (error) throw error;
  if (typeof data !== "boolean") throw new Error("Could not verify member safety status.");
  return data;
}

export async function blockUser(blockerId: string, blockedId: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from("blocks")
    .upsert(
      {
        blocker_id: blockerId,
        blocked_id: blockedId,
        reason: reason || null,
      },
      { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true }
    );
  
  if (error) throw error;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const { data, error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .select("id")
    .maybeSingle();
  
  if (error) throw error;
  if (!data) throw new Error("This block is no longer available. Refresh and try again.");
}

export async function listBlocks(_userId: string, limit = 50): Promise<Block[]> {
  // The server derives ownership from auth.uid(); caller IDs never select peers' blocks.
  const { data, error } = await supabase.rpc("own_blocked_members", { p_limit: limit });
  if (error) throw error;
  return (data || []).map(mapBlock);
}
