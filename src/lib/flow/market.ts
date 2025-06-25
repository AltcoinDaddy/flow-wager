/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as fcl from "@onflow/fcl";
// import * as t from "@onflow/types";
import flowConfig from "@/lib/flow/config";
import { 
  GET_ALL_MARKETS, 
  GET_MARKET_BY_ID, 
  GET_ACTIVE_MARKETS, 
  GET_MARKETS_BY_CATEGORY,
  GET_PLATFORM_STATS,
  getAllMarketsScript,
  getMarketScript 
} from "@/lib/flow/scripts";

export interface RawMarketData {
  id: string;
  title: string;
  description: string;
  category: number;
  optionA: string;
  optionB: string;
  creator: string;
  createdAt: string;
  endTime: string;
  minBet: string;
  maxBet: string;
  status: number;
  outcome: number | null;
  resolved: boolean;
  totalOptionAShares: string;
  totalOptionBShares: string;
  totalPool: string;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: number;
  optionA: string;
  optionB: string;
  creator: string;
  createdAt: string;
  endTime: string;
  minBet: string;
  maxBet: string;
  status: number;
  outcome: number | null;
  resolved: boolean;
  totalOptionAShares: string;
  totalOptionBShares: string;
  totalPool: string;
  // Additional calculated fields
  totalBets?: number;
  totalParticipants?: number;
}

const transformMarketData = (rawMarket: any): Market => {
  // Handle the contract data structure and ensure all fields are properly formatted
  const baseMarket: Market = {
    id: rawMarket.id?.toString() || "0",
    title: rawMarket.title || "",
    description: rawMarket.description || "",
    category: parseInt(rawMarket.category?.toString() || "0"),
    optionA: rawMarket.optionA || "",
    optionB: rawMarket.optionB || "",
    creator: rawMarket.creator || "",
    createdAt: rawMarket.createdAt?.toString() || "0",
    endTime: rawMarket.endTime?.toString() || "0",
    minBet: rawMarket.minBet?.toString() || "0",
    maxBet: rawMarket.maxBet?.toString() || "0",
    status: parseInt(rawMarket.status?.toString() || "0"),
    outcome:
      rawMarket.outcome !== null && rawMarket.outcome !== undefined
        ? parseInt(rawMarket.outcome.toString())
        : null,
    resolved: Boolean(rawMarket.resolved),
    totalOptionAShares: rawMarket.totalOptionAShares?.toString() || "0",
    totalOptionBShares: rawMarket.totalOptionBShares?.toString() || "0",
    totalPool: rawMarket.totalPool?.toString() || "0",
  };

  // Add calculated fields
  const pool = parseFloat(baseMarket.totalPool);
  const minBet = parseFloat(baseMarket.minBet);
  const totalShares = parseFloat(baseMarket.totalOptionAShares) + parseFloat(baseMarket.totalOptionBShares);

  baseMarket.totalBets = minBet > 0 ? Math.ceil(pool / minBet) : 0;
  baseMarket.totalParticipants = Math.max(1, Math.ceil(totalShares / 100));

  return baseMarket;
};

// Main function - getAllMarkets
export const getAllMarkets = async (): Promise<Market[]> => {
  try {
    flowConfig();
    console.log("Fetching markets from contract...");

    const rawMarkets = await fcl.query({
      cadence: GET_ALL_MARKETS,
      args: () => [],
    });

    console.log("Raw markets data:", rawMarkets);

    if (!rawMarkets || !Array.isArray(rawMarkets)) {
      console.warn("No markets returned or invalid format");
      return [];
    }

    const transformedMarkets = rawMarkets.map(transformMarketData);
    console.log("Transformed markets:", transformedMarkets);

    return transformedMarkets;
  } catch (error) {
    console.error("Error fetching all markets:", error);

    if (error instanceof Error) {
      if (error.message.includes("accessNode.api")) {
        throw new Error(
          "FCL configuration error. Please check your Flow network settings."
        );
      }
      if (error.message.includes("contract")) {
        throw new Error(
          "Contract not found or invalid. Please check your contract address."
        );
      }
      if (error.message.includes("script")) {
        throw new Error(
          "Script execution failed. The contract may not be deployed."
        );
      }
    }

    throw new Error("Failed to fetch markets from the blockchain");
  }
};

// Get single market
export const getMarket = async (marketId: number): Promise<Market | null> => {
  try {
    flowConfig();
    console.log(`Fetching market ${marketId} from contract...`);

    const rawMarket = await fcl.query({
      cadence: GET_MARKET_BY_ID,
      args: (arg, type) => [arg(marketId.toString(), type.UInt64)],
    });

    if (!rawMarket) {
      console.warn(`Market ${marketId} not found`);
      return null;
    }

    const transformedMarket = transformMarketData(rawMarket);
    console.log("Transformed market:", transformedMarket);

    return transformedMarket;
  } catch (error) {
    console.error(`Error fetching market ${marketId}:`, error);
    throw error;
  }
};

// Get active markets
export const getActiveMarkets = async (): Promise<Market[]> => {
  try {
    flowConfig();
    console.log("Fetching active markets from contract...");

    const rawMarkets = await fcl.query({
      cadence: GET_ACTIVE_MARKETS,
      args: () => [],
    });

    if (!rawMarkets || !Array.isArray(rawMarkets)) {
      console.warn("No active markets returned");
      return [];
    }

    const transformedMarkets = rawMarkets.map(transformMarketData);
    console.log("Active markets:", transformedMarkets);

    return transformedMarkets;
  } catch (error) {
    console.error("Error fetching active markets:", error);
    throw error;
  }
};

// Get markets by category
export const getMarketsByCategory = async (category: number): Promise<Market[]> => {
  try {
    flowConfig();
    console.log(`Fetching markets for category ${category}...`);

    const rawMarkets = await fcl.query({
      cadence: GET_MARKETS_BY_CATEGORY,
      args: (arg, type) => [arg(category.toString(), type.UInt8)],
    });

    if (!rawMarkets || !Array.isArray(rawMarkets)) {
      console.warn(`No markets found for category ${category}`);
      return [];
    }

    const transformedMarkets = rawMarkets.map(transformMarketData);
    console.log(`Category ${category} markets:`, transformedMarkets);

    return transformedMarkets;
  } catch (error) {
    console.error(`Error fetching markets for category ${category}:`, error);
    throw error;
  }
};

// Get platform stats
export const getPlatformStats = async () => {
  try {
    flowConfig();
    console.log("Fetching platform stats...");

    const stats = await fcl.query({
      cadence: GET_PLATFORM_STATS,
      args: () => [],
    });

    console.log("Platform stats:", stats);
    return stats;
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    
    // Fallback: calculate from getAllMarkets
    try {
      console.log("Falling back to calculate stats from markets...");
      const allMarkets = await getAllMarkets();
      const now = Date.now() / 1000;

      const activeMarkets = allMarkets.filter(market => 
        !market.resolved && parseFloat(market.endTime) > now
      );

      const totalVolume = allMarkets.reduce((sum, market) => 
        sum + parseFloat(market.totalPool), 0
      );

      const totalParticipants = allMarkets.reduce((sum, market) => 
        sum + (market.totalParticipants || 0), 0
      );

      return {
        activeMarkets: activeMarkets.length.toString(),
        totalVolume: totalVolume.toString(),
        totalMarkets: allMarkets.length.toString(),
        totalUsers: totalParticipants.toString(),
        resolvedMarkets: allMarkets.filter(m => m.resolved).length.toString()
      };
    } catch (fallbackError) {
      console.error("Fallback stats calculation failed:", fallbackError);
      return {
        activeMarkets: "0",
        totalVolume: "0.0",
        totalMarkets: "0",
        totalUsers: "0",
        resolvedMarkets: "0"
      };
    }
  }
};

// Alternative method using script functions (for compatibility)
export const getAllMarketsWithScript = async (): Promise<Market[]> => {
  try {
    flowConfig();
    const script = getAllMarketsScript();
    
    const rawMarkets = await fcl.query({
      cadence: script.cadence,
      args: () => [],
    });

    if (!rawMarkets || !Array.isArray(rawMarkets)) {
      return [];
    }

    return rawMarkets.map(transformMarketData);
  } catch (error) {
    console.error("Error with script method:", error);
    throw error;
  }
};

export const getMarketWithScript = async (marketId: number): Promise<Market | null> => {
  try {
    flowConfig();
    const script = getMarketScript(marketId);
    
    const rawMarket = await fcl.query({
      cadence: script.cadence,
      args: (arg, type) => [arg(marketId.toString(), type.UInt64)],
    });

    if (!rawMarket) return null;

    return transformMarketData(rawMarket);
  } catch (error) {
    console.error(`Error fetching market ${marketId} with script:`, error);
    throw error;
  }
};

// Export the main function as default
export default getAllMarkets;
