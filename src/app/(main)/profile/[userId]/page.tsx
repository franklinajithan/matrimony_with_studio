
"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Briefcase, MapPin, Cake, Languages, CheckCircle, Ruler, Sparkles, Brain, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { intelligentMatchSuggestions, type IntelligentMatchSuggestionsInput, type IntelligentMatchSuggestionsOutput } from '@/ai/flows/intelligent-match-suggestions';
import type { UserProfileSchema as AIUserProfileSchema, PotentialMatchProfileSchema as AIPotentialMatchProfileSchema } from '@/ai/flows/intelligent-match-suggestions'; // Import the Zod schema type
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';


// Enhanced Mock Data Structure
const mockProfilesData: { [key: string]: any } = {
  '1': { 
    userId: '1', name: 'Rohan Sharma', age: 30, profession: 'Doctor', location: 'Delhi, India', 
    bio: "Loves coding, chai, and long walks. Looking for someone with a good sense of humor.", 
    hobbies: ['Music', 'Books', 'Cricket'], 
    photos: [{ id: 'p1', url: 'https://placehold.co/600x800.png', alt: 'Rohan Sharma Profile Photo 1', dataAiHint: 'man indian' }], 
    religion: 'Hindu', caste: 'Sharma', language: 'Hindi, English', height: 175, isVerified: true, 
    sunSign: 'Aries', moonSign: 'Mesha', nakshatra: 'Ashwini',
    favoriteMovies: ['The Shawshank Redemption', 'Inception'], favoriteMusic: ['Classical', 'Rock'],
    educationLevel: "Master's Degree", smokingHabits: 'Never', drinkingHabits: 'Occasionally/Socially'
  },
  '2': { 
    userId: '2', name: 'Priya Patel', age: 27, profession: 'Architect', location: 'Bangalore, India', 
    bio: "Creative soul, passionate about design. Enjoys art, yoga, and exploring cafes.", 
    hobbies: ['Art', 'Yoga', 'Travel'], 
    photos: [{ id: 'p1', url: 'https://placehold.co/600x800.png', alt: 'Priya Patel Profile Photo 1', dataAiHint: 'woman professional' }], 
    religion: 'Hindu', caste: 'Patel', language: 'Gujarati, English', height: 160, isVerified: false, 
    sunSign: 'Taurus', moonSign: 'Vrishabha', nakshatra: 'Rohini',
    favoriteMovies: ['Amelie', 'Spirited Away'], favoriteMusic: ['Indie Folk', 'Jazz'],
    educationLevel: "Bachelor's Degree", smokingHabits: 'Never', drinkingHabits: 'Never'
  },
  // Add more comprehensive mock profiles here following the same structure
  'default': { 
    userId: '0', name: 'User Not Found', age: 0, profession: 'N/A', location: 'N/A', 
    bio: "This profile could not be found.", hobbies: [], 
    photos: [{id: 'pd', url: 'https://placehold.co/600x800.png', alt: 'Profile not found', dataAiHint: 'placeholder question'}], 
    religion: 'N/A', caste: 'N/A', language: 'N/A', height: 0, isVerified: false, 
    sunSign: 'N/A', moonSign: 'N/A', nakshatra: 'N/A',
    favoriteMovies: [], favoriteMusic: [],
    educationLevel: 'N/A', smokingHabits: 'N/A', drinkingHabits: 'N/A'
  }
};


export default function ProfilePage() {
  const params = useParams();
  const viewedUserId = params.userId as string;

  const [viewedUserProfile, setViewedUserProfile] = useState<AIPotentialMatchProfileSchema | null>(null);
  const [loggedInUserProfile, setLoggedInUserProfile] = useState<AIUserProfileSchema | null>(null);
  const [aiMatchResult, setAiMatchResult] = useState<{ score: number; reasoning: string } | null>(null);
  
  const [isLoadingViewedProfile, setIsLoadingViewedProfile] = useState(true);
  const [isLoadingLoggedInUser, setIsLoadingLoggedInUser] = useState(true);
  const [isLoadingAiAnalysis, setIsLoadingAiAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch viewed user's profile (using mock for now)
    const profileData = mockProfilesData[viewedUserId] || mockProfilesData['default'];
    
    // Ensure mock data conforms to AIPotentialMatchProfileSchema, especially array fields
    const formattedProfileData: AIPotentialMatchProfileSchema = {
        ...profileData,
        userId: profileData.userId || viewedUserId, // Ensure userId is part of the object
        height: Number(profileData.height) || 0, // Ensure height is a number
        hobbies: Array.isArray(profileData.hobbies) ? profileData.hobbies : (profileData.hobbies?.split(',').map((s:string) => s.trim()).filter(Boolean) || []),
        favoriteMovies: Array.isArray(profileData.favoriteMovies) ? profileData.favoriteMovies : (profileData.favoriteMovies?.split(',').map((s:string) => s.trim()).filter(Boolean) || []),
        favoriteMusic: Array.isArray(profileData.favoriteMusic) ? profileData.favoriteMusic : (profileData.favoriteMusic?.split(',').map((s:string) => s.trim()).filter(Boolean) || []),
    };
    setViewedUserProfile(formattedProfileData);
    setIsLoadingViewedProfile(false);
  }, [viewedUserId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
             const data = docSnap.data();
             // Transform Firestore data to match AIUserProfileSchema
             const transformedData: AIUserProfileSchema = {
                age: Number(data.age) || 0,
                religion: data.religion || "",
                caste: data.caste || "",
                language: data.language || "", // Assuming language is a string, if it's stored differently adjust here
                height: Number(data.height) || 0,
                hobbies: Array.isArray(data.hobbies) ? data.hobbies : (data.hobbies?.split(',').map((s:string) => s.trim()).filter(Boolean) || []),
                location: data.location || "",
                profession: data.profession || "",
                sunSign: data.sunSign || undefined,
                moonSign: data.moonSign || undefined,
                nakshatra: data.nakshatra || undefined,
                favoriteMovies: Array.isArray(data.favoriteMovies) ? data.favoriteMovies : (data.favoriteMovies?.split(',').map((s:string) => s.trim()).filter(Boolean) || []),
                favoriteMusic: Array.isArray(data.favoriteMusic) ? data.favoriteMusic : (data.favoriteMusic?.split(',').map((s:string) => s.trim()).filter(Boolean) || []),
                educationLevel: data.educationLevel || undefined,
                smokingHabits: data.smokingHabits || undefined,
                drinkingHabits: data.drinkingHabits || undefined,
             };
            setLoggedInUserProfile(transformedData);
          } else {
            setError("Logged-in user's profile data not found. Please complete your profile.");
            setLoggedInUserProfile(null); 
          }
        } catch (e: any) {
          console.error("Error fetching logged-in user profile:", e);
          setError("Failed to fetch your profile: " + e.message);
          setLoggedInUserProfile(null);
        }
      } else {
        setError("You need to be logged in to see compatibility scores.");
        setLoggedInUserProfile(null);
      }
      setIsLoadingLoggedInUser(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loggedInUserProfile && viewedUserProfile && viewedUserProfile.userId !== '0' && auth.currentUser && auth.currentUser.uid !== viewedUserProfile.userId) {
      const performAiAnalysis = async () => {
        setIsLoadingAiAnalysis(true);
        setError(null);
        try {
          const input: IntelligentMatchSuggestionsInput = {
            userProfile: loggedInUserProfile,
            userActivity: { profilesViewed: [], matchesMade: [] }, // Mocked activity
            allPotentialMatches: [viewedUserProfile],
          };
          const suggestions = await intelligentMatchSuggestions(input);
          if (suggestions && suggestions.length > 0) {
            setAiMatchResult({
              score: suggestions[0].compatibilityScore,
              reasoning: suggestions[0].reasoning,
            });
          } else {
            setAiMatchResult(null);
            setError("AI could not generate a compatibility score for this profile.");
          }
        } catch (e: any) {
          console.error("AI analysis error:", e);
          setError("Failed to get AI compatibility: " + e.message);
          setAiMatchResult(null);
        } finally {
          setIsLoadingAiAnalysis(false);
        }
      };
      performAiAnalysis();
    } else if (auth.currentUser && viewedUserProfile && auth.currentUser.uid === viewedUserProfile.userId) {
      // Don't run AI analysis if viewing own profile
      setIsLoadingAiAnalysis(false);
      setAiMatchResult(null);
    }
  }, [loggedInUserProfile, viewedUserProfile]);

  if (isLoadingViewedProfile || isLoadingLoggedInUser) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="shadow-xl">
          <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!viewedUserProfile || viewedUserProfile.userId === '0') {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <Alert variant="destructive">
          <AlertTitle>Profile Not Found</AlertTitle>
          <AlertDescription>The profile you are looking for does not exist or could not be loaded.</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const currentFirebaseUser = auth.currentUser;


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="overflow-hidden shadow-xl">
        <div className="md:flex">
          <div className="md:w-1/2 relative">
            {viewedUserProfile.photos && viewedUserProfile.photos.length > 0 && (
              <Image
                src={viewedUserProfile.photos[0].url}
                alt={viewedUserProfile.photos[0].alt || `Profile photo of ${viewedUserProfile.name}`}
                width={600}
                height={800}
                className="object-cover w-full h-[400px] md:h-full"
                priority
                data-ai-hint={viewedUserProfile.photos[0].dataAiHint || "profile image"}
              />
            )}
            {viewedUserProfile.photos && viewedUserProfile.photos.length > 1 && (
                 <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {viewedUserProfile.photos.map((photo: any, index: number) => (
                        <button key={photo.id} aria-label={`View photo ${index + 1}`} className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-gray-300 opacity-75 hover:opacity-100'}`}></button>
                    ))}
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
              <CardDescription className="text-lg text-muted-foreground">{viewedUserProfile.age} years old</CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-3 md:space-y-4 flex-grow">
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><Briefcase className="mr-2 h-4 w-4 text-primary/80" />Profession</h3>
                <p className="text-foreground/80 text-sm">{viewedUserProfile.profession}</p>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><MapPin className="mr-2 h-4 w-4 text-primary/80" />Location</h3>
                <p className="text-foreground/80 text-sm">{viewedUserProfile.location}</p>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><Ruler className="mr-2 h-4 w-4 text-primary/80" />Height</h3>
                <p className="text-foreground/80 text-sm">{viewedUserProfile.height} cm</p>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><Languages className="mr-2 h-4 w-4 text-primary/80" />Languages</h3>
                <p className="text-foreground/80 text-sm">{viewedUserProfile.language}</p>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><Cake className="mr-2 h-4 w-4 text-primary/80" />Religion & Caste</h3>
                <p className="text-foreground/80 text-sm">{viewedUserProfile.religion}, {viewedUserProfile.caste}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {viewedUserProfile.sunSign && <div><strong className="text-foreground/90">Sun:</strong> {viewedUserProfile.sunSign}</div>}
                {viewedUserProfile.moonSign && <div><strong className="text-foreground/90">Moon:</strong> {viewedUserProfile.moonSign}</div>}
                {viewedUserProfile.nakshatra && <div className="col-span-full sm:col-span-1"><strong className="text-foreground/90">Nakshatra:</strong> {viewedUserProfile.nakshatra}</div>}
              </div>
              
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground/90 text-sm">About Me</h3>
                <p className="text-foreground/80 leading-relaxed text-sm">{viewedUserProfile.bio}</p>
              </div>

              {viewedUserProfile.hobbies && viewedUserProfile.hobbies.length > 0 && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground/90 text-sm">Interests</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {viewedUserProfile.hobbies.map((interest: string) => (
                      <Badge key={interest} variant="secondary" className="bg-accent/10 text-accent-foreground/90 border-accent/20 text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            <div className="mt-6 space-y-3">
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

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
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
                 <p className="text-sm text-muted-foreground">Compatibility analysis will appear here.</p>
            )}
             {!isLoadingAiAnalysis && !loggedInUserProfile && !error && (
                 <p className="text-sm text-muted-foreground">Please log in and complete your profile to see AI compatibility.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
