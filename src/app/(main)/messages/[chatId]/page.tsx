
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
import { format, isToday, isYesterday, parseISO } from 'date-fns';


interface RawMessageData {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp | null;
}

interface ProcessedMessage extends RawMessageData {
  displayTimestamp: string;
  showDateSeparator: boolean;
  dateSeparatorLabel: string;
}

interface OtherUserDetails {
  id: string;
  name: string;
  avatarUrl: string;
  avatarHint: string;
}

function formatDisplayTimestamp(timestamp: Timestamp | null): string {
  if (!timestamp) return 'Sending...';
  const date = timestamp.toDate();
  const now = new Date();

  if (isToday(date)) {
    return format(date, 'p'); // e.g., 2:30 PM
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'p')}`;
  } else if (now.getFullYear() === date.getFullYear()) {
    return format(date, 'MMM d, p'); // e.g., Mar 15, 2:30 PM
  } else {
    return format(date, 'MMM d, yyyy, p'); // e.g., Mar 15, 2023, 2:30 PM
  }
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUserDetails | null>(null);
  const [messages, setMessages] = useState<ProcessedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        router.push('/login'); 
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
            let avatarHint = "person placeholder";
            
            if (chatData.participantDetails && chatData.participantDetails[otherParticipantUid]) {
                name = chatData.participantDetails[otherParticipantUid].displayName || "User";
                avatarUrl = chatData.participantDetails[otherParticipantUid].photoURL || "https://placehold.co/100x100.png";
                avatarHint = chatData.participantDetails[otherParticipantUid].dataAiHint || (avatarUrl.includes('placehold.co') ? "person placeholder" : "person avatar");
            } else {
                const userDocRef = doc(db, "users", otherParticipantUid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    name = userData.displayName || "User";
                    avatarUrl = userData.photoURL || "https://placehold.co/100x100.png";
                    avatarHint = userData.dataAiHint || (avatarUrl.includes('placehold.co') ? "person placeholder" : "person avatar");
                    
                    await updateDoc(chatDocRef, {
                        [`participantDetails.${otherParticipantUid}`]: {
                            displayName: name,
                            photoURL: avatarUrl,
                            dataAiHint: avatarHint
                        }
                    });
                }
            }
            setOtherUser({ id: otherParticipantUid, name, avatarUrl, avatarHint });

            if (chatData.unreadBy && chatData.unreadBy[currentUser.uid] > 0) {
              await updateDoc(chatDocRef, {
                [`unreadBy.${currentUser.uid}`]: 0
              });
            }
          } else {
            console.error("Other participant not found in chat.");
            router.push('/messages'); 
          }
        } else {
          console.error("Chat document not found.");
          router.push('/messages'); 
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
      let lastMessageDateString: string | null = null;
      const processedMsgs = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data() as Omit<RawMessageData, 'id'>;
        const rawMessage: RawMessageData = { id: docSnap.id, ...data };
        
        let showDateSeparator = false;
        let dateSeparatorLabel = '';
        
        if (rawMessage.timestamp) {
          const messageDate = rawMessage.timestamp.toDate();
          const currentMessageDateString = format(messageDate, 'yyyy-MM-dd');
          
          if (currentMessageDateString !== lastMessageDateString) {
            showDateSeparator = true;
            if (isToday(messageDate)) {
              dateSeparatorLabel = 'Today';
            } else if (isYesterday(messageDate)) {
              dateSeparatorLabel = 'Yesterday';
            } else {
              dateSeparatorLabel = format(messageDate, 'MMMM d, yyyy');
            }
            lastMessageDateString = currentMessageDateString;
          }
        }

        return {
          ...rawMessage,
          displayTimestamp: formatDisplayTimestamp(rawMessage.timestamp),
          showDateSeparator,
          dateSeparatorLabel,
        } as ProcessedMessage;
      });
      setMessages(processedMsgs);
    }, (error) => {
      console.error("Error fetching messages:", error);
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

    const chatDocRef = doc(db, "chats", chatId);

    try {
      const batch = writeBatch(db);
      const newMessageDocRef = doc(collection(db, "chats", chatId, "messages"));
      batch.set(newMessageDocRef, {
        senderId: currentUser.uid,
        text: textToSend,
        timestamp: serverTimestamp(),
      });

      batch.update(chatDocRef, {
        lastMessageText: textToSend,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: currentUser.uid,
        [`unreadBy.${otherUser.id}`]: increment(1),
      });
      await batch.commit();
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(textToSend); 
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
        <div className="flex items-center justify-center h-full p-4 text-center">
            <p className="text-muted-foreground">Could not load chat details. The user may not exist or the chat is invalid.</p>
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
            <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} data-ai-hint={otherUser.avatarHint} />
            <AvatarFallback>{otherUser.name.substring(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-lg">{otherUser.name}</h2>
          </div>
        </CardHeader>
      )}

      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full" viewportRef={viewportRef} ref={scrollAreaRef}>
          <div className="p-4 space-y-1"> {/* Reduced space-y for tighter message groups */}
            {messages.map((msg) => (
              <React.Fragment key={msg.id}>
                {msg.showDateSeparator && (
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 text-xs text-muted-foreground bg-muted rounded-full">
                      {msg.dateSeparatorLabel}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "flex items-end space-x-2 py-1", // Added py-1 to message rows
                    msg.senderId === currentUser.uid ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.senderId !== currentUser.uid && otherUser && (
                    <Avatar className="h-8 w-8 self-start">
                      <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} data-ai-hint={otherUser.avatarHint} />
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
                      {msg.displayTimestamp}
                    </p>
                  </div>
                   {msg.senderId === currentUser.uid && (
                     <Avatar className="h-8 w-8 self-start">
                      <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "You"} data-ai-hint={currentUser.photoURL ? "user avatar" : "user placeholder"} />
                      <AvatarFallback>{currentUser.displayName ? currentUser.displayName.substring(0,1).toUpperCase() : "Y"}</AvatarFallback> 
                    </Avatar>
                  )}
                </div>
              </React.Fragment>
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

