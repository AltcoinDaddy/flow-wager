"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Target,
  Trophy,
  Zap,
  BarChart3,
  Clock,
  Percent,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  duneAnalytics,
  type MarketMetrics,
  type UserAnalytics,
  type TrendingMarket,
  type VolumeOverTime,
  type CategoryInsights,
} from "@/lib/dune-analytics";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsDashboardProps {
  userAddress?: string;
}

const COLORS = ["#9b87f5", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6"];

export function AnalyticsDashboard({ userAddress }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(
    null,
  );
  const [trendingMarkets, setTrendingMarkets] = useState<TrendingMarket[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeOverTime[]>([]);
  const [categoryInsights, setCategoryInsights] = useState<CategoryInsights[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching analytics data...");

      // Test connection first
      const isConnected = await duneAnalytics.testConnection();
      if (!isConnected) {
        console.warn("Dune API connection failed, using mock data");
      }

      // Fetch all analytics data in parallel
      const [
        platformMetrics,
        trending,
        volumeOverTime,
        categoryData,
        userStats,
      ] = await Promise.all([
        duneAnalytics.getMarketMetrics(timeframe),
        duneAnalytics.getTrendingMarkets(10),
        duneAnalytics.getVolumeOverTime(timeframe),
        duneAnalytics.getCategoryInsights(),
        userAddress ? duneAnalytics.getUserAnalytics(userAddress) : null,
      ]);

      console.log("Analytics data fetched successfully:", {
        metrics: platformMetrics,
        trending: trending.length,
        volume: volumeOverTime.length,
        categories: categoryData.length,
        user: !!userStats,
      });

      setMetrics(platformMetrics);
      setTrendingMarkets(trending);
      setVolumeData(volumeOverTime);
      setCategoryInsights(categoryData);
      setUserAnalytics(userStats);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load analytics data",
      );
    } finally {
      setLoading(false);
    }
  }, [timeframe, userAddress]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics();
  };

  if (loading) {
    return <AnalyticsLoadingSkeleton />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C]"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <div className="flex space-x-1">
            {(["7d", "30d", "90d"] as const).map((period) => (
              <Button
                key={period}
                variant={timeframe === period ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(period)}
                className={
                  timeframe === period
                    ? "bg-[#9b87f5] hover:bg-[#8b5cf6]"
                    : "border-gray-700 text-gray-300 hover:bg-[#1A1F2C]"
                }
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-500/10 border-red-500/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="platform" className="space-y-4">
        <TabsList className="bg-[#1A1F2C] border-gray-800">
          <TabsTrigger
            value="platform"
            className="data-[state=active]:bg-[#9b87f5]"
          >
            Platform Metrics
          </TabsTrigger>
          {userAddress && (
            <TabsTrigger
              value="personal"
              className="data-[state=active]:bg-[#9b87f5]"
            >
              Personal Stats
            </TabsTrigger>
          )}
          <TabsTrigger
            value="markets"
            className="data-[state=active]:bg-[#9b87f5]"
          >
            Market Insights
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="data-[state=active]:bg-[#9b87f5]"
          >
            Categories
          </TabsTrigger>
        </TabsList>

        {/* Platform Metrics Tab */}
        <TabsContent value="platform" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Markets"
              value={metrics?.totalMarkets || 0}
              icon={<Target className="h-5 w-5" />}
              trend="+12%"
              trendUp={true}
            />
            <MetricCard
              title="Total Volume"
              value={`${metrics?.totalVolume || 0} FLOW`}
              icon={<DollarSign className="h-5 w-5" />}
              trend="+25%"
              trendUp={true}
            />
            <MetricCard
              title="Active Users"
              value={metrics?.activeUsers || 0}
              icon={<Users className="h-5 w-5" />}
              trend="+8%"
              trendUp={true}
            />
            <MetricCard
              title="Success Rate"
              value={`${Math.round(((metrics?.successfulResolutions || 0) / (metrics?.totalMarkets || 1)) * 100)}%`}
              icon={<Trophy className="h-5 w-5" />}
              trend="+3%"
              trendUp={true}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Volume Over Time */}
            <Card className="bg-[#1A1F2C] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Volume Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="#9b87f5"
                        fill="#9b87f5"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="bg-[#1A1F2C] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Percent className="h-5 w-5 mr-2" />
                  Markets by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics?.marketsByCategory || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ category, count }) => `${category}: ${count}`}
                      >
                        {(metrics?.marketsByCategory || []).map(
                          (entry, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#1A1F2C] border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Avg Market Duration</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(metrics?.averageMarketDuration || 0)}h
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-[#9b87f5]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1F2C] border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Fees</p>
                    <p className="text-2xl font-bold text-white">
                      {metrics?.totalFees || 0} FLOW
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-[#9b87f5]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1F2C] border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Top Category</p>
                    <p className="text-2xl font-bold text-white">
                      {metrics?.topCategory || "Sports"}
                    </p>
                  </div>
                  <Trophy className="h-8 w-8 text-[#9b87f5]" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Personal Stats Tab */}
        {userAddress && (
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Bets"
                value={userAnalytics?.totalBets || 0}
                icon={<Activity className="h-5 w-5" />}
              />
              <MetricCard
                title="Win Rate"
                value={`${Math.round((userAnalytics?.winRate || 0) * 100)}%`}
                icon={<Trophy className="h-5 w-5" />}
                trendUp={(userAnalytics?.winRate || 0) > 0.5}
              />
              <MetricCard
                title="Total Volume"
                value={`${userAnalytics?.totalVolume || 0} FLOW`}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <MetricCard
                title="Profit/Loss"
                value={`${userAnalytics?.profitLoss || 0} FLOW`}
                icon={<TrendingUp className="h-5 w-5" />}
                trendUp={parseFloat(userAnalytics?.profitLoss || "0") > 0}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[#1A1F2C] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">
                    Performance Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Markets Created</span>
                    <span className="text-white font-medium">
                      {userAnalytics?.marketsCreated || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Average Bet Size</span>
                    <span className="text-white font-medium">
                      {userAnalytics?.averageBetSize || 0} FLOW
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Longest Streak</span>
                    <span className="text-white font-medium">
                      {userAnalytics?.longestStreak || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Platform Rank</span>
                    <Badge
                      variant="outline"
                      className="text-[#9b87f5] border-[#9b87f5]"
                    >
                      #{userAnalytics?.rank || "N/A"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1F2C] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">
                    Favorite Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🏆</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {userAnalytics?.favoriteCategory || "Sports"}
                    </h3>
                    <p className="text-gray-400">
                      Your most active betting category
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Market Insights Tab */}
        <TabsContent value="markets" className="space-y-4">
          <Card className="bg-[#1A1F2C] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Trending Markets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trendingMarkets.map((market, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-[#0A0C14] rounded-lg border border-gray-800"
                  >
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-1">
                        {market.question}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Badge
                          variant="secondary"
                          className="bg-gray-700 text-gray-300"
                        >
                          {market.category}
                        </Badge>
                        <span>•</span>
                        <span>{market.participants} participants</span>
                        <span>•</span>
                        <span>
                          {Math.round((market.oddsProbability as number) * 100)}
                          % probability
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {market.volume} FLOW
                      </div>
                      <div className="text-sm text-gray-400">Volume</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryInsights.map((category, index) => (
              <Card key={index} className="bg-[#1A1F2C] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    {category.category}
                    <Badge
                      variant="outline"
                      className="text-[#9b87f5] border-[#9b87f5]"
                    >
                      {category.markets} markets
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Volume</span>
                    <span className="text-white font-medium">
                      {category.volume} FLOW
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Success Rate</span>
                      <span className="text-white font-medium">
                        {Math.round(category.successRate * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(category.successRate as number) * 100}
                      className="h-2 bg-gray-700"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Avg Resolution Time</span>
                    <span className="text-white font-medium">
                      {Math.round(category.avgResolutionTime as number)}h
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

function MetricCard({ title, value, icon, trend, trendUp }: MetricCardProps) {
  return (
    <Card className="bg-[#1A1F2C] border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {trend && (
              <p
                className={`text-xs flex items-center mt-1 ${
                  trendUp ? "text-green-400" : "text-red-400"
                }`}
              >
                <TrendingUp
                  className={`h-3 w-3 mr-1 ${!trendUp ? "rotate-180" : ""}`}
                />
                {trend}
              </p>
            )}
          </div>
          <div className="text-[#9b87f5]">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64 bg-gray-700" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20 bg-gray-700" />
          <Skeleton className="h-8 w-20 bg-gray-700" />
          <Skeleton className="h-8 w-20 bg-gray-700" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 bg-gray-700" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-80 bg-gray-700" />
        <Skeleton className="h-80 bg-gray-700" />
      </div>
    </div>
  );
}
