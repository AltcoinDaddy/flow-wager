import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, Users2, ExternalLink } from "lucide-react";
import {
  Market,
  MarketStatus,
  MarketCategory,
  MarketStatusLabels,
  MarketCategoryLabels,
} from "@/types/market";
import { formatTime } from "@/lib/utils";

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
    return `${Math.round(percentage)}`;
  };

  // Calculate volume (approximation)
  const volume = parseFloat(market.totalPool);
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol.toFixed(0)}`;
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

  const isActive = market.status === MarketStatus.Active;
  const timeRemaining = getTimeRemaining();

  return (
    <Card
      className={`group hover:shadow-lg transition-all duration-200 border-gray-100 hover:border-gray-200 bg-white ${className}`}
    >
      <CardContent className="p-0">
        <Link href={`/markets/${market.id}`} className="block">
          {/* Header */}
          <div className="p-4 pb-3">
            <div className="flex items-start justify-between mb-3">
              <Badge
                variant="secondary"
                className={`text-xs font-medium px-2 py-1 ${
                  market.category === MarketCategory.Politics
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : market.category === MarketCategory.Sports
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {MarketCategoryLabels[market.category]}
              </Badge>

              {isActive && (
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(Number(timeRemaining))}
                </div>
              )}
            </div>

            <h3 className="font-medium text-gray-900 text-sm leading-5 line-clamp-2 group-hover:text-gray-800 mb-3">
              {market.title}
            </h3>

            {/* Market Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>{formatVolume(volume)} FLOW</span>
              </div>
              <div className="flex items-center">
                <Users2 className="h-3 w-3 mr-1" />
                <span>{Math.ceil(totalShares / 100)}</span>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="px-4 pb-4 space-y-2">
            {/* Option A */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-colors group/option">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {market.optionA}
                </div>
              </div>
              <div className="ml-3 flex items-center">
                <div
                  className={`px-2 py-1 rounded text-sm font-semibold ${
                    optionAPercentage > 50
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {formatOdds(optionAPercentage)}
                </div>
                {optionAPercentage > optionBPercentage && (
                  <TrendingUp className="h-3 w-3 ml-2 text-green-600" />
                )}
              </div>
            </div>

            {/* Option B */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-colors group/option">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {market.optionB}
                </div>
              </div>
              <div className="ml-3 flex items-center">
                <div
                  className={`px-2 py-1 rounded text-sm font-semibold ${
                    optionBPercentage > 50
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {formatOdds(optionBPercentage)}
                </div>
                {optionBPercentage > optionAPercentage && (
                  <TrendingUp className="h-3 w-3 ml-2 text-green-600" />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {market.resolved ? (
                  <span className="font-medium text-gray-700">
                    Resolved • {MarketStatusLabels[market.status]}
                  </span>
                ) : (
                  <span>
                    Pool: {parseFloat(market.totalPool).toFixed(0)} FLOW
                  </span>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Trade
              </Button>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};
