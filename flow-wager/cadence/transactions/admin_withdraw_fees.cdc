import FlowWager from "FlowWager"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

transaction(amount: UFix64) {
    let adminRef: &FlowWager.Admin
    let flowVault: &FlowToken.Vault
    
    prepare(admin: auth(Storage) &Account) {
        self.adminRef = admin.storage.borrow<&FlowWager.Admin>(
            from: /storage/FlowWagerAdmin
        ) ?? panic("Admin resource not found")
        
        self.flowVault = admin.storage.borrow<&FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault")
    }
    
    execute {
        let fees <- self.adminRef.withdrawPlatformFees(amount: amount)
        
        let withdrawnAmount = fees.balance
        self.flowVault.deposit(from: <-fees)
        
        log("Platform fees withdrawn successfully!")
        log("Amount: ".concat(withdrawnAmount.toString()))
    }
}