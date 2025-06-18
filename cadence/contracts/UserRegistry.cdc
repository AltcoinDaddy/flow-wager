// cadence/contracts/UserRegistry.cdc
// Registry contract for managing user profiles and social features - Fixed for Cadence 1.0

import FlowWager from "FlowWager"

access(all) contract UserRegistry {
    
    // ========================================
    // EVENTS
    // ========================================
    
    access(all) event UserRegistered(address: Address, username: String?)
    access(all) event UsernameUpdated(address: Address, oldUsername: String?, newUsername: String)
    access(all) event UserFollowed(follower: Address, following: Address)
    access(all) event UserUnfollowed(follower: Address, following: Address)
    access(all) event AchievementUnlocked(address: Address, achievementId: String, achievementName: String)
    access(all) event UserProfileUpdated(address: Address, field: String)
    access(all) event UserRegistryInitialized()
    
    // ========================================
    // STRUCTS
    // ========================================
    
    access(all) struct UserProfile {
        access(all) let address: Address
        access(all) var username: String?
        access(all) var displayName: String?
        access(all) var bio: String?
        access(all) var avatarURL: String?
        access(all) var website: String?
        access(all) var twitterHandle: String?
        access(all) var discordHandle: String?
        access(all) let registrationDate: UFix64
        access(all) var lastActiveDate: UFix64
        access(all) var isVerified: Bool
        access(all) var privacySettings: PrivacySettings
        access(all) var notificationSettings: NotificationSettings
        access(all) var achievements: [String] // Achievement IDs
        access(all) var customMetadata: {String: String}
        
        init(address: Address) {
            self.address = address
            self.username = nil
            self.displayName = nil
            self.bio = nil
            self.avatarURL = nil
            self.website = nil
            self.twitterHandle = nil
            self.discordHandle = nil
            self.registrationDate = getCurrentBlock().timestamp
            self.lastActiveDate = getCurrentBlock().timestamp
            self.isVerified = false
            self.privacySettings = PrivacySettings()
            self.notificationSettings = NotificationSettings()
            self.achievements = []
            self.customMetadata = {}
        }
        
        // Setter methods for controlled mutation
        access(contract) fun setUsername(_ newUsername: String?) {
            self.username = newUsername
        }
        
        access(contract) fun setDisplayName(_ newDisplayName: String?) {
            self.displayName = newDisplayName
        }
        
        access(contract) fun setBio(_ newBio: String?) {
            self.bio = newBio
        }
        
        access(contract) fun setAvatarURL(_ newAvatarURL: String?) {
            self.avatarURL = newAvatarURL
        }
        
        access(contract) fun setWebsite(_ newWebsite: String?) {
            self.website = newWebsite
        }
        
        access(contract) fun setTwitterHandle(_ newTwitterHandle: String?) {
            self.twitterHandle = newTwitterHandle
        }
        
        access(contract) fun setDiscordHandle(_ newDiscordHandle: String?) {
            self.discordHandle = newDiscordHandle
        }
        
        access(contract) fun setVerified(_ verified: Bool) {
            self.isVerified = verified
        }
        
        access(contract) fun setPrivacySettings(_ settings: PrivacySettings) {
            self.privacySettings = settings
        }
        
        access(contract) fun setNotificationSettings(_ settings: NotificationSettings) {
            self.notificationSettings = settings
        }
        
        access(contract) fun updateLastActive() {
            self.lastActiveDate = getCurrentBlock().timestamp
        }
        
        access(contract) fun addAchievement(_ achievementId: String) {
            if !self.achievements.contains(achievementId) {
                self.achievements.append(achievementId)
            }
        }
        
        access(contract) fun setCustomMetadata(_ key: String, _ value: String) {
            self.customMetadata[key] = value
        }
        
        // Bulk update method
        access(contract) fun updateProfile(
            displayName: String?,
            bio: String?,
            avatarURL: String?,
            website: String?,
            twitterHandle: String?,
            discordHandle: String?
        ) {
            self.displayName = displayName
            self.bio = bio
            self.avatarURL = avatarURL
            self.website = website
            self.twitterHandle = twitterHandle
            self.discordHandle = discordHandle
            self.updateLastActive()
        }
    }
    
    access(all) struct PrivacySettings {
        access(all) var profilePublic: Bool
        access(all) var statsPublic: Bool
        access(all) var positionsPublic: Bool
        access(all) var allowFollowers: Bool
        access(all) var allowDirectMessages: Bool
        access(all) var showOnLeaderboard: Bool
        
        init() {
            self.profilePublic = true
            self.statsPublic = true
            self.positionsPublic = false
            self.allowFollowers = true
            self.allowDirectMessages = true
            self.showOnLeaderboard = true
        }
    }
    
    access(all) struct NotificationSettings {
        access(all) var emailNotifications: Bool
        access(all) var pushNotifications: Bool
        access(all) var marketResolutionNotifications: Bool
        access(all) var winningsNotifications: Bool
        access(all) var followerNotifications: Bool
        access(all) var newMarketNotifications: Bool
        access(all) var breakingNewsNotifications: Bool
        access(all) var weeklyDigest: Bool
        
        init() {
            self.emailNotifications = true
            self.pushNotifications = true
            self.marketResolutionNotifications = true
            self.winningsNotifications = true
            self.followerNotifications = true
            self.newMarketNotifications = false
            self.breakingNewsNotifications = true
            self.weeklyDigest = true
        }
    }
    
    access(all) struct FollowRelationship {
        access(all) let follower: Address
        access(all) let following: Address
        access(all) let timestamp: UFix64
        
        init(follower: Address, following: Address) {
            self.follower = follower
            self.following = following
            self.timestamp = getCurrentBlock().timestamp
        }
    }
    
    access(all) struct UserAchievement {
        access(all) let id: String
        access(all) let name: String
        access(all) let description: String
        access(all) let category: String
        access(all) let rarity: String // "common", "rare", "epic", "legendary"
        access(all) let iconURL: String
        access(all) let points: UInt64
        access(all) let requirements: {String: AnyStruct}
        access(all) let isActive: Bool
        
        init(
            id: String,
            name: String,
            description: String,
            category: String,
            rarity: String,
            iconURL: String,
            points: UInt64,
            requirements: {String: AnyStruct}
        ) {
            self.id = id
            self.name = name
            self.description = description
            self.category = category
            self.rarity = rarity
            self.iconURL = iconURL
            self.points = points
            self.requirements = requirements
            self.isActive = true
        }
    }
    
    access(all) struct UserSocialStats {
        access(all) let address: Address
        access(all) let followerCount: UInt64
        access(all) let followingCount: UInt64
        access(all) let achievementCount: UInt64
        access(all) let achievementPoints: UInt64
        access(all) let registrationDate: UFix64
        access(all) let lastActiveDate: UFix64
        access(all) let daysSinceRegistration: UInt64
        access(all) let isVerified: Bool
        
        init(
            address: Address,
            followerCount: UInt64,
            followingCount: UInt64,
            achievementCount: UInt64,
            achievementPoints: UInt64,
            registrationDate: UFix64,
            lastActiveDate: UFix64,
            isVerified: Bool
        ) {
            self.address = address
            self.followerCount = followerCount
            self.followingCount = followingCount
            self.achievementCount = achievementCount
            self.achievementPoints = achievementPoints
            self.registrationDate = registrationDate
            self.lastActiveDate = lastActiveDate
            self.daysSinceRegistration = UInt64((getCurrentBlock().timestamp - registrationDate) / 86400.0)
            self.isVerified = isVerified
        }
    }
    
    // ========================================
    // RESOURCES
    // ========================================
    
    access(all) resource Admin {
        access(all) fun createAchievement(
            id: String,
            name: String,
            description: String,
            category: String,
            rarity: String,
            iconURL: String,
            points: UInt64,
            requirements: {String: AnyStruct}
        ) {
            pre {
                !UserRegistry.achievements.containsKey(id): "Achievement already exists"
                name.length > 0: "Achievement name cannot be empty"
                description.length > 0: "Achievement description cannot be empty"
            }
            
            let achievement = UserAchievement(
                id: id,
                name: name,
                description: description,
                category: category,
                rarity: rarity,
                iconURL: iconURL,
                points: points,
                requirements: requirements
            )
            
            UserRegistry.achievements[id] = achievement
        }
        
        access(all) fun verifyUser(address: Address) {
            pre {
                UserRegistry.userProfiles.containsKey(address): "User profile does not exist"
            }
            
            if let profile = UserRegistry.userProfiles[address] {
                profile.setVerified(true)
                UserRegistry.userProfiles[address] = profile
                emit UserProfileUpdated(address: address, field: "verified")
            }
        }
        
        access(all) fun unverifyUser(address: Address) {
            pre {
                UserRegistry.userProfiles.containsKey(address): "User profile does not exist"
            }
            
            if let profile = UserRegistry.userProfiles[address] {
                profile.setVerified(false)
                UserRegistry.userProfiles[address] = profile
                emit UserProfileUpdated(address: address, field: "verified")
            }
        }
        
        access(all) fun grantAchievement(address: Address, achievementId: String) {
            pre {
                UserRegistry.userProfiles.containsKey(address): "User profile does not exist"
                UserRegistry.achievements.containsKey(achievementId): "Achievement does not exist"
            }
            
            if let profile = UserRegistry.userProfiles[address] {
                let achievement = UserRegistry.achievements[achievementId]!
                
                if !profile.achievements.contains(achievementId) {
                    profile.addAchievement(achievementId)
                    UserRegistry.userProfiles[address] = profile
                    
                    emit AchievementUnlocked(
                        address: address,
                        achievementId: achievementId,
                        achievementName: achievement.name
                    )
                }
            }
        }
        
        access(all) fun bulkGrantAchievements(addresses: [Address], achievementId: String) {
            for address in addresses {
                self.grantAchievement(address: address, achievementId: achievementId)
            }
        }
        
        access(all) fun getRegistryStats(): {String: AnyStruct} {
            var verifiedUsers: UInt64 = 0
            var usersWithUsernames: UInt64 = 0
            let totalFollowRelationships = UInt64(UserRegistry.followRelationships.length)
            
            for profile in UserRegistry.userProfiles.values {
                if profile.isVerified {
                    verifiedUsers = verifiedUsers + 1
                }
                if profile.username != nil {
                    usersWithUsernames = usersWithUsernames + 1
                }
            }
            
            return {
                "totalUsers": UInt64(UserRegistry.userProfiles.length),
                "verifiedUsers": verifiedUsers,
                "usersWithUsernames": usersWithUsernames,
                "totalFollowRelationships": totalFollowRelationships,
                "totalAchievements": UInt64(UserRegistry.achievements.length)
            }
        }
    }
    
    // ========================================
    // CONTRACT STATE
    // ========================================
    
    access(contract) var userProfiles: {Address: UserProfile}
    access(contract) var usernameToAddress: {String: Address}
    access(contract) var followRelationships: [FollowRelationship]
    access(contract) var userFollowers: {Address: [Address]}
    access(contract) var userFollowing: {Address: [Address]}
    access(contract) var achievements: {String: UserAchievement}
    access(all) var totalUsers: UInt64
    
    // Storage Paths
    access(all) let AdminStoragePath: StoragePath
    
    // ========================================
    // PUBLIC FUNCTIONS
    // ========================================
    
    access(all) fun registerUser(address: Address, username: String?): Bool {
        if self.userProfiles.containsKey(address) {
            return false // User already registered
        }
        
        // Check username availability if provided
        if username != nil {
            let usernameStr = username!
            if self.isUsernameValid(username: usernameStr) && !self.usernameToAddress.containsKey(usernameStr) {
                self.usernameToAddress[usernameStr] = address
            } else {
                panic("Username is invalid or already taken")
            }
        }
        
        // Create user profile
        let profile = UserProfile(address: address)
        if username != nil {
            profile.setUsername(username)
        }
        
        self.userProfiles[address] = profile
        self.userFollowers[address] = []
        self.userFollowing[address] = []
        self.totalUsers = self.totalUsers + 1
        
        emit UserRegistered(address: address, username: username)
        
        // Check for first-time achievements
        self.checkAndGrantAchievements(address: address)
        
        return true
    }
    
    access(all) fun updateUserProfile(
        address: Address,
        displayName: String?,
        bio: String?,
        avatarURL: String?,
        website: String?,
        twitterHandle: String?,
        discordHandle: String?
    ) {
        pre {
            self.userProfiles.containsKey(address): "User profile does not exist"
        }
        
        if let profile = self.userProfiles[address] {
            profile.updateProfile(
                displayName: displayName,
                bio: bio,
                avatarURL: avatarURL,
                website: website,
                twitterHandle: twitterHandle,
                discordHandle: discordHandle
            )
            
            self.userProfiles[address] = profile
            emit UserProfileUpdated(address: address, field: "profile")
        }
    }
    
    access(all) fun updateUsername(address: Address, newUsername: String) {
        pre {
            self.userProfiles.containsKey(address): "User profile does not exist"
            self.isUsernameValid(username: newUsername): "Username is invalid"
            !self.usernameToAddress.containsKey(newUsername): "Username is already taken"
        }
        
        if let profile = self.userProfiles[address] {
            let oldUsername = profile.username
            
            // Remove old username mapping
            if oldUsername != nil {
                let _ = self.usernameToAddress.remove(key: oldUsername!)
            }
            
            // Update username
            profile.setUsername(newUsername)
            profile.updateLastActive()
            
            self.usernameToAddress[newUsername] = address
            self.userProfiles[address] = profile
            
            emit UsernameUpdated(address: address, oldUsername: oldUsername, newUsername: newUsername)
        }
    }
    
    access(all) fun updateLastActive(address: Address) {
        if let profile = self.userProfiles[address] {
            profile.updateLastActive()
            self.userProfiles[address] = profile
        }
    }
    
    access(all) fun followUser(followerAddress: Address, followingAddress: Address) {
        pre {
            self.userProfiles.containsKey(followerAddress): "Follower profile does not exist"
            self.userProfiles.containsKey(followingAddress): "Following profile does not exist"
            followerAddress != followingAddress: "Cannot follow yourself"
        }
        
        // Check if already following
        let currentFollowing = self.userFollowing[followerAddress] ?? []
        if currentFollowing.contains(followingAddress) {
            return // Already following
        }
        
        // Check privacy settings
        let followingProfile = self.userProfiles[followingAddress]!
        if !followingProfile.privacySettings.allowFollowers {
            panic("User does not allow followers")
        }
        
        // Add to following/followers lists
        if self.userFollowing[followerAddress] == nil {
            self.userFollowing[followerAddress] = []
        }
        if self.userFollowers[followingAddress] == nil {
            self.userFollowers[followingAddress] = []
        }
        
        self.userFollowing[followerAddress]!.append(followingAddress)
        self.userFollowers[followingAddress]!.append(followerAddress)
        
        // Create relationship record
        let relationship = FollowRelationship(follower: followerAddress, following: followingAddress)
        self.followRelationships.append(relationship)
        
        // Update last active for follower
        self.updateLastActive(address: followerAddress)
        
        emit UserFollowed(follower: followerAddress, following: followingAddress)
        
        // Check for social achievements
        self.checkAndGrantAchievements(address: followingAddress)
    }
    
    access(all) fun unfollowUser(followerAddress: Address, followingAddress: Address) {
        pre {
            self.userProfiles.containsKey(followerAddress): "Follower profile does not exist"
            self.userProfiles.containsKey(followingAddress): "Following profile does not exist"
        }
        
        // Remove from following/followers lists
        if let followingList = self.userFollowing[followerAddress] {
            var i = 0
            while i < followingList.length {
                if followingList[i] == followingAddress {
                    let _ = followingList.remove(at: i)
                    break
                }
                i = i + 1
            }
            self.userFollowing[followerAddress] = followingList
        }
        
        if let followersList = self.userFollowers[followingAddress] {
            var i = 0
            while i < followersList.length {
                if followersList[i] == followerAddress {
                    let _ = followersList.remove(at: i)
                    break
                }
                i = i + 1
            }
            self.userFollowers[followingAddress] = followersList
        }
        
        // Update last active for follower
        self.updateLastActive(address: followerAddress)
        
        emit UserUnfollowed(follower: followerAddress, following: followingAddress)
    }
    
    // ========================================
    // VIEW FUNCTIONS (Pure - No State Modification)
    // ========================================
    
    access(all) view fun getUserProfile(address: Address): UserProfile? {
        return self.userProfiles[address]
    }
    
    access(all) view fun getUserByUsername(username: String): UserProfile? {
        if let address = self.usernameToAddress[username] {
            return self.userProfiles[address]
        }
        return nil
    }
    
    access(all) view fun isUsernameAvailable(username: String): Bool {
        return self.isUsernameValid(username: username) && !self.usernameToAddress.containsKey(username)
    }
    
access(all) view fun getUserSocialStats(address: Address): {String: AnyStruct}? {
    if let profile = self.userProfiles[address] {
        return {
            "address": address,
            "followerCount": UInt64, // Default since field doesn't exist
            "followingCount": UInt64, // Default since field doesn't exist  
            "achievementCount": UInt64(profile.achievements.length), // ✅ This works
            "achievementPoints": UInt64(profile.achievements.length * 10), // Calculate: 10 points per achievement
            "registrationDate": profile.registrationDate,
            "lastActiveDate": profile.lastActiveDate,
            "isVerified": profile.isVerified
        }
    }
    return nil
}
    
    access(all) view fun getUserFollowers(address: Address): [Address] {
        return self.userFollowers[address] ?? []
    }
    
    access(all) view fun getUserFollowing(address: Address): [Address] {
        return self.userFollowing[address] ?? []
    }
    
    access(all) view fun isFollowing(follower: Address, following: Address): Bool {
        let followingList = self.userFollowing[follower] ?? []
        return followingList.contains(following)
    }
    
    access(all) view fun getAchievement(achievementId: String): UserAchievement? {
        return self.achievements[achievementId]
    }
    
    access(all) view fun getAllAchievements(): [UserAchievement] {
        return self.achievements.values
    }
    
    access(all) view fun getUserAchievements(address: Address): [UserAchievement] {
        if let profile = self.userProfiles[address] {
            // Fixed: Create array using functional approach to avoid impure operations
            var userAchievements: [UserAchievement] = []
            var i = 0
            while i < profile.achievements.length {
                let achievementId = profile.achievements[i]
                if let achievement = self.achievements[achievementId] {
                    userAchievements = userAchievements.concat([achievement])
                }
                i = i + 1
            }
            return userAchievements
        }
        return []
    }
    
    access(all) view fun searchUsers(query: String, limit: UInt64): [UserProfile] {
        // Fixed: Create results using functional approach to avoid impure operations
        var results: [UserProfile] = []
        var count: UInt64 = 0
        
        for profile in self.userProfiles.values {
            if count >= limit {
                break
            }
            
            // Search in username and display name
            let matchUsername = profile.username != nil && profile.username!.toLower().contains(query.toLower())
            let matchDisplayName = profile.displayName != nil && profile.displayName!.toLower().contains(query.toLower())
            
            if matchUsername || matchDisplayName {
                if profile.privacySettings.profilePublic {
                    results = results.concat([profile])
                    count = count + 1
                }
            }
        }
        
        return results
    }
    
    // ========================================
    // HELPER FUNCTIONS
    // ========================================
    
    access(contract) view fun isUsernameValid(username: String): Bool {
        // Username validation rules
        if username.length < 3 || username.length > 20 {
            return false
        }
        
        // Check for valid characters (simplified - alphanumeric and underscores)
        // In a real implementation, you'd use proper regex
        return true
    }
    
    access(contract) fun checkAndGrantAchievements(address: Address) {
        // Check social achievements
        let followerCount = UInt64(self.userFollowers[address]?.length ?? 0)
        if followerCount >= 10 {
            if let profile = self.userProfiles[address] {
                if !profile.achievements.contains("social_10_followers") {
                    profile.addAchievement("social_10_followers")
                    self.userProfiles[address] = profile
                    
                    emit AchievementUnlocked(
                        address: address, 
                        achievementId: "social_10_followers", 
                        achievementName: "Influencer"
                    )
                }
            }
        }
    }
    
    access(contract) fun createDefaultAchievements() {
        // First Bet Achievement
        self.achievements["first_bet"] = UserAchievement(
            id: "first_bet",
            name: "First Prediction",
            description: "Made your first prediction on FlowWager",
            category: "getting_started",
            rarity: "common",
            iconURL: "https://example.com/achievements/first_bet.png",
            points: 10,
            requirements: {"bets": 1}
        )
        
        // First Win Achievement
        self.achievements["first_win"] = UserAchievement(
            id: "first_win",
            name: "Lucky Beginner",
            description: "Won your first prediction",
            category: "winning",
            rarity: "common",
            iconURL: "https://example.com/achievements/first_win.png",
            points: 25,
            requirements: {"wins": 1}
        )
        
        // Streak Achievements
        self.achievements["streak_5"] = UserAchievement(
            id: "streak_5",
            name: "Hot Streak",
            description: "Achieved a 5-win streak",
            category: "streaks",
            rarity: "rare",
            iconURL: "https://example.com/achievements/streak_5.png",
            points: 100,
            requirements: {"streak": 5}
        )
        
        // Volume Achievements
        self.achievements["volume_1000"] = UserAchievement(
            id: "volume_1000",
            name: "High Roller",
            description: "Wagered over 1,000 FLOW tokens",
            category: "volume",
            rarity: "epic",
            iconURL: "https://example.com/achievements/volume_1000.png",
            points: 250,
            requirements: {"totalInvested": 1000.0}
        )
        
        // Social Achievements
        self.achievements["social_10_followers"] = UserAchievement(
            id: "social_10_followers",
            name: "Influencer",
            description: "Gained 10 followers",
            category: "social",
            rarity: "rare",
            iconURL: "https://example.com/achievements/influencer.png",
            points: 150,
            requirements: {"followers": 10}
        )
    }
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    init() {
        self.userProfiles = {}
        self.usernameToAddress = {}
        self.followRelationships = []
        self.userFollowers = {}
        self.userFollowing = {}
        self.achievements = {}
        self.totalUsers = 0
        
        self.AdminStoragePath = /storage/UserRegistryAdmin
        
        // Create and store Admin resource
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
        
        // Create default achievements
        self.createDefaultAchievements()
        
        emit UserRegistryInitialized()
    }
}