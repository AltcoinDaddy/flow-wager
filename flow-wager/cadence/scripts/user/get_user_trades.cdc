import FlowWager from "FlowWager"
import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

access(all) struct TradeDetails {
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
    access(all) let profitLoss: Fix64

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
        profitLoss: Fix64
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
    }
}

access(all) struct UserTrades {
    access(all) let activeTrades: [TradeDetails]
    access(all) let totalDeposited: UFix64

    init(activeTrades: [TradeDetails], totalDeposited: UFix64) {
        self.activeTrades = activeTrades
        self.totalDeposited = totalDeposited
    }
}

access(all) fun calculateCurrentValue(
    position: FlowWager.UserPosition,
    market: FlowWager.Market
): UFix64 {
    let totalShares = position.optionAShares + position.optionBShares
    if totalShares == 0.0 {
        return 0.0
    }
    
    let totalMarketShares = market.totalOptionAShares + market.totalOptionBShares
    if totalMarketShares == 0.0 {
        return position.totalInvested
    }
    
    let shareRatio = totalShares / totalMarketShares
    let distributablePool = market.totalPool * (1.0 - (FlowWager.platformFeePercentage / 100.0))
    
    return distributablePool * shareRatio
}

access(all) fun main(userAddress: Address): UserTrades {
    let positionsDict = FlowWager.getUserPositions(address: userAddress)
    var activeTrades: [TradeDetails] = []
    var totalDeposited: UFix64 = 0.0
    
    for marketId in positionsDict.keys {
        if let market = FlowWager.getMarketById(marketId: marketId) {
            if market.status == FlowWager.MarketStatus.Active {
                let position = positionsDict[marketId]!
                
                let currentValue = calculateCurrentValue(position: position, market: market)
                let profitLoss = Fix64(currentValue) - Fix64(position.totalInvested)
                
                activeTrades.append(TradeDetails(
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
                    profitLoss: profitLoss
                ))
            }
            // Sum totalInvested for all positions (active or not)
            totalDeposited = totalDeposited + positionsDict[marketId]!.totalInvested
        }
    }
    
    return UserTrades(activeTrades: activeTrades, totalDeposited: totalDeposited)
}