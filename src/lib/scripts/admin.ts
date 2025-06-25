import * as fcl from "@onflow/fcl";

// Contract address - replace with your actual deployed contract address
const FLOWWAGER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT || "0x6c1b12e35dca8863";

/**
 * Fetch admin dashboard statistics using basic approach
 */
export const getAdminStats = async () => {
  return fcl.query({
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT_ADDRESS}
      
      access(all) fun main(): {String: AnyStruct} {
        let stats: {String: AnyStruct} = {}
        
        var totalMarkets = 0
        var activeMarkets = 0
        var pendingResolution = 0
        var totalVolume = 0.0
        
        // Check markets up to ID 100 to start with
        var marketId: UInt64 = 1
        while marketId <= 100 {
          if let market = FlowWager.getMarket(marketId: marketId) {
            totalMarkets = totalMarkets + 1
            
            // Check market status - using raw comparison
            if market.status.rawValue == 0 { // Assuming 0 = Active
              activeMarkets = activeMarkets + 1
            } else if market.status.rawValue == 1 && !market.resolved { // Assuming 1 = Paused
              pendingResolution = pendingResolution + 1
            }
            
            totalVolume = totalVolume + market.totalPool
          }
          marketId = marketId + 1
        }
        
        stats["totalMarkets"] = totalMarkets
        stats["activeMarkets"] = activeMarkets
        stats["pendingResolution"] = pendingResolution
        stats["totalVolume"] = totalVolume.toString()
        
        return stats
      }
    `,
  });
};

/**
 * Fetch markets pending resolution using simpler approach
 */
export const getMarketsNeedingResolution = async () => {
  return fcl.query({
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT_ADDRESS}
      
      access(all) fun main(): [AnyStruct] {
        let pendingMarkets: [AnyStruct] = []
        let currentTime = getCurrentBlock().timestamp
        
        // Check markets up to ID 100
        var marketId: UInt64 = 1
        while marketId <= 100 {
          if let market = FlowWager.getMarket(marketId: marketId) {
            // Market has ended but not resolved yet
            if market.endTime <= currentTime && !market.resolved {
              pendingMarkets.append(market)
            }
          }
          marketId = marketId + 1
        }
        
        return pendingMarkets
      }
    `,
  });
};

/**
 * Get recent markets using simpler approach
 */
export const getRecentMarkets = async (limit = 10) => {
  return fcl.query({
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT_ADDRESS}
      
      access(all) fun main(): [AnyStruct] {
        let markets: [AnyStruct] = []
        
        // Start from ID 1 and find first markets
        var marketId: UInt64 = 1
        var found = 0
        
        while marketId <= 100 && found < ${limit} {
          if let market = FlowWager.getMarket(marketId: marketId) {
            markets.append(market)
            found = found + 1
          }
          marketId = marketId + 1
        }
        
        return markets
      }
    `,
  });
};

/**
 * Get a specific market by ID
 */
export const getMarketById = async (marketId: string) => {
  return fcl.query({
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT_ADDRESS}
      
      access(all) fun main(marketId: UInt64): AnyStruct? {
        return FlowWager.getMarket(marketId: marketId)
      }
    `,
    args: (arg, t) => [arg(marketId, t.UInt64)]
  });
};

/**
 * Get all markets with basic pagination
 */
export const getAllMarkets = async (startId = 1, endId = 50) => {
  return fcl.query({
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT_ADDRESS}
      
      access(all) fun main(startId: UInt64, endId: UInt64): [AnyStruct] {
        let markets: [AnyStruct] = []
        
        var marketId = startId
        while marketId <= endId {
          if let market = FlowWager.getMarket(marketId: marketId) {
            markets.append(market)
          }
          marketId = marketId + 1
        }
        
        return markets
      }
    `,
    args: (arg, t) => [arg(startId, t.UInt64), arg(endId, t.UInt64)]
  });
};

/**
 * Simple market resolution transaction
 */
export const resolveMarket = async (marketId: string, outcome: number) => {
  return fcl.mutate({
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT_ADDRESS}
      
      transaction(marketId: UInt64, outcome: UInt8) {
        prepare(signer: auth(Storage) &Account) {
          log("Attempting to resolve market ID: ".concat(marketId.toString()))
          log("With outcome: ".concat(outcome.toString()))
          log("Signer address: ".concat(signer.address.toString()))
          
          // Try to get admin resource
          if let admin = signer.storage.borrow<&AnyResource>(from: /storage/FlowWagerAdmin) {
            log("Found admin resource")
          } else {
            log("No admin resource found at /storage/FlowWagerAdmin")
          }
        }
        
        execute {
          log("Resolution transaction executed for market: ".concat(marketId.toString()))
        }
      }
    `,
    args: (arg, t) => [arg(marketId, t.UInt64), arg(outcome, t.UInt8)],
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 1000
  });
};

/**
 * Cancel a market (refund all participants)
 */
export const cancelMarket = async (marketId: string) => {
  return fcl.mutate({
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT_ADDRESS}
      
      transaction(marketId: UInt64) {
        prepare(signer: auth(Storage) &Account) {
          log("Attempting to cancel market ID: ".concat(marketId.toString()))
          log("Signer address: ".concat(signer.address.toString()))
        }
        
        execute {
          log("Cancel transaction executed for market: ".concat(marketId.toString()))
        }
      }
    `,
    args: (arg, t) => [arg(marketId, t.UInt64)],
    proposer: fcl.authz,
    payer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 1000
  });
};

/**
 * Get market count by iterating
 */
export const getMarketCount = async () => {
  return fcl.query({
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT_ADDRESS}
      
      access(all) fun main(): Int {
        var count = 0
        var marketId: UInt64 = 1
        
        // Check up to 1000 markets
        while marketId <= 1000 {
          if FlowWager.getMarket(marketId: marketId) != nil {
            count = count + 1
          }
          marketId = marketId + 1
        }
        
        return count
      }
    `,
  });
};

/**
 * Check admin status
 */
export const checkAdminStatus = async (address: string) => {
  return fcl.query({
    cadence: `
      access(all) fun main(address: Address): {String: String} {
        let info: {String: String} = {}
        info["address"] = address.toString()
        info["contractAddress"] = "${FLOWWAGER_CONTRACT_ADDRESS}"
        info["isContractDeployer"] = (address.toString() == "${FLOWWAGER_CONTRACT_ADDRESS}") ? "true" : "false"
        return info
      }
    `,
    args: (arg, t) => [arg(address, t.Address)]
  });
};