"use client"

import { useState, useEffect, useMemo } from 'react';
import { Market, MarketCategory, MarketStatus } from '@/types/market';
import { useAllMarkets } from '@/hooks/use-all-markets';
import { useContractOwner } from '@/hooks/use-contract-owner';
import {
  transformContractMarkets,
  filterAndSortMarkets,
  calculateMarketStats,
  getMarketCountsByTab,
  resetAllFilters,
  FilterOptions,
  SortOptions
} from '@/utils/market';

export const useMarketManagement = () => {
  const { markets: contractMarkets, isLoading: loading, error, refetch } = useAllMarkets();
  const ownerInfo = useContractOwner();
  const [markets, setMarkets] = useState<Market[]>([]);
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'ending' | 'volume' | 'popular'>('newest');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<MarketStatus | 'all'>('all');

  // Transform contract data when it changes
  useEffect(() => {
    if (contractMarkets && contractMarkets.length > 0) {
      const transformedMarkets = transformContractMarkets(contractMarkets);
      setMarkets(transformedMarkets);
    }
  }, [contractMarkets]);

  // Filter and sort markets
  const filteredAndSortedMarkets = useMemo(() => {
    const filters: FilterOptions = {
      searchQuery,
      activeTab,
      selectedCategory,
      selectedStatus
    };

    const sortOptions: SortOptions = {
      sortBy
    };

    return filterAndSortMarkets(markets, filters, sortOptions);
  }, [markets, searchQuery, activeTab, selectedCategory, selectedStatus, sortBy]);

  // Market statistics
  const marketStats = useMemo(() => {
    return calculateMarketStats(markets);
  }, [markets]);

  // Market counts by tab
  const marketCounts = useMemo(() => {
    return getMarketCountsByTab(markets);
  }, [markets]);

  // Reset filters function
  const handleResetFilters = () => {
    const resetValues = resetAllFilters();
    setSearchQuery(resetValues.searchQuery);
    setSelectedCategory(resetValues.selectedCategory);
    setSelectedStatus(resetValues.selectedStatus);
    setActiveTab(resetValues.activeTab);
  };

  return {
    // Data
    markets,
    filteredAndSortedMarkets,
    marketStats,
    marketCounts,
    loading,
    error,
    
    // Owner info
    ownerInfo,
    
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
  };
};