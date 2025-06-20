"use client";

// src/app/dashboard/page.tsx

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatsCards, ExtendedStatsCards } from "@/components/dashboard/stat-cards";
import { PositionsTable } from "@/components/dashboard/positions-table";
import { MarketCard } from "@/components/market/market-card";
// import { LoadingSpinner } from "@/components/shared/loading-spinner";
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
  RefreshCw
} from "lucide-react";
import type { UserStats } from "@/types/user";
import type { Market, MarketCategory, MarketOutcome, MarketStatus } from "@/types/market";

// Mock user stats
const mockUserStats: UserStats = {
  totalVolume: "45,678.90",
  totalPnL: "12,847.23",
  totalTrades: 234,
  winRate: 73.5,
  activePositions: 8,
  marketsCreated: 3,
  marketsResolved: 15,
  accuracy: 78.9,
  rank: 42,
  reputation: 95.7
};

// Mock recent activity
const recentActivity = [
  {
    id: "1",
    type: "BuyShares",
    marketTitle: "Will Bitcoin reach $100,000 by end of 2025?",
    amount: "125.50",
    side: "optionA" as const,
    timestamp: Date.now() - 3600000,
    txHash: "0x1234567890abcdef"
  },
  {
    id: "2", 
    type: "ClaimWinnings",
    marketTitle: "Next US Presidential Election Winner",
    amount: "89.75",
    timestamp: Date.now() - 7200000,
    txHash: "0x2345678901bcdef0"
  },
  {
    id: "3",
    type: "CreateMarket",
    marketTitle: "Will ChatGPT-5 be released in 2025?",
    timestamp: Date.now() - 86400000,
    txHash: "0x3456789012cdef01"
  }
];

// Mock watchlist markets
const watchlistMarkets: Market[] = [
  {
    id: 4,
    creator: "0x1234567890abcdef",
    question: "Will Tesla stock reach $300 by Q2 2025?",
    optionA: "Yes",
    optionB: "No",
    category: "Economics" as MarketCategory,
    imageURI: "",
    endTime: Date.now() + 60 * 86400000,
    creationTime: Date.now() - 86400000,
    outcome: "Unresolved" as MarketOutcome,
    totalOptionAShares: 42000,
    totalOptionBShares: 58000,
    resolved: false,
    status: "Active" as MarketStatus,
    totalPool: 23456.78,
    isBreakingNews: false,
    minBet: 1,
    maxBet: 500
  }
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "BuyShares":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "SellShares":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "ClaimWinnings":
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case "CreateMarket":
        return <Plus className="h-4 w-4 text-purple-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "BuyShares":
        return "text-green-600";
      case "SellShares":
        return "text-red-600";
      case "ClaimWinnings":
        return "text-blue-600";
      case "CreateMarket":
        return "text-purple-600";
      default:
        return "text-muted-foreground";
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your trading performance and portfolio
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Alerts
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <StatsCards stats={mockUserStats} isLoading={isLoading} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Extended Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <ExtendedStatsCards stats={mockUserStats} isLoading={isLoading} />
            </CardContent>
          </Card>

          {/* Quick Actions & Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" asChild>
                  <Link href="/markets">
                    <Target className="h-4 w-4 mr-2" />
                    Browse Markets
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Market
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/leaderboard">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Leaderboard
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/positions">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Positions
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/activity">
                      View All
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
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
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm font-medium">{activity.amount} FLOW</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Positions Preview */}
          <PositionsTable compact />
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <PositionsTable />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Trading Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <p className="font-medium">{activity.marketTitle}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
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
                    
                    <div className="text-right">
                      {activity.amount && (
                        <p className="font-medium">{activity.amount} FLOW</p>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`https://flowscan.org/transaction/${activity.txHash}`} target="_blank">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Watchlist Tab */}
        <TabsContent value="watchlist">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Market Watchlist</h3>
                <p className="text-muted-foreground">Markets you're following</p>
              </div>
              <Button asChild>
                <Link href="/markets">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Markets
                </Link>
              </Button>
            </div>

            {watchlistMarkets.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {watchlistMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No markets in watchlist</h3>
                  <p className="text-muted-foreground mb-4">
                    Add markets to your watchlist to track them here
                  </p>
                  <Button asChild>
                    <Link href="/markets">Browse Markets</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}