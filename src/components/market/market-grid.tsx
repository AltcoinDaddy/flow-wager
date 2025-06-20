"use client";

// src/components/market/market-grid.tsx

import { useState } from "react";
import { MarketCard } from "./market-card";
import { MarketFilters } from "./market-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Grid3X3, 
  List, 
  Search,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  Volume2
} from "lucide-react";
import type { Market, MarketFilter, MarketCategory, MarketStatus, MarketOutcome } from "@/types/market";

// Mock data - replace with actual API data
const mockMarkets: Market[] = [
  {
    id: 1,
    creator: "0x1234567890abcdef",
    question: "Will Bitcoin reach $100,000 by end of 2025?",
    optionA: "Yes",
    optionB: "No", 
    category: "Economics" as MarketCategory,
    imageURI: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400",
    endTime: Date.now() + 30 * 86400000,
    creationTime: Date.now() - 86400000,
    outcome: "Unresolved" as MarketOutcome,
    totalOptionAShares: 73000,
    totalOptionBShares: 27000,
    resolved: false,
    status: "Active" as MarketStatus,
    totalPool: 45678.90,
    isBreakingNews: false,
    minBet: 1,
    maxBet: 1000
  },
  {
    id: 2,
    creator: "0xabcdef1234567890", 
    question: "Will the next US Presidential Election be held in 2028?",
    optionA: "Yes, in 2028",
    optionB: "No, different year",
    category: "Politics" as MarketCategory,
    imageURI: "https://images.unsplash.com/photo-1586074299757-14d6ba8c7f98?w=400",
    endTime: Date.now() + 60 * 86400000,
    creationTime: Date.now() - 172800000,
    outcome: "Unresolved" as MarketOutcome,
    totalOptionAShares: 89000,
    totalOptionBShares: 11000,
    resolved: false,
    status: "Active" as MarketStatus,
    totalPool: 23456.78,
    isBreakingNews: true,
    minBet: 5,
    maxBet: 500
  },
  {
    id: 3,
    creator: "0x9876543210fedcba",
    question: "Will ChatGPT-5 be released by OpenAI in 2025?",
    optionA: "Yes",
    optionB: "No",
    category: "Technology" as MarketCategory,
    imageURI: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
    endTime: Date.now() + 90 * 86400000,
    creationTime: Date.now() - 259200000,
    outcome: "Unresolved" as MarketOutcome,
    totalOptionAShares: 62000,
    totalOptionBShares: 38000,
    resolved: false,
    status: "Active" as MarketStatus,
    totalPool: 12345.67,
    isBreakingNews: false,
    minBet: 2,
    maxBet: 200
  }
];

interface MarketGridProps {
  initialMarkets?: Market[];
  showFilters?: boolean;
}

export function MarketGrid({ initialMarkets = mockMarkets, showFilters = true }: MarketGridProps) {
  const [markets] = useState<Market[]>(initialMarkets);
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>(initialMarkets);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"volume" | "endTime" | "createdAt" | "activity">("volume");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<MarketStatus | "all">("all");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...markets];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(market =>
        market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.optionA.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.optionB.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(market => market.category === selectedCategory);
    }

    // Status filter  
    if (selectedStatus !== "all") {
      filtered = filtered.filter(market => market.status === selectedStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case "volume":
          aValue = a.totalPool;
          bValue = b.totalPool;
          break;
        case "endTime":
          aValue = a.endTime;
          bValue = b.endTime;
          break;
        case "activity":
          aValue = a.totalOptionAShares + a.totalOptionBShares;
          bValue = b.totalOptionAShares + b.totalOptionBShares;
          break;
        default:
          return 0;
      }

      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });

    setFilteredMarkets(filtered);
  };

  // Apply filters when dependencies change
  useState(() => {
    applyFilters();
  });

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  const activeFiltersCount = [
    searchQuery ? 1 : 0,
    selectedCategory !== "all" ? 1 : 0,
    selectedStatus !== "all" ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Markets</h2>
          <p className="text-muted-foreground">
            {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center rounded-lg border">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showFilters && (
        <>
          {/* Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="volume">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4" />
                    <span>Volume</span>
                  </div>
                </SelectItem>
                <SelectItem value="endTime">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Ending Soon</span>
                  </div>
                </SelectItem>
                <SelectItem value="createdAt">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Newest</span>
                  </div>
                </SelectItem>
                <SelectItem value="activity">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Most Active</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="relative"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="ml-2">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFiltersPanel && (
            <MarketFilters
              selectedCategory={selectedCategory}
              selectedStatus={selectedStatus}
              onCategoryChange={setSelectedCategory}
              onStatusChange={setSelectedStatus}
              onReset={() => {
                setSelectedCategory("all");
                setSelectedStatus("all");
                setSearchQuery("");
              }}
            />
          )}

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Search: {searchQuery}</span>
                  <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Category: {selectedCategory}</span>
                  <button onClick={() => setSelectedCategory("all")} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
              {selectedStatus !== "all" && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Status: {selectedStatus}</span>
                  <button onClick={() => setSelectedStatus("all")} className="ml-1 hover:text-destructive">
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </>
      )}

      {/* Markets Grid/List */}
      {filteredMarkets.length > 0 ? (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }>
          {filteredMarkets.map((market) => (
            <MarketCard 
              key={market.id} 
              market={market} 
              compact={viewMode === "list"}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No markets found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or filters.
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedStatus("all");
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}