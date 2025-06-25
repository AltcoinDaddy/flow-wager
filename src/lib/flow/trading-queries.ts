// src/lib/flow/trading-queries.ts
import * as fcl from "@onflow/fcl";
import flowConfig from "@/lib/flow/config";
import {
  GET_MARKET_TRADES,
  GET_USER_POSITIONS,
  GET_MARKET_COMMENTS,
  GET_MARKET_PRICE_HISTORY,
} from "@/lib/flow/scripts";

const initConfig = async () => {
  flowConfig();
};

export const getMarketTrades = async (marketId: number, limit: number = 50) => {
  try {
    await initConfig();
    
    const trades = await fcl.query({
      cadence: GET_MARKET_TRADES,
      args: (arg, type) => [
        arg(marketId.toString(), type.UInt64),
        arg(limit.toString(), type.UInt64)
      ]
    });

    return trades || [];
  } catch (error) {
    console.error(`Failed to fetch trades for market ${marketId}:`, error);
    // Return mock data for now
    return [];
  }
};

export const getUserPosition = async (address: string, marketId: number) => {
  try {
    await initConfig();
    
    const position = await fcl.query({
      cadence: GET_USER_POSITIONS,
      args: (arg, type) => [
        arg(address, type.Address),
        arg(marketId.toString(), type.UInt64)
      ]
    });

    return position;
  } catch (error) {
    console.error(`Failed to fetch user position for ${address} in market ${marketId}:`, error);
    return null;
  }
};

export const getMarketComments = async (marketId: number) => {
  try {
    await initConfig();
    
    const comments = await fcl.query({
      cadence: GET_MARKET_COMMENTS,
      args: (arg, type) => [arg(marketId.toString(), type.UInt64)]
    });

    return comments || [];
  } catch (error) {
    console.error(`Failed to fetch comments for market ${marketId}:`, error);
    // Return mock data for now
    return [];
  }
};

export const getMarketPriceHistory = async (marketId: number, timeframe: number = 24) => {
  try {
    await initConfig();
    
    const priceHistory = await fcl.query({
      cadence: GET_MARKET_PRICE_HISTORY,
      args: (arg, type) => [
        arg(marketId.toString(), type.UInt64),
        arg(timeframe.toString(), type.UInt64)
      ]
    });

    return priceHistory || [];
  } catch (error) {
    console.error(`Failed to fetch price history for market ${marketId}:`, error);
    return [];
  }
};