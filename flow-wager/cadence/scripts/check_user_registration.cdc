import "FlowWager"

// Script to check if a user has been registered in the FlowWager contract
access(all) fun main(userAddress: Address): {String: AnyStruct} {
    // Check if user is registered in the contract
    let userStats = FlowWager.getUserStats(address: userAddress)
    let isRegisteredInContract = userStats != nil
    
    // Check if user has UserProfile resource
    let account = getAccount(userAddress)
    let userProfile = account.capabilities.get<&{FlowWager.UserProfilePublic}>(
        FlowWager.UserProfilePublicPath
    ).borrow()
    let hasUserProfile = userProfile != nil
    
    // Check if user has UserPositions resource
    let userPositions = account.capabilities.get<&{FlowWager.UserPositionsPublic}>(
        FlowWager.UserPositionsPublicPath
    ).borrow()
    let hasUserPositions = userPositions != nil
    
    // Check if user has UserStats resource
    let userStatsResource = account.capabilities.get<&{FlowWager.UserStatsPublic}>(
        FlowWager.UserStatsPublicPath
    ).borrow()
    let hasUserStatsResource = userStatsResource != nil
    
    // Get user profile details if available
    var username: String? = nil
    var displayName: String? = nil
    var joinedAt: UFix64? = nil
    
    if let profile = userProfile {
        username = profile.getUsername()
        displayName = profile.getDisplayName()
        joinedAt = profile.joinedAt
    }
    
    // Determine overall registration status
    let isFullyRegistered = isRegisteredInContract && hasUserProfile && hasUserPositions && hasUserStatsResource
    
    return {
        "address": userAddress,
        "isRegisteredInContract": isRegisteredInContract,
        "hasUserProfile": hasUserProfile,
        "hasUserPositions": hasUserPositions,
        "hasUserStatsResource": hasUserStatsResource,
        "isFullyRegistered": isFullyRegistered,
        "username": username,
        "displayName": displayName,
        "joinedAt": joinedAt,
        "userStats": userStats
    }
}

// Simple version - just returns boolean
access(all) fun isUserRegistered(userAddress: Address): Bool {
    let userStats = FlowWager.getUserStats(address: userAddress)
    let account = getAccount(userAddress)
    let userProfile = account.capabilities.get<&{FlowWager.UserProfilePublic}>(
        FlowWager.UserProfilePublicPath
    ).borrow()
    
    return userStats != nil && userProfile != nil
}