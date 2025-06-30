"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MarketCard } from "@/components/market/market-card";
import { MarketLoading } from "@/components/market/market-loading";
import { MarketError } from "@/components/market/market-error";
import { useAuth } from "@/providers/auth-provider";
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Target,
  Clock,
  DollarSign,
  Plus,
  ExternalLink,
  Bell,
  Settings,
  Download,
  RefreshCw,
  Users,
  Trophy,
  Activity,
  Wallet,
  Eye,
  Star,
  Calendar,
  ArrowUpDown
} from "lucide-react";
import type { Market, MarketCategory, MarketOutcome, MarketStatus } from "@/types/market";
import * as fcl from "@onflow/fcl";
import flowConfig from "@/lib/flow/config";


const FLOWWAGER_CONTRACT = process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT;

// Types for user dashboard data
interface UserDashboardData {
  profile: {
    address: string;
    totalTrades: number;
    totalVolume: string;
    totalPnL: string;
    winRate: number;
    activePositions: number;
    marketsCreated: number;
    joinDate: string;
    reputation: number;
    rank: number;
  };
  positions: UserPosition[];
  recentActivity: Activity[];
  createdMarkets: Market[];
  watchlistMarkets: Market[];
}

interface UserPosition {
  marketId: string;
  marketTitle: string;
  optionAShares: string;
  optionBShares: string;
  totalInvested: string;
  currentValue: string;
  pnl: string;
  pnlPercentage: number;
  status: MarketStatus;
  outcome?: number;
}

interface Activity {
  id: string;
  type: "BuyShares" | "SellShares" | "ClaimWinnings" | "CreateMarket";
  marketId: string;
  marketTitle: string;
  amount?: string;
  side?: "optionA" | "optionB";
  timestamp: string;
  txHash: string;
}

// Flow scripts for user data (using working scripts)
const GET_USER_BASIC_INFO = `
  import FlowWager from ${FLOWWAGER_CONTRACT}
  
  access(all) fun main(address: Address): {String: AnyStruct} {
    let allMarkets = FlowWager.getAllMarkets()
    var marketsCreated = 0
    
    // Count markets created by user
    for market in allMarkets {
      if (market.creator == address) {
        marketsCreated = marketsCreated + 1
      }
    }
    
    return {
      "address": address.toString(),
      "totalTrades": 0,
      "totalVolume": "0.0",
      "totalPnL": "0.0",
      "winRate": 0.0,
      "activePositions": 0,
      "marketsCreated": marketsCreated,
      "joinDate": getCurrentBlock().timestamp.toString(),
      "reputation": 0.0,
      "rank": 0
    } as {String: AnyStruct}
  }
`;

const GET_USER_CREATED_MARKETS = `
  import FlowWager from ${FLOWWAGER_CONTRACT}
  
  access(all) fun main(creatorAddress: Address): [FlowWager.Market] {
    let allMarkets = FlowWager.getAllMarkets()
    let userMarkets: [FlowWager.Market] = []
    
    for market in allMarkets {
      if (market.creator == creatorAddress) {
        userMarkets.append(market)
      }
    }
    
    return userMarkets
  }
`;

export default function UserDashboardPage() {
  const params = useParams();
  const userAddress = params.id as string;
  const { user: currentUser } = useAuth();
  
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Check if viewing own profile
  const isOwnProfile = currentUser?.addr === userAddress;

  // Initialize Flow configuration
  const initConfig = async () => {
    flowConfig();
  };

  // Fetch user dashboard data
  const fetchUserData = async () => {
    try {
      setError(null);
      await initConfig();

      // Fetch basic user info (this should work)
      const profile = await fcl.query({
        cadence: GET_USER_BASIC_INFO,
        args: (arg, t) => [arg(userAddress, t.Address)]
      });

      // Fetch created markets (this should work)
      const createdMarkets = await fcl.query({
        cadence: GET_USER_CREATED_MARKETS,
        args: (arg, t) => [arg(userAddress, t.Address)]
      });

      // Transform data with fallbacks
      const dashboardData: UserDashboardData = {
        profile: {
          address: userAddress,
          totalTrades: parseInt(profile.totalTrades?.toString() || "0"),
          totalVolume: profile.totalVolume?.toString() || "0.00",
          totalPnL: profile.totalPnL?.toString() || "0.00",
          winRate: parseFloat(profile.winRate?.toString() || "0"),
          activePositions: 0, // Will be calculated from positions
          marketsCreated: parseInt(profile.marketsCreated?.toString() || "0"),
          joinDate: profile.joinDate?.toString() || Date.now().toString(),
          reputation: parseFloat(profile.reputation?.toString() || "0"),
          rank: parseInt(profile.rank?.toString() || "0")
        },
        positions: [], // Empty for now since getUserPosition may not exist
        recentActivity: [], // Empty for now since trading history may not exist
        createdMarkets: createdMarkets?.map((market: any) => ({
          id: market.id.toString(),
          title: market.title,
          description: market.description,
          category: parseInt(market.category.rawValue),
          optionA: market.optionA,
          optionB: market.optionB,
          creator: market.creator,
          createdAt: market.createdAt.toString(),
          endTime: market.endTime.toString(),
          minBet: market.minBet.toString(),
          maxBet: market.maxBet.toString(),
          status: parseInt(market.status.rawValue),
          outcome: market.outcome ? parseInt(market.outcome.rawValue) : undefined,
          resolved: market.resolved,
          totalOptionAShares: market.totalOptionAShares.toString(),
          totalOptionBShares: market.totalOptionBShares.toString(),
          totalPool: market.totalPool.toString()
        })) || [],
        watchlistMarkets: []
      };

      setData(dashboardData);
    } catch (err) {
      console.error("Error fetching user dashboard data:", err);
      
      // Provide fallback data on error
      const fallbackData: UserDashboardData = {
        profile: {
          address: userAddress,
          totalTrades: 0,
          totalVolume: "0.00",
          totalPnL: "0.00",
          winRate: 0,
          activePositions: 0,
          marketsCreated: 0,
          joinDate: Date.now().toString(),
          reputation: 0,
          rank: 0
        },
        positions: [],
        recentActivity: [],
        createdMarkets: [],
        watchlistMarkets: []
      };
      
      setData(fallbackData);
      setError("Unable to fetch all user data. Some features may not be available yet.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUserData();
  };

  // Fetch data on mount
  useEffect(() => {
    if (userAddress) {
      fetchUserData();
    }
  }, [userAddress]);

  // Utility functions
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - parseInt(timestamp) * 1000;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "BuyShares":
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case "SellShares":
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      case "ClaimWinnings":
        return <DollarSign className="h-4 w-4 text-blue-400" />;
      case "CreateMarket":
        return <Plus className="h-4 w-4 text-[#9b87f5]" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "BuyShares":
        return "text-green-400";
      case "SellShares":
        return "text-red-400";
      case "ClaimWinnings":
        return "text-blue-400";
      case "CreateMarket":
        return "text-[#9b87f5]";
      default:
        return "text-gray-400";
    }
  };

  // Loading state
  if (loading) {
    return <MarketLoading />;
  }

  // Error state
  if (error || !data) {
    return (
      <MarketError
        error={error || "User not found"}
        onRetry={fetchUserData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C14]">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* User Profile Header */}
        <div className="bg-gradient-to-br from-[#1A1F2C] via-[#151923] to-[#0A0C14] rounded-2xl border border-gray-800/50 p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-6">
              <Avatar className="h-20 w-20 border-2 border-[#9b87f5]/20">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userAddress}`} />
                <AvatarFallback className="bg-[#9b87f5]/20 text-[#9b87f5] text-xl font-bold">
                  {userAddress.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {isOwnProfile ? "Your Dashboard" : "User Profile"}
                </h1>
                <div className="flex items-center space-x-2 mb-3">
                  <code className="text-[#9b87f5] bg-gray-800/50 px-2 py-1 rounded text-sm font-mono">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(userAddress)}
                    className="text-gray-400 hover:text-white"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(parseInt(data.profile.joinDate) * 1000).toLocaleDateString()}</span>
                  </div>
                  {data.profile.rank > 0 && (
                    <div className="flex items-center space-x-1">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <span>Rank #{data.profile.rank}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-[#9b87f5]" />
                    <span>{data.profile.reputation.toFixed(1)} reputation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]/50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {isOwnProfile && (
                <>
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]/50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]/50"
                  >
                    <Link href="/dashboard/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-[#9b87f5]/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-[#9b87f5]" />
                </div>
                <span className="text-sm font-medium text-gray-400">Total Trades</span>
              </div>
              <p className="text-2xl font-bold text-white">{data.profile.totalTrades}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-sm font-medium text-gray-400">Total Volume</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(data.profile.totalVolume)} FLOW</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-lg ${parseFloat(data.profile.totalPnL) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <TrendingUp className={`h-5 w-5 ${parseFloat(data.profile.totalPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                <span className="text-sm font-medium text-gray-400">P&L</span>
              </div>
              <p className={`text-2xl font-bold ${parseFloat(data.profile.totalPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(data.profile.totalPnL) >= 0 ? '+' : ''}{formatCurrency(data.profile.totalPnL)} FLOW
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-400">Win Rate</span>
              </div>
              <p className="text-2xl font-bold text-white">{data.profile.winRate.toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Wallet className="h-5 w-5 text-yellow-400" />
                </div>
                <span className="text-sm font-medium text-gray-400">Active Positions</span>
              </div>
              <p className="text-2xl font-bold text-white">{data.profile.activePositions}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-[#9b87f5]/20 rounded-lg">
                  <Plus className="h-5 w-5 text-[#9b87f5]" />
                </div>
                <span className="text-sm font-medium text-gray-400">Markets Created</span>
              </div>
              <p className="text-2xl font-bold text-white">{data.profile.marketsCreated}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-[#1A1F2C] border border-gray-800/50 rounded-xl p-1 h-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-200 rounded-lg py-3 font-medium"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="positions"
              className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-200 rounded-lg py-3 font-medium"
            >
              Positions ({data.positions.length})
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-200 rounded-lg py-3 font-medium"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="markets"
              className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-200 rounded-lg py-3 font-medium"
            >
              Created Markets ({data.createdMarkets.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Info Banner for Limited Functionality */}
            {data.positions.length === 0 && data.recentActivity.length === 0 && (
              <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-yellow-400" />
                    <div>
                      <p className="text-sm font-medium text-yellow-400">Limited Dashboard Features</p>
                      <p className="text-xs text-gray-300">
                        Position tracking and trading history will be available once enhanced user tracking is implemented in the smart contract.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span>Recent Activity</span>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("activity")}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.recentActivity.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent activity</p>
                      </div>
                    ) : (
                      data.recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors">
                          <div className="flex-shrink-0 mt-0.5">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white line-clamp-1">
                              {activity.marketTitle}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-sm ${getActivityColor(activity.type)}`}>
                                {activity.type === "BuyShares" && `Bought ${activity.side?.toUpperCase()} shares`}
                                {activity.type === "SellShares" && `Sold ${activity.side?.toUpperCase()} shares`}
                                {activity.type === "ClaimWinnings" && "Claimed winnings"}
                                {activity.type === "CreateMarket" && "Created market"}
                              </span>
                              {activity.amount && (
                                <>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-sm font-medium text-white">{formatCurrency(activity.amount)} FLOW</span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatRelativeTime(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Breakdown */}
              <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Performance Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Win Rate</span>
                      <span className="text-white font-medium">{data.profile.winRate.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={data.profile.winRate} 
                      className="h-2 bg-gray-800"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Reputation Score</span>
                      <span className="text-white font-medium">{data.profile.reputation.toFixed(1)}/100</span>
                    </div>
                    <Progress 
                      value={data.profile.reputation} 
                      className="h-2 bg-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800/50">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{data.profile.totalTrades}</p>
                      <p className="text-xs text-gray-400">Total Trades</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{data.profile.marketsCreated}</p>
                      <p className="text-xs text-gray-400">Markets Created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            {isOwnProfile && (
              <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-3">
                    <Button 
                      className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white justify-start" 
                      asChild
                    >
                      <Link href="/markets">
                        <Target className="h-4 w-4 mr-2" />
                        Browse Markets
                      </Link>
                    </Button>
                    <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] justify-start" asChild>
                      <Link href="/admin/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Market
                      </Link>
                    </Button>
                    <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] justify-start" asChild>
                      <Link href="/admin/resolve">
                        <Settings className="h-4 w-4 mr-2" />
                        Resolve Markets
                      </Link>
                    </Button>
                    <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] justify-start" asChild>
                      <Link href="/leaderboard">
                        <Trophy className="h-4 w-4 mr-2" />
                        Leaderboard
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions">
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">Active Positions</CardTitle>
              </CardHeader>
              <CardContent>
                {data.positions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No active positions</p>
                    <p className="text-sm">Start trading to see your positions here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.positions.map((position) => (
                      <div key={position.marketId} className="p-4 border border-gray-800/50 rounded-xl hover:bg-gray-800/20 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <Link 
                            href={`/markets/${position.marketId}`}
                            className="font-medium text-white hover:text-[#9b87f5] transition-colors line-clamp-1"
                          >
                            {position.marketTitle}
                          </Link>
                          <Badge 
                            className={`${
                              position.pnlPercentage >= 0 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}
                          >
                            {position.pnlPercentage >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(1)}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Option A Shares</p>
                            <p className="text-white font-medium">{formatCurrency(position.optionAShares)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Option B Shares</p>
                            <p className="text-white font-medium">{formatCurrency(position.optionBShares)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Invested</p>
                            <p className="text-white font-medium">{formatCurrency(position.totalInvested)} FLOW</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Current Value</p>
                            <p className={`font-medium ${
                              position.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {formatCurrency(position.currentValue)} FLOW
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">Trading Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentActivity.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No trading activity</p>
                    <p className="text-sm">Trading history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-800/50 rounded-xl hover:bg-gray-800/20 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{activity.marketTitle}</p>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <span className={getActivityColor(activity.type)}>
                                {activity.type === "BuyShares" && `Bought ${activity.side?.toUpperCase()} shares`}
                                {activity.type === "SellShares" && `Sold ${activity.side?.toUpperCase()} shares`}
                                {activity.type === "ClaimWinnings" && "Claimed winnings"}
                                {activity.type === "CreateMarket" && "Created market"}
                              </span>
                              <span>•</span>
                              <span>{formatRelativeTime(activity.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex items-center space-x-2">
                          {activity.amount && (
                            <p className="font-medium text-white">{formatCurrency(activity.amount)} FLOW</p>
                          )}
                          {activity.txHash && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`https://flowscan.org/transaction/${activity.txHash}`} target="_blank">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Created Markets Tab */}
          <TabsContent value="markets">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Created Markets</h3>
                  <p className="text-gray-400">Markets created by this user</p>
                </div>
                {isOwnProfile && (
                  <Button asChild className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white">
                    <Link href="/admin/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Market
                    </Link>
                  </Button>
                )}
              </div>

              {data.createdMarkets.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.createdMarkets.map((market) => (
                    <MarketCard key={market.id} market={market} />
                  ))}
                </div>
              ) : (
                <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
                  <CardContent className="text-center py-12">
                    <Plus className="mx-auto h-12 w-12 text-gray-400 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-2">No markets created</h3>
                    <p className="text-gray-400 mb-4">
                      {isOwnProfile ? "You haven't created any markets yet" : "This user hasn't created any markets"}
                    </p>
                    {isOwnProfile && (
                      <Button asChild className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white">
                        <Link href="/admin/create">Create Your First Market</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}