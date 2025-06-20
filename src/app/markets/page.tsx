"use client";

import React from 'react';
import { Search, Filter, TrendingUp, Clock, DollarSign, Users, Plus } from 'lucide-react';
import { MarketCard } from '@/components/market/market-card';
import { MarketFilters } from '@/components/market/market-filters';
import { MarketLoading } from '@/components/market/market-loading';
import { MarketError } from '@/components/market/market-error';
import { OwnerOnly } from '@/components/auth/owner-only';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useMarketManagement } from '@/hooks/use-market-management';
import Link from 'next/link';

export default function MarketsPage() {
  const {
    // Data
    markets,
    filteredAndSortedMarkets,
    marketStats,
    marketCounts,
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
    setSelectedCategory,
    setSelectedStatus,
    
    // Actions
    refetch,
    handleResetFilters
  } = useMarketManagement();

  // Loading state
  if (loading) {
    return <MarketLoading />;
  }

  // Error state
  if (error) {
    return <MarketError error={error} onRetry={refetch} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Prediction Markets
            </h1>
            <p className="text-gray-600">
              Trade on the outcomes of real-world events
            </p>
          </div>
          
          {/* Contract Owner Only Create Market Button */}
          <OwnerOnly
            fallback={
              <div className="text-center">
                <Button disabled variant="outline" className="text-gray-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Owner Only
                </Button>
                <p className="text-xs text-gray-400 mt-1">
                  Only contract owner can create markets
                </p>
              </div>
            }
          >
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/markets/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Market
              </Link>
            </Button>
          </OwnerOnly>
        </div>

        {/* Market Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Active Markets</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{marketStats.active}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Total Volume</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {marketStats.totalVolume.toFixed(0)} FLOW
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">Avg Volume</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(marketStats.avgVolume)} FLOW
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">Ending Soon</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{marketStats.endingSoon}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'ending' | 'volume' | 'popular')}
              className="px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="ending">Ending Soon</option>
              <option value="volume">Highest Volume</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <MarketFilters
            selectedCategory={selectedCategory}
            selectedStatus={selectedStatus}
            onCategoryChange={setSelectedCategory}
            onStatusChange={setSelectedStatus}
            onReset={() => {
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
          />
        )}
      </div>

      {/* Market Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-gray-50">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">
            All Markets
            <Badge variant="secondary" className="ml-2 bg-gray-200 text-gray-700">
              {marketCounts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-white">
            Active
            <Badge variant="secondary" className="ml-2 bg-gray-200 text-gray-700">
              {marketCounts.active}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ending" className="data-[state=active]:bg-white">
            Ending Soon
            <Badge variant="secondary" className="ml-2 bg-gray-200 text-gray-700">
              {marketCounts.ending}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-white">
            Resolved
            <Badge variant="secondary" className="ml-2 bg-gray-200 text-gray-700">
              {marketCounts.resolved}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="trending" className="data-[state=active]:bg-white">
            Trending
            <Badge variant="secondary" className="ml-2 bg-gray-200 text-gray-700">
              {marketCounts.trending}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredAndSortedMarkets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No markets found
              </h3>
              <p className="text-gray-600 mb-4">
                {markets.length === 0 
                  ? "No markets have been created yet."
                  : "Try adjusting your filters or search query"
                }
              </p>
              {markets.length === 0 && (
                <OwnerOnly showFallback={false}>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/markets/create">Create First Market</Link>
                  </Button>
                </OwnerOnly>
              )}
              {markets.length > 0 && (
                <Button onClick={handleResetFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Refresh Button */}
      {filteredAndSortedMarkets.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={refetch}>
            Refresh Markets
          </Button>
        </div>
      )}
    </div>
  );
}