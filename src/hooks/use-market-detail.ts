/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getScript,
  getUserPositions
} from '@/lib/flow-wager-scripts';
import flowConfig from '@/lib/flow/config';
import { Market } from '@/types/market';
import * as fcl from '@onflow/fcl';
import { useCallback, useEffect, useState } from 'react';

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

export interface UserBet {
  id: string;
  marketId: number;
  option: number; // 0 for Option A, 1 for Option B
  amount: string;
  shares: string;
  timestamp: string;
  status: 'active' | 'won' | 'lost' | 'pending';
}

export const useMarketDetail = (marketId: string, userAddress?: string) => {
  const [market, setMarket] = useState<Market | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Flow configuration
  const initConfig = async () => {
    try {
      flowConfig();
    } catch (error) {
      console.error('Failed to initialize Flow configuration:', error);
      throw error;
    }
  };

  // Get single market by ID
  const getMarketById = async (marketId: number): Promise<Market | null> => {
    try {
      await initConfig();
      
      const script = await getScript('getMarketById');
      const rawMarket = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => [arg(marketId, t.UInt64)]
      });

      if (!rawMarket) return null;

      // Transform contract data to Market interface
      return {
        id: rawMarket.id.toString(),
        title: rawMarket.title,
        description: rawMarket.description,
        category: parseInt(rawMarket.category.rawValue),
        optionA: rawMarket.optionA,
        optionB: rawMarket.optionB,
        creator: rawMarket.creator,
        createdAt: rawMarket.createdAt.toString(),
        endTime: rawMarket.endTime.toString(),
        minBet: rawMarket.minBet.toString(),
        maxBet: rawMarket.maxBet.toString(),
        status: parseInt(rawMarket.status.rawValue),
        outcome: rawMarket.outcome ? parseInt(rawMarket.outcome.rawValue) : null,
        resolved: rawMarket.resolved,
        totalOptionAShares: rawMarket.totalOptionAShares.toString(),
        totalOptionBShares: rawMarket.totalOptionBShares.toString(),
        totalPool: rawMarket.totalPool.toString(),
        imageUrl: rawMarket.imageUrl || ""
      };
    } catch (error) {
      console.error('Failed to fetch market by ID:', error);
      throw error;
    }
  };

  // Get user position for specific market
  const getUserMarketPosition = async (userAddress: string, marketId: number): Promise<UserPosition | null> => {
    try {
      await initConfig();
      
      const script = await getUserPositions();
      const allPositions = await fcl.query({
        cadence: script,
        args: (arg: any, t: any) => [arg(userAddress, t.Address)]
      });

      // Find position for this specific market
      const marketPosition = allPositions[marketId.toString()];
      
      if (!marketPosition) return null;

      // Calculate current value and profit/loss
      const optionAShares = parseFloat(marketPosition.optionAShares || '0');
      const optionBShares = parseFloat(marketPosition.optionBShares || '0');
      const totalInvested = parseFloat(marketPosition.totalInvested || '0');
      
      // Simple current value calculation (you might want to make this more sophisticated)
      const currentValue = totalInvested; // Placeholder - implement proper calculation
      const profitLoss = currentValue - totalInvested;

      return {
        marketId,
        optionAShares: optionAShares.toString(),
        optionBShares: optionBShares.toString(),
        totalInvested: totalInvested.toString(),
        currentValue: currentValue.toString(),
        profitLoss: profitLoss.toString()
      };
    } catch (error) {
      console.error('Failed to fetch user position:', error);
      return null;
    }
  };

  // Get user bets for this market (using event data or position breakdown)
  const getUserMarketBets = async (userAddress: string, marketId: number): Promise<UserBet[]> => {
    try {
      await initConfig();
      
      // For now, we'll derive bets from the user position
      // In a future version, you could implement event tracking in your contract
      const position = await getUserMarketPosition(userAddress, marketId);
      
      if (!position) return [];

      const bets: UserBet[] = [];
      
      // If user has Option A shares, create a bet entry
      if (parseFloat(position.optionAShares) > 0) {
        bets.push({
          id: `${marketId}-${userAddress}-optionA`,
          marketId,
          option: 0,
          amount: '0', // We don't have individual bet amounts, only total
          shares: position.optionAShares,
          timestamp: Date.now().toString(), // Placeholder
          status: 'active' // Determine based on market status
        });
      }

      // If user has Option B shares, create a bet entry
      if (parseFloat(position.optionBShares) > 0) {
        bets.push({
          id: `${marketId}-${userAddress}-optionB`,
          marketId,
          option: 1,
          amount: '0', // We don't have individual bet amounts, only total
          shares: position.optionBShares,
          timestamp: Date.now().toString(), // Placeholder
          status: 'active' // Determine based on market status
        });
      }

      return bets;
    } catch (error) {
      console.error('Failed to fetch user bets:', error);
      return [];
    }
  };

  // Mock functions for data not yet available from contract
  const getMarketTrades = async (marketId: number, limit: number = 50): Promise<Trade[]> => {
    // Placeholder - implement when you add trade tracking to your contract
    console.log(`Mock: Getting ${limit} trades for market ${marketId}`);
    return [];
  };

  const getMarketComments = async (marketId: number): Promise<Comment[]> => {
    // Placeholder - implement when you add comment system
    console.log(`Mock: Getting comments for market ${marketId}`);
    return [];
  };

  const getMarketPriceHistory = async (marketId: number, hours: number = 24): Promise<PricePoint[]> => {
    // Placeholder - implement when you add price tracking
    console.log(`Mock: Getting ${hours}h price history for market ${marketId}`);
    return [];
  };

  const fetchMarketData = useCallback(async () => {
    if (!marketId) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching market ${marketId} details...`);

      // Fetch market data using your script
      const marketData = await getMarketById(parseInt(marketId));
      if (!marketData) {
        setError('Market not found');
        return;
      }

      console.log('Market data fetched:', marketData);
      setMarket(marketData);

      // Fetch basic market data in parallel
      const [trades, comments, priceHistory] = await Promise.all([
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
      ]);

      setTrades(trades);
      setComments(comments);
      setPriceHistory(priceHistory);

      // Fetch user-specific data if address is provided
      if (userAddress) {
        const [userPosition, userBets] = await Promise.all([
          getUserMarketPosition(userAddress, parseInt(marketId))
            .then(position => position || null)
            .catch(err => {
              console.log('User position fetch failed:', err);
              return null;
            }),

          getUserMarketBets(userAddress, parseInt(marketId))
            .then(bets => bets || [])
            .catch(err => {
              console.log('User bets fetch failed:', err);
              return [];
            })
        ]);

        setUserPosition(userPosition);
        setUserBets(userBets);
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
    userBets, // New: user's bets for this market
    loading,
    error,
    refreshMarketData,
  };
};