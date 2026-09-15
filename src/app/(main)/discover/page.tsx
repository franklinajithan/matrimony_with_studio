"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { listProfiles } from "@/lib/supabase/profiles";
import { getShortlistedIds, addToShortlist, removeFromShortlist } from "@/lib/supabase/shortlist";
import { sendInterest } from "@/lib/supabase/matches";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Heart, Bookmark, MapPin, Briefcase, Languages, Loader2, Search, SlidersHorizontal, X, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscoveryProfile {
  id: string;
  displayName: string;
  bio?: string;
  photoURL?: string;
  location?: string;
  profession?: string;
  country?: string;
  ageYears?: number;
  languages?: string[];
  isShortlisted?: boolean;
}

type LoadingState = "loading" | "success" | "error" | "idle";

function ProfileCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 border-t p-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </CardFooter>
    </Card>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<DiscoveryProfile[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  
  // Action states
  const [processingAction, setProcessingAction] = useState<Record<string, boolean>>({});
  
  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      } else if (session?.user) {
        setCurrentUser(session.user);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [router]);
  
  // Fetch profiles
  const fetchProfiles = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingState("loading");
      setError(null);
      
      // Fetch discovery profiles (already excludes blocked users and self)
      const result = await listProfiles({ limit: 50 });
      
      // Get shortlisted IDs
      const shortlistedIds = await getShortlistedIds(
        currentUser.uid,
        result.profiles.map(p => p.id)
      );
      
      const profilesWithShortlist = result.profiles.map(p => ({
        ...p,
        isShortlisted: shortlistedIds.has(p.id),
      }));
      
      setProfiles(profilesWithShortlist);
      setFilteredProfiles(profilesWithShortlist);
      setLoadingState("success");
    } catch (error: any) {
      console.error("Error fetching profiles:", error);
      setError(error.message || "Failed to load profiles");
      setLoadingState("error");
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchProfiles();
    }
  }, [currentUser]);
  
  // Apply filters
  useEffect(() => {
    let filtered = [...profiles];
    
    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.displayName.toLowerCase().includes(query) ||
        p.profession?.toLowerCase().includes(query) ||
        p.location?.toLowerCase().includes(query)
      );
    }
    
    // Age filter
    if (ageMin) {
      filtered = filtered.filter(p => !p.ageYears || p.ageYears >= parseInt(ageMin));
    }
    if (ageMax) {
      filtered = filtered.filter(p => !p.ageYears || p.ageYears <= parseInt(ageMax));
    }
    
    // Country filter
    if (selectedCountry !== "all") {
      filtered = filtered.filter(p => p.country === selectedCountry);
    }
    
    // Language filter
    if (selectedLanguage !== "all") {
      filtered = filtered.filter(p =>
        p.languages && p.languages.includes(selectedLanguage)
      );
    }
    
    setFilteredProfiles(filtered);
  }, [profiles, searchQuery, ageMin, ageMax, selectedCountry, selectedLanguage]);
  
  const handleToggleShortlist = async (profileId: string, isCurrentlyShortlisted: boolean) => {
    if (!currentUser) return;
    
    setProcessingAction(prev => ({ ...prev, [`shortlist-${profileId}`]: true }));
    
    try {
      if (isCurrentlyShortlisted) {
        await removeFromShortlist(currentUser.uid, profileId);
        setProfiles(prev => prev.map(p =>
          p.id === profileId ? { ...p, isShortlisted: false } : p
        ));
      } else {
        await addToShortlist(currentUser.uid, profileId);
        setProfiles(prev => prev.map(p =>
          p.id === profileId ? { ...p, isShortlisted: true } : p
        ));
      }
    } catch (error) {
      console.error("Error toggling shortlist:", error);
      toast({
        title: "Error",
        description: "Failed to update shortlist.",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(prev => ({ ...prev, [`shortlist-${profileId}`]: false }));
    }
  };
  
  const handleSendInterest = async (profileId: string) => {
    if (!currentUser) return;
    
    setProcessingAction(prev => ({ ...prev, [`interest-${profileId}`]: true }));
    
    try {
      await sendInterest({
        senderUid: currentUser.uid,
        receiverUid: profileId,
      });
      
      toast({
        title: "Interest sent",
        description: "Your interest has been sent successfully.",
      });
    } catch (error: any) {
      console.error("Error sending interest:", error);
      
      const message = error.message?.toLowerCase();
      if (message?.includes("duplicate") || message?.includes("unique")) {
        toast({
          title: "Already sent",
          description: "You've already sent an interest to this person.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send interest. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setProcessingAction(prev => ({ ...prev, [`interest-${profileId}`]: false }));
    }
  };
  
  const clearFilters = () => {
    setSearchQuery("");
    setAgeMin("");
    setAgeMax("");
    setSelectedCountry("all");
    setSelectedLanguage("all");
  };
  
  const hasActiveFilters = searchQuery || ageMin || ageMax || selectedCountry !== "all" || selectedLanguage !== "all";
  
  // Loading state with skeletons
  if (loadingState === "loading") {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-2 h-5 w-32" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProfileCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (loadingState === "error") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load profiles</h3>
            <p className="mt-2 text-sm text-gray-600">{error || "Something went wrong"}</p>
            <Button
              className="mt-6"
              onClick={() => fetchProfiles()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Find someone who fits your future
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {filteredProfiles.length} {filteredProfiles.length === 1 ? "profile" : "profiles"} found
        </p>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, profession, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {showFilters ? "Hide" : "Show"} Filters
              {hasActiveFilters && (
                <Badge className="ml-2" variant="secondary">
                  Active
                </Badge>
              )}
            </Button>
            
            {/* Filters */}
            {showFilters && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Min Age</Label>
                  <Input
                    type="number"
                    placeholder="21"
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                    min="18"
                    max="100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Max Age</Label>
                  <Input
                    type="number"
                    placeholder="35"
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                    min="18"
                    max="100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                      <SelectItem value="USA">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Sinhala">Sinhala</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Profiles Grid */}
      {filteredProfiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No profiles found</h3>
            <p className="mt-2 text-sm text-gray-600">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results."
                : "Check back soon for new profiles."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-4"
              >
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <div className="aspect-[3/4] relative bg-gray-100">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-violet-50 text-4xl font-semibold text-violet-600">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Shortlist Button */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/90 hover:bg-white"
                  onClick={() => handleToggleShortlist(profile.id, profile.isShortlisted || false)}
                  disabled={processingAction[`shortlist-${profile.id}`]}
                >
                  {processingAction[`shortlist-${profile.id}`] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bookmark
                      className={cn(
                        "h-4 w-4",
                        profile.isShortlisted && "fill-violet-600 text-violet-600"
                      )}
                    />
                  )}
                </Button>
              </div>
              
              <CardContent className="p-4">
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                  {profile.displayName}
                  {profile.ageYears && `, ${profile.ageYears}`}
                </h3>
                
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  {profile.profession && (
                    <p className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{profile.profession}</span>
                    </p>
                  )}
                  {profile.location && (
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{profile.location}</span>
                    </p>
                  )}
                  {profile.languages && profile.languages.length > 0 && (
                    <p className="flex items-center gap-1">
                      <Languages className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{profile.languages.slice(0, 2).join(", ")}</span>
                    </p>
                  )}
                </div>
                
                {profile.bio && (
                  <p className="mt-3 line-clamp-2 text-xs text-gray-600 sm:text-sm">
                    {profile.bio}
                  </p>
                )}
              </CardContent>
              
              <CardFooter className="flex gap-2 border-t p-3">
                <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm" asChild>
                  <Link href={`/profile/${profile.id}`}>
                    View
                  </Link>
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs sm:text-sm"
                  onClick={() => handleSendInterest(profile.id)}
                  disabled={processingAction[`interest-${profile.id}`]}
                >
                  {processingAction[`interest-${profile.id}`] ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Heart className="mr-1 h-3.5 w-3.5" />
                  )}
                  Interest
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
