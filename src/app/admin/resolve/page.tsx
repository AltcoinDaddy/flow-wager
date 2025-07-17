/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import flowConfig from '@/lib/flow/config';
import * as fcl from "@onflow/fcl";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Search,
  TrendingUp,
  Users,
  Wallet,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, JSX, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

// Import your Flow Wager scripts
import {
  getAllMarkets,
  resolveMarketTransaction
} from '@/lib/flow-wager-scripts';

// Import your existing types
import type {
  Market
} from "@/types/market";

import {
  MarketCategoryLabels,
  MarketOutcome
} from "@/types/market";

// Your existing auth hook
import { useAuth } from "@/providers/auth-provider";

// Resolution form data interface
interface ResolutionData {
  outcome: string;
  evidence: string;
  sourceUrl: string;
  adminNotes: string;
}

function AdminResolveContent(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const marketIdParam = searchParams.get("id");
  
  // Use your existing auth hook
  const { 
    user,
    isAuthenticated: loggedIn, 
    isLoading: authLoading
  } = useAuth();
  
  // State management
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<boolean>(false);
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  
  // Component state
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [resolutionData, setResolutionData] = useState<ResolutionData>({
    outcome: "",
    evidence: "",
    sourceUrl: "",
    adminNotes: ""
  });
  const [searchQuery, setSearchQuery] = useState<string>("");


  // Simple admin check
  const isAdmin = loggedIn && user?.addr;

  // Initialize Flow configuration
  useEffect(() => {
    const initFlow = async () => {
      try {
        flowConfig();
        console.log('Flow configuration initialized for admin resolve');
      } catch (error) {
        console.error('Failed to initialize Flow configuration:', error);
      }
    };

    initFlow();
  }, []);

  // Fetch pending markets using your Flow scripts
  useEffect(() => {
    const fetchMarkets = async () => {
      if (!loggedIn) return;
      
      try {
        setMarketsLoading(true);
        setMarketsError(null);

        // Get all markets using your script
        const allMarketsScript = await getAllMarkets();
        const allMarkets = await fcl.query({
          cadence: allMarketsScript,
        });

        console.log('All markets from contract:', allMarkets);

        // Filter for markets that need resolution (ended but not resolved)
        const now = Date.now() / 1000;
        const pendingMarkets = allMarkets?.filter((market: any) => {
          const endTime = parseFloat(market.endTime);
          const isEnded = endTime < now;
          const isPending = market.status === 'Active'; // Adjust based on your status enum
          
          return isEnded && isPending;
        }) || [];

        console.log('Pending markets for resolution:', pendingMarkets);
        setMarkets(pendingMarkets);

      } catch (error) {
        console.error("Failed to fetch markets:", error);
        setMarketsError("Failed to load markets from contract");
      } finally {
        setMarketsLoading(false);
      }
    };

    fetchMarkets();
  }, [loggedIn]);

  // Load specific market if ID provided
  useEffect(() => {
    if (marketIdParam && markets.length > 0) {
      const market = markets.find((m: Market) => m.id === marketIdParam);
      if (market) {
        setSelectedMarket(market);
      }
    }
  }, [marketIdParam, markets]);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && loggedIn && !isAdmin) {
      toast.error("You don't have admin privileges");
      router.push("/");
    }
  }, [loggedIn, isAdmin, authLoading, router]);

  // Filter markets with proper typing
  const filteredMarkets: Market[] = markets.filter((market: Market) =>
    market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (market.category in MarketCategoryLabels && MarketCategoryLabels[market.category as keyof typeof MarketCategoryLabels]?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Event handlers with proper typing
  const handleMarketSelect = (market: Market): void => {
    setSelectedMarket(market);
    setResolutionData({
      outcome: "",
      evidence: "",
      sourceUrl: "",
      adminNotes: ""
    });
  };

  const handleInputChange = (
    field: keyof ResolutionData
  ) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setResolutionData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleOutcomeChange = (value: string): void => {
    setResolutionData(prev => ({ ...prev, outcome: value }));
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  // 🚨 UPDATED: Use your Flow Wager resolve script
  const handleResolve = async (): Promise<void> => {
    if (!selectedMarket || !resolutionData.outcome) {
      toast.error("Please select an outcome");
      return;
    }

    if (!resolutionData.evidence.trim()) {
      toast.error("Please provide evidence for the resolution");
      return;
    }

    if (!isAdmin) {
      toast.error("You don't have admin privileges");
      return;
    }

    setResolving(true);
    setResolutionError(null);

    try {
      // Validate inputs
      const marketId = parseInt(selectedMarket.id);
      const outcomeValue = parseInt(resolutionData.outcome);
      
      if (isNaN(marketId) || isNaN(outcomeValue)) {
        throw new Error("Invalid market ID or outcome");
      }

      console.log("Resolving market with your Flow Wager script:", { 
        marketId, 
        outcomeValue, 
        evidence: resolutionData.evidence.trim() 
      });

      toast.loading("Submitting resolution transaction...");

      // 🚨 USE YOUR FLOW WAGER RESOLVE SCRIPT 🚨
      const transactionScript = await resolveMarketTransaction();
      
      console.log("Using resolution script from flow-wager-scripts");

      const transactionId = await fcl.mutate({
        cadence: transactionScript,
        args: (arg, t) => [
          arg(marketId, t.UInt64),      // marketId
          arg(outcomeValue, t.UInt8),   // outcome (MarketOutcome enum value)
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000
      });

      console.log("Resolution transaction submitted:", transactionId);
      toast.dismiss();
      toast.loading("Waiting for transaction to be sealed...");

      // Wait for transaction to be sealed
      const result = await fcl.tx(transactionId).onceSealed();
      console.log("Transaction sealed:", result);
      toast.dismiss();

      if (result.status === 4) { // SEALED
        toast.success("Market resolved successfully!", {
          description: `Transaction ID: ${transactionId}`,
          duration: 5000
        });
        
        // Refresh markets by re-fetching
        const allMarketsScript = await getAllMarkets();
        const updatedMarkets = await fcl.query({
          cadence: allMarketsScript,
        });

        // Filter for pending markets again
        const now = Date.now() / 1000;
        const pendingMarkets = updatedMarkets?.filter((market: any) => {
          const endTime = parseFloat(market.endTime);
          const isEnded = endTime < now;
          const isPending = market.status === 'Active';
          
          return isEnded && isPending;
        }) || [];

        setMarkets(pendingMarkets);
        
        // Reset form
        setSelectedMarket(null);
        setResolutionData({
          outcome: "",
          evidence: "",
          sourceUrl: "",
          adminNotes: ""
        });
        
        router.push("/admin");
      } else {
        throw new Error(`Transaction failed with status: ${result.status}`);
      }

    } catch (error: unknown) {
      console.error("Resolution failed:", error);
      
      let errorMessage = "Unknown error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Handle specific Flow errors
      if (errorMessage.includes('Could not borrow Admin reference')) {
        errorMessage = "Only admin accounts can resolve markets. Please ensure you're using an authorized admin wallet.";
      } else if (errorMessage.includes('panic:')) {
        const panicMatch = errorMessage.match(/panic: (.+?)(?:\n|$)/);
        if (panicMatch) {
          errorMessage = panicMatch[1];
        }
      }
      
      setResolutionError(errorMessage);
      toast.dismiss();
      toast.error("Failed to resolve market", {
        description: errorMessage,
        duration: 6000
      });
    } finally {
      setResolving(false);
    }
  };

  // Utility functions with proper typing
  const formatCurrency = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return "0";
    if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
    if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}K`;
    return numValue.toFixed(2);
  };

  const getTimeSinceEnd = (endTime: string): string => {
    const endTimestamp = parseFloat(endTime) * 1000;
    if (isNaN(endTimestamp)) return "Unknown";
    
    const diff = Date.now() - endTimestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return "Just ended";
  };

  const formatDate = (timestamp: string): string => {
    const timestampMs = parseFloat(timestamp) * 1000;
    if (isNaN(timestampMs)) return "Invalid date";
    
    return new Date(timestampMs).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalShares = (market: Market): number => {
    return parseFloat(market.totalOptionAShares) + parseFloat(market.totalOptionBShares);
  };

  const getWinningAmount = (market: Market, outcome: MarketOutcome): number => {
    const totalPool = parseFloat(market.totalPool);
    const totalShares = getTotalShares(market);
    
    if (outcome === MarketOutcome.Cancelled) return totalPool;
    if (outcome === MarketOutcome.OptionA) {
      const optionAShares = parseFloat(market.totalOptionAShares);
      return totalShares > 0 ? totalPool * (optionAShares / totalShares) : 0;
    }
    if (outcome === MarketOutcome.OptionB) {
      const optionBShares = parseFloat(market.totalOptionBShares);
      return totalShares > 0 ? totalPool * (optionBShares / totalShares) : 0;
    }
    return 0;
  };

  const getEstimatedParticipants = (market: Market): number => {
    return Math.max(1, Math.floor(getTotalShares(market) / 100));
  };

  const getSharePercentage = (shares: string, totalShares: number): number => {
    if (totalShares === 0) return 0;
    return (parseFloat(shares) / totalShares) * 100;
  };

  const getOutcomeLabel = (outcome: MarketOutcome): string => {
    switch (outcome) {
      case MarketOutcome.OptionA:
        return selectedMarket?.optionA || "Option A";
      case MarketOutcome.OptionB:
        return selectedMarket?.optionB || "Option B";
      case MarketOutcome.Draw:
        return "Draw";
      case MarketOutcome.Cancelled:
        return "Cancel Market";
      default:
        return "Unknown";
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0A0C14] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-b-transparent mx-auto mb-4"></div>
            <p className="text-gray-400">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication prompt if not logged in
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0A0C14] text-white">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto bg-gray-900 border-gray-700">
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
              <Button onClick={() => router.push("/markets")} className="w-full bg-blue-600 hover:bg-blue-700">
                Go to Markets
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0A0C14] text-white">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <XCircle className="h-5 w-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                You don&lsquo;t have admin privileges to access this page.
              </p>
              <div className="text-xs text-gray-500 mb-4">
                Connected as: {user?.addr}
              </div>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/">Go to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0C14] text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild className="border-gray-600 hover:bg-gray-800 text-white">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Resolve Markets</h1>
              <p className="text-gray-400">
                Determine outcomes for markets that have ended
              </p>
              <div className="text-xs text-gray-500 mt-1">
                Admin: {user?.addr?.slice(0, 6)}...{user?.addr?.slice(-4)}
                <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">
                  Flow Wager Admin
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {markets.length} Pending Resolution
            </Badge>
          </div>
        </div>

        {/* Show errors */}
        {marketsError && (
          <Card className="border-red-500 bg-red-900/20 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Error loading markets: {marketsError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {resolutionError && (
          <Card className="border-red-500 bg-red-900/20 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Resolution error: {resolutionError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Market Selection */}
          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5" />
                  Markets Pending Resolution
                  {marketsLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-b-transparent" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search markets by question or category..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-9 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                  />
                </div>

                {/* Market List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {marketsLoading ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-b-transparent mx-auto mb-2" />
                      <p>Loading markets from Flow blockchain...</p>
                    </div>
                  ) : filteredMarkets.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No markets found matching your search.</p>
                      {markets.length === 0 && (
                        <p className="text-sm mt-2">All markets may already be resolved.</p>
                      )}
                    </div>
                  ) : (
                    filteredMarkets.map((market: Market) => {
                      const totalShares = getTotalShares(market);
                      return (
                        <div
                          key={market.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                            selectedMarket?.id === market.id
                              ? "border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20"
                              : "border-gray-600 bg-gray-800/50 hover:bg-gray-700/50 hover:border-gray-500"
                          }`}
                          onClick={() => handleMarketSelect(market)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-orange-400 border-orange-500 bg-orange-900/20">
                                Pending
                              </Badge>
                              <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                                {MarketCategoryLabels[market.category as keyof typeof MarketCategoryLabels] || "Unknown"}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                              #{market.id}
                            </span>
                          </div>
                          
                          <h4 className="font-medium mb-3 line-clamp-2 text-sm text-white">
                            {market.title}
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-400">Volume:</span>
                              <span className="font-medium text-white">{formatCurrency(market.totalPool)} FLOW</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-400">Ended:</span>
                              <span className="font-medium text-white">{getTimeSinceEnd(market.endTime)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-400">Traders:</span>
                              <span className="font-medium text-white">{getEstimatedParticipants(market)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-400">Shares:</span>
                              <span className="font-medium text-white">{totalShares.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-green-400">
                                {market.optionA}: {getSharePercentage(market.totalOptionAShares, totalShares).toFixed(1)}%
                              </span>
                              <span className="text-blue-400">
                                {market.optionB}: {getSharePercentage(market.totalOptionBShares, totalShares).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all" 
                                style={{ 
                                  width: `${getSharePercentage(market.totalOptionAShares, totalShares)}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resolution Form */}
          <div className="space-y-6">
            {selectedMarket ? (
              <>
                {/* Market Details */}
                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-white">
                      <span>Market Details</span>
                      <Button variant="outline" size="sm" asChild className="border-gray-600 hover:bg-gray-800 text-white">
                        <Link href={`/markets/${selectedMarket.id}`} target="_blank">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Market
                        </Link>
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3 text-white">{selectedMarket.title}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Category:</span>
                          <div className="font-medium text-white">{MarketCategoryLabels[selectedMarket.category as keyof typeof MarketCategoryLabels] || "Unknown"}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Creator:</span>
                          <div className="font-mono text-xs bg-gray-800 text-gray-200 px-2 py-1 rounded">
                            {selectedMarket.creator.slice(0, 6)}...{selectedMarket.creator.slice(-4)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Total Pool:</span>
                          <div className="font-medium text-green-400">{formatCurrency(selectedMarket.totalPool)} FLOW</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Est. Participants:</span>
                          <div className="font-medium text-white">{getEstimatedParticipants(selectedMarket).toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Total Shares:</span>
                          <div className="text-xs text-white">{getTotalShares(selectedMarket).toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Ended:</span>
                          <div className="text-xs text-white">{formatDate(selectedMarket.endTime)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-medium text-white">Current Distribution</h5>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-900/30 border border-green-700/50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-green-300">{selectedMarket.optionA}</span>
                            <div className="text-xs text-green-400">Option A</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-white">{parseFloat(selectedMarket.totalOptionAShares).toLocaleString()} shares</div>
                            <div className="text-sm text-green-400">
                              {getSharePercentage(selectedMarket.totalOptionAShares, getTotalShares(selectedMarket)).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-blue-300">{selectedMarket.optionB}</span>
                            <div className="text-xs text-blue-400">Option B</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-white">{parseFloat(selectedMarket.totalOptionBShares).toLocaleString()} shares</div>
                            <div className="text-sm text-blue-400">
                              {getSharePercentage(selectedMarket.totalOptionBShares, getTotalShares(selectedMarket)).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resolution Form */}
                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <CheckCircle className="h-5 w-5" />
                      Resolution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Outcome Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-white">Outcome *</Label>
                      <Select value={resolutionData.outcome} onValueChange={handleOutcomeChange}>
                        <SelectTrigger className="h-12 bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Select the winning outcome" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value={MarketOutcome.OptionA.toString()} className="text-white hover:bg-gray-700">
                            <div className="flex items-center space-x-3 py-1">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              <div>
                                <div className="font-medium">{selectedMarket.optionA}</div>
                                <div className="text-xs text-gray-400">
                                  Winners receive: {formatCurrency(getWinningAmount(selectedMarket, MarketOutcome.OptionA))} FLOW
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value={MarketOutcome.OptionB.toString()} className="text-white hover:bg-gray-700">
                            <div className="flex items-center space-x-3 py-1">
                              <CheckCircle className="h-4 w-4 text-blue-400" />
                              <div>
                                <div className="font-medium">{selectedMarket.optionB}</div>
                                <div className="text-xs text-gray-400">
                                  Winners receive: {formatCurrency(getWinningAmount(selectedMarket, MarketOutcome.OptionB))} FLOW
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value={MarketOutcome.Cancelled.toString()} className="text-white hover:bg-gray-700">
                            <div className="flex items-center space-x-3 py-1">
                              <XCircle className="h-4 w-4 text-red-400" />
                              <div>
                                <div className="font-medium">Cancel Market</div>
                                <div className="text-xs text-gray-400">
                                  All participants get refunds
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Evidence */}
                    <div className="space-y-2">
                      <Label htmlFor="evidence" className="text-sm font-medium text-white">Evidence/Reasoning *</Label>
                      <Textarea
                        id="evidence"
                        placeholder="Provide detailed evidence and reasoning for this resolution. Include facts, sources, and clear explanation of why this outcome is correct..."
                        value={resolutionData.evidence}
                        onChange={handleInputChange("evidence")}
                        className="min-h-32 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                        maxLength={1000}
                      />
                      <div className="text-xs text-gray-400">
                        {resolutionData.evidence.length}/1000 characters
                      </div>
                    </div>

                    {/* Source URL */}
                    <div className="space-y-2">
                      <Label htmlFor="sourceUrl" className="text-sm font-medium text-white">Source URL</Label>
                      <Input
                        id="sourceUrl"
                        type="url"
                        placeholder="https://example.com/proof-or-official-announcement"
                        value={resolutionData.sourceUrl}
                        onChange={handleInputChange("sourceUrl")}
                        className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                      />
                      <div className="text-xs text-gray-400">
                        Provide a reliable source that supports your resolution
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="adminNotes" className="text-sm font-medium text-white">Admin Notes (Internal)</Label>
                      <Textarea
                        id="adminNotes"
                        placeholder="Internal notes for admin records, additional context, or special considerations..."
                        value={resolutionData.adminNotes}
                        onChange={handleInputChange("adminNotes")}
                        rows={3}
                        className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                      />
                    </div>

                    {/* Resolution Preview */}
                    {resolutionData.outcome && (
                      <div className="p-4 bg-gray-800 border border-gray-600 rounded-lg space-y-2">
                        <h6 className="font-medium text-sm text-white">Resolution Preview</h6>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-400">Outcome:</span>{" "}
                            <span className="text-white">
                              {getOutcomeLabel(parseInt(resolutionData.outcome) as MarketOutcome)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Total Distribution:</span>{" "}
                            <span className="text-white">{formatCurrency(selectedMarket.totalPool)} FLOW</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Contract:</span>{" "}
                            <span className="text-blue-400 font-mono">{process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Warning */}
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-yellow-900/20 border border-yellow-600/50">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-200">
                        <p className="font-medium mb-1">Resolution is permanent and irreversible</p>
                        <p>Once resolved, this action cannot be undone. Funds will be distributed immediately using your Flow Wager contract. Please verify all information is accurate before proceeding.</p>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      onClick={handleResolve}
                      disabled={resolving || !resolutionData.outcome || !resolutionData.evidence.trim()}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400"
                      size="lg"
                    >
                      {resolving ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Resolving Market...
                        </div>
                      ) : (
                        `Resolve Market: ${
                          resolutionData.outcome ? getOutcomeLabel(parseInt(resolutionData.outcome) as MarketOutcome) : "Select Outcome"
                        }`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-gray-900/50 border-gray-700 backdrop-blur">
                <CardContent className="p-12 text-center">
                  <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2 text-white">Select a Market to Resolve</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Choose a market from the list on the left to begin the resolution process. Markets are loaded from your Flow Wager contract at {process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT}.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {resolving && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4 bg-gray-900 border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-b-transparent mx-auto mb-6"></div>
                <h3 className="text-lg font-medium mb-2 text-white">Resolving Market...</h3>
                <p className="text-gray-400 mb-4">
                  Processing resolution using Flow Wager contract
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>• Validating resolution data</div>
                  <div>• Calculating winner distributions</div>
                  <div>• Processing blockchain transactions</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading fallback component
function AdminResolveLoading(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0C14] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="outline" size="sm" disabled className="border-gray-600 text-gray-400">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Resolve Markets</h1>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Loading Markets...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-12 text-center">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2 text-white">Loading...</h3>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function AdminResolvePage(): JSX.Element {
  return (
    <Suspense fallback={<AdminResolveLoading />}>
      <AdminResolveContent />
    </Suspense>
  );
}