// cadence/scripts/get_user_stats.cdc
// Script to get user statistics and positions - Simplified for Cadence 1.0

import FlowWager from "FlowWager"

access(all) fun main(userAddress: Address): UserInfo? {
    let userStats = FlowWager.getUserStats(address: userAddress)
    
    if userStats == nil {
        return nil
    }
    
    let stats = userStats!
    
    // Simplified user info without complex position tracking
    return UserInfo(
        address: userAddress,
        totalWinnings: stats.totalWinnings,
        totalBets: 0, // Placeholder - add when property exists
        winCount: 0, // Placeholder - add when property exists
        currentStreak: stats.currentStreak,
        longestStreak: 0, // Placeholder - add when property exists
        totalFeesPaid: 0.0, // Placeholder - add when property exists
        totalInvested: 0.0, // Placeholder - add when property exists
        winRate: calculateWinRate(totalBets: 0, winCount: 0),
        roi: calculateROI(totalWinnings: stats.totalWinnings, totalInvested: 0.0),
        totalPositions: 0, // Placeholder
        activePositions: 0, // Placeholder
        claimablePositions: 0, // Placeholder
        positions: [] // Empty for now - add when getUserPositions exists
    )
}

access(all) struct UserInfo {
    access(all) let address: Address
    access(all) let totalWinnings: UFix64
    access(all) let totalBets: UInt64
    access(all) let winCount: UInt64
    access(all) let currentStreak: UInt64
    access(all) let longestStreak: UInt64
    access(all) let totalFeesPaid: UFix64
    access(all) let totalInvested: UFix64
    access(all) let winRate: UFix64
    access(all) let roi: UFix64
    access(all) let totalPositions: UInt64
    access(all) let activePositions: UInt64
    access(all) let claimablePositions: UInt64
    access(all) let positions: [PositionInfo]
    
    init(
        address: Address,
        totalWinnings: UFix64,
        totalBets: UInt64,
        winCount: UInt64,
        currentStreak: UInt64,
        longestStreak: UInt64,
        totalFeesPaid: UFix64,
        totalInvested: UFix64,
        winRate: UFix64,
        roi: UFix64,
        totalPositions: UInt64,
        activePositions: UInt64,
        claimablePositions: UInt64,
        positions: [PositionInfo]
    ) {
        self.address = address
        self.totalWinnings = totalWinnings
        self.totalBets = totalBets
        self.winCount = winCount
        self.currentStreak = currentStreak
        self.longestStreak = longestStreak
        self.totalFeesPaid = totalFeesPaid
        self.totalInvested = totalInvested
        self.winRate = winRate
        self.roi = roi
        self.totalPositions = totalPositions
        self.activePositions = activePositions
        self.claimablePositions = claimablePositions
        self.positions = positions
    }
}

access(all) struct PositionInfo {
    access(all) let marketId: UInt64
    access(all) let marketQuestion: String
    access(all) let optionA: String
    access(all) let optionB: String
    access(all) let selectedOption: String
    access(all) let isOptionA: Bool
    access(all) let shares: UFix64
    access(all) let amountInvested: UFix64
    access(all) let timestamp: UFix64
    access(all) let claimed: Bool
    access(all) let marketStatus: UInt8
    access(all) let marketResolved: Bool
    access(all) let marketOutcome: UInt8
    access(all) let potentialWinnings: UFix64
    access(all) let isWinning: Bool
    access(all) let canClaim: Bool
    
    init(
        marketId: UInt64,
        marketQuestion: String,
        optionA: String,
        optionB: String,
        selectedOption: String,
        isOptionA: Bool,
        shares: UFix64,
        amountInvested: UFix64,
        timestamp: UFix64,
        claimed: Bool,
        marketStatus: UInt8,
        marketResolved: Bool,
        marketOutcome: UInt8,
        potentialWinnings: UFix64,
        isWinning: Bool,
        canClaim: Bool
    ) {
        self.marketId = marketId
        self.marketQuestion = marketQuestion
        self.optionA = optionA
        self.optionB = optionB
        self.selectedOption = selectedOption
        self.isOptionA = isOptionA
        self.shares = shares
        self.amountInvested = amountInvested
        self.timestamp = timestamp
        self.claimed = claimed
        self.marketStatus = marketStatus
        self.marketResolved = marketResolved
        self.marketOutcome = marketOutcome
        self.potentialWinnings = potentialWinnings
        self.isWinning = isWinning
        self.canClaim = canClaim
    }
}

access(all) fun calculateWinRate(totalBets: UInt64, winCount: UInt64): UFix64 {
    if totalBets == 0 {
        return 0.0
    }
    return UFix64(winCount) / UFix64(totalBets) * 100.0
}

access(all) fun calculateROI(totalWinnings: UFix64, totalInvested: UFix64): UFix64 {
    if totalInvested == 0.0 {
        return 0.0
    }
    return (totalWinnings - totalInvested) / totalInvested * 100.0
}