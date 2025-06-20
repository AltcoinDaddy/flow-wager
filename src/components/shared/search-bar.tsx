"use client";

// src/components/shared/search-bar.tsx

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  X, 
  Clock,
  TrendingUp,
  Filter
} from "lucide-react";

interface SearchSuggestion {
  id: string;
  title: string;
  category: string;
  type: "market" | "user" | "category";
}

// Mock search suggestions - replace with actual API call
const mockSuggestions: SearchSuggestion[] = [
  { id: "1", title: "Will Bitcoin reach $100k by end of 2025?", category: "Economics", type: "market" },
  { id: "2", title: "Next US Presidential Election Winner", category: "Politics", type: "market" },
  { id: "3", title: "Sports", category: "Sports", type: "category" },
  { id: "4", title: "Will ChatGPT-5 be released in 2025?", category: "Technology", type: "market" },
];

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("recent-searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Handle search suggestions
  useEffect(() => {
    if (query.length > 1) {
      // Simulate API call
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.title.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.category.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(query.length === 0 && document.activeElement === inputRef.current);
    }
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // Add to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
    
    // Navigate to search results
    router.push(`/markets?search=${encodeURIComponent(searchQuery)}`);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent-searches");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search markets, users, categories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-0 shadow-md">
          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="border-b p-2">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Suggestions</h4>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  className="w-full text-left rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between group"
                  onClick={() => {
                    if (suggestion.type === "market") {
                      router.push(`/markets/${suggestion.id}`);
                    } else if (suggestion.type === "category") {
                      router.push(`/markets?category=${suggestion.category}`);
                    }
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    {suggestion.type === "market" ? (
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Filter className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="truncate">{suggestion.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {suggestion.category}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-muted-foreground">Recent Searches</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground"
                  onClick={clearRecentSearches}
                >
                  Clear
                </Button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  className="w-full text-left rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground flex items-center space-x-2"
                  onClick={() => handleSearch(search)}
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {query.length > 1 && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No suggestions found for "{query}"
              <br />
              <Button
                variant="link"
                className="mt-1 h-auto p-0 text-sm"
                onClick={() => handleSearch(query)}
              >
                Search anyway
              </Button>
            </div>
          )}

          {/* Empty State */}
          {query.length === 0 && recentSearches.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Start typing to search markets...
            </div>
          )}
        </div>
      )}
    </div>
  );
}