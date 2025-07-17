import FlowWager from "FlowWager"

transaction(
    marketId: UInt64,
    evidence: String,
    requestedOutcome: UInt8
) {
    prepare(signer: auth(Storage) &Account) {}
    
    execute {
        FlowWager.submitResolutionEvidence(
            marketId: marketId,
            evidence: evidence,
            requestedOutcome: requestedOutcome
        )
        
        log("Evidence submitted successfully!")
        log("Market ID: ".concat(marketId.toString()))
        log("Requested Outcome: ".concat(requestedOutcome.toString()))
    }
}