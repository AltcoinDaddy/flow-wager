/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useMemo } from 'react';
import * as fcl from '@onflow/fcl';
import flowConfig from '@/lib/flow/config';
import { Market, MarketCategory, MarketStatus, PlatformStats } from '@/types/market';
import { 
  GET_ALL_MARKETS, 
  GET_PLATFORM_STATS, 
} from '@/lib/flow/scripts';

export function useMarketManagement() {
  // State with proper types
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  // Filter states with proper types - default to 'active' instead of 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('active');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'ending' | 'volume' | 'popular'>('newest');
  const [selectedCategory, setSelectedCategory] = useState<'all' | MarketCategory>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | MarketStatus>('all');

  // Initialize Flow configuration
  const initConfig = async () => {
    try {
      flowConfig();
      
      // Debug: Log configuration status
      console.log('Flow configuration initialized:', {
        accessNode: 'https://rest-mainnet.onflow.org',
        wallet: 'https://fcl-discovery.onflow.org/authn',
        flowWagerContract: process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT,
        userRegistryContract: process.env.NEXT_PUBLIC_USER_REGISTRY_CONTRACT,
        marketFactoryContract: process.env.NEXT_PUBLIC_MARKET_FACTORY_CONTRACT,
        flowToken: '0x1654653399040a61',
        fungibleToken: '0xf233dcee88fe0abe'
      });
    } catch (error) {
      console.error('Failed to initialize Flow configuration:', error);
      throw error;
    }
  };

  // Fetch markets from smart contract
  const fetchMarkets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize Flow configuration before making queries
      await initConfig();

      // Fetch all markets from smart contract
      const contractMarkets = await fcl.query({
        cadence: GET_ALL_MARKETS,
        
      });

      // Transform contract data to Market interface
      const transformedMarkets: Market[] = contractMarkets.map((market: any) => ({
        id: market.id.toString(),
        title: market.title,
        description: market.description,
        category: parseInt(market.category.rawValue),
        optionA: market.optionA,
        optionB: market.optionB,
        creator: market.creator,
        createdAt: market.createdAt.toString(),
        endTime: market.endTime.toString(),
        minBet: market.minBet.toString(),
        maxBet: market.maxBet.toString(),
        status: parseInt(market.status.rawValue),
        outcome: market.outcome ? parseInt(market.outcome.rawValue) : undefined,
        resolved: market.resolved,
        totalOptionAShares: market.totalOptionAShares.toString(),
        totalOptionBShares: market.totalOptionBShares.toString(),
        totalPool: market.totalPool.toString()
      }));

      setMarkets(transformedMarkets);

      // Fetch platform stats from smart contract (FCL already configured above)
      const stats = await fcl.query({
        cadence: GET_PLATFORM_STATS,
        
      });

      setPlatformStats({
        totalMarkets: parseInt(stats.totalMarkets.toString()),
        activeMarkets: parseInt(stats.activeMarkets.toString()),
        totalUsers: parseInt(stats.totalUsers.toString()),
        totalVolume: stats.totalVolume.toString(),
        totalFees: stats.totalFees.toString()
      });

    } catch (err) {
      console.error('Error fetching markets from smart contract:', err);
      
      // Check if it's a configuration error
      if (err instanceof Error && err.message.includes('accessNode.api')) {
        setError('Flow network configuration error. Please check that NEXT_PUBLIC_FLOWWAGER_CONTRACT is set in your environment variables.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch markets from blockchain');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort markets
  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = markets;
    const now = Date.now() / 1000;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(market =>
        market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.optionA.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.optionB.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tab filter - Updated logic
    switch (activeTab) {
      case 'active':
        // Markets that are currently active (not ended and not resolved)
        filtered = filtered.filter(market => 
          market.status === MarketStatus.Active && 
          parseFloat(market.endTime) > now
        );
        break;
      case 'pending':
        // Markets that have ended but not yet resolved
        filtered = filtered.filter(market => 
          market.status === MarketStatus.Active && 
          parseFloat(market.endTime) <= now
        );
        break;
      case 'resolved':
        // Markets that have been resolved
        filtered = filtered.filter(market => market.status === MarketStatus.Resolved);
        break;
      case 'trending':
        // Popular active markets (currently running with volume)
        filtered = filtered.filter(market => 
          market.status === MarketStatus.Active && 
          parseFloat(market.endTime) > now &&
          parseFloat(market.totalPool) > 0
        ).sort((a, b) => parseFloat(b.totalPool) - parseFloat(a.totalPool));
        break;
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(market => market.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(market => market.status === selectedStatus);
    }

    // Sort (skip for trending as it's already sorted by volume)
    if (activeTab !== 'trending') {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return parseFloat(b.createdAt) - parseFloat(a.createdAt);
          case 'ending':
            return parseFloat(a.endTime) - parseFloat(b.endTime);
          case 'volume':
            return parseFloat(b.totalPool) - parseFloat(a.totalPool);
          case 'popular':
            const aShares = parseFloat(a.totalOptionAShares) + parseFloat(a.totalOptionBShares);
            const bShares = parseFloat(b.totalOptionAShares) + parseFloat(b.totalOptionBShares);
            return bShares - aShares;
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [markets, searchQuery, activeTab, selectedCategory, selectedStatus, sortBy]);

  // Calculate market counts - Updated logic
  const marketCounts = useMemo(() => {
    const now = Date.now() / 1000;
    
    return {
      active: markets.filter(m => 
        m.status === MarketStatus.Active && 
        parseFloat(m.endTime) > now
      ).length,
      pending: markets.filter(m => 
        m.status === MarketStatus.Active && 
        parseFloat(m.endTime) <= now
      ).length,
      resolved: markets.filter(m => m.status === MarketStatus.Resolved).length,
      trending: markets.filter(m => 
        m.status === MarketStatus.Active && 
        parseFloat(m.endTime) > now &&
        parseFloat(m.totalPool) > 0
      ).length
    };
  }, [markets]);

  // Calculate market stats
  const marketStats = useMemo(() => {
    const now = Date.now() / 1000;
    const activeMarkets = markets.filter(m => 
      m.status === MarketStatus.Active && 
      parseFloat(m.endTime) > now
    );
    const totalVolume = markets.reduce((sum, m) => sum + parseFloat(m.totalPool || '0'), 0);
    const avgVolume = markets.length > 0 ? totalVolume / markets.length : 0;
    
    const pendingMarkets = markets.filter(m => 
      m.status === MarketStatus.Active && 
      parseFloat(m.endTime) <= now
    ).length;

    return {
      active: activeMarkets.length,
      totalVolume,
      avgVolume,
      endingSoon: pendingMarkets // Now represents pending markets
    };
  }, [markets]);

  // Type-safe filter handlers
  const handleCategoryChange = (category: 'all' | MarketCategory) => {
    setSelectedCategory(category);
  };

  const handleStatusChange = (status: 'all' | MarketStatus) => {
    setSelectedStatus(status);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSortBy('newest');
    setActiveTab('active'); // Default to active instead of all
  };

  // Fetch data on mount and setup interval for real-time updates
  useEffect(() => {
    fetchMarkets();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchMarkets, 50000000);
    
    return () => clearInterval(interval);
  }, []);

  return {
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
    refetch: fetchMarkets,
    handleResetFilters
  };
}