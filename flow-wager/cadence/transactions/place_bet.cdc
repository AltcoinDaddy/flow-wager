import FlowWager from "FlowWager"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

transaction(marketId: UInt64, option: UInt8, amount: UFix64) {
    let flowVault: auth(FungibleToken.Withdraw) &FlowToken.Vault
    
    prepare(signer: auth(Storage) &Account) {
        self.flowVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault")
    }
    
    execute {
        let betVault <- self.flowVault.withdraw(amount: amount) as! @FlowToken.Vault
        
        FlowWager.placeBet(
            marketId: marketId,
            option: option,
            betVault: <-betVault
        )
        
        log("Bet placed successfully!")
        log("Market ID: ".concat(marketId.toString()))
        log("Option: ".concat(option.toString()).concat(" (0=Option A, 1=Option B)"))
        log("Amount: ".concat(amount.toString()).concat(" FLOW"))
    }
}