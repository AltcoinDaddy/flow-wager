// lib/flow/user-dashboard-service.ts
import * as fcl from "@onflow/fcl";
import flowConfig from "@/lib/flow/config";
import type { Market } from "@/types/market";
import React from "react";

// Initialize Flow configuration
const initConfig = async () => {
  flowConfig();
};

// Cadence scripts for user dashboard data
export const GET_USER_PROFILE_SCRIPT = `
  import FlowWager from 0xFlowWager
  
  access(all) fun main(userAddress: Address): {String: AnyStruct} {
    let userProfile = FlowWager.getUserProfile(userAddress: userAddress)
    if (userProfile == nil) {
      return {
        "totalTrades": 0,
        "totalVolume": "0.0",
        "totalPnL": "0.0", 
        "winRate": 0.0,
        "joinDate": getCurrentBlock().timestamp.toString(),
        "reputation": 0.0,
        "rank": 0
      }
    }
    return userProfile!
  }
`;

export const GET_USER_POSITIONS_SCRIPT = `
  import FlowWager from 0xFlowWager
  
  access(all) fun main(userAddress: Address): [AnyStruct] {
    let positions: [AnyStruct] = []
    let allMarkets = FlowWager.getAllMarkets()
    
    for market in allMarkets {
      let position = FlowWager.getUserPosition(userAddress: userAddress, marketId: market.id)
      if (position != nil) {
        let positionData = position!
        let totalShares = positionData.optionAShares + positionData.optionBShares
        
        if (totalShares > 0.0) {
          // Calculate current value and P&L
          let marketData = FlowWager.getMarket(marketId: market.id)!
          let totalMarketShares = marketData.totalOptionAShares + marketData.totalOptionBShares
          let currentPrice = totalMarketShares > 0.0 ? marketData.totalPool / totalMarketShares : 1.0
          let currentValue = totalShares * currentPrice
          let pnl = currentValue - positionData.totalInvested
          let pnlPercentage = positionData.totalInvested > 0.0 ? (pnl / positionData.totalInvested) * 100.0 : 0.0
          
          positions.append({
            "marketId": market.id,
            "marketTitle": market.title,
            "optionAShares": positionData.optionAShares,
            "optionBShares": positionData.optionBShares,
            "totalInvested": positionData.totalInvested,
            "currentValue": currentValue,
            "pnl": pnl,
            "pnlPercentage": pnlPercentage,
            "status": market.status,
            "outcome": market.outcome
          })
        }
      }
    }
    
    return positions
  }
`;

export const GET_USER_CREATED_MARKETS_SCRIPT = `
  import FlowWager from 0xFlowWager
  
  access(all) fun main(creatorAddress: Address): [FlowWager.Market] {
    let allMarkets = FlowWager.getAllMarkets()
    let userMarkets: [FlowWager.Market] = []
    
    for market in allMarkets {
      if (market.creator == creatorAddress) {
        userMarkets.append(market)
      }
    }
    
    return userMarkets
  }
`;

export const GET_USER_TRADING_HISTORY_SCRIPT = `
  import FlowWager from 0xFlowWager
  
  access(all) fun main(userAddress: Address): [AnyStruct] {
    // This would need to be implemented in the contract to track user trading history
    // For now, returning empty array - you'll need to add event tracking to your contract
    let history: [AnyStruct] = []
    
    // Example structure for when you implement it:
    // {
    //   "id": "trade_id",
    //   "type": "BuyShares" | "SellShares" | "ClaimWinnings" | "CreateMarket", 
    //   "marketId": marketId,
    //   "marketTitle": market.title,
    //   "amount": amount,
    //   "side": "optionA" | "optionB",
    //   "timestamp": timestamp,
    //   "txHash": txHash
    // }
    
    return history
  }
`;

export const GET_LEADERBOARD_RANK_SCRIPT = `
  import FlowWager from 0xFlowWager
  
  access(all) fun main(userAddress: Address): Int {
    // This would calculate user's rank based on total volume, P&L, or other metrics
    // For now returning 0 - implement leaderboard logic in contract
    return 0
  }
`;

// User dashboard service functions
export const getUserProfile = async (userAddress: string) => {
  try {
    await initConfig();
    
    const profile = await fcl.query({
      cadence: GET_USER_PROFILE_SCRIPT,
      args: (arg, t) => [arg(userAddress, t.Address)]
    });

    return profile;
  } catch (error) {
    console.error(`Failed to fetch user profile for ${userAddress}:`, error);
    throw error;
  }
};

export const getUserPositions = async (userAddress: string) => {
  try {
    await initConfig();
    
    const positions = await fcl.query({
      cadence: GET_USER_POSITIONS_SCRIPT,
      args: (arg, t) => [arg(userAddress, t.Address)]
    });

    return positions || [];
  } catch (error) {
    console.error(`Failed to fetch user positions for ${userAddress}:`, error);
    throw error;
  }
};

export const getUserCreatedMarkets = async (userAddress: string): Promise<Market[]> => {
  try {
    await initConfig();
    
    const markets = await fcl.query({
      cadence: GET_USER_CREATED_MARKETS_SCRIPT,
      args: (arg, t) => [arg(userAddress, t.Address)]
    });

    // Transform contract data to Market interface
    return markets?.map((market: any) => ({
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
    })) || [];
  } catch (error) {
    console.error(`Failed to fetch created markets for ${userAddress}:`, error);
    throw error;
  }
};

export const getUserTradingHistory = async (userAddress: string) => {
  try {
    await initConfig();
    
    const history = await fcl.query({
      cadence: GET_USER_TRADING_HISTORY_SCRIPT,
      args: (arg, t) => [arg(userAddress, t.Address)]
    });

    return history || [];
  } catch (error) {
    console.error(`Failed to fetch trading history for ${userAddress}:`, error);
    // Return empty array on error since trading history might not be implemented yet
    return [];
  }
};

export const getUserLeaderboardRank = async (userAddress: string) => {
  try {
    await initConfig();
    
    const rank = await fcl.query({
      cadence: GET_LEADERBOARD_RANK_SCRIPT,
      args: (arg, t) => [arg(userAddress, t.Address)]
    });

    return rank || 0;
  } catch (error) {
    console.error(`Failed to fetch leaderboard rank for ${userAddress}:`, error);
    return 0;
  }
};

// Batch fetch all user dashboard data
export const getUserDashboardData = async (userAddress: string) => {
  try {
    const [profile, positions, createdMarkets, tradingHistory] = await Promise.all([
      getUserProfile(userAddress),
      getUserPositions(userAddress),
      getUserCreatedMarkets(userAddress),
      getUserTradingHistory(userAddress)
    ]);

    return {
      profile,
      positions,
      createdMarkets,
      tradingHistory
    };
  } catch (error) {
    console.error(`Failed to fetch dashboard data for ${userAddress}:`, error);
    throw error;
  }
};

// React hook for user dashboard data
type UserDashboardData = {
  profile: any;
  positions: any;
  createdMarkets: Market[];
  tradingHistory: any;
};

export const useUserDashboard = (userAddress: string) => {
  const [data, setData] = React.useState<UserDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!userAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await getUserDashboardData(userAddress);
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};