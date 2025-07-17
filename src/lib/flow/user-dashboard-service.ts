/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/flow/user-dashboard-service.ts
import * as fcl from "@onflow/fcl";
import flowConfig from "@/lib/flow/config";
import type { Market } from "@/types/market";
import React from "react";
import { 
  getUserProfile as getUserProfileScript,
  getUserPositions as getUserPositionsScript,
  getMarketCreator as getMarketCreatorScript,
  getUserDashboardData as getUserDashboardDataScript
} from "@/lib/flow-wager-scripts";

// Initialize Flow configuration
const initConfig = async () => {
  flowConfig();
};

// User dashboard service functions using your scripts
export const getUserProfile = async (userAddress: string) => {
  try {
    await initConfig();
    
    const script = await getUserProfileScript();
    const profile = await fcl.query({
      cadence: script,
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
    
    const script = await getUserPositionsScript();
    const positions = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(userAddress, t.Address)]
    });

    return positions || {};
  } catch (error) {
    console.error(`Failed to fetch user positions for ${userAddress}:`, error);
    throw error;
  }
};

export const getUserCreatedMarkets = async (userAddress: string): Promise<Market[]> => {
  try {
    await initConfig();
    
    const script = await getMarketCreatorScript();
    const markets = await fcl.query({
      cadence: script,
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
      totalPool: market.totalPool.toString(),
      imageUrl: market.imageUrl || ""
    })) || [];
  } catch (error) {
    console.error(`Failed to fetch created markets for ${userAddress}:`, error);
    throw error;
  }
};

export const getUserTradingHistory = async (userAddress: string) => {
  try {
    await initConfig();
    
    // For now, return empty array since trading history tracking might not be implemented yet
    // You can implement this when you add event tracking to your contract
    return [];
  } catch (error) {
    console.error(`Failed to fetch trading history for ${userAddress}:`, error);
    return [];
  }
};

export const getUserLeaderboardRank = async (userAddress: string) => {
  try {
    await initConfig();
    
    // For now, return 0 since leaderboard might not be implemented yet
    // You can implement this when you add leaderboard logic to your contract
    return 0;
  } catch (error) {
    console.error(`Failed to fetch leaderboard rank for ${userAddress}:`, error);
    return 0;
  }
};

// Enhanced batch fetch using your comprehensive dashboard script
export const getUserDashboardData = async (userAddress: string) => {
  try {
    await initConfig();
    
    // Use your comprehensive getUserDashboardData script
    const script = await getUserDashboardDataScript();
    const dashboardData = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(userAddress, t.Address)]
    });

    // Also fetch created markets separately since it's not in the dashboard script
    const createdMarkets = await getUserCreatedMarkets(userAddress);

    return {
      profile: dashboardData.profile,
      stats: dashboardData.stats,
      positions: dashboardData.positions,
      claimableWinnings: dashboardData.claimableWinnings,
      wagerPoints: dashboardData.wagerPoints,
      createdMarkets,
      tradingHistory: [] // Placeholder until implemented
    };
  } catch (error) {
    console.error(`Failed to fetch dashboard data for ${userAddress}:`, error);
    
    // Fallback: fetch data individually if batch fails
    try {
      const [profile, positions, createdMarkets] = await Promise.all([
        getUserProfile(userAddress),
        getUserPositions(userAddress),
        getUserCreatedMarkets(userAddress)
      ]);

      return {
        profile,
        stats: null,
        positions,
        claimableWinnings: [],
        wagerPoints: 0,
        createdMarkets,
        tradingHistory: []
      };
    } catch (fallbackError) {
      console.error('Fallback fetch also failed:', fallbackError);
      throw error;
    }
  }
};

// React hook for user dashboard data
type UserDashboardData = {
  profile: any;
  stats: any;
  positions: any;
  claimableWinnings: any[];
  wagerPoints: number;
  createdMarkets: Market[];
  tradingHistory: any[];
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

// Additional helper functions for specific data
export const getClaimableWinnings = async (userAddress: string) => {
  try {
    await initConfig();
    
    const dashboardData = await getUserDashboardData(userAddress);
    return dashboardData.claimableWinnings || [];
  } catch (error) {
    console.error(`Failed to fetch claimable winnings for ${userAddress}:`, error);
    return [];
  }
};

export const getWagerPoints = async (userAddress: string) => {
  try {
    await initConfig();
    
    const dashboardData = await getUserDashboardData(userAddress);
    return dashboardData.wagerPoints || 0;
  } catch (error) {
    console.error(`Failed to fetch wager points for ${userAddress}:`, error);
    return 0;
  }
};

export const getUserStats = async (userAddress: string) => {
  try {
    await initConfig();
    
    const dashboardData = await getUserDashboardData(userAddress);
    return dashboardData.stats;
  } catch (error) {
    console.error(`Failed to fetch user stats for ${userAddress}:`, error);
    return null;
  }
};