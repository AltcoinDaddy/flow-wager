import FungibleToken from "FungibleToken"   // Replace with FungibleToken address
import FlowToken from "FlowToken"           // Replace with FlowToken address
import FlowWagerV2 from "FlowWagerV2"         // Replace with your FlowWagerV2 address

// This transaction allows a user to place a bet on a market
transaction(marketId: UInt64, optionIndex: UInt8, betAmount: UFix64) {

let bettorAddress: Address
    let paymentVault: @FlowToken.Vault
    let userPositionsRef: &FlowWagerV2.UserPositions

    prepare(signer: auth(Storage) &Account) {
        self.bettorAddress = signer.address



        // 2. Get the user's main FLOW vault

        // --- THIS IS THE FIX ---
        // We must borrow the reference and explicitly authorize it with the 'Withdraw' entitlement
        let mainVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow authorized FlowToken vault from /storage/flowTokenVault.")

        // 3. Withdraw the bet amount (this will now work)
        assert(mainVault.balance >= betAmount, message: "Insufficient FLOW balance to place this bet")
        self.paymentVault <- mainVault.withdraw(amount: betAmount) as! @FlowToken.Vault

        // 4. Get the user's UserPositions resource
        // This borrow doesn't need special auth because we're just passing the reference,
        // and the contract will call the public 'addPosition' function.
        self.userPositionsRef = signer.storage.borrow<&FlowWagerV2.UserPositions>(from: FlowWagerV2.UserPositionsStoragePath)
            ?? panic("Could not borrow UserPositions resource. Has the user set up their account?")
    }

    execute {
        // 5. Call the main contract function to purchase the shares
        FlowWagerV2.purchaseShares(
            marketId: marketId,
            optionIndex: optionIndex,
            payment: <-self.paymentVault,
            bettorAddress: self.bettorAddress,
            userPositions: self.userPositionsRef
        )

        log("Bet placed successfully! Market: ".concat(marketId.toString()).concat(", Option: ").concat(optionIndex.toString()).concat(", Amount: ").concat(betAmount.toString()))
    }
}
