"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Mic,
  MoreVertical,
  Phone,
  Search,
  SendHorizonal,
  Smile,
  Video,
} from "lucide-react";
import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useDashboardChrome } from "@/components/dashboard/chrome-context";
import { cn } from "@/lib/utils";
import { auth, onAuthStateChanged, type AuthUser } from "@/lib/supabase/auth";
import { Timestamp } from "@/lib/supabase/timestamp";
import { getProfile } from "@/lib/supabase/profiles";
import {
  getChat,
  markMessagesRead,
  sendMessage,
  subscribeToChats,
  subscribeToMessages,
} from "@/lib/supabase/chats";
import { resolveMediaUrl } from "@/lib/supabase/storage";

const QUICK_EMOJIS = ["😀", "😂", "🥰", "😊", "🙏", "👍", "❤️", "🎉", "🔥", "✨", "😢", "👏"];

type Conversation = {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string;
  lastMessage: string;
  lastMessageSenderId: string | null;
  unreadCount: number;
  timestampLabel: string;
  originalTimestamp: Timestamp | null;
};

type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp | null;
  isRead: boolean;
  pending?: boolean;
  failed?: boolean;
};

function formatListTime(ts: Timestamp | null): string {
  if (!ts) return "";
  const date = ts.toDate();
  if (isToday(date)) return format(date, "p");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd/MM/yyyy");
}

function formatBubbleTime(ts: Timestamp | null): string {
  if (!ts) return "";
  return format(ts.toDate(), "p");
}

function dateChipLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, d MMM yyyy");
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";
}

export function MessagesWorkspace({ initialChatId }: { initialChatId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { setUnread } = useDashboardChrome();

  const selectedChatId = initialChatId || searchParams.get("chat") || null;

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [draft, setDraft] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [fallbackConversation, setFallbackConversation] = useState<Conversation | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const setUnreadRef = useRef(setUnread);
  const toastRef = useRef(toast);

  useEffect(() => {
    setUnreadRef.current = setUnread;
  }, [setUnread]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const userId = currentUser?.uid ?? null;

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) router.replace("/login?next=/messages");
    });
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    setIsLoadingChats(true);

    const unsubscribe = subscribeToChats(
      userId,
      async (chats) => {
        try {
          const mapped = await Promise.all(
            chats.map(async (chat) => {
              const otherUserId = chat.participants.find((id) => id !== userId);
              if (!otherUserId) return null;

              const cached = chat.participantDetails?.[otherUserId];
              let otherUserName = cached?.displayName || "Member";
              let otherUserAvatar =
                resolveMediaUrl(cached?.photoURL) || "https://placehold.co/100x100.png";

              if (!cached?.displayName) {
                try {
                  const profile = await getProfile(otherUserId);
                  if (profile) {
                    otherUserName = profile.displayName || otherUserName;
                    otherUserAvatar = resolveMediaUrl(profile.photoURL) || otherUserAvatar;
                  }
                } catch {
                  // keep fallbacks
                }
              }

              return {
                id: chat.id,
                otherUserId,
                otherUserName,
                otherUserAvatar,
                lastMessage: chat.lastMessageText || "Say hello",
                lastMessageSenderId: chat.lastMessageSenderId,
                unreadCount: Number(chat.unreadBy?.[userId] || 0),
                timestampLabel: formatListTime(chat.lastMessageTimestamp),
                originalTimestamp: chat.lastMessageTimestamp,
              } satisfies Conversation;
            })
          );

          const next = mapped
            .filter(Boolean)
            .sort(
              (a, b) =>
                (b!.originalTimestamp?.toMillis() || 0) - (a!.originalTimestamp?.toMillis() || 0)
            ) as Conversation[];

          setConversations(next);
          setUnreadRef.current(next.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0));
        } finally {
          setIsLoadingChats(false);
        }
      },
      (error) => {
        toastRef.current({
          title: "Could not load chats",
          description: error.message,
          variant: "destructive",
        });
        setIsLoadingChats(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    if (!selectedChatId || !userId) {
      setMessages([]);
      setFallbackConversation(null);
      return;
    }

    let cancelled = false;
    setIsLoadingMessages(true);

    const unsubscribe = subscribeToMessages(
      selectedChatId,
      (rows) => {
        if (cancelled) return;
        setMessages(
          rows.map((row) => ({
            id: row.id,
            text: row.text,
            senderId: row.senderId,
            timestamp: row.timestamp,
            isRead: row.isRead,
          }))
        );
        setIsLoadingMessages(false);
      },
      (error) => {
        if (cancelled) return;
        toastRef.current({
          title: "Could not load messages",
          description: error.message,
          variant: "destructive",
        });
        setIsLoadingMessages(false);
      }
    );

    setConversations((prev) => {
      const hadUnread = prev.some((chat) => chat.id === selectedChatId && chat.unreadCount > 0);
      if (!hadUnread) return prev;
      const next = prev.map((chat) =>
        chat.id === selectedChatId ? { ...chat, unreadCount: 0 } : chat
      );
      setUnreadRef.current(next.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0));
      return next;
    });

    void markMessagesRead(selectedChatId, userId).catch(() => undefined);

    void (async () => {
      try {
        const chat = await getChat(selectedChatId);
        if (cancelled || !chat) return;
        const otherUserId = chat.participants.find((id) => id !== userId);
        if (!otherUserId) return;
        const cached = chat.participantDetails?.[otherUserId];
        let otherUserName = cached?.displayName || "Member";
        let otherUserAvatar =
          resolveMediaUrl(cached?.photoURL) || "https://placehold.co/100x100.png";
        if (!cached?.displayName) {
          try {
            const profile = await getProfile(otherUserId);
            if (profile) {
              otherUserName = profile.displayName || otherUserName;
              otherUserAvatar = resolveMediaUrl(profile.photoURL) || otherUserAvatar;
            }
          } catch {
            // keep fallbacks
          }
        }
        if (cancelled) return;
        setFallbackConversation({
          id: chat.id,
          otherUserId,
          otherUserName,
          otherUserAvatar,
          lastMessage: chat.lastMessageText || "Say hello",
          lastMessageSenderId: chat.lastMessageSenderId,
          unreadCount: 0,
          timestampLabel: formatListTime(chat.lastMessageTimestamp),
          originalTimestamp: chat.lastMessageTimestamp,
        });
      } catch {
        // list subscription may still fill this in
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [selectedChatId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChatId]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [draft]);

  const selectedConversation = useMemo(() => {
    if (!selectedChatId) return null;
    return (
      conversations.find((c) => c.id === selectedChatId) ||
      (fallbackConversation?.id === selectedChatId ? fallbackConversation : null)
    );
  }, [conversations, fallbackConversation, selectedChatId]);

  const filteredConversations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.otherUserName.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [conversations, searchTerm]);

  const openChat = useCallback(
    (chatId: string) => {
      router.push(`/messages?chat=${chatId}`);
    },
    [router]
  );

  const closeChat = useCallback(() => {
    router.push("/messages");
  }, [router]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !currentUser || !selectedChatId || !selectedConversation || isSending) return;

    const optimisticId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      text,
      senderId: currentUser.uid,
      timestamp: Timestamp.now(),
      isRead: false,
      pending: true,
    };

    setDraft("");
    setMessages((prev) => [...prev, optimistic]);
    setIsSending(true);

    try {
      await sendMessage({
        chatId: selectedChatId,
        senderId: currentUser.uid,
        otherUserId: selectedConversation.otherUserId,
        text,
      });
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...m, pending: false, failed: true } : m))
      );
      setDraft(text);
      toast({
        title: "Message not sent",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const onComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setDraft((prev) => `${prev}${emoji}`);
    setEmojiOpen(false);
    textareaRef.current?.focus();
  };

  if (!currentUser) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-10.5rem)] flex-col overflow-hidden border-y border-border bg-[#efeae2] sm:-mx-6 lg:-mx-8 lg:h-[calc(100dvh-5.5rem)] lg:rounded-none lg:border-x-0" style={{ position: 'relative' }}>
      <div className="flex min-h-0 flex-1 bg-background">
        {/* Conversation list */}
        <aside
          className={cn(
            "flex w-full flex-col border-r border-border bg-background md:w-[360px] lg:w-[400px]",
            selectedChatId ? "hidden md:flex" : "flex"
          )}
        >
          <div className="border-b border-border bg-[#f0f2f5] px-4 py-3 dark:bg-muted/40">
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-foreground">Chats</h1>
              <Button asChild variant="ghost" size="sm" className="text-primary">
                <Link href="/discover">Find people</Link>
              </Button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search or start a new chat"
                className="h-10 rounded-lg border-0 bg-background pl-9 shadow-none focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingChats ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/60" />
                <p className="mt-4 text-sm font-medium text-foreground">No chats yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Accept an interest or open a connection to start messaging.
                </p>
                <Button asChild className="mt-5 rounded-full">
                  <Link href="/connections">View connections</Link>
                </Button>
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const active = convo.id === selectedChatId;
                const preview =
                  convo.lastMessageSenderId === currentUser.uid
                    ? `You: ${convo.lastMessage}`
                    : convo.lastMessage;

                return (
                  <button
                    key={convo.id}
                    type="button"
                    onClick={() => openChat(convo.id)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                      active && "bg-[#f0f2f5] dark:bg-muted/60"
                    )}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={convo.otherUserAvatar} alt="" />
                      <AvatarFallback>{initials(convo.otherUserName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-medium text-foreground">{convo.otherUserName}</p>
                        <span
                          className={cn(
                            "shrink-0 text-[11px]",
                            convo.unreadCount > 0 ? "font-semibold text-emerald-600" : "text-muted-foreground"
                          )}
                        >
                          {convo.timestampLabel}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            convo.unreadCount > 0
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {preview}
                        </p>
                        {convo.unreadCount > 0 ? (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-semibold text-white">
                            {convo.unreadCount > 99 ? "99+" : convo.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Thread */}
        <section
          className={cn(
            "relative flex min-w-0 flex-1 flex-col",
            !selectedChatId ? "hidden md:flex" : "flex"
          )}
        >
          {!selectedConversation ? (
            <div className="flex flex-1 flex-col bg-[#f0f2f5] dark:bg-muted/30">
              {selectedChatId ? (
                <>
                  <header className="flex items-center gap-2 border-b border-border bg-[#f0f2f5] px-3 py-2.5 dark:bg-muted/40">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={closeChat}
                      aria-label="Back to chats"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <p className="text-sm text-muted-foreground">Opening chat…</p>
                  </header>
                  <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <div className="max-w-md rounded-2xl border border-border/70 bg-background px-8 py-10 shadow-sm">
                    <MessageCircle className="mx-auto h-14 w-14 text-primary/80" />
                    <h2 className="mt-4 text-2xl font-semibold tracking-tight">CupidMatch Messages</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Pick a conversation to chat in real time — just like WhatsApp or Messenger.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-border bg-[#f0f2f5] px-3 py-2.5 dark:bg-muted/40">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={closeChat}
                  aria-label="Back to chats"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Link
                  href={`/profile/${selectedConversation.otherUserId}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 hover:bg-black/5"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.otherUserAvatar} alt="" />
                    <AvatarFallback>{initials(selectedConversation.otherUserName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-left">
                    <p className="truncate font-semibold text-foreground">
                      {selectedConversation.otherUserName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Tap to view profile
                      {selectedConversation.originalTimestamp
                        ? ` · last active ${formatDistanceToNowStrict(
                            selectedConversation.originalTimestamp.toDate(),
                            { addSuffix: true }
                          )}`
                        : ""}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="hidden sm:inline-flex" disabled title="Coming soon">
                    <Video className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hidden sm:inline-flex" disabled title="Coming soon">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Chat options">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/profile/${selectedConversation.otherUserId}`}>View profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/connections">All connections</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>

              <div
                className="relative flex-1 overflow-y-auto px-3 py-4 sm:px-6"
                style={{
                  backgroundColor: "#efeae2",
                  backgroundImage:
                    "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
                  backgroundSize: "18px 18px",
                }}
              >
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="mx-auto mt-10 max-w-sm rounded-2xl bg-white/90 px-5 py-6 text-center shadow-sm">
                    <p className="text-sm font-medium text-foreground">No messages yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Say hello and start a warm conversation.
                    </p>
                  </div>
                ) : (
                  <div className="mx-auto flex max-w-3xl flex-col gap-1">
                    {messages.map((message, index) => {
                      const mine = message.senderId === currentUser.uid;
                      const prev = messages[index - 1];
                      const showDate =
                        !prev?.timestamp ||
                        !message.timestamp ||
                        format(prev.timestamp.toDate(), "yyyy-MM-dd") !==
                          format(message.timestamp.toDate(), "yyyy-MM-dd");

                      return (
                        <React.Fragment key={message.id}>
                          {showDate && message.timestamp ? (
                            <div className="my-3 flex justify-center">
                              <span className="rounded-lg bg-white/90 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground shadow-sm">
                                {dateChipLabel(message.timestamp.toDate())}
                              </span>
                            </div>
                          ) : null}
                          <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                            <div
                              className={cn(
                                "relative max-w-[85%] rounded-2xl px-3 py-2 text-[15px] leading-5 shadow-sm sm:max-w-[70%]",
                                mine
                                  ? "rounded-br-md bg-[#d9fdd3] text-foreground"
                                  : "rounded-bl-md bg-white text-foreground",
                                message.failed && "opacity-70 ring-1 ring-destructive/40"
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{message.text}</p>
                              <div className="mt-1 flex items-center justify-end gap-1">
                                <span className="text-[10px] text-muted-foreground">
                                  {message.pending
                                    ? "Sending…"
                                    : message.failed
                                      ? "Failed"
                                      : formatBubbleTime(message.timestamp)}
                                </span>
                                {mine && !message.pending && !message.failed ? (
                                  message.isRead ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-sky-500" aria-label="Read" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 text-muted-foreground" aria-label="Sent" />
                                  )
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <footer className="sticky bottom-0 border-t border-border bg-[#f0f2f5] px-2 py-2 dark:bg-muted/40 sm:px-3">
                <div className="mx-auto flex max-w-3xl items-end gap-1.5 sm:gap-2">
                  <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="mb-0.5 shrink-0 rounded-full">
                        <Smile className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                      <div className="grid grid-cols-6 gap-1">
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="rounded-md p-1.5 text-xl hover:bg-muted"
                            onClick={() => insertEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mb-0.5 hidden shrink-0 rounded-full sm:inline-flex"
                    disabled
                    title="Photo sharing coming soon"
                  >
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </Button>

                  <div className="relative min-w-0 flex-1">
                    <Textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={onComposerKeyDown}
                      placeholder="Type a message"
                      rows={1}
                      className="max-h-[140px] min-h-[44px] resize-none rounded-2xl border-0 bg-background px-4 py-3 text-[15px] shadow-none focus-visible:ring-1"
                    />
                  </div>

                  {draft.trim() ? (
                    <Button
                      type="button"
                      size="icon"
                      className="mb-0.5 h-11 w-11 shrink-0 rounded-full bg-[#00a884] hover:bg-[#008f72]"
                      onClick={() => void handleSend()}
                      disabled={isSending}
                      aria-label="Send message"
                    >
                      {isSending ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      ) : (
                        <SendHorizonal className="h-5 w-5 text-white" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mb-0.5 h-11 w-11 shrink-0 rounded-full"
                      disabled
                      title="Voice notes coming soon"
                    >
                      <Mic className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <p className="mt-1 hidden text-center text-[11px] text-muted-foreground sm:block">
                  Press Enter to send · Shift+Enter for a new line
                </p>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
