"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchProfiles } from "@/lib/supabase/profiles";
import { Input } from "@/components/ui/input";
import { Search, Loader2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SearchSuggestion {
  id: string;
  displayName: string;
  photoURL: string;
  age?: number;
  profession?: string;
  location?: string;
}

interface SearchAutocompleteProps {
  className?: string;
  onSearch?: () => void;
  placeholder?: string;
}

export function SearchAutocomplete({ className, onSearch, placeholder = "Search profiles..." }: SearchAutocompleteProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      console.log("Search query received:", searchQuery);

      setIsLoading(true);
      try {
        const matches = await searchProfiles(searchQuery, 10);
        const uniqueResults: SearchSuggestion[] = matches.map((data) => ({
          id: data.id,
          displayName: data.displayName || "User",
          photoURL: data.photoURL || "https://placehold.co/400x400.png",
          age: undefined,
          profession: data.profession || "",
          location: data.location || "",
        }));

        uniqueResults.sort((a, b) => {
          const aName = a.displayName.toLowerCase();
          const bName = b.displayName.toLowerCase();
          const searchTerm = searchQuery.toLowerCase();

          const aStartsWith = aName.startsWith(searchTerm);
          const bStartsWith = bName.startsWith(searchTerm);

          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;

          const aIncludes = aName.includes(searchTerm);
          const bIncludes = bName.includes(searchTerm);

          if (aIncludes && !bIncludes) return -1;
          if (!aIncludes && bIncludes) return 1;

          return aName.localeCompare(bName);
        });

        console.log("Final unique search results:", uniqueResults);

        setSuggestions(uniqueResults);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Reduced debounce time for faster response
    const debounceTimer = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    router.push(`/profile/${suggestion.id}`);
    setShowSuggestions(false);
    setSearchQuery("");
    onSearch?.();
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          className="w-full pl-9 h-10"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {showSuggestions && (searchQuery.trim() || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  ref={(el) => { suggestionRefs.current[index] = el; }}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-3 transition-colors",
                    selectedIndex === index && "bg-accent"
                  )}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage 
                      src={suggestion.photoURL} 
                      alt={suggestion.displayName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">
                      {suggestion.displayName}
                      {suggestion.age && <span className="text-muted-foreground ml-1">({suggestion.age})</span>}
                    </p>
                    {(suggestion.profession || suggestion.location) && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {[suggestion.profession, suggestion.location].filter(Boolean).join(" • ")}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="p-4 text-center text-muted-foreground">
              No profiles found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 