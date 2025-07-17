import "FlowWager"

access(all) struct UserDashboard {
    access(all) let profile: FlowWager.UserProfile?
    access(all) let stats: FlowWager.UserStats?
    access(all) let positions: {UInt64: FlowWager.UserPosition}
    access(all) let claimableWinnings: [FlowWager.ClaimableWinnings]
    access(all) let wagerPoints: UInt64
    
    init(
        profile: FlowWager.UserProfile?,
        stats: FlowWager.UserStats?,
        positions: {UInt64: FlowWager.UserPosition},
        claimableWinnings: [FlowWager.ClaimableWinnings],
        wagerPoints: UInt64
    ) {
        self.profile = profile
        self.stats = stats
        self.positions = positions
        self.claimableWinnings = claimableWinnings
        self.wagerPoints = wagerPoints
    }
}

access(all) fun main(userAddress: Address): UserDashboard {
    let profile = FlowWager.getUserProfile(address: userAddress)
    let stats = FlowWager.getUserStats(address: userAddress)
    let positions = FlowWager.getUserPositions(address: userAddress)
    let claimableWinnings = FlowWager.getClaimableWinnings(address: userAddress)
    let wagerPoints = FlowWager.getWagerPoints(address: userAddress)
    
    return UserDashboard(
        profile: profile,
        stats: stats,
        positions: positions,
        claimableWinnings: claimableWinnings,
        wagerPoints: wagerPoints
    )
}