import "FlowWager"
import "FlowToken"

transaction(username: String, displayName: String, bio: String, profileImageUrl: String) {
    prepare(signer: auth(BorrowValue, SaveValue, PublishCapability, StorageCapabilities ) &Account) {
        // Create user account in contract
        FlowWager.createUserAccount(
            userAddress: signer.address,
            username: username,
            displayName: displayName
        )
        
        // Create and save UserProfile resource
        let userProfile <- FlowWager.createUserProfile(
            userAddress: signer.address,
            username: username,
            displayName: displayName,
            bio: bio,
            profileImageUrl: profileImageUrl
        )
        signer.storage.save(<-userProfile, to: FlowWager.UserProfileStoragePath)
        
        // Create UserProfile capability
        let userProfileCap = signer.capabilities.storage.issue<&{FlowWager.UserProfilePublic}>(
            FlowWager.UserProfileStoragePath
        )
        signer.capabilities.publish(userProfileCap, at: FlowWager.UserProfilePublicPath)
        
        // Create and save UserPositions resource
        let userPositions <- FlowWager.createUserPositions()
        signer.storage.save(<-userPositions, to: FlowWager.UserPositionsStoragePath)
        
        // Create UserPositions capability
        let userPositionsCap = signer.capabilities.storage.issue<&{FlowWager.UserPositionsPublic}>(
            FlowWager.UserPositionsStoragePath
        )
        signer.capabilities.publish(userPositionsCap, at: FlowWager.UserPositionsPublicPath)
        
        // Create and save UserStats resource
        let userStats <- FlowWager.createUserStatsResource()
        signer.storage.save(<-userStats, to: FlowWager.UserStatsStoragePath)
        
        // Create UserStats capability
        let userStatsCap = signer.capabilities.storage.issue<&{FlowWager.UserStatsPublic}>(
            FlowWager.UserStatsStoragePath
        )
        signer.capabilities.publish(userStatsCap, at: FlowWager.UserStatsPublicPath)
        
        log("User account setup completed for: ".concat(username))
    }
}