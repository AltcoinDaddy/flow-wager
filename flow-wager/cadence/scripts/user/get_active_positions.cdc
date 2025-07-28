import FlowWager from "FlowWager"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

access(all) struct PositionDetails {
    access(all) let marketId: UInt64
    access(all) let marketTitle: String
    access(all) let marketDescription: String
    access(all) let optionA: String
    access(all) let optionB: String
    access(all) let optionAShares: UFix64
    access(all) let optionBShares: UFix64
    access(all) let totalInvested: UFix64
    access(all) let averagePrice: UFix64
    access(all) let endTime: UFix64
    access(all) let status: FlowWager.MarketStatus
    access(all) let currentValue: UFix64
    access(all) let profitLoss: Fix64
    access(all) let claimableAmount: UFix64
    access(all) let claimed: Bool

    init(
        marketId: UInt64,
        marketTitle: String,
        marketDescription: String,
        optionA: String,
        optionB: String,
        optionAShares: UFix64,
        optionBShares: UFix64,
        totalInvested: UFix64,
        averagePrice: UFix64,
        endTime: UFix64,
        status: FlowWager.MarketStatus,
        currentValue: UFix64,
        profitLoss: Fix64,
        claimableAmount: UFix64,
        claimed: Bool
    ) {
        self.marketId = marketId
        self.marketTitle = marketTitle
        self.marketDescription = marketDescription
        self.optionA = optionA
        self.optionB = optionB
        self.optionAShares = optionAShares
        self.optionBShares = optionBShares
        self.totalInvested = totalInvested
        self.averagePrice = averagePrice
        self.endTime = endTime
        self.status = status
        self.currentValue = currentValue
        self.profitLoss = profitLoss
        self.claimableAmount = claimableAmount
        self.claimed = claimed
    }
}

access(all) fun calculateCurrentValue(
    position: FlowWager.UserPosition,
    market: FlowWager.Market,
    claimableWinnings: {UInt64: UFix64}
): UFix64 {
    let totalShares = position.optionAShares + position.optionBShares
    if totalShares == 0.0 {
        return 0.0
    }
    
    if market.resolved {
        // For resolved markets, use claimable winnings if available
        return claimableWinnings[market.id] ?? 0.0
    }
    
    // For active markets, estimate value based on share proportion
    let totalMarketShares = market.totalOptionAShares + market.totalOptionBShares
    if totalMarketShares == 0.0 {
        return position.totalInvested
    }
    
    let shareRatio = totalShares / totalMarketShares
    let distributablePool = market.totalPool * (1.0 - (FlowWager.platformFeePercentage / 100.0))
    
    return distributablePool * shareRatio
}

access(all) fun main(userAddress: Address): [PositionDetails] {
    // Get all user positions
    let positionsDict = FlowWager.getUserPositions(address: userAddress)
    
    // Get claimable winnings to determine payouts for resolved markets
    let claimableWinningsRaw = FlowWager.getClaimableWinnings(address: userAddress)
    let claimableWinnings: {UInt64: UFix64} = {}
    for cw in claimableWinningsRaw {
        claimableWinnings[cw.marketId] = cw.amount
    }
    
    var positionDetails: [PositionDetails] = []
    
    for marketId in positionsDict.keys {
        if let market = FlowWager.getMarketById(marketId: marketId) {
            let position = positionsDict[marketId]!
            
            let currentValue = calculateCurrentValue(
                position: position,
                market: market,
                claimableWinnings: claimableWinnings
            )
            let profitLoss = Fix64(currentValue) - Fix64(position.totalInvested)
            let claimableAmount = market.resolved && !position.claimed
                ? claimableWinnings[marketId] ?? 0.0
                : 0.0
            
            positionDetails.append(PositionDetails(
                marketId: marketId,
                marketTitle: market.title,
                marketDescription: market.description,
                optionA: market.optionA,
                optionB: market.optionB,
                optionAShares: position.optionAShares,
                optionBShares: position.optionBShares,
                totalInvested: position.totalInvested,
                averagePrice: position.averagePrice,
                endTime: market.endTime,
                status: market.status,
                currentValue: currentValue,
                profitLoss: profitLoss,
                claimableAmount: claimableAmount,
                claimed: position.claimed
            ))
        }
    }
    
    return positionDetails
}

access(all) fun getSignificantPositions(userAddress: Address, minInvestment: UFix64): [PositionDetails] {
    let allPositions = main(userAddress: userAddress)
    var significantPositions: [PositionDetails] = []
    
    for position in allPositions {
        if position.totalInvested >= minInvestment {
            significantPositions.append(position)
        }
    }
    
    return significantPositions
}