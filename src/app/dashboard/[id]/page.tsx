/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { MarketCard } from "@/components/market/market-card";
import { MarketError } from "@/components/market/market-error";
import { MarketLoading } from "@/components/market/market-loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import flowConfig from "@/lib/flow/config";
import { useAuth } from "@/providers/auth-provider";
import type {
  Market,
  MarketStatus
} from "@/types/market";
import * as fcl from "@onflow/fcl";
import {
  getAllMarkets,
  getMarketById,
  getPlatformStats,
  getContractInfo,
  getUserProfile,
  getUserDashboardData,
  getActiveUserPositions,
  getMarketCreator,
  claimWinningsTransaction,
} from "@/lib/flow-wager-scripts";
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  DollarSign,
  Download,
  ExternalLink,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
  platformStats?: any;
  contractInfo?: any;
  claimableWinnings?: any[]; // Added for claimable winnings
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

interface ActivePosition {
  marketId: string | number;
  marketTitle: string;
  optionAShares: string;
  optionBShares: string;
  totalInvested: string;
}

function synthesizeRecentActivity(createdMarkets: Market[]): Activity[] {
  return (createdMarkets || []).map((market) => ({
    id: market.id,
    type: "CreateMarket",
    marketId: market.id,
    marketTitle: market.title,
    timestamp: market.createdAt || Date.now().toString(),
    txHash: "",
  }));
}

function calculatePnL(positions: UserPosition[], allMarkets: Market[]): number {
  let totalPnL = 0;
  positions.forEach((pos) => {
    const market = allMarkets.find((m) => m.id.toString() === pos.marketId.toString());
    if (market && market.resolved) {
      // Determine if user won or lost
      let payout = 0;
      if (market.outcome !== undefined && market.outcome !== null) {
        // 0 = OptionA, 1 = OptionB, 2 = Draw, 3 = Cancelled
        if (market.outcome === 0 && parseFloat(pos.optionAShares) > 0) {
          payout = (parseFloat(pos.optionAShares) / parseFloat(market.totalOptionAShares)) * parseFloat(market.totalPool);
        } else if (market.outcome === 1 && parseFloat(pos.optionBShares) > 0) {
          payout = (parseFloat(pos.optionBShares) / parseFloat(market.totalOptionBShares)) * parseFloat(market.totalPool);
        } else if (market.outcome === 2 || market.outcome === 3) {
          // Draw or Cancelled: refund minus fee (approximate as full refund here)
          payout = parseFloat(pos.totalInvested);
        }
      }
      totalPnL += payout - parseFloat(pos.totalInvested);
    }
  });
  return totalPnL;
}

function calculateWinRate(positions: UserPosition[], allMarkets: Market[]): number {
  let wins = 0;
  let resolved = 0;
  positions.forEach((pos) => {
    const market = allMarkets.find((m) => m.id.toString() === pos.marketId.toString());
    if (market && market.resolved) {
      resolved++;
      // User wins if they have shares in the winning outcome
      if (
        (market.outcome === 0 && parseFloat(pos.optionAShares) > 0) ||
        (market.outcome === 1 && parseFloat(pos.optionBShares) > 0)
      ) {
        wins++;
      }
    }
  });
  return resolved > 0 ? (wins / resolved) * 100 : 0;
}

export default function UserDashboardPage() {
  const params = useParams();
  const userAddress = params.id as string;
  const { user: currentUser, isAuthenticated } = useAuth();

  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [activePositions, setActivePositions] = useState<ActivePosition[]>([]);
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  // Add state for claim winnings
  const [claimingMarketId, setClaimingMarketId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  // Check if viewing own profile
  const isOwnProfile = currentUser?.addr === userAddress;

  // Check if current user is the contract owner/admin
  const isContractOwner =
    currentUser?.addr === process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT;

  // Initialize Flow configuration
  const initConfig = async () => {
    flowConfig();
  };

  // Fetch user dashboard data using your flow-wager-scripts
  const fetchUserData = async () => {
    try {
      setError(null);
      await initConfig();

      // Fetch user dashboard data (profile, stats, positions, etc.)
      let dashboardDataRaw = null;
      try {
        const userDashboardScript = await getUserDashboardData();
        dashboardDataRaw = await fcl.query({
          cadence: userDashboardScript,
          args: (arg, t) => [arg(userAddress, t.Address)],
        });
      } catch (err) {
        console.warn("Could not fetch user dashboard data:", err);
      }

      // Fetch platform stats using your flow-wager-scripts
      let platformStats = null;
      let contractInfo = null;
      try {
        const platformStatsScript = await getPlatformStats();
        platformStats = await fcl.query({
          cadence: platformStatsScript,
        });
        const contractInfoScript = await getContractInfo();
        contractInfo = await fcl.query({
          cadence: contractInfoScript,
        });
      } catch (statsError) {
        console.warn("Could not fetch platform stats:", statsError);
      }

      // Fetch all markets for additional context using your script
      let allMarkets: Market[] = [];
      try {
        const allMarketsScript = await getAllMarkets();
        allMarkets = await fcl.query({
          cadence: allMarketsScript,
        });
      } catch (marketsError) {
        console.warn("Could not fetch all markets:", marketsError);
      }
      setAllMarkets(allMarkets);

      // Fetch user's created markets
      let createdMarkets: Market[] = [];
      try {
        const createdMarketsScript = await getMarketCreator();
        createdMarkets = await fcl.query({
          cadence: createdMarketsScript,
          args: (arg, t) => [arg(userAddress, t.Address)],
        });
      } catch (err) {
        console.warn("Could not fetch created markets:", err);
      }

      // Transform data with enhanced calculations
      let dashboardData: UserDashboardData;
      if (dashboardDataRaw) {
        dashboardData = {
          profile: {
            address: userAddress,
            totalTrades: dashboardDataRaw.stats?.totalMarketsParticipated || 0,
            totalVolume: dashboardDataRaw.stats?.totalStaked?.toString() || "0.00",
            totalPnL: dashboardDataRaw.stats?.totalWinnings?.toString() || "0.00",
            winRate: dashboardDataRaw.stats?.winStreak || 0,
            activePositions: Object.keys(dashboardDataRaw.positions || {}).length,
            marketsCreated: dashboardDataRaw.profile?.marketsCreated || 0,
            joinDate: dashboardDataRaw.profile?.joinedAt?.toString() || Date.now().toString(),
            reputation: dashboardDataRaw.profile?.reputation || 0,
            rank: dashboardDataRaw.profile?.rank || 0,
          },
          positions: Object.values(dashboardDataRaw.positions || {}),
          recentActivity: [], // Populate if available in dashboardDataRaw
          createdMarkets: createdMarkets || [],
          watchlistMarkets: [], // Populate if available in dashboardDataRaw
          platformStats,
          contractInfo,
          claimableWinnings: dashboardDataRaw.claimableWinnings || [], // Populate claimable winnings
        };
      } else {
        dashboardData = {
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
            rank: 0,
          },
          positions: [],
          recentActivity: [],
          createdMarkets: createdMarkets || [],
          watchlistMarkets: [],
          platformStats,
          contractInfo,
          claimableWinnings: [],
        };
      }

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
          rank: 0,
        },
        positions: [],
        recentActivity: [],
        createdMarkets: [],
        watchlistMarkets: [],
        claimableWinnings: [],
      };
      setData(fallbackData);
      setError(
        "Unable to fetch all user data. Some features may not be available yet."
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchActivePositions = async (userAddress: string) => {
    try {
      const script = await getActiveUserPositions();
      const positionsRaw = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(userAddress, t.Address)],
      });
      // Map to ActivePosition type, converting numbers to strings if needed
      const positions: ActivePosition[] = (positionsRaw || []).map((pos: any) => ({
        marketId: pos.marketId?.toString() ?? "",
        marketTitle: pos.marketTitle ?? "",
        optionAShares: pos.optionAShares?.toString() ?? "0",
        optionBShares: pos.optionBShares?.toString() ?? "0",
        totalInvested: pos.totalInvested?.toString() ?? "0",
      }));
      setActivePositions(positions);
    } catch (err) {
      setActivePositions([]);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUserData();
    await fetchActivePositions(userAddress);
  };

  // Export user data
  const handleExportData = async () => {
    if (!data) return;

    try {
      const exportData = {
        userProfile: data.profile,
        createdMarkets: data.createdMarkets,
        positions: data.positions,
        recentActivity: data.recentActivity,
        platformStats: data.platformStats,
        contractInfo: data.contractInfo,
        exportedAt: new Date().toISOString(),
        contractAddress: process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flow-wager-user-${userAddress}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    if (userAddress) {
      fetchUserData();
      fetchActivePositions(userAddress);
    }
  }, [userAddress]);

  // Utility functions
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
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
      <MarketError error={error || "User not found"} onRetry={fetchUserData} />
    );
  }

  const recentActivity = synthesizeRecentActivity(data?.createdMarkets || []);
  const totalPnL = calculatePnL(data?.positions || [], allMarkets);
  const totalTrades = data.positions.length; // or data.profile.totalTrades if your backend provides it
  const winRate = calculateWinRate(data.positions, allMarkets);
  const reputation = data.profile.reputation;

  return (
    <div className="min-h-screen bg-[#0A0C14]">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* User Profile Header */}
        <div className="bg-gradient-to-br from-[#1A1F2C] via-[#151923] to-[#0A0C14] rounded-2xl border border-gray-800/50 p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-6">
              <Avatar className="h-20 w-20 border-2 border-[#9b87f5]/20">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userAddress}`}
                />
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
                    <span>
                      Joined{" "}
                      {new Date(
                        parseInt(data.profile.joinDate) * 1000
                      ).toLocaleDateString()}
                    </span>
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
                  {/* Show admin badge for contract owner */}
                  {userAddress ===
                    process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT && (
                    <div className="flex items-center space-x-1">
                      <Settings className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-medium">
                        Contract Admin
                      </span>
                    </div>
                  )}
                  {/* Show platform stats if available */}
                  {data.platformStats && (
                    <div className="flex items-center space-x-1">
                      <Activity className="h-4 w-4 text-blue-400" />
                      <span className="text-blue-400">
                        Platform: {data.platformStats.totalMarkets || 0} markets
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]/50 w-full sm:w-auto"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>

              {isOwnProfile && (
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]/50 w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}

              {/* Show admin panel link for contract owner */}
              {isOwnProfile && isContractOwner && (
                <Button
                  asChild
                  className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white w-full sm:w-auto"
                >
                  <Link href="/admin">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards with Platform Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-[#9b87f5]/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-[#9b87f5]" />
                </div>
                <span className="text-sm font-medium text-gray-400">
                  Total Trades
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {totalTrades}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Across all markets
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-sm font-medium text-gray-400">
                  Total Volume
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(data.profile.totalVolume)} FLOW
              </p>
              <p className="text-xs text-gray-400 mt-1">
                From created markets
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    totalPnL >= 0
                      ? "bg-green-500/20"
                      : "bg-red-500/20"
                  }`}
                >
                  <TrendingUp
                    className={`h-5 w-5 ${
                      totalPnL >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-400">P&L</span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  totalPnL >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {totalPnL >= 0 ? "+" : ""}
                {formatCurrency(totalPnL)} FLOW
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Trading profit/loss
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-400">
                  Markets Created
                </span>
              </div>
              <p className="text-2xl font-bold text-white">
                {data.createdMarkets.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Markets Created
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Claimable Winnings Section */}
        {data.claimableWinnings && data.claimableWinnings.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 my-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Claimable Winnings
            </h2>
            <table className="min-w-full text-sm mb-4">
              <thead>
                <tr className="bg-[#151923]">
                  <th className="px-2 py-2 text-white">Market</th>
                  <th className="px-2 py-2 text-white">Amount</th>
                  <th className="px-2 py-2 text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.claimableWinnings.map((win: any) => {
                  const market = allMarkets.find((m) => m.id.toString() === win.marketId.toString());
                  return (
                    <tr key={win.marketId} className="border-b border-gray-800">
                      <td className="px-2 py-2 text-white">{market ? market.title : `Market #${win.marketId}`}</td>
                      <td className="px-2 py-2 text-white">{parseFloat(win.amount).toFixed(2)} FLOW</td>
                      <td className="px-2 py-2 text-white">
                        <Button
                          size="sm"
                          className="text-white"
                          disabled={claimingMarketId === win.marketId.toString()}
                          onClick={async () => {
                            setClaimingMarketId(win.marketId.toString());
                            setClaimError(null);
                            setClaimSuccess(null);
                            try {
                              const txScript = await claimWinningsTransaction();
                              const authorization = fcl.currentUser().authorization;
                              await fcl.mutate({
                                cadence: txScript,
                                args: (arg, t) => [arg(win.marketId, t.UInt64)],
                                proposer: authorization,
                                payer: authorization,
                                authorizations: [authorization],
                                limit: 1000,
                              });
                              setClaimSuccess("Winnings claimed successfully!");
                              setTimeout(() => setClaimSuccess(null), 2000);
                            } catch (err: any) {
                              setClaimError(err.message || "Failed to claim winnings");
                            } finally {
                              setClaimingMarketId(null);
                            }
                          }}
                        >
                          {claimingMarketId === win.marketId.toString() ? "Claiming..." : "Claim Winnings"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {claimError && <div className="text-red-400 mb-2">{claimError}</div>}
            {claimSuccess && <div className="text-green-400 mb-2">{claimSuccess}</div>}
          </div>
        )}

        {/* Platform Stats Banner for Contract Info */}
        {data.contractInfo && (
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-400">
                      Contract Statistics
                    </p>
                    <p className="text-xs text-gray-300">
                      Live data from Flow blockchain
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  {data.platformStats?.totalMarkets && (
                    <div>
                      <span className="text-gray-400">Total Markets: </span>
                      <span className="text-white font-medium">
                        {data.platformStats.totalMarkets}
                      </span>
                    </div>
                  )}
                  {data.platformStats?.totalUsers && (
                    <div>
                      <span className="text-gray-400">Total Users: </span>
                      <span className="text-white font-medium">
                        {data.platformStats.totalUsers}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="relative flex w-full bg-[#1A1F2C] border border-gray-800/50 rounded-xl p-1 h-auto overflow-x-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-200 rounded-lg py-3 font-medium whitespace-nowrap"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="positions"
              className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-200 rounded-lg py-3 font-medium whitespace-nowrap"
            >
              Positions ({data.positions.length})
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-200 rounded-lg py-3 font-medium whitespace-nowrap"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="markets"
              className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-200 rounded-lg py-3 font-medium whitespace-nowrap"
            >
              Created Markets ({data.createdMarkets.length})
            </TabsTrigger>
            <TabsTrigger
              value="trades"
              className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-200 rounded-lg py-3 font-medium whitespace-nowrap"
            >
              Active Trades ({activePositions.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Info Banner for Limited Functionality */}
            {data.positions.length === 0 &&
              data.recentActivity.length === 0 && (
                <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-yellow-400" />
                      <div>
                        <p className="text-sm font-medium text-yellow-400">
                          Limited Dashboard Features
                        </p>
                        <p className="text-xs text-gray-300">
                          Position tracking and trading history will be
                          available once enhanced user tracking is implemented
                          in the smart contract.
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("activity")}
                    >
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
                        <p className="text-xs mt-2">Activity tracking coming soon</p>
                      </div>
                    ) : (
                      data.recentActivity.slice(0, 5).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white line-clamp-1">
                              {activity.marketTitle}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`text-sm ${getActivityColor(
                                  activity.type
                                )}`}
                              >
                                {activity.type === "BuyShares" &&
                                  `Bought ${activity.side?.toUpperCase()} shares`}
                                {activity.type === "SellShares" &&
                                  `Sold ${activity.side?.toUpperCase()} shares`}
                                {activity.type === "ClaimWinnings" &&
                                  "Claimed winnings"}
                                {activity.type === "CreateMarket" &&
                                  "Created market"}
                              </span>
                              {activity.amount && (
                                <>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-sm font-medium text-white">
                                    {formatCurrency(activity.amount)} FLOW
                                  </span>
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
                  <CardTitle className="text-white">
                    Performance Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Win Rate</span>
                      <span className="text-white font-medium">
                        {winRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={winRate || 0}
                      className="h-2 bg-gray-800"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Reputation Score</span>
                      <span className="text-white font-medium">
                        {reputation.toFixed(1)}/100
                      </span>
                    </div>
                    <Progress
                      value={Math.min(reputation || 0, 100)}
                      className="h-2 bg-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800/50">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">
                        {totalTrades}
                      </p>
                      <p className="text-xs text-gray-400">Total Trades</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">
                        {data.createdMarkets.length}
                      </p>
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
                  <div className="grid md:grid-cols-3 gap-3">
                    <Button
                      className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white justify-start w-full"
                      asChild
                    >
                      <Link href="/markets">
                        <Target className="h-4 w-4 mr-2" />
                        Browse Markets
                      </Link>
                    </Button>

                    {/* Only show Create Market button for contract owner */}
                    {isContractOwner && (
                      <Button
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] justify-start w-full"
                        asChild
                      >
                        <Link href="/admin/create">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Market
                        </Link>
                      </Button>
                    )}

                    {/* Only show Admin Dashboard button for contract owner */}
                    {isContractOwner && (
                      <Button
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] justify-start w-full"
                        asChild
                      >
                        <Link href="/admin">
                          <Settings className="h-4 w-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      </Button>
                    )}
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
                    <p className="text-sm">
                      Position tracking will be available when implemented in the smart contract
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.positions.map((position) => (
                      <div
                        key={position.marketId}
                        className="p-4 border border-gray-800/50 rounded-xl hover:bg-gray-800/20 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-3">
                          <Link
                            href={`/markets/${position.marketId}`}
                            className="font-medium text-white hover:text-[#9b87f5] transition-colors line-clamp-1"
                          >
                            {position.marketTitle}
                          </Link>
                          <Badge
                            className={`${
                              position.pnlPercentage >= 0
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                            }`}
                          >
                            {position.pnlPercentage >= 0 ? "+" : ""}
                            {Number.isFinite(Number(position.pnlPercentage)) ? Number(position.pnlPercentage).toFixed(1) : "0.0"}%
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Option A Shares</p>
                            <p className="text-white font-medium">
                              {formatCurrency(position.optionAShares)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Option B Shares</p>
                            <p className="text-white font-medium">
                              {formatCurrency(position.optionBShares)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Invested</p>
                            <p className="text-white font-medium">
                              {formatCurrency(position.totalInvested)} FLOW
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Current Value</p>
                            <p
                              className={`font-medium ${
                                position.pnlPercentage >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
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
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                      <p className="text-xs mt-2">Activity tracking coming soon</p>
                    </div>
                  ) : (
                    recentActivity.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white line-clamp-1">
                            {activity.marketTitle}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-sm ${getActivityColor(activity.type)}`}>
                              Created market
                            </span>
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
          </TabsContent>

          {/* Created Markets Tab */}
          <TabsContent value="markets">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Created Markets
                  </h3>
                  <p className="text-gray-400">
                    Markets created by this user
                  </p>
                </div>
                {/* Only show Create Market button for contract owner viewing their own profile */}
                {isOwnProfile && (
                  <Button
                    asChild
                    className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
                  >
                    <Link href="/dashboard/create">
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
                    <h3 className="text-lg font-medium text-white mb-2">
                      No markets created
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {isOwnProfile 
                        ? "You haven't created any markets yet" 
                        : "This user hasn't created any markets yet"}
                    </p>
                    {/* Only show Create Market button for contract owner viewing their own profile */}
                    {isOwnProfile && (
                      <Button
                        asChild
                        className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
                      >
                        <Link href="/dashboard/create">
                          Create Your First Market
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Active Trades Tab */}
          <TabsContent value="trades">
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">Active Trades</CardTitle>
              </CardHeader>
              <CardContent>
                {activePositions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No active trades</p>
                    <p className="text-sm">
                      Active trade tracking will be available when implemented in the smart contract
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activePositions.map((position) => (
                      <div
                        key={position.marketId}
                        className="p-4 border border-gray-800/50 rounded-xl hover:bg-gray-800/20 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-3">
                          <Link
                            href={`/markets/${position.marketId}`}
                            className="font-medium text-white hover:text-[#9b87f5] transition-colors line-clamp-1"
                          >
                            {position.marketTitle}
                          </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Option A Shares</p>
                            <p className="text-white font-medium">
                              {formatCurrency(position.optionAShares)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Option B Shares</p>
                            <p className="text-white font-medium">
                              {formatCurrency(position.optionBShares)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Invested</p>
                            <p className="text-white font-medium">
                              {formatCurrency(position.totalInvested)} FLOW
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
        </Tabs>
      </div>
    </div>
  );
}
