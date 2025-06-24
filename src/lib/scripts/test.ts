import * as fcl from "@onflow/fcl";

const FLOWWAGER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT || "0x6c1b12e35dca8863";

/**
 * Debug script to understand contract structure
 */
export const debugContract = async () => {
  return fcl.query({
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT_ADDRESS}
      
      access(all) fun main(): {String: String} {
        let info: {String: String} = {}
        
        // Basic contract info
        info["contract"] = "FlowWager"
        info["address"] = "${FLOWWAGER_CONTRACT_ADDRESS}"
        
        // Try to get market 1
        if let market = FlowWager.getMarket(marketId: 1) {
          info["market1_exists"] = "true"
          info["market1_id"] = market.id.toString()
          info["market1_title"] = market.title
          info["market1_status"] = market.status.rawValue.toString()
          info["market1_resolved"] = market.resolved ? "true" : "false"
          info["market1_totalPool"] = market.totalPool.toString()
          info["market1_optionA"] = market.optionA
          info["market1_optionB"] = market.optionB
        } else {
          info["market1_exists"] = "false"
        }
        
        // Try to get market 2
        if let market = FlowWager.getMarket(marketId: 2) {
          info["market2_exists"] = "true"
          info["market2_title"] = market.title
        } else {
          info["market2_exists"] = "false"
        }
        
        return info
      }
    `,
  });
};

/**
 * Check what markets exist
 */
export const checkMarketRange = async () => {
  return fcl.query({
    cadence: `
      import FlowWager from ${FLOWWAGER_CONTRACT_ADDRESS}
      
      access(all) fun main(): {String: String} {
        let info: {String: String} = {}
        var foundCount = 0
        var lastFoundId = 0
        
        // Check first 20 market IDs
        var id: UInt64 = 1
        while id <= 20 {
          if FlowWager.getMarket(marketId: id) != nil {
            foundCount = foundCount + 1
            lastFoundId = Int(id)
          }
          id = id + 1
        }
        
        info["markets_found"] = foundCount.toString()
        info["last_found_id"] = lastFoundId.toString()
        info["checked_range"] = "1-20"
        
        return info
      }
    `,
  });
};