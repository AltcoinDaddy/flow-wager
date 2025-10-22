import "FlowWagerV2"
import "FungibleToken"
import "FlowToken"

transaction(marketId: UInt64, optionIndex: UInt8, betAmount: UFix64) {
    let betVault: @FlowToken.Vault
    let signerAddress: Address

    prepare(signer: auth(Storage, BorrowValue) &Account) {
        self.signerAddress = signer.address

        // Borrow and withdraw from user's Flow vault
        let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault")

        self.betVault <- vault.withdraw(amount: betAmount) as! @FlowToken.Vault

        // Ensure user has UserPositions initialized
        if !signer.storage.check<@FlowWagerV2.UserPositions>(from: FlowWagerV2.UserPositionsStoragePath) {
            let userPositions <- FlowWagerV2.createUserPositions()
            signer.storage.save(<-userPositions, to: FlowWagerV2.UserPositionsStoragePath)

            let userPositionsCap = signer.capabilities.storage.issue<&{FlowWagerV2.UserPositionsPublic}>(
                FlowWagerV2.UserPositionsStoragePath
            )
            signer.capabilities.publish(userPositionsCap, at: FlowWagerV2.UserPositionsPublicPath)
        }
    }

    execute {
        // This requires a public placeBet function in FlowWagerV2
        // Currently not exposed in the contract
        panic("placeBet function not available - requires contract update")
    }
}
