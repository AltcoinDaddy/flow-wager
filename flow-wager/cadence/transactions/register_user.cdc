import "FlowWagerV2"
import "FlowToken"

transaction(username: String, displayName: String, bio: String, profileImageUrl: String) {
    prepare(signer: auth(BorrowValue, SaveValue, PublishCapability, StorageCapabilities) &Account) {
        // Register user in contract
        FlowWagerV2.registerUser(
            userAddress: signer.address,
            username: username,
            displayName: displayName,
            bio: bio,
            profileImageUrl: profileImageUrl
        )

        // Create and save UserProfile resource
        let userProfile <- FlowWagerV2.createUserProfile(
            userAddress: signer.address,
            username: username,
            displayName: displayName,
            bio: bio,
            profileImageUrl: profileImageUrl
        )
        signer.storage.save(<-userProfile, to: FlowWagerV2.UserProfileStoragePath)

        let userProfileCap = signer.capabilities.storage.issue<&{FlowWagerV2.UserProfilePublic}>(
            FlowWagerV2.UserProfileStoragePath
        )
        signer.capabilities.publish(userProfileCap, at: FlowWagerV2.UserProfilePublicPath)

        // Create and save UserPositions resource
        let userPositions <- FlowWagerV2.createUserPositions()
        signer.storage.save(<-userPositions, to: FlowWagerV2.UserPositionsStoragePath)

        let userPositionsCap = signer.capabilities.storage.issue<&{FlowWagerV2.UserPositionsPublic}>(
            FlowWagerV2.UserPositionsStoragePath
        )
        signer.capabilities.publish(userPositionsCap, at: FlowWagerV2.UserPositionsPublicPath)

        // Create and save UserStatsResource
        let userStats <- FlowWagerV2.createUserStatsResource()
        signer.storage.save(<-userStats, to: FlowWagerV2.UserStatsStoragePath)

        let userStatsCap = signer.capabilities.storage.issue<&{FlowWagerV2.UserStatsPublic}>(
            FlowWagerV2.UserStatsStoragePath
        )
        signer.capabilities.publish(userStatsCap, at: FlowWagerV2.UserStatsPublicPath)

        log("User account setup completed for: ".concat(username))
    }

    execute {
        log("User registration transaction executed successfully")
    }
}
