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



// Ranking List Component
interface RankingListProps {
  users?: LeaderboardUser[];
  isLoading?: boolean;
  showTop?: number;
}

export function RankingList({ 
  users = mockLeaderboardUsers, 
  isLoading = false,
  showTop 
}: RankingListProps) {
  const [activeTab, setActiveTab] = useState("pnl");

  const sortedUsers = [...users].sort((a, b) => {
    switch (activeTab) {
      case "pnl":
        return parseFloat(b.totalPnL) - parseFloat(a.totalPnL);
      case "volume":
        return parseFloat(b.totalVolume) - parseFloat(a.totalVolume);
      case "winrate":
        return b.winRate - a.winRate;
      case "accuracy":
        return b.accuracy - a.accuracy;
      default:
        return a.rank - b.rank;
    }
  });

  const displayUsers = showTop ? sortedUsers.slice(0, showTop) : sortedUsers;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4">
                <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
                <div className="text-right">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5" />
          <span>Leaderboard</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Tabs for different rankings */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pnl" className="text-xs">
                <DollarSign className="h-3 w-3 mr-1" />
                P&L
              </TabsTrigger>
              <TabsTrigger value="volume" className="text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />
                Volume
              </TabsTrigger>
              <TabsTrigger value="winrate" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                Win Rate
              </TabsTrigger>
              <TabsTrigger value="accuracy" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Accuracy
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <div className="divide-y">
              {displayUsers.map((user, index) => (
                <div key={user.address} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex items-center space-x-2 w-12">
                      <span className="text-lg font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      {index < 3 && (
                        <div className="flex items-center">
                          {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                          {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                          {index === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.username ? user.username[0].toUpperCase() : 
                           user.address.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/profile/${user.address}`}
                          className="font-medium text-foreground hover:text-primary transition-colors block truncate"
                        >
                          {user.username || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {user.address.slice(0, 6)}...{user.address.slice(-4)}
                        </div>
                      </div>
                    </div>

                    {/* Primary Stat */}
                    <div className="text-right">
                      <div className="font-bold">
                        {activeTab === "pnl" && `+${parseFloat(user.totalPnL).toFixed(0)} FLOW`}
                        {activeTab === "volume" && `${parseFloat(user.totalVolume).toFixed(0)} FLOW`}
                        {activeTab === "winrate" && `${user.winRate.toFixed(1)}%`}
                        {activeTab === "accuracy" && `${user.accuracy.toFixed(1)}%`}
                      </div>
                      
                      {/* Change indicator */}
                      {user.change !== 0 && (
                        <div className="flex items-center justify-end mt-1">
                          {user.change > 0 ? (
                            <ChevronUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-red-600" />
                          )}
                          <span className={`text-xs ${
                            user.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Math.abs(user.change)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* View All Button */}
        {showTop && users.length > showTop && (
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/leaderboard">
                View Full Leaderboard
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}