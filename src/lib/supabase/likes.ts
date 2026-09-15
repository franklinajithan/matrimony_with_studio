import { supabase } from "./client";

export async function hasLiked(likerId: string, likedId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("likes")
    .select("liker_id")
    .eq("liker_id", likerId)
    .eq("liked_id", likedId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function getLikedIds(likerId: string, likedIds: string[]): Promise<Set<string>> {
  if (likedIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from("likes")
    .select("liked_id")
    .eq("liker_id", likerId)
    .in("liked_id", likedIds);
  if (error) throw error;
  return new Set((data || []).map((row) => row.liked_id as string));
}

export async function likeProfile(likerId: string, likedId: string) {
  const { error } = await supabase.from("likes").upsert(
    { liker_id: likerId, liked_id: likedId },
    { onConflict: "liker_id,liked_id" }
  );
  if (error) throw error;
}

export async function unlikeProfile(likerId: string, likedId: string) {
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("liker_id", likerId)
    .eq("liked_id", likedId);
  if (error) throw error;
}

export function subscribeToLike(
  likerId: string,
  likedId: string,
  onChange: (liked: boolean) => void,
  onError?: (error: Error) => void
): () => void {
  const load = async () => {
    try {
      onChange(await hasLiked(likerId, likedId));
    } catch (error) {
      onError?.(error as Error);
    }
  };

  void load();
  const channel = supabase
    .channel(`like:${likerId}:${likedId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "likes", filter: `liker_id=eq.${likerId}` },
      () => {
        void load();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
