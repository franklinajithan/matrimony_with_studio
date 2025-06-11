
"use client";

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Send, Paperclip, Smile, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  increment,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { format } from 'date-fns';


interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp | null; // Firestore Timestamp
  formattedTimestamp?: string; // For display
}

interface OtherUserDetails {
  id: string;
  name: string;
  avatarUrl: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUserDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
   const viewportRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        router.push('/login'); // Redirect if not logged in
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  // Fetch participant details and mark messages as read
  useEffect(() => {
    if (!currentUser || !chatId) return;

    const chatDocRef = doc(db, "chats", chatId);

    const fetchParticipantDetails = async () => {
      setIsLoading(true);
      try {
        const chatSnap = await getDoc(chatDocRef);
        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          const otherParticipantUid = chatData.participants.find((p: string) => p !== currentUser.uid);

          if (otherParticipantUid) {
            let name = "User";
            let avatarUrl = "https://placehold.co/100x100.png";

            if (chatData.participantDetails && chatData.participantDetails[otherParticipantUid]) {
                name = chatData.participantDetails[otherParticipantUid].displayName || "User";
                avatarUrl = chatData.participantDetails[otherParticipantUid].photoURL || "https://placehold.co/100x100.png";
            } else {
                const userDocRef = doc(db, "users", otherParticipantUid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    name = userData.displayName || "User";
                    avatarUrl = userData.photoURL || "https://placehold.co/100x100.png";
                }
            }
            setOtherUser({ id: otherParticipantUid, name, avatarUrl });

            // Mark messages as read for current user
            if (chatData.unreadBy && chatData.unreadBy[currentUser.uid] > 0) {
              await updateDoc(chatDocRef, {
                [`unreadBy.${currentUser.uid}`]: 0
              });
            }
          } else {
            console.error("Other participant not found in chat.");
            router.push('/messages'); // Or show an error
          }
        } else {
          console.error("Chat document not found.");
          router.push('/messages'); // Or show an error
        }
      } catch (error) {
        console.error("Error fetching participant details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipantDetails();
  }, [currentUser, chatId, router]);

  // Listen for messages
  useEffect(() => {
    if (!chatId) return;

    const messagesColRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesColRef, orderBy("timestamp", "asc"));

    const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data.timestamp as Timestamp | null;
        return {
          id: doc.id,
          ...data,
          timestamp,
          formattedTimestamp: timestamp ? format(timestamp.toDate(), 'p') : 'Sending...'
        } as Message;
      });
      setMessages(msgs);
    }, (error) => {
      console.error("Error fetching messages:", error);
      // Potentially set an error state
    });

    return () => unsubscribeMessages();
  }, [chatId]);

  // Scroll to bottom
  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !currentUser || !otherUser || isSending) return;

    setIsSending(true);
    const textToSend = newMessage;
    setNewMessage("");

    const messagesColRef = collection(db, "chats", chatId, "messages");
    const chatDocRef = doc(db, "chats", chatId);

    try {
      const batch = writeBatch(db);

      // Add new message
      const newMessageDocRef = doc(collection(db, "chats", chatId, "messages")); // auto-generate ID
      batch.set(newMessageDocRef, {
        senderId: currentUser.uid,
        text: textToSend,
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid] // Sender has "read" it
      });

      // Update chat document
      batch.update(chatDocRef, {
        lastMessageText: textToSend,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: currentUser.uid,
        [`unreadBy.${otherUser.id}`]: increment(1),
        // Ensure participantDetails exists before trying to update specific fields if that's a strategy
        // For simplicity, we assume participantDetails are set up when chat is created/first message.
      });

      await batch.commit();

    } catch (error) {
      console.error("Error sending message:", error);
      // Handle error, maybe show a toast
      setNewMessage(textToSend); // Put message back in input if send failed
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!otherUser && !isLoading) {
     return (
        <div className="flex items-center justify-center h-full">
            <p>Could not load chat details. The user may not exist or the chat is invalid.</p>
        </div>
    );
  }


  return (
    <Card className="h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] flex flex-col shadow-xl">
      {otherUser && (
        <CardHeader className="flex flex-row items-center space-x-4 p-4 border-b">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/messages">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to messages</span>
            </Link>
          </Button>
          <Avatar>
            <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} data-ai-hint="person avatar" />
            <AvatarFallback>{otherUser.name.substring(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-lg">{otherUser.name}</h2>
            {/* Online status could be a future enhancement */}
            {/* <p className="text-xs text-muted-foreground">Online</p> */}
          </div>
        </CardHeader>
      )}

      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full" viewportRef={viewportRef} ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end space-x-2",
                  msg.senderId === currentUser.uid ? "justify-end" : "justify-start"
                )}
              >
                {msg.senderId !== currentUser.uid && otherUser && (
                  <Avatar className="h-8 w-8 self-start">
                    <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} data-ai-hint="person avatar" />
                    <AvatarFallback>{otherUser.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2 text-sm shadow",
                    msg.senderId === currentUser.uid
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className={cn(
                      "text-xs mt-1",
                       msg.senderId === currentUser.uid ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
                    )}>
                    {msg.formattedTimestamp}
                  </p>
                </div>
                 {msg.senderId === currentUser.uid && (
                   <Avatar className="h-8 w-8 self-start">
                    <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "You"} data-ai-hint="user avatar" />
                    <AvatarFallback>{currentUser.displayName ? currentUser.displayName.substring(0,1).toUpperCase() : "Y"}</AvatarFallback> 
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Button variant="ghost" size="icon" type="button" disabled={isSending}>
            <Paperclip className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            autoComplete="off"
            disabled={isSending}
          />
           <Button variant="ghost" size="icon" type="button" disabled={isSending}>
            <Smile className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Add emoji</span>
          </Button>
          <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90" disabled={isSending || newMessage.trim() === ""}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 text-primary-foreground" />}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
