/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import * as fcl from '@onflow/fcl';
import { Market, MarketOutcome } from '@/types/market';
import { 
  GET_MARKET_BY_ID,
  GET_MARKET_TRADES, 
  GET_USER_POSITIONS,
  GET_MARKET_COMMENTS,
  GET_MARKET_PRICE_HISTORY 
} from '@/lib/flow/scripts';

interface Trade {
  id: string;
  user: string;
  option: number;
  amount: string;
  price: string;
  timestamp: string;
}

interface Comment {
  id: string;
  user: string;
  content: string;
  timestamp: string;
  likes: number;
}

interface PricePoint {
  timestamp: string;
  optionAPrice: string;
  optionBPrice: string;
  volume: string;
}

interface UserPosition {
  optionAShares: string;
  optionBShares: string;
  totalInvested: string;
}

export function useMarketDetail(marketId: string, userAddress?: string) {
  const [market, setMarket] = useState<Market | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch market details
      const marketData = await fcl.query({
        cadence: GET_MARKET_BY_ID,
        args: (arg, t) => [arg(marketId, t.UInt64)]
      });

      if (!marketData) {
        throw new Error('Market not found');
      }

      // Transform market data
      const transformedMarket: Market = {
        id: marketData.id.toString(),
        title: marketData.title,
        description: marketData.description,
        category: parseInt(marketData.category.rawValue),
        optionA: marketData.optionA,
        optionB: marketData.optionB,
        creator: marketData.creator,
        createdAt: marketData.createdAt.toString(),
        endTime: marketData.endTime.toString(),
        minBet: marketData.minBet.toString(),
        maxBet: marketData.maxBet.toString(),
        status: parseInt(marketData.status.rawValue),
        outcome: marketData.outcome ? parseInt(marketData.outcome.rawValue) as MarketOutcome : null,
        resolved: marketData.resolved,
        totalOptionAShares: marketData.totalOptionAShares.toString(),
        totalOptionBShares: marketData.totalOptionBShares.toString(),
        totalPool: marketData.totalPool.toString()
      };

      setMarket(transformedMarket);

      // Fetch trades
      const tradesData = await fcl.query({
        cadence: GET_MARKET_TRADES,
        args: (arg, t) => [arg(marketId, t.UInt64), arg(50, t.UInt64)]
      });

      const transformedTrades: Trade[] = tradesData.map((trade: any) => ({
        id: trade.id.toString(),
        user: trade.user,
        option: parseInt(trade.option),
        amount: trade.amount.toString(),
        price: trade.price.toString(),
        timestamp: trade.timestamp.toString()
      }));

      setTrades(transformedTrades);

      // Fetch comments if available
      try {
        const commentsData = await fcl.query({
          cadence: GET_MARKET_COMMENTS,
          args: (arg, t) => [arg(marketId, t.UInt64)]
        });

        const transformedComments: Comment[] = commentsData.map((comment: any) => ({
          id: comment.id.toString(),
          user: comment.user,
          content: comment.content,
          timestamp: comment.timestamp.toString(),
          likes: parseInt(comment.likes.toString())
        }));

        setComments(transformedComments);
      } catch {
        console.warn('Comments not available for this market');
        setComments([]);
      }

      // Fetch price history
      try {
        const priceData = await fcl.query({
          cadence: GET_MARKET_PRICE_HISTORY,
          args: (arg, t) => [arg(marketId, t.UInt64), arg(7, t.UInt64)] // 7 days
        });

        const transformedPriceHistory: PricePoint[] = priceData.map((point: any) => ({
          timestamp: point.timestamp.toString(),
          optionAPrice: point.optionAPrice.toString(),
          optionBPrice: point.optionBPrice.toString(),
          volume: point.volume.toString()
        }));

        setPriceHistory(transformedPriceHistory);
      } catch {
        console.warn('Price history not available for this market');
        setPriceHistory([]);
      }

      // Fetch user position if user is logged in
      if (userAddress) {
        try {
          const positionData = await fcl.query({
            cadence: GET_USER_POSITIONS,
            args: (arg, t) => [arg(userAddress, t.Address), arg(marketId, t.UInt64)]
          });

          if (positionData) {
            setUserPosition({
              optionAShares: positionData.optionAShares.toString(),
              optionBShares: positionData.optionBShares.toString(),
              totalInvested: positionData.totalInvested.toString()
            });
          } else {
            setUserPosition(null);
          }
        } catch {
          console.warn('Could not fetch user position');
          setUserPosition(null);
        }
      }

    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, [marketId, userAddress]);

  useEffect(() => {
    if (marketId) {
      fetchMarketData();
    }
  }, [marketId, userAddress, fetchMarketData]);

  const refreshMarketData = useCallback(() => {
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
    refreshMarketData
  };
}