
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Briefcase, MapPin, CheckCircle, Loader2, AlertTriangle, BookOpen, Eye } from 'lucide-react';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { auth, onAuthStateChanged, type AuthUser as FirebaseUser } from '@/lib/supabase/auth';
import { listProfiles } from '@/lib/supabase/profiles';
import { getLikedIds, likeProfile, unlikeProfile } from '@/lib/supabase/likes';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { calculateAge } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  name: string;
  age?: number;
  profession: string;
  location: string;
  imageUrl: string;
  dataAiHint: string;
  isVerified: boolean;
  interests: string[];
  bio?: string;
  dob?: string;
}

interface ProfileWithLikeStatus extends Profile {
  hasLiked: boolean;
}

const PROFILES_PER_PAGE = 8;

function ProfileCardSkeleton() {
  return (
    <Card className="overflow-hidden shadow-lg flex flex-col group transition-all duration-300 ease-in-out hover:shadow-xl">
      <div className="relative w-full h-72 sm:h-80 md:h-96">
        <Skeleton className="w-full h-full" />
      </div>
      <CardContent className="p-4 flex-grow space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full mt-1" />
        <Skeleton className="h-4 w-5/6 mt-1" />
        <div className="flex flex-wrap gap-1 pt-1">
          <Skeleton className="h-5 w-1/4 rounded-full" />
          <Skeleton className="h-5 w-1/3 rounded-full" />
          <Skeleton className="h-5 w-1/4 rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="p-3 border-t">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}


export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<ProfileWithLikeStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [lastOffset, setLastOffset] = useState(0);
  const lastOffsetRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isLiking, setIsLiking] = useState<Record<string, boolean>>({}); // Tracks liking state per profile ID
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const fetchLikeStatusForProfiles = async (fetchedProfiles: Profile[], user: FirebaseUser): Promise<ProfileWithLikeStatus[]> => {
    const likedIds = await getLikedIds(user.uid, fetchedProfiles.map((profile) => profile.id));
    return fetchedProfiles.map((profile) => ({
      ...profile,
      hasLiked: likedIds.has(profile.id),
    }));
  };

  const fetchProfiles = useCallback(async (initialLoad = true) => {
    setError(null);

    if (initialLoad) {
      setIsLoading(true);
      setProfiles([]);
      setLastOffset(0);
      lastOffsetRef.current = 0;
      setHasMore(true);
    } else {
      if (isFetchingMore || !hasMore) {
        return;
      }
      setIsFetchingMore(true);
    }

    try {
      const offset = initialLoad ? 0 : lastOffsetRef.current;
      const rows = await listProfiles({
        limit: PROFILES_PER_PAGE,
        offset,
        excludeId: currentUser?.uid,
      });

      const fetchedProfilesBatch: Profile[] = rows.map((data) => ({
        id: data.id,
        name: data.displayName || "N/A",
        age: data.ageYears ?? calculateAge(data.dob),
        profession: data.profession || "N/A",
        location: data.location || "N/A",
        imageUrl: data.photoURL || `https://placehold.co/600x800.png?text=${data.displayName ? data.displayName.substring(0,1) : 'P'}`,
        dataAiHint: data.dataAiHint || (data.photoURL && !data.photoURL.includes('placehold.co') ? "person profile" : "placeholder person"),
        isVerified: data.isVerified || false,
        interests: data.hobbies ? String(data.hobbies).split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        bio: data.bio || undefined,
        dob: data.dob,
      }));
      
      let profilesToSet: ProfileWithLikeStatus[] = [];
      if (currentUser) {
        profilesToSet = await fetchLikeStatusForProfiles(fetchedProfilesBatch, currentUser);
      } else {
        profilesToSet = fetchedProfilesBatch.map(p => ({ ...p, hasLiked: false }));
      }
      
      setProfiles(prevProfiles => initialLoad ? profilesToSet : [...prevProfiles, ...profilesToSet]);
      
      lastOffsetRef.current = offset + rows.length;
      setLastOffset(offset + rows.length);
      setHasMore(rows.length === PROFILES_PER_PAGE);

    } catch (e: any) {
      console.error("Error fetching profiles: ", e);
      setError("Failed to load profiles. Please try again later. " + e.message);
      if (!initialLoad) setHasMore(false);
    } finally {
      if (initialLoad) setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [currentUser]); // Added currentUser as dependency

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      setIsLoading(false);
      setProfiles([]);
      setError(null);
      return;
    }
    fetchProfiles(true);
  }, [currentUser, authReady, fetchProfiles]);

  const handleLikeToggle = async (profileId: string, currentLikeStatus: boolean) => {
    if (!currentUser || currentUser.uid === profileId) {
      toast({ title: "Action not allowed", description: "You cannot like your own profile or must be logged in.", variant: "destructive" });
      return;
    }
    
    setIsLiking(prev => ({ ...prev, [profileId]: true }));

    try {
      if (currentLikeStatus) {
        await unlikeProfile(currentUser.uid, profileId);
        setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, hasLiked: false } : p));
        toast({ title: "Unliked" });
      } else {
        await likeProfile(currentUser.uid, profileId);
        setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, hasLiked: true } : p));
        toast({ title: "Liked!" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: `Failed to ${currentLikeStatus ? 'unlike' : 'like'}: ${e.message}`, variant: "destructive" });
      // Revert optimistic update on error if needed, though Firestore listener would eventually correct it.
    } finally {
      setIsLiking(prev => ({ ...prev, [profileId]: false }));
    }
  };


  if (!authReady || (isLoading && profiles.length === 0 && currentUser)) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-semibold text-gray-800">Discover Your Match</h1>
          <p className="mt-2 text-lg text-muted-foreground">Loading potential partners...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(PROFILES_PER_PAGE)].map((_, i) => <ProfileCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="space-y-6 px-4 py-12 text-center">
        <h1 className="font-headline text-4xl font-semibold text-gray-800">Discover your match</h1>
        <p className="mx-auto max-w-lg text-lg text-muted-foreground">
          Sign in to browse published member profiles. Unpublished and private details stay hidden.
        </p>
        <Button asChild className="min-h-11">
          <Link href="/login?next=/discover">Log in to continue</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 text-center">
         <h1 className="font-headline text-4xl font-semibold text-gray-800">Discover Your Match</h1>
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Profiles</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
         <Button onClick={() => fetchProfiles(true)} variant="outline">Try Again</Button>
      </div>
    );
  }
  
  if (!isLoading && profiles.length === 0 && !error) {
     return (
      <div className="space-y-8 text-center">
        <h1 className="font-headline text-4xl font-semibold text-gray-800">Discover Your Match</h1>
        <p className="mt-2 text-lg text-muted-foreground">No profiles found. Check back later or adjust your preferences!</p>
        {/* Removed redundant status message from here, handled below load more button */}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-semibold text-gray-800">Discover Your Match</h1>
        <p className="mt-2 text-lg text-muted-foreground">Explore profiles and find your connection.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {profiles.map((profile) => (
          <Card key={profile.id} className="overflow-hidden shadow-md flex flex-col group transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-[1.02]">
            <div className="relative w-full h-72 sm:h-80 md:h-96"> {/* Increased height */}
              <Link href={`/profile/${profile.id}`} passHref className="block w-full h-full">
                <Image
                  src={profile.imageUrl}
                  alt={profile.name}
                  fill // Use fill and object-cover for responsive images
                  className="object-cover bg-muted"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  data-ai-hint={profile.dataAiHint}
                  onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/600x800.png?text=${profile.name ? profile.name.substring(0,1) : 'P'}`;
                      (e.target as HTMLImageElement).setAttribute('data-ai-hint', 'placeholder person');
                  }}
                />
              </Link>
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                <Link href={`/profile/${profile.id}`} passHref>
                  <h3 className="font-headline text-xl text-white group-hover:text-primary transition-colors">{profile.name}{profile.age ? `, ${profile.age}` : ''}</h3>
                </Link>
              </div>
              {profile.isVerified && (
                <Badge variant="default" className="absolute top-3 right-3 bg-green-500 text-white flex items-center gap-1 text-xs shadow-md">
                  <CheckCircle className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>
            
            <CardContent className="p-4 flex-grow space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Briefcase className="mr-1.5 h-4 w-4 shrink-0" />
                <span className="truncate">{profile.profession || "Not specified"}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-1.5 h-4 w-4 shrink-0" />
                <span className="truncate">{profile.location || "Not specified"}</span>
              </div>
              
              {profile.bio && (
                <div className="mt-2">
                  <h4 className="text-xs font-semibold text-foreground/80 flex items-center mb-0.5"><BookOpen className="mr-1.5 h-3.5 w-3.5"/>About</h4>
                  <p className="text-xs text-foreground/70 line-clamp-2">{profile.bio}</p>
                </div>
              )}

              {profile.interests.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-foreground/80 mb-1">Interests</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.slice(0, 4).map(interest => ( // Show up to 4 interests
                      <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
                    ))}
                    {profile.interests.length > 4 && <Badge variant="outline" className="text-xs">+{profile.interests.length - 4} more</Badge>}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="p-3 border-t flex items-center justify-between gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                asChild
              >
                <Link href={`/profile/${profile.id}`}>
                  <Eye className="mr-1.5 h-4 w-4" /> View Profile
                </Link>
              </Button>
              <Button 
                variant={profile.hasLiked ? "default" : "outline"} 
                size="icon" 
                className={cn(
                  "border-rose-500/50 hover:bg-rose-500/10",
                  profile.hasLiked ? "bg-rose-500 text-white hover:bg-rose-600" : "text-rose-500"
                )}
                onClick={() => handleLikeToggle(profile.id, profile.hasLiked)}
                disabled={isLiking[profile.id] || (currentUser?.uid === profile.id)}
                aria-label={profile.hasLiked ? "Unlike" : "Like"}
              >
                {isLiking[profile.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4", profile.hasLiked && "fill-current")} />}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

       <div className="text-center mt-12 mb-4">
        {hasMore && !isFetchingMore && !isLoading && (
          <Button onClick={() => fetchProfiles(false)} variant="outline" size="lg">
            Load More Profiles
          </Button>
        )}
        {isFetchingMore && (
           <Button variant="outline" size="lg" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
          </Button>
        )}
        {!hasMore && profiles.length > 0 && !isLoading && !isFetchingMore && (
          <p className="text-muted-foreground">You've reached the end of the list!</p>
        )}
      </div>
    </div>
  );
}
