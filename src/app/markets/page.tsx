'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, TrendingUp, Clock, DollarSign, Users } from 'lucide-react';
import { MarketCard } from '@/components/market/market-card';
import { MarketFilters } from '@/components/market/market-filters';
// import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Market, MarketCategory, MarketStatus } from '@/types/market';

// Mock data - replace with actual API calls
const mockMarkets: Market[] = [
  {
    id: 1,
    creator: "0x123...abc",
    question: "Will Bitcoin reach $100k by end of 2025?",
    optionA: "Yes, it will reach $100k",
    optionB: "No, it won't reach $100k",
    category: MarketCategory.Other,
    imageURI: "/crypto-btc.jpg",
    endTime: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    creationTime: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 days ago
    outcome: "Unresolved" as any,
    totalOptionAShares: 15000,
    totalOptionBShares: 8500,
    resolved: false,
    status: MarketStatus.Active,
    totalPool: 23500,
    isBreakingNews: true,
    minBet: 1,
    maxBet: 10000
  },
  {
    id: 2,
    creator: "0x456...def",
    question: "Will the Lakers make the playoffs this season?",
    optionA: "Yes, Lakers make playoffs",
    optionB: "No, Lakers miss playoffs",
    category: MarketCategory.Sports,
    imageURI: "/sports-lakers.jpg",
    endTime: Date.now() + (60 * 24 * 60 * 60 * 1000), // 60 days
    creationTime: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 days ago
    outcome: "Unresolved" as any,
    totalOptionAShares: 12000,
    totalOptionBShares: 18000,
    resolved: false,
    status: MarketStatus.Active,
    totalPool: 30000,
    isBreakingNews: false,
    minBet: 1,
    maxBet: 5000
  },
  {
    id: 3,
    creator: "0x789...ghi",
    question: "Will GPT-5 be released before 2026?",
    optionA: "Yes, released before 2026",
    optionB: "No, not released before 2026",
    category: MarketCategory.Technology,
    imageURI: "/tech-ai.jpg",
    endTime: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
    creationTime: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 day ago
    outcome: "Unresolved" as any,
    totalOptionAShares: 8000,
    totalOptionBShares: 7200,
    resolved: false,
    status: MarketStatus.Active,
    totalPool: 15200,
    isBreakingNews: false,
    minBet: 1,
    maxBet: 2000
  },
  {
    id: 4,
    creator: "0xabc...123",
    question: "Will Trump win the 2024 election?",
    optionA: "Yes, Trump wins",
    optionB: "No, Trump loses",
    category: MarketCategory.Politics,
    imageURI: "/politics-election.jpg",
    endTime: Date.now() - (30 * 24 * 60 * 60 * 1000), // Already ended
    creationTime: Date.now() - (120 * 24 * 60 * 60 * 1000), // 4 months ago
    outcome: "OptionA" as any,
    totalOptionAShares: 45000,
    totalOptionBShares: 32000,
    resolved: true,
    status: MarketStatus.Resolved,
    totalPool: 77000,
    isBreakingNews: false,
    minBet: 1,
    maxBet: 50000
  },
  {
    id: 5,
    creator: "0xdef...456",
    question: "Will Ethereum 2.0 staking exceed 50M ETH by Q4 2025?",
    optionA: "Yes, exceeds 50M ETH",
    optionB: "No, stays below 50M ETH",
    category: MarketCategory.Science,
    imageURI: "/crypto-eth.jpg",
    endTime: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days
    creationTime: Date.now() - (7 * 24 * 60 * 60 * 1000), // 1 week ago
    outcome: "Unresolved" as any,
    totalOptionAShares: 22000,
    totalOptionBShares: 19500,
    resolved: false,
    status: MarketStatus.Active,
    totalPool: 41500,
    isBreakingNews: false,
    minBet: 1,
    maxBet: 15000
  },
  {
    id: 6,
    creator: "0xghi...789",
    question: "Will Taylor Swift announce a new album in 2025?",
    optionA: "Yes, new album announced",
    optionB: "No, no new album announced",
    category: MarketCategory.Entertainment,
    imageURI: "/entertainment-taylor.jpg",
    endTime: Date.now() + (200 * 24 * 60 * 60 * 1000), // ~7 months
    creationTime: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago
    outcome: "Unresolved" as any,
    totalOptionAShares: 9500,
    totalOptionBShares: 6800,
    resolved: false,
    status: MarketStatus.Active,
    totalPool: 16300,
    isBreakingNews: false,
    minBet: 1,
    maxBet: 3000
  }
];

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'ending' | 'volume' | 'popular'>('newest');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<MarketStatus | 'all'>('all');

  // Load markets (mock data for now)
  useEffect(() => {
    const loadMarkets = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMarkets(mockMarkets);
      setLoading(false);
    };
    loadMarkets();
  }, []);

  // Filter and sort markets
  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = markets;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(market =>
        market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.optionA.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.optionB.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by tab
    switch (activeTab) {
      case 'active':
        filtered = filtered.filter(market => market.status === MarketStatus.Active);
        break;
      case 'ending':
        filtered = filtered.filter(market => 
          market.status === MarketStatus.Active && 
          market.endTime - Date.now() < (7 * 24 * 60 * 60 * 1000) // Ending within 7 days
        );
        break;
      case 'resolved':
        filtered = filtered.filter(market => market.resolved);
        break;
      case 'trending':
        filtered = filtered.filter(market => market.isBreakingNews || market.totalPool > 20000);
        break;
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(market => market.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(market => market.status === selectedStatus);
    }

    // Sort markets
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.creationTime - a.creationTime;
        case 'ending':
          return a.endTime - b.endTime;
        case 'volume':
          return b.totalPool - a.totalPool;
        case 'popular':
          return (b.totalOptionAShares + b.totalOptionBShares) - (a.totalOptionAShares + a.totalOptionBShares);
        default:
          return 0;
      }
    });

    return sorted;
  }, [markets, searchQuery, activeTab, selectedCategory, selectedStatus, sortBy]);

  // Market statistics
  const marketStats = useMemo(() => {
    const active = markets.filter(m => m.status === MarketStatus.Active).length;
    const totalVolume = markets.reduce((sum, m) => sum + m.totalPool, 0);
    const avgVolume = markets.length > 0 ? totalVolume / markets.length : 0;
    const endingSoon = markets.filter(m => 
      m.status === MarketStatus.Active && 
      m.endTime - Date.now() < (24 * 60 * 60 * 1000)
    ).length;

    return { active, totalVolume, avgVolume, endingSoon };
  }, [markets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* <LoadingSpinner size="lg" /> */}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Prediction Markets
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Trade on the outcomes of future events
            </p>
          </div>
          <Button 
            onClick={() => window.location.href = '/markets/create'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Create Market
          </Button>
        </div>

        {/* Market Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Markets</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{marketStats.active}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Volume</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${marketStats.totalVolume.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Volume</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${Math.round(marketStats.avgVolume).toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ending Soon</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{marketStats.endingSoon}</p>
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
              className="pl-10"
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
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="all">
            All Markets
            <Badge variant="secondary" className="ml-2">
              {markets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <Badge variant="secondary" className="ml-2">
              {markets.filter(m => m.status === MarketStatus.Active).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ending">
            Ending Soon
            <Badge variant="secondary" className="ml-2">
              {markets.filter(m => 
                m.status === MarketStatus.Active && 
                m.endTime - Date.now() < (7 * 24 * 60 * 60 * 1000)
              ).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved
            <Badge variant="secondary" className="ml-2">
              {markets.filter(m => m.resolved).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="trending">
            Trending
            <Badge variant="secondary" className="ml-2">
              {markets.filter(m => m.isBreakingNews || m.totalPool > 20000).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredAndSortedMarkets.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No markets found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your filters or search query
              </p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setActiveTab('all');
              }}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Load More Button */}
      {filteredAndSortedMarkets.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => {
            // Implement pagination or infinite scroll
            console.log('Load more markets');
          }}>
            Load More Markets
          </Button>
        </div>
      )}
    </div>
  );
}