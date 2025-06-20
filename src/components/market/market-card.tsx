"use client";

// src/components/market/market-card.tsx

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BetDialog } from "./bet-dialog";
import { CountdownTimer } from "./countdown-timer";
import { 
  Clock,
  TrendingUp,
  Users,
  Volume2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap
} from "lucide-react";
import type { Market } from "@/types/market";

interface MarketCardProps {
  market: Market;
  showCreator?: boolean;
  compact?: boolean;
}

export function MarketCard({ market, showCreator = true, compact = false }: MarketCardProps) {
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [selectedSide, setSelectedSide] = useState<"optionA" | "optionB">("optionA");

  // Calculate percentages based on total shares
  const totalShares = market.totalOptionAShares + market.totalOptionBShares;
  const optionAPercentage = totalShares > 0 ? (market.totalOptionAShares / totalShares) * 100 : 50;
  const optionBPercentage = 100 - optionAPercentage;
  
  // Calculate implied prices (simplified)
  const optionAPrice = optionAPercentage / 100;
  const optionBPrice = optionBPercentage / 100;

  const isActive = market.status === "Active";
  const isResolved = market.status === "Resolved";
  const timeUntilEnd = market.endTime - Date.now();
  const isEndingSoon = timeUntilEnd < 24 * 60 * 60 * 1000; // 24 hours

  const handleBet = (side: "optionA" | "optionB") => {
    setSelectedSide(side);
    setBetDialogOpen(true);
  };

  const getStatusIcon = () => {
    switch (market.status) {
      case "Active":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "Resolved":
        return market.outcome === "OptionA" ? 
          <CheckCircle className="h-4 w-4 text-green-500" /> : 
          market.outcome === "OptionB" ?
          <CheckCircle className="h-4 w-4 text-blue-500" /> :
          <XCircle className="h-4 w-4 text-red-500" />;
      case "Closed":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const formatCurrency = (value: number) => {
    return `${formatNumber(value)} FLOW`;
  };

  return (
    <>
      <Card className={`group relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
        compact ? "h-auto" : "h-full"
      } ${
        isEndingSoon && isActive ? "ring-2 ring-yellow-200 dark:ring-yellow-800" : ""
      }`}>
        {/* Market Image */}
        {market.imageURI && !compact && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={market.imageURI}
              alt={market.question}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Status Badge Overlay */}
            <div className="absolute top-3 left-3 flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                {getStatusIcon()}
                <span className="capitalize">{market.status}</span>
              </Badge>
              {market.isBreakingNews && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>Breaking</span>
                </Badge>
              )}
            </div>

            {/* Category Badge */}
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="bg-white/90 text-black">
                {market.category}
              </Badge>
            </div>
          </div>
        )}

        <CardContent className={compact ? "p-4" : "p-6"}>
          {/* Header for compact mode */}
          {compact && (
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="flex items-center space-x-1">
                  {getStatusIcon()}
                  <span className="capitalize">{market.status}</span>
                </Badge>
                <Badge variant="outline">{market.category}</Badge>
                {market.isBreakingNews && (
                  <Badge variant="destructive" className="flex items-center space-x-1">
                    <Zap className="h-3 w-3" />
                    <span>Breaking</span>
                  </Badge>
                )}
              </div>
              {isEndingSoon && isActive && (
                <Badge variant="destructive" className="text-xs">
                  Ending Soon
                </Badge>
              )}
            </div>
          )}

          {/* Title */}
          <Link href={`/markets/${market.id}`}>
            <h3 className={`font-semibold leading-tight text-foreground hover:text-primary transition-colors ${
              compact ? "text-base mb-2" : "text-lg mb-3"
            }`}>
              {market.question}
            </h3>
          </Link>

          {/* Price Display */}
          <div className="space-y-3 mb-4">
            {/* Option Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size={compact ? "sm" : "default"}
                onClick={() => handleBet("optionA")}
                disabled={!isActive}
                className="flex-1 justify-between bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950 dark:hover:bg-green-900 dark:border-green-800 dark:text-green-300"
              >
                <span className="truncate text-xs">{market.optionA}</span>
                <span className="font-bold">{optionAPercentage.toFixed(0)}%</span>
              </Button>
              <Button
                variant="outline"
                size={compact ? "sm" : "default"}
                onClick={() => handleBet("optionB")}
                disabled={!isActive}
                className="flex-1 justify-between bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:border-blue-800 dark:text-blue-300"
              >
                <span className="truncate text-xs">{market.optionB}</span>
                <span className="font-bold">{optionBPercentage.toFixed(0)}%</span>
              </Button>
            </div>

            {/* Price Progress Bar */}
            <div className="space-y-1">
              <Progress value={optionAPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{optionAPercentage.toFixed(1)}% {market.optionA}</span>
                <span>{optionBPercentage.toFixed(1)}% {market.optionB}</span>
              </div>
            </div>
          </div>

          {/* Creator Info */}
          {showCreator && !compact && (
            <div className="flex items-center space-x-2 mb-4">
              <Avatar className="h-6 w-6">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${market.creator}`} />
                <AvatarFallback className="text-xs">
                  {market.creator.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                Created by {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
              </span>
            </div>
          )}

          {/* Resolution Display */}
          {isResolved && market.outcome !== "Unresolved" && (
            <div className={`p-3 rounded-lg mb-4 ${
              market.outcome === "OptionA" 
                ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                : market.outcome === "OptionB"
                ? "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
                : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
            }`}>
              <div className="flex items-center space-x-2">
                {market.outcome === "OptionA" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : market.outcome === "OptionB" ? (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  market.outcome === "OptionA" 
                    ? "text-green-700 dark:text-green-300" 
                    : market.outcome === "OptionB"
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-red-700 dark:text-red-300"
                }`}>
                  Resolved: {
                    market.outcome === "OptionA" ? market.optionA :
                    market.outcome === "OptionB" ? market.optionB :
                    "Cancelled"
                  }
                </span>
              </div>
            </div>
          )}

          {/* Betting Limits */}
          {!compact && isActive && (
            <div className="text-xs text-muted-foreground mb-2">
              Bet limits: {market.minBet} - {market.maxBet} FLOW
            </div>
          )}
        </CardContent>

        <CardFooter className={`border-t bg-muted/50 ${compact ? "p-3" : "p-4"}`}>
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            {/* Volume */}
            <div className="flex items-center space-x-1">
              <Volume2 className="h-3 w-3" />
              <span>{formatCurrency(market.totalPool)}</span>
            </div>

            {/* Participants */}
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{market.totalOptionAShares + market.totalOptionBShares} shares</span>
            </div>

            {/* Time */}
            {isActive ? (
              <CountdownTimer endTime={market.endTime} compact />
            ) : (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {isResolved 
                    ? "Resolved" 
                    : new Date(market.endTime).toLocaleDateString()
                  }
                </span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Bet Dialog */}
      <BetDialog
        open={betDialogOpen}
        onOpenChange={setBetDialogOpen}
        market={market}
        initialSide={selectedSide}
      />
    </>
  );
}