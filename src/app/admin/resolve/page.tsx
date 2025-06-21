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
import type { Market } from "@/types/market";
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
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Mock markets pending resolution - properly typed to match Market interface
const pendingMarkets: Market[] = [
  // Commented out for now since the array is empty
];

// Category mapping
const CATEGORIES = {
  1: "Sports",
  2: "Politics", 
  3: "Economics",
  4: "Entertainment",
  5: "Technology",
  6: "Science",
  7: "Weather",
  8: "Other"
} as const;

interface ResolutionData {
  outcome: string; // Use string for the select component
  evidence: string;
  sourceUrl: string;
  adminNotes: string;
}

function AdminResolveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const marketIdParam = searchParams.get("id");
  
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [resolutionData, setResolutionData] = useState<ResolutionData>({
    outcome: "",
    evidence: "",
    sourceUrl: "",
    adminNotes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load specific market if ID provided
  useEffect(() => {
    if (marketIdParam) {
      const market = pendingMarkets.find(m => m.id === marketIdParam);
      if (market) {
        setSelectedMarket(market);
      }
    }
  }, [marketIdParam]);

  const filteredMarkets = pendingMarkets.filter(market =>
    market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    CATEGORIES[market.category as keyof typeof CATEGORIES]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarketSelect = (market: Market) => {
    setSelectedMarket(market);
    setResolutionData({
      outcome: "",
      evidence: "",
      sourceUrl: "",
      adminNotes: ""
    });
  };

  const handleResolve = async () => {
    if (!selectedMarket || !resolutionData.outcome) {
      alert("Please select an outcome");
      return;
    }

    if (!resolutionData.evidence.trim()) {
      alert("Please provide evidence for the resolution");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call to resolve market
      console.log("Resolving market:", {
        marketId: selectedMarket.id,
        ...resolutionData
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));

      alert("Market resolved successfully!");
      router.push("/admin");

    } catch (error) {
      console.error("Failed to resolve market:", error);
      alert("Failed to resolve market. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
    if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}K`;
    return numValue.toFixed(0);
  };

  const getTimeSinceEnd = (endTime: string) => {
    const diff = Date.now() - parseInt(endTime);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return "Just ended";
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalShares = (market: Market) => {
    return parseFloat(market.totalOptionAShares) + parseFloat(market.totalOptionBShares);
  };

  const getWinningAmount = (market: Market, outcome: string) => {
    const totalPool = parseFloat(market.totalPool);
    const totalShares = getTotalShares(market);
    
    if (outcome === "Cancelled") return totalPool;
    if (outcome === "OptionA") return totalPool * (parseFloat(market.totalOptionAShares) / totalShares);
    if (outcome === "OptionB") return totalPool * (parseFloat(market.totalOptionBShares) / totalShares);
    return 0;
  };

  // Calculate estimated participants (since not in Market interface)
  const getEstimatedParticipants = (market: Market) => {
    return Math.floor(getTotalShares(market) / 100); // Rough estimate
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Resolve Markets</h1>
            <p className="text-muted-foreground">
              Determine outcomes for markets that have ended
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {pendingMarkets.length} Pending Resolution
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Market Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Markets Pending Resolution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search markets by question or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Market List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredMarkets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No markets found matching your search.</p>
                  </div>
                ) : (
                  filteredMarkets.map((market) => (
                    <div
                      key={market.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedMarket?.id === market.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleMarketSelect(market)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Pending
                          </Badge>
                          <Badge variant="secondary">
                            {CATEGORIES[market.category as keyof typeof CATEGORIES]}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          #{market.id}
                        </span>
                      </div>
                      
                      <h4 className="font-medium mb-3 line-clamp-2 text-sm">
                        {market.title}
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Volume:</span>
                          <span className="font-medium">{formatCurrency(market.totalPool)} FLOW</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Ended:</span>
                          <span className="font-medium">{getTimeSinceEnd(market.endTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Traders:</span>
                          <span className="font-medium">{getEstimatedParticipants(market)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Shares:</span>
                          <span className="font-medium">{getTotalShares(market).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-green-600">{market.optionA}: {((parseFloat(market.totalOptionAShares) / getTotalShares(market)) * 100).toFixed(1)}%</span>
                          <span className="text-blue-600">{market.optionB}: {((parseFloat(market.totalOptionBShares) / getTotalShares(market)) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all" 
                            style={{ width: `${(parseFloat(market.totalOptionAShares) / getTotalShares(market)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Market Details</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/markets/${selectedMarket.id}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Market
                      </Link>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">{selectedMarket.title}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <div className="font-medium">{CATEGORIES[selectedMarket.category as keyof typeof CATEGORIES]}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Creator:</span>
                        <div className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {selectedMarket.creator.slice(0, 6)}...{selectedMarket.creator.slice(-4)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Pool:</span>
                        <div className="font-medium text-green-600">{formatCurrency(selectedMarket.totalPool)} FLOW</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Est. Participants:</span>
                        <div className="font-medium">{getEstimatedParticipants(selectedMarket).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Shares:</span>
                        <div className="text-xs">{getTotalShares(selectedMarket).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ended:</span>
                        <div className="text-xs">{formatDate(selectedMarket.endTime)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium">Current Distribution</h5>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">{selectedMarket.optionA}</span>
                          <div className="text-xs text-green-600 dark:text-green-400">Option A</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{parseFloat(selectedMarket.totalOptionAShares).toLocaleString()} shares</div>
                          <div className="text-sm text-green-600 dark:text-green-400">
                            {((parseFloat(selectedMarket.totalOptionAShares) / getTotalShares(selectedMarket)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedMarket.optionB}</span>
                          <div className="text-xs text-blue-600 dark:text-blue-400">Option B</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{parseFloat(selectedMarket.totalOptionBShares).toLocaleString()} shares</div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            {((parseFloat(selectedMarket.totalOptionBShares) / getTotalShares(selectedMarket)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resolution Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Resolution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Outcome Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Outcome *</Label>
                    <Select 
                      value={resolutionData.outcome} 
                      onValueChange={(value: string) => 
                        setResolutionData(prev => ({ ...prev, outcome: value }))
                      }
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select the winning outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OptionA">
                          <div className="flex items-center space-x-3 py-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium">{selectedMarket.optionA}</div>
                              <div className="text-xs text-muted-foreground">
                                Winners receive: {formatCurrency(getWinningAmount(selectedMarket, "OptionA"))} FLOW
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="OptionB">
                          <div className="flex items-center space-x-3 py-1">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium">{selectedMarket.optionB}</div>
                              <div className="text-xs text-muted-foreground">
                                Winners receive: {formatCurrency(getWinningAmount(selectedMarket, "OptionB"))} FLOW
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="Cancelled">
                          <div className="flex items-center space-x-3 py-1">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <div>
                              <div className="font-medium">Cancel Market</div>
                              <div className="text-xs text-muted-foreground">
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
                    <Label htmlFor="evidence" className="text-sm font-medium">Evidence/Reasoning *</Label>
                    <Textarea
                      id="evidence"
                      placeholder="Provide detailed evidence and reasoning for this resolution. Include facts, sources, and clear explanation of why this outcome is correct..."
                      value={resolutionData.evidence}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, evidence: e.target.value }))}
                      className="min-h-32"
                    />
                    <div className="text-xs text-muted-foreground">
                      {resolutionData.evidence.length}/1000 characters
                    </div>
                  </div>

                  {/* Source URL */}
                  <div className="space-y-2">
                    <Label htmlFor="sourceUrl" className="text-sm font-medium">Source URL</Label>
                    <Input
                      id="sourceUrl"
                      placeholder="https://example.com/proof-or-official-announcement"
                      value={resolutionData.sourceUrl}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                    />
                    <div className="text-xs text-muted-foreground">
                      Provide a reliable source that supports your resolution
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="adminNotes" className="text-sm font-medium">Admin Notes (Internal)</Label>
                    <Textarea
                      id="adminNotes"
                      placeholder="Internal notes for admin records, additional context, or special considerations..."
                      value={resolutionData.adminNotes}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, adminNotes: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  {/* Resolution Preview */}
                  {resolutionData.outcome && (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <h6 className="font-medium text-sm">Resolution Preview</h6>
                      <div className="text-sm space-y-1">
                        <div><span className="text-muted-foreground">Outcome:</span> {
                          resolutionData.outcome === "OptionA" ? selectedMarket.optionA :
                          resolutionData.outcome === "OptionB" ? selectedMarket.optionB :
                          "Market Cancelled"
                        }</div>
                        <div><span className="text-muted-foreground">Total Distribution:</span> {formatCurrency(selectedMarket.totalPool)} FLOW</div>
                        <div><span className="text-muted-foreground">Est. Winning Participants:</span> {
                          resolutionData.outcome === "OptionA" ? Math.floor(getEstimatedParticipants(selectedMarket) * (parseFloat(selectedMarket.totalOptionAShares) / getTotalShares(selectedMarket))) :
                          resolutionData.outcome === "OptionB" ? Math.floor(getEstimatedParticipants(selectedMarket) * (parseFloat(selectedMarket.totalOptionBShares) / getTotalShares(selectedMarket))) :
                          getEstimatedParticipants(selectedMarket)
                        }</div>
                      </div>
                    </div>
                  )}

                  {/* Warning */}
                  <div className="flex items-start space-x-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      <p className="font-medium mb-1">Resolution is permanent and irreversible</p>
                      <p>Once resolved, this action cannot be undone. Funds will be distributed immediately. Please verify all information is accurate before proceeding.</p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    onClick={handleResolve}
                    disabled={isSubmitting || !resolutionData.outcome || !resolutionData.evidence.trim()}
                    className="w-full h-12"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Resolving Market...
                      </div>
                    ) : (
                      `Resolve Market: ${
                        resolutionData.outcome === "OptionA" ? selectedMarket.optionA :
                        resolutionData.outcome === "OptionB" ? selectedMarket.optionB :
                        resolutionData.outcome === "Cancelled" ? "Cancel" :
                        "Select Outcome"
                      }`
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">Select a Market to Resolve</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Choose a market from the list on the left to begin the resolution process. You can search by question or category to find specific markets.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-b-transparent mx-auto mb-6"></div>
              <h3 className="text-lg font-medium mb-2">Resolving Market...</h3>
              <p className="text-muted-foreground mb-4">
                Processing resolution and distributing winnings to participants
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>• Validating resolution data</div>
                <div>• Calculating winner distributions</div>
                <div>• Processing blockchain transactions</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Loading fallback component
function AdminResolveLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Button variant="outline" size="sm" disabled>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Resolve Markets</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Markets...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">Loading...</h3>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function AdminResolvePage() {
  return (
    <Suspense fallback={<AdminResolveLoading />}>
      <AdminResolveContent />
    </Suspense>
  );
}