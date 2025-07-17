import FlowWager from "FlowWager"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

transaction(
    title: String,
    description: String,
    category: UInt8,
    optionA: String,
    optionB: String,
    endTime: UFix64,
    minBet: UFix64,
    maxBet: UFix64,
    imageUrl: String
) {
    let flowVault: auth(FungibleToken.Withdraw) &FlowToken.Vault?
    
    prepare(signer: auth(Storage) &Account) {
        // Check if this is the deployer (no fee required)
        if signer.address == 0xb17b2ac32498a3f9 {
            self.flowVault = nil
        } else {
            self.flowVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow FlowToken vault")
        }
    }
    
    execute {
        // Prepare creation fee vault
        var creationFeeVault: @FlowToken.Vault? <- nil
        
        if let vault = self.flowVault {
            creationFeeVault <-! vault.withdraw(amount: 10.0) as! @FlowToken.Vault
        }
        
        let marketCategory = FlowWager.MarketCategory(rawValue: category)!
        
        // Call createMarket WITHOUT imageUrl parameter (since your contract doesn't support it yet)nil, // Not stored in the contract
        let marketId = FlowWager.createMarket(
            title: title,
            description: description,
            category: marketCategory,
            optionA: optionA,
            optionB: optionB,
            endTime: endTime,
            minBet: minBet,
            maxBet: maxBet,
            imageUrl: imageUrl,
            creationFeeVault: <-creationFeeVault
        )
        
        log("Market created with ID: ".concat(marketId.toString()))
        log("Image URL (not stored): ".concat(imageUrl))
    }
}