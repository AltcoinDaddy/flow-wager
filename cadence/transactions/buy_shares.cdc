// cadence/transactions/buy_shares.cdc
// Transaction to buy shares in a prediction market - Proper Cadence 1.0

import FlowWager from "FlowWager"

transaction(marketId: UInt64, isOptionA: Bool, amount: UFix64) {
    
    let signerAddress: Address
    
    prepare(signer: &Account) {
        // Store signer address for later use
        self.signerAddress = signer.address
        
        // Basic validation
        if amount <= 0.0 {
            panic("Amount must be greater than 0")
        }
    }
    
    execute {
        // Purchase shares in the market
        FlowWager.buyShares(
            marketId: marketId,
            isOptionA: isOptionA,
            amount: amount
        )
        
        log("Successfully purchased ".concat(amount.toString()).concat(" worth of shares in market ").concat(marketId.toString()))
        
        if isOptionA {
            log("Option selected: A")
        } else {
            log("Option selected: B")
        }
    }
    
    post {
        let market = FlowWager.getMarket(marketId: marketId)
        assert(
            market != nil,
            message: "Market does not exist"
        )
        
        log("Transaction completed successfully for market ".concat(marketId.toString()))
    }
}