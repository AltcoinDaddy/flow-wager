"use client"


import { useState, useEffect, useCallback } from 'react';
import { getAllMarkets, Market } from '@/lib/flow/market';

export const useAllMarkets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allMarkets = await getAllMarkets();
      setMarkets(allMarkets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch markets");
      setMarkets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return {
    markets,
    isLoading,
    error,
    refetch: fetchMarkets
  };
};