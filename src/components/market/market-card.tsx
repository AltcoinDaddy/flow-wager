/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  // --- UPDATED Market TYPE ---
  Market,
  MarketCategory,
  MarketCategoryLabels,
  MarketStatus, // Ensure this includes PendingResolution = 1
  MarketStatusLabels, // Assuming you have this for displaying status
} from "@/types/market"; // Make sure this path points to your updated types
import {
  Clock,
  ExternalLink,
  Flame,
  TrendingUp,
  Users2,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useMemo } from "react";
// Assuming these helpers are updated or compatible with V2 imageUrl field
import { getOptimizedImageUrl, isValidImageUrl } from "@/lib/flow/market"; // Example path

interface MarketCardProps {
  market: Market; // Use the updated Market type
  className?: string;
}

// Helper to sum shares (can be moved to utils)
const sumShares = (shares: string[]): number => {
  return shares.reduce((acc, share) => acc + parseFloat(share || "0"), 0);
};

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Use market.imageUrl directly from V2 structure
  const finalImageURI = market.imageUrl;
  const optimizedImageUrl = getOptimizedImageUrl(finalImageURI, 120, 120); // Adjust size as needed
  const hasValidImage = isValidImageUrl(optimizedImageUrl) && !imageError;

  // --- MULTI-OPTION CALCULATIONS ---
  const totalSharesValue = useMemo(
    () => sumShares(market.totalShares || []),
    [market.totalShares],
  );

  const optionPercentages = useMemo(() => {
    if (!market.options || !market.totalShares || totalSharesValue <= 0) {
      // Return equal percentages if no shares or options
      const numOptions = market.options?.length || 2; // Default to 2 if no options array?
      return Array(numOptions).fill(100 / numOptions);
    }
    return market.totalShares.map(
      (share) => (parseFloat(share || "0") / totalSharesValue) * 100,
    );
  }, [market.options, market.totalShares, totalSharesValue]);
  // --- END MULTI-OPTION CALCULATIONS ---

  // Format odds (percentage display)
  const formatOdds = (percentage: number) => {
    return `${Math.round(percentage)}%`;
  };

  // Calculate volume (total pool)
  const volume = parseFloat(market.totalPool || "0");
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}K`;
    return `${vol.toFixed(0)}`;
  };

  // Time remaining calculation
  const getTimeRemaining = () => {
    const endTime = new Date(parseFloat(market.endTime) * 1000);
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (market.resolved || market.status === MarketStatus.Resolved)
      return "Resolved"; // Show resolved status clearly
    if (market.status === MarketStatus.PendingResolution) return "Pending"; // Show pending status
    if (diff <= 0 && market.status === MarketStatus.Active)
      return "Ending Soon"; // Market ended but not yet pending/resolved

    if (diff <= 0) return "Ended"; // Fallback if somehow ended but not caught above

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 1) return `${days}d left`;
    if (days === 1) return `1d left`;
    if (hours > 1) return `${hours}h left`;
    if (hours === 1) return `1h left`;
    if (minutes > 0) return `${minutes}m left`;
    return `<1m left`;
  };

  // Category color mapping (remains the same)
  const getCategoryColor = (category: MarketCategory) => {
    // ... (switch statement remains the same) ...
    switch (category) {
      case MarketCategory.Politics:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case MarketCategory.Sports:
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case MarketCategory.Economics:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case MarketCategory.Technology:
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case MarketCategory.Entertainment:
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case MarketCategory.Crypto:
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case MarketCategory.Weather:
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case MarketCategory.BreakingNews:
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const handleImageLoad = () => setImageLoading(false);
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const isActive =
    market.status === MarketStatus.Active &&
    parseFloat(market.endTime) * 1000 > Date.now();
  const timeRemainingText = getTimeRemaining();
  const isHot = volume > 1000;
  const isEndingSoon =
    !market.resolved &&
    timeRemainingText !== "Resolved" &&
    timeRemainingText !== "Pending" &&
    (timeRemainingText.includes("h left") ||
      timeRemainingText.includes("m left") ||
      timeRemainingText === "Ending Soon");

  // Find the index of the leading option (highest percentage)
  const leadingOptionIndex = optionPercentages.indexOf(
    Math.max(...optionPercentages),
  );

  return (
    <Card
      className={`group hover:shadow-xl hover:shadow-[#9b87f5]/10 transition-all duration-300 border-gray-800/50 hover:border-[#9b87f5]/30 bg-gradient-to-br from-[#1A1F2C] to-[#151923] backdrop-blur-sm hover:scale-[1.02] ${className}`}
    >
      <CardContent className="p-0">
        <Link href={`/markets/${market.id}`} className="block">
          {/* Header */}
          <div className="p-3 pb-2">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {/* Image */}
                <div className="relative w-12 h-12 flex-shrink-0">
                  {hasValidImage ? (
                    <>
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9b87f5]"></div>
                        </div>
                      )}
                      <img
                        src={optimizedImageUrl} // Use optimized for card
                        alt={market.title}
                        className={`w-full h-full object-cover rounded-lg transition-all duration-300 group-hover:scale-105 ${imageLoading ? "opacity-0" : "opacity-100"}`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        loading="lazy"
                      />
                    </>
                  ) : (
                    <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg flex items-center justify-center border border-gray-700/50">
                      <ImageIcon className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
                {/* Category & Hot Badge */}
                <div className="flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium px-2 py-0.5 border ${getCategoryColor(market.category)}`}
                  >
                    {MarketCategoryLabels[
                      market.category as keyof typeof MarketCategoryLabels
                    ] || "Other"}
                  </Badge>
                  {isHot && (
                    <div
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs"
                      title="Popular Market"
                    >
                      <Flame className="h-2.5 w-2.5" />
                    </div>
                  )}
                </div>
              </div>
              {/* Time Remaining / Status */}
              <div
                className={`flex items-center text-xs px-1.5 py-0.5 rounded-full ${
                  isEndingSoon
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : timeRemainingText === "Resolved"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : timeRemainingText === "Pending"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-gray-700/50 text-gray-400"
                }`}
              >
                <Clock className="h-2.5 w-2.5 mr-1" />
                {timeRemainingText}
              </div>
            </div>

            <h3 className="font-semibold text-white text-sm leading-5 line-clamp-2 group-hover:text-gray-100 mb-2">
              {market.title}
            </h3>

            {/* Market Stats */}
            <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
              <div
                className="flex items-center gap-1 px-1.5 py-1 bg-[#0A0C14]/50 rounded"
                title="Total Volume"
              >
                <TrendingUp className="h-3 w-3 text-[#9b87f5]" />
                <span className="font-medium">{formatVolume(volume)}</span>
                <span className="ml-0.5">FLOW</span>
              </div>
              {/* Participants - Can use market.totalParticipants if available, else approximate */}
              {market.totalParticipants !== undefined ? (
                <div
                  className="flex items-center gap-1 px-1.5 py-1 bg-[#0A0C14]/50 rounded"
                  title="Participants"
                >
                  <Users2 className="h-3 w-3 text-[#9b87f5]" />
                  <span className="font-medium">
                    {market.totalParticipants}
                  </span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1 px-1.5 py-1 bg-[#0A0C14]/50 rounded"
                  title="Approx. Participants"
                >
                  <Users2 className="h-3 w-3 text-[#9b87f5]" />
                  <span className="font-medium">
                    ~{Math.ceil(totalSharesValue / 10)}
                  </span>{" "}
                  {/* Example approximation */}
                </div>
              )}
            </div>

            {/* --- RENDER MULTIPLE OPTIONS --- */}
            <div className="space-y-1.5 mb-3">
              {(market.options || []).map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-md border border-gray-700/50 transition-all duration-200 group/option ${
                    index === leadingOptionIndex && isActive
                      ? "hover:border-green-500/50 hover:bg-green-500/5" // Highlight leading option on hover
                      : "hover:border-gray-600 hover:bg-gray-800/20"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-200 truncate group-hover/option:text-white">
                      {option}
                    </div>
                  </div>
                  <div className="ml-2 flex items-center gap-1">
                    <div
                      className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors ${
                        index === leadingOptionIndex && isActive // Highlight leading option price/percentage
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-gray-700/50 text-gray-300"
                      }`}
                    >
                      {formatOdds(optionPercentages[index] || 0)}
                    </div>
                    {index === leadingOptionIndex &&
                      isActive && ( // Show trend icon only for leading active option
                        <TrendingUp className="h-2.5 w-2.5 text-green-400" />
                      )}
                  </div>
                </div>
              ))}
            </div>
            {/* --- END RENDER MULTIPLE OPTIONS --- */}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
              <div className="text-xs text-gray-400">
                {market.resolved ? (
                  <span className="font-medium text-gray-300 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    Resolved
                  </span>
                ) : market.status === MarketStatus.PendingResolution ? (
                  <span className="font-medium text-yellow-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                    Pending
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[#9b87f5] rounded-full animate-pulse"></div>
                    Active
                  </span>
                )}
              </div>

              <Button
                size="sm"
                className="h-6 px-3 text-xs bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                asChild // Make button act as a link wrapper
              >
                {/* Prevent Link from nesting inside Link */}
                <span>
                  <ExternalLink className="h-2.5 w-2.5 mr-1" />
                  Trade
                </span>
              </Button>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};
