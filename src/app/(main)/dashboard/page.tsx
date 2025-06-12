
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { UserCircle, Settings, Star, Search, MessageCircle, CreditCard, Sparkles, Users, UserPlus, CalendarCheck, Briefcase, MapPin, Cake, Loader2, Check, X, Eye, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import React, { useEffect, useState, useCallback } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, writeBatch, serverTimestamp, Timestamp, orderBy, limit, getDocs } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { calculateAge, getCompositeId } from '@/lib/utils';
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

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

interface QuickSuggestionProfile {
  id: string;
  name: string;
  age?: number;
  profession?: string;
  location?: string;
  avatarUrl: string;
  dataAiHint: string;
}

const mockUser = {
  name: "User",
  avatarUrl: "https://placehold.co/100x100.png",
  dataAiHint: "person placeholder"
};

const mockTodaysHoroscope = {
  sign: "Your Sign",
  summary: "Today's horoscope summary will appear here once the feature is implemented.",
  luckyColor: "Varies",
  luckyNumber: 0,
};

const PROFILE_COMPLETION_FIELDS = [
  'displayName', 'bio', 'photoURL', 'location', 'profession', 
  'height', 'dob', 'religion', 'caste', 'language', 'hobbies'
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

  const { toast } = useToast();

  const calculateProfileCompletion = (userData: any) => {
    if (!userData) return 0;
    let filledFields = 0;
    PROFILE_COMPLETION_FIELDS.forEach(field => {
      if (field === 'photoURL') {
        if (userData[field] && !userData[field].includes('placehold.co') && !userData[field].includes('default_avatar.png') /* Add other placeholder checks if any */) {
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log("Dashboard Auth: Auth state changed. User:", user ? user.uid : 'null');
      setCurrentUser(user);
      if (user) {
        setUserDisplayName(user.displayName || mockUser.name);
        
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                setUserAvatarUrl(userData.photoURL || user.photoURL || mockUser.avatarUrl);
                setUserAvatarHint(userData.dataAiHint || (userData.photoURL && !userData.photoURL.includes('placehold.co') ? "user avatar" : mockUser.dataAiHint));
                setProfileCompletion(calculateProfileCompletion(userData));
                 console.log(`Dashboard Auth: User document for ${user.uid} found. Avatar: ${userData.photoURL}, Hint: ${userData.dataAiHint}, Completion: ${calculateProfileCompletion(userData)}%`);
            } else {
                setUserAvatarUrl(user.photoURL || mockUser.avatarUrl);
                setUserAvatarHint(user.photoURL && !user.photoURL.includes('placehold.co') ? "user avatar" : mockUser.dataAiHint);
                setProfileCompletion(calculateProfileCompletion({ displayName: user.displayName, photoURL: user.photoURL }));
                console.log(`Dashboard Auth: User document for ${user.uid} not found. Using auth data for display. Completion: ${calculateProfileCompletion({ displayName: user.displayName, photoURL: user.photoURL })}%`);
            }
        } catch (e) {
            console.error("Dashboard Auth: Error fetching user doc for avatar/hint/completion:", e);
            setUserAvatarUrl(user.photoURL || mockUser.avatarUrl);
            setUserAvatarHint(user.photoURL && !user.photoURL.includes('placehold.co') ? "user avatar" : mockUser.dataAiHint);
            setProfileCompletion(calculateProfileCompletion({ displayName: user.displayName, photoURL: user.photoURL }));
        }
      } else {
        setUserDisplayName(mockUser.name);
        setUserAvatarUrl(mockUser.avatarUrl);
        setUserAvatarHint(mockUser.dataAiHint);
        setQuickSuggestions([]); 
        setMatchRequests([]);
        setIsLoadingSuggestions(false);
        setIsLoadingRequests(false);
        setProfileCompletion(0);
        console.log("Dashboard Auth: No user, cleared suggestions and requests, set loading to false.");
      }
    });
    return () => {
      console.log("Dashboard Auth: Unsubscribing from onAuthStateChanged listener.");
      unsubscribeAuth();
    };
  }, []);

  const fetchQuickSuggestions = useCallback(async (currentUserId: string) => {
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
          avatarUrl: data.photoURL || `https://placehold.co/100x100.png?text=${data.displayName ? data.displayName.substring(0,1) : 'S'}`,
          dataAiHint: data.dataAiHint || (data.photoURL && !data.photoURL.includes('placehold.co') ? "person professional" : "person placeholder"),
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
  }, [toast]);


  useEffect(() => {
    console.log("Dashboard Effect: Initializing data fetch based on currentUser.");
    if (!currentUser) {
      console.log("Dashboard Effect: No current user. Clearing requests and suggestions. Setting loading states to false.");
      setMatchRequests([]);
      setQuickSuggestions([]);
      setIsLoadingRequests(false);
      setIsLoadingSuggestions(false);
      return;
    }

    console.log(`Dashboard Effect: Current user available (UID: ${currentUser.uid}). Fetching suggestions and match requests.`);
    setIsLoadingRequests(true);
    setIsLoadingSuggestions(true);
    
    fetchQuickSuggestions(currentUser.uid); 

    console.log(`Dashboard Requests: Setting up match requests listener for user UID: ${currentUser.uid}`);
    
    const requestsQuery = query(
      collection(db, "matchRequests"),
      where("receiverUid", "==", currentUser.uid),
      where("status", "==", "pending"),
      orderBy("createdAt", "asc") 
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, async (snapshot) => {
      console.log(`Dashboard Requests: Snapshot received. Empty: ${snapshot.empty}, Docs count: ${snapshot.docs.length}, HasPendingWrites: ${snapshot.metadata.hasPendingWrites}`);
      
      if (snapshot.metadata.hasPendingWrites) {
        console.log("Dashboard Requests: Snapshot has pending writes, waiting for server confirmation...");
      }
      
      if (snapshot.empty) {
          console.log("Dashboard Requests: No 'pending' matchRequests found for current user. Clearing requests list.");
          setMatchRequests([]);
          setIsLoadingRequests(false); // Ensure loading is false if empty
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
              senderDataAiHint = senderData.dataAiHint || (senderData.photoURL && !senderData.photoURL.includes('placehold.co') ? "person professional" : "person placeholder");
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
        fetchedRequests = fetchedRequests.filter(req => req !== null).reverse(); 
        console.log(`Dashboard Requests: Final processed requests (before setting state, count: ${fetchedRequests.length}):`, JSON.parse(JSON.stringify(fetchedRequests)));
        setMatchRequests(fetchedRequests as MatchRequest[]);
      } catch (processingError) {
        console.error("Dashboard Requests: Error processing request promises: ", processingError);
        setMatchRequests([]); 
      } finally {
        // if (snapshot.empty) { // This check is already at the top
        //      setMatchRequests([]);
        // }
        setIsLoadingRequests(false);
        console.log("Dashboard Requests: Finished processing snapshot, isLoadingRequests set to false.");
      }
    }, (error) => {
        console.error("Dashboard Requests: Error in onSnapshot for match requests: ", error);
        toast({ title: "Error Loading Requests", description: "Could not load match requests. " + error.message, variant: "destructive"});
        setMatchRequests([]);
        setIsLoadingRequests(false);
        console.log("Dashboard Requests: Error in onSnapshot, isLoadingRequests set to false.");
    });

    return () => {
      console.log("Dashboard Effect: Unsubscribing from match requests listener.");
      unsubscribeRequests();
    }
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
    batch.set(chatDocRef, {
        participants: [user1Uid, user2Uid].sort(),
        participantDetails: {
            [user1Uid]: {
                displayName: user1Data.displayName || "User",
                photoURL: user1Data.photoURL || "https://placehold.co/100x100.png",
                dataAiHint: user1Data.dataAiHint || (user1Data.photoURL && !user1Data.photoURL.includes('placehold.co') ? "person avatar" : "person placeholder")
            },
            [user2Uid]: {
                displayName: user2Data.displayName || "User",
                photoURL: user2Data.photoURL || "https://placehold.co/100x100.png",
                dataAiHint: user2Data.dataAiHint || (user2Data.photoURL && !user2Data.photoURL.includes('placehold.co') ? "person avatar" : "person placeholder")
            }
        },
        lastMessageText: "You are now connected!",
        lastMessageSenderId: null,
        lastMessageTimestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        unreadBy: { [user1Uid]: 0, [user2Uid]: 0 }
    }, { merge: true });

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

  return (
    <div className="space-y-8">
      <Card className="shadow-xl bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-primary/20">
        <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage src={userAvatarUrl} alt={userDisplayName} data-ai-hint={userAvatarHint} />
              <AvatarFallback>{userDisplayName.substring(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="font-headline text-3xl text-primary">Welcome back, {userDisplayName}!</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">Ready to find your perfect match today?</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 font-headline text-lg text-primary">
                <FileText className="h-5 w-5" /> Profile Completion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              <Progress value={profileCompletion} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Your profile is {profileCompletion}% complete.
              </p>
              {profileCompletion < 100 && (
                <div className="text-center">
                  <p className="text-xs text-foreground mb-1.5">
                    A complete profile gets more views and better matches!
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/edit-profile">Update Your Profile</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-xl text-primary">
                <CalendarCheck className="h-5 w-5" /> Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/discover"><Search className="mr-2 h-4 w-4" />Discover</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start relative" asChild>
                <Link href="/messages">
                  <MessageCircle className="mr-2 h-4 w-4" />Messages
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/horoscope"><Sparkles className="mr-2 h-4 w-4" />Horoscope</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/pricing"><CreditCard className="mr-2 h-4 w-4" />Subscription</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Center Content Area */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                  <UserCircle className="h-7 w-7 text-primary" /> My Profile
                </CardTitle>
                <CardDescription>Keep your story fresh and accurate. Update your details and photos.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/dashboard/edit-profile">Edit Profile</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                  <Settings className="h-7 w-7 text-primary" /> Match Preferences
                </CardTitle>
                <CardDescription>Refine who you're looking for. Adjust age, location, and more.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/dashboard/preferences">Update Preferences</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl text-primary">
                <Star className="h-6 w-6" /> AI Quick Suggestions
              </CardTitle>
              <CardDescription>Our AI has found some profiles you might like. (Displaying real users)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSuggestions ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-24 rounded-md" />
                    </div>
                  ))}
                </>
              ) : quickSuggestions.length > 0 ? (
                quickSuggestions.map(profile => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatarUrl} alt={profile.name} data-ai-hint={profile.dataAiHint} />
                        <AvatarFallback>{profile.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/profile/${profile.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">{profile.name}{profile.age ? `, ${profile.age}` : ''}</Link>
                        <p className="text-xs text-muted-foreground flex items-center"><Briefcase className="mr-1 h-3 w-3" />{profile.profession} <MapPin className="ml-2 mr-1 h-3 w-3" />{profile.location}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/profile/${profile.id}`}><Eye className="mr-1.5 h-3.5 w-3.5" />View</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No suggestions available at the moment.</p>
              )}
              {!isLoadingSuggestions && quickSuggestions.length > 0 && (
                 <Button variant="link" className="w-full text-primary mt-2" asChild>
                    <Link href="/suggestions">See All AI Matches</Link>
                 </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-3 space-y-6">
           <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-xl text-secondary">
                <Sparkles className="h-5 w-5" /> Today's Horoscope ({mockTodaysHoroscope.sign})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{mockTodaysHoroscope.summary}</p>
              <div className="text-xs space-y-0.5">
                <p><span className="font-semibold">Lucky Color:</span> {mockTodaysHoroscope.luckyColor}</p>
                <p><span className="font-semibold">Lucky Number:</span> {mockTodaysHoroscope.luckyNumber}</p>
              </div>
              <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-secondary" asChild>
                <Link href="/dashboard/horoscope">More Horoscope Tools</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-xl text-primary">
                <UserPlus className="h-5 w-5" /> Match Requests
                {!isLoadingRequests && matchRequests.length > 0 && <Badge variant="destructive" className="ml-auto">{matchRequests.length}</Badge>}
              </CardTitle>
              <CardDescription>People who want to connect with you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingRequests && (
                <div className="flex justify-center items-center py-4"> <Loader2 className="h-6 w-6 animate-spin text-primary" /> </div>
              )}
              {!isLoadingRequests && matchRequests.length > 0 && (
                matchRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-2.5 bg-muted/20 hover:bg-muted/40 rounded-md transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={req.senderAvatarUrl} alt={req.senderName} data-ai-hint={req.senderDataAiHint} />
                        <AvatarFallback>{req.senderName.substring(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-foreground">{req.senderName}</p>
                        <div className="text-xs text-muted-foreground mt-0.5 space-y-px">
                          {req.senderAge != null && req.senderAge > 0 && (
                            <p className="flex items-center">
                              <Cake className="mr-1.5 h-3 w-3 text-muted-foreground/80" /> {req.senderAge} years old
                            </p>
                          )}
                          <p className="flex items-center">
                            <Briefcase className="mr-1.5 h-3 w-3 text-muted-foreground/80" />
                            {req.senderProfession || 'Profession not specified'}
                          </p>
                          {req.senderLocation && (
                            <p className="flex items-center">
                              <MapPin className="mr-1.5 h-3 w-3 text-muted-foreground/80" /> {req.senderLocation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button onClick={() => handleAcceptRequest(req)} variant="outline" size="sm" className="h-7 px-2 border-green-500 text-green-600 hover:bg-green-500/10 disabled:opacity-50" disabled={processingRequestId === req.id}>
                        {processingRequestId === req.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Check className="h-3 w-3"/>}
                      </Button>
                      <Button onClick={() => handleDeclineRequest(req.id, req.senderName)} variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50" disabled={processingRequestId === req.id}>
                         {processingRequestId === req.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <X className="h-3 w-3"/>}
                      </Button>
                    </div>
                  </div>
                ))
              )}
              {!isLoadingRequests && matchRequests.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center py-4">No pending match requests.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
    
