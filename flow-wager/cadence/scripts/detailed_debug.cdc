import FlowWager from "FlowWager"

access(all) struct PendingMarketDetails {
    access(all) let market: FlowWager.Market
    access(all) let evidence: FlowWager.ResolutionEvidence?
    access(all) let totalVolume: UFix64
    access(all) let participantCount: UInt64
    access(all) let daysSinceEnded: UFix64
    access(all) let hasEvidence: Bool
    
    init(
        market: FlowWager.Market,
        evidence: FlowWager.ResolutionEvidence?,
        totalVolume: UFix64,
        participantCount: UInt64,
        daysSinceEnded: UFix64,
        hasEvidence: Bool
    ) {
        self.market = market
        self.evidence = evidence
        self.totalVolume = totalVolume
        self.participantCount = participantCount
        self.daysSinceEnded = daysSinceEnded
        self.hasEvidence = hasEvidence
    }
}

access(all) fun main(): [PendingMarketDetails] {
    let allMarkets = FlowWager.getPendingResolutionMarkets()
    let pendingMarkets: [PendingMarketDetails] = []
    let currentTime = getCurrentBlock().timestamp
    
    for market in allMarkets {
        let evidence = FlowWager.getResolutionEvidence(marketId: market.id)
        if evidence != nil {
            let totalVolume = market.totalOptionAShares + market.totalOptionBShares
            let secondsSinceEnded = currentTime >= market.endTime ? currentTime - market.endTime : 0.0
            let daysSinceEnded = secondsSinceEnded / 86400.0
            let participantCount = FlowWager.getMarketParticipantCount(marketId: market.id)
            
            pendingMarkets.append(PendingMarketDetails(
                market: market,
                evidence: evidence,
                totalVolume: totalVolume,
                participantCount: participantCount,
                daysSinceEnded: daysSinceEnded,
                hasEvidence: true
            ))
        }
    }
    
    return pendingMarkets
}