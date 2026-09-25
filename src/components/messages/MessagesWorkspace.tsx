"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Info,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  Search,
  SendHorizonal,
  Smile,
  ThumbsUp,
  Video,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
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
  createChatDocument,
  getChat,
  markMessagesRead,
  sendMessage,
  subscribeToChats,
  subscribeToMessages,
} from "@/lib/supabase/chats";
import { resolveMediaUrl } from "@/lib/supabase/storage";
import { areConnected, listConnections } from "@/lib/supabase/connections";

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
  const [authorizedChatId, setAuthorizedChatId] = useState<string | null>(null);

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

    // A mutual connection is a conversation. Reconcile legacy/partial
    // connections before subscribing so the Messages list always mirrors
    // the Connections list.
    void (async () => {
      try {
        const connections = await listConnections(userId);
        await Promise.all(
          connections.map(async (connection) => {
            const otherUserId =
              connection.memberAId === userId ? connection.memberBId : connection.memberAId;
            if (otherUserId) await createChatDocument(userId, otherUserId);
          })
        );
      } catch (error) {
        console.error("Could not reconcile connected chats:", error);
      }
    })();

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
        let chat = await getChat(selectedChatId);

        // Older/partially-created connections can exist without a chat row.
        // Recover safely only when this URL represents the current user's
        // composite chat with a real connection.
        if (!chat) {
          const candidateOtherUserId = selectedChatId
            .split("_")
            .find((id) => id !== userId);
          const expectedChatId = candidateOtherUserId
            ? [userId, candidateOtherUserId].sort().join("_")
            : null;

          if (
            candidateOtherUserId &&
            expectedChatId === selectedChatId &&
            (await areConnected(userId, candidateOtherUserId))
          ) {
            await createChatDocument(userId, candidateOtherUserId);
            chat = await getChat(selectedChatId);
          }
        }

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
    let cancelled = false;
    setAuthorizedChatId(null);
    if (!selectedChatId || !userId) return () => { cancelled = true; };

    const candidateOtherUserId = selectedChatId.split("_").find((id) => id !== userId);
    const expectedChatId = candidateOtherUserId
      ? [userId, candidateOtherUserId].sort().join("_")
      : null;
    if (!candidateOtherUserId || expectedChatId !== selectedChatId) {
      return () => { cancelled = true; };
    }

    void areConnected(userId, candidateOtherUserId)
      .then((connected) => {
        if (!cancelled && connected) setAuthorizedChatId(selectedChatId);
      })
      .catch(() => undefined);

    return () => { cancelled = true; };
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
    if (!selectedChatId || authorizedChatId !== selectedChatId) return null;
    return (
      conversations.find((c) => c.id === selectedChatId) ||
      (fallbackConversation?.id === selectedChatId ? fallbackConversation : null)
    );
  }, [authorizedChatId, conversations, fallbackConversation, selectedChatId]);

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
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 bg-background">
        {/* Conversation list */}
        <aside
          className={cn(
            "flex w-full flex-col border-r border-border/70 bg-background md:w-[340px] lg:w-[360px]",
            selectedChatId ? "hidden md:flex" : "flex"
          )}
        >
          <div className="border-b border-border/60 bg-background px-4 pb-3 pt-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Chats</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">Your CupidMatch conversations</p>
              </div>
              <Button
                asChild
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary/15"
              >
                <Link href="/discover" aria-label="Find people" title="Find people">
                  <Plus className="h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="messages-search"
                placeholder="Search or start a new chat"
                className="h-10 rounded-full border-0 bg-muted/70 pl-9 pr-4 shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
                    data-testid={`chat-${convo.id}`}
                    onClick={() => openChat(convo.id)}
                    className={cn(
                      "relative flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                      active && "bg-primary/[0.08]"
                    )}
                  >
                    {active ? <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" /> : null}
                    <Avatar className="h-14 w-14 border border-border/50">
                      <AvatarImage src={convo.otherUserAvatar} alt="" />
                      <AvatarFallback>{initials(convo.otherUserName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-semibold text-foreground">{convo.otherUserName}</p>
                        <span
                          className={cn(
                            "shrink-0 text-[11px]",
                            convo.unreadCount > 0 ? "font-semibold text-primary" : "text-muted-foreground"
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
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
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
            <div className="flex flex-1 flex-col bg-background">
              {selectedChatId ? (
                <>
                  <header className="flex items-center gap-2 border-b border-border/60 bg-background px-3 py-2.5">
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
                  <div className="max-w-md px-8 py-10">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
                      <MessageCircle className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold tracking-tight">Your conversations</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Choose a connection from the left to start a private conversation.
                    </p>
                    <Button asChild className="mt-6 rounded-full px-6">
                      <Link href="/discover">Discover people</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <header className="z-10 flex items-center gap-3 border-b border-border/60 bg-background px-3 py-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:px-4">
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
                    <p className="truncate text-xs text-muted-foreground">CupidMatch connection · View profile</p>
                  </div>
                </Link>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="hidden rounded-full text-primary sm:inline-flex" disabled title="Video calling coming soon">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hidden rounded-full text-primary sm:inline-flex" disabled title="Voice calling coming soon">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Chat options">
                        <Info className="h-5 w-5 text-primary" />
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

              <div className="relative flex-1 overflow-y-auto bg-gradient-to-b from-background via-background to-violet-50/30 px-3 py-4 sm:px-5 lg:px-7">
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="mx-auto mt-10 max-w-sm rounded-3xl bg-muted/60 px-5 py-7 text-center">
                    <p className="text-sm font-medium text-foreground">No messages yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Say hello and start a warm conversation.
                    </p>
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-0.5">
                    {messages.map((message, index) => {
                      const mine = message.senderId === currentUser.uid;
                      const prev = messages[index - 1];
                      const next = messages[index + 1];
                      const startsGroup = !prev || prev.senderId !== message.senderId;
                      const endsGroup = !next || next.senderId !== message.senderId;
                      const showDate =
                        !prev?.timestamp ||
                        !message.timestamp ||
                        format(prev.timestamp.toDate(), "yyyy-MM-dd") !==
                          format(message.timestamp.toDate(), "yyyy-MM-dd");

                      return (
                        <React.Fragment key={message.id}>
                          {showDate && message.timestamp ? (
                            <div className="my-3 flex justify-center">
                              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                                {dateChipLabel(message.timestamp.toDate())}
                              </span>
                            </div>
                          ) : null}
                          <div
                            className={cn(
                              "flex w-full items-end gap-2",
                              mine ? "justify-end" : "justify-start",
                              startsGroup && "mt-2"
                            )}
                          >
                            {!mine ? (
                              endsGroup ? (
                                <Avatar className="h-7 w-7 shrink-0">
                                  <AvatarImage src={selectedConversation.otherUserAvatar} alt="" />
                                  <AvatarFallback className="text-[9px]">{initials(selectedConversation.otherUserName)}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <span className="h-7 w-7 shrink-0" aria-hidden="true" />
                              )
                            ) : null}
                            <div
                              className={cn(
                                "relative max-w-[82%] rounded-[20px] px-3.5 py-2 text-[15px] leading-5 sm:max-w-[68%] lg:max-w-[62%]",
                                mine
                                  ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white"
                                  : "bg-[#f0f2f5] text-[#050505]",
                                mine && endsGroup && "rounded-br-md",
                                !mine && endsGroup && "rounded-bl-md",
                                message.failed && "opacity-70 ring-1 ring-destructive/40"
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{message.text}</p>
                              <div className={cn("mt-1 items-center justify-end gap-1", endsGroup ? "flex" : "hidden")}>
                                <span className={cn("text-[10px]", mine ? "text-white/75" : "text-muted-foreground")}>
                                  {message.pending
                                    ? "Sending…"
                                    : message.failed
                                      ? "Failed"
                                      : formatBubbleTime(message.timestamp)}
                                </span>
                                {mine && !message.pending && !message.failed ? (
                                  message.isRead ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-white/90" aria-label="Read" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 text-white/75" aria-label="Sent" />
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

              <footer className="shrink-0 border-t border-border/60 bg-background px-2 py-2 sm:px-4 lg:px-6">
                <div className="flex w-full items-end gap-1.5 sm:gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mb-0.5 hidden shrink-0 rounded-full text-primary sm:inline-flex"
                    disabled
                    title="Attachments coming soon"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="mb-0.5 shrink-0 rounded-full text-primary">
                        <Smile className="h-5 w-5" />
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
                    className="mb-0.5 hidden shrink-0 rounded-full text-primary sm:inline-flex"
                    disabled
                    title="Photo sharing coming soon"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>

                  <div className="relative min-w-0 flex-1">
                    <Textarea
                      ref={textareaRef}
                      data-testid="message-composer"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={onComposerKeyDown}
                      placeholder="Type a message"
                      rows={1}
                      className="max-h-[140px] min-h-[44px] resize-none rounded-[22px] border-0 bg-muted/70 px-4 py-3 text-[15px] shadow-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant={draft.trim() ? "default" : "ghost"}
                    className={cn(
                      "mb-0.5 h-11 w-11 shrink-0 rounded-full",
                      draft.trim() && "bg-primary hover:bg-primary/90"
                    )}
                    onClick={() => void handleSend()}
                    disabled={!draft.trim() || isSending}
                    data-testid="message-send"
                    aria-label="Send message"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : draft.trim() ? (
                      <SendHorizonal className="h-5 w-5 text-white" />
                    ) : (
                      <ThumbsUp className="h-5 w-5 text-primary" />
                    )}
                  </Button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
