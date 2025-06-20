"use client";

// src/app/markets/[id]/page.tsx

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { BetDialog } from "@/components/market/bet-dialog";
import { CountdownTimer } from "@/components/market/countdown-timer";
import { MarketCard } from "@/components/market/market-card";
import { 
  TrendingUp, 
  TrendingDown,
  Share2,
  Bookmark,
  Flag,
  ExternalLink,
  Users,
  Volume2,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  BarChart3,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import type { Market } from "@/types/market";

// Mock market data - in real app, this would come from API
const getMockMarket = (id: string): Market => ({
  id: `${Number(id)}`,
  question: "Will Bitcoin reach $100,000 by end of 2025?",
  description: "This market will resolve to YES if Bitcoin (BTC) trades at or above $100,000 on any major cryptocurrency exchange (Coinbase, Binance, Kraken, etc.) before January 1, 2026, 00:00 UTC. The market will resolve to NO if Bitcoin does not reach this price by the deadline. Price data will be verified from multiple sources including CoinGecko and CoinMarketCap.",
  category: "Economics",
  creator: "0x1234567890abcdef",
  creationTime: Date.now() - 86400000,
  endTime: Date.now() + 30 * 86400000,
  resolutionTime: Date.now() + 37 * 86400000,
  status: "Active",
  totalVolume: "45678.90",
  totalShares: "123456",
  yesPrice: "0.73",
  noPrice: "0.27",
  yesShares: "89012",
  noShares: "34444",
  resolved: false,
  imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800",
  tags: ["crypto", "bitcoin", "price-prediction", "2025"],
  metadata: {
    ipfsHash: "QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
    source: "CoinGecko, CoinMarketCap",
    rules: "Market resolves based on highest traded price on major exchanges"
  }
});

// Mock price history data
const priceHistory = [
  { timestamp: Date.now() - 6 * 86400000, yesPrice: 0.65, volume: 12340 },
  { timestamp: Date.now() - 5 * 86400000, yesPrice: 0.67, volume: 15670 },
  { timestamp: Date.now() - 4 * 86400000, yesPrice: 0.72, volume: 18900 },
  { timestamp: Date.now() - 3 * 86400000, yesPrice: 0.69, volume: 16780 },
  { timestamp: Date.now() - 2 * 86400000, yesPrice: 0.71, volume: 14560 },
  { timestamp: Date.now() - 1 * 86400000, yesPrice: 0.73, volume: 19230 },
  { timestamp: Date.now(), yesPrice: 0.73, volume: 21450 },
];

// Mock recent trades
const recentTrades = [
  { id: "1", user: "0xabc...def", side: "yes", amount: "125.50", price: "0.73", timestamp: Date.now() - 300000 },
  { id: "2", user: "0x123...789", side: "no", amount: "89.75", price: "0.27", timestamp: Date.now() - 600000 },
  { id: "3", user: "0x456...012", side: "yes", amount: "234.20", price: "0.72", timestamp: Date.now() - 900000 },
  { id: "4", user: "0x789...345", side: "yes", amount: "67.80", price: "0.73", timestamp: Date.now() - 1200000 },
];

// Mock comments
const comments = [
  {
    id: "1",
    user: "0xabc...def",
    username: "CryptoAnalyst",
    content: "Looking at current market trends and institutional adoption, I think BTC hitting $100k is very likely. Major companies are still accumulating.",
    timestamp: Date.now() - 3600000,
    likes: 12,
    replies: 3
  },
  {
    id: "2", 
    user: "0x123...789",
    username: "BearMarket2024",
    content: "I disagree. The macroeconomic conditions and potential regulations make it unlikely. We might see more volatility but not sustained growth to $100k.",
    timestamp: Date.now() - 7200000,
    likes: 8,
    replies: 1
  }
];

// Mock related markets
const relatedMarkets: Market[] = [
  {
    id: "related-1",
    question: "Will Ethereum reach $5,000 by end of 2025?",
    description: "Market resolves based on ETH price reaching $5,000",
    category: "Economics",
    creator: "0x2345678901bcdef0",
    creationTime: Date.now() - 172800000,
    endTime: Date.now() + 45 * 86400000,
    status: "Active",
    totalPool: Number("23456.78"),
    totalShares: "67890",
    yesPrice: "0.58",
    noPrice: "0.42",
    yesShares: "39321",
    noShares: "28569",
    resolved: false,
    tags: ["crypto", "ethereum", "price-prediction"]
  }
];

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = params.id as string;
  const market = getMockMarket(marketId);
  
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [isBookmarked, setIsBookmarked] = useState(false);

  const yesPercentage = parseFloat(market.optionA) * 100;
  const noPercentage = 100 - yesPercentage;

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const handleBet = (side: "yes" | "no") => {
    setSelectedSide(side);
    setBetDialogOpen(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: market.title,
          text: market.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/markets" className="hover:text-foreground">Markets</Link>
        <span>/</span>
        <Link href={`/markets?category=${market.category}`} className="hover:text-foreground">
          {market.category}
        </Link>
        <span>/</span>
        <span className="text-foreground">{market.title}</span>
      </div>

      {/* Market Header */}
      <div className="space-y-6">
        {/* Market Image */}
        {market.imageUrl && (
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
            <img
              src={market.imageUrl}
              alt={market.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Overlay badges */}
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <Badge variant="secondary" className="bg-white/90 text-black">
                {market.category}
              </Badge>
              <Badge 
                variant={market.status === "Active" ? "default" : "secondary"}
                className="bg-white/90 text-black"
              >
                {market.status}
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className="bg-white/90 text-black hover:bg-white"
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShare}
                className="bg-white/90 text-black hover:bg-white"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/90 text-black hover:bg-white"
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Title and Description */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{market.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {market.description}
          </p>
        </div>

        {/* Market Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>Created by</span>
            <Link 
              href={`/profile/${market.creator}`}
              className="text-foreground hover:text-primary"
            >
              {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
            </Link>
          </div>
          
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(market.createdAt).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <CountdownTimer endTime={market.endTime} />
          </div>
          
          <div className="flex items-center space-x-1">
            <Volume2 className="h-4 w-4" />
            <span>{formatCurrency(market.totalVolume)} FLOW volume</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {market.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Trading & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Prices */}
          <Card>
            <CardHeader>
              <CardTitle>Current Prices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>YES {yesPercentage.toFixed(1)}%</span>
                  <span>NO {noPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={yesPercentage} className="h-3" />
              </div>

              {/* Betting Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  size="lg"
                  onClick={() => handleBet("yes")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">YES</div>
                    <div className="text-sm opacity-90">{(yesPercentage).toFixed(0)}¢</div>
                  </div>
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleBet("no")}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">NO</div>
                    <div className="text-sm opacity-90">{(noPercentage).toFixed(0)}¢</div>
                  </div>
                </Button>
              </div>

              {/* Market Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold">{formatCurrency(market.totalVolume)}</div>
                  <div className="text-xs text-muted-foreground">Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{formatCurrency(market.totalShares)}</div>
                  <div className="text-xs text-muted-foreground">Shares</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {parseInt(market.yesShares) + parseInt(market.noShares)}
                  </div>
                  <div className="text-xs text-muted-foreground">Traders</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Details Tabs */}
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="chart">Chart</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Resolution Criteria</h4>
                    <p className="text-sm text-muted-foreground">
                      {market.metadata?.rules || "Standard resolution criteria apply."}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Data Sources</h4>
                    <p className="text-sm text-muted-foreground">
                      {market.metadata?.source || "Primary data sources will be announced."}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Market Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(market.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trading Ends:</span>
                        <span>{new Date(market.endTime).toLocaleDateString()}</span>
                      </div>
                      {market.resolutionTime && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Resolution:</span>
                          <span>{new Date(market.resolutionTime).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {recentTrades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center space-x-3">
                          <Badge variant={trade.side === "yes" ? "default" : "secondary"}>
                            {trade.side.toUpperCase()}
                          </Badge>
                          <div>
                            <div className="font-medium">{trade.amount} FLOW</div>
                            <div className="text-sm text-muted-foreground">
                              by {trade.user} • {formatRelativeTime(trade.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{(parseFloat(trade.price) * 100).toFixed(0)}¢</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user}`} />
                          <AvatarFallback>
                            {comment.username?.[0] || comment.user.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">
                              {comment.username || `${comment.user.slice(0, 6)}...${comment.user.slice(-4)}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <button className="text-xs text-muted-foreground hover:text-foreground">
                              {comment.likes} likes
                            </button>
                            <button className="text-xs text-muted-foreground hover:text-foreground">
                              {comment.replies} replies
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chart">
              <Card>
                <CardContent className="pt-6">
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Price chart coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Market Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {market.status === "Active" && <TrendingUp className="h-5 w-5 text-green-600" />}
                {market.status === "Closed" && <Clock className="h-5 w-5 text-yellow-600" />}
                {market.status === "Resolved" && <CheckCircle className="h-5 w-5 text-blue-600" />}
                <span>Market Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge 
                  variant={market.status === "Active" ? "default" : "secondary"}
                  className="w-full justify-center py-2"
                >
                  {market.status}
                </Badge>
                {market.status === "Active" && (
                  <div className="text-center">
                    <CountdownTimer endTime={market.endTime} showIcon={false} />
                    <p className="text-xs text-muted-foreground mt-1">until trading ends</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle>Market Creator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${market.creator}`} />
                  <AvatarFallback>
                    {market.creator.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Link 
                    href={`/profile/${market.creator}`}
                    className="font-medium hover:text-primary"
                  >
                    {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
                  </Link>
                  <p className="text-xs text-muted-foreground">Market Creator</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/profile/${market.creator}`}>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Related Markets */}
          {relatedMarkets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Markets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedMarkets.map((relatedMarket) => (
                  <MarketCard 
                    key={relatedMarket.id} 
                    market={relatedMarket} 
                    compact 
                    showCreator={false}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bet Dialog */}
      <BetDialog
        open={betDialogOpen}
        onOpenChange={setBetDialogOpen}
        market={market}
        initialSide={selectedSide}
      />
    </div>
  );
}