import FlowUpdate from "FlowUpdate"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

// Transaction to place a single bet on a multi-option market
transaction(
    marketId: UInt64,
    optionIndex: UInt8,
    betAmount: UFix64
) {

    let userVaultRef: auth(FungibleToken.Withdraw) &FlowToken.Vault
    let userPositionsRef: &FlowUpdate.MultiOptionPositions
    let signerAddress: Address

    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Store signer address for later use
        self.signerAddress = signer.address

        // Get reference to the signer's Flow Token Vault
        self.userVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the owner's Vault!")

        // Get reference to the signer's MultiOptionPositions resource
        self.userPositionsRef = signer.storage.borrow<&FlowUpdate.MultiOptionPositions>(from: FlowUpdate.MultiOptionPositionsStoragePath)
            ?? panic("Could not borrow MultiOptionPositions resource. Make sure to set up your account first!")

        // Verify the user has enough balance
        if self.userVaultRef.balance < betAmount {
            panic("Insufficient Flow token balance. Required: ".concat(betAmount.toString()).concat(", Available: ").concat(self.userVaultRef.balance.toString()))
        }
    }

    execute {
        // Withdraw the bet amount from user's vault
        let betVault <- self.userVaultRef.withdraw(amount: betAmount) as! @FlowToken.Vault

        // Place the bet
        FlowUpdate.placeBet(
            marketId: marketId,
            optionIndex: optionIndex,
            betVault: <-betVault,
            userPositions: self.userPositionsRef,
            user: self.signerAddress
        )

        log("Bet placed successfully!")
        log("Market ID: ".concat(marketId.toString()))
        log("Option Index: ".concat(optionIndex.toString()))
        log("Bet Amount: ".concat(betAmount.toString()))
    }

    post {
        // Verify the bet was deducted from user's balance
        self.userVaultRef.balance >= 0.0: "Vault balance cannot be negative"
    }
}
