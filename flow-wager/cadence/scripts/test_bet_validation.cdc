// get_pending_unresolved_markets.cdc
import "FlowWager"

// Get markets created by user that are on Pending Resolution but not resolved
access(all) fun main(creatorAddress: Address): [FlowWager.Market] {
    let allMarkets = FlowWager.getMarketsByCreator(creator: creatorAddress)
    let pendingUnresolvedMarkets: [FlowWager.Market] = []
    
    for market in allMarkets {
        if market.status == FlowWager.MarketStatus.PendingResolution && !market.resolved {
            pendingUnresolvedMarkets.append(market)
        }
    }
    
    return pendingUnresolvedMarkets
}

// Alternative with additional details
access(all) struct PendingMarketDetails {
    access(all) let market: FlowWager.Market
    access(all) let evidence: FlowWager.ResolutionEvidence?
    access(all) let daysSincePending: UFix64
    access(all) let participantCount: UInt64
    access(all) let hasEvidence: Bool
    
    init(market: FlowWager.Market, evidence: FlowWager.ResolutionEvidence?, daysSincePending: UFix64, participantCount: UInt64) {
        self.market = market
        self.evidence = evidence
        self.daysSincePending = daysSincePending
        self.participantCount = participantCount
        self.hasEvidence = evidence != nil
    }
}

access(all) fun getPendingMarketsWithDetails(creatorAddress: Address): [PendingMarketDetails] {
    let allMarkets = FlowWager.getMarketsByCreator(creator: creatorAddress)
    let pendingDetails: [PendingMarketDetails] = []
    let currentTime = getCurrentBlock().timestamp
    
    for market in allMarkets {
        if market.status == FlowWager.MarketStatus.PendingResolution && !market.resolved {
            let evidence = FlowWager.getResolutionEvidence(marketId: market.id)
            let daysSincePending = (currentTime - market.endTime) / 86400.0
            let participantCount = FlowWager.getMarketParticipantCount(marketId: market.id)
            
            pendingDetails.append(PendingMarketDetails(
                market: market,
                evidence: evidence,
                daysSincePending: daysSincePending,
                participantCount: participantCount
            ))
        }
    }
    
    return pendingDetails
}