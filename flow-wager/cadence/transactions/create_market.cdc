import "FlowWagerV2"
import "FungibleToken"
import "FlowToken"

transaction(
        title: String,
        description: String,
        categoryRaw: UInt8,
        options: [String], // Use options array
        endTime: UFix64,
        minBet: UFix64,
        maxBet: UFix64,
        imageUrl: String
        // 9th argument (creationFeeAmount) removed to match your 8-arg JS call
    ) {
        let feeVault: @FlowToken.Vault?
        let category: FlowWagerV2.MarketCategory
        let signerAddress: Address

        prepare(signer: auth(Storage) &Account) {
            self.category = FlowWagerV2.MarketCategory(rawValue: categoryRaw)
                ?? panic("Invalid market category raw value: ".concat(categoryRaw.toString()))
            self.signerAddress = signer.address

            let feeAmount = FlowWagerV2.marketCreationFee
            let deployerAddress = FlowWagerV2.deployerAddress

            if self.signerAddress == deployerAddress || feeAmount <= 0.0 {
                log("No market creation fee required.")
                self.feeVault <- nil
            } else {
                log("Preparing market creation fee vault...")
                let mainVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
                    ?? panic("Could not borrow authorized FlowToken vault from /storage/flowTokenVault.")

                assert(mainVault.balance >= feeAmount, message: "Insufficient FLOW balance for market creation fee.")
                self.feeVault <- mainVault.withdraw(amount: feeAmount) as! @FlowToken.Vault
                log("Fee vault prepared.")
            }
        }

        execute {
            log("Executing V2 market creation...")
            // Call the V2 createMarket function in the contract
            let marketId = FlowWagerV2.createMarket(
                title: title,
                description: description,
                category: self.category,
                options: options, // Pass the array
                endTime: endTime,
                minBet: minBet,
                maxBet: maxBet,
                imageUrl: imageUrl,
                creationFeeVault: <-self.feeVault,
                address: self.signerAddress
            )
            log("V2 Market created successfully with ID: ".concat(marketId.toString()))
        }
    }
