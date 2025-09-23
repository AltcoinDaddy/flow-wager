import "FlowWager"


access(all) fun main(userAddress: Address): {String: AnyStruct} {
    
    let userStats = FlowWager.getUserStats(address: userAddress)
    let isRegisteredInContract = userStats != nil
    
   
    let account = getAccount(userAddress)
    let userProfile = account.capabilities.get<&{FlowWager.UserProfilePublic}>(
        FlowWager.UserProfilePublicPath
    ).borrow()
    let hasUserProfile = userProfile != nil
    
    
    let userPositions = account.capabilities.get<&{FlowWager.UserPositionsPublic}>(
        FlowWager.UserPositionsPublicPath
    ).borrow()
    let hasUserPositions = userPositions != nil
    
    
    let userStatsResource = account.capabilities.get<&{FlowWager.UserStatsPublic}>(
        FlowWager.UserStatsPublicPath
    ).borrow()
    let hasUserStatsResource = userStatsResource != nil
    
   
    var username: String? = nil
    var displayName: String? = nil
    var joinedAt: UFix64? = nil
    
    if let profile = userProfile {
        username = profile.getUsername()
        displayName = profile.getDisplayName()
        joinedAt = profile.joinedAt
    }
    
  
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


access(all) fun isUserRegistered(userAddress: Address): Bool {
    let userStats = FlowWager.getUserStats(address: userAddress)
    let account = getAccount(userAddress)
    let userProfile = account.capabilities.get<&{FlowWager.UserProfilePublic}>(
        FlowWager.UserProfilePublicPath
    ).borrow()
    
    return userStats != nil && userProfile != nil
}