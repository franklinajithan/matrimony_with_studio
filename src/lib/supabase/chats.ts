import { getCompositeId } from "@/lib/utils";
import { supabase } from "./client";
import { getProfile } from "./profiles";
import { Timestamp } from "./timestamp";
import type { ChatRow, MessageRow } from "./types";
import { resolveMediaUrl } from "./storage";

type Row = Record<string, any>;

function sortedPair(uid1: string, uid2: string): [string, string] {
  return uid1 < uid2 ? [uid1, uid2] : [uid2, uid1];
}

function mapChat(row: Row | null): ChatRow | null {
  if (!row) return null;
  return {
    id: row.id,
    participants: [row.participant_1, row.participant_2],
    participantDetails: row.participant_details || {},
    lastMessageText: row.last_message_text || "",
    lastMessageSenderId: row.last_message_sender_id || null,
    lastMessageTimestamp: Timestamp.fromISO(row.last_message_at),
    unreadBy: row.unread_by || {},
    createdAt: Timestamp.fromISO(row.created_at),
  };
}

function mapMessage(row: Row | null): MessageRow | null {
  if (!row) return null;
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    text: row.text,
    isRead: Boolean(row.is_read),
    timestamp: Timestamp.fromISO(row.created_at),
  };
}

export async function getChat(chatId: string): Promise<ChatRow | null> {
  const { data, error } = await supabase.from("chats").select("*").eq("id", chatId).maybeSingle();
  if (error) throw error;
  return mapChat(data);
}

export async function listChatsForUser(userId: string): Promise<ChatRow[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data || []).map((row) => mapChat(row)!);
}

export function unreadMessageCount(chats: ChatRow[], userId: string): number {
  return chats.reduce((sum, chat) => sum + Number(chat.unreadBy?.[userId] || 0), 0);
}

export async function countUnreadMessages(userId: string): Promise<number> {
  const chats = await listChatsForUser(userId);
  return unreadMessageCount(chats, userId);
}

export async function createChatDocument(user1Uid: string, user2Uid: string): Promise<string> {
  const chatId = getCompositeId(user1Uid, user2Uid);
  // Never reset an existing conversation when members reconnect or acceptance is retried.
  const existing = await getChat(chatId);
  if (existing) return chatId;

  const [user1, user2] = await Promise.all([getProfile(user1Uid), getProfile(user2Uid)]);
  if (!user1 || !user2) {
    throw new Error(
      `One or both user profiles not found for chat creation. User1 (${user1Uid}) exists: ${Boolean(user1)}, User2 (${user2Uid}) exists: ${Boolean(user2)}`
    );
  }

  const [participant_1, participant_2] = sortedPair(user1Uid, user2Uid);

  const participantDetails = {
    [user1Uid]: {
      displayName: user1.displayName || "User",
      photoURL: resolveMediaUrl(user1.photoURL) || "https://placehold.co/100x100.png",
      dataAiHint:
        user1.dataAiHint ||
        (user1.photoURL && !user1.photoURL.includes("placehold.co") ? "person avatar" : "person placeholder"),
    },
    [user2Uid]: {
      displayName: user2.displayName || "User",
      photoURL: resolveMediaUrl(user2.photoURL) || "https://placehold.co/100x100.png",
      dataAiHint:
        user2.dataAiHint ||
        (user2.photoURL && !user2.photoURL.includes("placehold.co") ? "person avatar" : "person placeholder"),
    },
  };

  const { error } = await supabase.from("chats").upsert(
    {
      id: chatId,
      participant_1,
      participant_2,
      participant_details: participantDetails,
      last_message_text: "You are now connected!",
      last_message_sender_id: null,
      last_message_at: new Date().toISOString(),
      unread_by: { [user1Uid]: 0, [user2Uid]: 0 },
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
  if (error) throw error;
  return chatId;
}

export async function updateChatParticipantDetails(
  chatId: string,
  userId: string,
  details: { displayName: string; photoURL: string; dataAiHint?: string }
) {
  const chat = await getChat(chatId);
  if (!chat) return;
  const { error } = await supabase
    .from("chats")
    .update({
      participant_details: {
        ...chat.participantDetails,
        [userId]: details,
      },
    })
    .eq("id", chatId);
  if (error) throw error;
}

export async function clearUnread(chatId: string, userId: string) {
  const chat = await getChat(chatId);
  if (!chat) return;
  const { error } = await supabase
    .from("chats")
    .update({
      unread_by: { ...chat.unreadBy, [userId]: 0 },
    })
    .eq("id", chatId);
  if (error) throw error;
}

export async function listMessages(chatId: string, options?: { limit?: number; before?: string }): Promise<MessageRow[]> {
  let query = supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.before) {
    query = query.lt("created_at", options.before);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || [])
    .map((row) => mapMessage(row)!)
    .sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
}

export async function sendMessage(params: {
  chatId: string;
  senderId: string;
  otherUserId: string;
  text: string;
}) {
  const { error: messageError } = await supabase.from("messages").insert({
    chat_id: params.chatId,
    sender_id: params.senderId,
    text: params.text,
    is_read: false,
  });
  if (messageError) throw messageError;

  const chat = await getChat(params.chatId);
  const unreadBy = { ...(chat?.unreadBy || {}) };
  unreadBy[params.otherUserId] = Number(unreadBy[params.otherUserId] || 0) + 1;
  unreadBy[params.senderId] = 0;

  const { error: chatError } = await supabase
    .from("chats")
    .update({
      last_message_text: params.text,
      last_message_sender_id: params.senderId,
      last_message_at: new Date().toISOString(),
      unread_by: unreadBy,
    })
    .eq("id", params.chatId);
  if (chatError) throw chatError;
}

export async function markMessagesRead(chatId: string, userId: string) {
  await clearUnread(chatId, userId);
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("chat_id", chatId)
    .eq("is_read", false)
    .neq("sender_id", userId);
  if (error) throw error;
}

export function subscribeToChats(
  userId: string,
  onChange: (chats: ChatRow[]) => void,
  onError?: (error: Error) => void
): () => void {
  const load = async () => {
    try {
      onChange(await listChatsForUser(userId));
    } catch (error) {
      onError?.(error as Error);
    }
  };

  void load();
  const channel = supabase
    .channel(`chats:${userId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, () => {
      void load();
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToMessages(
  chatId: string,
  onChange: (messages: MessageRow[]) => void,
  onError?: (error: Error) => void
): () => void {
  const load = async () => {
    try {
      onChange(await listMessages(chatId));
    } catch (error) {
      onError?.(error as Error);
    }
  };

  void load();
  const channel = supabase
    .channel(`messages:${chatId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
      () => {
        void load();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
