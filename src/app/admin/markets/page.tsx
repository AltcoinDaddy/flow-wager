"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Settings,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Search,
  TrendingUp,
  Users,
  Clock,
  ExternalLink,
  Eye,
  Calendar,
  Wallet,
  Target,
  Activity,
  DollarSign,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import * as fcl from "@onflow/fcl";
import flowConfig from "@/lib/flow/config";

// Import your Flow Wager scripts
import {
  getAllMarkets,
  getMarketById,
  getPlatformStats,
  getContractInfo,
} from "@/lib/flow-wager-scripts";

// Import your existing types
import type { Market } from "@/types/market";
import {
  MarketCategoryLabels,
  MarketStatus,
  MarketCategory,
} from "@/types/market";

// Your existing auth hook
import { useAuth } from "@/providers/auth-provider";

export default function AdminMarketsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // State management
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [contractInfo, setContractInfo] = useState<any>(null);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);

  // Simple admin check
  const isAdmin = isAuthenticated && user?.addr;

  // Helper function to convert numeric status to string
  const getStatusName = (status: number): string => {
    switch (status) {
      case 0:
        return "Active";
      case 1:
        return "Resolved";
      case 2:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  // Initialize Flow configuration
  useEffect(() => {
    const initFlow = async () => {
      try {
        flowConfig();
        console.log("Flow configuration initialized for admin markets");
      } catch (error) {
        console.error("Failed to initialize Flow configuration:", error);
      }
    };

    initFlow();
  }, []);

  // Fetch markets and platform stats using your Flow scripts
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;

      try {
        setMarketsLoading(true);
        setMarketsError(null);

        // Fetch all markets using your script
        const allMarketsScript = await getAllMarkets();
        const allMarkets = await fcl.query({
          cadence: allMarketsScript,
        });

        console.log("All markets from contract:", allMarkets);
        setMarkets(allMarkets || []);

        // Fetch platform stats using your script
        const platformStatsScript = await getPlatformStats();
        const stats = await fcl.query({
          cadence: platformStatsScript,
        });

        console.log("Platform stats:", stats);
        setPlatformStats(stats);

        // Fetch contract info using your script
        const contractInfoScript = await getContractInfo();
        const contractData = await fcl.query({
          cadence: contractInfoScript,
        });

        console.log("Contract info:", contractData);
        setContractInfo(contractData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setMarketsError("Failed to load data from contract");
        toast.error("Failed to load markets from Flow blockchain");
      } finally {
        setMarketsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastAction("refresh");

    try {
      // Re-fetch all data
      const allMarketsScript = await getAllMarkets();
      const allMarkets = await fcl.query({
        cadence: allMarketsScript,
      });

      const platformStatsScript = await getPlatformStats();
      const stats = await fcl.query({
        cadence: platformStatsScript,
      });

      setMarkets(allMarkets || []);
      setPlatformStats(stats);

      toast.success("Markets refreshed successfully");
    } catch (error) {
      console.error("Refresh failed:", error);
      toast.error("Failed to refresh markets");
    } finally {
      setIsRefreshing(false);
      setLastAction(null);
    }
  };

  const handleExportData = async () => {
    setLastAction("export");

    try {
      // Export market data as JSON
      const exportData = {
        markets,
        platformStats,
        contractInfo,
        exportedAt: new Date().toISOString(),
        contractAddress: process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flow-wager-markets-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Market data exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    } finally {
      setLastAction(null);
    }
  };

  // Filter markets based on search and filters
  const filteredMarkets = markets.filter((market: Market) => {
    const matchesSearch =
      market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.creator.toLowerCase().includes(searchQuery.toLowerCase());

    const marketStatusString = getStatusName(typeof market.status === 'number' ? market.status : 0);
    const matchesStatus =
      statusFilter === "all" || marketStatusString === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || market.category.toString() === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate summary stats
  const summaryStats = {
    total: markets.length,
    active: markets.filter((m) => getStatusName(typeof m.status === 'number' ? m.status : 0) === "Active").length,
    resolved: markets.filter((m) => getStatusName(typeof m.status === 'number' ? m.status : 0) === "Resolved").length,
    cancelled: markets.filter((m) => getStatusName(typeof m.status === 'number' ? m.status : 0) === "Cancelled").length,
    totalVolume: markets.reduce(
      (sum, m) => sum + parseFloat(m.totalPool || "0"),
      0
    ),
    pendingResolution: markets.filter((m) => {
      const now = Date.now() / 1000;
      const endTime = parseFloat(m.endTime);
      return endTime < now && getStatusName(typeof m.status === 'number' ? m.status : 0) === "Active";
    }).length,
  };

  // Utility functions
  const formatCurrency = (value: string | number): string => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "0";
    if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
    if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}K`;
    return numValue.toFixed(2);
  };

  const formatDate = (timestamp: string): string => {
    const timestampMs = parseFloat(timestamp) * 1000;
    if (isNaN(timestampMs)) return "Invalid date";

    return new Date(timestampMs).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string | number) => {
    // Convert numeric status to string if needed
    const statusString = typeof status === 'number' ? getStatusName(status) : status;
    
    switch (statusString) {
      case "Active":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Active
          </Badge>
        );
      case "Resolved":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Resolved
          </Badge>
        );
      case "Cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{statusString}</Badge>;
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0C14] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-b-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show authentication prompt if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0C14] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400">
              You need to connect your wallet to access the admin panel.
            </p>
            <Button
              onClick={() => (window.location.href = "/markets")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Go to Markets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C14] text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
            >
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Market Management
              </h1>
              <p className="text-gray-400">
                Manage all prediction markets on the Flow blockchain
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Admin Panel
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <Activity className="h-3 w-3 mr-1" />
                  Live Contract Data
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {marketsError && (
          <Card className="border-red-500 bg-red-900/20 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Error: {marketsError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Markets</p>
                  <p className="text-2xl font-bold text-white">
                    {summaryStats.total}
                  </p>
                </div>
                <Target className="h-8 w-8 text-[#9b87f5]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-white">
                    {summaryStats.active}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending Resolution</p>
                  <p className="text-2xl font-bold text-white">
                    {summaryStats.pendingResolution}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold text-white">
                    {summaryStats.resolved}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Volume</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(summaryStats.totalVolume)}
                  </p>
                  <p className="text-xs text-gray-400">FLOW</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">
                    {platformStats?.totalUsers || "0"}
                  </p>
                </div>
                <Users className="h-8 w-8 text-[#9b87f5]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-[#9b87f5]" />
                  <span className="font-medium text-white">Market Operations</span>
                </div>
                <div className="text-sm text-gray-400">
                  Live data from contract:{" "}
                  {process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
                >
                  <Link href="/admin/resolve">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve Markets
                  </Link>
                </Button>
                <Button size="sm" asChild className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white">
                  <Link href="/admin/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Market
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search markets by title or creator..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-400 focus:border-[#9b87f5]"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-[#0A0C14] border-gray-700 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0C14] border-gray-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48 bg-[#0A0C14] border-gray-700 text-white">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0C14] border-gray-700">
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(MarketCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Markets List */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Markets ({filteredMarkets.length})</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  disabled={lastAction === "export"}
                  className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marketsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#9b87f5] border-b-transparent mx-auto mb-2" />
                <p className="text-gray-400">
                  Loading markets from Flow blockchain...
                </p>
              </div>
            ) : filteredMarkets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No markets found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMarkets.map((market: Market) => (
                  <div
                    key={market.id}
                    className="p-4 border border-gray-700 rounded-lg hover:bg-[#0A0C14]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getStatusBadge(market.status)}
                          <Badge
                            variant="outline"
                            className="border-gray-600 text-gray-300"
                          >
                            {
                              MarketCategoryLabels[market.category as MarketCategory] ||
                              "Unknown"
                            }
                          </Badge>
                          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                            #{market.id}
                          </span>
                        </div>
                        <h3 className="font-medium text-white mb-2 line-clamp-2">
                          {market.title}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-400">Pool:</span>
                            <span className="text-white">
                              {formatCurrency(market.totalPool)} FLOW
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-400">Creator:</span>
                            <span className="text-white font-mono text-xs">
                              {market.creator.slice(0, 6)}...
                              {market.creator.slice(-4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-400">Ends:</span>
                            <span className="text-white">
                              {formatDate(market.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-400">Created:</span>
                            <span className="text-white">
                              {formatDate(market.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
                        >
                          <Link href={`/markets/${market.id}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
                        >
                          <Link href={`/markets/${market.id}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Market Options */}
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-700">
                      <div className="flex items-center justify-between p-2 bg-green-900/20 border border-green-700/50 rounded">
                        <span className="text-sm text-green-300">{market.optionA}</span>
                        <span className="text-sm text-green-400">
                          {parseFloat(market.totalOptionAShares).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-900/20 border border-blue-700/50 rounded">
                        <span className="text-sm text-blue-300">{market.optionB}</span>
                        <span className="text-sm text-blue-400">
                          {parseFloat(market.totalOptionBShares).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-16 flex-col space-y-2 border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
            asChild
          >
            <Link href="/admin/create">
              <Plus className="h-6 w-6" />
              <span>Create Market</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="h-16 flex-col space-y-2 border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
            asChild
          >
            <Link href="/admin/resolve">
              <CheckCircle className="h-6 w-6" />
              <span>Resolve Markets</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="h-16 flex-col space-y-2 border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
            onClick={handleExportData}
            disabled={lastAction === "export"}
          >
            <Download className="h-6 w-6" />
            <span>Export Data</span>
          </Button>

          <Button
            variant="outline"
            className="h-16 flex-col space-y-2 border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
            asChild
          >
            <Link href="/admin">
              <Settings className="h-6 w-6" />
              <span>Admin Dashboard</span>
            </Link>
          </Button>
        </div>

        {/* Status Message */}
        {lastAction && (
          <Card className="border-blue-500 bg-blue-900/20 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span>
                  {lastAction === "refresh" &&
                    "Refreshing markets from blockchain..."}
                  {lastAction === "export" && "Exporting market data..."}
                  {lastAction && !["refresh", "export"].includes(lastAction) && "Processing..."}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
