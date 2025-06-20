'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, TrendingUp, Target, DollarSign, Calendar, Medal, Crown, Star, Users, Zap } from 'lucide-react';
// import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserStats } from '@/types/user';

interface LeaderboardUser extends UserStats {
  id: string;
  username: string;
  avatar?: string;
  verified: boolean;
  joinedAt: string;
  lastActive: string;
  badges: string[];
  weeklyPnL: string;
  monthlyPnL: string;
  streak: number;
  favoriteCategory: string;
}

// Mock leaderboard data
const mockLeaderboardData: LeaderboardUser[] = [
  {
    id: "1",
    username: "CryptoProphet",
    avatar: "/avatars/user1.jpg",
    verified: true,
    joinedAt: "2024-01-15",
    lastActive: "2025-06-19",
    badges: ["Early Adopter", "High Roller", "Prediction Master"],
    totalVolume: "125,430",
    totalPnL: "+45,230",
    weeklyPnL: "+2,340",
    monthlyPnL: "+12,450",
    totalTrades: 342,
    winRate: 68.5,
    activePositions: 12,
    marketsCreated: 8,
    marketsResolved: 156,
    accuracy: 72.1,
    rank: 1,
    reputation: 2840,
    streak: 15,
    favoriteCategory: "Crypto"
  },
  {
    id: "2",
    username: "SportsBettor99",
    avatar: "/avatars/user2.jpg",
    verified: true,
    joinedAt: "2024-02-03",
    lastActive: "2025-06-19",
    badges: ["Sports Expert", "Consistent Trader"],
    totalVolume: "98,720",
    totalPnL: "+38,910",
    weeklyPnL: "+1,890",
    monthlyPnL: "+9,230",
    totalTrades: 278,
    winRate: 71.2,
    activePositions: 8,
    marketsCreated: 15,
    marketsResolved: 189,
    accuracy: 69.8,
    rank: 2,
    reputation: 2590,
    streak: 22,
    favoriteCategory: "Sports"
  },
  {
    id: "3",
    username: "TechOracle",
    avatar: "/avatars/user3.jpg",
    verified: false,
    joinedAt: "2024-01-28",
    lastActive: "2025-06-18",
    badges: ["Tech Savvy", "Rising Star"],
    totalVolume: "87,340",
    totalPnL: "+32,180",
    weeklyPnL: "+1,450",
    monthlyPnL: "+7,890",
    totalTrades: 195,
    winRate: 74.8,
    activePositions: 6,
    marketsCreated: 22,
    marketsResolved: 134,
    accuracy: 76.3,
    rank: 3,
    reputation: 2210,
    streak: 8,
    favoriteCategory: "Technology"
  },
  {
    id: "4",
    username: "PoliticalPundit",
    avatar: "/avatars/user4.jpg",
    verified: true,
    joinedAt: "2024-03-10",
    lastActive: "2025-06-19",
    badges: ["Political Expert", "Debate Champion"],
    totalVolume: "76,890",
    totalPnL: "+28,470",
    weeklyPnL: "+890",
    monthlyPnL: "+6,120",
    totalTrades: 167,
    winRate: 66.2,
    activePositions: 9,
    marketsCreated: 31,
    marketsResolved: 98,
    accuracy: 68.9,
    rank: 4,
    reputation: 1980,
    streak: 5,
    favoriteCategory: "Politics"
  },
  {
    id: "5",
    username: "MarketMaven",
    avatar: "/avatars/user5.jpg",
    verified: false,
    joinedAt: "2024-04-22",
    lastActive: "2025-06-19",
    badges: ["Quick Learner", "Volume Trader"],
    totalVolume: "69,230",
    totalPnL: "+24,180",
    weeklyPnL: "+1,290",
    monthlyPnL: "+5,670",
    totalTrades: 289,
    winRate: 63.7,
    activePositions: 14,
    marketsCreated: 5,
    marketsResolved: 203,
    accuracy: 65.4,
    rank: 5,
    reputation: 1750,
    streak: 11,
    favoriteCategory: "Entertainment"
  },
  {
    id: "6",
    username: "QuantTrader",
    avatar: "/avatars/user6.jpg",
    verified: true,
    joinedAt: "2024-02-17",
    lastActive: "2025-06-18",
    badges: ["Math Wizard", "Data Driven"],
    totalVolume: "54,780",
    totalPnL: "+19,890",
    weeklyPnL: "+780",
    monthlyPnL: "+4,230",
    totalTrades: 145,
    winRate: 79.3,
    activePositions: 7,
    marketsCreated: 12,
    marketsResolved: 87,
    accuracy: 81.2,
    rank: 6,
    reputation: 1640,
    streak: 18,
    favoriteCategory: "Finance"
  },
  {
    id: "7",
    username: "CulturalCritic",
    avatar: "/avatars/user7.jpg",
    verified: false,
    joinedAt: "2024-05-08",
    lastActive: "2025-06-19",
    badges: ["Entertainment Expert"],
    totalVolume: "43,120",
    totalPnL: "+16,230",
    weeklyPnL: "+420",
    monthlyPnL: "+3,450",
    totalTrades: 98,
    winRate: 70.4,
    activePositions: 5,
    marketsCreated: 18,
    marketsResolved: 56,
    accuracy: 73.2,
    rank: 7,
    reputation: 1420,
    streak: 6,
    favoriteCategory: "Entertainment"
  },
  {
    id: "8",
    username: "EconomistElite",
    avatar: "/avatars/user8.jpg",
    verified: true,
    joinedAt: "2024-03-25",
    lastActive: "2025-06-17",
    badges: ["Economics PhD", "Market Analyst"],
    totalVolume: "38,940",
    totalPnL: "+14,780",
    weeklyPnL: "+320",
    monthlyPnL: "+2,890",
    totalTrades: 76,
    winRate: 77.6,
    activePositions: 3,
    marketsCreated: 9,
    marketsResolved: 45,
    accuracy: 80.0,
    rank: 8,
    reputation: 1290,
    streak: 12,
    favoriteCategory: "Economics"
  }
];

type LeaderboardType = 'profits' | 'volume' | 'accuracy' | 'winRate' | 'weekly' | 'monthly';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LeaderboardType>('profits');
  const [timeframe, setTimeframe] = useState<'all' | 'weekly' | 'monthly'>('all');

  // Load leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setUsers(mockLeaderboardData);
      setLoading(false);
    };
    loadLeaderboard();
  }, []);

  // Sort users based on active tab
  const sortedUsers = useMemo(() => {
    const sorted = [...users].sort((a, b) => {
      switch (activeTab) {
        case 'profits':
          return parseFloat(b.totalPnL.replace(/[+,]/g, '')) - parseFloat(a.totalPnL.replace(/[+,]/g, ''));
        case 'volume':
          return parseFloat(b.totalVolume.replace(/,/g, '')) - parseFloat(a.totalVolume.replace(/,/g, ''));
        case 'accuracy':
          return b.accuracy - a.accuracy;
        case 'winRate':
          return b.winRate - a.winRate;
        case 'weekly':
          return parseFloat(b.weeklyPnL.replace(/[+,]/g, '')) - parseFloat(a.weeklyPnL.replace(/[+,]/g, ''));
        case 'monthly':
          return parseFloat(b.monthlyPnL.replace(/[+,]/g, '')) - parseFloat(a.monthlyPnL.replace(/[+,]/g, ''));
        default:
          return 0;
      }
    });
    
    // Update ranks based on current sorting
    return sorted.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  }, [users, activeTab]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600 dark:text-gray-400">#{rank}</span>;
    }
  };

  const getValueByTab = (user: LeaderboardUser, tab: LeaderboardType) => {
    switch (tab) {
      case 'profits':
        return user.totalPnL;
      case 'volume':
        return `$${user.totalVolume}`;
      case 'accuracy':
        return `${user.accuracy}%`;
      case 'winRate':
        return `${user.winRate}%`;
      case 'weekly':
        return user.weeklyPnL;
      case 'monthly':
        return user.monthlyPnL;
      default:
        return user.totalPnL;
    }
  };

  const getMetricLabel = (tab: LeaderboardType) => {
    switch (tab) {
      case 'profits':
        return 'Total P&L';
      case 'volume':
        return 'Volume Traded';
      case 'accuracy':
        return 'Accuracy';
      case 'winRate':
        return 'Win Rate';
      case 'weekly':
        return 'Weekly P&L';
      case 'monthly':
        return 'Monthly P&L';
      default:
        return 'Total P&L';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* <LoadingSpinner size="lg" /> */}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Leaderboard
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Top performers in prediction markets trading
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {sortedUsers.slice(0, 3).map((user, index) => (
            <Card key={user.id} className={`relative overflow-hidden ${
              index === 0 ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : 
              index === 1 ? 'ring-2 ring-gray-400' : 
              'ring-2 ring-amber-600'
            }`}>
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {getRankIcon(index + 1)}
                </div>
                <Avatar className="h-16 w-16 mx-auto mb-4">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle className="flex items-center justify-center gap-2">
                  {user.username}
                  {user.verified && <Star className="h-4 w-4 text-blue-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total P&L</p>
                    <p className="text-xl font-bold text-green-600">{user.totalPnL}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Win Rate</p>
                      <p className="font-medium">{user.winRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Accuracy</p>
                      <p className="font-medium">{user.accuracy}%</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {user.badges.slice(0, 2).map((badge) => (
                      <Badge key={badge} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Leaderboard Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LeaderboardType)} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="profits" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Profits
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Volume
          </TabsTrigger>
          <TabsTrigger value="accuracy" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Accuracy
          </TabsTrigger>
          <TabsTrigger value="winRate" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Win Rate
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{getMetricLabel(activeTab)} Leaderboard</span>
                <Badge variant="outline">
                  {sortedUsers.length} Traders
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedUsers.map((user, index) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/profile/${user.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(index + 1)}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {user.username}
                          </h3>
                          {user.verified && <Star className="h-4 w-4 text-blue-500" />}
                          {user.streak > 10 && (
                            <Badge variant="outline" className="text-xs">
                              🔥 {user.streak}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Trades: {user.totalTrades}</span>
                          <span>Reputation: {user.reputation}</span>
                          <span className="text-purple-600 dark:text-purple-400">
                            {user.favoriteCategory}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {getValueByTab(user, activeTab)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {activeTab === 'profits' || activeTab === 'weekly' || activeTab === 'monthly' 
                          ? `${user.totalTrades} trades` 
                          : `${user.winRate}% win rate`
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Join Competition Banner */}
      <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Join the Competition!
              </h3>
              <p className="opacity-90">
                Start trading predictions and climb the leaderboard to earn rewards and recognition.
              </p>
            </div>
            <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
              Start Trading
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}