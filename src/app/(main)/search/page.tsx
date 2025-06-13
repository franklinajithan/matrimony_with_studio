"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, UserPlus, MapPin, Briefcase, Cake } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  displayName: string;
  photoURL: string;
  age?: number;
  profession?: string;
  location?: string;
  bio?: string;
  dataAiHint?: string;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    await performSearch(searchQuery.trim());
  };

  const performSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const usersRef = collection(db, "users");
      const searchTerms = query.toLowerCase().split(" ").filter(term => term.length > 0);

      // Create a query that searches across multiple fields
      const q = query(
        usersRef,
        where("searchTerms", "array-contains-any", searchTerms),
        orderBy("displayName"),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const searchResults: SearchResult[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        searchResults.push({
          id: doc.id,
          displayName: data.displayName || "User",
          photoURL: data.photoURL || "https://placehold.co/400x400.png",
          age: data.age,
          profession: data.profession,
          location: data.location,
          bio: data.bio,
          dataAiHint: data.dataAiHint,
        });
      });

      setResults(searchResults);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Search Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, profession, or location..."
            className="w-full pl-10 h-12 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.photoURL} alt={user.displayName} data-ai-hint={user.dataAiHint} />
                    <AvatarFallback>{user.displayName.substring(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${user.id}`} className="font-semibold hover:underline block truncate">
                      {user.displayName}
                    </Link>
                    <div className="text-sm text-muted-foreground space-y-1 mt-1">
                      {user.age && (
                        <p className="flex items-center">
                          <Cake className="mr-1.5 h-3.5 w-3.5" /> {user.age} years
                        </p>
                      )}
                      {user.profession && (
                        <p className="flex items-center">
                          <Briefcase className="mr-1.5 h-3.5 w-3.5" /> {user.profession}
                        </p>
                      )}
                      {user.location && (
                        <p className="flex items-center">
                          <MapPin className="mr-1.5 h-3.5 w-3.5" /> {user.location}
                        </p>
                      )}
                    </div>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      View Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground">Try different keywords or check your spelling</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Search for people</h3>
          <p className="text-muted-foreground">Enter a name, profession, or location to find matches</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
