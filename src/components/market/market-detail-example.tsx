/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
"use client";

import { BetDialog } from "@/components/market/bet-dialog";
import { MarketActions } from "@/components/market/market-actions";
import { CommentsSection } from "@/components/comments/comments-section";
import { CountdownTimer } from "@/components/market/countdown-timer";
import { MarketError } from "@/components/market/market-error";
import { MarketLoading } from "@/components/market/market-loading";
import { MarketActivity } from "@/components/market/market-activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMarketDetail } from "@/hooks/use-market-detail";
import { useForteActions } from "@/hooks/useForteActions";
import {
  extractImageFromMarket,
  getOptimizedImageUrl,
  isValidImageUrl,
} from "@/lib/flow/market";
import { useAuth } from "@/providers/auth-provider";
import { MarketCategory, MarketStatus } from "@/types/market";
import {
  BarChart3,
  Bookmark,
  Calendar,
  CheckCircle,
  Clock,
  Flag,
  Flame,
  Image as ImageIcon,
  Lock,
  Pause,
  RefreshCw,
  Share2,
  TrendingUp,
  Users,
  Volume2,
  Zap,
  Activity,
  Bot,
  Timer,
  Sparkles,
  Info,
  Settings
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function MarketDetailExamplePage() {
  const params = useParams();
  const marketId = params.id as string;
  const { user } = useAuth();

  // Forte Actions Integration
  const {
    isInitialized: forteInitialized,
    scheduledTransactions,
    initialize: initializeForte
  } = useForteActions();

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
    "optionA",
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
      }, 30000);

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
  const imageUrl = extractImageFromMarket(market);
  const optimizedImageUrl = imageUrl ? getOptimizedImageUrl(imageUrl) : null;
  const displayImageUrl = optimizedImageUrl || imageUrl;

  // Calculate market percentages
  const totalShares =
    parseFloat(market.totalOptionAShares) +
    parseFloat(market.totalOptionBShares);
  const optionAPercentage =
    totalShares > 0
      ? (parseFloat(market.totalOptionAShares) / totalShares) * 100
      : 50;
  const optionBPercentage = 100 - optionAPercentage;

  // Currency formatting
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // Category configuration
  const getCategoryConfig = (category?: MarketCategory) => {
    switch (category) {
      case MarketCategory.Sports:
        return { icon: "⚽", color: "text-green-400", bg: "bg-green-500/20" };
      case MarketCategory.Politics:
        return { icon: "🗳️", color: "text-blue-400", bg: "bg-blue-500/20" };
      case MarketCategory.Crypto:
        return { icon: "₿", color: "text-yellow-400", bg: "bg-yellow-500/20" };
      case MarketCategory.Entertainment:
        return { icon: "🎬", color: "text-purple-400", bg: "bg-purple-500/20" };
      default:
        return { icon: "📊", color: "text-gray-400", bg: "bg-gray-500/20" };
    }
  };

  const categoryConfig = getCategoryConfig(market.category);

  // Market status logic
  const getActualMarketStatus = (): MarketStatus => {
    if (market.resolved) return MarketStatus.Resolved;
    if (market.paused) return MarketStatus.Paused;

    const now = Date.now();
    const endTime = parseInt(market.endTime) * 1000;

    if (endTime <= now) return MarketStatus.PendingResolution;
    return MarketStatus.Active;
  };

  const actualStatus = getActualMarketStatus();

  // Check if market allows betting
  const isBettingDisabled =
    actualStatus !== MarketStatus.Active ||
    (market.endTime && parseInt(market.endTime) * 1000 <= Date.now());

  // Get status info
  const getStatusInfo = () => {
    switch (actualStatus) {
      case MarketStatus.Active:
        return {
          icon: <Flame className="h-4 w-4" />,
          text: "Active",
          color: "text-green-400",
          bg: "bg-green-500/20",
        };
      case MarketStatus.PendingResolution:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: "Pending Resolution",
          color: "text-yellow-400",
          bg: "bg-yellow-500/20",
        };
      case MarketStatus.Resolved:
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: "Resolved",
          color: "text-blue-400",
          bg: "bg-blue-500/20",
        };
      case MarketStatus.Paused:
        return {
          icon: <Pause className="h-4 w-4" />,
          text: "Paused",
          color: "text-red-400",
          bg: "bg-red-500/20",
        };
      default:
        return {
          icon: <Activity className="h-4 w-4" />,
          text: "Unknown",
          color: "text-gray-400",
          bg: "bg-gray-500/20",
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleBet = (side: "optionA" | "optionB") => {
    if (isBettingDisabled) return;
    setSelectedSide(side);
    setBetDialogOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMarketData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleBetSuccess = () => {
    setBetDialogOpen(false);
    setTimeout(() => {
      refreshMarketData();
    }, 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: market.title,
          text: market.description,
          url: `https://flowwager.xyz/markets/${marketId}`,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const getBettingDisabledReason = () => {
    if (actualStatus === MarketStatus.Resolved) {
      return "Market has been resolved";
    }
    if (actualStatus === MarketStatus.PendingResolution) {
      return "Market has ended, pending resolution";
    }
    if (actualStatus === MarketStatus.Paused) {
      return "Market is paused";
    }
    return "Betting not available";
  };

  // Get scheduled bets for this market
  const userScheduledBets = scheduledTransactions.filter(
    tx => tx.action.marketId === market.id && tx.status === 'PENDING'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0C14] via-[#151923] to-[#1A1F2C] text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Enhanced Header with Forte Features */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="space-y-4 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div
                  className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${categoryConfig.bg} ${categoryConfig.color}`}
                >
                  <span className="mr-1">{categoryConfig.icon}</span>
                  {market.category || "General"}
                </div>

                <div
                  className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}
                >
                  {statusInfo.icon}
                  <span className="ml-1">{statusInfo.text}</span>
                </div>

                {/* Forte Status Badge */}
                {forteInitialized && (
                  <Badge variant="default" className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30">
                    <Bot className="h-3 w-3 mr-1" />
                    Automation Ready
                  </Badge>
                )}

                {userScheduledBets.length > 0 && (
                  <Badge variant="secondary">
                    <Timer className="h-3 w-3 mr-1" />
                    {userScheduledBets.length} Scheduled
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                {market.title}
              </h1>

              <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-3xl">
                {market.description}
              </p>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]"
              >
                <Share2 className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`border-gray-700 hover:bg-[#1A1F2C] ${
                  isBookmarked
                    ? "text-[#9b87f5] border-[#9b87f5]"
                    : "text-gray-300 hover:border-[#9b87f5]"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Market Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <span className="text-gray-400">Created:</span>
              <span className="whitespace-nowrap">
                {new Date(parseInt(market.createdAt) * 1000).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              <CountdownTimer endTime={parseInt(market.endTime) * 1000} />
            </div>

            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-green-400 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {formatCurrency(market.totalPool)} FLOW volume
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-[#9b87f5] flex-shrink-0" />
              <span className="whitespace-nowrap">
                {parseInt(market.totalOptionAShares) + parseInt(market.totalOptionBShares)} shares
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Market Info & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Prices Card */}
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-[#9b87f5]" />
                  <span>Current Prices</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-[#9b87f5] truncate pr-2">
                      {market.optionA} {optionAPercentage.toFixed(1)}%
                    </span>
                    <span className="text-gray-400 truncate pl-2">
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

                {/* Resolved Outcome */}
                {actualStatus === MarketStatus.Resolved && market.outcome !== undefined && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold text-blue-400">Market Resolved</div>
                      <p className="text-white font-bold">
                        Winner: {market.outcome === 0 ? market.optionA : market.optionB}
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* User Position */}
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
                        <div className="text-gray-500 text-xs">Total invested</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Forte Automation Notice */}
                {!forteInitialized && user && (
                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Enable Advanced Features</div>
                        <div className="text-sm text-muted-foreground">
                          Initialize Forte Actions for conditional betting and automation
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={initializeForte}
                        className="ml-4"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Initialize
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Market Actions - Replace traditional betting buttons */}
            <MarketActions
              market={market}
              onBetSuccess={handleBetSuccess}
              className="lg:col-span-1"
            />

            {/* Market Image */}
            {displayImageUrl && isValidImageUrl(displayImageUrl) && (
              <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-video">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <ImageIcon className="h-12 w-12 text-gray-600" />
                      </div>
                    )}
                    <img
                      src={displayImageUrl}
                      alt={market.title}
                      className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageError(true);
                        setImageLoading(false);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Activity */}
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-[#9b87f5]" />
                  <span>Market Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MarketActivity
                  marketId={marketId}
                  optionA={market.optionA}
                  optionB={market.optionB}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Comments */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 h-fit">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Users className="h-5 w-5 text-[#9b87f5]" />
                  <span>Discussion</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CommentsSection marketId={marketId} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Bet Dialog with Forte Features */}
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
