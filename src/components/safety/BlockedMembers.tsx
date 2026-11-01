"use client";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type AuthUser } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { listBlocks, unblockUser, type Block } from "@/lib/supabase/blocks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
export function BlockedMembers() {
  const [blocks, setBlocks] = useState<Block[]>([]); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [busy, setBusy] = useState<string | null>(null);
  const pending = useRef(false); const { toast } = useToast();
  useEffect(() => {
    let generation = 0;
    const unsubscribe = onAuthStateChanged((user: AuthUser | null) => {
      const current = ++generation; setBlocks([]); setError(""); setLoading(!!user);
      if (user) void listBlocks(user.uid, 500).then((rows) => { if (current === generation) setBlocks(rows); })
        .catch(() => { if (current === generation) setError("Could not load blocked members. Refresh and try again."); })
        .finally(() => { if (current === generation) setLoading(false); });
    });
    return () => { generation++; unsubscribe(); };
  }, []);
  async function unblock(block: Block) {
    if (pending.current) return; pending.current = true; setBusy(block.id);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!data.user || data.user.id !== block.blockerId) throw new Error("Sign in again to manage blocks.");
      await unblockUser(data.user.id, block.blockedId);
      setBlocks((rows) => rows.filter((row) => row.id !== block.id));
      toast({ title: "Member unblocked", description: "Your previous connection has not been restored." });
    } catch { toast({ title: "Could not unblock member", description: "Please refresh and try again.", variant: "destructive" }); }
    finally { pending.current = false; setBusy(null); }
  }
  return <Card><CardHeader><CardTitle>Blocked members</CardTitle></CardHeader><CardContent className="space-y-3">
    <p className="text-sm text-muted-foreground">Unblocking allows a new introduction; it does not restore a previous connection.</p>
    {loading ? <p role="status">Loading…</p> : error ? <p role="alert">{error}</p> : blocks.length === 0 ? <p>No blocked members.</p> : <ul className="space-y-2">{blocks.map((block) => <li key={block.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
      <span className="break-all text-sm">Member {block.reference}</span><Button type="button" variant="outline" disabled={busy !== null} onClick={() => void unblock(block)}>{busy === block.id ? "Unblocking…" : "Unblock"}</Button>
    </li>)}</ul>}
    {blocks.length === 500 && <p className="text-xs text-muted-foreground">Showing the first 500 blocks.</p>}
  </CardContent></Card>;
}
