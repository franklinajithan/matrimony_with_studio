
"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquarePlus, Search as SearchIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { formatDistanceToNowStrict } from 'date-fns';

interface Conversation {
  id: string; // Chat document ID (e.g., uid1_uid2)
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: string; // Formatted timestamp
  originalTimestamp: Timestamp | null;
}

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsLoading(false);
        setConversations([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    setIsLoading(true);
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageTimestamp", "desc")
    );

    const unsubscribeChats = onSnapshot(q, async (querySnapshot) => {
      const convsPromises = querySnapshot.docs.map(async (chatDoc) => {
        const chatData = chatDoc.data();
        const otherParticipantUid = chatData.participants.find((p: string) => p !== currentUser.uid);

        if (!otherParticipantUid) return null;

        // Use participantDetails if available, otherwise fetch live (fallback)
        let otherUserName = "User";
        let otherUserAvatar = "https://placehold.co/100x100.png"; // Default placeholder

        if (chatData.participantDetails && chatData.participantDetails[otherParticipantUid]) {
            otherUserName = chatData.participantDetails[otherParticipantUid].displayName || "User";
            otherUserAvatar = chatData.participantDetails[otherParticipantUid].photoURL || "https://placehold.co/100x100.png";
        } else {
            // Fallback: Fetch from users collection if participantDetails is missing/incomplete
            const userDocRef = doc(db, "users", otherParticipantUid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                otherUserName = userData.displayName || "User";
                otherUserAvatar = userData.photoURL || "https://placehold.co/100x100.png";
            }
        }
        
        const lastMessageTimestamp = chatData.lastMessageTimestamp as Timestamp | null;
        let formattedTimestamp = "N/A";
        if (lastMessageTimestamp) {
          try {
            formattedTimestamp = formatDistanceToNowStrict(lastMessageTimestamp.toDate(), { addSuffix: true });
          } catch (e) {
            console.warn("Could not format timestamp:", lastMessageTimestamp);
            // Fallback for potentially non-Timestamp values if data is inconsistent
            if (typeof lastMessageTimestamp === 'string') formattedTimestamp = lastMessageTimestamp;
            else if (lastMessageTimestamp.seconds) formattedTimestamp = formatDistanceToNowStrict(new Date(lastMessageTimestamp.seconds * 1000), {addSuffix: true});
          }
        }


        return {
          id: chatDoc.id,
          otherUserId: otherParticipantUid,
          otherUserName: otherUserName,
          otherUserAvatar: otherUserAvatar,
          lastMessage: chatData.lastMessageText || "No messages yet",
          unreadCount: chatData.unreadBy && chatData.unreadBy[currentUser.uid] ? chatData.unreadBy[currentUser.uid] : 0,
          timestamp: formattedTimestamp,
          originalTimestamp: lastMessageTimestamp,
        } as Conversation;
      });

      const resolvedConvs = (await Promise.all(convsPromises)).filter(c => c !== null) as Conversation[];
      // Secondary sort by original timestamp if primary (desc) needs refinement for same-second messages.
      resolvedConvs.sort((a, b) => (b.originalTimestamp?.toMillis() || 0) - (a.originalTimestamp?.toMillis() || 0));
      setConversations(resolvedConvs);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching conversations: ", error);
      setIsLoading(false);
      // Potentially set an error state to show in UI
    });

    return () => unsubscribeChats();
  }, [currentUser]);

  const filteredConversations = conversations.filter(convo =>
    convo.otherUserName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="font-headline text-4xl font-semibold text-gray-800">Your Conversations</h1>
          <p className="mt-1 text-lg text-muted-foreground">Connect and chat with your matches.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <MessageSquarePlus className="mr-2 h-5 w-5" /> Start New Chat
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center space-x-2">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="border-none focus-visible:ring-0 shadow-none text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading conversations...</p>
            </div>
          ) : filteredConversations.length > 0 ? (
            <ul className="divide-y divide-border">
              {filteredConversations.map((convo) => (
                <li key={convo.id}>
                  <Link href={`/messages/${convo.id}`} className="block hover:bg-muted/50 transition-colors">
                    <div className="flex items-center p-4 space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={convo.otherUserAvatar} alt={convo.otherUserName} data-ai-hint="person avatar" />
                        <AvatarFallback>{convo.otherUserName.substring(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{convo.otherUserName}</p>
                        <p className={`text-sm truncate ${convo.unreadCount > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {convo.lastMessage}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{convo.timestamp}</p>
                        {convo.unreadCount > 0 && (
                          <Badge className="mt-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5">{convo.unreadCount}</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center">
              <MessageSquarePlus className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No conversations yet.</p>
              <p className="text-sm text-muted-foreground">Start connecting with profiles to begin chatting.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
