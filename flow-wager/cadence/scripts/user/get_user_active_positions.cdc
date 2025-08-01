import FlowWager from "FlowWager"

access(all) struct interface ActiveTradeInterface {
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
    access(all) let currentValue: UFix64
    access(all) let profitLoss: UFix64
    access(all) let marketStatus: UInt8 // Added for debugging
    access(all) let resolved: Bool // Added for debugging
}

access(all) struct ActiveTrade: ActiveTradeInterface {
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
    access(all) let currentValue: UFix64
    access(all) let profitLoss: UFix64
    access(all) let marketStatus: UInt8
    access(all) let resolved: Bool

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
        currentValue: UFix64,
        profitLoss: UFix64,
        marketStatus: UInt8,
        resolved: Bool
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
        self.currentValue = currentValue
        self.profitLoss = profitLoss
        self.marketStatus = marketStatus
        self.resolved = resolved
    }
}

access(all) fun main(userAddress: Address): {String: AnyStruct} {
    let positions = FlowWager.getUserPositions(address: userAddress)
    let activeTrades: [ActiveTrade] = []
    var totalDeposited: UFix64 = 0.0

    for marketId in positions.keys {
        let position = positions[marketId]!
        if let market = FlowWager.getMarketById(marketId: marketId) {
            // Include Active and PendingResolution markets
            if !market.resolved && (market.status == FlowWager.MarketStatus.Active || market.status == FlowWager.MarketStatus.PendingResolution) {
                let totalShares = position.optionAShares + position.optionBShares
                let currentValue = totalShares // Simplified: assumes 1:1 share value
                let profitLoss: UFix64 = currentValue >= position.totalInvested
                    ? currentValue - position.totalInvested
                    : position.totalInvested - currentValue
                activeTrades.append(ActiveTrade(
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
                    currentValue: currentValue,
                    profitLoss: profitLoss,
                    marketStatus: market.status.rawValue,
                    resolved: market.resolved
                ))
                totalDeposited = totalDeposited + position.totalInvested
            }
        }
    }

    return {
        "activeTrades": activeTrades as [AnyStruct],
        "totalDeposited": totalDeposited as AnyStruct
    }
}