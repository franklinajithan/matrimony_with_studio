"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageSquare,
  Briefcase,
  MapPin,
  Cake,
  Languages,
  CheckCircle,
  Ruler,
  Sparkles as SparklesIcon,
  Brain,
  Loader2,
  BookOpen,
  Film,
  Music,
  School,
  Droplet,
  Cigarette,
  Image as ImageIconLucide,
  GalleryHorizontal,
  UserPlus,
  UserCheck,
  UserX,
  XCircle,
  ArrowLeftCircle,
  ArrowRightCircle,
  Gamepad2,
} from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp, query, where, collection, onSnapshot, writeBatch, Timestamp } from "firebase/firestore";
import { intelligentMatchSuggestions, type IntelligentMatchSuggestionsInput, type IntelligentMatchSuggestionsOutput } from "@/ai/flows/intelligent-match-suggestions";
import type { UserProfileSchema as AIUserProfileSchema, PotentialMatchProfileSchema as AIPotentialMatchProfileSchema } from "@/ai/flows/intelligent-match-suggestions";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StoredPhoto {
  id: string;
  url: string;
  hint: string;
  storagePath?: string;
}

interface ViewedUserProfileData extends AIPotentialMatchProfileSchema {
  userId: string;
  name: string;
  bio?: string;
  photoURL?: string;
  additionalPhotoUrls?: StoredPhoto[];
  isVerified?: boolean;
  dataAiHint?: string;
}

type MatchRequestStatus = "none" | "pending_sent" | "pending_received" | "accepted" | "declined_by_me" | "declined_by_them";

const calculateAge = (dobString?: string): number | undefined => {
  if (!dobString) return undefined;
  try {
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : undefined;
  } catch (e) {
    return undefined;
  }
};

const getCompositeId = (uid1: string, uid2: string): string => {
  if (!uid1 || !uid2) {
    console.warn("getCompositeId received undefined or null UID");
    return "invalid_composite_id";
  }
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const viewedUserId = params.userId as string;

  const [viewedUserProfile, setViewedUserProfile] = useState<ViewedUserProfileData | null>(null);
  const [loggedInUserProfile, setLoggedInUserProfile] = useState<AIUserProfileSchema | null>(null);
  const [aiMatchResult, setAiMatchResult] = useState<{ score: number; reasoning: string } | null>(null);

  const [isLoadingViewedProfile, setIsLoadingViewedProfile] = useState(true);
  const [isLoadingLoggedInUser, setIsLoadingLoggedInUser] = useState(true);
  const [isLoadingAiAnalysis, setIsLoadingAiAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null>(null);

  const [mainPageImage, setMainPageImage] = useState<StoredPhoto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentModalImageIndex, setCurrentModalImageIndex] = useState(0);

  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [requestStatus, setRequestStatus] = useState<MatchRequestStatus>("none");
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [matchRequestId, setMatchRequestId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentFirebaseUser(user);
      if (user) {
        setIsLoadingLoggedInUser(true);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const transformedData: AIUserProfileSchema = {
              age: calculateAge(data.dob) || 0,
              religion: data.religion || "",
              caste: data.caste || "",
              language: data.language || "",
              height: Number(data.height) || 0,
              hobbies:
                typeof data.hobbies === "string"
                  ? data.hobbies
                      .split(",")
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                  : Array.isArray(data.hobbies)
                  ? data.hobbies
                  : [],
              location: data.location || "",
              profession: data.profession || "",
              sunSign: data.sunSign || undefined,
              moonSign: data.moonSign || undefined,
              nakshatra: data.nakshatra || undefined,
              favoriteMovies:
                typeof data.favoriteMovies === "string"
                  ? data.favoriteMovies
                      .split(",")
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                  : Array.isArray(data.favoriteMovies)
                  ? data.favoriteMovies
                  : [],
              favoriteMusic:
                typeof data.favoriteMusic === "string"
                  ? data.favoriteMusic
                      .split(",")
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                  : Array.isArray(data.favoriteMusic)
                  ? data.favoriteMusic
                  : [],
              educationLevel: data.educationLevel || undefined,
              smokingHabits: data.smokingHabits || undefined,
              drinkingHabits: data.drinkingHabits || undefined,
            };
            setLoggedInUserProfile(transformedData);
          } else {
            setLoggedInUserProfile(null);
          }
        } catch (e: any) {
          setError("Failed to fetch your profile: " + e.message);
          setLoggedInUserProfile(null);
        } finally {
          setIsLoadingLoggedInUser(false);
        }
      } else {
        setLoggedInUserProfile(null);
        setIsLoadingLoggedInUser(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!viewedUserId) return;
    setIsLoadingViewedProfile(true);
    setError(null);
    const fetchViewedProfile = async () => {
      try {
        const userDocRef = doc(db, "users", viewedUserId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const profileData: ViewedUserProfileData = {
            userId: docSnap.id,
            name: data.displayName || "N/A",
            age: calculateAge(data.dob) || 0,
            profession: data.profession || "N/A",
            location: data.location || "N/A",
            height: Number(data.height) || 0,
            religion: data.religion || "N/A",
            caste: data.caste || "N/A",
            language: data.language || "N/A",
            hobbies:
              typeof data.hobbies === "string"
                ? data.hobbies
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                : Array.isArray(data.hobbies)
                ? data.hobbies
                : [],
            favoriteMovies:
              typeof data.favoriteMovies === "string"
                ? data.favoriteMovies
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                : Array.isArray(data.favoriteMovies)
                ? data.favoriteMovies
                : [],
            favoriteMusic:
              typeof data.favoriteMusic === "string"
                ? data.favoriteMusic
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                : Array.isArray(data.favoriteMusic)
                ? data.favoriteMusic
                : [],
            educationLevel: data.educationLevel || undefined,
            smokingHabits: data.smokingHabits || undefined,
            drinkingHabits: data.drinkingHabits || undefined,
            sunSign: data.sunSign || undefined,
            moonSign: data.moonSign || undefined,
            nakshatra: data.nakshatra || undefined,
            bio: data.bio || "No bio provided.",
            photoURL: data.photoURL || `https://placehold.co/600x800.png?text=${data.displayName ? data.displayName.substring(0, 1) : "P"}`,
            dataAiHint: data.dataAiHint || (data.photoURL ? "person profile" : "placeholder person"),
            additionalPhotoUrls: data.additionalPhotoUrls || [],
            isVerified: data.isVerified || false,
          };
          setViewedUserProfile(profileData);
          if (profileData.photoURL) {
            setMainPageImage({ id: "main", url: profileData.photoURL, hint: profileData.dataAiHint || "profile main" });
          } else if (profileData.additionalPhotoUrls && profileData.additionalPhotoUrls.length > 0) {
            setMainPageImage(profileData.additionalPhotoUrls[0]);
          } else {
            setMainPageImage({ id: "placeholder", url: `https://placehold.co/600x800.png?text=${profileData.name ? profileData.name.substring(0, 1) : "P"}`, hint: "placeholder person" });
          }
        } else {
          setError("Profile not found.");
          setViewedUserProfile(null);
        }
      } catch (e: any) {
        setError("Failed to load profile: " + e.message);
        setViewedUserProfile(null);
      } finally {
        setIsLoadingViewedProfile(false);
      }
    };
    fetchViewedProfile();
  }, [viewedUserId]);

  // Fetch Like Status
  useEffect(() => {
    if (!currentFirebaseUser || !viewedUserId || currentFirebaseUser.uid === viewedUserId) return;
    const likeId = getCompositeId(currentFirebaseUser.uid, viewedUserId);
    const likeDocRef = doc(db, "likes", likeId);
    const unsubscribe = onSnapshot(likeDocRef, (docSnap) => {
      setHasLiked(docSnap.exists());
    });
    return () => unsubscribe();
  }, [currentFirebaseUser, viewedUserId]);

  // Fetch Match Request Status
  useEffect(() => {
    if (!currentFirebaseUser || !viewedUserId || currentFirebaseUser.uid === viewedUserId) {
      setRequestStatus("none");
      return;
    }

    const reqId = getCompositeId(currentFirebaseUser.uid, viewedUserId);
    setMatchRequestId(reqId);
    const requestDocRef = doc(db, "matchRequests", reqId);

    const unsubscribe = onSnapshot(requestDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === "accepted") {
          setRequestStatus("accepted");
        } else if (data.status === "pending") {
          if (data.senderUid === currentFirebaseUser.uid) {
            setRequestStatus("pending_sent");
          } else {
            setRequestStatus("pending_received");
          }
        } else if (data.status === "declined_by_sender" && data.senderUid === currentFirebaseUser.uid) {
          setRequestStatus("none");
        } else if (data.status === "declined_by_receiver" && data.receiverUid === currentFirebaseUser.uid) {
          setRequestStatus("none");
        } else if (data.status.startsWith("declined")) {
          setRequestStatus("none");
        } else {
          setRequestStatus("none");
        }
      } else {
        setRequestStatus("none");
      }
    });
    return () => unsubscribe();
  }, [currentFirebaseUser, viewedUserId]);

  useEffect(() => {
    if (loggedInUserProfile && viewedUserProfile && viewedUserId !== "0" && currentFirebaseUser && currentFirebaseUser.uid !== viewedUserProfile.userId) {
      const performAiAnalysis = async () => {
        setIsLoadingAiAnalysis(true);
        try {
          const aiViewedProfileInput: AIPotentialMatchProfileSchema = {
            userId: viewedUserProfile.userId,
            age: viewedUserProfile.age,
            religion: viewedUserProfile.religion,
            caste: viewedUserProfile.caste,
            language: viewedUserProfile.language,
            height: viewedUserProfile.height,
            hobbies: viewedUserProfile.hobbies,
            location: viewedUserProfile.location,
            profession: viewedUserProfile.profession,
            sunSign: viewedUserProfile.sunSign,
            moonSign: viewedUserProfile.moonSign,
            nakshatra: viewedUserProfile.nakshatra,
            favoriteMovies: viewedUserProfile.favoriteMovies,
            favoriteMusic: viewedUserProfile.favoriteMusic,
            educationLevel: viewedUserProfile.educationLevel,
            smokingHabits: viewedUserProfile.smokingHabits,
            drinkingHabits: viewedUserProfile.drinkingHabits,
          };
          const input: IntelligentMatchSuggestionsInput = {
            userProfile: loggedInUserProfile,
            userActivity: { profilesViewed: [], matchesMade: [] },
            allPotentialMatches: [aiViewedProfileInput],
          };
          const suggestions = await intelligentMatchSuggestions(input);
          if (suggestions && suggestions.length > 0) {
            setAiMatchResult({
              score: suggestions[0].compatibilityScore,
              reasoning: suggestions[0].reasoning,
            });
          } else {
            setAiMatchResult(null);
          }
        } catch (e: any) {
          setAiMatchResult(null);
        } finally {
          setIsLoadingAiAnalysis(false);
        }
      };
      performAiAnalysis();
    } else if (currentFirebaseUser && viewedUserProfile && currentFirebaseUser.uid === viewedUserProfile.userId) {
      setIsLoadingAiAnalysis(false);
      setAiMatchResult(null);
    }
  }, [loggedInUserProfile, viewedUserProfile, currentFirebaseUser, viewedUserId]);

  const allPhotos = useMemo(() => {
    const photos: StoredPhoto[] = [];
    if (viewedUserProfile?.photoURL) {
      photos.push({ id: "main-profile", url: viewedUserProfile.photoURL, hint: viewedUserProfile.dataAiHint || "profile main" });
    }
    if (viewedUserProfile?.additionalPhotoUrls) {
      photos.push(...viewedUserProfile.additionalPhotoUrls);
    }
    if (photos.length === 0 && viewedUserProfile?.name) {
      photos.push({ id: "placeholder-gallery", url: `https://placehold.co/300x400.png?text=${viewedUserProfile.name.substring(0, 1)}`, hint: "placeholder person" });
    }
    return photos;
  }, [viewedUserProfile]);

  useEffect(() => {
    if (allPhotos.length > 0 && !mainPageImage) {
      setMainPageImage(allPhotos[0]);
    }
  }, [allPhotos, mainPageImage]);

  const handleThumbnailClick = (photo: StoredPhoto, index: number) => {
    setMainPageImage(photo);
    setCurrentModalImageIndex(index); // Keep modal in sync if it's open
  };

  const openImageModal = (index: number) => {
    setCurrentModalImageIndex(index);
    setIsModalOpen(true);
  };

  const changeModalImage = (direction: "next" | "prev") => {
    const newIndex = direction === "next" ? (currentModalImageIndex + 1) % allPhotos.length : (currentModalImageIndex - 1 + allPhotos.length) % allPhotos.length;
    setCurrentModalImageIndex(newIndex);
  };

  const handleLikeToggle = async () => {
    if (!currentFirebaseUser || !viewedUserId || isLiking || currentFirebaseUser.uid === viewedUserId) return;
    setIsLiking(true);
    const likeId = getCompositeId(currentFirebaseUser.uid, viewedUserId);
    const likeDocRef = doc(db, "likes", likeId);

    try {
      if (hasLiked) {
        await deleteDoc(likeDocRef);
        setHasLiked(false);
        toast({ title: "Unliked", description: `You unliked ${viewedUserProfile?.name}.` });
      } else {
        await setDoc(likeDocRef, {
          likerUid: currentFirebaseUser.uid,
          likedUid: viewedUserId,
          timestamp: serverTimestamp(),
        });
        setHasLiked(true);
        toast({ title: "Liked!", description: `You liked ${viewedUserProfile?.name}.` });
      }
    } catch (e: any) {
      toast({ title: "Error", description: `Failed to ${hasLiked ? "unlike" : "like"}: ${e.message}`, variant: "destructive" });
    } finally {
      setIsLiking(false);
    }
  };

  const handleSendRequest = async () => {
    if (!currentFirebaseUser || !viewedUserProfile || isProcessingRequest || !matchRequestId) return;
    setIsProcessingRequest(true);
    const requestDocRef = doc(db, "matchRequests", matchRequestId);
    try {
      await setDoc(requestDocRef, {
        senderUid: currentFirebaseUser.uid,
        receiverUid: viewedUserProfile.userId,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        participants: [currentFirebaseUser.uid, viewedUserProfile.userId].sort(),
      });
      setRequestStatus("pending_sent");
      toast({ title: "Request Sent", description: `Match request sent to ${viewedUserProfile.name}.` });
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to send request: " + e.message, variant: "destructive" });
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!matchRequestId || isProcessingRequest) return;
    setIsProcessingRequest(true);
    const requestDocRef = doc(db, "matchRequests", matchRequestId);
    try {
      await deleteDoc(requestDocRef);
      setRequestStatus("none");
      toast({ title: "Request Cancelled", description: "Your match request has been cancelled." });
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to cancel request: " + e.message, variant: "destructive" });
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const createChatDocument = async (user1Uid: string, user2Uid: string) => {
    const user1DocRef = doc(db, "users", user1Uid);
    const user2DocRef = doc(db, "users", user2Uid);

    const [user1Snap, user2Snap] = await Promise.all([getDoc(user1DocRef), getDoc(user2DocRef)]);

    if (!user1Snap.exists() || !user2Snap.exists()) {
      throw new Error("One or both user profiles not found for chat creation.");
    }
    const user1Data = user1Snap.data();
    const user2Data = user2Snap.data();

    const chatId = getCompositeId(user1Uid, user2Uid);
    const chatDocRef = doc(db, "chats", chatId);

    const batch = writeBatch(db);
    batch.set(
      chatDocRef,
      {
        participants: [user1Uid, user2Uid].sort(),
        participantDetails: {
          [user1Uid]: {
            displayName: user1Data.displayName || "User",
            photoURL: user1Data.photoURL || "https://placehold.co/100x100.png",
          },
          [user2Uid]: {
            displayName: user2Data.displayName || "User",
            photoURL: user2Data.photoURL || "https://placehold.co/100x100.png",
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
    return chatId;
  };

  const handleAcceptRequest = async () => {
    if (!currentFirebaseUser || !viewedUserProfile || !matchRequestId || isProcessingRequest) return;
    setIsProcessingRequest(true);
    const requestDocRef = doc(db, "matchRequests", matchRequestId);
    try {
      await updateDoc(requestDocRef, { status: "accepted", updatedAt: serverTimestamp() });
      await createChatDocument(currentFirebaseUser.uid, viewedUserProfile.userId);
      setRequestStatus("accepted");
      toast({ title: "Request Accepted!", description: `You are now matched with ${viewedUserProfile.name}.` });
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to accept request: " + e.message, variant: "destructive" });
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!currentFirebaseUser || !matchRequestId || isProcessingRequest) return;
    setIsProcessingRequest(true);
    const requestDocRef = doc(db, "matchRequests", matchRequestId);
    try {
      const requestSnap = await getDoc(requestDocRef);
      if (!requestSnap.exists()) {
        throw new Error("Request document not found.");
      }
      const requestData = requestSnap.data();
      const declineStatus = currentFirebaseUser.uid === requestData.senderUid ? "declined_by_sender" : "declined_by_receiver";

      await updateDoc(requestDocRef, { status: declineStatus, updatedAt: serverTimestamp() });
      setRequestStatus("none");
      toast({ title: "Request Declined" });
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to decline request: " + e.message, variant: "destructive" });
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const renderActionButtons = () => {
    if (!currentFirebaseUser || !viewedUserProfile || currentFirebaseUser.uid === viewedUserProfile.userId) return null;

    return (
      <div className="mt-auto pt-6 space-y-3 border-t">
        <div className="flex space-x-3">
          <Button onClick={handleLikeToggle} disabled={isLiking} variant={hasLiked ? "default" : "outline"} className="flex-1">
            {isLiking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className={cn("mr-2 h-4 w-4", hasLiked && "fill-current")} />}
            {hasLiked ? "Liked" : "Like"}
          </Button>

          {requestStatus === "none" && (
            <Button onClick={handleSendRequest} disabled={isProcessingRequest} className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              {isProcessingRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />} Send Request
            </Button>
          )}
          {requestStatus === "pending_sent" && (
            <Button onClick={handleCancelRequest} disabled={isProcessingRequest} variant="outline" className="flex-1">
              {isProcessingRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Request Sent
            </Button>
          )}
          {requestStatus === "pending_received" && (
            <>
              <Button onClick={handleAcceptRequest} disabled={isProcessingRequest} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                {isProcessingRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />} Accept
              </Button>
              <Button onClick={handleDeclineRequest} disabled={isProcessingRequest} variant="destructive" className="flex-1">
                {isProcessingRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />} Decline
              </Button>
            </>
          )}
          {requestStatus === "accepted" && (
            <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isProcessingRequest}>
              <Link href={`/messages/${getCompositeId(currentFirebaseUser.uid, viewedUserProfile.userId)}`}>
                <MessageSquare className="mr-2 h-4 w-4" /> Message
              </Link>
            </Button>
          )}
        </div>
        <Button variant="link" className="w-full text-xs text-muted-foreground hover:text-destructive p-0 h-auto">
          Report Profile
        </Button>
      </div>
    );
  };

  if (isLoadingViewedProfile || isLoadingLoggedInUser) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card className="shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2">
              <Skeleton className="h-[400px] md:h-full w-full" />
            </div>
            <div className="md:w-1/2 p-6 md:p-8 space-y-4">
              <Skeleton className="h-10 w-3/4" /> <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-5 w-1/2" /> <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !viewedUserProfile) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!viewedUserProfile) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <Alert variant="destructive">
          <AlertTitle>Profile Not Found</AlertTitle>
          <AlertDescription>The profile you are looking for does not exist.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentModalPhoto = allPhotos[currentModalImageIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Profile Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-background">
              <AvatarImage src={viewedUserProfile?.photoURL} alt={viewedUserProfile?.name} />
              <AvatarFallback>{viewedUserProfile?.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-headline text-2xl text-primary">{viewedUserProfile?.name}</h1>
              <p className="text-sm text-muted-foreground">
                {viewedUserProfile?.age} years • {viewedUserProfile?.location}
              </p>
            </div>
          </div>
          {renderActionButtons()}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - About & Basic Info */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {viewedUserProfile?.bio && (
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Bio</h3>
                    <p className="text-sm">{viewedUserProfile.bio}</p>
                  </div>
                )}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{viewedUserProfile?.profession || "Not specified"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{viewedUserProfile?.location || "Not specified"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{viewedUserProfile?.height ? `${viewedUserProfile.height} cm` : "Not specified"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{viewedUserProfile?.language || "Not specified"}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Religion & Community</h3>
                  <div className="flex items-center space-x-2">
                    <Cake className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {viewedUserProfile?.religion || "N/A"}, {viewedUserProfile?.caste || "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <SparklesIcon className="mr-2 h-5 w-5 text-primary" />
                  Astrological Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {viewedUserProfile?.sunSign && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Sun Sign:</span>
                    <span className="text-sm">{viewedUserProfile.sunSign}</span>
                  </div>
                )}
                {viewedUserProfile?.moonSign && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Moon Sign:</span>
                    <span className="text-sm">{viewedUserProfile.moonSign}</span>
                  </div>
                )}
                {viewedUserProfile?.nakshatra && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Nakshatra:</span>
                    <span className="text-sm">{viewedUserProfile.nakshatra}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Photos & Interests */}
          <div className="md:col-span-2">
            <Tabs defaultValue="photos" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="interests">Interests</TabsTrigger>
                <TabsTrigger value="ai-match">AI Match</TabsTrigger>
              </TabsList>

              <TabsContent value="photos" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {allPhotos.map((photo, index) => (
                        <Dialog key={photo.id}>
                          <DialogTrigger asChild>
                            <button className="relative aspect-square rounded-lg overflow-hidden group" onClick={() => handleThumbnailClick(photo, index)}>
                              <Image src={photo.url} alt={photo.hint || "Gallery photo"} fill className="object-cover transition-transform group-hover:scale-105" data-ai-hint={photo.hint} />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </button>
                          </DialogTrigger>
                          {currentModalPhoto && (
                            <DialogPortal>
                              <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
                              <DialogContent className="max-w-3xl w-auto p-2 bg-transparent border-none shadow-none !rounded-none sm:!rounded-none !gap-0">
                                <div className="relative">
                                  <Image src={currentModalPhoto.url} alt={currentModalPhoto.hint || `Photo of ${viewedUserProfile.name}`} width={800} height={1000} className="object-contain max-h-[85vh] w-auto rounded-md" data-ai-hint={currentModalPhoto.hint} />
                                  <DialogClose className="absolute -top-3 -right-3 sm:top-2 sm:right-2 bg-background/50 hover:bg-background/80 text-foreground rounded-full p-1.5 z-10">
                                    <XCircle className="h-6 w-6" />
                                    <span className="sr-only">Close</span>
                                  </DialogClose>
                                  {allPhotos.length > 1 && (
                                    <>
                                      <Button variant="ghost" size="icon" onClick={() => changeModalImage("prev")} className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-black/30 hover:bg-black/50 text-white" aria-label="Previous image">
                                        <ArrowLeftCircle className="h-6 w-6" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => changeModalImage("next")} className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-black/30 hover:bg-black/50 text-white" aria-label="Next image">
                                        <ArrowRightCircle className="h-6 w-6" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </DialogContent>
                            </DialogPortal>
                          )}
                        </Dialog>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interests" className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-6">
                    {viewedUserProfile?.hobbies && viewedUserProfile.hobbies.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-medium flex items-center">
                          <Gamepad2 className="mr-2 h-4 w-4 text-primary" />
                          Hobbies & Interests
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {viewedUserProfile.hobbies.map((hobby) => (
                            <Badge key={hobby} variant="secondary" className="bg-accent/10">
                              {hobby}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewedUserProfile?.favoriteMovies && viewedUserProfile.favoriteMovies.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-medium flex items-center">
                          <Film className="mr-2 h-4 w-4 text-primary" />
                          Favorite Movies
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {viewedUserProfile.favoriteMovies.map((movie) => (
                            <Badge key={movie} variant="outline">
                              {movie}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewedUserProfile?.favoriteMusic && viewedUserProfile.favoriteMusic.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-medium flex items-center">
                          <Music className="mr-2 h-4 w-4 text-primary" />
                          Favorite Music
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {viewedUserProfile.favoriteMusic.map((music) => (
                            <Badge key={music} variant="outline">
                              {music}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-match" className="space-y-4">
                {isLoadingAiAnalysis ? (
                  <Card>
                    <CardContent className="p-6 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </CardContent>
                  </Card>
                ) : aiMatchResult ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Brain className="mr-2 h-5 w-5 text-primary" />
                        AI Match Analysis
                      </CardTitle>
                      <CardDescription>Based on your profiles and preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-center">
                        <div className="relative h-32 w-32">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-4xl font-bold text-primary">{Math.round(aiMatchResult.score)}%</div>
                          </div>
                          <svg className="h-full w-full" viewBox="0 0 100 100">
                            <circle className="text-muted stroke-current" strokeWidth="8" cx="50" cy="50" r="42" fill="none" />
                            <circle className="text-primary stroke-current" strokeWidth="8" strokeDasharray={`${aiMatchResult.score * 2.64} 264`} strokeLinecap="round" cx="50" cy="50" r="42" fill="none" transform="rotate(-90 50 50)" />
                          </svg>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium">Match Reasoning</h3>
                        <p className="text-sm text-muted-foreground">{aiMatchResult.reasoning}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">No AI match analysis available</CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
