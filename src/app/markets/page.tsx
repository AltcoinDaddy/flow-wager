// src/app/markets/page.tsx
"use client";

import { OwnerOnly } from "@/components/auth/owner-only";
import { MarketCard } from "@/components/market/market-card";
import { MarketError } from "@/components/market/market-error";
import { MarketFilters } from "@/components/market/market-filters";
import { MarketLoading } from "@/components/market/market-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketManagement } from "@/hooks/use-market-management";
import {
  Clock,
  DollarSign,
  Filter,
  Plus,
  Search,
  Timer,
  TrendingUp,
  Users
} from "lucide-react";
import Link from "next/link";

export default function MarketsPage() {
  
  const {
    // Data
    markets,
    filteredAndSortedMarkets,
    marketStats,
    marketCounts,
    platformStats,
    loading,
    error,

    // Filter states
    searchQuery,
    activeTab,
    showFilters,
    sortBy,
    selectedCategory,
    selectedStatus,

    // Filter setters
    setSearchQuery,
    setActiveTab,
    setShowFilters,
    setSortBy,
    handleCategoryChange,
    handleStatusChange,

    // Actions
    handleResetFilters,
  } = useMarketManagement();

  // Loading state
  if (loading) {
    return <MarketLoading />;
  }

  // Error state
  if (error) {
    return <MarketError error={error} onRetry={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0C14]">
      {/* Add bottom padding to account for fixed nav on mobile */}
      <div className="container mx-auto px-4 py-8 pb-4 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent mb-2">
                Prediction Markets
              </h1>
              <p className="text-gray-400 text-lg">
                Trade on the outcomes of real-world events with FLOW tokens
              </p>
            </div>

            {/* Contract Owner Only Create Market Button */}
            <Button
              asChild
              className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white shadow-lg border-0"
            >
              <Link href="/dashboard/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Market
              </Link>
            </Button>
          </div>

          {/* Platform Statistics from Smart Contract */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] rounded-xl p-6 border border-gray-800/50 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#9b87f5]/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-[#9b87f5]" />
                </div>
                <span className="text-sm font-medium text-gray-400">
                  Active Markets
                </span>
              </div>
              <p className="text-3xl font-bold text-white">
                {platformStats?.activeMarkets || marketStats.active}
              </p>
              <p className="text-xs text-gray-500 mt-1">Currently running</p>
            </div>

            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] rounded-xl p-6 border border-gray-800/50 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#9b87f5]/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-[#9b87f5]" />
                </div>
                <span className="text-sm font-medium text-gray-400">
                  Total Volume
                </span>
              </div>
              <p className="text-3xl font-bold text-white">
                {platformStats
                  ? `${parseFloat(platformStats.totalVolume).toFixed(0)} FLOW`
                  : `${marketStats.totalVolume.toFixed(0)} FLOW`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                All-time trading volume
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] rounded-xl p-6 border border-gray-800/50 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#9b87f5]/20 rounded-lg">
                  <Users className="h-5 w-5 text-[#9b87f5]" />
                </div>
                <span className="text-sm font-medium text-gray-400">
                  Total Users
                </span>
              </div>
              <p className="text-3xl font-bold text-white">
                {platformStats?.totalUsers || "0"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Registered traders</p>
            </div>

            <div className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] rounded-xl p-6 border border-gray-800/50 shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#9b87f5]/20 rounded-lg">
                  <Timer className="h-5 w-5 text-[#9b87f5]" />
                </div>
                <span className="text-sm font-medium text-gray-400">
                  Pending Resolution
                </span>
              </div>
              <p className="text-3xl font-bold text-white">
                {marketStats.endingSoon}
              </p>
              <p className="text-xs text-gray-500 mt-1">Awaiting resolution</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search markets by title, description, or options..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-[#1A1F2C] border-gray-700 text-white placeholder-gray-400 focus:border-[#9b87f5] focus:ring-[#9b87f5]/20 rounded-sm"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center h-12 gap-2 px-6 rounded-sm font-medium transition-all ${
                  showFilters
                    ? "bg-[#9b87f5] text-white hover:bg-[#8b5cf6] shadow-lg"
                    : "border-0 text-white hover:bg-[#1A1F2C] bg-[#1A1F2C] hover:text-white"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Select
                value={sortBy}
                onValueChange={(value) =>
                  setSortBy(
                    value as "newest" | "ending" | "volume" | "popular"
                  )
                }
              >
                <SelectTrigger className="px-4 !h-[49px] border border-gray-700 rounded-sm bg-[#1A1F2C] text-white text-sm focus:outline-none focus:border-[#9b87f5] focus:ring-[#9b87f5]/20">
                  Newest First
                </SelectTrigger>
                <SelectContent className="bg-[#1A1F2C] border border-gray-700 text-white rounded-md shadow-lg">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="ending">Ending Soon</SelectItem>
                  <SelectItem value="volume">Highest Volume</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Enhanced Filters Panel */}
          {showFilters && (
            <div className="mb-6">
              <MarketFilters
                selectedCategory={selectedCategory}
                selectedStatus={selectedStatus}
                onCategoryChange={handleCategoryChange}
                onStatusChange={handleStatusChange}
                onReset={() => {
                  handleCategoryChange("all");
                  handleStatusChange("all");
                }}
              />
            </div>
          )}
        </div>

        {/* Desktop Market Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          {/* Desktop Tabs - Hidden on mobile */}
          <TabsList className="relative hidden md:flex w-full bg-[#1A1F2C] border border-gray-800/50 rounded-xl p-1 h-auto overflow-x-auto">
            {[
              { value: "active", label: "Active", count: marketCounts.active, icon: TrendingUp },
              { value: "pending", label: "Pending", count: marketCounts.pending, icon: Timer },
              { value: "resolved", label: "Resolved", count: marketCounts.resolved, icon: Clock },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white text-gray-400 hover:text-white transition-all duration-200 rounded-lg py-3 px-4 font-medium whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <Badge
                    variant="secondary"
                    className="bg-gray-700/50 text-gray-300 border-0 text-xs px-2 py-0.5"
                  >
                    {tab.count}
                  </Badge>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-8 mb-20 md:mb-8">
            {filteredAndSortedMarkets.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-[#1A1F2C] to-[#151923] rounded-2xl border border-gray-800/50">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-6">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  No markets found
                </h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto max-sm:text-sm">
                  {markets.length === 0
                    ? "No markets have been created yet"
                    : activeTab === "active"
                    ? "No active markets at the moment. Check back soon for new opportunities!"
                    : activeTab === "pending"
                    ? "No markets are awaiting resolution. All markets are either active or resolved."
                    : activeTab === "resolved"
                    ? "No resolved markets yet. Results will appear here once markets are settled."
                    : "No trending markets found. Markets with trading activity will appear here."}
                </p>
                {markets.length === 0 && (
                  <OwnerOnly showFallback={false}>
                    <Button
                      asChild
                      className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white shadow-lg"
                    >
                      <Link href="/admin/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Market
                      </Link>
                    </Button>
                  </OwnerOnly>
                )}
                {markets.length > 0 && (
                  <Button
                    onClick={handleResetFilters}
                    variant="outline"
                    className="!bg-[#9b87f5] text-white hover:text-white hover:bg-[#9b87f5] border-0"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Status Section */}
        {filteredAndSortedMarkets.length > 0 && (
          <div className="text-center mt-12 pt-8 border-t border-gray-800/50">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span>
                  Showing {filteredAndSortedMarkets.length} of {markets.length}{" "}
                  markets
                </span>
                <span className="text-gray-500">•</span>
                <span>
                  {activeTab === "active" && "Currently active markets"}
                  {activeTab === "pending" && "Markets awaiting resolution"}
                  {activeTab === "resolved" && "Settled markets with results"}
                  {activeTab === "trending" && "Popular markets by volume"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation - Market Tabs (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gradient-to-t from-[#0A0C14] via-[#1A1F2C] to-[#1A1F2C]/90 border-t border-gray-800/50 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-16 gap-2">
            {[
              { value: "active", label: "Active", count: marketCounts.active, icon: TrendingUp },
              { value: "pending", label: "Pending", count: marketCounts.pending, icon: Timer },
              { value: "resolved", label: "Resolved", count: marketCounts.resolved, icon: Clock },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors group ${
                  activeTab === tab.value 
                    ? 'text-[#9b87f5]' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className="relative">
                  <tab.icon className={`h-5 w-5 transition-all duration-200 ${
                    activeTab === tab.value ? 'scale-110' : 'group-hover:scale-105'
                  }`} />
                  {/* Active indicator dot */}
                  {activeTab === tab.value && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#9b87f5] rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">{tab.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.value 
                      ? 'bg-[#9b87f5]/20 text-[#9b87f5]' 
                      : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}