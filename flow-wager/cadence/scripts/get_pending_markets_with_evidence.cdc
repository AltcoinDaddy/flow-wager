import "FlowWager"

access(all) struct PendingMarketWithEvidence {
    access(all) let market: FlowWager.Market
    access(all) let evidence: FlowWager.ResolutionEvidence?
    
    init(market: FlowWager.Market, evidence: FlowWager.ResolutionEvidence?) {
        self.market = market
        self.evidence = evidence
    }
}

access(all) fun main(): [PendingMarketWithEvidence] {
    let pendingMarkets = FlowWager.getPendingResolutionMarkets()
    let result: [PendingMarketWithEvidence] = []
    
    for market in pendingMarkets {
        let evidence = FlowWager.getResolutionEvidence(marketId: market.id)
        result.append(PendingMarketWithEvidence(market: market, evidence: evidence))
    }
    
    return result
}