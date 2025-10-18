import FlowUpdate from "FlowUpdate"

// Admin transaction to resolve a multi-option market
transaction(
    marketId: UInt64,
    winningOption: UInt8,
    justification: String
) {

    let adminRef: &FlowUpdate.Admin

    prepare(signer: auth(Storage) &Account) {
        // Get reference to the Admin resource
        self.adminRef = signer.storage.borrow<&FlowUpdate.Admin>(from: FlowUpdate.AdminStoragePath)
            ?? panic("Could not borrow Admin resource. Only admin can resolve markets!")
    }

    execute {
        // Resolve the market using the admin resource
        self.adminRef.resolveMarket(
            marketId: marketId,
            winningOption: winningOption,
            justification: justification
        )

        log("Market resolved successfully!")
        log("Market ID: ".concat(marketId.toString()))
        log("Winning Option: ".concat(winningOption.toString()))
        log("Justification: ".concat(justification))
    }


}
