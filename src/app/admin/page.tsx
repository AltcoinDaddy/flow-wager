/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/providers/auth-provider";
import { getAdminStats, getRecentMarkets, checkAdminStatus } from "@/lib/scripts/";
import { debugContract, checkMarketRange } from "@/lib/scripts";
import {
  Plus,
  BarChart3,
  DollarSign,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  Shield,
  Activity,
  Target,
} from "lucide-react";
import type { Market } from "@/types/market";

interface AdminStats {
  totalMarkets: number;
  activeMarkets: number;
  pendingResolution: number;
  totalVolume: string;
  avgMarketVolume: string;
}

export default function AdminPage() {
  const { user, isAuthenticated:loggedIn } = useAuth();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalMarkets: 0,
    activeMarkets: 0,
    pendingResolution: 0,
    totalVolume: "0.0",
    avgMarketVolume: "0.0",
  });
  const [recentMarkets, setRecentMarkets] = useState<Market[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [marketRangeInfo, setMarketRangeInfo] = useState<any>(null);
  const [adminInfo, setAdminInfo] = useState<any>(null);

  // Check if user is admin (for now, just check if connected)
  const isAdmin = loggedIn && user?.addr;

  // Fetch admin dashboard data
  const fetchAdminData = async () => {
    if (!user?.addr) return;

    setIsLoading(true);
    setError(null);

    try {
      // Debug the contract structure
      console.log("Fetching debug info...");
      const contractInfo = await debugContract();
      setDebugInfo(contractInfo);
      console.log("Contract debug info:", contractInfo);

      // Check market range
      console.log("Checking market range...");
      const rangeInfo = await checkMarketRange();
      setMarketRangeInfo(rangeInfo);
      console.log("Market range info:", rangeInfo);

      // Check admin status
      console.log("Checking admin status...");
      const adminStatus = await checkAdminStatus(user.addr);
      setAdminInfo(adminStatus);
      console.log("Admin status:", adminStatus);

      // Fetch admin stats
      console.log("Fetching admin stats...");
      const stats = await getAdminStats();
      console.log("Admin stats:", stats);

      // Fetch recent markets
      console.log("Fetching recent markets...");
      const markets = await getRecentMarkets(10);
      console.log("Recent markets:", markets);

      // Update state with fetched data
      setAdminStats({
        totalMarkets: stats.totalMarkets || 0,
        activeMarkets: stats.activeMarkets || 0,
        pendingResolution: stats.pendingResolution || 0,
        totalVolume: stats.totalVolume || "0.0",
        avgMarketVolume: stats.totalMarkets > 0 ? (parseFloat(stats.totalVolume) / stats.totalMarkets).toFixed(2) : "0.0",
      });

      // Transform markets data if we have any
      if (markets && markets.length > 0) {
        const transformedMarkets: Market[] = markets.map((market: any) => ({
          id: market.id?.toString() || "0",
          creator: market.creator || "0x0000000000000000",
          title: market.title || "Unknown Market",
          description: market.description || "",
          optionA: market.optionA || "Option A",
          optionB: market.optionB || "Option B",
          category: market.category?.rawValue || 0,
          endTime: (parseInt(market.endTime || "0") * 1000).toString(),
          createdAt: (parseInt(market.createdAt || "0") * 1000).toString(),
          totalOptionAShares: market.totalOptionAShares?.toString() || "0",
          totalOptionBShares: market.totalOptionBShares?.toString() || "0",
          totalPool: market.totalPool?.toString() || "0",
          resolved: market.resolved || false,
          outcome: market.outcome?.rawValue || 0,
          status: market.status?.rawValue || 0,
          minBet: market.minBet?.toString() || "0",
          maxBet: market.maxBet?.toString() || "0",
        }));

        setRecentMarkets(transformedMarkets);
      }

    } catch (error: any) {
      console.error("Failed to fetch admin data:", error);
      setError(`Failed to load admin dashboard data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, user]);

  const handleRefresh = async () => {
    await fetchAdminData();
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: // Active
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case 1: // Paused
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case 2: // Resolved
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const getCategoryName = (category: number) => {
    const categories = ["Sports", "Politics", "Economics", "Entertainment", "Technology", "Science", "Weather", "Other"];
    return categories[category] || "Other";
  };

  const getStatusName = (status: number) => {
    const statuses = ["Active", "Paused", "Resolved"];
    return statuses[status] || "Unknown";
  };

  // Show login prompt if not connected
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#0A0C14] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-[#9b87f5] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-4">
              You need to connect your Flow wallet to access the admin panel.
            </p>
            <Button 
              onClick={() => router.push("/markets")}
              className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
            >
              Go to Markets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C14]">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="h-8 w-8 text-[#9b87f5]" />
              <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <p className="text-gray-400">
              Manage markets, users, and platform operations
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30">
                Connected: {user?.addr?.slice(0, 10)}...
              </Badge>
              {adminInfo?.isContractDeployer === "true" && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Contract Deployer
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button 
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              asChild
              className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
            >
              <Link href="/admin/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Market
              </Link>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Debug Info Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Contract Info */}
          {debugInfo && (
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white text-sm">Contract Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(debugInfo).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-400">{key}:</span>
                    <span className="font-mono text-gray-300">{String(value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Market Range Info */}
          {marketRangeInfo && (
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white text-sm">Market Range</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(marketRangeInfo).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-400">{key}:</span>
                    <span className="font-mono text-gray-300">{String(value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Admin Status */}
          {adminInfo && (
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white text-sm">Admin Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(adminInfo).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-400">{key}:</span>
                    <span className="font-mono text-gray-300">{String(value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Markets</p>
                  <p className="text-2xl font-bold text-white">{adminStats.totalMarkets}</p>
                  <p className="text-xs text-green-400">All time</p>
                </div>
                <BarChart3 className="h-8 w-8 text-[#9b87f5]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Markets</p>
                  <p className="text-2xl font-bold text-white">{adminStats.activeMarkets}</p>
                  <p className="text-xs text-green-400">
                    {adminStats.totalMarkets > 0 ? Math.round((adminStats.activeMarkets / adminStats.totalMarkets) * 100) : 0}% of total
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending Resolution</p>
                  <p className="text-2xl font-bold text-yellow-400">{adminStats.pendingResolution}</p>
                  <p className="text-xs text-yellow-400">Needs attention</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Volume</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(adminStats.totalVolume)} FLOW
                  </p>
                  <p className="text-xs text-blue-400">Platform volume</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Market Volume</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(adminStats.avgMarketVolume)} FLOW
                  </p>
                  <p className="text-xs text-[#9b87f5]">Per market</p>
                </div>
                <Target className="h-8 w-8 text-[#9b87f5]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Markets */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Recent Markets</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-[#9b87f5] hover:text-white hover:bg-[#9b87f5]/20">
                <Link href="/admin/resolve">Manage Markets</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9b87f5] mx-auto mb-2" />
                  <p>Loading markets...</p>
                </div>
              ) : recentMarkets.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No markets found.</p>
                  {debugInfo?.market1_exists === "false" && (
                    <p className="text-sm mt-2">Try creating your first market!</p>
                  )}
                </div>
              ) : (
                recentMarkets.slice(0, 5).map((market) => (
                  <div
                    key={market.id}
                    className="flex items-center justify-between p-4 bg-[#0A0C14] rounded-lg border border-gray-800/50 hover:border-[#9b87f5]/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className={getStatusColor(market.status)}>
                          {getStatusName(market.status)}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {getCategoryName(market.category)}
                        </span>
                      </div>
                      <h4 className="font-medium text-white mb-1 line-clamp-1">
                        {market.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Volume: {formatCurrency(market.totalPool)} FLOW</span>
                        <span>
                          Shares: {formatCurrency(
                            parseFloat(market.totalOptionAShares) + parseFloat(market.totalOptionBShares)
                          )}
                        </span>
                        <span>ID: {market.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
                      >
                        <Link href={`/markets/${market.id}`}>View</Link>
                      </Button>
                      {market.status === 1 && !market.resolved && ( // Paused and not resolved
                        <Button 
                          size="sm" 
                          asChild
                          className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
                        >
                          <Link href={`/admin/resolve?id=${market.id}`}>
                            Resolve
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
