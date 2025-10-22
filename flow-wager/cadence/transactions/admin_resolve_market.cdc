import FlowWagerV2 from "FlowWagerV2"

// This transaction allows the ADMIN to resolve a market.
transaction(
    marketId: UInt64,
    winningOptionIndex: UInt8,
    justification: String
) {
    let adminRef: &FlowWagerV2.Admin

    // Use the Cadence 1.0 'auth(Storage)' syntax to grant storage capabilities
    prepare(signer: auth(Storage) &Account) {

        // Borrow the Admin resource from the signer's storage
        self.adminRef = signer.storage.borrow<&FlowWagerV2.Admin>(from: FlowWagerV2.AdminStoragePath)
            ?? panic("Could not borrow Admin resource. Make sure you are the admin.")
    }

    execute {
        self.adminRef.resolveMarket(
            marketId: marketId,
            winningOptionIndex: winningOptionIndex,
            justification: justification
        )

        log("Market ".concat(marketId.toString()).concat(" resolved. Winning option: ").concat(winningOptionIndex.toString()))
    }
}
