"use client";

import { BetDialog } from "@/components/market/bet-dialog";
import { CountdownTimer } from "@/components/market/countdown-timer";
import { MarketLoading } from "@/components/market/market-loading";
import { MarketError } from "@/components/market/market-error";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketDetail } from "@/hooks/use-market-detail";
import { useAuth } from "@/providers/auth-provider";
import { MarketCategory, MarketStatus } from "@/types/market";
import { getOptimizedImageUrl, isValidImageUrl, extractImageFromMarket } from "@/lib/flow/market";
import {
  BarChart3,
  Bookmark,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Flag,
  Lock,
  Pause,
  RefreshCw,
  Share2,
  TrendingUp,
  Users,
  Volume2,
  Zap,
  Image as ImageIcon,
  Flame
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = params.id as string;
  const { user } = useAuth();

  const {
    market,
    trades,
    comments,
    priceHistory,
    userPosition,
    loading,
    error,
    refreshMarketData,
  } = useMarketDetail(marketId, user?.addr || "");

  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [selectedSide, setSelectedSide] = useState<"optionA" | "optionB">(
    "optionA"
  );
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Auto-refresh market data every 30 seconds
  useEffect(() => {
    if (!loading && market) {
      const interval = setInterval(() => {
        console.log("Auto-refreshing market data...");
        refreshMarketData();
      }, 5000000);

      return () => clearInterval(interval);
    }
  }, [loading, market, refreshMarketData]);

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

  // Extract image from market data
  const finalImageURI = market.imageURI || (market.description ? extractImageFromMarket(market.description).imageURI : undefined);
  const optimizedImageUrl = getOptimizedImageUrl(finalImageURI, 800, 400);
  const hasValidImage = isValidImageUrl(optimizedImageUrl) && !imageError;

  const totalShares =
    parseFloat(market.totalOptionAShares) +
    parseFloat(market.totalOptionBShares);
  const optionAPercentage =
    totalShares > 0
      ? (parseFloat(market.totalOptionAShares) / totalShares) * 100
      : 50;
  const optionBPercentage = 100 - optionAPercentage;

  // Compute the actual display status based on contract status and end time
  const getActualMarketStatus = () => {
    const now = Date.now();
    const endTime = parseInt(market.endTime) * 1000;
    
    // If resolved, always show resolved
    if (market.status === MarketStatus.Resolved || market.resolved) {
      return MarketStatus.Resolved;
    }
    
    // If past end time but not resolved, it's pending resolution
    if (endTime <= now && market.status === MarketStatus.Active) {
      return MarketStatus.Paused; // Using Paused to represent "Pending Resolution"
    }
    
    // Otherwise use contract status
    return market.status;
  };

  const actualStatus = getActualMarketStatus();

  // Check if market allows betting
  const isBettingDisabled = actualStatus !== MarketStatus.Active || 
    (market.endTime && parseInt(market.endTime) * 1000 <= Date.now());

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - parseInt(timestamp) * 1000;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const getCategoryName = (category: number) => {
    return Object.values(MarketCategory)[category] || "Other";
  };

  const getStatusName = (status: number) => {
    // Override status names for better UX
    if (status === MarketStatus.Paused && parseInt(market.endTime) * 1000 <= Date.now()) {
      return "Pending Resolution";
    }
    return Object.values(MarketStatus)[status] || "Unknown";
  };

  // const getCategoryColor = (category: number) => {
  //   switch (category) {
  //     case 0: // Politics
  //       return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  //     case 1: // Sports
  //       return "bg-green-500/20 text-green-400 border-green-500/30";
  //     case 2: // Economics
  //       return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  //     case 3: // Technology
  //       return "bg-purple-500/20 text-purple-400 border-purple-500/30";
  //     case 4: // Entertainment
  //       return "bg-pink-500/20 text-pink-400 border-pink-500/30";
  //     case 5: // Crypto
  //       return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  //     case 6: // Weather
  //       return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
  //     case 7: // BreakingNews
  //       return "bg-red-500/20 text-red-400 border-red-500/30";
  //     default:
  //       return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  //   }
  // };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleBet = (side: "optionA" | "optionB") => {
    // Double check betting is allowed
    if (isBettingDisabled) return;
    
    setSelectedSide(side);
    setBetDialogOpen(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: market.title,
          text: market.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBetSuccess = () => {
    setBetDialogOpen(false);
    // Refresh data immediately after successful bet
    setTimeout(() => {
      refreshMarketData();
    }, 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMarketData();
  };

  // Get disabled message based on actual market status
  const getDisabledMessage = () => {
    if (actualStatus === MarketStatus.Resolved) {
      return "Market has been resolved";
    }
    if (market.endTime && parseInt(market.endTime) * 1000 <= Date.now() && actualStatus !== MarketStatus.Resolved) {
      return "Market has ended - awaiting resolution";
    }
    if (actualStatus === MarketStatus.Paused) {
      return "Market is paused";
    }
    return "Betting not available";
  };

  const volume = parseFloat(market.totalPool);
  const isHot = volume > 1000; // Consider markets with >1000 FLOW as "hot"
  // const timeRemaining = new Date(parseInt(market.endTime) * 1000) > new Date();

  console.log("Market Data:", market);

  return (
    <div className="min-h-screen bg-[#0A0C14]">
      {/* Live Data Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-gradient-to-r from-[#1A1F2C] to-[#151923] border border-gray-800/50 rounded-lg px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Data</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Link
            href="/markets"
            className="hover:text-[#9b87f5] transition-colors"
          >
            Markets
          </Link>
          <span>/</span>
          <Link
            href={`/markets?category=${getCategoryName(market.category)}`}
            className="hover:text-[#9b87f5] transition-colors"
          >
            {getCategoryName(market.category)}
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{market.title}</span>
        </div>

        {/* ✅ Enhanced Market Header with Small Logo Image */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#1A1F2C] via-[#151923] to-[#0A0C14] rounded-2xl border border-gray-800/50 p-8 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                {/* ✅ Small logo-style image */}
                {hasValidImage ? (
                  <div className="relative w-16 h-16 flex-shrink-0">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-xl">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9b87f5]"></div>
                      </div>
                    )}
                    <img
                      src={optimizedImageUrl}
                      alt={market.title}
                      className={`w-full h-full object-cover rounded-xl transition-all duration-300 ${
                        imageLoading ? 'opacity-0' : 'opacity-100'
                      }`}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  // ✅ Placeholder logo
                  <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl flex items-center justify-center border border-gray-700/50">
                    <ImageIcon className="h-7 w-7 text-gray-600" />
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30 font-medium">
                    {getCategoryName(market.category)}
                  </Badge>
                  <Badge
                    variant={
                      actualStatus === MarketStatus.Active
                        ? "default"
                        : "secondary"
                    }
                    className={
                      actualStatus === MarketStatus.Active
                        ? "bg-green-500/20 text-green-400 border-green-500/30 font-medium"
                        : actualStatus === MarketStatus.Resolved
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30 font-medium"
                        : actualStatus === MarketStatus.Paused && parseInt(market.endTime) * 1000 <= Date.now()
                        ? "bg-orange-500/20 text-orange-400 border-orange-500/30 font-medium"
                        : "font-medium"
                    }
                  >
                    <div className="flex items-center space-x-1">
                      {actualStatus === MarketStatus.Active && (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {actualStatus === MarketStatus.Paused && (
                        <Pause className="h-3 w-3" />
                      )}
                      {actualStatus === MarketStatus.Resolved && (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      <span>{getStatusName(actualStatus)}</span>
                    </div>
                  </Badge>

                  {/* Hot indicator */}
                  {isHot && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-sm">
                      <Flame className="h-3 w-3" />
                      <span className="text-xs font-medium">Hot</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Action buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white hover:border-[#9b87f5]/50 transition-all"
                >
                  <Bookmark
                    className={`h-4 w-4 ${
                      isBookmarked ? "fill-current text-[#9b87f5]" : ""
                    }`}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white hover:border-[#9b87f5]/50 transition-all"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white hover:border-red-500/50 transition-all"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white leading-tight">
              {market.title}
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              {market.description}
            </p>

            {/* Enhanced Market Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-[#9b87f5]" />
                <span>Created by</span>
                <Link
                  href={`/dashboard/${market.creator}`}
                  className="text-[#9b87f5] hover:text-[#8b5cf6] font-medium transition-colors"
                >
                  {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
                </Link>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                <span>
                  {new Date(
                    parseInt(market.createdAt) * 1000
                  ).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-400" />
                <CountdownTimer endTime={parseInt(market.endTime) * 1000} />
              </div>

              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-green-400" />
                <span>{formatCurrency(market.totalPool)} FLOW volume</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of the existing content remains the same... */}
        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Trading & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Current Prices */}
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-[#9b87f5]" />
                  <span>Current Prices</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Price Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-[#9b87f5]">
                      {market.optionA} {optionAPercentage.toFixed(1)}%
                    </span>
                    <span className="text-gray-400">
                      {market.optionB} {optionBPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={optionAPercentage}
                    className="h-4 bg-gray-800 rounded-full overflow-hidden"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] transition-all duration-500 rounded-full shadow-sm"
                      style={{ width: `${optionAPercentage}%` }}
                    />
                  </Progress>
                </div>

                {/* Show resolved outcome if available */}
                {actualStatus === MarketStatus.Resolved && market.outcome !== undefined && (
                  <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl p-4 border border-blue-500/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-blue-400" />
                      <span className="font-semibold text-blue-400">Market Resolved</span>
                    </div>
                    <p className="text-white font-bold text-lg">
                      Winner: {market.outcome === 0 ? market.optionA : market.optionB}
                    </p>
                  </div>
                )}

                {/* Enhanced User Position Display */}
                {userPosition && (
                  <div className="bg-gradient-to-r from-[#0A0C14] to-[#1A1F2C]/30 rounded-xl p-4 border border-gray-800/50">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-[#9b87f5]" />
                      <span>Your Position</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-[#9b87f5] font-bold text-lg">
                          {formatCurrency(userPosition.optionAShares)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {market.optionA} shares
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 font-bold text-lg">
                          {formatCurrency(userPosition.optionBShares)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {market.optionB} shares
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-lg">
                          {formatCurrency(userPosition.totalInvested)} FLOW
                        </div>
                        <div className="text-gray-500 text-xs">
                          Total invested
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show disabled message for non-active markets */}
                {isBettingDisabled && (
                  <div className="bg-gradient-to-r from-gray-700/10 to-gray-600/10 rounded-xl p-4 border border-gray-600/20">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Lock className="h-4 w-4" />
                      <span className="text-sm font-medium">{getDisabledMessage()}</span>
                    </div>
                  </div>
                )}

                {/* Enhanced Betting Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    onClick={() => handleBet("optionA")}
                    className={`h-20 transform transition-all duration-200 ${
                      isBettingDisabled
                        ? "bg-gray-700/50 text-gray-500 cursor-not-allowed hover:bg-gray-700/50 hover:scale-100 shadow-none"
                        : "bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white shadow-lg shadow-[#9b87f5]/25 hover:shadow-[#9b87f5]/40 hover:scale-105"
                    }`}
                    disabled={!!isBettingDisabled}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold flex items-center justify-center space-x-2">
                        {isBettingDisabled && <Lock className="h-4 w-4" />}
                        <span>{market.optionA}</span>
                      </div>
                      <div className="text-sm opacity-90">
                        {optionAPercentage.toFixed(0)}%
                      </div>
                    </div>
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => handleBet("optionB")}
                    className={`h-20 transform transition-all duration-200 ${
                      isBettingDisabled
                        ? "bg-gray-700/50 text-gray-500 cursor-not-allowed hover:bg-gray-700/50 hover:scale-100 shadow-none"
                        : "bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white shadow-lg hover:shadow-gray-700/40 hover:scale-105"
                    }`}
                    disabled={!!isBettingDisabled}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold flex items-center justify-center space-x-2">
                        {isBettingDisabled && <Lock className="h-4 w-4" />}
                        <span>{market.optionB}</span>
                      </div>
                      <div className="text-sm opacity-90">
                        {optionBPercentage.toFixed(0)}%
                      </div>
                    </div>
                  </Button>
                </div>

                {/* Enhanced Market Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800/50">
                  <div className="text-center p-3 rounded-lg bg-gray-800/20">
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(market.totalPool)}
                    </div>
                    <div className="text-xs text-gray-400 font-medium">
                      Volume
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-800/20">
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(totalShares)}
                    </div>
                    <div className="text-xs text-gray-400 font-medium">
                      Shares
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-800/20">
                    <div className="text-xl font-bold text-white">
                      {trades.length}
                    </div>
                    <div className="text-xs text-gray-400 font-medium">
                      Trades
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Market Details Tabs */}
            <div className="space-y-4">
              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-[#1A1F2C] to-[#151923] border border-gray-800/50 rounded-xl p-1 h-12">
                  <TabsTrigger
                    value="activity"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9b87f5] data-[state=active]:to-[#8b5cf6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white transition-all duration-200 rounded-lg h-10 font-medium"
                  >
                    Activity
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9b87f5] data-[state=active]:to-[#8b5cf6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white transition-all duration-200 rounded-lg h-10 font-medium"
                  >
                    Comments
                  </TabsTrigger>
                  <TabsTrigger
                    value="chart"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9b87f5] data-[state=active]:to-[#8b5cf6] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white transition-all duration-200 rounded-lg h-10 font-medium"
                  >
                    Chart
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="mt-4">
                  <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 shadow-xl">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {trades.length === 0 ? (
                          <div className="text-center py-12 text-gray-400">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No trades yet</p>
                            <p className="text-sm">Be the first to trade!</p>
                          </div>
                        ) : (
                          trades.map((trade) => (
                            <div
                              key={trade.id}
                              className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-800/30 transition-colors border border-gray-800/30"
                            >
                              <div className="flex items-center space-x-4">
                                <Badge
                                  variant={
                                    trade.option === 0 ? "default" : "secondary"
                                  }
                                  className={
                                    trade.option === 0
                                      ? "bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30 font-medium"
                                      : "bg-gray-700/50 text-gray-300 font-medium"
                                  }
                                >
                                  {trade.option === 0
                                    ? market.optionA
                                    : market.optionB}
                                </Badge>
                                <div>
                                  <div className="font-semibold text-white">
                                    {formatCurrency(trade.amount)} FLOW
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    by {trade.user.slice(0, 6)}...
                                    {trade.user.slice(-4)} •{" "}
                                    {formatRelativeTime(trade.timestamp)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-white">
                                  {formatCurrency(trade.price)} FLOW
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="comments" className="mt-4">
                  <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 shadow-xl">
                    <CardContent className="pt-6 space-y-6">
                      {comments.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No comments yet</p>
                          <p className="text-sm">Start the discussion!</p>
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="space-y-3">
                            <div className="flex items-start space-x-3 p-4 rounded-xl bg-gray-800/20 border border-gray-800/30">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user}`}
                                />
                                <AvatarFallback className="bg-[#9b87f5]/20 text-[#9b87f5] font-bold">
                                  {comment.user.slice(2, 4).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-semibold text-white">
                                    {comment.user.slice(0, 6)}...
                                    {comment.user.slice(-4)}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatRelativeTime(comment.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                  {comment.content}
                                </p>
                                <div className="flex items-center space-x-4 mt-3">
                                  <button className="text-xs text-gray-400 hover:text-[#9b87f5] transition-colors font-medium">
                                    {comment.likes} likes
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chart" className="mt-4">
                  <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 shadow-xl">
                    <CardContent className="pt-6">
                      <div className="h-64 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">
                            Price chart data: {priceHistory.length} points
                            available
                          </p>
                          <p className="text-sm">
                            Chart visualization coming soon
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column - Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Market Status */}
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  {actualStatus === MarketStatus.Active && (
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  )}
                  {actualStatus === MarketStatus.Paused && (
                    <Clock className="h-5 w-5 text-orange-400" />
                  )}
                  {actualStatus === MarketStatus.Resolved && (
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                  )}
                  <span>Market Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Badge
                    variant={
                      actualStatus === MarketStatus.Active
                        ? "default"
                        : "secondary"
                    }
                    className={`w-full justify-center py-3 text-sm font-semibold ${
                      actualStatus === MarketStatus.Active
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : actualStatus === MarketStatus.Resolved
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : actualStatus === MarketStatus.Paused && parseInt(market.endTime) * 1000 <= Date.now()
                        ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                        : "bg-gray-700/50 text-gray-300"
                    }`}
                  >
                    {getStatusName(actualStatus)}
                  </Badge>
                  {actualStatus === MarketStatus.Active && (
                    <div className="text-center bg-gray-800/30 rounded-lg p-4">
                      <CountdownTimer
                        endTime={parseInt(market.endTime) * 1000}
                        showIcon={false}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        until trading ends
                      </p>
                    </div>
                  )}
                  {actualStatus === MarketStatus.Paused && parseInt(market.endTime) * 1000 <= Date.now() && (
                    <div className="text-center bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                      <p className="text-orange-400 font-semibold text-sm">
                        Market has ended and is awaiting admin resolution
                      </p>
                    </div>
                  )}
                  {actualStatus === MarketStatus.Resolved &&
                    market.outcome !== undefined &&
                    market.outcome !== null && (
                      <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <p className="text-blue-400 font-semibold">
                          Resolved:{" "}
                          {market.outcome === 0
                            ? market.optionA
                            : market.optionB}
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Creator Info */}
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">Market Creator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${market.creator}`}
                    />
                    <AvatarFallback className="bg-[#9b87f5]/20 text-[#9b87f5] font-bold">
                      {market.creator.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Link
                      href={`/profile/${market.creator}`}
                      className="font-semibold text-[#9b87f5] hover:text-[#8b5cf6] transition-colors"
                    >
                      {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
                    </Link>
                    <p className="text-xs text-gray-400">Market Creator</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]/50 transition-all"
                  >
                    <Link href={`/profile/${market.creator}`}>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Refresh Data */}
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isRefreshing}
              className="w-full h-12 border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white hover:border-[#9b87f5]/50 transition-all font-medium"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>
        </div>

        {/* Bet Dialog - Pass disabled state */}
        <BetDialog
          open={betDialogOpen && !isBettingDisabled}
          onOpenChange={setBetDialogOpen}
          market={market}
          initialSide={selectedSide}
          onBetSuccess={handleBetSuccess}
        />
      </div>
    </div>
  );
}