import FlowWager from "FlowWager"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

transaction(marketId: UInt64) {
    let flowVault: &FlowToken.Vault
    
    prepare(signer: auth(Storage) &Account) {
        self.flowVault = signer.storage.borrow<&FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault")
    }
    
    execute {
        let winnings <- FlowWager.claimWinnings(marketId: marketId)
        
        let amount = winnings.balance
        self.flowVault.deposit(from: <-winnings)
        
        log("Winnings claimed successfully!")
        log("Market ID: ".concat(marketId.toString()))
        log("Amount: ".concat(amount.toString()))
    }
}