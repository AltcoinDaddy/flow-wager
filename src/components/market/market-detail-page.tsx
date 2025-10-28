/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
"use client";

import { BetDialog } from "@/components/market/bet-dialog"; // Needs update for multi-option (pass optionIndex)
import { CommentsSection } from "@/components/comments/comments-section";
import { CountdownTimer } from "@/components/market/countdown-timer";
import { MarketError } from "@/components/market/market-error";
import { MarketLoading } from "@/components/market/market-loading";
import { MarketActivity } from "@/components/market/market-activity"; // Needs update for multi-option (pass options array)
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Progress bar removed
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketDetail } from "@/hooks/use-market-detail"; // Use the updated V2 hook
import { useAuth } from "@/providers/auth-provider";
import {
  MarketCategory,
  MarketCategoryLabels,
  MarketStatus, // Ensure this enum has PendingResolution = 1
  MarketStatusLabels,
} from "@/types/market"; // Use V2 types
import {
  Activity, // Added import
  Bookmark,
  Calendar,
  CheckCircle,
  Clock,
  Flag,
  Flame,
  Image as ImageIcon,
  Lock,
  RefreshCw,
  Share2,
  TrendingUp,
  Users,
  Volume2,
  Zap,
  XCircle, // Added XCircle
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// Helper to sum shares (can be moved to utils)
const sumShares = (shares: string[]): number => {
  return shares.reduce((acc, share) => acc + parseFloat(share || "0"), 0);
};

// Simple image validation (replace with actual utility if available)
const isValidImageUrl = (url: string): boolean | string => {
  return url && url.startsWith("http");
};

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = params.id as string;
  const { user } = useAuth();

  // Use the V2 Hook
  const {
    market,
    userPosition, // V2 Position type { marketId, optionShares[], ... }
    loading,
    error,
    refreshMarketData,
  } = useMarketDetail(marketId, `${user?.addr}`);

  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    null,
  ); // Store index
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Auto-refresh
  useEffect(() => {
    if (!loading && market) {
      const interval = setInterval(() => {
        console.log("Auto-refreshing market data...");
        refreshMarketData();
      }, 80000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [loading, market, refreshMarketData]);

  // Multi-option Calculations (moved before early returns)
  const totalSharesValue = useMemo(
    () => sumShares(market?.totalShares || []),
    [market?.totalShares],
  );

  const optionPercentages = useMemo(() => {
    if (!market?.options || !market?.totalShares || totalSharesValue <= 0) {
      const numOptions = market?.options?.length || 1;
      return Array(numOptions).fill(100 / numOptions);
    }
    return market.totalShares.map(
      (share) => (parseFloat(share || "0") / totalSharesValue) * 100,
    );
  }, [market?.options, market?.totalShares, totalSharesValue]);

  const leadingOptionIndex = useMemo(() => {
    if (!optionPercentages || optionPercentages.length === 0) return -1;
    return optionPercentages.indexOf(Math.max(...optionPercentages));
  }, [optionPercentages]);

  // Get effective status
  const getActualMarketStatus = () => {
    if (!market) return MarketStatus.Active;
    const now = Date.now();
    const endTime = parseFloat(market.endTime) * 1000;

    if (market.status === MarketStatus.Resolved || market.resolved)
      return MarketStatus.Resolved;
    if (market.status === MarketStatus.PendingResolution)
      return MarketStatus.PendingResolution;
    if (market.status === MarketStatus.Cancelled) return MarketStatus.Cancelled;
    if (market.status === MarketStatus.Active && endTime <= now)
      return MarketStatus.PendingResolution;
    return MarketStatus.Active;
  };

  const actualStatus = getActualMarketStatus();
  const isBettingDisabled = actualStatus !== MarketStatus.Active;

  // Loading state
  if (loading) {
    return <MarketLoading />;
  }

  // Error state
  if (error || !market) {
    return (
      <MarketError
        error={error || "Market not found"}
        onRetry={refreshMarketData}
      />
    );
  }

  // Image Handling
  const finalImageURI = market.imageUrl;
  const optimizedImageUrl = finalImageURI; // Simplified, remove optimization
  const hasValidImage = isValidImageUrl(`${optimizedImageUrl}`) && !imageError;

  // Formatting Helpers
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value || "0") : value;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2); // Keep decimals for amounts < 1k
  };

  const getCategoryName = (category: number) =>
    MarketCategoryLabels[category as MarketCategory] || "Other";
  const getStatusName = (status: MarketStatus) =>
    MarketStatusLabels[status] || "Unknown";

  const handleImageLoad = () => setImageLoading(false);
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  // Event Handlers
  const handleBet = (optionIndex: number) => {
    if (isBettingDisabled) return;
    setSelectedOptionIndex(optionIndex);
    setBetDialogOpen(true);
  };

  const handleShare = async () => {
    /* ... */
  };

  const handleBetSuccess = () => {
    setBetDialogOpen(false);
    setTimeout(() => {
      refreshMarketData();
    }, 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshMarketData(); // Removed await as it has no effect
    setIsRefreshing(false);
  };

  const getDisabledMessage = () => {
    if (actualStatus === MarketStatus.Resolved)
      return "Market has been resolved";
    if (actualStatus === MarketStatus.PendingResolution)
      return "Market ended - awaiting resolution";
    if (actualStatus === MarketStatus.Cancelled)
      return "Market has been cancelled";
    return "Betting currently unavailable";
  };

  const volume = parseFloat(market.totalPool || "0");
  const isHot = volume > 1000;

  // Function to determine option button styling (example)
  const getOptionButtonStyle = (index: number) => {
    if (isBettingDisabled)
      return "bg-gray-600 text-gray-400 cursor-not-allowed";
    if (index === leadingOptionIndex)
      return "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-md hover:shadow-lg";
    return "bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white shadow-md hover:shadow-lg";
  };

  // Function to determine option badge styling (example)
  const getOptionBadgeStyle = (index: number) => {
    if (isBettingDisabled) return "bg-gray-700 text-gray-500 border-gray-600";
    if (index === leadingOptionIndex)
      return "bg-green-500/20 text-green-300 border-green-500/40";
    return "bg-gray-700/50 text-gray-200 border-gray-600/50";
  };

  const formatOdds = (percentage: number): string => {
    // Ensure percentage is a valid number, default to 0 if not
    const num =
      typeof percentage === "number" && !isNaN(percentage) ? percentage : 0;
    return `${Math.round(num)}%`; // Simple percentage display
  };

  return (
    <div className="min-h-screen bg-[#0A0C14]">
      {/* Live Data Indicator */}
      <div className="fixed top-4 right-4 z-50"> {/* ... */} </div>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400 overflow-x-auto">
          <Link
            href="/markets"
            className="hover:text-[#9b87f5] transition-colors whitespace-nowrap"
          >
            Markets
          </Link>
          <span>/</span>
          <Link
            href={`/markets?category=${getCategoryName(market.category)}`}
            className="hover:text-[#9b87f5] transition-colors whitespace-nowrap"
          >
            {getCategoryName(market.category)}
          </Link>
          <span>/</span>
          <span className="text-white font-medium truncate">
            {market.title}
          </span>
        </div>
        {/* Market Header */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#1A1F2C] via-[#151923] to-[#0A0C14] rounded-2xl border border-gray-800/50 p-4 sm:p-8 shadow-2xl">
            {/* Header Content (Image, Badges, Actions) */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Image */}
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                  {hasValidImage ? (
                    <>
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-xl">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#9b87f5]"></div>
                        </div>
                      )}
                      <img
                        src={optimizedImageUrl}
                        alt={market.title}
                        className={`w-full h-full object-cover rounded-xl transition-opacity duration-300 ${imageLoading ? "opacity-0" : "opacity-100"}`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center border border-gray-700/50">
                      <ImageIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  )}
                </div>
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30 font-medium text-xs sm:text-sm">
                    {getCategoryName(market.category)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs sm:text-sm font-medium border ${
                      actualStatus === MarketStatus.Active
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : actualStatus === MarketStatus.Resolved
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : actualStatus === MarketStatus.PendingResolution
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                            : actualStatus === MarketStatus.Cancelled
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-gray-700/50 text-gray-300 border-gray-500/30"
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      {actualStatus === MarketStatus.Active && (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {actualStatus === MarketStatus.PendingResolution && (
                        <Clock className="h-3 w-3" />
                      )}
                      {actualStatus === MarketStatus.Resolved && (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {actualStatus === MarketStatus.Cancelled && (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>{getStatusName(actualStatus)}</span>
                    </div>
                  </Badge>
                  {isHot && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs">
                      <Flame className="h-3 w-3" />
                      <span className="font-medium">Hot</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="border-0 text-white hover:bg-[#1A1F2C] hover:text-white bg-[#1A1F2C] hover:border-[#9b87f5]/50 p-2 sm:px-3"
                >
                  {" "}
                  <Bookmark
                    className={`h-4 w-4 ${isBookmarked ? "fill-current text-[#9b87f5]" : ""}`}
                  />{" "}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="border-0 text-white hover:bg-[#1A1F2C] hover:text-white bg-[#1A1F2C] hover:border-[#9b87f5]/50 p-2 sm:px-3"
                >
                  {" "}
                  <Share2 className="h-4 w-4" />{" "}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-0 text-white hover:bg-[#1A1F2C] hover:text-white bg-[#1A1F2C] hover:border-[#9b87f5]/50 p-2 sm:px-3"
                >
                  {" "}
                  <Flag className="h-4 w-4" />{" "}
                </Button>
              </div>
            </div>

            {/* Title and description */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white leading-tight">
              {market.title}
            </h1>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-6">
              {market.description}
            </p>

            {/* Market Meta (Creator, Dates, Volume) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                {" "}
                <Users className="h-4 w-4 text-[#9b87f5] flex-shrink-0" />{" "}
                <span className="whitespace-nowrap">Created by</span>{" "}
                <Link
                  href={`/dashboard/${market.creator}`}
                  className="text-[#9b87f5] hover:text-[#8b5cf6] font-medium transition-colors truncate"
                >
                  {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
                </Link>
              </div>
              <div className="flex items-center space-x-2">
                {" "}
                <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0" />{" "}
                <span className="whitespace-nowrap">
                  {new Date(
                    parseInt(market.createdAt) * 1000,
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {" "}
                <Clock className="h-4 w-4 text-yellow-400 flex-shrink-0" />{" "}
                <CountdownTimer endTime={parseInt(market.endTime) * 1000} />
              </div>
              <div className="flex items-center space-x-2">
                {" "}
                <Volume2 className="h-4 w-4 text-green-400 flex-shrink-0" />{" "}
                <span className="whitespace-nowrap">
                  {formatCurrency(market.totalPool)} FLOW volume
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Multi-Option Betting Card */}
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 shadow-xl">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-white flex items-center space-x-2 text-lg sm:text-xl">
                  <TrendingUp className="h-5 w-5 text-[#9b87f5]" />
                  <span>
                    {actualStatus === MarketStatus.Resolved
                      ? "Market Result"
                      : "Place Your Bet"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                {/* Show resolved outcome */}
                {actualStatus === MarketStatus.Resolved &&
                  market.winningOption !== undefined &&
                  market.winningOption !== null && (
                    <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl p-3 sm:p-4 border border-blue-500/20">
                      <div className="flex items-center space-x-2 mb-2">
                        {" "}
                        <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-blue-400" />{" "}
                        <span className="font-semibold text-blue-400 text-sm sm:text-base">
                          Market Resolved
                        </span>{" "}
                      </div>
                      <p className="text-white font-bold text-base sm:text-lg">
                        {" "}
                        Winner:{" "}
                        {market.options[market.winningOption] ?? "N/A"}{" "}
                      </p>
                    </div>
                  )}

                {/* Show Cancelled message */}
                {actualStatus === MarketStatus.Cancelled && (
                  <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-xl p-3 sm:p-4 border border-red-500/20">
                    <div className="flex items-center space-x-2 text-red-400">
                      {" "}
                      <XCircle className="h-4 w-4" />{" "}
                      <span className="text-sm font-medium">
                        Market Cancelled
                      </span>{" "}
                    </div>
                  </div>
                )}

                {/* Show betting disabled message */}
                {isBettingDisabled &&
                  actualStatus !== MarketStatus.Resolved &&
                  actualStatus !== MarketStatus.Cancelled && (
                    <div className="bg-gradient-to-r from-gray-700/10 to-gray-600/10 rounded-xl p-3 sm:p-4 border border-gray-600/20">
                      <div className="flex items-center space-x-2 text-gray-400">
                        {" "}
                        <Lock className="h-4 w-4" />{" "}
                        <span className="text-sm font-medium">
                          {getDisabledMessage()}
                        </span>{" "}
                      </div>
                    </div>
                  )}

                {/* Options List & Bet Buttons */}
                <div className="space-y-2 sm:space-y-3">
                  {(market.options || []).map((option, index) => (
                    <div
                      key={index}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg border transition-all duration-200 ${
                        // Style based on resolved winner or disabled state
                        actualStatus === MarketStatus.Resolved &&
                        index === market.winningOption
                          ? "border-green-500/50 bg-green-900/20 scale-[1.01]"
                          : actualStatus === MarketStatus.Resolved
                            ? "border-gray-700/40 bg-gray-800/10 opacity-60"
                            : isBettingDisabled
                              ? "border-gray-700/40 bg-gray-800/10 cursor-not-allowed opacity-60"
                              : index === leadingOptionIndex
                                ? "border-green-500/30 bg-green-900/10 hover:border-green-500/60 hover:bg-green-900/20"
                                : "border-gray-700/50 bg-gray-800/20 hover:border-gray-600 hover:bg-gray-800/40"
                      }`}
                    >
                      {/* Option Text */}
                      <div className="flex-1 min-w-0 mb-2 sm:mb-0 sm:mr-4">
                        <span
                          className={`font-medium text-sm sm:text-base ${
                            actualStatus === MarketStatus.Resolved &&
                            index === market.winningOption
                              ? "text-green-300"
                              : isBettingDisabled
                                ? "text-gray-500"
                                : "text-white"
                          }`}
                        >
                          {option}
                        </span>
                      </div>
                      {/* Price/Odds & Bet Button */}
                      <div className="flex items-center justify-end sm:justify-start space-x-2 sm:space-x-3 w-full sm:w-auto">
                        <Badge
                          variant="outline"
                          className={`px-2 py-1 text-xs sm:text-sm font-bold whitespace-nowrap ${getOptionBadgeStyle(index)}`}
                        >
                          {formatOdds(optionPercentages[index] || 0)}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleBet(index)}
                          disabled={isBettingDisabled}
                          className={`h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all duration-200 ${getOptionButtonStyle(index)}`}
                        >
                          Bet {formatOdds(optionPercentages[index] || 0)}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* User Position Display (Multi-Option) */}
                {userPosition && (
                  <div className="bg-gradient-to-r from-[#0A0C14] to-[#1A1F2C]/30 rounded-xl p-3 sm:p-4 border border-gray-800/50 mt-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
                      {" "}
                      <Zap className="h-4 w-4 text-[#9b87f5]" />{" "}
                      <span>Your Position</span>{" "}
                    </h4>
                    {/* Dynamic Grid based on number of options */}
                    <div
                      className={`grid gap-2 sm:gap-4 text-xs sm:text-sm ${market.options && market.options.length === 2 ? "grid-cols-2" : market.options && market.options.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}
                    >
                      {(market.options || []).map((option, index) => (
                        <div
                          key={index}
                          className="text-center bg-gray-800/30 p-2 rounded-md"
                        >
                          <div
                            className={`font-bold text-sm sm:text-lg ${parseFloat(userPosition.optionShares[index] || "0") > 0 ? "text-[#9b87f5]" : "text-gray-500"}`}
                          >
                            {formatCurrency(
                              userPosition.optionShares[index] || "0",
                            )}
                          </div>
                          <div
                            className="text-gray-500 text-xs truncate mt-1"
                            title={option}
                          >
                            {option.length > 15
                              ? option.substring(0, 12) + "..."
                              : option}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3 pt-3 border-t border-gray-700/50 text-center">
                      <div>
                        <div className="text-white font-bold text-sm sm:text-base">
                          {formatCurrency(userPosition.totalInvested)}
                        </div>
                        <div className="text-gray-500 text-xs">Invested</div>
                      </div>
                      <div>
                        <div
                          className={`font-bold text-sm sm:text-base ${parseFloat(userPosition.currentValue) >= parseFloat(userPosition.totalInvested) ? "text-green-400" : "text-red-400"}`}
                        >
                          {formatCurrency(userPosition.currentValue)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          Current Value
                        </div>
                      </div>
                      <div>
                        <div
                          className={`font-bold text-sm sm:text-base ${parseFloat(userPosition.profitLoss) >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {parseFloat(userPosition.profitLoss) >= 0 ? "+" : ""}
                          {formatCurrency(userPosition.profitLoss)}
                        </div>
                        <div className="text-gray-500 text-xs">P/L</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Market Stats (Volume, Shares, Trades) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-gray-800/50">
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-800/20">
                    {" "}
                    <div className="text-base sm:text-xl font-bold text-white">
                      {formatCurrency(market.totalPool)}
                    </div>{" "}
                    <div className="text-xs text-gray-400 font-medium">
                      Volume
                    </div>{" "}
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-800/20">
                    {" "}
                    <div className="text-base sm:text-xl font-bold text-white">
                      {formatCurrency(totalSharesValue)}
                    </div>{" "}
                    <div className="text-xs text-gray-400 font-medium">
                      Total Shares
                    </div>{" "}
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-800/20">
                    {" "}
                    <div className="text-base sm:text-xl font-bold text-white">
                      {market.totalParticipants ?? "~"}
                    </div>{" "}
                    <div className="text-xs text-gray-400 font-medium">
                      Participants
                    </div>{" "}
                  </div>{" "}
                  {/* Use totalParticipants if available */}
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Activity and Comments */}
            <div className="space-y-4">
              <Tabs defaultValue="bets" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-[#1A1F2C] to-[#151923] border border-gray-800/50 rounded-xl p-1 h-10 sm:h-12">
                  <TabsTrigger
                    value="bets"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9b87f5] data-[state=active]:to-[#8b5cf6] data-[state=active]:text-white data-[state=inactive]:text-gray-400 hover:text-white rounded-lg h-8 sm:h-10 text-xs sm:text-sm"
                  >
                    {" "}
                    <Activity className="h-3 w-3 mr-1" /> Bets{" "}
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9b87f5] data-[state=active]:to-[#8b5cf6] data-[state=active]:text-white data-[state=inactive]:text-gray-400 hover:text-white rounded-lg h-8 sm:h-10 text-xs sm:text-sm"
                  >
                    {" "}
                    <Users className="h-3 w-3 mr-1" /> Comments{" "}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="bets" className="mt-4">
                  <MarketActivity
                    marketId={market.id}
                    marketTitle={market.title}
                    options={market.options} // Pass options array
                  />
                </TabsContent>

                <TabsContent value="comments" className="mt-4">
                  <CommentsSection
                    marketId={parseInt(market.id)}
                    marketTitle={market.title}
                    currentUserAddress={`${user?.addr}`}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>{" "}
          {/* End Left Column */}
          {/* Right Column (Sidebar) */}
          <div className="space-y-4 sm:space-y-6">
            {/* Market Status Card */}
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 shadow-xl">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center space-x-2 text-white text-lg sm:text-xl">
                  {/* Icon based on actualStatus */}
                  {actualStatus === MarketStatus.Active && (
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  )}
                  {actualStatus === MarketStatus.PendingResolution && (
                    <Clock className="h-5 w-5 text-orange-400" />
                  )}
                  {actualStatus === MarketStatus.Resolved && (
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                  )}
                  {actualStatus === MarketStatus.Cancelled && (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <span>Market Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <Badge
                  variant="outline"
                  className={`w-full justify-center py-2 sm:py-3 text-sm font-semibold border`}
                >
                  {getStatusName(actualStatus)}
                </Badge>
                {/* Countdown or Status Message */}
                {actualStatus === MarketStatus.Active && (
                  <div className="text-center bg-gray-800/30 rounded-lg p-3 sm:p-4">
                    <CountdownTimer
                      endTime={parseInt(market.endTime) * 1000}
                      showIcon={false}
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      until trading ends
                    </p>
                  </div>
                )}
                {actualStatus === MarketStatus.PendingResolution && (
                  <div className="text-center bg-orange-500/10 rounded-xl p-3 sm:p-4 border border-orange-500/20">
                    <p className="text-orange-400 font-semibold text-sm">
                      Market ended - awaiting resolution
                    </p>
                  </div>
                )}
                {actualStatus === MarketStatus.Resolved &&
                  market.winningOption !== undefined && (
                    <div className="text-center p-3 sm:p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <p className="text-blue-400 font-semibold text-sm sm:text-base">
                        Resolved:{" "}
                        {market.options[market.winningOption] ?? "N/A"}
                      </p>
                    </div>
                  )}
                {actualStatus === MarketStatus.Cancelled && (
                  <div className="text-center p-3 sm:p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                    <p className="text-red-400 font-semibold text-sm">
                      Market Cancelled
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Creator Info Card */}
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 shadow-xl">
              <CardHeader className="pb-3 sm:pb-6">
                {" "}
                <CardTitle className="text-white text-lg sm:text-xl">
                  Market Creator
                </CardTitle>{" "}
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${market.creator}`}
                    />
                    <AvatarFallback className="bg-[#9b87f5]/20 text-[#9b87f5] font-bold">
                      {market.creator.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/profile/${market.creator}`}
                      /* Update link path if needed */ className="font-semibold text-[#9b87f5] hover:text-[#8b5cf6] transition-colors text-sm sm:text-base block truncate"
                    >
                      {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
                    </Link>
                    <p className="text-xs text-gray-400">Market Creator</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Refresh Button */}
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefreshing}
              className="w-full h-10 sm:h-12 border-gray-700 text-gray-300 hover:bg-[#1A1F2C] bg-[#1A1F2C] hover:text-white hover:border-[#9b87f5]/50 transition-all font-medium text-sm sm:text-base"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>{" "}
          {/* End Right Column */}
        </div>{" "}
        {/* End Main Grid */}
        {/* Bet Dialog */}
        <BetDialog
          open={betDialogOpen && !isBettingDisabled}
          onOpenChange={setBetDialogOpen}
          market={market} // Pass full market object
          initialOptionIndex={selectedOptionIndex} // Pass index
          onBetSuccess={handleBetSuccess}
        />
      </div>{" "}
      {/* End Container */}
    </div> /* End Root Div */
  );
}
