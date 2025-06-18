// cadence/scripts/get_market.cdc
// Script to get details of a specific market - Fixed for Cadence 1.0

import FlowWager from "FlowWager"

access(all) fun main(marketId: UInt64): MarketInfo? {
    let market = FlowWager.getMarket(marketId: marketId)
    
    if market == nil {
        return nil
    }
    
    let m = market!
    
    return MarketInfo(
        id: m.id,
        creator: m.creator,
        question: "Market Question", // Placeholder - replace with actual property
        optionA: m.optionA,
        optionB: m.optionB,
        category: m.category.rawValue,
        categoryName: getCategoryName(m.category.rawValue),
        imageURI: "", // Placeholder - replace with actual property
        endTime: m.endTime,
        creationTime: 0.0, // Placeholder - replace with actual property
        outcome: m.outcome?.rawValue ?? 255,
        totalOptionAShares: m.totalOptionAShares,
        totalOptionBShares: m.totalOptionBShares,
        resolved: m.resolved,
        status: m.status.rawValue,
        statusName: getStatusName(m.status.rawValue),
        totalPool: m.totalPool,
        isBreakingNews: m.category.rawValue == 4, // Use category as proxy
        minBet: 1.0, // Placeholder - replace with actual property
        maxBet: 10000.0, // Placeholder - replace with actual property
        oddsA: calculateOddsA(m),
        oddsB: calculateOddsB(m),
        timeRemaining: calculateTimeRemaining(m),
        isActive: m.status.rawValue == 0, // 0 = Active status
        canBet: m.status.rawValue == 0 && getCurrentBlock().timestamp < m.endTime
    )
}

access(all) struct MarketInfo {
    access(all) let id: UInt64
    access(all) let creator: Address
    access(all) let question: String
    access(all) let optionA: String
    access(all) let optionB: String
    access(all) let category: UInt8
    access(all) let categoryName: String
    access(all) let imageURI: String
    access(all) let endTime: UFix64
    access(all) let creationTime: UFix64
    access(all) let outcome: UInt8
    access(all) let totalOptionAShares: UFix64
    access(all) let totalOptionBShares: UFix64
    access(all) let resolved: Bool
    access(all) let status: UInt8
    access(all) let statusName: String
    access(all) let totalPool: UFix64
    access(all) let isBreakingNews: Bool
    access(all) let minBet: UFix64
    access(all) let maxBet: UFix64
    access(all) let oddsA: UFix64
    access(all) let oddsB: UFix64
    access(all) let timeRemaining: UFix64
    access(all) let isActive: Bool
    access(all) let canBet: Bool
    
    init(
        id: UInt64,
        creator: Address,
        question: String,
        optionA: String,
        optionB: String,
        category: UInt8,
        categoryName: String,
        imageURI: String,
        endTime: UFix64,
        creationTime: UFix64,
        outcome: UInt8,
        totalOptionAShares: UFix64,
        totalOptionBShares: UFix64,
        resolved: Bool,
        status: UInt8,
        statusName: String,
        totalPool: UFix64,
        isBreakingNews: Bool,
        minBet: UFix64,
        maxBet: UFix64,
        oddsA: UFix64,
        oddsB: UFix64,
        timeRemaining: UFix64,
        isActive: Bool,
        canBet: Bool
    ) {
        self.id = id
        self.creator = creator
        self.question = question
        self.optionA = optionA
        self.optionB = optionB
        self.category = category
        self.categoryName = categoryName
        self.imageURI = imageURI
        self.endTime = endTime
        self.creationTime = creationTime
        self.outcome = outcome
        self.totalOptionAShares = totalOptionAShares
        self.totalOptionBShares = totalOptionBShares
        self.resolved = resolved
        self.status = status
        self.statusName = statusName
        self.totalPool = totalPool
        self.isBreakingNews = isBreakingNews
        self.minBet = minBet
        self.maxBet = maxBet
        self.oddsA = oddsA
        self.oddsB = oddsB
        self.timeRemaining = timeRemaining
        self.isActive = isActive
        self.canBet = canBet
    }
}

access(all) fun getCategoryName(_ categoryRawValue: UInt8): String {
    switch categoryRawValue {
        case 0:
            return "Sports"
        case 1:
            return "Politics"
        case 2:
            return "Entertainment"
        case 3:
            return "Technology"
        case 4:
            return "Breaking News"
        case 5:
            return "Crypto"
        case 6:
            return "World Events"
        case 7:
            return "Economy"
        case 8:
            return "Elections"
        default:
            return "Unknown"
    }
}

access(all) fun getStatusName(_ statusRawValue: UInt8): String {
    switch statusRawValue {
        case 0:
            return "Active"
        case 1:
            return "Pending Resolution"
        case 2:
            return "Resolved"
        case 3:
            return "Cancelled"
        default:
            return "Unknown"
    }
}

access(all) fun calculateOddsA(_ market: FlowWager.Market): UFix64 {
    if market.totalPool == 0.0 {
        return 50.0 // 50% default odds
    }
    return (market.totalOptionAShares / market.totalPool) * 100.0
}

access(all) fun calculateOddsB(_ market: FlowWager.Market): UFix64 {
    if market.totalPool == 0.0 {
        return 50.0 // 50% default odds
    }
    return (market.totalOptionBShares / market.totalPool) * 100.0
}

access(all) fun calculateTimeRemaining(_ market: FlowWager.Market): UFix64 {
    let currentTime = getCurrentBlock().timestamp
    if currentTime >= market.endTime {
        return 0.0
    }
    return market.endTime - currentTime
}