"use client";

import React from 'react';
import { useAllMarkets } from '@/hooks/use-all-markets';
import { MarketCard } from './market-card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, TrendingUp } from 'lucide-react';

interface MarketGridProps {
  showFilters?: boolean;
  limit?: number;
  categoryFilter?: number;
  statusFilter?: number;
}

export const MarketGrid: React.FC<MarketGridProps> = ({ 
  showFilters = true, 
  limit,
  categoryFilter,
  statusFilter 
}) => {
  const { markets, isLoading, error, refetch } = useAllMarkets();

  // Filter markets based on props
  const filteredMarkets = React.useMemo(() => {
    let filtered = markets;

    if (categoryFilter !== undefined) {
      filtered = filtered.filter(market => market.category === categoryFilter);
    }

    if (statusFilter !== undefined) {
      filtered = filtered.filter(market => market.status === statusFilter);
    }

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [markets, categoryFilter, statusFilter, limit]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500 text-sm">Loading markets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="text-gray-400 mb-4">
            <TrendingUp className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load markets</h3>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Button onClick={refetch} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (filteredMarkets.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="text-gray-400 mb-4">
            <TrendingUp className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No markets found</h3>
          <p className="text-gray-500 text-sm mb-6">
            There are no markets matching your criteria at the moment.
          </p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Trade on the outcome of future events
            </p>
          </div>
          <Button 
            onClick={refetch} 
            variant="ghost" 
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}
      
      {/* Polymarket-style grid with proper spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMarkets.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </div>
  );
};