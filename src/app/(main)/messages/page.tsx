"use client";

import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus, Search as SearchIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, getDoc, getDocs, limit, startAfter, addDoc, updateDoc, increment, writeBatch } from "firebase/firestore";
import { formatDistanceToNowStrict } from "date-fns";
import { useToast } from "@/hooks/use-toast"; // Ensure useToast is imported if you plan to use it
import { useRouter, useSearchParams } from "next/navigation";

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
  isRead: boolean;
}

interface Conversation {
  id: string; // Chat document ID (e.g., uid1_uid2)
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string;
  otherUserAvatarHint: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: string; // Formatted timestamp
  originalTimestamp: Timestamp | null;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedChatId = searchParams.get("chat");
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Initialize to true
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast(); // Initialize toast
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [lastMessageDoc, setLastMessageDoc] = useState<any>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("MessagesPage: Auth listener setup.");
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("MessagesPage: Auth state changed. Current user UID:", user.uid);
        setCurrentUser(user);
        // setIsLoading(true) will be handled in the next useEffect when currentUser is set
      } else {
        console.log("MessagesPage: Auth state changed. No current user. Clearing conversations and setting isLoading to false.");
        setCurrentUser(null);
        setConversations([]);
        setIsLoading(false);
      }
    });
    return () => {
      console.log("MessagesPage: Unsubscribing auth listener.");
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      console.log("MessagesPage: No current user, skipping chats fetch. Ensuring isLoading is false.");
      if (isLoading) {
        // Only set if it's currently true, to avoid unnecessary re-renders
        setIsLoading(false);
      }
      setConversations([]); // Clear conversations if user logs out
      return;
    }

    console.log(`MessagesPage: Current user UID: ${currentUser.uid}. Setting up chats listener. Setting isLoading to true.`);
    setIsLoading(true);
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("participants", "array-contains", currentUser.uid), orderBy("lastMessageTimestamp", "desc"));

    console.log("MessagesPage: Subscribing to onSnapshot for chats query...");
    const unsubscribeChats = onSnapshot(
      q,
      async (querySnapshot) => {
        console.log(`MessagesPage: ON_SNAPSHOT_SUCCESS_CALLBACK_ENTERED. Empty: ${querySnapshot.empty}, Size: ${querySnapshot.size}, Docs count: ${querySnapshot.docs.length}`);

        if (querySnapshot.empty) {
          console.log("MessagesPage: No chat documents found for this user. Clearing conversations.");
          setConversations([]);
          setIsLoading(false); // Explicitly set isLoading to false
          console.log("MessagesPage: Set isLoading to false (querySnapshot was empty).");
          return;
        }

        const convsPromises = querySnapshot.docs.map(async (chatDoc) => {
          const chatData = chatDoc.data();
          console.log(`MessagesPage: Processing chatDoc ID: ${chatDoc.id}, Raw Data:`, JSON.parse(JSON.stringify(chatData)));

          const otherParticipantUid = chatData.participants.find((p: string) => p !== currentUser.uid);

          if (!otherParticipantUid) {
            console.warn(`MessagesPage: Could not find other participant for chatDoc ID: ${chatDoc.id}. Skipping.`);
            return null;
          }
          // console.log(`MessagesPage: Chat ${chatDoc.id} - Other participant UID: ${otherParticipantUid}`);

          let otherUserName = "User";
          let otherUserAvatar = "https://placehold.co/100x100.png";
          let otherUserAvatarHint = "person placeholder";

          if (chatData.participantDetails && chatData.participantDetails[otherParticipantUid]) {
            otherUserName = chatData.participantDetails[otherParticipantUid].displayName || "User (from details)";
            otherUserAvatar = chatData.participantDetails[otherParticipantUid].photoURL || "https://placehold.co/100x100.png";
            otherUserAvatarHint = chatData.participantDetails[otherParticipantUid].dataAiHint || (otherUserAvatar.includes("placehold.co") ? "person placeholder" : "person avatar");
            // console.log(`MessagesPage: Chat ${chatDoc.id} - Loaded other user from participantDetails: ${otherUserName}`);
          } else {
            // console.log(`MessagesPage: Chat ${chatDoc.id} - participantDetails not found for ${otherParticipantUid}, fetching from users collection.`);
            try {
              const userDocRef = doc(db, "users", otherParticipantUid);
              const userSnap = await getDoc(userDocRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                otherUserName = userData.displayName || "User (from users collection)";
                otherUserAvatar = userData.photoURL || "https://placehold.co/100x100.png";
                otherUserAvatarHint = userData.dataAiHint || (userData.photoURL && !userData.photoURL.includes("placehold.co") ? "person avatar" : "person placeholder");
                // console.log(`MessagesPage: Chat ${chatDoc.id} - Fetched other user from users collection: ${otherUserName}`);
              } else {
                console.warn(`MessagesPage: Chat ${chatDoc.id} - User document for ${otherParticipantUid} not found in users collection.`);
              }
            } catch (userFetchError) {
              console.error(`MessagesPage: Chat ${chatDoc.id} - Error fetching user ${otherParticipantUid} from users collection:`, userFetchError);
            }
          }

          const lastMessageTimestamp = chatData.lastMessageTimestamp as Timestamp | null;
          let formattedTimestamp = "N/A";
          if (lastMessageTimestamp && typeof lastMessageTimestamp.toDate === "function") {
            try {
              formattedTimestamp = formatDistanceToNowStrict(lastMessageTimestamp.toDate(), { addSuffix: true });
            } catch (e) {
              console.warn(`MessagesPage: Chat ${chatDoc.id} - Could not format timestamp:`, lastMessageTimestamp, e);
              formattedTimestamp = "Invalid date";
            }
          } else if (lastMessageTimestamp) {
            console.warn(`MessagesPage: Chat ${chatDoc.id} - lastMessageTimestamp is not a Firestore Timestamp object:`, lastMessageTimestamp);
            formattedTimestamp = "Date unavailable";
          }
          // console.log(`MessagesPage: Chat ${chatDoc.id} - Last message: "${chatData.lastMessageText}", Formatted Timestamp: ${formattedTimestamp}`);

          const unreadCount = chatData.unreadBy && chatData.unreadBy[currentUser.uid] ? Number(chatData.unreadBy[currentUser.uid]) : 0;
          // console.log(`MessagesPage: Chat ${chatDoc.id} - Unread count for current user: ${unreadCount}`);

          return {
            id: chatDoc.id,
            otherUserId: otherParticipantUid,
            otherUserName: otherUserName,
            otherUserAvatar: otherUserAvatar,
            otherUserAvatarHint: otherUserAvatarHint,
            lastMessage: chatData.lastMessageText || "No messages yet",
            unreadCount: unreadCount,
            timestamp: formattedTimestamp,
            originalTimestamp: lastMessageTimestamp,
          } as Conversation;
        });

        try {
          let resolvedConvs = (await Promise.all(convsPromises)).filter((c) => c !== null) as Conversation[];
          resolvedConvs.sort((a, b) => (b.originalTimestamp?.toMillis() || 0) - (a.originalTimestamp?.toMillis() || 0));
          console.log("MessagesPage: Final resolved conversations (before setting state):", JSON.parse(JSON.stringify(resolvedConvs)));
          setConversations(resolvedConvs);
        } catch (processingError) {
          console.error("MessagesPage: Error processing conversation promises:", processingError);
          setConversations([]);
        } finally {
          setIsLoading(false);
          console.log("MessagesPage: Set isLoading to false (finished processing snapshot).");
        }
      },
      (error) => {
        console.error("MessagesPage: ON_SNAPSHOT_ERROR_CALLBACK_ENTERED. Error:", error);
        toast({ title: "Error Loading Chats", description: "Could not load your conversations. " + error.message, variant: "destructive" });
        setConversations([]);
        setIsLoading(false);
        console.log("MessagesPage: Set isLoading to false (onSnapshot error).");
      }
    );

    return () => {
      console.log("MessagesPage: Unsubscribing chats listener.");
      unsubscribeChats();
    };
  }, [currentUser, toast]); // Added toast to dependency array

  const filteredConversations = conversations.filter((convo) => convo.otherUserName.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleConversationSelect = (chatId: string) => {
    router.push(`/messages?chat=${chatId}`);
  };

  const selectedConversation = conversations.find((conv) => conv.id === selectedChatId);

  // Add new useEffect for loading messages
  useEffect(() => {
    if (!selectedChatId || !currentUser) {
      setMessages([]);
      setLastMessageDoc(null);
      setHasMoreMessages(true);
      return;
    }

    setIsLoadingMessages(true);

    const messagesRef = collection(db, "chats", selectedChatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(20));

    // Set up the real-time listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const newMessages: Message[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          newMessages.push({
            id: doc.id,
            text: data.text,
            senderId: data.senderId,
            timestamp: data.timestamp,
            isRead: data.isRead || false,
          });
        });

        // Sort messages by timestamp (oldest first)
        newMessages.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        setMessages(newMessages);
        setLastMessageDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMoreMessages(querySnapshot.docs.length === 20);
        setIsLoadingMessages(false);
      },
      (error) => {
        console.error("Error in messages snapshot:", error);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
        setIsLoadingMessages(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [selectedChatId, currentUser, toast]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMoreMessages = async () => {
    if (!selectedChatId || !currentUser || !lastMessageDoc || !hasMoreMessages) return;

    try {
      const messagesRef = collection(db, "chats", selectedChatId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "desc"), startAfter(lastMessageDoc), limit(20));

      const querySnapshot = await getDocs(q);
      const newMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newMessages.push({
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          timestamp: data.timestamp,
          isRead: data.isRead || false,
        });
      });

      if (newMessages.length > 0) {
        setMessages((prev) => [...prev, ...newMessages.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis())]);
        setLastMessageDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMoreMessages(querySnapshot.docs.length === 20);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      toast({
        title: "Error",
        description: "Failed to load more messages. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add function to mark messages as read
  const markMessagesAsRead = async (chatId: string) => {
    if (!currentUser || !chatId) return;

    try {
      const batch = writeBatch(db);

      // Update the chat document to clear unread count
      const chatRef = doc(db, "chats", chatId);
      batch.update(chatRef, {
        [`unreadBy.${currentUser.uid}`]: 0,
      });

      // Update all unread messages in the messages subcollection
      const messagesRef = collection(db, "chats", chatId, "messages");
      const unreadQuery = query(messagesRef, where("isRead", "==", false), where("senderId", "!=", currentUser.uid));

      const unreadSnapshot = await getDocs(unreadQuery);
      unreadSnapshot.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });

      await batch.commit();

      // Update the conversations state to remove the notification badge
      setConversations((prevConversations) => prevConversations.map((conv) => (conv.id === chatId ? { ...conv, unreadCount: 0 } : conv)));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Update useEffect to mark messages as read when chat is selected
  useEffect(() => {
    if (selectedChatId && currentUser) {
      markMessagesAsRead(selectedChatId);
    }
  }, [selectedChatId, currentUser]);

  // Update the message sending to handle read status
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("message") as HTMLInputElement;
    const message = input.value.trim();

    if (!message || !currentUser || !selectedChatId) return;

    try {
      const batch = writeBatch(db);
      const messagesRef = collection(db, "chats", selectedChatId, "messages");
      const newMessageRef = doc(messagesRef);

      // Add the new message
      batch.set(newMessageRef, {
        text: message,
        senderId: currentUser.uid,
        timestamp: Timestamp.now(),
        isRead: false,
      });

      // Update the chat document
      const chatRef = doc(db, "chats", selectedChatId);
      batch.update(chatRef, {
        lastMessageText: message,
        lastMessageTimestamp: Timestamp.now(),
        [`unreadBy.${selectedConversation?.otherUserId}`]: increment(1),
      });

      await batch.commit();
      input.value = "";
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left sidebar - Conversations list */}
      <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col h-full ${selectedChatId ? "hidden md:flex" : "flex"}`}>
        {/* Header */}
        <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-headline text-xl font-semibold text-gray-800">Messages</h1>
            <Button size="icon" variant="ghost" className="rounded-full">
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-9 bg-muted/50 border-none focus-visible:ring-0" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading conversations...</p>
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredConversations.map((convo) => (
                <button key={convo.id} onClick={() => handleConversationSelect(convo.id)} className={`w-full flex items-center p-3 hover:bg-muted/50 transition-colors cursor-pointer ${selectedChatId === convo.id ? "bg-muted/50" : ""}`}>
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={convo.otherUserAvatar} alt={convo.otherUserName} data-ai-hint={convo.otherUserAvatarHint} />
                      <AvatarFallback>{convo.otherUserName.substring(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {convo.unreadCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs">{convo.unreadCount}</Badge>}
                  </div>
                  <div className="ml-3 flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{convo.otherUserName}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{convo.timestamp}</span>
                    </div>
                    <p className={`text-sm truncate ${convo.unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground"}`}>{convo.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageSquarePlus className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start connecting with profiles to begin chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Chat view or Welcome state */}
      <div className={`flex-1 flex flex-col h-full ${!selectedChatId ? "hidden md:flex" : "flex"}`}>
        {selectedChatId && selectedConversation ? (
          <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center">
              <button onClick={() => router.push("/messages")} className="md:hidden mr-2 p-2 hover:bg-muted/50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation.otherUserAvatar} alt={selectedConversation.otherUserName} />
                <AvatarFallback>{selectedConversation.otherUserName.substring(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <h2 className="font-medium">{selectedConversation.otherUserName}</h2>
                <p className="text-xs text-muted-foreground">Active now</p>
              </div>
            </div>

            {/* Chat messages area */}
            <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {hasMoreMessages && (
                    <div className="flex justify-center">
                      <Button variant="ghost" size="sm" onClick={loadMoreMessages} className="text-xs text-muted-foreground">
                        Load more messages
                      </Button>
                    </div>
                  )}
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.senderId === currentUser?.uid ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-lg px-4 py-2 ${message.senderId === currentUser?.uid ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs mt-1 opacity-70">{formatDistanceToNowStrict(message.timestamp.toDate(), { addSuffix: true })}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat input area */}
            <div className="p-4 border-t bg-background">
              <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
                <Input name="message" placeholder="Type a message..." className="flex-1" />
                <Button type="submit" size="icon" className="rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-muted/30">
            <div className="text-center p-8">
              <MessageSquarePlus className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
              <p className="text-muted-foreground max-w-sm">Select a conversation to start messaging or click the new message button to start a new chat.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
