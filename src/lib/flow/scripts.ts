const FLOWWAGER_CONTRACT = process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT;
const USERREGISTRY_CONTRACT = process.env.NEXT_PUBLIC_USERREGISTRY_CONTRACT;

export const getMarketScript = (marketId: number) => {
  return {
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT}
      
      pub fun main(marketId: UInt64): FlowWager.Market? {
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
      
      pub fun main(): [FlowWager.Market] {
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
      
      pub fun main(address: Address): FlowWager.UserStats? {
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
      
      pub fun main(address: Address): {UInt64: FlowWager.UserPosition} {
        return FlowWager.getUserPositions(address: address)
      }
    `,
    args: [{ value: address, type: "Address" }],
  };
};


export const GET_USER_BALANCE = `
access(all) fun main(address: Address): UFix64 {
  let account = getAccount(address)
  return account.balance
}
`;

export const GET_ALL_MARKETS = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(): [FlowWager.Market] {
  return FlowWager.getAllMarkets()
}
`;

export const GET_ACTIVE_MARKETS = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(): [FlowWager.Market] {
  return FlowWager.getActiveMarkets()
}
`;

export const GET_MARKET_BY_ID = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(marketId: UInt64): FlowWager.Market? {
  return FlowWager.getMarket(marketId: marketId)
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

export const GET_USER_PROFILE = `
import UserRegistry from ${USERREGISTRY_CONTRACT}

access(all) fun main(address: Address): UserRegistry.UserProfile? {
  return UserRegistry.getUserProfile(address: address)
}
`;

export const GET_USER_SOCIAL_STATS = `
import UserRegistry from ${USERREGISTRY_CONTRACT}

access(all) fun main(address: Address): {String: AnyStruct}? {
  return UserRegistry.getUserSocialStats(address: address)
}
`;

export const GET_USER_FOLLOWERS = `
import UserRegistry from ${USERREGISTRY_CONTRACT}

access(all) fun main(address: Address): [Address] {
  return UserRegistry.getUserFollowers(address: address)
}
`;

export const GET_USER_FOLLOWING = `
import UserRegistry from ${USERREGISTRY_CONTRACT}

access(all) fun main(address: Address): [Address] {
  return UserRegistry.getUserFollowing(address: address)
}
`;

export const SEARCH_USERS = `
import UserRegistry from ${USERREGISTRY_CONTRACT}

access(all) fun main(query: String, limit: UInt64): [UserRegistry.UserProfile] {
  return UserRegistry.searchUsers(query: query, limit: limit)
}
`;

export const GET_ALL_ACHIEVEMENTS = `
import UserRegistry from ${USERREGISTRY_CONTRACT}

access(all) fun main(): [UserRegistry.UserAchievement] {
  return UserRegistry.getAllAchievements()
}
`;

export const GET_USER_ACHIEVEMENTS = `
import UserRegistry from ${USERREGISTRY_CONTRACT}

access(all) fun main(address: Address): [UserRegistry.UserAchievement] {
  return UserRegistry.getUserAchievements(address: address)
}
`;

export const GET_MARKET_TRADES = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(marketId: UInt64, limit: UInt64): [FlowWager.Trade] {
  return FlowWager.getMarketTrades(marketId: marketId, limit: limit)
}
`;

export const GET_USER_POSITIONS = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(address: Address, marketId: UInt64): FlowWager.UserPosition? {
  return FlowWager.getUserPosition(address: address, marketId: marketId)
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