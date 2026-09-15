"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Heart, Bookmark, MapPin, Briefcase, Languages, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
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

export default function DiscoverPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        
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
      } catch (error) {
        console.error("Error fetching profiles:", error);
        toast({
          title: "Error",
          description: "Failed to load profiles. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfiles();
  }, [currentUser, toast]);
  
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
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Find someone who fits your future
          </h1>
          <p className="mt-2 text-gray-600">
            {filteredProfiles.length} {filteredProfiles.length === 1 ? "profile" : "profiles"} found
          </p>
        </div>
        
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
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
                    <Label>Min Age</Label>
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
                    <Label>Max Age</Label>
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
                    <Label>Country</Label>
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
                    <Label>Language</Label>
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
              <p className="text-gray-600">
                No profiles match your search criteria.
              </p>
              {hasActiveFilters && (
                <Button
                  variant="link"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear all filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                    className="absolute right-3 top-3 rounded-full bg-white/90 hover:bg-white"
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profile.displayName}
                    {profile.ageYears && `, ${profile.ageYears}`}
                  </h3>
                  
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {profile.profession && (
                      <p className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {profile.profession}
                      </p>
                    )}
                    {profile.location && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.location}
                      </p>
                    )}
                    {profile.languages && profile.languages.length > 0 && (
                      <p className="flex items-center gap-1">
                        <Languages className="h-3.5 w-3.5" />
                        {profile.languages.slice(0, 2).join(", ")}
                      </p>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                      {profile.bio}
                    </p>
                  )}
                </CardContent>
                
                <CardFooter className="flex gap-2 border-t p-3">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/profile/${profile.id}`}>
                      View Profile
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSendInterest(profile.id)}
                    disabled={processingAction[`interest-${profile.id}`]}
                  >
                    {processingAction[`interest-${profile.id}`] ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className="mr-2 h-4 w-4" />
                    )}
                    Send Interest
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
