"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { UserCircle, Settings, Star, Search, MessageCircle, CreditCard, Sparkles, Users, UserPlus, CalendarCheck, Briefcase, MapPin, Cake, Loader2, Check, X, Eye, FileText, Heart, Edit3, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import React, { useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, writeBatch, serverTimestamp, Timestamp, orderBy, limit, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { calculateAge, getCompositeId } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";

interface MatchRequest {
  id: string;
  senderUid: string;
  senderName: string;
  senderAge?: number;
  senderProfession?: string;
  senderLocation?: string;
  senderAvatarUrl: string;
  senderDataAiHint: string;
  timestamp: Timestamp;
}

interface Connection {
  id: string;
  userId: string;
  displayName: string;
  photoURL: string;
  dataAiHint: string;
  lastMessageText?: string;
  lastMessageTimestamp?: Timestamp;
  unreadCount: number;
  age?: number;
  profession?: string;
  location?: string;
}

interface QuickSuggestionProfile {
  id: string;
  name: string;
  age?: number;
  profession?: string;
  location?: string;
  avatarUrl: string;
  dataAiHint: string;
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

const mockUser = {
  name: "User",
  avatarUrl: "https://placehold.co/100x100.png",
  dataAiHint: "person placeholder",
};

const mockTodaysHoroscope = {
  sign: "Your Sign",
  summary: "Today's horoscope summary will appear here once the feature is implemented.",
  luckyColor: "Varies",
  luckyNumber: 0,
};

const PROFILE_COMPLETION_FIELDS = ["displayName", "bio", "photoURL", "location", "profession", "height", "dob", "religion", "caste", "language", "hobbies"];

const dashboardQuickLinks = [
  { href: "/discover", label: "Discover", icon: <Search className="mr-3 h-5 w-5" /> },
  { href: "/messages", label: "Messages", icon: <MessageCircle className="mr-3 h-5 w-5" /> },
  { href: "/dashboard/horoscope", label: "Horoscope", icon: <Sparkles className="mr-3 h-5 w-5" /> },
  { href: "/pricing", label: "Subscription", icon: <CreditCard className="mr-3 h-5 w-5" /> },
];

const dummyPosts: Post[] = [
  {
    id: "1",
    userId: "user1",
    userName: "Sarah Johnson",
    userAvatar: "https://placehold.co/100x100.png",
    content: "Just found my perfect match on Matrimony! Can't wait to start this new chapter of my life. 💑",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    likes: 24,
    comments: 5,
    isLiked: false,
  },
  {
    id: "2",
    userId: "user2",
    userName: "Michael Chen",
    userAvatar: "https://placehold.co/100x100.png",
    content: "Attending a community event this weekend to meet new people. Anyone else going? Would love to connect! 🤝",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    likes: 15,
    comments: 3,
    isLiked: true,
  },
  {
    id: "3",
    userId: "user3",
    userName: "Priya Sharma",
    userAvatar: "https://placehold.co/100x100.png",
    content: "Success story: Met my soulmate here 6 months ago, and we're getting married next month! Thank you Matrimony for making this possible! 💕",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    likes: 89,
    comments: 12,
    isLiked: false,
  },
  {
    id: "4",
    userId: "user4",
    userName: "David Kumar",
    userAvatar: "https://placehold.co/100x100.png",
    content: "Looking forward to the community meetup this weekend! It's a great opportunity to meet like-minded people. Who else is attending? 👥",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    likes: 32,
    comments: 7,
    isLiked: false,
  },
  {
    id: "5",
    userId: "user5",
    userName: "Emma Wilson",
    userAvatar: "https://placehold.co/100x100.png",
    content: "Just updated my profile with new photos and interests. Excited to connect with new people! 🌟",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    likes: 45,
    comments: 4,
    isLiked: true,
  },
  {
    id: "6",
    userId: "user6",
    userName: "Raj Patel",
    userAvatar: "https://placehold.co/100x100.png",
    content: "Happy to share that I've found my life partner through this platform. The journey has been amazing! 🙏",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    likes: 156,
    comments: 23,
    isLiked: false,
  },
  {
    id: "7",
    userId: "user7",
    userName: "Sophie Anderson",
    userAvatar: "https://placehold.co/100x100.png",
    content: "Just had a wonderful first meeting with someone special. The compatibility is amazing! 💫",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
    likes: 67,
    comments: 9,
    isLiked: false,
  },
  {
    id: "8",
    userId: "user8",
    userName: "Arjun Singh",
    userAvatar: "https://placehold.co/100x100.png",
    content: "Attending a cultural event this weekend. Would love to meet people who share similar interests in music and dance! 🎵",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    likes: 42,
    comments: 6,
    isLiked: true,
  },
  {
    id: "9",
    userId: "user9",
    userName: "Maya Gupta",
    userAvatar: "https://placehold.co/100x100.png",
    content: "Just completed my profile verification. Looking forward to meaningful connections! ✨",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    likes: 38,
    comments: 5,
    isLiked: false,
  },
  {
    id: "10",
    userId: "user10",
    userName: "James Wilson",
    userAvatar: "https://placehold.co/100x100.png",
    content: "New to the platform and excited to be part of this community. Hoping to find someone special! 🌟",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4 days ago
    likes: 29,
    comments: 8,
    isLiked: false,
  },
];

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userDisplayName, setUserDisplayName] = useState(mockUser.name);
  const [userAvatarUrl, setUserAvatarUrl] = useState(mockUser.avatarUrl);
  const [userAvatarHint, setUserAvatarHint] = useState(mockUser.dataAiHint);
  const [profileCompletion, setProfileCompletion] = useState(0);

  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const [quickSuggestions, setQuickSuggestions] = useState<QuickSuggestionProfile[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);

  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState<Post[]>(dummyPosts);

  const { toast } = useToast();
  const pathname = usePathname();

  const calculateProfileCompletion = (userData: any) => {
    if (!userData) return 0;
    let filledFields = 0;
    PROFILE_COMPLETION_FIELDS.forEach((field) => {
      if (field === "photoURL") {
        if (userData[field] && !userData[field].includes("placehold.co") && !userData[field].includes("default_avatar.png") /* Add other placeholder checks if any */) {
          filledFields++;
        }
      } else if (userData[field] && String(userData[field]).trim() !== "") {
        filledFields++;
      }
    });
    return Math.round((filledFields / PROFILE_COMPLETION_FIELDS.length) * 100);
  };

  useEffect(() => {
    console.log("Dashboard Auth: Setting up onAuthStateChanged listener.");
    setIsLoadingRequests(true);
    setIsLoadingSuggestions(true);
    setIsLoadingConnections(true);
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log("Dashboard Auth: Auth state changed. User:", user ? user.uid : "null");
      setCurrentUser(user);
      if (user) {
        setUserDisplayName(user.displayName || mockUser.name);

        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserAvatarUrl(userData.photoURL || user.photoURL || mockUser.avatarUrl);
            setUserAvatarHint(userData.dataAiHint || (userData.photoURL && !userData.photoURL.includes("placehold.co") ? "user avatar" : mockUser.dataAiHint));
            setProfileCompletion(calculateProfileCompletion(userData));
            console.log(`Dashboard Auth: User document for ${user.uid} found. Avatar: ${userData.photoURL}, Hint: ${userData.dataAiHint}, Completion: ${calculateProfileCompletion(userData)}%`);
          } else {
            setUserAvatarUrl(user.photoURL || mockUser.avatarUrl);
            setUserAvatarHint(user.photoURL && !user.photoURL.includes("placehold.co") ? "user avatar" : mockUser.dataAiHint);
            setProfileCompletion(calculateProfileCompletion({ displayName: user.displayName, photoURL: user.photoURL }));
            console.log(`Dashboard Auth: User document for ${user.uid} not found. Using auth data for display. Completion: ${calculateProfileCompletion({ displayName: user.displayName, photoURL: user.photoURL })}%`);
          }
        } catch (e) {
          console.error("Dashboard Auth: Error fetching user doc for avatar/hint/completion:", e);
          setUserAvatarUrl(user.photoURL || mockUser.avatarUrl);
          setUserAvatarHint(user.photoURL && !user.photoURL.includes("placehold.co") ? "user avatar" : mockUser.dataAiHint);
          setProfileCompletion(calculateProfileCompletion({ displayName: user.displayName, photoURL: user.photoURL }));
        }
      } else {
        setUserDisplayName(mockUser.name);
        setUserAvatarUrl(mockUser.avatarUrl);
        setUserAvatarHint(mockUser.dataAiHint);
        setQuickSuggestions([]);
        setMatchRequests([]);
        setConnections([]);
        setIsLoadingSuggestions(false);
        setIsLoadingRequests(false);
        setIsLoadingConnections(false);
        setProfileCompletion(0);
        console.log("Dashboard Auth: No user, cleared suggestions and requests, set loading to false.");
      }
    });
    return () => {
      console.log("Dashboard Auth: Unsubscribing from onAuthStateChanged listener.");
      unsubscribeAuth();
    };
  }, []);

  const fetchQuickSuggestions = useCallback(
    async (currentUserId: string) => {
      console.log("Dashboard Suggestions: Attempting to fetch. Current User ID:", currentUserId);
      if (!currentUserId) {
        console.log("Dashboard Suggestions: Fetch skipped, no currentUserId provided.");
        setIsLoadingSuggestions(false);
        setQuickSuggestions([]);
        return;
      }
      setIsLoadingSuggestions(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, limit(10));

        const querySnapshot = await getDocs(q);
        console.log("Dashboard Suggestions: Query snapshot received. Empty:", querySnapshot.empty, "Docs count:", querySnapshot.docs.length);

        const suggestions: QuickSuggestionProfile[] = [];
        querySnapshot.forEach((docSnap) => {
          if (docSnap.id === currentUserId) {
            console.log("Dashboard Suggestions: Skipping current user from suggestions, ID:", docSnap.id);
            return;
          }
          if (suggestions.length >= 3) return;

          const data = docSnap.data();
          console.log("Dashboard Suggestions: Processing suggestion for user ID:", docSnap.id, "Data snippet:", JSON.stringify(data).substring(0, 100) + "...");
          suggestions.push({
            id: docSnap.id,
            name: data.displayName || "User",
            age: calculateAge(data.dob),
            profession: data.profession || "Not specified",
            location: data.location || "Not specified",
            avatarUrl: data.photoURL || `https://placehold.co/300x400.png?text=${data.displayName ? data.displayName.substring(0, 1) : "S"}`,
            dataAiHint: data.dataAiHint || (data.photoURL && !data.photoURL.includes("placehold.co") ? "person professional" : "person placeholder"),
          });
        });
        console.log("Dashboard Suggestions: Mapped quick suggestions (before setting state):", JSON.parse(JSON.stringify(suggestions)));
        setQuickSuggestions(suggestions);
      } catch (error) {
        console.error("Dashboard Suggestions: Error fetching quick suggestions:", error);
        toast({ title: "Error", description: "Could not load quick suggestions.", variant: "destructive" });
        setQuickSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
        console.log("Dashboard Suggestions: Finished fetching. isLoadingSuggestions set to false.");
      }
    },
    [toast]
  );

  useEffect(() => {
    console.log("Dashboard Effect: Initializing data fetch based on currentUser.");
    if (!currentUser) {
      console.log("Dashboard Effect: No current user. Clearing requests and suggestions. Setting loading states to false.");
      setMatchRequests([]);
      setQuickSuggestions([]);
      setConnections([]);
      setIsLoadingRequests(false);
      setIsLoadingSuggestions(false);
      setIsLoadingConnections(false);
      return;
    }

    console.log(`Dashboard Effect: Current user available (UID: ${currentUser.uid}). Fetching suggestions and match requests.`);
    setIsLoadingRequests(true);
    setIsLoadingSuggestions(true);

    fetchQuickSuggestions(currentUser.uid);

    console.log(`Dashboard Requests: Setting up match requests listener for user UID: ${currentUser.uid}`);

    const requestsQuery = query(collection(db, "matchRequests"), where("receiverUid", "==", currentUser.uid), where("status", "==", "pending"), orderBy("createdAt", "asc"));

    const unsubscribeRequests = onSnapshot(
      requestsQuery,
      async (snapshot) => {
        console.log(`Dashboard Requests: Snapshot received. Empty: ${snapshot.empty}, Docs count: ${snapshot.docs.length}, HasPendingWrites: ${snapshot.metadata.hasPendingWrites}`);

        if (snapshot.metadata.hasPendingWrites) {
          console.log("Dashboard Requests: Snapshot has pending writes, waiting for server confirmation...");
        }

        if (snapshot.empty) {
          console.log("Dashboard Requests: No 'pending' matchRequests found for current user. Clearing requests list.");
          setMatchRequests([]);
          setIsLoadingRequests(false);
          return;
        }

        const requestsPromises = snapshot.docs.map(async (requestDoc) => {
          const data = requestDoc.data();
          console.log(`Dashboard Requests: Processing requestDoc ID: ${requestDoc.id}, Raw Data:`, JSON.parse(JSON.stringify(data)));

          const senderUid = data.senderUid;
          if (!senderUid) {
            console.error(`Dashboard Requests: CRITICAL - senderUid missing in requestDoc ${requestDoc.id}. Data:`, data, "Skipping this request.");
            return null;
          }

          if (!data.createdAt || !(data.createdAt instanceof Timestamp)) {
            console.warn(`Dashboard Requests: Invalid or missing 'createdAt' timestamp for request ${requestDoc.id}. Actual value:`, data.createdAt, "Skipping this request.");
            return null;
          }

          let senderName = "User";
          let senderAvatarUrl = "https://placehold.co/80x80.png";
          let senderDataAiHint = "person placeholder";
          let senderAge;
          let senderProfession;
          let senderLocation;

          try {
            console.log(`Dashboard Requests: Fetching sender profile for UID ${senderUid} (request ${requestDoc.id})`);
            const senderDocRef = doc(db, "users", senderUid);
            const senderSnap = await getDoc(senderDocRef);

            if (senderSnap.exists()) {
              const senderData = senderSnap.data();
              senderName = senderData.displayName || "User (Fetched)";
              senderAvatarUrl = senderData.photoURL || "https://placehold.co/80x80.png";
              senderDataAiHint = senderData.dataAiHint || (senderData.photoURL && !senderData.photoURL.includes("placehold.co") ? "person professional" : "person placeholder");
              senderAge = calculateAge(senderData.dob);
              senderProfession = senderData.profession;
              senderLocation = senderData.location;
              console.log(`Dashboard Requests: Successfully fetched sender ${senderName} (UID: ${senderUid}) for request ${requestDoc.id}. Age: ${senderAge}, Location: ${senderLocation}`);
            } else {
              console.warn(`Dashboard Requests: Sender profile for UID ${senderUid} not found (request ${requestDoc.id}). Using defaults.`);
            }
          } catch (fetchError) {
            console.error(`Dashboard Requests: Error fetching sender profile for UID ${senderUid} (request ${requestDoc.id}):`, fetchError);
          }

          return {
            id: requestDoc.id,
            senderUid: senderUid,
            senderName: senderName,
            senderAvatarUrl: senderAvatarUrl,
            senderDataAiHint: senderDataAiHint,
            senderAge: senderAge,
            senderProfession: senderProfession,
            senderLocation: senderLocation,
            timestamp: data.createdAt as Timestamp,
          } as MatchRequest;
        });

        try {
          let fetchedRequests = await Promise.all(requestsPromises);
          fetchedRequests = fetchedRequests.filter((req) => req !== null).reverse();
          console.log(`Dashboard Requests: Final processed requests (before setting state, count: ${fetchedRequests.length}):`, JSON.parse(JSON.stringify(fetchedRequests)));
          setMatchRequests(fetchedRequests as MatchRequest[]);
        } catch (processingError) {
          console.error("Dashboard Requests: Error processing request promises: ", processingError);
          setMatchRequests([]);
        } finally {
          setIsLoadingRequests(false);
          console.log("Dashboard Requests: Finished processing snapshot, isLoadingRequests set to false.");
        }
      },
      (error) => {
        console.error("Dashboard Requests: Error in onSnapshot for match requests: ", error);
        toast({ title: "Error Loading Requests", description: "Could not load match requests. " + error.message, variant: "destructive" });
        setMatchRequests([]);
        setIsLoadingRequests(false);
        console.log("Dashboard Requests: Error in onSnapshot, isLoadingRequests set to false.");
      }
    );

    return () => {
      console.log("Dashboard Effect: Unsubscribing from match requests listener.");
      unsubscribeRequests();
    };
  }, [currentUser, toast, fetchQuickSuggestions]);

  useEffect(() => {
    console.log("Dashboard Effect: Initializing data fetch based on currentUser.");
    if (!currentUser) {
      console.log("Dashboard Effect: No current user. Clearing requests and suggestions. Setting loading states to false.");
      setMatchRequests([]);
      setQuickSuggestions([]);
      setConnections([]);
      setIsLoadingRequests(false);
      setIsLoadingSuggestions(false);
      setIsLoadingConnections(false);
      return;
    }

    // Add connections listener
    console.log(`Dashboard Connections: Setting up connections listener for user UID: ${currentUser.uid}`);
    const connectionsQuery = query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid), orderBy("lastMessageTimestamp", "desc"));

    const unsubscribeConnections = onSnapshot(connectionsQuery, async (snapshot) => {
      console.log(`Dashboard Connections: Snapshot received. Empty: ${snapshot.empty}, Docs count: ${snapshot.docs.length}`);

      if (snapshot.empty) {
        setConnections([]);
        setIsLoadingConnections(false);
        return;
      }

      const connectionsPromises = snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
        const otherUserDetails = data.participantDetails[otherUserId];

        try {
          const userDocRef = doc(db, "users", otherUserId);
          const userSnap = await getDoc(userDocRef);
          const userData = userSnap.exists() ? userSnap.data() : null;

          return {
            id: chatDoc.id,
            userId: otherUserId,
            displayName: otherUserDetails?.displayName || "User",
            photoURL: otherUserDetails?.photoURL || "https://placehold.co/100x100.png",
            dataAiHint: otherUserDetails?.dataAiHint || "person placeholder",
            lastMessageText: data.lastMessageText,
            lastMessageTimestamp: data.lastMessageTimestamp,
            unreadCount: data.unreadBy?.[currentUser.uid] || 0,
            age: userData ? calculateAge(userData.dob) : undefined,
            profession: userData?.profession,
            location: userData?.location,
          } as Connection;
        } catch (error) {
          console.error(`Dashboard Connections: Error fetching user details for ${otherUserId}:`, error);
          return null;
        }
      });

      try {
        const fetchedConnections = await Promise.all(connectionsPromises);
        setConnections(fetchedConnections.filter((conn) => conn !== null) as Connection[]);
      } catch (error) {
        console.error("Dashboard Connections: Error processing connections:", error);
        setConnections([]);
      } finally {
        setIsLoadingConnections(false);
      }
    });

    return () => {
      unsubscribeConnections();
      // ... existing cleanup code ...
    };
  }, [currentUser, toast, fetchQuickSuggestions]);

  const createChatDocument = async (user1Uid: string, user2Uid: string) => {
    const user1DocRef = doc(db, "users", user1Uid);
    const user2DocRef = doc(db, "users", user2Uid);

    const [user1Snap, user2Snap] = await Promise.all([getDoc(user1DocRef), getDoc(user2DocRef)]);

    if (!user1Snap.exists() || !user2Snap.exists()) {
      const errorMsg = `One or both user profiles not found for chat creation. User1 (${user1Uid}) exists: ${user1Snap.exists()}, User2 (${user2Uid}) exists: ${user2Snap.exists()}`;
      console.error("Dashboard Chat: " + errorMsg);
      throw new Error(errorMsg);
    }
    const user1Data = user1Snap.data();
    const user2Data = user2Snap.data();

    const chatId = getCompositeId(user1Uid, user2Uid);
    const chatDocRef = doc(db, "chats", chatId);

    console.log(`Dashboard Chat: Creating/updating chat document for ${user1Uid} and ${user2Uid} with chatId ${chatId}`);

    const batch = writeBatch(db);
    batch.set(
      chatDocRef,
      {
        participants: [user1Uid, user2Uid].sort(),
        participantDetails: {
          [user1Uid]: {
            displayName: user1Data.displayName || "User",
            photoURL: user1Data.photoURL || "https://placehold.co/100x100.png",
            dataAiHint: user1Data.dataAiHint || (user1Data.photoURL && !user1Data.photoURL.includes("placehold.co") ? "person avatar" : "person placeholder"),
          },
          [user2Uid]: {
            displayName: user2Data.displayName || "User",
            photoURL: user2Data.photoURL || "https://placehold.co/100x100.png",
            dataAiHint: user2Data.dataAiHint || (user2Data.photoURL && !user2Data.photoURL.includes("placehold.co") ? "person avatar" : "person placeholder"),
          },
        },
        lastMessageText: "You are now connected!",
        lastMessageSenderId: null,
        lastMessageTimestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        unreadBy: { [user1Uid]: 0, [user2Uid]: 0 },
      },
      { merge: true }
    );

    await batch.commit();
    console.log(`Dashboard Chat: Chat document ${chatId} created/updated successfully.`);
    return chatId;
  };

  const handleAcceptRequest = async (request: MatchRequest) => {
    if (!currentUser) {
      console.error("Dashboard Accept: No current user, cannot accept request.");
      toast({ title: "Error", description: "You must be logged in to accept requests.", variant: "destructive" });
      return;
    }
    console.log(`Dashboard Accept: User ${currentUser.uid} accepting request ID: ${request.id}, from sender: ${request.senderUid}`);
    setProcessingRequestId(request.id);
    const requestDocRef = doc(db, "matchRequests", request.id);
    try {
      await updateDoc(requestDocRef, { status: "accepted", updatedAt: serverTimestamp() });
      await createChatDocument(currentUser.uid, request.senderUid);
      toast({ title: "Request Accepted!", description: `You are now matched with ${request.senderName}.` });
      console.log(`Dashboard Accept: Request ${request.id} accepted and chat created.`);
    } catch (error: any) {
      console.error("Dashboard Accept: Error accepting request:", error);
      toast({ title: "Error", description: "Failed to accept request: " + error.message, variant: "destructive" });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDeclineRequest = async (requestId: string, senderName: string = "User") => {
    if (!currentUser) {
      console.error("Dashboard Decline: No current user, cannot decline request.");
      toast({ title: "Error", description: "You must be logged in to decline requests.", variant: "destructive" });
      return;
    }
    console.log(`Dashboard Decline: User ${currentUser.uid} declining request ID: ${requestId}`);
    setProcessingRequestId(requestId);
    const requestDocRef = doc(db, "matchRequests", requestId);
    try {
      await updateDoc(requestDocRef, { status: "declined_by_receiver", updatedAt: serverTimestamp() });
      toast({ title: "Request Declined", description: `You have declined the request from ${senderName}.` });
      console.log(`Dashboard Decline: Request ${requestId} declined.`);
    } catch (error: any) {
      console.error("Dashboard Decline: Error declining request:", error);
      toast({ title: "Error", description: "Failed to decline request: " + error.message, variant: "destructive" });
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !currentUser) return;

    const post: Post = {
      id: Date.now().toString(),
      userId: currentUser.uid,
      userName: userDisplayName,
      userAvatar: userAvatarUrl,
      content: newPost.trim(),
      timestamp: new Date(),
      likes: 0,
      comments: 0,
      isLiked: false,
    };

    setPosts([post, ...posts]);
    setNewPost("");
    toast({
      title: "Posted successfully!",
      description: "Your update has been shared with your connections.",
    });
  };

  const handleLikePost = (postId: string) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            isLiked: !post.isLiked,
          };
        }
        return post;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3 space-y-4">
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CalendarCheck className="h-4 w-4" /> Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {dashboardQuickLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Button key={link.label} variant={isActive ? "default" : "ghost"} asChild className={cn("w-full justify-start px-3 py-2 text-sm h-auto", isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-foreground/70 hover:text-primary hover:bg-accent/50")}>
                      <Link href={link.href} aria-label={link.label}>
                        {React.cloneElement(link.icon, {
                          className: cn("mr-3 h-4 w-4", isActive ? "text-primary-foreground/90" : "text-muted-foreground group-hover:text-primary"),
                        })}
                        {link.label}
                      </Link>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <FileText className="h-5 w-5" /> Profile Completion
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Progress value={profileCompletion} className="h-2 bg-[#f0f2f5]" />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-600">{profileCompletion}% Complete</p>
                  {profileCompletion < 100 && (
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <Link href="/dashboard/edit-profile">Complete Now</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Suggested Matches
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {isLoadingSuggestions ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-2 bg-[#f0f2f5] rounded-lg">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                          <Skeleton className="h-7 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : quickSuggestions.length > 0 ? (
                  <div className="space-y-2">
                    {quickSuggestions.map((profile) => (
                      <div key={profile.id} className="p-2 bg-[#f0f2f5] rounded-lg hover:bg-[#e4e6e9] transition-colors">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-12 w-12 ring-1 ring-primary/10">
                            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                            <AvatarFallback>{profile.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <Link href={`/profile/${profile.id}`} className="font-medium text-sm hover:underline block">
                              {profile.name}
                              {profile.age && <span className="text-muted-foreground font-normal">, {profile.age}</span>}
                            </Link>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {profile.profession && (
                                <p className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  <span className="truncate">{profile.profession}</span>
                                </p>
                              )}
                              {profile.location && (
                                <p className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">{profile.location}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          <Button size="sm" className="h-7" asChild>
                            <Link href={`/profile/${profile.id}`}>
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-sm text-muted-foreground">No suggestions available at the moment.</p>
                    <Button size="sm" asChild>
                      <Link href="/discover">Find Matches</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
              {!isLoadingSuggestions && quickSuggestions.length > 0 && (
                <CardFooter className="p-3 pt-0">
                  <Button variant="link" size="sm" className="w-full h-8" asChild>
                    <Link href="/suggestions">See More Suggestions</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>

          <div className="col-span-6 space-y-4">
            <Card className="bg-white border-none shadow-sm sticky top-4 z-10">
              <CardContent className="p-4">
                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                      <AvatarFallback>{userDisplayName.substring(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Input placeholder={`What's on your mind, ${userDisplayName}?`} className="bg-[#f0f2f5] border-none focus-visible:ring-0" value={newPost} onChange={(e) => setNewPost(e.target.value)} />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={!newPost.trim()} className="bg-primary hover:bg-primary/90">
                      Post
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="bg-white border-none shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.userAvatar} alt={post.userName} />
                        <AvatarFallback>{post.userName.substring(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/profile/${post.userId}`} className="font-semibold hover:underline">
                          {post.userName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(post.timestamp, { addSuffix: true })}</p>
                      </div>
                    </div>
                    <p className="text-[15px] mb-4 whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Button variant="ghost" size="sm" className={`gap-1.5 ${post.isLiked ? "text-primary" : ""}`} onClick={() => handleLikePost(post.id)}>
                        <Heart className={`h-4 w-4 ${post.isLiked ? "fill-primary" : ""}`} />
                        {post.likes} {post.likes === 1 ? "Like" : "Likes"}
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5">
                        <MessageCircle className="h-4 w-4" />
                        {post.comments} {post.comments === 1 ? "Comment" : "Comments"}
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5">
                        <Share2 className="h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="col-span-3 space-y-4">
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" /> Your Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoadingConnections ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-3 bg-[#f0f2f5] rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Skeleton className="h-14 w-14 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-28" />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : connections.length > 0 ? (
                  <div className="space-y-3">
                    {connections.map((connection) => (
                      <div key={connection.id} className="p-3 bg-[#f0f2f5] rounded-lg hover:bg-[#e4e6e9] transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <Avatar className="h-14 w-14">
                              <AvatarImage src={connection.photoURL} alt={connection.displayName} />
                              <AvatarFallback>{connection.displayName.substring(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {connection.unreadCount > 0 && (
                              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs">
                                {connection.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/profile/${connection.userId}`} className="font-semibold text-[15px] hover:underline block mb-1">
                              {connection.displayName}
                            </Link>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {connection.age && (
                                <p className="flex items-center gap-1.5">
                                  <Cake className="h-4 w-4" />
                                  <span>{connection.age} years old</span>
                                </p>
                              )}
                              {connection.profession && (
                                <p className="flex items-center gap-1.5">
                                  <Briefcase className="h-4 w-4" />
                                  <span className="truncate">{connection.profession}</span>
                                </p>
                              )}
                              {connection.location && (
                                <p className="flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4" />
                                  <span className="truncate">{connection.location}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end border-t pt-3 mt-2">
                          <Button size="sm" className="h-8" asChild>
                            <Link href={`/messages/${connection.id}`}>
                              <MessageCircle className="h-4 w-4 mr-1" /> Chat
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="h-8" asChild>
                            <Link href={`/profile/${connection.userId}`}>
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-muted-foreground">You haven't connected with anyone yet.</p>
                    <Button asChild>
                      <Link href="/discover">Find Matches</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
              {connections.length > 0 && (
                <CardFooter className="p-4 pt-0">
                  <Button variant="link" className="w-full" asChild>
                    <Link href="/messages">View All Messages</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary/80" /> Match Requests
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">People who want to connect with you</CardDescription>
              </CardHeader>
              <CardContent className="">
                {isLoadingRequests ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : matchRequests.length > 0 ? (
                  <div className="space-y-2">
                    {matchRequests.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-2 hover:bg-[#f0f2f5] rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={req.senderAvatarUrl} alt={req.senderName} />
                            <AvatarFallback>{req.senderName.substring(0, 1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-[15px]">{req.senderName}</p>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              {req.senderAge && (
                                <p className="flex items-center">
                                  <Cake className="mr-1.5 h-3 w-3" /> {req.senderAge} years
                                </p>
                              )}
                              {req.senderProfession && (
                                <p className="flex items-center">
                                  <Briefcase className="mr-1.5 h-3 w-3" /> {req.senderProfession}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Button onClick={() => handleAcceptRequest(req)} size="sm" className="h-8 bg-primary hover:bg-primary/90" disabled={processingRequestId === req.id}>
                            {processingRequestId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button onClick={() => handleDeclineRequest(req.id, req.senderName)} variant="ghost" size="sm" className="h-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" disabled={processingRequestId === req.id}>
                            {processingRequestId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No pending match requests</p>
                    <Button variant="link" className="mt-2" asChild>
                      <Link href="/discover">Find Matches</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5" /> Today's Horoscope
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{mockTodaysHoroscope.sign}</span>
                    <Badge variant="outline">{mockTodaysHoroscope.luckyNumber}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{mockTodaysHoroscope.summary}</p>
                  <div className="text-xs space-y-1">
                    <p className="flex items-center text-muted-foreground">
                      <span className="font-medium mr-2">Lucky Color:</span> {mockTodaysHoroscope.luckyColor}
                    </p>
                  </div>
                  <Button variant="link" className="w-full p-0 h-auto" asChild>
                    <Link href="/dashboard/horoscope">View Full Horoscope</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
