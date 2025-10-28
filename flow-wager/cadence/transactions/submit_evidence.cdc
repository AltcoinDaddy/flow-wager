import FlowWagerV2 from "FlowWagerV2"

// This transaction allows a market's creator to submit evidence for resolution.
transaction(
    marketId: UInt64,
    evidence: String,
    requestedWinningOption: UInt8 // The index of the option they claim won
) {
    let creatorAddress: Address

    prepare(signer: &Account) {
        self.creatorAddress = signer.address

        // Verify the signer is the market creator
        let market = FlowWagerV2.getMarketById(marketId: marketId)
            ?? panic("Market does not exist")
        assert(
            market.creator == self.creatorAddress,
            message: "Only the market creator can submit evidence"
        )
    }

    execute {
        FlowWagerV2.submitEvidence(
            marketId: marketId,
            evidence: evidence,
            requestedWinningOption: requestedWinningOption,
            creatorAddress: self.creatorAddress
        )

        log("Evidence submitted successfully for market ID: ".concat(marketId.toString()))
    }
}
