"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import { useFlowUpdate } from "@/hooks/useFlowUpdate";
import { MultiOptionMarket, MarketStatus } from "@/types/flowupdate";
import Image from "next/image";

interface MultiOptionMarketsListProps {
  markets?: MultiOptionMarket[];
  onMarketSelect?: (market: MultiOptionMarket) => void;
  onBetClick?: (market: MultiOptionMarket) => void;
  isLoading?: boolean;
  title?: string;
  showFilters?: boolean;
  emptyMessage?: string;
}

const CATEGORY_LABELS: Record<number, string> = {
  0: "Sports",
  1: "Entertainment",
  2: "Technology",
  3: "Economics",
  4: "Weather",
  5: "Crypto",
  6: "Politics",
  7: "Breaking News",
  8: "Other",
};

const CATEGORY_EMOJIS: Record<number, string> = {
  0: "⚽",
  1: "🎬",
  2: "💻",
  3: "💰",
  4: "🌤️",
  5: "₿",
  6: "🗳️",
  7: "📰",
  8: "❓",
};

export function MultiOptionMarketsList({
  markets: providedMarkets,
  onMarketSelect,
  onBetClick,
  isLoading: providedIsLoading = false,
  title = "Multi-Option Markets",
  showFilters = true,
  emptyMessage = "No markets available",
}: MultiOptionMarketsListProps) {
  const { activeMarkets, loading: hookLoading } = useFlowUpdate({
    autoFetch: true,
  });

  const [displayMarkets, setDisplayMarkets] = useState<MultiOptionMarket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "endtime" | "volume">(
    "newest",
  );

  const isLoading = providedIsLoading || hookLoading;
  const marketsToDisplay = providedMarkets || activeMarkets;

  // Filter and sort markets
  useEffect(() => {
    let filtered = marketsToDisplay;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (market) =>
          market.title.toLowerCase().includes(query) ||
          market.description.toLowerCase().includes(query) ||
          market.options.some((opt) => opt.toLowerCase().includes(query)),
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      const categoryNum = parseInt(selectedCategory);
      filtered = filtered.filter((market) => market.category === categoryNum);
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "endtime":
          return a.endTime - b.endTime;
        case "volume":
          const volumeA = parseFloat(a.totalPool);
          const volumeB = parseFloat(b.totalPool);
          return volumeB - volumeA;
        case "newest":
        default:
          return b.createdAt - a.createdAt;
      }
    });

    setDisplayMarkets(sorted);
  }, [marketsToDisplay, searchQuery, selectedCategory, sortBy]);

  const formatTimeRemaining = (endTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const secondsRemaining = endTime - now;

    if (secondsRemaining <= 0) return "Ended";

    const days = Math.floor(secondsRemaining / 86400);
    const hours = Math.floor((secondsRemaining % 86400) / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getMarketStatusBadge = (market: MultiOptionMarket) => {
    if (market.resolved) return <Badge variant="outline">Resolved</Badge>;
    if (market.status === MarketStatus.Active)
      return <Badge variant="default">Active</Badge>;
    if (market.status === MarketStatus.PendingResolution)
      return <Badge variant="secondary">Pending</Badge>;
    return <Badge variant="outline">Closed</Badge>;
  };

  if (isLoading && marketsToDisplay.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
        <p className="text-gray-500">Loading markets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {displayMarkets.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {displayMarkets.length} market
            {displayMarkets.length !== 1 ? "s" : ""} available
          </p>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:col-span-1"
          />

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {CATEGORY_EMOJIS[parseInt(key)]} {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as typeof sortBy)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="endtime">Ending Soon</SelectItem>
              <SelectItem value="volume">Highest Volume</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Markets Grid */}
      {displayMarkets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayMarkets.map((market) => (
            <Card
              key={market.id}
              className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
              onClick={() => onMarketSelect?.(market)}
            >
              {/* Market Image */}
              <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-t-lg">
                {market.imageUrl ? (
                  <Image
                    src={market.imageUrl}
                    alt={market.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2">
                      {market.title}
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      {CATEGORY_EMOJIS[market.category]}{" "}
                      {CATEGORY_LABELS[market.category]}
                    </p>
                  </div>
                  {getMarketStatusBadge(market)}
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {market.description}
                </p>

                {/* Options Preview */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Options
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {market.options.slice(0, 3).map((option, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {option}
                      </Badge>
                    ))}
                    {market.options.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{market.options.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Market Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500">Total Pool</p>
                    <p className="font-semibold text-sm">
                      {market.totalPool} FLOW
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Time Left
                    </p>
                    <p className="font-semibold text-sm">
                      {formatTimeRemaining(market.endTime)}
                    </p>
                  </div>
                </div>

                {/* Bet Limits */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Min Bet: {market.minBet} FLOW</p>
                  <p>Max Bet: {market.maxBet} FLOW</p>
                </div>

                {/* Bet Button */}
                {market.status === MarketStatus.Active && !market.resolved && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBetClick?.(market);
                    }}
                    className="w-full mt-2"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Place Bet
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{emptyMessage}</p>
        </Card>
      )}
    </div>
  );
}
