"use client";

// src/app/admin/page.tsx

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsPanel } from "@/components/admin/create/create-market-form";
import {
  Plus,
  Settings,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import type { Market, MarketStatus } from "@/types/market";

// Mock admin stats
const adminStats = {
  totalMarkets: 156,
  activeMarkets: 89,
  pendingResolution: 12,
  totalVolume: 2847293.45,
  totalUsers: 12437,
  avgMarketVolume: 18251.24,
  topCategory: "Economics",
  resolutionAccuracy: 96.8,
  revenueThisMonth: 45678.9,
};

// Mock recent markets for admin review
const recentMarkets: Market[] = [
  {
    id: 1,
    creator: "0x1234567890abcdef",
    question: "Will Bitcoin reach $100,000 by end of 2025?",
    optionA: "Yes",
    optionB: "No",
    category: "Economics",
    imageURI:
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400",
    endTime: Date.now() + 30 * 86400000,
    creationTime: Date.now() - 86400000,
    outcome: "Unresolved",
    totalOptionAShares: 73000,
    totalOptionBShares: 27000,
    resolved: false,
    status: "Active",
    totalPool: 45678.9,
    isBreakingNews: false,
    minBet: 1,
    maxBet: 1000,
  },
  {
    id: 2,
    creator: "0xabcdef1234567890",
    question: "Will the next US Presidential Election be held in 2028?",
    optionA: "Yes, in 2028",
    optionB: "No, different year",
    category: "Politics",
    imageURI:
      "https://images.unsplash.com/photo-1586074299757-14d6ba8c7f98?w=400",
    endTime: Date.now() - 86400000, // Ended yesterday
    creationTime: Date.now() - 172800000,
    outcome: "Unresolved",
    totalOptionAShares: 89000,
    totalOptionBShares: 11000,
    resolved: false,
    status: "Closed", // Needs resolution
    totalPool: 23456.78,
    isBreakingNews: true,
    minBet: 5,
    maxBet: 500,
  },
];

// Mock pending actions
const pendingActions = [
  {
    id: 1,
    type: "resolution",
    marketId: 2,
    marketTitle: "Will the next US Presidential Election be held in 2028?",
    urgency: "high",
    timeRemaining: "2 days overdue",
  },
  {
    id: 2,
    type: "review",
    marketId: 5,
    marketTitle: "Will ChatGPT-5 be released in 2025?",
    urgency: "medium",
    timeRemaining: "3 hours",
  },
  {
    id: 3,
    type: "dispute",
    marketId: 8,
    marketTitle: "Will Tesla stock reach $300 by Q2 2025?",
    urgency: "low",
    timeRemaining: "1 day",
  },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusColor = (status?: MarketStatus | string) => {
    switch (status) {
      case "Active":
        return "text-green-600";
      case "Closed":
        return "text-yellow-600";
      case "Resolved":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage markets, users, and platform operations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/admin/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Market
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Markets</p>
                <p className="text-2xl font-bold">{adminStats.totalMarkets}</p>
                <p className="text-xs text-green-600">+12 this week</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Markets</p>
                <p className="text-2xl font-bold">{adminStats.activeMarkets}</p>
                <p className="text-xs text-green-600">57% of total</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending Resolution
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {adminStats.pendingResolution}
                </p>
                <p className="text-xs text-yellow-600">Needs attention</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(adminStats.totalVolume)} FLOW
                </p>
                <p className="text-xs text-green-600">+15.3% vs last month</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">
                  {adminStats.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">+234 new this week</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="pending">Pending Actions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  className="h-10 flex items-center"
                  variant="outline"
                  asChild
                >
                  <Link href="/admin/create">
                    <Plus className="h-6 w-6" />
                    <span>Create Market</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-10 flex items-center"
                  asChild
                >
                  <Link href="/admin/resolve">
                    <CheckCircle className="h-6 w-6" />
                    <span>Resolve Markets</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-10 flex items-center"
                  asChild
                >
                  <Link href="/admin/users">
                    <Users className="h-6 w-6" />
                    <span>Manage Users</span>
                  </Link>
                </Button>
                <Button className="h-10 flex items-center" asChild>
                  <Link href="/admin/settings">
                    <Settings className="h-6 w-6" />
                    <span>Settings</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Markets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Markets</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/markets">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMarkets.map((market) => (
                  <div
                    key={market.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant="outline"
                          className={getStatusColor(market.status as MarketStatus | string)}
                        >
                          {market.status}
                        </Badge>
                        {market.isBreakingNews && (
                          <Badge variant="destructive">Breaking News</Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {market.category}
                        </span>
                      </div>
                      <h4 className="font-medium mt-1 line-clamp-1">
                        {market.question}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span>
                          Volume: {formatCurrency(market.totalPool)} FLOW
                        </span>
                        <span>
                          Shares:{" "}
                          {market.totalOptionAShares +
                            market.totalOptionBShares}
                        </span>
                        <span>
                          {market.status === "Active"
                            ? `Ends ${new Date(
                                market.endTime
                              ).toLocaleDateString()}`
                            : `Ended ${new Date(
                                market.endTime
                              ).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/markets/${market.id}`}>View</Link>
                      </Button>
                      {market.status === "Closed" && (
                        <Button size="sm" asChild>
                          <Link href={`/admin/resolve?id=${market.id}`}>
                            Resolve
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Markets Tab */}
        <TabsContent value="markets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Market Management</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/admin/create" className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Market
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMarkets.map((market) => (
                  <div key={market.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge
                            variant="outline"
                            className={getStatusColor(market.status)}
                          >
                            {market.status}
                          </Badge>
                          <Badge variant="secondary">{market.category}</Badge>
                          {market.isBreakingNews && (
                            <Badge variant="destructive">Breaking News</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            ID: {market.id}
                          </span>
                        </div>

                        <h4 className="font-semibold mb-2">
                          {market.question}
                        </h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Creator:
                            </span>
                            <div className="font-mono">
                              {market.creator.slice(0, 10)}...
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Volume:
                            </span>
                            <div className="font-medium">
                              {formatCurrency(market.totalPool)} FLOW
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Total Shares:
                            </span>
                            <div className="font-medium">
                              {market.totalOptionAShares +
                                market.totalOptionBShares}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              {market.status === "Active" ? "Ends:" : "Ended:"}
                            </span>
                            <div className="font-medium">
                              {new Date(market.endTime).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>
                              {market.optionA}:{" "}
                              {(
                                (market.totalOptionAShares /
                                  (market.totalOptionAShares +
                                    market.totalOptionBShares)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                            <span>
                              {market.optionB}:{" "}
                              {(
                                (market.totalOptionBShares /
                                  (market.totalOptionAShares +
                                    market.totalOptionBShares)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  (market.totalOptionAShares /
                                    (market.totalOptionAShares +
                                      market.totalOptionBShares)) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/markets/${market.id}`}>View</Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        {market.status === "Closed" && (
                          <Button size="sm" asChild>
                            <Link href={`/admin/resolve?id=${market.id}`}>
                              Resolve
                            </Link>
                          </Button>
                        )}
                        {market.status === "Active" && (
                          <Button variant="destructive" size="sm">
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Actions Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span>Pending Actions ({pendingActions.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingActions.map((action) => (
                  <div
                    key={action.id}
                    className={`p-4 border rounded-lg ${getUrgencyColor(
                      action.urgency
                    )}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {action.type}
                          </Badge>
                          <Badge
                            variant={
                              action.urgency === "high"
                                ? "destructive"
                                : action.urgency === "medium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {action.urgency} priority
                          </Badge>
                          <span className="text-sm font-medium">
                            {action.timeRemaining}
                          </span>
                        </div>
                        <h4 className="font-medium">{action.marketTitle}</h4>
                        <p className="text-sm text-muted-foreground">
                          Market ID: {action.marketId}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/markets/${action.marketId}`}>
                            View Market
                          </Link>
                        </Button>
                        {action.type === "resolution" && (
                          <Button size="sm" asChild>
                            <Link href={`/admin/resolve?id=${action.marketId}`}>
                              Resolve
                            </Link>
                          </Button>
                        )}
                        {action.type === "review" && (
                          <Button size="sm">Review</Button>
                        )}
                        {action.type === "dispute" && (
                          <Button size="sm">Handle Dispute</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AnalyticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
