
"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Briefcase, MapPin, Cake, Languages, CheckCircle, Ruler, Sparkles as SparklesIcon, Brain, Loader2, BookOpen, Film, Music, School, Droplet, Cigarette, Image as ImageIconLucide, GalleryHorizontal } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { intelligentMatchSuggestions, type IntelligentMatchSuggestionsInput, type IntelligentMatchSuggestionsOutput } from '@/ai/flows/intelligent-match-suggestions';
import type { UserProfileSchema as AIUserProfileSchema, PotentialMatchProfileSchema as AIPotentialMatchProfileSchema } from '@/ai/flows/intelligent-match-suggestions';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface StoredPhoto {
  id: string;
  url: string;
  hint: string;
  storagePath?: string; 
}

interface ViewedUserProfileData extends AIPotentialMatchProfileSchema {
  bio?: string;
  photoURL?: string; // Main profile photo
  additionalPhotoUrls?: StoredPhoto[];
  // hobbies, favoriteMovies, favoriteMusic are already string arrays in AIPotentialMatchProfileSchema
}

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

export default function ProfilePage() {
  const params = useParams();
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
                age: calculateAge(data.dob) || 0, // Age needs to be calculated or stored
                religion: data.religion || "",
                caste: data.caste || "",
                language: data.language || "",
                height: Number(data.height) || 0,
                hobbies: typeof data.hobbies === 'string' ? data.hobbies.split(',').map((s:string) => s.trim()).filter(Boolean) : (Array.isArray(data.hobbies) ? data.hobbies : []),
                location: data.location || "",
                profession: data.profession || "",
                sunSign: data.sunSign || undefined,
                moonSign: data.moonSign || undefined,
                nakshatra: data.nakshatra || undefined,
                favoriteMovies: typeof data.favoriteMovies === 'string' ? data.favoriteMovies.split(',').map((s:string) => s.trim()).filter(Boolean) : (Array.isArray(data.favoriteMovies) ? data.favoriteMovies : []),
                favoriteMusic: typeof data.favoriteMusic === 'string' ? data.favoriteMusic.split(',').map((s:string) => s.trim()).filter(Boolean) : (Array.isArray(data.favoriteMusic) ? data.favoriteMusic : []),
                educationLevel: data.educationLevel || undefined,
                smokingHabits: data.smokingHabits || undefined,
                drinkingHabits: data.drinkingHabits || undefined,
             };
            setLoggedInUserProfile(transformedData);
          } else {
            // setError("Logged-in user's profile data not found. Please complete your profile.");
            setLoggedInUserProfile(null); 
          }
        } catch (e: any) {
          console.error("Error fetching logged-in user profile:", e);
          setError("Failed to fetch your profile: " + e.message);
          setLoggedInUserProfile(null);
        } finally {
          setIsLoadingLoggedInUser(false);
        }
      } else {
        // setError("You need to be logged in to see compatibility scores.");
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
            hobbies: typeof data.hobbies === 'string' ? data.hobbies.split(',').map((s:string) => s.trim()).filter(Boolean) : (Array.isArray(data.hobbies) ? data.hobbies : []),
            favoriteMovies: typeof data.favoriteMovies === 'string' ? data.favoriteMovies.split(',').map((s:string) => s.trim()).filter(Boolean) : (Array.isArray(data.favoriteMovies) ? data.favoriteMovies : []),
            favoriteMusic: typeof data.favoriteMusic === 'string' ? data.favoriteMusic.split(',').map((s:string) => s.trim()).filter(Boolean) : (Array.isArray(data.favoriteMusic) ? data.favoriteMusic : []),
            educationLevel: data.educationLevel || undefined,
            smokingHabits: data.smokingHabits || undefined,
            drinkingHabits: data.drinkingHabits || undefined,
            sunSign: data.sunSign || undefined,
            moonSign: data.moonSign || undefined,
            nakshatra: data.nakshatra || undefined,
            bio: data.bio || "No bio provided.",
            photoURL: data.photoURL || `https://placehold.co/600x800.png?text=${data.displayName ? data.displayName.substring(0,1) : 'P'}`,
            additionalPhotoUrls: data.additionalPhotoUrls || [],
            isVerified: data.isVerified || false, // Assuming isVerified field exists
          };
          setViewedUserProfile(profileData);
          if (profileData.photoURL) {
            setMainImage({ id: 'main', url: profileData.photoURL, hint: data.dataAiHint || 'profile main' });
          } else if (profileData.additionalPhotoUrls && profileData.additionalPhotoUrls.length > 0) {
            setMainImage(profileData.additionalPhotoUrls[0]);
          } else {
            setMainImage({ id: 'placeholder', url: `https://placehold.co/600x800.png?text=${profileData.name ? profileData.name.substring(0,1) : 'P'}`, hint: 'placeholder person' });
          }

        } else {
          setError("Profile not found.");
          setViewedUserProfile(null);
        }
      } catch (e: any) {
        console.error("Error fetching viewed user profile:", e);
        setError("Failed to load profile: " + e.message);
        setViewedUserProfile(null);
      } finally {
        setIsLoadingViewedProfile(false);
      }
    };
    fetchViewedProfile();
  }, [viewedUserId]);

  useEffect(() => {
    if (loggedInUserProfile && viewedUserProfile && viewedUserId !== '0' && currentFirebaseUser && currentFirebaseUser.uid !== viewedUserProfile.userId) {
      const performAiAnalysis = async () => {
        setIsLoadingAiAnalysis(true);
        // setError(null); // Keep previous errors unless explicitly cleared for AI analysis
        try {
          // Construct the input for intelligentMatchSuggestions
          // The schema expects hobbies, favoriteMovies, favoriteMusic as string[]
          // Ensure viewedUserProfile matches PotentialMatchProfileSchema for these fields.
          const aiViewedProfileInput: AIPotentialMatchProfileSchema = {
            userId: viewedUserProfile.userId,
            age: viewedUserProfile.age,
            religion: viewedUserProfile.religion,
            caste: viewedUserProfile.caste,
            language: viewedUserProfile.language,
            height: viewedUserProfile.height,
            hobbies: viewedUserProfile.hobbies, // Ensure this is string[]
            location: viewedUserProfile.location,
            profession: viewedUserProfile.profession,
            sunSign: viewedUserProfile.sunSign,
            moonSign: viewedUserProfile.moonSign,
            nakshatra: viewedUserProfile.nakshatra,
            favoriteMovies: viewedUserProfile.favoriteMovies, // Ensure this is string[]
            favoriteMusic: viewedUserProfile.favoriteMusic, // Ensure this is string[]
            educationLevel: viewedUserProfile.educationLevel,
            smokingHabits: viewedUserProfile.smokingHabits,
            drinkingHabits: viewedUserProfile.drinkingHabits,
          };

          const input: IntelligentMatchSuggestionsInput = {
            userProfile: loggedInUserProfile,
            userActivity: { profilesViewed: [], matchesMade: [] }, // Mocked activity
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
            // setError("AI could not generate a compatibility score for this profile.");
          }
        } catch (e: any) {
          console.error("AI analysis error:", e);
          // setError("Failed to get AI compatibility: " + e.message);
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
    if (photos.length === 0 && viewedUserProfile?.name) { // Fallback if no photos at all
        photos.push({id: 'placeholder-gallery', url: `https://placehold.co/300x400.png?text=${viewedUserProfile.name.substring(0,1)}`, hint: 'placeholder person'});
    }
    return photos;
  }, [viewedUserProfile]);

  useEffect(() => { // Set initial main image once allPhotos is populated
    if (allPhotos.length > 0 && !mainImage) {
        setMainImage(allPhotos[0]);
    }
  }, [allPhotos, mainImage]);


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
  
  if (error && !viewedUserProfile) { // Only show full page error if profile itself couldn't load
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!viewedUserProfile) { // Should be caught by error, but as a fallback
     return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <Alert variant="destructive">
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
                    (e.target as HTMLImageElement).src = `https://placehold.co/600x800.png?text=${viewedUserProfile.name ? viewedUserProfile.name.substring(0,1) : 'P'}`;
                    (e.target as HTMLImageElement).setAttribute('data-ai-hint', 'placeholder error');
                }}
              />
            ) : <Skeleton className="h-[400px] md:h-full w-full" /> }

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
              ): <CardDescription className="text-lg text-muted-foreground">Age not specified</CardDescription>}
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
                {viewedUserProfile.educationLevel && <div><strong className="text-foreground/90 flex items-center"><School className="mr-1 h-4 w-4 text-primary/70"/>Education:</strong> {viewedUserProfile.educationLevel}</div>}
                {viewedUserProfile.smokingHabits && <div><strong className="text-foreground/90 flex items-center"><Cigarette className="mr-1 h-4 w-4 text-primary/70"/>Smoking:</strong> {viewedUserProfile.smokingHabits}</div>}
                {viewedUserProfile.drinkingHabits && <div className="col-span-full sm:col-span-1"><strong className="text-foreground/90 flex items-center"><Droplet className="mr-1 h-4 w-4 text-primary/70"/>Drinking:</strong> {viewedUserProfile.drinkingHabits}</div>}
              </div>
            </CardContent>

            <div className="mt-auto pt-6 space-y-3 border-t">
              {currentFirebaseUser && currentFirebaseUser.uid !== viewedUserProfile.userId && (
                <div className="flex space-x-3">
                    <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Heart className="mr-2 h-4 w-4" /> Like
                    </Button>
                    <Button variant="outline" className="flex-1">
                    <MessageSquare className="mr-2 h-4 w-4" /> Message
                    </Button>
                </div>
              )}
               <Button variant="link" className="w-full text-xs text-muted-foreground hover:text-destructive p-0 h-auto">
                  Report Profile
                </Button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Display error related to AI or logged-in user profile fetching, if any, separate from main profile error */}
      {error && viewedUserProfile && (
         <Alert variant="destructive" className="mt-4">
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

