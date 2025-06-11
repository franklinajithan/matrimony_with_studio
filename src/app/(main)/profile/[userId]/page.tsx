
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Briefcase, MapPin, Cake, Languages, CheckCircle, Ruler, Sparkles as SparklesIcon, Brain, Loader2, BookOpen, Film, Music, School, Droplet, Cigarette, Image as ImageIconLucide, GalleryHorizontal, UserPlus, UserCheck, UserX, XCircle } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp, query, where, collection, onSnapshot, writeBatch, Timestamp } from 'firebase/firestore';
import { intelligentMatchSuggestions, type IntelligentMatchSuggestionsInput, type IntelligentMatchSuggestionsOutput } from '@/ai/flows/intelligent-match-suggestions';
import type { UserProfileSchema as AIUserProfileSchema, PotentialMatchProfileSchema as AIPotentialMatchProfileSchema } from '@/ai/flows/intelligent-match-suggestions';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; // Added missing import

interface StoredPhoto {
  id: string;
  url: string;
  hint: string;
  storagePath?: string;
}

interface ViewedUserProfileData extends AIPotentialMatchProfileSchema {
  bio?: string;
  photoURL?: string;
  additionalPhotoUrls?: StoredPhoto[];
  isVerified?: boolean;
  dataAiHint?: string; // Added for main image from user doc
}

type MatchRequestStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined_by_me' | 'declined_by_them';


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
  const [mainImage, setMainImage] = useState<StoredPhoto | null>(null);

  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [requestStatus, setRequestStatus] = useState<MatchRequestStatus>('none');
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
              hobbies: typeof data.hobbies === 'string' ? data.hobbies.split(',').map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(data.hobbies) ? data.hobbies : []),
              location: data.location || "",
              profession: data.profession || "",
              sunSign: data.sunSign || undefined,
              moonSign: data.moonSign || undefined,
              nakshatra: data.nakshatra || undefined,
              favoriteMovies: typeof data.favoriteMovies === 'string' ? data.favoriteMovies.split(',').map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(data.favoriteMovies) ? data.favoriteMovies : []),
              favoriteMusic: typeof data.favoriteMusic === 'string' ? data.favoriteMusic.split(',').map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(data.favoriteMusic) ? data.favoriteMusic : []),
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
            hobbies: typeof data.hobbies === 'string' ? data.hobbies.split(',').map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(data.hobbies) ? data.hobbies : []),
            favoriteMovies: typeof data.favoriteMovies === 'string' ? data.favoriteMovies.split(',').map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(data.favoriteMovies) ? data.favoriteMovies : []),
            favoriteMusic: typeof data.favoriteMusic === 'string' ? data.favoriteMusic.split(',').map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(data.favoriteMusic) ? data.favoriteMusic : []),
            educationLevel: data.educationLevel || undefined,
            smokingHabits: data.smokingHabits || undefined,
            drinkingHabits: data.drinkingHabits || undefined,
            sunSign: data.sunSign || undefined,
            moonSign: data.moonSign || undefined,
            nakshatra: data.nakshatra || undefined,
            bio: data.bio || "No bio provided.",
            photoURL: data.photoURL || `https://placehold.co/600x800.png?text=${data.displayName ? data.displayName.substring(0, 1) : 'P'}`,
            dataAiHint: data.dataAiHint || (data.photoURL ? "person profile" : "placeholder person"),
            additionalPhotoUrls: data.additionalPhotoUrls || [],
            isVerified: data.isVerified || false,
          };
          setViewedUserProfile(profileData);
          if (profileData.photoURL) {
            setMainImage({ id: 'main', url: profileData.photoURL, hint: profileData.dataAiHint || 'profile main' });
          } else if (profileData.additionalPhotoUrls && profileData.additionalPhotoUrls.length > 0) {
            setMainImage(profileData.additionalPhotoUrls[0]);
          } else {
            setMainImage({ id: 'placeholder', url: `https://placehold.co/600x800.png?text=${profileData.name ? profileData.name.substring(0, 1) : 'P'}`, hint: 'placeholder person' });
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
    const likeId = getCompositeId(currentFirebaseUser.uid, viewedUserId); // Use composite ID for likes too
    const likeDocRef = doc(db, "likes", likeId);
    const unsubscribe = onSnapshot(likeDocRef, (docSnap) => {
      setHasLiked(docSnap.exists());
    });
    return () => unsubscribe();
  }, [currentFirebaseUser, viewedUserId]);

  // Fetch Match Request Status
  useEffect(() => {
    if (!currentFirebaseUser || !viewedUserId || currentFirebaseUser.uid === viewedUserId) {
      setRequestStatus('none'); // Reset if no user or viewing own profile
      return;
    }
    
    const reqId = getCompositeId(currentFirebaseUser.uid, viewedUserId);
    setMatchRequestId(reqId);
    const requestDocRef = doc(db, "matchRequests", reqId);

    const unsubscribe = onSnapshot(requestDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'accepted') {
          setRequestStatus('accepted');
        } else if (data.status === 'pending') {
          if (data.senderUid === currentFirebaseUser.uid) {
            setRequestStatus('pending_sent');
          } else {
            setRequestStatus('pending_received');
          }
        } else if (data.status === 'declined_by_sender' && data.senderUid === currentFirebaseUser.uid) {
            setRequestStatus('none'); // Or a specific "you declined" state
        } else if (data.status === 'declined_by_receiver' && data.receiverUid === currentFirebaseUser.uid) {
            setRequestStatus('none'); // Or a specific "you declined" state
        } else if (data.status.startsWith('declined')) {
            setRequestStatus('none'); // Other party declined
        } else {
          setRequestStatus('none');
        }
      } else {
        setRequestStatus('none');
      }
    });
    return () => unsubscribe();
  }, [currentFirebaseUser, viewedUserId]);


  useEffect(() => {
    if (loggedInUserProfile && viewedUserProfile && viewedUserId !== '0' && currentFirebaseUser && currentFirebaseUser.uid !== viewedUserProfile.userId) {
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
          // setError("Failed to get AI compatibility: " + e.message); // Commented to avoid overwriting profile load errors
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

  const allPhotos = React.useMemo(() => {
    const photos: StoredPhoto[] = [];
    if (viewedUserProfile?.photoURL) {
      photos.push({ id: 'main-profile', url: viewedUserProfile.photoURL, hint: viewedUserProfile.dataAiHint || 'profile main' });
    }
    if (viewedUserProfile?.additionalPhotoUrls) {
      photos.push(...viewedUserProfile.additionalPhotoUrls);
    }
    if (photos.length === 0 && viewedUserProfile?.name) {
      photos.push({ id: 'placeholder-gallery', url: `https://placehold.co/300x400.png?text=${viewedUserProfile.name.substring(0, 1)}`, hint: 'placeholder person' });
    }
    return photos;
  }, [viewedUserProfile]);

  useEffect(() => {
    if (allPhotos.length > 0 && !mainImage) {
      setMainImage(allPhotos[0]);
    }
  }, [allPhotos, mainImage]);

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
      toast({ title: "Error", description: `Failed to ${hasLiked ? 'unlike' : 'like'}: ${e.message}`, variant: "destructive" });
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
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Store participant UIDs for easier querying of who is involved, if needed
        participants: [currentFirebaseUser.uid, viewedUserProfile.userId].sort() 
      });
      setRequestStatus('pending_sent');
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
      await deleteDoc(requestDocRef); // Or update status to 'cancelled_by_sender'
      setRequestStatus('none');
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
    batch.set(chatDocRef, {
        participants: [user1Uid, user2Uid].sort(),
        participantDetails: {
            [user1Uid]: {
                displayName: user1Data.displayName || "User",
                photoURL: user1Data.photoURL || "https://placehold.co/100x100.png"
            },
            [user2Uid]: {
                displayName: user2Data.displayName || "User",
                photoURL: user2Data.photoURL || "https://placehold.co/100x100.png"
            }
        },
        lastMessageText: "You are now connected!",
        lastMessageSenderId: null, // System message or null
        lastMessageTimestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        unreadBy: { [user1Uid]: 0, [user2Uid]: 0 } 
    }, { merge: true }); // Merge true to avoid overwriting if a chat somehow pre-existed with different partial data
    await batch.commit();
    return chatId;
  };

  const handleAcceptRequest = async () => {
    if (!currentFirebaseUser || !viewedUserProfile || !matchRequestId || isProcessingRequest) return;
    setIsProcessingRequest(true);
    const requestDocRef = doc(db, "matchRequests", matchRequestId);
    try {
      await updateDoc(requestDocRef, { status: 'accepted', updatedAt: serverTimestamp() });
      await createChatDocument(currentFirebaseUser.uid, viewedUserProfile.userId);
      setRequestStatus('accepted');
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
      // Determine if current user is sender or receiver to set decline status correctly
      const requestSnap = await getDoc(requestDocRef);
      if(!requestSnap.exists()) {
        throw new Error("Request document not found.");
      }
      const requestData = requestSnap.data();
      const declineStatus = currentFirebaseUser.uid === requestData.senderUid ? 'declined_by_sender' : 'declined_by_receiver';

      await updateDoc(requestDocRef, { status: declineStatus, updatedAt: serverTimestamp() });
      setRequestStatus('none'); // Or a more specific 'declined_by_me' status
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
          <Button 
            onClick={handleLikeToggle} 
            disabled={isLiking} 
            variant={hasLiked ? "default" : "outline"}
            className="flex-1"
          >
            {isLiking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className={cn("mr-2 h-4 w-4", hasLiked && "fill-current")} />}
            {hasLiked ? "Liked" : "Like"}
          </Button>

          {requestStatus === 'none' && (
            <Button onClick={handleSendRequest} disabled={isProcessingRequest} className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              {isProcessingRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />} Send Request
            </Button>
          )}
          {requestStatus === 'pending_sent' && (
            <Button onClick={handleCancelRequest} disabled={isProcessingRequest} variant="outline" className="flex-1">
              {isProcessingRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Request Sent
            </Button>
          )}
          {requestStatus === 'pending_received' && (
            <>
              <Button onClick={handleAcceptRequest} disabled={isProcessingRequest} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                {isProcessingRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />} Accept
              </Button>
              <Button onClick={handleDeclineRequest} disabled={isProcessingRequest} variant="destructive" className="flex-1">
                {isProcessingRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />} Decline
              </Button>
            </>
          )}
          {requestStatus === 'accepted' && (
            <Button 
              asChild 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isProcessingRequest}
            >
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
            <div className="md:w-1/2"><Skeleton className="h-[400px] md:h-full w-full" /></div>
            <div className="md:w-1/2 p-6 md:p-8 space-y-4">
              <Skeleton className="h-10 w-3/4" /> <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-5 w-1/2" /> <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (error && !viewedUserProfile) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
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
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Profile Not Found</AlertTitle>
          <AlertDescription>The profile you are looking for does not exist.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Card className="overflow-hidden shadow-xl">
        <div className="md:flex">
          <div className="md:w-1/2 relative">
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={mainImage.hint || `Profile photo of ${viewedUserProfile.name}`}
                width={600}
                height={800}
                className="object-cover w-full h-[400px] md:h-full bg-muted"
                priority
                data-ai-hint={mainImage.hint}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/600x800.png?text=${viewedUserProfile.name ? viewedUserProfile.name.substring(0, 1) : 'P'}`;
                  (e.target as HTMLImageElement).setAttribute('data-ai-hint', 'placeholder error');
                }}
              />
            ) : <Skeleton className="h-[400px] md:h-full w-full" />}

            {allPhotos.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 px-2">
                <div className="flex space-x-2 bg-black/30 backdrop-blur-sm p-1.5 rounded-lg overflow-x-auto max-w-full justify-center">
                  {allPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setMainImage(photo)}
                      aria-label={`View photo ${photo.id}`}
                      className={`block w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${mainImage?.id === photo.id ? 'border-primary scale-110' : 'border-transparent hover:border-white/50'}`}
                    >
                      <Image src={photo.url} alt={photo.hint || 'thumbnail'} width={48} height={48} className="object-cover w-full h-full" data-ai-hint={photo.hint} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-3xl md:text-4xl text-primary">{viewedUserProfile.name}</CardTitle>
                {viewedUserProfile.isVerified && (
                  <Badge variant="default" className="bg-green-500 text-white flex items-center gap-1 text-xs px-2 py-0.5">
                    <CheckCircle className="h-3.5 w-3.5" /> Verified
                  </Badge>
                )}
              </div>
              {viewedUserProfile.age && viewedUserProfile.age > 0 ? (
                <CardDescription className="text-lg text-muted-foreground">{viewedUserProfile.age} years old</CardDescription>
              ) : <CardDescription className="text-lg text-muted-foreground">Age not specified</CardDescription>}
            </CardHeader>

            <CardContent className="p-0 space-y-3 md:space-y-4 flex-grow">
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><Briefcase className="mr-2 h-4 w-4 text-primary/80" />Profession</h3>
                <p className="text-foreground/80 text-sm">{viewedUserProfile.profession || "Not specified"}</p>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><MapPin className="mr-2 h-4 w-4 text-primary/80" />Location</h3>
                <p className="text-foreground/80 text-sm">{viewedUserProfile.location || "Not specified"}</p>
              </div>
              {viewedUserProfile.height && viewedUserProfile.height > 0 && (
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><Ruler className="mr-2 h-4 w-4 text-primary/80" />Height</h3>
                  <p className="text-foreground/80 text-sm">{viewedUserProfile.height} cm</p>
                </div>
              )}
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><Languages className="mr-2 h-4 w-4 text-primary/80" />Languages</h3>
                <p className="text-foreground/80 text-sm">{viewedUserProfile.language || "Not specified"}</p>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><Cake className="mr-2 h-4 w-4 text-primary/80" />Religion & Caste</h3>
                <p className="text-foreground/80 text-sm">{viewedUserProfile.religion || "N/A"}, {viewedUserProfile.caste || "N/A"}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pt-2 border-t mt-3">
                {viewedUserProfile.sunSign && <div><strong className="text-foreground/90">Sun Sign:</strong> {viewedUserProfile.sunSign}</div>}
                {viewedUserProfile.moonSign && <div><strong className="text-foreground/90">Moon Sign:</strong> {viewedUserProfile.moonSign}</div>}
                {viewedUserProfile.nakshatra && <div className="col-span-full sm:col-span-1"><strong className="text-foreground/90">Nakshatra:</strong> {viewedUserProfile.nakshatra}</div>}
              </div>

              {viewedUserProfile.bio && (
                <div className="space-y-1 pt-2 border-t mt-3">
                  <h3 className="font-semibold text-foreground/90 text-sm flex items-center"><BookOpen className="mr-2 h-4 w-4 text-primary/80" />About Me</h3>
                  <p className="text-foreground/80 leading-relaxed text-sm whitespace-pre-line">{viewedUserProfile.bio}</p>
                </div>
              )}

              {viewedUserProfile.hobbies && viewedUserProfile.hobbies.length > 0 && (
                <div className="space-y-1 pt-2 border-t mt-3">
                  <h3 className="font-semibold text-foreground/90 text-sm flex items-center"><ImageIconLucide className="mr-2 h-4 w-4 text-primary/80" />Interests & Hobbies</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {viewedUserProfile.hobbies.map((interest: string) => (
                      <Badge key={interest} variant="secondary" className="bg-accent/10 text-accent-foreground/90 border-accent/20 text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {viewedUserProfile.favoriteMovies && viewedUserProfile.favoriteMovies.length > 0 && (
                <div className="space-y-1 pt-2 border-t mt-1">
                  <h3 className="font-semibold text-foreground/90 text-sm flex items-center"><Film className="mr-2 h-4 w-4 text-primary/80" />Favorite Movies</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {viewedUserProfile.favoriteMovies.map((movie: string) => (
                      <Badge key={movie} variant="outline" className="text-xs">{movie}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {viewedUserProfile.favoriteMusic && viewedUserProfile.favoriteMusic.length > 0 && (
                <div className="space-y-1 pt-2 border-t mt-1">
                  <h3 className="font-semibold text-foreground/90 text-sm flex items-center"><Music className="mr-2 h-4 w-4 text-primary/80" />Favorite Music</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {viewedUserProfile.favoriteMusic.map((music: string) => (
                      <Badge key={music} variant="outline" className="text-xs">{music}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2 border-t mt-3">
                {viewedUserProfile.educationLevel && <div><strong className="text-foreground/90 flex items-center"><School className="mr-1 h-4 w-4 text-primary/70" />Education:</strong> {viewedUserProfile.educationLevel}</div>}
                {viewedUserProfile.smokingHabits && <div><strong className="text-foreground/90 flex items-center"><Cigarette className="mr-1 h-4 w-4 text-primary/70" />Smoking:</strong> {viewedUserProfile.smokingHabits}</div>}
                {viewedUserProfile.drinkingHabits && <div className="col-span-full sm:col-span-1"><strong className="text-foreground/90 flex items-center"><Droplet className="mr-1 h-4 w-4 text-primary/70" />Drinking:</strong> {viewedUserProfile.drinkingHabits}</div>}
              </div>
            </CardContent>
            {renderActionButtons()}
          </div>
        </div>
      </Card>

      {error && viewedUserProfile && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {currentFirebaseUser && viewedUserProfile && currentFirebaseUser.uid !== viewedUserProfile.userId && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2">
              <Brain className="h-6 w-6" /> AI Compatibility Insights
            </CardTitle>
            <CardDescription>How you match with {viewedUserProfile.name}, according to our AI.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAiAnalysis && (
              <div className="space-y-3 text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">AI is analyzing your compatibility...</p>
              </div>
            )}
            {!isLoadingAiAnalysis && aiMatchResult && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-foreground">Overall Compatibility Score:</span>
                    <span className="text-lg font-bold text-primary">{aiMatchResult.score}/100</span>
                  </div>
                  <Progress value={aiMatchResult.score} className="h-3" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground/90 mb-1">AI Reasoning:</h4>
                  <p className="text-sm text-foreground/80 whitespace-pre-line bg-muted/30 p-3 rounded-md">
                    {aiMatchResult.reasoning}
                  </p>
                </div>
              </div>
            )}
            {!isLoadingAiAnalysis && !aiMatchResult && !error && loggedInUserProfile && (
              <p className="text-sm text-muted-foreground">Compatibility analysis will appear here once available.</p>
            )}
            {!isLoadingAiAnalysis && !loggedInUserProfile && !error && !isLoadingLoggedInUser && (
              <p className="text-sm text-muted-foreground">Please log in to see AI compatibility insights.</p>
            )}
          </CardContent>
        </Card>
      )}

      {viewedUserProfile.additionalPhotoUrls && viewedUserProfile.additionalPhotoUrls.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2">
              <GalleryHorizontal className="h-6 w-6" /> Photo Gallery
            </CardTitle>
            <CardDescription>More photos from {viewedUserProfile.name}.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {allPhotos.map((photo) => (
              <button key={photo.id} onClick={() => setMainImage(photo)} className="aspect-square rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary ring-offset-2 block">
                <Image
                  src={photo.url}
                  alt={photo.hint || `Photo from ${viewedUserProfile.name}`}
                  width={200}
                  height={200}
                  className="object-cover w-full h-full"
                  data-ai-hint={photo.hint}
                />
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
