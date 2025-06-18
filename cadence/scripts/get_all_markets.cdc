// cadence/scripts/get_all_markets.cdc
// Script to get all markets with optional filtering - Fixed for Cadence 1.0

import FlowWager from "FlowWager"

access(all) fun main(
    category: UInt8?,
    status: UInt8?,
    isBreakingNews: Bool?,
    onlyActive: Bool
): [MarketSummary] {
    
    let allMarkets = FlowWager.getAllMarkets()
    let filteredMarkets: [FlowWager.Market] = []
    
    // Apply filters
    for market in allMarkets {
        var includeMarket = true
        
        // Category filter
        if category != nil && market.category.rawValue != category! {
            includeMarket = false
        }
        
        // Status filter
        if status != nil && market.status.rawValue != status! {
            includeMarket = false
        }
        
        // Breaking news filter - using category as proxy
        if isBreakingNews != nil {
            let isBreaking = market.category.rawValue == 4 // Assuming 4 = Breaking News category
            if isBreaking != isBreakingNews! {
                includeMarket = false
            }
        }
        
        // Only active filter
        if onlyActive && market.status.rawValue != 0 { // 0 = Active status
            includeMarket = false
        }
        
        if includeMarket {
            filteredMarkets.append(market)
        }
    }
    
    // Convert to summary format
    let marketSummaries: [MarketSummary] = []
    for market in filteredMarkets {
        let summary = MarketSummary(
            id: market.id,
            creator: market.creator,
            question: "Market Question", // Placeholder - replace with actual property
            optionA: market.optionA,
            optionB: market.optionB,
            category: market.category.rawValue,
            categoryName: getCategoryName(market.category.rawValue),
            imageURI: "",
            endTime: market.endTime,
            creationTime: 0.0, // Placeholder - add if property exists
            status: market.status.rawValue,
            statusName: getStatusName(market.status.rawValue),
            totalPool: market.totalPool,
            isBreakingNews: market.category.rawValue == 4, // Use category as proxy
            oddsA: calculateOddsA(market),
            oddsB: calculateOddsB(market),
            timeRemaining: calculateTimeRemaining(market),
            participantCount: getParticipantCount(market),
            resolved: market.resolved,
            outcome: market.outcome?.rawValue ?? 255 // Max UInt8 value for "no outcome"
        )
        
        marketSummaries.append(summary)
    }
    
    return marketSummaries
}

access(all) struct MarketSummary {
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
    access(all) let status: UInt8
    access(all) let statusName: String
    access(all) let totalPool: UFix64
    access(all) let isBreakingNews: Bool
    access(all) let oddsA: UFix64
    access(all) let oddsB: UFix64
    access(all) let timeRemaining: UFix64
    access(all) let participantCount: UInt64
    access(all) let resolved: Bool
    access(all) let outcome: UInt8
    
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
        status: UInt8,
        statusName: String,
        totalPool: UFix64,
        isBreakingNews: Bool,
        oddsA: UFix64,
        oddsB: UFix64,
        timeRemaining: UFix64,
        participantCount: UInt64,
        resolved: Bool,
        outcome: UInt8
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
        self.status = status
        self.statusName = statusName
        self.totalPool = totalPool
        self.isBreakingNews = isBreakingNews
        self.oddsA = oddsA
        self.oddsB = oddsB
        self.timeRemaining = timeRemaining
        self.participantCount = participantCount
        self.resolved = resolved
        self.outcome = outcome
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

access(all) fun getParticipantCount(_ market: FlowWager.Market): UInt64 {
    // Simplified participant count - in practice, you'd track unique participants
    let hasParticipants = market.totalPool > 0.0
    return hasParticipants ? 1 : 0 // Placeholder implementation
}