"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { UserCircle, Settings, Star, Search, MessageCircle, CreditCard, Sparkles, Users, UserPlus, CalendarCheck, Briefcase, MapPin, Cake, Loader2, Check, X, Eye, FileText, Heart, Edit3, Zap, Rocket, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import React, { useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, writeBatch, serverTimestamp, Timestamp, orderBy, limit, getDocs, addDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { calculateAge, getCompositeId } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

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
  timestamp: any; // Firestore Timestamp
  likes: number;
  likedBy: string[]; // Array of user IDs who liked the post
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

const dashboardNavLinks = [
  { href: "/dashboard/edit-profile", label: "Edit Profile", icon: <UserCircle className="mr-3 h-5 w-5" /> },
  { href: "/dashboard/preferences", label: "Preferences", icon: <Settings className="mr-3 h-5 w-5" /> },
  { href: "/dashboard/horoscope", label: "Horoscope", icon: <Sparkles className="mr-3 h-5 w-5" /> },
  { href: "/pricing", label: "Subscription", icon: <CreditCard className="mr-3 h-5 w-5" /> },
];

const dummyPosts: Post[] = [
  {
    id: "1",
    userId: "user1",
    userName: "Sarah Johnson",
    userAvatar: "https://placehold.co/400x400.png",
    content: "Just completed my profile! Looking forward to meeting new people.",
    timestamp: new Date(),
    likes: 12,
    comments: 3,
    isLiked: false,
    likedBy: [],
  },
  {
    id: "2",
    userId: "user2",
    userName: "Michael Chen",
    userAvatar: "https://placehold.co/400x400.png",
    content: "Beautiful day for a coffee date! ☕️",
    timestamp: new Date(Date.now() - 3600000),
    likes: 8,
    comments: 2,
    isLiked: true,
    likedBy: ["currentUserId"],
  },
  {
    id: "3",
    userId: "user3",
    userName: "Priya Patel",
    userAvatar: "https://placehold.co/400x400.png",
    content: "Excited to be part of this community! 💕",
    timestamp: new Date(Date.now() - 7200000),
    likes: 15,
    comments: 4,
    isLiked: false,
    likedBy: [],
  },
  {
    id: "4",
    userId: "user4",
    userName: "David Kim",
    userAvatar: "https://placehold.co/400x400.png",
    content: "Just moved to the city and looking to make new connections!",
    timestamp: new Date(Date.now() - 10800000),
    likes: 6,
    comments: 1,
    isLiked: false,
    likedBy: [],
  },
  {
    id: "5",
    userId: "user5",
    userName: "Emma Wilson",
    userAvatar: "https://placehold.co/400x400.png",
    content: "Weekend plans: Exploring the city and meeting new people!",
    timestamp: new Date(Date.now() - 14400000),
    likes: 20,
    comments: 5,
    isLiked: true,
    likedBy: ["currentUserId"],
  },
  {
    id: "6",
    userId: "user6",
    userName: "James Anderson",
    userAvatar: "https://placehold.co/400x400.png",
    content: "Love the new features on the platform!",
    timestamp: new Date(Date.now() - 18000000),
    likes: 9,
    comments: 2,
    isLiked: false,
    likedBy: [],
  },
  {
    id: "7",
    userId: "user7",
    userName: "Sophia Lee",
    userAvatar: "https://placehold.co/400x400.png",
    content: "Just had an amazing first date! 💫",
    timestamp: new Date(Date.now() - 21600000),
    likes: 25,
    comments: 7,
    isLiked: false,
    likedBy: [],
  },
  {
    id: "8",
    userId: "user8",
    userName: "Alex Martinez",
    userAvatar: "https://placehold.co/400x400.png",
    content: "Looking forward to the weekend events!",
    timestamp: new Date(Date.now() - 25200000),
    likes: 11,
    comments: 3,
    isLiked: true,
    likedBy: ["currentUserId"],
  },
  {
    id: "9",
    userId: "user9",
    userName: "Olivia Brown",
    userAvatar: "https://placehold.co/400x400.png",
    content: "New profile picture! What do you think?",
    timestamp: new Date(Date.now() - 28800000),
    likes: 18,
    comments: 4,
    isLiked: false,
    likedBy: [],
  },
  {
    id: "10",
    userId: "user10",
    userName: "Daniel Taylor",
    userAvatar: "https://placehold.co/400x400.png",
    content: "Just joined the platform and already loving it!",
    timestamp: new Date(Date.now() - 32400000),
    likes: 7,
    comments: 2,
    isLiked: false,
    likedBy: [],
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

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

  useEffect(() => {
    if (!currentUser) return;

    const postsQuery = query(
      collection(db, "posts"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          isLiked: data.likedBy?.includes(currentUser.uid) || false,
        } as Post;
      });
      setPosts(postsData);
      setIsLoadingPosts(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

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

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !currentUser) return;

    try {
      const postData = {
        userId: currentUser.uid,
        userName: userDisplayName,
        userAvatar: userAvatarUrl,
        content: newPost.trim(),
        timestamp: serverTimestamp(),
        likes: 0,
        likedBy: [],
        comments: 0,
      };

      await addDoc(collection(db, "posts"), postData);
      setNewPost("");
      toast({
        title: "Posted successfully!",
        description: "Your update has been shared with your connections.",
      });
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error("Post not found");
      }

      const postData = postDoc.data();
      const likedBy = postData.likedBy || [];
      const isLiked = likedBy.includes(currentUser.uid);

      await updateDoc(postRef, {
        likes: isLiked ? postData.likes - 1 : postData.likes + 1,
        likedBy: isLiked 
          ? arrayRemove(currentUser.uid)
          : arrayUnion(currentUser.uid)
      });

      // Update local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: isLiked ? post.likes - 1 : post.likes + 1,
            isLiked: !isLiked,
          };
        }
        return post;
      }));
    } catch (error: any) {
      console.error("Error liking post:", error);
      toast({
        title: "Error",
        description: "Failed to update like: " + error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-12 gap-4 max-w-[1400px] mx-auto">
          {/* Left Sidebar - 3 columns */}
          <div className="col-span-3 space-y-4">
            {/* Quick Links Card */}
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CalendarCheck className="h-4 w-4" /> Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {dashboardNavLinks.map((link) => {
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

            {/* Profile Completion Card */}
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

            {/* AI Suggestions Card */}
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" /> AI Suggestions
                </CardTitle>
                <CardDescription className="text-sm">Personalized matches based on your profile</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {isLoadingSuggestions ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : quickSuggestions.length > 0 ? (
                  <div className="space-y-3">
                    {quickSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={suggestion.avatarUrl} alt={suggestion.name} data-ai-hint={suggestion.dataAiHint} />
                          <AvatarFallback>{suggestion.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${suggestion.id}`} className="font-medium text-sm hover:underline block">
                            {suggestion.name}
                          </Link>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {suggestion.age && (
                              <p className="flex items-center">
                                <Cake className="mr-1.5 h-3 w-3" /> {suggestion.age} years
                              </p>
                            )}
                            {suggestion.profession && (
                              <p className="flex items-center">
                                <Briefcase className="mr-1.5 h-3 w-3" /> {suggestion.profession}
                              </p>
                            )}
                            {suggestion.location && (
                              <p className="flex items-center">
                                <MapPin className="mr-1.5 h-3 w-3" /> {suggestion.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                          <Link href={`/profile/${suggestion.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No suggestions available</p>
                    <Button variant="link" size="sm" className="mt-2" asChild>
                      <Link href="/discover">Find Matches</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button variant="link" className="w-full text-sm" asChild>
                  <Link href="/discover">View More Suggestions</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Success Story Card */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-2xl text-pink-500">
                  <Heart className="h-6 w-6 fill-pink-500 text-pink-500" />
                  Success Story
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-56 mb-3 rounded-md overflow-hidden">
                  <Image src="https://placehold.co/600x400.png" alt="Riya & Rohan" fill className="object-cover" data-ai-hint="happy couple wedding" />
                </div>
                <h3 className="font-semibold text-xl text-foreground">Riya & Rohan Found Love!</h3>
                <p className="text-sm text-muted-foreground mt-1">"We connected on CupidMatch and instantly knew there was something special. Thank you for helping us find our happily ever after!"</p>
              </CardContent>
              <CardFooter>
                <Button variant="link" className="text-primary p-0 h-auto" asChild>
                  <Link href="/success-stories">Read More Stories</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Timeline - 6 columns, centered */}
          <div className="col-span-6 space-y-4">
            {/* Post Creation Card */}
            <Card className="bg-white border-none shadow-sm">
              <CardContent className="p-4">
                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                      <AvatarFallback>{userDisplayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="What's on your mind?"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        className="min-h-[50px] resize-none border-none bg-accent/50 focus-visible:ring-1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={!newPost.trim()}>
                      Post
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            {isLoadingPosts ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-white border-none shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="bg-white border-none shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.userAvatar} alt={post.userName} />
                          <AvatarFallback>{post.userName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{post.userName}</p>
                          <p className="text-sm text-muted-foreground">
                            {post.timestamp?.toDate().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="mb-2">{post.content}</p>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "flex items-center gap-2",
                            post.isLiked && "text-primary"
                          )}
                          onClick={() => handleLikePost(post.id)}
                        >
                          <Heart
                            className={cn(
                              "h-5 w-5",
                              post.isLiked && "fill-primary text-primary"
                            )}
                          />
                          <span>{post.likes}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          <span>{post.comments}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white border-none shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - 3 columns */}
          <div className="col-span-3 space-y-4">
            {/* Connections Card */}
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

            {/* Match Requests Card */}
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary/80" /> Match Requests
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">People who want to connect with you</CardDescription>
              </CardHeader>
              <CardContent>
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

            {/* Horoscope Card */}
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
