import FlowWager from "FlowWager"

access(all) fun main(targetAddress: Address): {String: AnyStruct} {
    let stats = FlowWager.getPlatformStats()
    let userProfile = FlowWager.getUserProfile(address: targetAddress)
    let userStats = FlowWager.getUserStats(address: targetAddress)
    
    return {
        "address": targetAddress.toString(),
        "profileExists": userProfile != nil,
        "profileDetails": userProfile != nil ? {
            "username": userProfile!.username,
            "displayName": userProfile!.displayName,
            "joinedAt": userProfile!.joinedAt
        } : nil,
        "statsExist": userStats != nil,
        "totalUsersInContract": stats.totalUsers,
        "contractState": {
            "totalMarkets": stats.totalMarkets,
            "activeMarkets": stats.activeMarkets
        }
    }
}