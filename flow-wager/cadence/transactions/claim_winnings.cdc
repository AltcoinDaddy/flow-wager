import FlowWager from "FlowWager"
import FlowToken from "FlowToken" 
import FungibleToken from "FungibleToken"

/// Transaction for a user to claim their winnings from a resolved market
/// @param marketId: The ID of the market to claim winnings from
transaction(marketId: UInt64) {
    let userPositionsCap: Capability<&FlowWager.UserPositions>
    let flowReceiver: &{FungibleToken.Receiver}
    let signerAddress: Address
    
    prepare(signer: auth(Storage) &Account) {
        // Store the signer's address for use in execute
        self.signerAddress = signer.address
        
        // Get the UserPositions capability using Cadence 1.0 API
        self.userPositionsCap = signer.capabilities.get<&FlowWager.UserPositions>(FlowWager.UserPositionsPublicPath)
        
        // Ensure the capability is valid
        if !self.userPositionsCap.check() {
            panic("UserPositions capability is not valid. User may not be properly initialized.")
        }
        
        // Get the Flow token receiver capability using Cadence 1.0 API
        self.flowReceiver = signer.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow()
            ?? panic("Could not borrow Flow token receiver capability")
    }
    
    execute {
        // Claim the winnings
        let winningsVault <- FlowWager.claimWinnings(
            marketId: marketId,
            claimerAddress: self.signerAddress,
            userPositionsCap: self.userPositionsCap
        )
        
        // Deposit the winnings into the user's Flow vault
        self.flowReceiver.deposit(from: <-winningsVault)
        
        log("Successfully claimed winnings for market ID: ".concat(marketId.toString()))
    }
}