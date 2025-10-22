import "FlowWagerV2"
import "FungibleToken"
import "FlowToken"

transaction(
    title: String,
    description: String,
    categoryRaw: UInt8,
    options: [String],
    endTime: UFix64,
    minBet: UFix64,
    maxBet: UFix64,
    imageUrl: String
) {
    let flowVault: @FlowToken.Vault?
    let signerAddress: Address
    let isDeployer: Bool

    prepare(signer: auth(BorrowValue, StorageCapabilities) &Account) {
        self.signerAddress = signer.address

        let deployerAddress = FlowWagerV2.deployerAddress
        self.isDeployer = signer.address == deployerAddress

        // Only prepare creation fee if user is NOT the deployer
        if !self.isDeployer {
            let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow FlowToken vault")

            let marketCreationFee = FlowWagerV2.marketCreationFee
            self.flowVault <- vault.withdraw(amount: marketCreationFee) as! @FlowToken.Vault

            log("Creation fee of ".concat(marketCreationFee.toString()).concat(" FLOW will be charged"))
        } else {
            self.flowVault <- nil
            log("No creation fee required for deployer")
        }
    }

    execute {
        let marketId = FlowWagerV2.createMarket(
            title: title,
            description: description,
            category: FlowWagerV2.MarketCategory(rawValue: categoryRaw)!,
            options: options,
            endTime: endTime,
            minBet: minBet,
            maxBet: maxBet,
            imageUrl: imageUrl,
            creationFeeVault: <-self.flowVault,
            address: self.signerAddress
        )

        log("Market created with ID: ".concat(marketId.toString()))
        log("Total options: ".concat(UInt8(options.length).toString()))
    }
}
