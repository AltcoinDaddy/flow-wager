const FLOWWAGER_CONTRACT = process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT;
const USERREGISTRY_CONTRACT = process.env.NEXT_PUBLIC_USERREGISTRY_CONTRACT;

// Market Scripts
export const GET_ALL_MARKETS = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(): [FlowWager.Market] {
    return FlowWager.getAllMarkets()
}
`;

export const GET_MARKET_BY_ID = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(marketId: UInt64): FlowWager.Market? {
    return FlowWager.getMarket(marketId: marketId)
}
`;

export const GET_ACTIVE_MARKETS = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(): [FlowWager.Market] {
    return FlowWager.getActiveMarkets()
}
`;

export const GET_MARKETS_BY_CATEGORY = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(category: UInt8): [FlowWager.Market] {
    return FlowWager.getMarketsByCategory(category: FlowWager.MarketCategory(rawValue: category)!)
}
`;

export const GET_PLATFORM_STATS = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(): FlowWager.PlatformStats {
    return FlowWager.getPlatformStats()
}
`;

// User Scripts
export const GET_USER_BALANCE = `
access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    return account.balance
}
`;

export const GET_USER_STATS = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(address: Address): FlowWager.UserStats? {
    return FlowWager.getUserStats(address: address)
}
`;

export const GET_USER_POSITIONS = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(address: Address): {UInt64: FlowWager.UserPosition} {
    return FlowWager.getUserPositions(address: address)
}
`;

export const GET_USER_PROFILE = `
import UserRegistry from ${USERREGISTRY_CONTRACT}

access(all) fun main(address: Address): UserRegistry.UserProfile? {
    return UserRegistry.getUserProfile(address: address)
}
`;

// Trading Scripts
export const GET_MARKET_TRADES = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(marketId: UInt64, limit: UInt64): [FlowWager.Trade] {
    return FlowWager.getMarketTrades(marketId: marketId, limit: limit)
}
`;

export const GET_MARKET_COMMENTS = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(marketId: UInt64): [FlowWager.Comment] {
    return FlowWager.getMarketComments(marketId: marketId)
}
`;

export const GET_MARKET_PRICE_HISTORY = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(marketId: UInt64, timeframe: UInt64): [FlowWager.PricePoint] {
  return FlowWager.getMarketPriceHistory(marketId: marketId, timeframe: timeframe)
}
`;

// Script function generators (like your existing style)
export const getMarketScript = (marketId: number) => {
  return {
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT}
      
      access(all) fun main(marketId: UInt64): FlowWager.Market? {
        return FlowWager.getMarket(marketId: marketId)
      }
    `,
    args: [{ value: marketId, type: "UInt64" }],
  };
};

export const getAllMarketsScript = () => {
  return {
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT}
      
      access(all) fun main(): [FlowWager.Market] {
        return FlowWager.getAllMarkets()
      }
    `,
    args: [],
  };
};

export const getUserStatsScript = (address: string) => {
  return {
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT}
      
      access(all) fun main(address: Address): FlowWager.UserStats? {
        return FlowWager.getUserStats(address: address)
      }
    `,
    args: [{ value: address, type: "Address" }],
  };
};

export const getUserPositionsScript = (address: string) => {
  return {
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT}
      
      access(all) fun main(address: Address): {UInt64: FlowWager.UserPosition} {
        return FlowWager.getUserPositions(address: address)
      }
    `,
    args: [{ value: address, type: "Address" }],
  };
};