
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
  otherUserAvatarHint: string;
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
    console.log("MessagesPage: Auth listener setup.");
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("MessagesPage: Auth state changed. Current user UID:", user.uid);
        setCurrentUser(user);
      } else {
        console.log("MessagesPage: Auth state changed. No current user.");
        setCurrentUser(null);
        setIsLoading(false);
        setConversations([]);
      }
    });
    return () => {
      console.log("MessagesPage: Unsubscribing auth listener.");
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      console.log("MessagesPage: No current user, skipping chats fetch.");
      // Ensure loading is false if there's no user to fetch for
      if (isLoading) setIsLoading(false); 
      return;
    }

    console.log(`MessagesPage: Current user UID: ${currentUser.uid}. Setting up chats listener.`);
    setIsLoading(true);
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageTimestamp", "desc")
    );

    const unsubscribeChats = onSnapshot(q, async (querySnapshot) => {
      console.log(`MessagesPage: Snapshot received. Empty: ${querySnapshot.empty}, Size: ${querySnapshot.size}, Docs count: ${querySnapshot.docs.length}`);
      if (querySnapshot.empty) {
        console.log("MessagesPage: No chat documents found for this user.");
        setConversations([]);
        setIsLoading(false);
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
        console.log(`MessagesPage: Chat ${chatDoc.id} - Other participant UID: ${otherParticipantUid}`);

        let otherUserName = "User";
        let otherUserAvatar = "https://placehold.co/100x100.png";
        let otherUserAvatarHint = "person placeholder";

        if (chatData.participantDetails && chatData.participantDetails[otherParticipantUid]) {
            otherUserName = chatData.participantDetails[otherParticipantUid].displayName || "User (from details)";
            otherUserAvatar = chatData.participantDetails[otherParticipantUid].photoURL || "https://placehold.co/100x100.png";
            otherUserAvatarHint = chatData.participantDetails[otherParticipantUid].dataAiHint || (otherUserAvatar.includes('placehold.co') ? "person placeholder" : "person avatar");
            console.log(`MessagesPage: Chat ${chatDoc.id} - Loaded other user from participantDetails: ${otherUserName}`);
        } else {
            console.log(`MessagesPage: Chat ${chatDoc.id} - participantDetails not found for ${otherParticipantUid}, fetching from users collection.`);
            try {
                const userDocRef = doc(db, "users", otherParticipantUid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    otherUserName = userData.displayName || "User (from users collection)";
                    otherUserAvatar = userData.photoURL || "https://placehold.co/100x100.png";
                    otherUserAvatarHint = userData.dataAiHint || (userData.photoURL && !userData.photoURL.includes('placehold.co') ? "person avatar" : "person placeholder");
                    console.log(`MessagesPage: Chat ${chatDoc.id} - Fetched other user from users collection: ${otherUserName}`);
                } else {
                    console.warn(`MessagesPage: Chat ${chatDoc.id} - User document for ${otherParticipantUid} not found in users collection.`);
                }
            } catch (userFetchError) {
                 console.error(`MessagesPage: Chat ${chatDoc.id} - Error fetching user ${otherParticipantUid} from users collection:`, userFetchError);
            }
        }
        
        const lastMessageTimestamp = chatData.lastMessageTimestamp as Timestamp | null;
        let formattedTimestamp = "N/A";
        if (lastMessageTimestamp && typeof lastMessageTimestamp.toDate === 'function') { // Check if it's a Firestore Timestamp
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
        console.log(`MessagesPage: Chat ${chatDoc.id} - Last message: "${chatData.lastMessageText}", Formatted Timestamp: ${formattedTimestamp}`);

        const unreadCount = (chatData.unreadBy && chatData.unreadBy[currentUser.uid]) ? Number(chatData.unreadBy[currentUser.uid]) : 0;
        console.log(`MessagesPage: Chat ${chatDoc.id} - Unread count for current user: ${unreadCount}`);


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
        let resolvedConvs = (await Promise.all(convsPromises)).filter(c => c !== null) as Conversation[];
        // Secondary sort by original timestamp just in case Firestore's "desc" order on potentially null/varied timestamps isn't perfect
        resolvedConvs.sort((a, b) => (b.originalTimestamp?.toMillis() || 0) - (a.originalTimestamp?.toMillis() || 0));
        console.log("MessagesPage: Final resolved conversations (before setting state):", JSON.parse(JSON.stringify(resolvedConvs)));
        setConversations(resolvedConvs);
      } catch (processingError) {
        console.error("MessagesPage: Error processing conversation promises:", processingError);
        setConversations([]); // Clear on error
      } finally {
        setIsLoading(false);
        console.log("MessagesPage: Finished processing snapshot, isLoading set to false.");
      }
    }, (error) => {
      console.error("MessagesPage: Error in onSnapshot for chats:", error);
      toast({title: "Error Loading Chats", description: "Could not load your conversations. " + error.message, variant: "destructive"});
      setConversations([]);
      setIsLoading(false);
    });

    return () => {
      console.log("MessagesPage: Unsubscribing chats listener.");
      unsubscribeChats();
    };
  }, [currentUser]); // Added toast import, removed it from this array

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
                        <AvatarImage src={convo.otherUserAvatar} alt={convo.otherUserName} data-ai-hint={convo.otherUserAvatarHint} />
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
