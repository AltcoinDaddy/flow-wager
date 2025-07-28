import "FlowWager"
import "FungibleToken"
import "FlowToken"

transaction(marketId: UInt64) {
    let flowVault: &FlowToken.Vault
    let signerAddress: Address
    let userPositionsCap: Capability<&FlowWager.UserPositions>
    
    prepare(signer: auth(BorrowValue, Capabilities) &Account) {
        self.signerAddress = signer.address
        
        // Get the vault to receive winnings
        self.flowVault = signer.storage.borrow<&FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault")
        
        // Get the UserPositions capability
        self.userPositionsCap = signer.capabilities.storage.issue<&FlowWager.UserPositions>(
            FlowWager.UserPositionsStoragePath
        )
        
        // Verify the capability is valid
        assert(
            self.userPositionsCap.check(),
            message: "UserPositions capability is not valid. Make sure you're registered and have initialized your account."
        )
    }
    
    execute {
        // Claim winnings for the specific market
        let winnings <- FlowWager.claimWinnings(
            marketId: marketId,
            claimerAddress: self.signerAddress,
            userPositionsCap: self.userPositionsCap
        )
        
        // Deposit the winnings to user's vault
        self.flowVault.deposit(from: <-winnings)
        
        log("Successfully claimed winnings for market ".concat(marketId.toString()))
    }
}