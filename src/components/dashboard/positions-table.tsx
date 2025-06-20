"use client";

// src/components/dashboard/positions-table.tsx

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown,
  Search,
  ArrowUpDown,
  ExternalLink,
  DollarSign,
  Calendar,
  Target,
  MoreHorizontal
} from "lucide-react";
import { CountdownTimer } from "@/components/market/countdown-timer";
import type { Position } from "@/types/market";

// Mock positions data
const mockPositions: Position[] = [
  {
    id: "pos-1",
    marketId: 1,
    user: "0x1234567890abcdef",
    side: "optionA",
    shares: 123.45,
    averagePrice: 0.67,
    totalCost: 82.71,
    currentValue: 95.23,
    pnl: 12.52,
    createdAt: Date.now() - 86400000
  },
  {
    id: "pos-2", 
    marketId: 2,
    user: "0x1234567890abcdef",
    side: "optionB",
    shares: 67.89,
    averagePrice: 0.23,
    totalCost: 15.61,
    currentValue: 18.87,
    pnl: 3.26,
    createdAt: Date.now() - 172800000
  },
  {
    id: "pos-3",
    marketId: 3, 
    user: "0x1234567890abcdef",
    side: "optionA",
    shares: 45.67,
    averagePrice: 0.89,
    totalCost: 40.65,
    currentValue: 32.19,
    pnl: -8.46,
    createdAt: Date.now() - 259200000
  }
];

// Mock market data for position details
const mockMarkets = {
  1: {
    question: "Will Bitcoin reach $100,000 by end of 2025?",
    category: "Economics",
    endTime: Date.now() + 30 * 86400000,
    status: "Active",
    optionA: "Yes",
    optionB: "No"
  },
  2: {
    question: "Will the next US Presidential Election be held in 2028?", 
    category: "Politics",
    endTime: Date.now() + 60 * 86400000,
    status: "Active",
    optionA: "Yes, in 2028",
    optionB: "No, different year"
  },
  3: {
    question: "Will ChatGPT-5 be released by OpenAI in 2025?",
    category: "Technology", 
    endTime: Date.now() + 90 * 86400000,
    status: "Active",
    optionA: "Yes",
    optionB: "No"
  }
};

interface PositionsTableProps {
  positions?: Position[];
  isLoading?: boolean;
  compact?: boolean;
}

export function PositionsTable({ 
  positions = mockPositions, 
  isLoading = false,
  compact = false 
}: PositionsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"pnl" | "value" | "created" | "market">("pnl");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterSide, setFilterSide] = useState<"all" | "optionA" | "optionB">("all");

  // Filter and sort positions
  const filteredPositions = positions
    .filter(position => {
      const market = mockMarkets[position.marketId as keyof typeof mockMarkets];
      const matchesSearch = !searchQuery || 
        market?.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market?.category.toLowerCase().includes(searchQuery.toLowerCase());
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
          const marketA = mockMarkets[a.marketId as keyof typeof mockMarkets];
          const marketB = mockMarkets[b.marketId as keyof typeof mockMarkets];
          return sortOrder === "desc" 
            ? marketB?.question.localeCompare(marketA?.question || "") || 0
            : marketA?.question.localeCompare(marketB?.question || "") || 0;
        default:
          return 0;
      }

      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)} FLOW`;
  };

  const formatShares = (shares: number) => {
    return shares.toFixed(2);
  };

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return "text-green-600";
    if (pnl < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const getPnlIcon = (pnl: number) => {
    if (pnl > 0) return <TrendingUp className="h-4 w-4" />;
    if (pnl < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Positions ({filteredPositions.length})</CardTitle>
          {!compact && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/positions">
                View All
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        {!compact && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filterSide} onValueChange={(value: any) => setFilterSide(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sides</SelectItem>
                <SelectItem value="optionA">Option A</SelectItem>
                <SelectItem value="optionB">Option B</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {filteredPositions.length === 0 ? (
          <div className="text-center py-8">
            <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No positions found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search criteria" : "Start trading to see your positions here"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredPositions.slice(0, compact ? 3 : undefined).map((position) => {
              const market = mockMarkets[position.marketId as keyof typeof mockMarkets];
              const optionName = position.side === "optionA" ? market?.optionA : market?.optionB;
              
              return (
                <div key={position.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Market Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-3">
                        <Badge 
                          variant={position.side === "optionA" ? "default" : "secondary"}
                          className={`${
                            position.side === "optionA" 
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          {optionName || position.side.toUpperCase()}
                        </Badge>
                        
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/markets/${position.marketId}`}
                            className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {market?.question || "Unknown Market"}
                          </Link>
                          
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            <span>{market?.category}</span>
                            <span>•</span>
                            <span>{formatShares(position.shares)} shares</span>
                            <span>•</span>
                            <span>Avg: {(position.averagePrice * 100).toFixed(0)}¢</span>
                          </div>
                        </div>
                      </div>

                      {/* Market Status */}
                      {market?.endTime && (
                        <div className="mt-2 flex items-center space-x-2 text-xs">
                          <Calendar className="h-3 w-3" />
                          <CountdownTimer endTime={market.endTime} compact />
                        </div>
                      )}
                    </div>

                    {/* Position Values */}
                    <div className="text-right ml-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">Value:</span>
                          <span className="font-medium">{formatCurrency(position.currentValue)}</span>
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
                        <Button variant="ghost" size="sm" className="h-6 px-2">
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
    </Card>
  );
}