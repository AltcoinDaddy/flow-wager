import "FlowWager"
import "FungibleToken"
import "FlowToken"

transaction(marketId: UInt64, option: UInt8, betAmount: UFix64) {
    let betVault: @FlowToken.Vault
    let signerAddress: Address
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Store signer address
        self.signerAddress = signer.address
        
        // Borrow the FlowToken vault with proper authorization
        let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault")
        
        // Withdraw the bet amount and cast to FlowToken.Vault
        self.betVault <- vault.withdraw(amount: betAmount) as! @FlowToken.Vault
    }
    
    execute {
        FlowWager.placeBet(
            userAddress: self.signerAddress,
            marketId: marketId,
            option: option,
            betVault: <-self.betVault
        )
        
        log("Bet placed successfully on market ".concat(marketId.toString()))
        log("Bet amount: ".concat(betAmount.toString()).concat(" FLOW"))
        log("Option selected: ".concat(option.toString()))
    }
}