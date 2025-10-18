import FlowUpdate from "FlowUpdate"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

// Transaction to place multiple bets on a multi-option market in a single transaction
transaction(
    marketId: UInt64,
    optionIndices: [UInt8],
    betAmounts: [UFix64]
) {

    let userVaultRef: auth(FungibleToken.Withdraw) &FlowToken.Vault
    let userPositionsRef: &FlowUpdate.MultiOptionPositions
    let signerAddress: Address

    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Store signer address for later use
        self.signerAddress = signer.address

        // Validate input arrays have same length
        if optionIndices.length != betAmounts.length {
            panic("Option indices and bet amounts arrays must have the same length")
        }

        if optionIndices.length == 0 {
            panic("Must provide at least one bet")
        }

        if optionIndices.length > 10 {
            panic("Cannot place more than 10 bets at once")
        }

        // Get reference to the signer's Flow Token Vault
        self.userVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the owner's Vault!")

        // Get reference to the signer's MultiOptionPositions resource
        self.userPositionsRef = signer.storage.borrow<&FlowUpdate.MultiOptionPositions>(from: FlowUpdate.MultiOptionPositionsStoragePath)
            ?? panic("Could not borrow MultiOptionPositions resource. Make sure to set up your account first!")

        // Calculate total bet amount needed
        var totalAmount = 0.0
        for amount in betAmounts {
            totalAmount = totalAmount + amount
        }

        // Verify the user has enough balance
        if self.userVaultRef.balance < totalAmount {
            panic("Insufficient Flow token balance. Required: ".concat(totalAmount.toString()).concat(", Available: ").concat(self.userVaultRef.balance.toString()))
        }
    }

    execute {
        // Create batch bets array
        let bets: [FlowUpdate.BatchBet] = []
        var i = 0
        while i < optionIndices.length {
            let bet = FlowUpdate.BatchBet(
                optionIndex: optionIndices[i],
                amount: betAmounts[i]
            )
            bets.append(bet)
            i = i + 1
        }

        // Create bet vaults array
        let betVaults: @[FlowToken.Vault] <- []
        for amount in betAmounts {
            let vault <- self.userVaultRef.withdraw(amount: amount) as! @FlowToken.Vault
            betVaults.append(<-vault)
        }

        // Place the batch bets
        FlowUpdate.placeBatchBets(
            marketId: marketId,
            bets: bets,
            betVaults: <-betVaults,
            userPositions: self.userPositionsRef,
            user: self.signerAddress
        )

        // Calculate total for logging
        var totalBetAmount = 0.0
        for amount in betAmounts {
            totalBetAmount = totalBetAmount + amount
        }

        log("Batch bets placed successfully!")
        log("Market ID: ".concat(marketId.toString()))
        log("Number of bets: ".concat(bets.length.toString()))
        log("Total bet amount: ".concat(totalBetAmount.toString()))
    }

    post {
        // Verify the bets were deducted from user's balance
        self.userVaultRef.balance >= 0.0: "Vault balance cannot be negative"
    }
}
