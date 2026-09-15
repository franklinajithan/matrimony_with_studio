import { supabase } from "./client";
import { Timestamp } from "./timestamp";

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  reason: string | null;
  createdAt: Timestamp;
}

function mapBlock(row: Record<string, unknown>): Block {
  return {
    id: String(row.id),
    blockerId: String(row.blocker_id),
    blockedId: String(row.blocked_id),
    reason: row.reason ? String(row.reason) : null,
    createdAt: Timestamp.fromISO(row.created_at as string | null),
  };
}

export async function areBlocked(userA: string, userB: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("blocks")
    .select("id")
    .or(`and(blocker_id.eq.${userA},blocked_id.eq.${userB}),and(blocker_id.eq.${userB},blocked_id.eq.${userA})`)
    .maybeSingle();
  
  if (error) throw error;
  return Boolean(data);
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
      { onConflict: "blocker_id,blocked_id" }
    );
  
  if (error) throw error;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  
  if (error) throw error;
}

export async function listBlocks(userId: string, limit = 50): Promise<Block[]> {
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return (data || []).map(mapBlock);
}
