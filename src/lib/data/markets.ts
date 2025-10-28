// Transformation utility for converting contract market data to Market interface
import { Market } from "@/types/market";

/**
 * Transform multi-option market contract data to Market interface
 * Handles the case where markets have an options array
 */
export function transformMultiOptionMarket(market: any): Market {
  return {
    id: market.id.toString(),
    title: market.title,
    description: market.description,
    category: parseInt(market.category.rawValue),
    // For multi-option markets, store options array
    options: market.options || [],
    // Store total shares for each option
    totalShares:
      market.totalShares?.map((share: any) => share.toString()) || [],
    creator: market.creator,
    createdAt: market.createdAt.toString(),
    endTime: market.endTime.toString(),
    minBet: market.minBet?.toString() || "0.0",
    maxBet: market.maxBet?.toString() || "0.0",
    status: parseInt(market.status.rawValue),
    outcome: market.outcome ? parseInt(market.outcome.rawValue) : null,
    resolved: market.resolved,
    totalPool: market.totalPool?.toString() || "0.0",
    imageUrl: market.imageUrl || "",
    winningOption:
      market.winningOption !== undefined ? market.winningOption : null,
  };
}

/**
 * Transform binary market contract data to Market interface
 * Handles the traditional optionA/optionB format
 */
export function transformBinaryMarket(market: any): Market {
  return {
    id: market.id.toString(),
    title: market.title,
    description: market.description,
    category: parseInt(market.category.rawValue),
    optionA: market.optionA,
    optionB: market.optionB,
    creator: market.creator,
    createdAt: market.createdAt.toString(),
    endTime: market.endTime.toString(),
    minBet: market.minBet?.toString() || "0.0",
    maxBet: market.maxBet?.toString() || "0.0",
    status: parseInt(market.status.rawValue),
    outcome: market.outcome ? parseInt(market.outcome.rawValue) : null,
    resolved: market.resolved,
    totalOptionAShares: market.totalOptionAShares?.toString() || "0.0",
    totalOptionBShares: market.totalOptionBShares?.toString() || "0.0",
    totalPool: market.totalPool?.toString() || "0.0",
    imageUrl: market.imageUrl || "",
  };
}

/**
 * Universal transformer that detects market type and transforms accordingly
 */
export function transformMarketData(market: any): Market {
  // Check if it's a multi-option market (has options array and totalShares array)
  if (
    market.options &&
    Array.isArray(market.options) &&
    market.options.length > 0
  ) {
    return transformMultiOptionMarket(market);
  }

  // Otherwise treat as binary market
  return transformBinaryMarket(market);
}

/**
 * Transform array of mixed market types
 */
export function transformMarketsData(markets: any[]): Market[] {
  return markets.map(transformMarketData);
}

/**
 * Get all options from a market (works for both binary and multi-option)
 */
export function getMarketOptions(market: Market): string[] {
  if (market.options && market.options.length > 0) {
    return market.options;
  }
  if (market.optionA && market.optionB) {
    return [market.optionA, market.optionB];
  }
  return [];
}

/**
 * Get total shares for an option (works for both binary and multi-option)
 */
export function getOptionShares(market: Market, optionIndex: number): string {
  if (market.totalShares && market.totalShares[optionIndex]) {
    return market.totalShares[optionIndex];
  }

  // For binary markets
  if (optionIndex === 0 && market.totalOptionAShares) {
    return market.totalOptionAShares;
  }
  if (optionIndex === 1 && market.totalOptionBShares) {
    return market.totalOptionBShares;
  }

  return "0.0";
}

/**
 * Calculate odds for an option
 */
export function calculateOptionOdds(
  market: Market,
  optionIndex: number,
): number {
  const optionShares = parseFloat(getOptionShares(market, optionIndex));
  const totalPool = parseFloat(market.totalPool || "0");

  if (totalPool === 0) return 0;

  return (optionShares / totalPool) * 100;
}
