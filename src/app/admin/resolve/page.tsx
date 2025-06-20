"use client";

// src/app/admin/resolve/page.tsx

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  ExternalLink,
  Upload,
  Search
} from "lucide-react";
import type { Market, MarketOutcome } from "@/types/market";

// Mock markets pending resolution
const pendingMarkets: Market[] = [
  {
    id: 2,
    creator: "0xabcdef1234567890",
    question: "Will the next US Presidential Election be held in 2028?",
    optionA: "Yes, in 2028",
    optionB: "No, different year",
    category: "Politics",
    imageURI: "https://images.unsplash.com/photo-1586074299757-14d6ba8c7f98?w=400",
    endTime: Date.now() - 86400000, // Ended yesterday
    creationTime: Date.now() - 30 * 86400000,
    outcome: "Unresolved",
    totalOptionAShares: 89000,
    totalOptionBShares: 11000,
    resolved: false,
    status: "Closed",
    totalPool: 123456.78,
    isBreakingNews: true,
    minBet: 5,
    maxBet: 500
  },
  {
    id: 5,
    creator: "0x9876543210fedcba",
    question: "Will Bitcoin close above $50,000 on January 31st, 2025?",
    optionA: "Yes",
    optionB: "No",
    category: "Economics",
    imageURI: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400",
    endTime: Date.now() - 3600000, // Ended 1 hour ago
    creationTime: Date.now() - 7 * 86400000,
    outcome: "Unresolved",
    totalOptionAShares: 45000,
    totalOptionBShares: 35000,
    resolved: false,
    status: "Closed",
    totalPool: 67890.12,
    isBreakingNews: false,
    minBet: 1,
    maxBet: 1000
  }
];

interface ResolutionData {
  outcome: MarketOutcome;
  evidence: string;
  sourceUrl: string;
  adminNotes: string;
}

export default function AdminResolvePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const marketIdParam = searchParams.get("id");
  
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [resolutionData, setResolutionData] = useState<ResolutionData>({
    outcome: "Unresolved",
    evidence: "",
    sourceUrl: "",
    adminNotes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load specific market if ID provided
  useEffect(() => {
    if (marketIdParam) {
      const market = pendingMarkets.find(m => m.id === parseInt(marketIdParam));
      if (market) {
        setSelectedMarket(market);
      }
    }
  }, [marketIdParam]);

  const filteredMarkets = pendingMarkets.filter(market =>
    market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarketSelect = (market: Market) => {
    setSelectedMarket(market);
    setResolutionData({
      outcome: "Unresolved",
      evidence: "",
      sourceUrl: "",
      adminNotes: ""
    });
  };

  const handleResolve = async () => {
    if (!selectedMarket || resolutionData.outcome === "Unresolved") {
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

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const getTimeSinceEnd = (endTime: number) => {
    const diff = Date.now() - endTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return "Just ended";
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Resolve Markets</h1>
            <p className="text-muted-foreground">
              Determine outcomes for markets that have ended
            </p>
          </div>
        </div>
        
        <Badge variant="secondary">
          {pendingMarkets.length} Pending Resolution
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Market Selection */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Markets Pending Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Market List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredMarkets.map((market) => (
                  <div
                    key={market.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedMarket?.id === market.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleMarketSelect(market)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-yellow-600">
                          Pending
                        </Badge>
                        <Badge variant="secondary">{market.category}</Badge>
                        {market.isBreakingNews && (
                          <Badge variant="destructive">Breaking News</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ID: {market.id}
                      </span>
                    </div>
                    
                    <h4 className="font-medium mb-2 line-clamp-2">{market.question}</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Volume:</span>
                        <div className="font-medium">{formatCurrency(market.totalPool)} FLOW</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ended:</span>
                        <div className="font-medium">{getTimeSinceEnd(market.endTime)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{market.optionA}: {((market.totalOptionAShares / (market.totalOptionAShares + market.totalOptionBShares)) * 100).toFixed(1)}%</span>
                        <span>{market.optionB}: {((market.totalOptionBShares / (market.totalOptionAShares + market.totalOptionBShares)) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-600 h-1.5 rounded-full" 
                          style={{ width: `${(market.totalOptionAShares / (market.totalOptionAShares + market.totalOptionBShares)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
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
                      <Link href={`/markets/${selectedMarket.id}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Market
                      </Link>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{selectedMarket.question}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <div>{selectedMarket.category}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Creator:</span>
                        <div className="font-mono text-xs">{selectedMarket.creator}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Pool:</span>
                        <div className="font-medium">{formatCurrency(selectedMarket.totalPool)} FLOW</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Shares:</span>
                        <div>{selectedMarket.totalOptionAShares + selectedMarket.totalOptionBShares}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium">Current Distribution</h5>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{selectedMarket.optionA}</span>
                        <span className="font-medium">
                          {selectedMarket.totalOptionAShares.toLocaleString()} shares 
                          ({((selectedMarket.totalOptionAShares / (selectedMarket.totalOptionAShares + selectedMarket.totalOptionBShares)) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{selectedMarket.optionB}</span>
                        <span className="font-medium">
                          {selectedMarket.totalOptionBShares.toLocaleString()} shares 
                          ({((selectedMarket.totalOptionBShares / (selectedMarket.totalOptionAShares + selectedMarket.totalOptionBShares)) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resolution Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Resolution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Outcome Selection */}
                  <div className="space-y-3">
                    <Label>Outcome *</Label>
                    <Select 
                      value={resolutionData.outcome} 
                      onValueChange={(value: MarketOutcome) => 
                        setResolutionData(prev => ({ ...prev, outcome: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OptionA">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{selectedMarket.optionA} (Option A)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="OptionB">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <span>{selectedMarket.optionB} (Option B)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Cancelled">
                          <div className="flex items-center space-x-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>Cancel Market</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Evidence */}
                  <div className="space-y-2">
                    <Label htmlFor="evidence">Evidence/Reasoning *</Label>
                    <Textarea
                      id="evidence"
                      placeholder="Provide evidence and reasoning for this resolution..."
                      value={resolutionData.evidence}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, evidence: e.target.value }))}
                      className="min-h-32"
                    />
                  </div>

                  {/* Source URL */}
                  <div className="space-y-2">
                    <Label htmlFor="sourceUrl">Source URL</Label>
                    <Input
                      id="sourceUrl"
                      placeholder="https://example.com/proof"
                      value={resolutionData.sourceUrl}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                    />
                  </div>

                  {/* Admin Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="adminNotes">Admin Notes (Internal)</Label>
                    <Textarea
                      id="adminNotes"
                      placeholder="Internal notes for admin records..."
                      value={resolutionData.adminNotes}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, adminNotes: e.target.value }))}
                    />
                  </div>

                  {/* Warning */}
                  <div className="flex items-start space-x-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      <p className="font-medium">Resolution is permanent</p>
                      <p>Once resolved, this action cannot be undone. Ensure all information is accurate.</p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    onClick={handleResolve}
                    disabled={isSubmitting || resolutionData.outcome === "Unresolved" || !resolutionData.evidence.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      "Resolving Market..."
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
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Market</h3>
                <p className="text-muted-foreground">
                  Choose a market from the list to begin the resolution process
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium mb-2">Resolving Market...</h3>
              <p className="text-muted-foreground">
                Processing resolution and distributing winnings
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}