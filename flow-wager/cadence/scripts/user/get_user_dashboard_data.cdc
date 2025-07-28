import "FlowWager"

access(all) struct UserDashboard {
    access(all) let profile: &{FlowWager.UserProfilePublic}?
    access(all) let stats: FlowWager.UserStats?
    access(all) let positions: {UInt64: FlowWager.UserPosition}
    access(all) let claimableWinnings: [FlowWager.ClaimableWinnings]
    access(all) let isRegistered: Bool
    access(all) let totalMarketsCreated: UInt64
    access(all) let createdMarkets: [FlowWager.Market]
    
    init(
        profile: &{FlowWager.UserProfilePublic}?,
        stats: FlowWager.UserStats?,
        positions: {UInt64: FlowWager.UserPosition},
        claimableWinnings: [FlowWager.ClaimableWinnings],
        isRegistered: Bool,
        totalMarketsCreated: UInt64,
        createdMarkets: [FlowWager.Market]
    ) {
        self.profile = profile
        self.stats = stats
        self.positions = positions
        self.claimableWinnings = claimableWinnings
        self.isRegistered = isRegistered
        self.totalMarketsCreated = totalMarketsCreated
        self.createdMarkets = createdMarkets
    }
}

access(all) fun main(userAddress: Address): UserDashboard {
    // Get user profile (returns a reference, not the resource itself)
    let profile = FlowWager.getUserProfile(address: userAddress)
    
    // Get user stats
    let stats = FlowWager.getUserStats(address: userAddress)
    
    // Get user positions (with error handling for unregistered users)
    var positions: {UInt64: FlowWager.UserPosition} = {}
    if stats != nil {
        positions = FlowWager.getUserPositions(address: userAddress)
    }
    
    // Get claimable winnings
    let claimableWinnings = FlowWager.getClaimableWinnings(address: userAddress)
    
    // Check if user is registered
    let isRegistered = stats != nil && profile != nil
    
    // Get markets created by this user
    let createdMarkets = FlowWager.getMarketsByCreator(creator: userAddress)
    let totalMarketsCreated = UInt64(createdMarkets.length)
    
    return UserDashboard(
        profile: profile,
        stats: stats,
        positions: positions,
        claimableWinnings: claimableWinnings,
        isRegistered: isRegistered,
        totalMarketsCreated: totalMarketsCreated,
        createdMarkets: createdMarkets
    )
}