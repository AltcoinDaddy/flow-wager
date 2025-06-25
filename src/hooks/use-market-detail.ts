/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { Market } from '@/lib/flow/market';
import { getMarket } from '@/lib/flow/market';
import { getMarketTrades, getUserPosition, getMarketComments, getMarketPriceHistory } from '@/lib/flow/trading-queries';

export interface Trade {
  id: string;
  marketId: number;
  user: string;
  option: number;
  amount: string;
  shares: string;
  price: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  marketId: number;
  user: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface PricePoint {
  timestamp: string;
  optionAPrice: string;
  optionBPrice: string;
  volume: string;
}

export interface UserPosition {
  marketId: number;
  optionAShares: string;
  optionBShares: string;
  totalInvested: string;
  currentValue: string;
  profitLoss: string;
}

export const useMarketDetail = (marketId: string, userAddress?: string) => {
  const [market, setMarket] = useState<Market | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    if (!marketId) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching market ${marketId} details...`);

      // Fetch market data from Flow contract
      const marketData = await getMarket(parseInt(marketId));
      if (!marketData) {
        setError('Market not found');
        return;
      }

      console.log('Market data fetched:', marketData);
      setMarket(marketData);

      // Fetch additional data in parallel with error handling
      const fetchPromises = [
        getMarketTrades(parseInt(marketId), 50)
          .then(trades => trades || [])
          .catch(err => {
            console.log('Trades fetch failed, using empty array:', err);
            return [];
          }),
        
        getMarketComments(parseInt(marketId))
          .then(comments => comments || [])
          .catch(err => {
            console.log('Comments fetch failed, using empty array:', err);
            return [];
          }),
        
        getMarketPriceHistory(parseInt(marketId), 24)
          .then(history => history || [])
          .catch(err => {
            console.log('Price history fetch failed, using empty array:', err);
            return [];
          })
      ];

      // Add user position fetch if address is provided
      if (userAddress) {
        fetchPromises.push(
          getUserPosition(userAddress, parseInt(marketId))
            .then(position => position || null)
            .catch(err => {
              console.log('User position fetch failed:', err);
              return null;
            })
        );
      }

      const results = await Promise.all(fetchPromises);

      setTrades(results[0]);
      setComments(results[1]);
      setPriceHistory(results[2]);
      
      if (userAddress && results[3]) {
        setUserPosition(results[3]);
      }

      console.log('All market data loaded successfully');
    } catch (err: any) {
      console.error('Failed to fetch market details:', err);
      setError(err.message || 'Failed to fetch market details');
    } finally {
      setLoading(false);
    }
  }, [marketId, userAddress]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const refreshMarketData = useCallback(() => {
    console.log('Refreshing market data...');
    fetchMarketData();
  }, [fetchMarketData]);

  return {
    market,
    trades,
    comments,
    priceHistory,
    userPosition,
    loading,
    error,
    refreshMarketData,
  };
};