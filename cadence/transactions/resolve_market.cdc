// cadence/transactions/resolve_market.cdc
// Transaction to resolve a prediction market (Admin only)

import FlowWager from "FlowWager"

transaction(marketId: UInt64, outcome: UInt8) {
    
    let adminRef: &FlowWager.Admin
    
    prepare(signer: AuthAccount) {
        // Get reference to the Admin resource
        self.adminRef = signer.borrow<&FlowWager.Admin>(from: FlowWager.AdminStoragePath)
            ?? panic("Could not borrow Admin reference. Only admins can resolve markets.")
    }
    
    pre {
        outcome == 1 || outcome == 2: "Outcome must be 1 (Option A) or 2 (Option B)"
    }
    
    execute {
        // Get market details before resolution for logging
        let market = FlowWager.getMarket(marketId: marketId)
            ?? panic("Market with ID ".concat(marketId.toString()).concat(" does not exist"))
        
        // Verify market can be resolved
        assert(
            market.status == FlowWager.MarketStatus.PENDING,
            message: "Market is not in PENDING status. Current status: ".concat(market.status.rawValue.toString())
        )
        
        assert(
            !market.resolved,
            message: "Market is already resolved"
        )
        
        // Convert outcome UInt8 to MarketOutcome enum
        let outcomeEnum = FlowWager.MarketOutcome(rawValue: outcome)
            ?? panic("Invalid outcome value")
        
        // Resolve the market
        self.adminRef.resolveMarket(marketId: marketId, outcome: outcomeEnum)
        
        let winningOption = outcome == 1 ? market.optionA : market.optionB
        
        log("Market resolved successfully")
        log("Market ID: ".concat(marketId.toString()))
        log("Question: ".concat(market.question))
        log("Winning option: ".concat(winningOption))
        log("Total pool: ".concat(market.totalPool.toString()).concat(" FLOW"))
        log("Total participants: ".concat((market.totalOptionAShares + market.totalOptionBShares > 0.0 ? "Yes" : "No")))
    }
    
    post {
        // Verify the market was resolved
        let resolvedMarket = FlowWager.getMarket(marketId: marketId)!
        assert(resolvedMarket.resolved, message: "Market was not resolved successfully")
        assert(resolvedMarket.status == FlowWager.MarketStatus.RESOLVED, message: "Market status was not updated to RESOLVED")
        assert(resolvedMarket.outcome.rawValue == outcome, message: "Market outcome was not set correctly")
    }
}