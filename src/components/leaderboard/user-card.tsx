"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy,
  TrendingUp,
  TrendingDown,
  Medal,
  Crown,
  Target,
  DollarSign,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Minus,
  ExternalLink
} from "lucide-react";
import type { LeaderboardUser } from "@/types/user";

// Mock leaderboard data
const mockLeaderboardUsers: LeaderboardUser[] = [
  {
    address: "0x1234567890abcdef",
    username: "CryptoProphet",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
    rank: 1,
    totalPnL: "15847.23",
    winRate: 87.5,
    totalVolume: "142358.67",
    accuracy: 89.3,
    change: 0
  },
  {
    address: "0x2345678901bcdef0",
    username: "MarketMaster",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
    rank: 2,
    totalPnL: "12934.56",
    winRate: 82.1,
    totalVolume: "98765.43",
    accuracy: 85.7,
    change: 1
  },
  {
    address: "0x3456789012cdef01",
    username: "PredictionKing",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
    rank: 3,
    totalPnL: "9876.54",
    winRate: 78.9,
    totalVolume: "87654.32",
    accuracy: 81.2,
    change: -1
  },
  {
    address: "0x4567890123def012",
    username: "FlowTrader",
    rank: 4,
    totalPnL: "7654.32",
    winRate: 75.4,
    totalVolume: "65432.10",
    accuracy: 77.8,
    change: 2
  },
  {
    address: "0x5678901234ef0123",
    username: "BetWisely",
    rank: 5,
    totalPnL: "6543.21",
    winRate: 73.2,
    totalVolume: "54321.09",
    accuracy: 76.5,
    change: -2
  }
];

// User Card Component
interface UserCardProps {
  user: LeaderboardUser;
  showRank?: boolean;
  compact?: boolean;
}

export function UserCard({ user, showRank = true, compact = false }: UserCardProps) {
  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <Trophy className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ChevronUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ChevronDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (rank === 2) return "bg-gray-100 text-gray-800 border-gray-200";
    if (rank === 3) return "bg-amber-100 text-amber-800 border-amber-200";
    if (rank <= 10) return "bg-blue-100 text-blue-800 border-blue-200";
    if (rank <= 100) return "bg-green-100 text-green-800 border-green-200";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex items-center space-x-4">
          {/* Rank */}
          {showRank && (
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-1">
                {getRankIcon(user.rank)}
                <Badge 
                  variant="outline" 
                  className={getRankBadgeColor(user.rank)}
                >
                  #{user.rank}
                </Badge>
              </div>
              {user.change !== 0 && (
                <div className="flex items-center mt-1">
                  {getChangeIcon(user.change)}
                  <span className={`text-xs ${
                    user.change > 0 ? 'text-green-600' : 
                    user.change < 0 ? 'text-red-600' : 
                    'text-muted-foreground'
                  }`}>
                    {Math.abs(user.change)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Avatar & User Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className={compact ? "h-10 w-10" : "h-12 w-12"}>
              <AvatarImage src={user.avatar} />
              <AvatarFallback>
                {user.username ? user.username[0].toUpperCase() : 
                 user.address.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <Link 
                href={`/profile/${user.address}`}
                className="font-semibold text-foreground hover:text-primary transition-colors block truncate"
              >
                {user.username || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
              </Link>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  {user.address.slice(0, 6)}...{user.address.slice(-4)}
                </span>
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0" asChild>
                  <Link href={`/profile/${user.address}`}>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="text-right">
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-bold text-green-600">
                  +{formatCurrency(user.totalPnL)} FLOW
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-0.5">
                <div>{user.winRate.toFixed(1)}% Win Rate</div>
                <div>{user.accuracy.toFixed(1)}% Accuracy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Extended stats for non-compact view */}
        {!compact && (
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{formatCurrency(user.totalVolume)}</div>
              <div className="text-xs text-muted-foreground">Volume</div>
            </div>
            <div>
              <div className="text-lg font-bold">{user.winRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
            <div>
              <div className="text-lg font-bold">{user.accuracy.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
