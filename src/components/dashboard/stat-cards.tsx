"use client";

// src/components/dashboard/stats-cards.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Trophy,
  Activity,
  Percent
} from "lucide-react";
import type { UserStats } from "@/types/user";

interface StatsCardsProps {
  stats: UserStats;
  isLoading?: boolean;
}

interface StatCard {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: any;
  description: string;
  badge?: string;
}

export function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (Math.abs(num) >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(num) >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(2);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getChangeType = (change: string): "positive" | "negative" | "neutral" => {
    const num = parseFloat(change);
    if (num > 0) return "positive";
    if (num < 0) return "negative";
    return "neutral";
  };

  const statCards: StatCard[] = [
    {
      title: "Total P&L",
      value: `${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${formatCurrency(stats.totalPnL)} FLOW`,
      change: "+12.5%",
      changeType: getChangeType(stats.totalPnL),
      icon: parseFloat(stats.totalPnL) >= 0 ? TrendingUp : TrendingDown,
      description: "Your total profit/loss across all markets",
      badge: parseFloat(stats.totalPnL) >= 0 ? "Profit" : "Loss"
    },
    {
      title: "Total Volume",
      value: `${formatCurrency(stats.totalVolume)} FLOW`,
      change: "+8.2%",
      changeType: "positive",
      icon: DollarSign,
      description: "Total amount traded across all markets"
    },
    {
      title: "Win Rate",
      value: formatPercentage(stats.winRate),
      change: "+2.1%",
      changeType: stats.winRate >= 50 ? "positive" : "negative",
      icon: Target,
      description: "Percentage of winning positions",
      badge: stats.winRate >= 70 ? "Excellent" : stats.winRate >= 50 ? "Good" : "Needs Work"
    },
    {
      title: "Active Positions",
      value: stats.activePositions.toString(),
      icon: Activity,
      description: "Currently open market positions"
    },
    {
      title: "Total Trades",
      value: stats.totalTrades.toString(),
      change: "+15",
      changeType: "positive",
      icon: BarChart3,
      description: "Total number of completed trades"
    },
    {
      title: "Accuracy",
      value: formatPercentage(stats.accuracy),
      change: "+1.5%",
      changeType: stats.accuracy >= 60 ? "positive" : "negative",
      icon: Percent,
      description: "Prediction accuracy across resolved markets",
      badge: stats.accuracy >= 80 ? "Expert" : stats.accuracy >= 60 ? "Good" : "Learning"
    },
    {
      title: "Rank",
      value: stats.rank ? `#${stats.rank}` : "Unranked",
      change: stats.rank && stats.rank <= 100 ? "Top 100" : undefined,
      changeType: "positive",
      icon: Trophy,
      description: "Your current leaderboard ranking"
    },
    {
      title: "Markets Created",
      value: stats.marketsCreated.toString(),
      icon: Activity,
      description: "Number of markets you've created"
    }
  ];

  // Show top 4 most important stats, or all 8 in a larger grid
  const displayCards = statCards.slice(0, 4);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {displayCards.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${
                stat.changeType === "positive" ? "text-green-600" :
                stat.changeType === "negative" ? "text-red-600" :
                "text-muted-foreground"
              }`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`text-2xl font-bold ${
                  stat.changeType === "positive" ? "text-green-600" :
                  stat.changeType === "negative" ? "text-red-600" :
                  "text-foreground"
                }`}>
                  {stat.value}
                </div>
                {stat.badge && (
                  <Badge 
                    variant={
                      stat.changeType === "positive" ? "default" :
                      stat.changeType === "negative" ? "destructive" :
                      "secondary"
                    }
                    className="text-xs"
                  >
                    {stat.badge}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                {stat.change && (
                  <span className={`text-xs font-medium flex items-center ${
                    stat.changeType === "positive" ? "text-green-600" :
                    stat.changeType === "negative" ? "text-red-600" :
                    "text-muted-foreground"
                  }`}>
                    {stat.changeType === "positive" && <TrendingUp className="h-3 w-3 mr-1" />}
                    {stat.changeType === "negative" && <TrendingDown className="h-3 w-3 mr-1" />}
                    {stat.change}
                  </span>
                )}
              </div>
            </CardContent>

            {/* Background decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 ${
              stat.changeType === "positive" ? "text-green-600" :
              stat.changeType === "negative" ? "text-red-600" :
              "text-muted-foreground"
            }`}>
              <Icon className="w-full h-full" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Extended stats view with all metrics
export function ExtendedStatsCards({ stats, isLoading = false }: StatsCardsProps) {
  const statCards: StatCard[] = [
    {
      title: "Total P&L",
      value: `${parseFloat(stats.totalPnL) >= 0 ? '+' : ''}${stats.totalPnL} FLOW`,
      changeType: parseFloat(stats.totalPnL) >= 0 ? "positive" : "negative",
      icon: parseFloat(stats.totalPnL) >= 0 ? TrendingUp : TrendingDown,
      description: "Your total profit/loss across all markets"
    },
    {
      title: "Total Volume",
      value: `${stats.totalVolume} FLOW`,
      icon: DollarSign,
      description: "Total amount traded"
    },
    {
      title: "Win Rate",
      value: `${stats.winRate.toFixed(1)}%`,
      changeType: stats.winRate >= 50 ? "positive" : "negative",
      icon: Target,
      description: "Percentage of winning positions"
    },
    {
      title: "Active Positions",
      value: stats.activePositions.toString(),
      icon: Activity,
      description: "Currently open positions"
    },
    {
      title: "Total Trades",
      value: stats.totalTrades.toString(),
      icon: BarChart3,
      description: "Completed trades"
    },
    {
      title: "Accuracy",
      value: `${stats.accuracy.toFixed(1)}%`,
      changeType: stats.accuracy >= 60 ? "positive" : "negative",
      icon: Percent,
      description: "Prediction accuracy"
    },
    {
      title: "Rank",
      value: stats.rank ? `#${stats.rank}` : "Unranked",
      icon: Trophy,
      description: "Leaderboard ranking"
    },
    {
      title: "Markets Created",
      value: stats.marketsCreated.toString(),
      icon: Activity,
      description: "Markets you've created"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${
                stat.changeType === "positive" ? "text-green-600" :
                stat.changeType === "negative" ? "text-red-600" :
                "text-muted-foreground"
              }`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                stat.changeType === "positive" ? "text-green-600" :
                stat.changeType === "negative" ? "text-red-600" :
                "text-foreground"
              }`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}