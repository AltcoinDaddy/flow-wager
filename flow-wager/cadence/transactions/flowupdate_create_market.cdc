import FlowUpdate from "FlowUpdate"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

// Transaction to create a multi-option market
transaction(
    title: String,
    description: String,
    category: UInt8,
    options: [String],
    endTime: UFix64,
    minBet: UFix64,
    maxBet: UFix64,
    imageUrl: String,
    creationFeeAmount: UFix64?
) {

    let creatorVaultRef: auth(FungibleToken.Withdraw) &FlowToken.Vault
    let signerAddress: Address

    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Store signer address for later use
        self.signerAddress = signer.address

        // Get reference to the signer's Flow Token Vault
        self.creatorVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the owner's Vault!")
    }

    execute {
        // Prepare creation fee vault if amount is provided
        var creationFeeVault: @FlowToken.Vault? <- nil
        if let feeAmount = creationFeeAmount {
            if feeAmount > 0.0 {
                creationFeeVault <-! self.creatorVaultRef.withdraw(amount: feeAmount) as! @FlowToken.Vault
            }
        }

        // Convert category UInt8 to MultiMarketCategory enum
        let marketCategory = FlowUpdate.MultiMarketCategory(rawValue: category)
            ?? panic("Invalid market category")

        // Create the multi-option market
        let marketId = FlowUpdate.createMultiOptionMarket(
            title: title,
            description: description,
            category: marketCategory,
            options: options,
            endTime: endTime,
            minBet: minBet,
            maxBet: maxBet,
            imageUrl: imageUrl,
            creator: self.signerAddress,
            creationFeeVault: <-creationFeeVault
        )

        log("Multi-option market created with ID: ".concat(marketId.toString()))
        log("Market title: ".concat(title))
        log("Number of options: ".concat(options.length.toString()))
    }
}
