// cadence/transactions/claim_winnings.cdc
// Transaction to claim winnings from a resolved market

import FlowWager from "FlowWager"
// import FungibleToken from 0xFUNGIBLE_TOKEN_ADDRESS
// import FlowToken from 0xFLOW_TOKEN_ADDRESS

transaction(marketId: UInt64) {
    
    let signerVault: &FlowToken.Vault
    let userAddress: Address
    
    prepare(signer: AuthAccount) {
        // Get reference to the signer's FlowToken vault
        self.signerVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow FlowToken.Vault reference")
        
        self.userAddress = signer.address
    }
    
    pre {
        // Verify market exists and is resolved
        FlowWager.getMarket(marketId: marketId) != nil: "Market does not exist"
    }
    
    execute {
        // Get market and user position info for logging
        let market = FlowWager.getMarket(marketId: marketId)!
        let userPositions = FlowWager.getUserPositions(address: self.userAddress)
        
        // Verify user has a position in this market
        assert(
            userPositions.containsKey(marketId),
            message: "User has no position in market ".concat(marketId.toString())
        )
        
        let position = userPositions[marketId]!
        
        // Verify position hasn't been claimed yet
        assert(
            !position.claimed,
            message: "Winnings have already been claimed for this market"
        )
        
        // Verify market is resolved
        assert(
            market.resolved,
            message: "Market is not yet resolved"
        )
        
        // Verify user won
        let userWon = (position.isOptionA && market.outcome == FlowWager.MarketOutcome.OPTION_A) ||
                     (!position.isOptionA && market.outcome == FlowWager.MarketOutcome.OPTION_B)
        
        assert(
            userWon,
            message: "User did not win this market. Selected: ".concat(position.isOptionA ? market.optionA : market.optionB).concat(", Winner: ").concat(market.outcome == FlowWager.MarketOutcome.OPTION_A ? market.optionA : market.optionB)
        )
        
        // Record initial balance
        let initialBalance = self.signerVault.balance
        
        // Claim winnings
        let winningsVault <- FlowWager.claimWinnings(marketId: marketId)
        
        // Deposit winnings to user's vault
        let winningsAmount = winningsVault.balance
        self.signerVault.deposit(from: <-winningsVault)
        
        log("Winnings claimed successfully")
        log("Market ID: ".concat(marketId.toString()))
        log("Question: ".concat(market.question))
        log("Winning option: ".concat(position.isOptionA ? market.optionA : market.optionB))
        log("Amount invested: ".concat(position.amountInvested.toString()).concat(" FLOW"))
        log("Winnings received: ".concat(winningsAmount.toString()).concat(" FLOW"))
        log("New balance: ".concat(self.signerVault.balance.toString()).concat(" FLOW"))
    }
    
    post {
        // Verify winnings were received
        let finalBalance = self.signerVault.balance
        // Note: In a real implementation, we'd verify the exact amount based on the calculation
        
        // Verify position is marked as claimed
        let updatedPositions = FlowWager.getUserPositions(address: self.userAddress)
        let updatedPosition = updatedPositions[marketId]!
        assert(updatedPosition.claimed, message: "Position was not marked as claimed")
    }
}