/* eslint-disable @typescript-eslint/no-unused-vars */
 
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
import {
  getAllMarkets,
  getPlatformStats,
  getPendingMarkets,
  withdrawAllPlatformFeesTransaction as adminWithdrawAllPlatformFeesTransaction,
} from "@/lib/flow-wager-scripts";
import * as fcl from "@onflow/fcl";
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
  Coins,
} from "lucide-react";
import type { Market } from "@/types/market";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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
  const [adminStats, setAdminStats] = useState({
    totalMarkets: 0,
    activeMarkets: 0,
    pendingResolution: 0,
    totalVolume: "0.0",
    avgMarketVolume: "0.0",
  });
  const [recentMarkets, setRecentMarkets] = useState<Market[]>([]);
  const [pendingMarkets, setPendingMarkets] = useState<Market[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Remove contractInfo state and all references to it

  // Add state for market search/filter/sort
  const [marketSearch, setMarketSearch] = useState("");
  const [marketStatusFilter, setMarketStatusFilter] = useState("all");
  const [marketSort, setMarketSort] = useState("newest");
  // Add state for user management (placeholder)
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]); // Replace with real user data integration

  // Add state for withdraw
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [availableFees, setAvailableFees] = useState("0.0");

  // Check if user is admin (for now, just check if connected)
  const isAdmin = loggedIn && user?.addr;

  // Fetch admin dashboard data
  const fetchAdminData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch platform stats
      const platformStatsScript = await getPlatformStats();
      const stats = await fcl.query({ cadence: platformStatsScript });
      setAvailableFees(stats.availableFeesForWithdrawal?.toString() || "0.0");
      // Fetch all markets
      const allMarketsScript = await getAllMarkets();
      const markets = await fcl.query({ cadence: allMarketsScript });
      // Fetch pending markets (PendingResolution status)
      const pendingMarketsScript = await getPendingMarkets();
      const pendingResolutionMarkets = await fcl.query({ cadence: pendingMarketsScript });
      // Find markets that are Active but have ended
      const now = Date.now() / 1000;
      const endedActiveMarkets = (markets || []).filter((market: any) => {
        return market.status === 0 && parseFloat(market.endTime) < now;
      });
      // Merge and deduplicate by market.id
      const pendingMap = new Map();
      (pendingResolutionMarkets || []).forEach((m: any) => pendingMap.set(m.id, m));
      (endedActiveMarkets || []).forEach((m: any) => pendingMap.set(m.id, m));
      setAdminStats({
        totalMarkets: stats.totalMarkets || 0,
        activeMarkets: stats.activeMarkets || 0,
        pendingResolution: (markets || []).filter((m: any) => m.status === 1).length,
        totalVolume: stats.totalVolume?.toString() || "0.0",
        avgMarketVolume: stats.totalMarkets > 0
          ? (parseFloat(stats.totalVolume) / stats.totalMarkets).toFixed(2)
          : "0.0",
      });
      setRecentMarkets(markets || []);
      setPendingMarkets(Array.from(pendingMap.values()));
    } catch (error: any) {
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
    const statuses = ["Active", "Pending", "Resolved"];
    return statuses[status] || "Unknown";
  };

  // Market filtering, searching, and sorting logic
  const filteredMarkets: Market[] = recentMarkets
    .filter((market) =>
      marketSearch === "" || market.title.toLowerCase().includes(marketSearch.toLowerCase())
    )
    .filter((market) =>
      marketStatusFilter === "all" || getStatusName(market.status) === marketStatusFilter
    )
    .sort((a, b) => {
      if (marketSort === "newest") return parseInt(b.createdAt) - parseInt(a.createdAt);
      if (marketSort === "oldest") return parseInt(a.createdAt) - parseInt(b.createdAt);
      if (marketSort === "volume") return parseFloat(b.totalPool) - parseFloat(a.totalPool);
      return 0;
    });

  // Withdraw handler
  const handleWithdrawFees = async () => {
    setWithdrawing(true);
    setWithdrawError(null);
    try {
      const txScript = await adminWithdrawAllPlatformFeesTransaction();
      const authorization = fcl.currentUser().authorization;
      const txId = await fcl.mutate({
        cadence: txScript,
        args: (arg, t) => [], // No arguments needed
        proposer: authorization,
        payer: authorization,
        authorizations: [authorization],
        limit: 1000,
      });
      toast.loading("Withdrawing all platform fees...");
      const result = await fcl.tx(txId).onceSealed();
      toast.dismiss();
      if (result.status === 4) {
        toast.success("All platform fees withdrawn successfully!");
        // Optionally refresh stats
        await fetchAdminData();
      } else {
        throw new Error(`Transaction failed with status: ${result.status}`);
      }
    } catch (err: any) {
      setWithdrawError(err.message || "Failed to withdraw fees");
      toast.error("Failed to withdraw fees", { description: err.message });
    } finally {
      setWithdrawing(false);
    }
  };

  // Show login prompt if not connected
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#0A0C14] flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-700/50">
          <CardContent className="bg-gray-900 pt-6 text-center">
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
      <div className="container mx-auto px-2 py-4 space-y-6">
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
              {/* Remove any display of contractInfo and only show platformStats */}
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

        {/* Responsive Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <Card className="bg-gray-900 border-gray-700/50">
            <CardContent className="bg-gray-900 p-4 flex flex-col items-center gap-3">
              <BarChart3 className="h-6 w-6 text-[#9b87f5]" />
              <span className="text-lg font-bold text-white">{adminStats.totalMarkets}</span>
              <span className="text-xs sm:text-base text-white">Total Markets</span>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700/50">
            <CardContent className="bg-gray-900 p-4 flex flex-col items-center gap-3 text-white">
              <Target className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-bold text-white">{adminStats.activeMarkets}</span>
              <span className="text-xs sm:text-base text-white">Active Markets</span>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700/50">
            <CardContent className="bg-gray-900 p-4 flex flex-col items-center gap-3">
              <Clock className="h-6 w-6 text-yellow-400" />
              <span className="text-lg font-bold text-white">{adminStats.pendingResolution}</span>
              <span className="text-xs sm:text-base text-white">Pending Resolution</span>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-700/50">
            <CardContent className="bg-gray-900 p-4 flex flex-col items-center gap-3">
              <DollarSign className="h-6 w-6 text-green-400" />
              <span className="text-lg font-bold text-white">{formatCurrency(adminStats.totalVolume)}</span>
              <span className="text-xs sm:text-base text-white">Total Volume</span>
            </CardContent>
          </Card>
        </div>

        {/* Pending Markets Section */}
        {pendingMarkets.length > 0 && (
          <Card className="bg-gray-900 border-gray-700/50 mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                Pending Markets ({pendingMarkets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-gray-800/50">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[#151923]">
                      <th className="px-2 py-2 text-white">Title</th>
                      <th className="px-2 py-2 text-white">Status</th>
                      <th className="px-2 py-2 text-white">Volume</th>
                      <th className="px-2 py-2 text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMarkets.map((market) => (
                      <tr key={market.id} className="border-b border-gray-800">
                        <td className="px-2 py-2 text-white">{market.title}</td>
                        <td className="px-2 py-2 text-white">{market.status === 1 ? "Pending Resolution" : "Ended (Unresolved)"}</td>
                        <td className="px-2 py-2 text-white">{formatCurrency(market.totalPool)}</td>
                        <td className="px-2 py-2 text-white">
                          <Link href={`/markets/${market.id}`}>
                            <Button size="sm" className="w-full md:w-auto text-white">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Fees Withdraw Card (Admins only) */}
        {isAdmin && (
          <div className="w-full max-w-xl mx-auto mb-6">
            <Card className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col gap-4 shadow-lg">
              <CardContent className="bg-gray-900">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-5 w-5 text-white" />
                  <span className="text-lg font-semibold text-white">Platform Fees</span>
                  <span className="ml-2 text-sm text-white">{formatCurrency(availableFees)} FLOW available</span>
                </div>
                <p className="text-gray-400 text-sm mb-2">Withdraw accumulated platform fees to the admin wallet.</p>
                {withdrawError && (
                  <div className="text-red-400 text-xs mb-2">{withdrawError}</div>
                )}
                <Button
                  onClick={handleWithdrawFees}
                  disabled={withdrawing || parseFloat(availableFees) <= 0}
                  className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white font-bold h-12 w-full"
                >
                  {withdrawing ? "Withdrawing..." : "Withdraw Platform Fees"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Market Management Section */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border border-gray-800/50 rounded-xl p-4">
          <CardContent className="bg-gradient-to-br from-[#1A1F2C] to-[#151923]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Input
                  placeholder="Search markets..."
                  value={marketSearch}
                  onChange={e => setMarketSearch(e.target.value)}
                  className="w-full sm:w-64"
                />
                <Select value={marketStatusFilter} onValueChange={setMarketStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 text-white">
                    <SelectValue placeholder="Status" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-0">
                    <SelectItem value="all" className="text-white">All Statuses</SelectItem>
                    <SelectItem value="Active" className="text-white">Active</SelectItem>
                    <SelectItem value="Resolved" className="text-white">Resolved</SelectItem>
                    <SelectItem value="Cancelled" className="text-white">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={marketSort} onValueChange={setMarketSort}>
                  <SelectTrigger className="w-full sm:w-40 text-white">
                    <SelectValue placeholder="Sort by" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-0">
                    <SelectItem value="newest" className="text-white">Newest</SelectItem>
                    <SelectItem value="oldest" className="text-white">Oldest</SelectItem>
                    <SelectItem value="volume" className="text-white">Volume</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={handleRefresh} disabled={isLoading} className="w-full md:w-auto text-white">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button asChild className="w-full md:w-auto bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white">
                  <Link href="/admin/create">
                    <Plus className="h-4 w-4 mr-2" />Create Market
                  </Link>
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-800/50">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#151923]">
                    <th className="px-2 py-2 text-white">Title</th>
                    <th className="px-2 py-2 hidden md:table-cell text-white">Status</th>
                    <th className="px-2 py-2 text-white">Volume</th>
                    <th className="px-2 py-2 text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarkets.map((market) => (
                    <tr key={market.id} className="border-b border-gray-800">
                      <td className="px-2 py-2 text-white">{market.title}</td>
                      <td className="px-2 py-2 hidden md:table-cell text-white">{getStatusName(market.status)}</td>
                      <td className="px-2 py-2 text-white">{formatCurrency(market.totalPool)}</td>
                      <td className="px-2 py-2 text-white">
                        <Link href={`/markets/${market.id}`}>
                          <Button size="sm" className="w-full md:w-auto text-white">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* User Management Section (placeholder for future integration) */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border border-gray-800/50 rounded-xl p-4">
          <CardContent className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] text-white">
            <h2 className="text-lg font-bold text-white mb-4">User Management</h2>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input
                placeholder="Search users by address or username..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-800/50">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[#151923]">
                    <th className="px-2 py-2 text-white">Address</th>
                    <th className="px-2 py-2 text-white">Username</th>
                    <th className="px-2 py-2 text-white">Markets Created</th>
                    <th className="px-2 py-2 text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Placeholder: Replace with real user data integration */}
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-400 py-4 text-white">
                        User management coming soon...
                      </td>
                    </tr>
                  ) : (
                    users
                      .filter(user =>
                        userSearch === "" ||
                        user.address.toLowerCase().includes(userSearch.toLowerCase()) ||
                        (user.username && user.username.toLowerCase().includes(userSearch.toLowerCase()))
                      )
                      .map(user => (
                        <tr key={user.address} className="border-b border-gray-800">
                          <td className="px-2 py-2 font-mono text-white">{user.address}</td>
                          <td className="px-2 py-2 text-white">{user.username || "-"}</td>
                          <td className="px-2 py-2 text-white">{user.marketsCreated || 0}</td>
                          <td className="px-2 py-2 text-white">
                            <Button size="sm" className="w-full md:w-auto text-white">View</Button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Contract Info Section */}
        {/* Remove any display of contractInfo and only show platformStats */}

        {/* Error Alert */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30 text-red-400 mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
