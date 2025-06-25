import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Market,
  MarketCategory,
  MarketCategoryLabels,
  MarketStatus
} from "@/types/market";
import { Clock, ExternalLink, Flame, TrendingUp, Users2 } from "lucide-react";
import Link from "next/link";
import React from "react";

interface MarketCardProps {
  market: Market;
  className?: string;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  className = "",
}) => {
  // Calculate percentages for odds
  const totalShares =
    parseFloat(market.totalOptionAShares) +
    parseFloat(market.totalOptionBShares);
  const optionAPercentage =
    totalShares > 0
      ? (parseFloat(market.totalOptionAShares) / totalShares) * 100
      : 50;
  const optionBPercentage =
    totalShares > 0
      ? (parseFloat(market.totalOptionBShares) / totalShares) * 100
      : 50;

  // Format odds like Polymarket (e.g., 67¢)
  const formatOdds = (percentage: number) => {
    return `${Math.round(percentage)}¢`;
  };

  // Calculate volume (approximation)
  const volume = parseFloat(market.totalPool);
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

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  // Category color mapping for dark theme
  const getCategoryColor = (category: MarketCategory) => {
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

  const isActive = market.status === MarketStatus.Active;
  const timeRemaining = getTimeRemaining();
  const isHot = volume > 1000; // Consider markets with >1000 FLOW as "hot"
  const isEndingSoon = isActive && timeRemaining !== "Ended" && (
    timeRemaining.includes('h') || timeRemaining.includes('m')
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
              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className={`text-xs font-medium px-2 py-0.5 border ${getCategoryColor(market.category)}`}
                >
                  {MarketCategoryLabels[market.category]}
                </Badge>
                
                {/* Hot indicator */}
                {isHot && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs">
                    <Flame className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>

              {isActive && (
                <div className={`flex items-center text-xs px-1.5 py-0.5 rounded-full ${
                  isEndingSoon 
                    ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                    : "bg-gray-700/50 text-gray-400"
                }`}>
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  {timeRemaining}
                </div>
              )}
            </div>

            <h3 className="font-semibold text-white text-sm leading-5 line-clamp-2 group-hover:text-gray-100 mb-2">
              {market.title}
            </h3>

            {/* Market Stats */}
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <div className="flex items-center gap-1 px-1.5 py-1 bg-[#0A0C14]/50 rounded">
                <TrendingUp className="h-3 w-3 text-[#9b87f5]" />
                <span className="font-medium">{formatVolume(volume)}</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-1 bg-[#0A0C14]/50 rounded">
                <Users2 className="h-3 w-3 text-[#9b87f5]" />
                <span className="font-medium">{Math.ceil(totalShares / 100)}</span>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="px-3 pb-2 space-y-2">
            {/* Option A */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-700/50 hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-200 group/option">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate group-hover/option:text-green-100">
                  {market.optionA}
                </div>
              </div>
              <div className="ml-2 flex items-center gap-1">
                <div
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                    optionAPercentage > 50
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-gray-700/50 text-gray-300"
                  }`}
                >
                  {formatOdds(optionAPercentage)}
                </div>
                {optionAPercentage > optionBPercentage && (
                  <TrendingUp className="h-2.5 w-2.5 text-green-400" />
                )}
              </div>
            </div>

            {/* Option B */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-700/50 hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-200 group/option">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate group-hover/option:text-red-100">
                  {market.optionB}
                </div>
              </div>
              <div className="ml-2 flex items-center gap-1">
                <div
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                    optionBPercentage > 50
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-gray-700/50 text-gray-300"
                  }`}
                >
                  {formatOdds(optionBPercentage)}
                </div>
                {optionBPercentage > optionAPercentage && (
                  <TrendingUp className="h-2.5 w-2.5 text-green-400" />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 pb-3">
            <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
              <div className="text-xs text-gray-400">
                {market.resolved ? (
                  <span className="font-medium text-gray-300 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    Resolved
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[#9b87f5] rounded-full animate-pulse"></div>
                    {parseFloat(market.totalPool).toFixed(0)} FLOW
                  </span>
                )}
              </div>

              <Button
                size="sm"
                className="h-6 px-3 text-xs bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <ExternalLink className="h-2.5 w-2.5 mr-1" />
                Trade
              </Button>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};