import { supabase } from "./client";
import { Timestamp } from "./timestamp";
import type { PostComment, PostRow } from "./types";

type Row = Record<string, any>;

function mapComment(raw: any): PostComment {
  return {
    id: raw.id,
    userId: raw.userId || raw.user_id,
    userName: raw.userName || raw.user_name,
    userAvatar: raw.userAvatar || raw.user_avatar,
    content: raw.content,
    timestamp: Timestamp.fromISO(raw.timestamp) || Timestamp.now(),
    isRead: raw.isRead,
  };
}

function mapNotifications(raw: unknown): PostRow["commentNotifications"] {
  if (!raw || typeof raw !== "object") return {};
  const result: PostRow["commentNotifications"] = {};
  for (const [key, value] of Object.entries(raw as Record<string, any>)) {
    result[key] = {
      count: Number(value?.count || 0),
      lastSeen: Timestamp.fromISO(value?.lastSeen || value?.last_seen),
    };
  }
  return result;
}

export function mapPost(row: Row | null): PostRow | null {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    content: row.content,
    likes: row.likes_count || 0,
    likedBy: row.liked_by || [],
    comments: row.comments_count || 0,
    commentList: Array.isArray(row.comment_list) ? row.comment_list.map(mapComment) : [],
    lastLikedAt: Timestamp.fromISO(row.last_liked_at),
    lastCommentedAt: Timestamp.fromISO(row.last_commented_at),
    commentNotifications: mapNotifications(row.comment_notifications),
    timestamp: Timestamp.fromISO(row.created_at),
  };
}

export async function getPost(postId: string): Promise<PostRow | null> {
  const { data, error } = await supabase.from("posts").select("*").eq("id", postId).maybeSingle();
  if (error) throw error;
  return mapPost(data);
}

export async function listPosts(limit = 50): Promise<PostRow[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row) => mapPost(row)!);
}

export async function createPost(params: {
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
}) {
  const { error } = await supabase.from("posts").insert({
    user_id: params.userId,
    user_name: params.userName,
    user_avatar: params.userAvatar,
    content: params.content,
  });
  if (error) throw error;
}

export async function togglePostLike(postId: string, userId: string) {
  const post = await getPost(postId);
  if (!post) throw new Error("Post not found");

  const isLiked = post.likedBy.includes(userId);
  const likedBy = isLiked ? post.likedBy.filter((id) => id !== userId) : [...post.likedBy, userId];

  const { error } = await supabase
    .from("posts")
    .update({
      likes_count: Math.max(0, isLiked ? post.likes - 1 : post.likes + 1),
      liked_by: likedBy,
      last_liked_at: new Date().toISOString(),
    })
    .eq("id", postId);
  if (error) throw error;

  return { isLiked: !isLiked, likes: isLiked ? post.likes - 1 : post.likes + 1 };
}

export async function addPostComment(postId: string, comment: PostComment, postOwnerId: string) {
  const post = await getPost(postId);
  if (!post) throw new Error("Post not found");

  const serialized = {
    ...comment,
    timestamp: comment.timestamp instanceof Date
      ? comment.timestamp.toISOString()
      : comment.timestamp?.toDate?.().toISOString?.() || new Date().toISOString(),
  };

  const notifications = { ...post.commentNotifications };
  const ownerNote = notifications[postOwnerId] || { count: 0, lastSeen: null };
  notifications[postOwnerId] = {
    count: postOwnerId === comment.userId ? 0 : ownerNote.count + 1,
    lastSeen: ownerNote.lastSeen,
  };

  const { error } = await supabase
    .from("posts")
    .update({
      comments_count: post.comments + 1,
      last_commented_at: new Date().toISOString(),
      comment_list: [...post.commentList.map((item) => ({
        ...item,
        timestamp:
          item.timestamp instanceof Date
            ? item.timestamp.toISOString()
            : (item.timestamp as Timestamp).toDate?.().toISOString?.() || new Date().toISOString(),
      })), serialized],
      comment_notifications: Object.fromEntries(
        Object.entries(notifications).map(([key, value]) => [
          key,
          {
            count: value.count,
            lastSeen: value.lastSeen?.toDate?.().toISOString?.() || null,
          },
        ])
      ),
    })
    .eq("id", postId);
  if (error) throw error;
}

export async function markPostCommentsRead(postId: string, userId: string) {
  const post = await getPost(postId);
  if (!post) return;
  const notifications = {
    ...post.commentNotifications,
    [userId]: { count: 0, lastSeen: Timestamp.now() },
  };
  const { error } = await supabase
    .from("posts")
    .update({
      comment_notifications: Object.fromEntries(
        Object.entries(notifications).map(([key, value]) => [
          key,
          {
            count: value.count,
            lastSeen: value.lastSeen?.toDate?.().toISOString?.() || new Date().toISOString(),
          },
        ])
      ),
    })
    .eq("id", postId);
  if (error) throw error;
}

export async function countUnreadLikedPosts(userId: string, since: Timestamp | null): Promise<number> {
  if (!since) return 0;
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("last_liked_at", since.toDate().toISOString());
  if (error) throw error;
  return count || 0;
}

export async function countUnreadCommentedPosts(userId: string, since: Timestamp | null): Promise<number> {
  if (!since) return 0;
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("last_commented_at", since.toDate().toISOString());
  if (error) throw error;
  return count || 0;
}

export function subscribeToPosts(
  onChange: (posts: PostRow[]) => void,
  onError?: (error: Error) => void
): () => void {
  const load = async () => {
    try {
      onChange(await listPosts());
    } catch (error) {
      onError?.(error as Error);
    }
  };

  void load();
  const channel = supabase
    .channel("posts-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
      void load();
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
