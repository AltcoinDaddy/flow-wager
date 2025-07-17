import FlowWager from "FlowWager"

transaction(
    marketId: UInt64,
    rejectionReason: String
) {
    prepare(signer: auth(Storage) &Account) {}
    
    execute {
        FlowWager.rejectEvidence(
            marketId: marketId,
            rejectionReason: rejectionReason
        )
        
        log("Evidence rejected successfully!")
        log("Market ID: ".concat(marketId.toString()))
        log("Reason: ".concat(rejectionReason))
    }
}