import "FlowWager"
import "FungibleToken"
import "FlowToken"

transaction(
    title: String,
    description: String,
    categoryRaw: UInt8,
    optionA: String,
    optionB: String,
    endTime: UFix64,
    minBet: UFix64,
    maxBet: UFix64,
    imageUrl: String
) {
    let flowVault: @FlowToken.Vault?
    let category: FlowWager.MarketCategory
    let signerAddress: Address
    let isDeployer: Bool
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Store the category and signer address for use in execute
        self.category = FlowWager.MarketCategory(rawValue: categoryRaw)!
        self.signerAddress = signer.address
        
        // Check if signer is the deployer (gets contract deployer address)
        let deployerAddress = FlowWager.deployerAddress
        self.isDeployer = signer.address == deployerAddress
        
        // Only prepare creation fee if user is NOT the deployer
        if !self.isDeployer {
            let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow FlowToken vault")
            
            // Get the current market creation fee from contract
            let marketCreationFee = FlowWager.marketCreationFee
            self.flowVault <- vault.withdraw(amount: marketCreationFee) as! @FlowToken.Vault
            
            log("Creation fee of ".concat(marketCreationFee.toString()).concat(" FLOW will be charged"))
        } else {
            self.flowVault <- nil
            log("No creation fee required for deployer")
        }
    }
    
    execute {
        let marketId = FlowWager.createMarket(
            title: title,
            description: description,
            category: self.category,
            optionA: optionA,
            optionB: optionB,
            endTime: endTime,
            minBet: minBet,
            maxBet: maxBet,
            imageUrl: imageUrl,
            creationFeeVault: <-self.flowVault,
            address: self.signerAddress
        )
        
        log("Market created with ID: ".concat(marketId.toString()))
    }
}