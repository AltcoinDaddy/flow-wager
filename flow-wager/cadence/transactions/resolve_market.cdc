import FlowWager from "FlowWager"

transaction(
    marketId: UInt64,
    outcome: UInt8,
    justification: String
) {
    prepare(signer: auth(Storage) &Account) {}
    
    execute {
        FlowWager.resolveMarket(
            marketId: marketId,
            outcome: outcome,
            justification: justification
        )
        
        log("Market resolved successfully!")
        log("Market ID: ".concat(marketId.toString()))
        log("Outcome: ".concat(outcome.toString()))
        log("Justification: ".concat(justification))
    }
}