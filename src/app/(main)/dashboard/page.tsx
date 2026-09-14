"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { UserCircle, Settings, Star, Search, MessageCircle, CreditCard, Sparkles, Users, UserPlus, CalendarCheck, Briefcase, MapPin, Cake, Loader2, Check, X, Eye, FileText, Heart, Edit3, Zap, Rocket, Share2, Compass, BellRing, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Timestamp;
  isRead?: boolean;
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
  commentList?: Comment[]; // Array of comments
  lastCommentedAt?: Timestamp; // Track when the post was last commented on
  lastLikedAt?: Timestamp; // Track last like activity
  isLiked?: boolean;
  isCommenting?: boolean; // New field to track if comment form is open
  commentNotifications?: {
    [userId: string]: {
      count: number;
      lastSeen: Timestamp;
    }
  };
  unreadComments?: number;
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
  { href: "/suggestions", label: "My Matches", icon: <Heart className="mr-3 h-5 w-5" /> },
  { href: "/messages", label: "Connections", icon: <Users className="mr-3 h-5 w-5" /> },
  { href: "/search", label: "Search", icon: <Search className="mr-3 h-5 w-5" /> },
  { href: "/discover", label: "Discovery", icon: <Compass className="mr-3 h-5 w-5" /> },
  { href: "/dashboard/biodata", label: "My Biodata", icon: <FileText className="mr-3 h-5 w-5" /> },
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

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadLikeCount, setUnreadLikeCount] = useState(0);
  const [unreadCommentCount, setUnreadCommentCount] = useState(0);
  const [lastSeenLikeNotificationsTimestamp, setLastSeenLikeNotificationsTimestamp] = useState<Timestamp | null>(null);
  const [lastSeenCommentNotificationsTimestamp, setLastSeenCommentNotificationsTimestamp] = useState<Timestamp | null>(null);

  const [commentText, setCommentText] = useState<{ [key: string]: string }>({}); // Track comment text for each post
  const commentEndRef = useRef<HTMLDivElement>(null);

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
            setLastSeenLikeNotificationsTimestamp(userData.lastSeenLikeNotificationsTimestamp || null);
            setLastSeenCommentNotificationsTimestamp(userData.lastSeenCommentNotificationsTimestamp || null);
            console.log(`Dashboard Auth: User document for ${user.uid} found. Avatar: ${userData.photoURL}, Hint: ${userData.dataAiHint}, Completion: ${calculateProfileCompletion(userData)}%, Last Seen Likes: ${userData.lastSeenLikeNotificationsTimestamp ? userData.lastSeenLikeNotificationsTimestamp.toDate() : 'N/A'}, Last Seen Comments: ${userData.lastSeenCommentNotificationsTimestamp ? userData.lastSeenCommentNotificationsTimestamp.toDate() : 'N/A'}`);
          } else {
            setUserAvatarUrl(user.photoURL || mockUser.avatarUrl);
            setUserAvatarHint(user.photoURL && !user.photoURL.includes("placehold.co") ? "user avatar" : mockUser.dataAiHint);
            setProfileCompletion(calculateProfileCompletion({ displayName: user.displayName, photoURL: user.photoURL }));
            setLastSeenLikeNotificationsTimestamp(null);
            setLastSeenCommentNotificationsTimestamp(null);
            console.log(`Dashboard Auth: User document for ${user.uid} not found. Using auth data for display. Completion: ${calculateProfileCompletion({ displayName: user.displayName, photoURL: user.photoURL })}%`);
          }
        } catch (e) {
          console.error("Dashboard Auth: Error fetching user doc for avatar/hint/completion/lastSeenLikes:", e);
          setUserAvatarUrl(user.photoURL || mockUser.avatarUrl);
          setUserAvatarHint(user.photoURL && !user.photoURL.includes("placehold.co") ? "user avatar" : mockUser.dataAiHint);
          setProfileCompletion(calculateProfileCompletion({ displayName: user.displayName, photoURL: user.photoURL }));
          setLastSeenLikeNotificationsTimestamp(null);
          setLastSeenCommentNotificationsTimestamp(null);
        }
      } else {
        setLastSeenLikeNotificationsTimestamp(null);
        setLastSeenCommentNotificationsTimestamp(null);
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
  }, [toast]);

  const mapUserDocToSuggestion = (userId: string, data: Record<string, any>): QuickSuggestionProfile => ({
    id: userId,
    name: data.displayName || "User",
    age: calculateAge(data.dob),
    profession: data.profession || "Not specified",
    location: data.location || "Not specified",
    avatarUrl: data.photoURL || `https://placehold.co/300x400.png?text=${data.displayName ? data.displayName.substring(0, 1) : "S"}`,
    dataAiHint: data.dataAiHint || (data.photoURL && !data.photoURL.includes("placehold.co") ? "person professional" : "person placeholder"),
  });

  const fetchSuggestionsFromPosts = async (currentUserId: string): Promise<QuickSuggestionProfile[]> => {
    const postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(30));
    const postsSnapshot = await getDocs(postsQuery);
    const suggestions: QuickSuggestionProfile[] = [];
    const seenUserIds = new Set<string>();

    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      const authorId = postData.userId as string | undefined;
      if (!authorId || authorId === currentUserId || seenUserIds.has(authorId)) continue;
      seenUserIds.add(authorId);

      try {
        const userSnap = await getDoc(doc(db, "users", authorId));
        if (userSnap.exists()) {
          suggestions.push(mapUserDocToSuggestion(authorId, userSnap.data()));
        } else {
          suggestions.push({
            id: authorId,
            name: postData.userName || "User",
            profession: "Not specified",
            location: "Not specified",
            avatarUrl: postData.userAvatar || `https://placehold.co/300x400.png?text=${postData.userName ? String(postData.userName).substring(0, 1) : "S"}`,
            dataAiHint: "person placeholder",
          });
        }
      } catch {
        suggestions.push({
          id: authorId,
          name: postData.userName || "User",
          profession: "Not specified",
          location: "Not specified",
          avatarUrl: postData.userAvatar || `https://placehold.co/300x400.png?text=${postData.userName ? String(postData.userName).substring(0, 1) : "S"}`,
          dataAiHint: "person placeholder",
        });
      }

      if (suggestions.length >= 3) break;
    }

    return suggestions;
  };

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
        let suggestions: QuickSuggestionProfile[] = [];

        try {
          // Prefer listing profiles (same pattern as Discover). This fails if Firestore
          // rules deny collection list on `users` — fall back to post authors below.
          const usersQuery = query(collection(db, "users"), orderBy("displayName"), limit(10));
          const querySnapshot = await getDocs(usersQuery);
          console.log("Dashboard Suggestions: Query snapshot received. Empty:", querySnapshot.empty, "Docs count:", querySnapshot.docs.length);

          for (const docSnap of querySnapshot.docs) {
            if (docSnap.id === currentUserId) continue;
            suggestions.push(mapUserDocToSuggestion(docSnap.id, docSnap.data()));
            if (suggestions.length >= 3) break;
          }
        } catch (listError) {
          console.warn("Dashboard Suggestions: users list query failed, falling back to post authors:", listError);
          suggestions = await fetchSuggestionsFromPosts(currentUserId);
        }

        console.log("Dashboard Suggestions: Mapped quick suggestions (before setting state):", JSON.parse(JSON.stringify(suggestions)));
        setQuickSuggestions(suggestions);
      } catch (error) {
        console.error("Dashboard Suggestions: Error fetching quick suggestions:", error);
        if ((error as { code?: string })?.code !== "permission-denied") {
          toast({ title: "Error", description: "Could not load quick suggestions.", variant: "destructive" });
        }
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
        // Permission errors mean Firestore rules need updating in Firebase Console — avoid noisy toasts.
        if ((error as { code?: string })?.code !== "permission-denied") {
          toast({ title: "Error Loading Requests", description: "Could not load match requests. " + error.message, variant: "destructive" });
        }
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

    const unsubscribeConnections = onSnapshot(
      connectionsQuery,
      async (snapshot) => {
      console.log(`Dashboard Connections: Snapshot received. Empty: ${snapshot.empty}, Docs count: ${snapshot.docs.length}`);

      if (snapshot.empty) {
        setConnections([]);
        setUnreadMessageCount(0);
        setIsLoadingConnections(false);
        return;
      }

      let totalUnread = 0;
      const connectionsPromises = snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
        const otherUserDetails = data.participantDetails[otherUserId];

        const unread = data.unreadBy?.[currentUser.uid] || 0;
        totalUnread += unread;

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
            unreadCount: unread,
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
        setUnreadMessageCount(totalUnread);
      } catch (error) {
        console.error("Dashboard Connections: Error processing connections:", error);
        setConnections([]);
        setUnreadMessageCount(0);
      } finally {
        setIsLoadingConnections(false);
      }
    },
      (error) => {
        console.error("Dashboard Connections: Error in onSnapshot:", error);
        setConnections([]);
        setUnreadMessageCount(0);
        setIsLoadingConnections(false);
      }
    );

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

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const postsData = snapshot.docs.map(doc => {
          const data = doc.data();
          const commentNotifications = data.commentNotifications?.[currentUser.uid] || { count: 0, lastSeen: null };
          
          return {
            id: doc.id,
            ...data,
            isLiked: data.likedBy?.includes(currentUser.uid) || false,
            unreadComments: commentNotifications.count || 0
          } as Post;
        });
        setPosts(postsData);
        setIsLoadingPosts(false);

        // Update total unread comment count
        const totalUnreadComments = postsData.reduce((total, post) => total + (post.unreadComments || 0), 0);
        setUnreadCommentCount(totalUnreadComments);
      },
      (error) => {
        console.error("Dashboard Posts: Error in onSnapshot:", error);
        setPosts([]);
        setIsLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !lastSeenLikeNotificationsTimestamp) {
      setUnreadLikeCount(0);
      return;
    }

    const userPostsQuery = query(
      collection(db, "posts"),
      where("userId", "==", currentUser.uid),
      where("lastLikedAt", ">", lastSeenLikeNotificationsTimestamp)
    );

    const unsubscribeLikes = onSnapshot(
      userPostsQuery,
      (snapshot) => {
        setUnreadLikeCount(snapshot.docs.length);
        console.log(`Unread likes count: ${snapshot.docs.length}`);
      },
      (error) => {
        console.error("Dashboard Likes: Error in onSnapshot:", error);
        setUnreadLikeCount(0);
      }
    );

    return () => unsubscribeLikes();
  }, [currentUser, lastSeenLikeNotificationsTimestamp]);

  useEffect(() => {
    if (!currentUser || !lastSeenCommentNotificationsTimestamp) {
      setUnreadCommentCount(0);
      return;
    }

    const userPostsQuery = query(
      collection(db, "posts"),
      where("userId", "==", currentUser.uid),
      where("lastCommentedAt", ">", lastSeenCommentNotificationsTimestamp)
    );

    const unsubscribeComments = onSnapshot(
      userPostsQuery,
      (snapshot) => {
        setUnreadCommentCount(snapshot.docs.length);
        console.log(`Unread comments count: ${snapshot.docs.length}`);
      },
      (error) => {
        console.error("Dashboard Comments: Error in onSnapshot:", error);
        setUnreadCommentCount(0);
      }
    );

    return () => unsubscribeComments();
  }, [currentUser, lastSeenCommentNotificationsTimestamp]);

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
    if (!currentUser) {
      console.error("Error liking post: No current user.");
      toast({ title: "Error", description: "You must be logged in to like posts.", variant: "destructive" });
      return;
    }

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
          : arrayUnion(currentUser.uid),
        lastLikedAt: serverTimestamp(),
      });

      // Update local state
      setPosts(posts.map((post: Post) => {
        if (post.id === postId) {
          return {
            ...post,
            likes: isLiked ? post.likes - 1 : post.likes + 1,
            isLiked: !isLiked,
            lastLikedAt: new Timestamp(Math.floor(Date.now() / 1000), 0),
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

  const markLikesAsRead = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        lastSeenLikeNotificationsTimestamp: serverTimestamp(),
      });
      setUnreadLikeCount(0); // Optimistically update UI
      toast({
        title: "Notifications Cleared",
        description: "All new likes have been marked as read.",
      });
    } catch (error: any) {
      console.error("Error marking likes as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark likes as read: " + error.message,
        variant: "destructive",
      });
    }
  };

  const markCommentsAsRead = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        lastSeenCommentNotificationsTimestamp: serverTimestamp(),
      });
      setUnreadCommentCount(0); // Optimistically update UI
      toast({
        title: "Notifications Cleared",
        description: "All new comments have been marked as read.",
      });
    } catch (error: any) {
      console.error("Error marking comments as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark comments as read: " + error.message,
        variant: "destructive",
      });
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const updateData: any = {};
      
      if (unreadLikeCount > 0) {
        updateData.lastSeenLikeNotificationsTimestamp = serverTimestamp();
      }
      if (unreadCommentCount > 0) {
        updateData.lastSeenCommentNotificationsTimestamp = serverTimestamp();
      }

      if (Object.keys(updateData).length > 0) {
        await updateDoc(userRef, updateData);
        setUnreadLikeCount(0);
        setUnreadCommentCount(0);
        toast({
          title: "Notifications Cleared",
          description: "All notifications have been marked as read.",
        });
      }
    } catch (error: any) {
      console.error("Error marking notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleCommentSubmit = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !commentText[postId]?.trim()) return;

    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error("Post not found");
      }

      const postData = postDoc.data();
      const postOwnerId = postData.userId;

      // Don't notify if user is commenting on their own post
      if (postOwnerId !== currentUser.uid) {
        // Update the post owner's notification count
        const userRef = doc(db, "users", postOwnerId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentNotifications = userData.commentNotifications || {};
          const postNotifications = currentNotifications[postId] || { count: 0, lastSeen: null };
          
          await updateDoc(userRef, {
            [`commentNotifications.${postId}.count`]: (postNotifications.count || 0) + 1,
            [`commentNotifications.${postId}.lastSeen`]: postNotifications.lastSeen || null,
            lastSeenCommentNotificationsTimestamp: userData.lastSeenCommentNotificationsTimestamp || null
          });
        }
      }

      const newComment: Comment = {
        id: crypto.randomUUID(),
        userId: currentUser.uid,
        userName: userDisplayName,
        userAvatar: userAvatarUrl,
        content: commentText[postId].trim(),
        timestamp: Timestamp.now(),
        isRead: postOwnerId === currentUser.uid // Mark as read if it's the owner's comment
      };

      // Update the post document with the new comment
      await updateDoc(postRef, {
        comments: (postData.comments || 0) + 1,
        lastCommentedAt: serverTimestamp(),
        commentList: arrayUnion(newComment),
        [`commentNotifications.${postOwnerId}.count`]: postOwnerId === currentUser.uid ? 0 : (postData.commentNotifications?.[postOwnerId]?.count || 0) + 1,
        [`commentNotifications.${postOwnerId}.lastSeen`]: postData.commentNotifications?.[postOwnerId]?.lastSeen || null
      });

      // Clear the comment input and close the form
      setCommentText(prev => ({ ...prev, [postId]: "" }));
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, isCommenting: false } : post
      ));

      // Show success toast
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully.",
      });

      // If the post owner is the current user, mark the notification as read
      if (postOwnerId === currentUser.uid) {
        await updateDoc(postRef, {
          [`commentNotifications.${currentUser.uid}.count`]: 0,
          [`commentNotifications.${currentUser.uid}.lastSeen`]: serverTimestamp()
        });
      }

    } catch (error: any) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post comment: " + error.message,
        variant: "destructive",
      });
    }
  };

  const toggleCommentForm = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, isCommenting: !post.isCommenting } : post
    ));
    // Clear any existing comment text when toggling
    setCommentText(prev => ({ ...prev, [postId]: "" }));
  };

  // Scroll to bottom of comments when new comment is added
  const scrollToBottom = () => {
    commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [posts]);

  // Add a function to mark comments as read for a specific post
  const markPostCommentsAsRead = async (postId: string) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, "posts", postId);
      const userRef = doc(db, "users", currentUser.uid);

      // Update both post and user documents
      await updateDoc(postRef, {
        [`commentNotifications.${currentUser.uid}.count`]: 0,
        [`commentNotifications.${currentUser.uid}.lastSeen`]: serverTimestamp()
      });

      await updateDoc(userRef, {
        [`commentNotifications.${postId}.count`]: 0,
        [`commentNotifications.${postId}.lastSeen`]: serverTimestamp()
      });

      // Update local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, unreadComments: 0 }
          : post
      ));

      // Update total unread count
      const newTotalUnread = posts.reduce((total, post) => 
        total + (post.id === postId ? 0 : (post.unreadComments || 0)), 0
      );
      setUnreadCommentCount(newTotalUnread);

    } catch (error: any) {
      console.error("Error marking comments as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark comments as read: " + error.message,
        variant: "destructive",
      });
    }
  };

  const firstName = userDisplayName?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const totalUnread = unreadMessageCount + unreadLikeCount + unreadCommentCount;

  return (
    <div className="min-h-screen bg-background px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-background to-secondary/10 p-5 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-background shadow-md md:h-20 md:w-20">
                <AvatarImage src={userAvatarUrl} alt={userDisplayName} data-ai-hint={userAvatarHint} />
                <AvatarFallback className="text-xl">{firstName.substring(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">{greeting}</p>
                <h1 className="font-headline text-2xl font-semibold tracking-tight md:text-3xl">{firstName}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Find matches, stay in touch, and share an update.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/discover">
                  <Compass className="mr-2 h-4 w-4" /> Discover
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/edit-profile">
                  <Edit3 className="mr-2 h-4 w-4" /> Edit profile
                </Link>
              </Button>
            </div>
          </div>
          {profileCompletion < 100 && (
            <div className="mt-5 rounded-xl border bg-background/80 p-4 backdrop-blur">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Profile {profileCompletion}% complete</span>
                <Link href="/dashboard/edit-profile" className="text-primary hover:underline">
                  Finish it
                </Link>
              </div>
              <Progress value={profileCompletion} className="h-2" />
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Match requests", value: matchRequests.length, href: "#match-requests", icon: UserPlus },
            { label: "Unread", value: totalUnread, href: "#notifications", icon: BellRing },
            { label: "Connections", value: connections.length, href: "/messages", icon: Users },
            { label: "Suggestions", value: quickSuggestions.length, href: "/discover", icon: Sparkles },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href} className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40">
              <stat.icon className="mb-2 h-4 w-4 text-primary" />
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarCheck className="h-4 w-4 text-primary" /> Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 p-3 pt-0">
                {dashboardNavLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Button
                      key={link.label}
                      variant={isActive ? "default" : "ghost"}
                      asChild
                      className={cn("h-auto flex-col gap-1 px-2 py-3 text-[11px] leading-tight", isActive ? "" : "text-muted-foreground hover:text-primary")}
                    >
                      <Link href={link.href} aria-label={link.label}>
                        {React.cloneElement(link.icon, { className: "h-4 w-4 mr-0" })}
                        <span className="text-center">{link.label}</span>
                      </Link>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>


            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" /> Suggested matches
                </CardTitle>
                <CardDescription>People you may want to meet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
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
                      <div key={suggestion.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60">
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

            <Card className="overflow-hidden">
              <div className="relative h-36 w-full">
                <Image src="https://placehold.co/600x400.png" alt="Riya & Rohan" fill className="object-cover" data-ai-hint="happy couple wedding" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-4 w-4 fill-secondary text-secondary" /> Success story
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <h3 className="font-semibold">Riya & Rohan</h3>
                <p className="mt-1 text-sm text-muted-foreground">"We connected on CupidMatch and instantly knew there was something special."</p>
              </CardContent>
              <CardFooter>
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link href="/success-stories">Read more stories</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-5 lg:col-span-6">
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handlePostSubmit} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                      <AvatarFallback>{userDisplayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Textarea
                      placeholder={`Share an update, ${firstName}...`}
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="min-h-[72px] resize-none bg-muted/50"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={!newPost.trim()}>
                      Post
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {isLoadingPosts ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
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
                  <Card key={post.id}>
                    <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.userAvatar} alt={post.userName} />
                          <AvatarFallback>{post.userName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{post.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {post.timestamp && post.timestamp.toDate ? formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Share2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                    </CardContent>
                    <CardFooter className="flex flex-col p-4 pt-0 space-y-4">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleLikePost(post.id)} 
                            className={cn(
                              "flex items-center gap-1 text-sm",
                              post.isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Heart className={cn("h-4 w-4", post.isLiked && "fill-red-500")} /> 
                            {post.likes} Likes
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              toggleCommentForm(post.id);
                              if ((post.unreadComments ?? 0) > 0) {
                                markPostCommentsAsRead(post.id);
                              }
                            }}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground relative"
                          >
                            <MessageCircle className="h-4 w-4" /> 
                            {post.comments} Comments
                            {(post.unreadComments ?? 0) > 0 && (
                              <Badge 
                                variant="destructive" 
                                className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs"
                              >
                                {post.unreadComments}
                              </Badge>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {post.isCommenting && (
                        <div className="w-full space-y-4">
                          {/* Comment Form */}
                          <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="flex gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
                              <AvatarFallback>{userDisplayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <Input
                                placeholder="Write a comment..."
                                value={commentText[post.id] || ""}
                                onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                                className="flex-1"
                              />
                              <Button type="submit" size="icon" disabled={!commentText[post.id]?.trim()}>
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </form>

                          {/* Comments List */}
                          {post.commentList && post.commentList.length > 0 ? (
                            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                              <div className="space-y-4">
                                {post.commentList.map((comment) => (
                                  <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                                      <AvatarFallback>{comment.userName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold">{comment.userName}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {comment.timestamp.toDate ? formatDistanceToNow(comment.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                                        </p>
                                      </div>
                                      <p className="text-sm">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                                <div ref={commentEndRef} />
                              </div>
                            </ScrollArea>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-card py-12 text-center">
                <Rocket className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold">No posts yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Share your first update to get started.</p>
              </div>
            )}
          </div>

          <div className="space-y-5 lg:col-span-3">
            <Card id="notifications">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BellRing className="h-4 w-4 text-primary" /> Notifications
                  {totalUnread > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {totalUnread}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {unreadMessageCount > 0 ? (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      <p>
                        <span className="font-semibold">{unreadMessageCount}</span> new message{unreadMessageCount > 1 ? "s" : ""}
                      </p>
                      <Button variant="link" size="sm" className="h-auto p-0" asChild>
                        <Link href="/messages">View</Link>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No new messages.</p>
                  )}

                  {unreadLikeCount > 0 ? (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      <p>
                        <span className="font-semibold">{unreadLikeCount}</span> new like{unreadLikeCount > 1 ? "s" : ""}
                      </p>
                      <Button variant="link" size="sm" className="h-auto p-0" onClick={markLikesAsRead}>
                        View
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No new likes.</p>
                  )}

                  {unreadCommentCount > 0 ? (
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      <p>
                        <span className="font-semibold">{unreadCommentCount}</span> new comment{unreadCommentCount > 1 ? "s" : ""}
                      </p>
                      <Button variant="link" size="sm" className="h-auto p-0" onClick={markCommentsAsRead}>
                        View
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No new comments.</p>
                  )}
                </div>
              </CardContent>
              {(unreadMessageCount > 0 || unreadLikeCount > 0 || unreadCommentCount > 0) && (
                <CardFooter className="p-4 pt-0">
                  <Button 
                    variant="link" 
                    className="w-full" 
                    onClick={() => {
                      if (unreadMessageCount > 0) {
                        window.location.href = '/messages';
                      } else {
                        markAllNotificationsAsRead();
                      }
                    }}
                  >
                    {unreadMessageCount > 0 ? 'View Messages' : 'Mark All as Read'}
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-primary" /> Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingConnections ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : connections.length > 0 ? (
                  <div className="space-y-3">
                    {connections.slice(0, 4).map((connection) => (
                      <div key={connection.id} className="rounded-lg border p-3">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-11 w-11">
                              <AvatarImage src={connection.photoURL} alt={connection.displayName} />
                              <AvatarFallback>{connection.displayName.substring(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {connection.unreadCount > 0 && (
                              <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 min-w-5 px-1.5 text-xs">
                                {connection.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link href={`/profile/${connection.userId}`} className="block truncate font-medium hover:underline">
                              {connection.displayName}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">
                              {[connection.age ? `${connection.age}` : null, connection.profession].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-8 flex-1" asChild>
                            <Link href={`/messages/${connection.id}`}>
                              <MessageCircle className="mr-1 h-4 w-4" /> Chat
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 flex-1" asChild>
                            <Link href={`/profile/${connection.userId}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 py-4 text-center">
                    <p className="text-sm text-muted-foreground">No connections yet.</p>
                    <Button asChild>
                      <Link href="/discover">Find matches</Link>
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

            <Card id="match-requests">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4 text-primary" /> Match requests
                </CardTitle>
                <CardDescription>People who want to connect</CardDescription>
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
                      <div key={req.id} className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50">
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" /> Today&apos;s horoscope
                </CardTitle>
              </CardHeader>
              <CardContent>
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
