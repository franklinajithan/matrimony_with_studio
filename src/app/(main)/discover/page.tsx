
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, MapPin, Briefcase, CheckCircle, Search as SearchIcon, Loader2, AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase/config';
import { collection, getDocs, query, where, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';

interface Profile {
  id: string;
  name: string;
  age?: number; // Age calculation can be complex, making it optional for now
  profession: string;
  location: string;
  imageUrl: string;
  dataAiHint: string;
  isVerified: boolean;
  interests: string[];
  dob?: string; // To potentially calculate age
}

const calculateAge = (dobString?: string): number | undefined => {
  if (!dobString) return undefined;
  try {
    const birthDate = new Date(dobString);
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

const PROFILES_PER_PAGE = 8;

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchProfiles = async (initialLoad = true) => {
    if (!hasMore && !initialLoad) return;
    if (initialLoad) {
      setIsLoading(true);
      setProfiles([]); // Reset for initial load
      setLastVisible(null);
      setHasMore(true);
    } else {
      setIsFetchingMore(true);
    }
    setError(null);

    try {
      let profilesQuery;
      const usersCollectionRef = collection(db, "users");

      if (initialLoad) {
        profilesQuery = query(usersCollectionRef, limit(PROFILES_PER_PAGE));
      } else if (lastVisible) {
        profilesQuery = query(usersCollectionRef, startAfter(lastVisible), limit(PROFILES_PER_PAGE));
      } else {
         setIsLoading(false);
         setIsFetchingMore(false);
        return; // Should not happen if hasMore is true
      }
      
      const querySnapshot = await getDocs(profilesQuery);
      const fetchedProfiles: Profile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Exclude current user from discover list
        if (currentUser && doc.id === currentUser.uid) {
          return;
        }
        fetchedProfiles.push({
          id: doc.id,
          name: data.displayName || "N/A",
          age: calculateAge(data.dob),
          profession: data.profession || "N/A",
          location: data.location || "N/A",
          imageUrl: data.photoURL || `https://placehold.co/300x400.png?text=${data.displayName ? data.displayName.substring(0,1) : 'P'}`,
          dataAiHint: data.photoURL ? "person profile" : "placeholder person",
          isVerified: data.isVerified || false, // Assuming an isVerified field
          interests: data.hobbies ? data.hobbies.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          dob: data.dob,
        });
      });
      
      setProfiles(prevProfiles => initialLoad ? fetchedProfiles : [...prevProfiles, ...fetchedProfiles]);
      
      const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(newLastVisible);
      setHasMore(querySnapshot.docs.length === PROFILES_PER_PAGE);

    } catch (e: any) {
      console.error("Error fetching profiles: ", e);
      setError("Failed to load profiles. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    // Initial fetch when component mounts or current user changes (to re-filter)
    fetchProfiles(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);


  if (isLoading && profiles.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-4xl font-semibold text-gray-800">Discover Your Match</h1>
          <p className="mt-2 text-lg text-muted-foreground">Loading potential partners...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(PROFILES_PER_PAGE)].map((_, i) => (
            <Card key={i} className="overflow-hidden shadow-lg flex flex-col">
              <Skeleton className="w-full h-80" />
              <CardHeader className="p-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader>
              <CardContent className="p-4 pt-0 flex-grow"><Skeleton className="h-10 w-full" /></CardContent>
              <CardFooter className="p-3 border-t grid grid-cols-3 gap-2"><Skeleton className="h-10 w-full col-span-1" /><Skeleton className="h-10 w-full col-span-1" /><Skeleton className="h-10 w-full col-span-1" /></CardFooter>
            </Card>
          ))}
        </div>
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
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-semibold text-gray-800">Discover Your Match</h1>
        <p className="mt-2 text-lg text-muted-foreground">Swipe, like, and connect with potential partners.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {profiles.map((profile) => (
          <Card key={profile.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <div className="relative">
              <Link href={`/profile/${profile.id}`} passHref>
                <Image
                  src={profile.imageUrl}
                  alt={profile.name}
                  width={300}
                  height={400}
                  className="w-full h-80 object-cover cursor-pointer bg-muted" // Added bg-muted for placeholder state
                  data-ai-hint={profile.dataAiHint}
                  onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/300x400.png?text=${profile.name ? profile.name.substring(0,1) : 'P'}`;
                      (e.target as HTMLImageElement).setAttribute('data-ai-hint', 'placeholder person');
                  }}
                />
              </Link>
              {profile.isVerified && (
                <Badge variant="default" className="absolute top-2 right-2 bg-green-500 text-white flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>
            <CardHeader className="p-4">
              <Link href={`/profile/${profile.id}`} passHref>
                <CardTitle className="font-headline text-xl text-primary hover:underline cursor-pointer">{profile.name}{profile.age ? `, ${profile.age}` : ''}</CardTitle>
              </Link>
              <CardDescription className="text-sm">
                <span className="flex items-center text-muted-foreground"><Briefcase className="mr-1 h-3.5 w-3.5" />{profile.profession}</span>
                <span className="flex items-center text-muted-foreground"><MapPin className="mr-1 h-3.5 w-3.5" />{profile.location}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
              {profile.interests.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {profile.interests.slice(0, 3).map(interest => ( // Show max 3 interests
                    <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
                  ))}
                  {profile.interests.length > 3 && <Badge variant="outline" className="text-xs">+{profile.interests.length - 3} more</Badge>}
                </div>
              ) : <p className="text-xs text-muted-foreground">No interests listed.</p>}
            </CardContent>
            <CardFooter className="p-3 border-t grid grid-cols-3 gap-2">
              <Button variant="outline" size="icon" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                <X className="h-5 w-5" />
                <span className="sr-only">Skip</span>
              </Button>
              <Button variant="outline" size="icon" className="col-span-1 border-primary/50 text-primary hover:bg-primary/10" asChild>
                <Link href={`/profile/${profile.id}`}>
                  <SearchIcon className="h-5 w-5" />
                  <span className="sr-only">View Profile</span>
                </Link>
              </Button>
              <Button variant="outline" size="icon" className="border-green-500/50 text-green-600 hover:bg-green-500/10">
                <Heart className="h-5 w-5" />
                <span className="sr-only">Like</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <div className="text-center mt-12">
        {hasMore && (
          <Button onClick={() => fetchProfiles(false)} variant="outline" size="lg" disabled={isFetchingMore}>
            {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load More Profiles
          </Button>
        )}
        {!hasMore && profiles.length > 0 && (
          <p className="text-muted-foreground">You've reached the end of the list!</p>
        )}
      </div>
    </div>
  );
}

