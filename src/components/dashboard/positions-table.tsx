"use client";

import { CountdownTimer } from "@/components/market/countdown-timer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  getAllMarkets
} from "@/lib/flow-wager-scripts";
import flowConfig from "@/lib/flow/config";
import { useAuth } from "@/providers/auth-provider";
import type { Market, Position } from "@/types/market";
import * as fcl from "@onflow/fcl";
import {
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  Search,
  Target,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Enhanced Position interface to match Flow contract data
interface FlowPosition extends Position {
  marketTitle?: string;
  marketCategory?: string;
  marketEndTime?: string;
  marketStatus?: string;
  optionAName?: string;
  optionBName?: string;
}

// Flow script to get user positions (placeholder - positions tracking needs to be implemented in contract)
const GET_USER_POSITIONS = `
  import FlowWager from 0x${process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT?.replace(
    "0x",
    ""
  )}
  
  access(all) fun main(userAddress: Address): [AnyStruct] {
    // NOTE: User position tracking is not yet implemented in the FlowWager contract
    // This would need to be added to track individual user positions across markets
    // For now, return empty array
    return []
  }
`;

interface PositionsTableProps {
  positions?: FlowPosition[];
  isLoading?: boolean;
  compact?: boolean;
  userAddress?: string;
}

export function PositionsTable({ 
  positions: propPositions,
  isLoading: propIsLoading = false,
  compact = false,
  userAddress
}: PositionsTableProps) {
  const { user, isAuthenticated } = useAuth();
  const [positions, setPositions] = useState<FlowPosition[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(propIsLoading);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"pnl" | "value" | "created" | "market">("pnl");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterSide, setFilterSide] = useState<"all" | "optionA" | "optionB">("all");
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Use provided positions or fetch from contract
  const targetUserAddress = userAddress || user?.addr;

  // Initialize Flow configuration
  const initConfig = async () => {
    try {
      flowConfig();
    } catch (error) {
      console.error("Failed to initialize Flow config:", error);
    }
  };

  // Fetch markets data to enrich positions
  const fetchMarkets = async () => {
    try {
      await initConfig();
      
      const allMarketsScript = await getAllMarkets();
      const marketData = await fcl.query({
        cadence: allMarketsScript,
      });

      console.log("Fetched markets for positions:", marketData);
      
      // Transform market data
      const transformedMarkets: Market[] = marketData?.map((market: any) => ({
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
        totalPool: market.totalPool.toString(),
      })) || [];

      setMarkets(transformedMarkets);
      return transformedMarkets;
    } catch (error) {
      console.error("Failed to fetch markets:", error);
      setError("Failed to load market data");
      return [];
    }
  };

  // Fetch user positions from Flow contract
  const fetchPositions = async () => {
    if (!targetUserAddress) {
      setPositions([]);
      return;
    }

    try {
      setError(null);
      await initConfig();

      // Fetch user positions (currently returns empty array since not implemented)
      const userPositions = await fcl.query({
        cadence: GET_USER_POSITIONS,
        args: (arg, t) => [arg(targetUserAddress, t.Address)],
      });

      console.log("User positions from contract:", userPositions);

      // Since position tracking is not yet implemented in the contract,
      // we'll return empty array and show appropriate message
      setPositions([]);
      
    } catch (error) {
      console.error("Failed to fetch positions:", error);
      setError("Failed to load positions from contract");
      setPositions([]);
      toast.error("Failed to load positions");
    }
  };

  // Enhanced refresh function
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchMarkets(),
        fetchPositions()
      ]);
      setLastRefresh(Date.now());
      toast.success("Positions refreshed");
    } catch (error) {
      console.error("Refresh failed:", error);
      toast.error("Failed to refresh positions");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount or when user/userAddress changes
  useEffect(() => {
    const loadData = async () => {
      if (propPositions) {
        setPositions(propPositions);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await Promise.all([
          fetchMarkets(),
          fetchPositions()
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [targetUserAddress, propPositions]);

  // Enhanced position filtering and sorting
  const filteredPositions = positions
    .filter(position => {
      // Find associated market data
      const market = markets.find(m => m.id === position.marketId?.toString());
      
      const matchesSearch = !searchQuery || 
        market?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        position.marketTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market?.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSide = filterSide === "all" || position.side === filterSide;
      return matchesSearch && matchesSide;
    })
    .sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case "pnl":
          aValue = a.pnl;
          bValue = b.pnl;
          break;
        case "value":
          aValue = a.currentValue;
          bValue = b.currentValue;
          break;
        case "created":
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case "market":
          const marketA = markets.find(m => m.id === a.marketId?.toString());
          const marketB = markets.find(m => m.id === b.marketId?.toString());
          return sortOrder === "desc" 
            ? (marketB?.title || "").localeCompare(marketA?.title || "")
            : (marketA?.title || "").localeCompare(marketB?.title || "");
        default:
          return 0;
      }

      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });

  const formatCurrency = (value: number) => {
    if (isNaN(value)) return "0.00 FLOW";
    return `${value.toFixed(2)} FLOW`;
  };

  const formatShares = (shares: number) => {
    if (isNaN(shares)) return "0.00";
    return shares.toFixed(2);
  };

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return "text-green-400";
    if (pnl < 0) return "text-red-400";
    return "text-gray-400";
  };

  const getPnlIcon = (pnl: number) => {
    if (pnl > 0) return <TrendingUp className="h-4 w-4" />;
    if (pnl < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const getMarketStatus = (market: Market) => {
    const now = Date.now() / 1000;
    const endTime = parseFloat(market.endTime);
    
    if (market.status === 1) return "Resolved";
    if (market.status === 2) return "Cancelled";
    if (endTime < now) return "Ended";
    return "Active";
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
        <CardHeader>
          <CardTitle className="text-white">Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border border-gray-700 rounded-lg">
                <div className="h-4 w-24 bg-gray-700 animate-pulse rounded" />
                <div className="h-4 w-16 bg-gray-700 animate-pulse rounded" />
                <div className="h-4 w-20 bg-gray-700 animate-pulse rounded" />
                <div className="h-4 w-16 bg-gray-700 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">
            Your Positions ({filteredPositions.length})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {!compact && (
              <Button variant="outline" size="sm" asChild className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white">
                <Link href="/dashboard/positions">
                  View All
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Implementation Notice */}
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <div className="text-sm">
              <p className="font-medium">Position Tracking Not Yet Implemented</p>
              <p className="text-xs text-yellow-300 mt-1">
                User position tracking will be available once implemented in the FlowWager smart contract. 
                Currently showing live market data from the blockchain.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        {!compact && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#0A0C14] border-gray-700 text-white placeholder:text-gray-400 focus:border-[#9b87f5]"
              />
            </div>
            
            <Select value={filterSide} onValueChange={(value: any) => setFilterSide(value)}>
              <SelectTrigger className="w-full sm:w-32 bg-[#0A0C14] border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0C14] border-gray-700">
                <SelectItem value="all">All Sides</SelectItem>
                <SelectItem value="optionA">Option A</SelectItem>
                <SelectItem value="optionB">Option B</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-40 bg-[#0A0C14] border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0C14] border-gray-700">
                <SelectItem value="pnl">Sort by P&L</SelectItem>
                <SelectItem value="value">Sort by Value</SelectItem>
                <SelectItem value="created">Sort by Date</SelectItem>
                <SelectItem value="market">Sort by Market</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Last Updated Info */}
        <div className="mt-2 text-xs text-gray-400">
          Data from Flow blockchain • Last updated: {new Date(lastRefresh).toLocaleTimeString()}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredPositions.length === 0 ? (
          <div className="text-center py-8">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-2">No positions found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery 
                ? "Try adjusting your search criteria" 
                : positions.length === 0
                  ? "Position tracking will be available once implemented in the smart contract"
                  : "Start trading to see your positions here"
              }
            </p>
            <Button 
              asChild 
              className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
            >
              <Link href="/markets">
                Browse Markets
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredPositions.slice(0, compact ? 3 : undefined).map((position) => {
              const market = markets.find(m => m.id === position.marketId?.toString());
              const optionName = position.side === "optionA" 
                ? (market?.optionA || position.optionAName || "Option A")
                : (market?.optionB || position.optionBName || "Option B");
              
              return (
                <div key={position.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Market Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-3">
                        <Badge 
                          variant={position.side === "optionA" ? "default" : "secondary"}
                          className={`${
                            position.side === "optionA" 
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {optionName}
                        </Badge>
                        
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/markets/${position.marketId}`}
                            className="font-medium text-white hover:text-[#9b87f5] transition-colors line-clamp-1"
                          >
                            {market?.title || position.marketTitle || "Unknown Market"}
                          </Link>
                          
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                            <span>{market?.category || position.marketCategory || "Unknown"}</span>
                            <span>•</span>
                            <span>{formatShares(position.shares)} shares</span>
                            <span>•</span>
                            <span>Avg: {(position.averagePrice * 100).toFixed(0)}¢</span>
                          </div>
                        </div>
                      </div>

                      {/* Market Status and Countdown */}
                      {market && (
                        <div className="mt-2 flex items-center space-x-4 text-xs">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <CountdownTimer endTime={parseInt(market.endTime) * 1000} compact />
                          </div>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {getMarketStatus(market)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Position Values */}
                    <div className="text-right ml-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">Value:</span>
                          <span className="font-medium text-white">{formatCurrency(position.currentValue)}</span>
                        </div>
                        
                        <div className={`flex items-center space-x-1 ${getPnlColor(position.pnl)}`}>
                          {getPnlIcon(position.pnl)}
                          <span className="font-medium">
                            {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                          </span>
                          <span className="text-xs">
                            ({((position.pnl / position.totalCost) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-2 flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Markets Available for Trading */}
      {positions.length === 0 && markets.length > 0 && (
        <CardContent className="pt-0">
          <div className="border-t border-gray-800 pt-4">
            <h4 className="text-sm font-medium text-white mb-3">Available Markets</h4>
            <div className="space-y-2">
              {markets.slice(0, 3).map((market) => (
                <Link
                  key={market.id}
                  href={`/markets/${market.id}`}
                  className="block p-3 border border-gray-700 rounded-lg hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white line-clamp-1">
                        {market.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                        <span>Pool: {parseFloat(market.totalPool).toFixed(2)} FLOW</span>
                        <span>•</span>
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {getMarketStatus(market)}
                        </Badge>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}