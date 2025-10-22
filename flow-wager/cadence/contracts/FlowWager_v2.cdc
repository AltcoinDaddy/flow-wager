import "FungibleToken"
import "FlowToken"

access(all) contract FlowWagerV2 {

    // =====================================
    // EVENTS
    // =====================================

    access(all) event ContractInitialized()
    access(all) event MarketCreated(marketId: UInt64, title: String, creator: Address, optionCount: UInt8, imageUrl: String)
    access(all) event SharesPurchased(marketId: UInt64, buyer: Address, optionIndex: UInt8, shares: UFix64, amount: UFix64)
    access(all) event MarketResolved(marketId: UInt64, winningOption: UInt8, resolver: Address, justification: String)
    access(all) event WinningsClaimed(marketId: UInt64, claimer: Address, amount: UFix64)
    access(all) event UserRegistered(address: Address, username: String)
    access(all) event PlatformFeesWithdrawn(admin: Address, amount: UFix64)
    access(all) event MarketCreationFeePaid(creator: Address, amount: UFix64)
    access(all) event BatchWinningsMarketCreationFeesClaimed(claimer: Address, marketCount: UInt64, totalAmount: UFix64)
    access(all) event ReferralCodeGenerated(user: Address, code: String)
    access(all) event WagerPointsEarned(user: Address, points: UInt64)
    access(all) event EvidenceSubmitted(marketId: UInt64, creator: Address, evidence: String, requestedOutcome: UInt8)
    access(all) event MarketStatusChanged(marketId: UInt64, newStatus: UInt8)
    access(all) event EvidenceRejected(marketId: UInt64, admin: Address, reason: String)
    access(all) event ContractUpgraded(oldVersion: String, newVersion: String, upgrader: Address)
    access(all) event UpgradePrepared(newVersion: String, upgradeTime: UFix64)
    access(all) event UpgradeExecuted(version: String, timestamp: UFix64)
    access(all) event AdminTransferProposed(currentAdmin: Address, proposedAdmin: Address)
    access(all) event AdminTransferred(oldAdmin: Address, newAdmin: Address)
    access(all) event AdminTransferCancelled(admin: Address)
    access(all) event MarketCreationFeeUpdated(oldFee: UFix64, newFee: UFix64)
    access(all) event CreatorIncentivePaid(marketId: UInt64, creator: Address, amount: UFix64)
    access(all) event MarketCreationFeesRefunded(creator: Address, marketId: UInt64, amount: UFix64)

    // =====================================
    // ENUMS
    // =====================================

    access(all) enum MarketCategory: UInt8 {
        access(all) case Sports
        access(all) case Entertainment
        access(all) case Technology
        access(all) case Economics
        access(all) case Weather
        access(all) case Crypto
        access(all) case Politics
        access(all) case BreakingNews
        access(all) case Other
    }

    access(all) enum MarketStatus: UInt8 {
        access(all) case Active
        access(all) case PendingResolution
        access(all) case Resolved
        access(all) case Cancelled
    }

    // =====================================
    // STRUCTS
    // =====================================

    access(all) struct ResolutionEvidence {
        access(all) let marketId: UInt64
        access(all) let creator: Address
        access(all) let evidence: String
        access(all) let requestedOutcome: UInt8
        access(all) let submittedAt: UFix64

        init(marketId: UInt64, creator: Address, evidence: String, requestedOutcome: UInt8) {
            self.marketId = marketId
            self.creator = creator
            self.evidence = evidence
            self.requestedOutcome = requestedOutcome
            self.submittedAt = getCurrentBlock().timestamp
        }
    }

    access(all) struct Market {
        access(all) let id: UInt64
        access(all) let title: String
        access(all) let description: String
        access(all) let category: MarketCategory
        access(all) let options: [String]
        access(all) let creator: Address
        access(all) let createdAt: UFix64
        access(all) let endTime: UFix64
        access(all) let minBet: UFix64
        access(all) let maxBet: UFix64
        access(all) let status: MarketStatus
        access(all) let resolved: Bool
        access(all) let winningOption: UInt8?
        access(all) let totalShares: [UFix64]
        access(all) let totalPool: UFix64
        access(all) let imageUrl: String
        access(all) let optionCount: UInt8

        init(
            id: UInt64,
            title: String,
            description: String,
            category: MarketCategory,
            options: [String],
            creator: Address,
            endTime: UFix64,
            minBet: UFix64,
            maxBet: UFix64,
            status: MarketStatus,
            resolved: Bool,
            winningOption: UInt8?,
            totalPool: UFix64,
            imageUrl: String
        ) {
            pre {
                options.length >= 2: "Must have at least 2 options"
                options.length <= 10: "Cannot have more than 10 options"
                endTime > getCurrentBlock().timestamp: "End time must be in the future"
                minBet > 0.0: "Minimum bet must be positive"
                maxBet >= minBet: "Maximum bet must be >= minimum bet"
                imageUrl.length <= 500: "Image URL must be <= 500 characters"
            }

            self.id = id
            self.title = title
            self.description = description
            self.category = category
            self.options = options
            self.creator = creator
            self.createdAt = getCurrentBlock().timestamp
            self.endTime = endTime
            self.minBet = minBet
            self.maxBet = maxBet
            self.status = status
            self.resolved = resolved
            self.winningOption = winningOption
            self.totalPool = totalPool
            self.imageUrl = imageUrl
            self.optionCount = UInt8(options.length)

            // Initialize total shares array with zeros
            var sharesArray: [UFix64] = []
            var i = 0
            while i < options.length {
                sharesArray.append(0.0)
                i = i + 1
            }
            self.totalShares = sharesArray
        }
    }

    access(all) struct UserPosition {
        access(all) let marketId: UInt64
        access(all) let optionShares: [UFix64]
        access(all) let totalInvested: UFix64
        access(all) let averagePrice: UFix64
        access(all) let claimed: Bool
        access(all) let createdAt: UFix64

        init(
            marketId: UInt64,
            optionShares: [UFix64],
            totalInvested: UFix64,
            claimed: Bool
        ) {
            self.marketId = marketId
            self.optionShares = optionShares
            self.totalInvested = totalInvested
            self.claimed = claimed
            self.createdAt = getCurrentBlock().timestamp

            let totalShares: UFix64 = FlowWagerV2.getTotalShares(shares: optionShares)
            self.averagePrice = totalShares > 0.0 ? totalInvested / totalShares : 0.0
        }
    }

    access(all) struct UserStats {
        access(all) let totalMarketsParticipated: UInt64
        access(all) var totalWinnings: UFix64
        access(all) var totalLosses: UFix64
        access(all) var winStreak: UInt64
        access(all) var currentStreak: UInt64
        access(all) var longestWinStreak: UInt64
        access(all) var roi: UFix64
        access(all) var averageBetSize: UFix64
        access(all) var totalStaked: UFix64

        init(
            totalMarketsParticipated: UInt64,
            totalWinnings: UFix64,
            totalLosses: UFix64,
            winStreak: UInt64,
            currentStreak: UInt64,
            longestWinStreak: UInt64,
            roi: UFix64,
            averageBetSize: UFix64,
            totalStaked: UFix64
        ) {
            self.totalMarketsParticipated = totalMarketsParticipated
            self.totalWinnings = totalWinnings
            self.totalLosses = totalLosses
            self.winStreak = winStreak
            self.currentStreak = currentStreak
            self.longestWinStreak = longestWinStreak
            self.roi = roi
            self.averageBetSize = averageBetSize
            self.totalStaked = totalStaked
        }
    }

    access(all) struct PlatformStats {
        access(all) let totalMarkets: UInt64
        access(all) let activeMarkets: UInt64
        access(all) let pendingResolutionMarkets: UInt64
        access(all) let totalUsers: UInt64
        access(all) let totalVolume: UFix64
        access(all) let totalFees: UFix64
        access(all) let availableFeesForWithdrawal: UFix64

        init(
            totalMarkets: UInt64,
            activeMarkets: UInt64,
            pendingResolutionMarkets: UInt64,
            totalUsers: UInt64,
            totalVolume: UFix64,
            totalFees: UFix64,
            availableFeesForWithdrawal: UFix64
        ) {
            self.totalMarkets = totalMarkets
            self.activeMarkets = activeMarkets
            self.pendingResolutionMarkets = pendingResolutionMarkets
            self.totalUsers = totalUsers
            self.totalVolume = totalVolume
            self.totalFees = totalFees
            self.availableFeesForWithdrawal = availableFeesForWithdrawal
        }
    }

    access(all) struct ClaimableWinnings {
        access(all) let marketId: UInt64
        access(all) let amount: UFix64

        init(marketId: UInt64, amount: UFix64) {
            self.marketId = marketId
            self.amount = amount
        }
    }

    access(all) struct ResolutionDetails {
        access(all) let winningOption: UInt8
        access(all) let justification: String
        access(all) let resolutionType: String

        init(winningOption: UInt8, justification: String, resolutionType: String) {
            self.winningOption = winningOption
            self.justification = justification
            self.resolutionType = resolutionType
        }
    }

    // =====================================
    // USER PROFILE RESOURCE
    // =====================================

    access(all) resource interface UserProfilePublic {
        access(all) let address: Address
        access(all) var username: String
        access(all) let joinedAt: UFix64
        access(all) var displayName: String
        access(all) var bio: String
        access(all) var profileImageUrl: String

        access(all) fun getUsername(): String
        access(all) fun getDisplayName(): String
    }

    access(all) resource UserProfile: UserProfilePublic {
        access(all) let address: Address
        access(all) var username: String
        access(all) let joinedAt: UFix64
        access(all) var displayName: String
        access(all) var bio: String
        access(all) var profileImageUrl: String

        init(
            address: Address,
            username: String,
            displayName: String,
            bio: String,
            profileImageUrl: String
        ) {
            self.address = address
            self.username = username
            self.displayName = displayName
            self.joinedAt = getCurrentBlock().timestamp
            self.bio = bio
            self.profileImageUrl = profileImageUrl
        }

        access(contract) fun internalUpdateDisplayName(newName: String) {
            self.displayName = newName
        }

        access(all) fun updateBio(newBio: String) {
            self.bio = newBio
        }

        access(all) fun updateProfileImageUrl(newUrl: String) {
            self.profileImageUrl = newUrl
        }

        access(all) fun getUsername(): String {
            return self.username
        }

        access(all) fun getDisplayName(): String {
            return self.displayName
        }
    }

    access(all) fun createUserProfile(
        userAddress: Address,
        username: String,
        displayName: String,
        bio: String,
        profileImageUrl: String
    ): @UserProfile {
        return <-create UserProfile(
            address: userAddress,
            username: username,
            displayName: displayName,
            bio: bio,
            profileImageUrl: profileImageUrl
        )
    }

    // =====================================
    // STORAGE PATHS
    // =====================================

    access(all) let UserProfileStoragePath: StoragePath
    access(all) let UserProfilePublicPath: PublicPath
    access(all) let UserPositionsStoragePath: StoragePath
    access(all) let UserPositionsPublicPath: PublicPath
    access(all) let UserStatsStoragePath: StoragePath
    access(all) let UserStatsPublicPath: PublicPath
    access(all) let AdminStoragePath: StoragePath

    // =====================================
    // CONTRACT STATE
    // =====================================

    access(all) var nextMarketId: UInt64
    access(all) var platformFeePercentage: UFix64
    access(all) var evidenceResolutionPlatformFeePercentage: UFix64
    access(all) var evidenceResolutionCreatorIncentivePercentage: UFix64
    access(all) var totalPlatformFees: UFix64
    access(all) var totalVolumeTraded: UFix64
    access(all) var marketCreationFee: UFix64

    // Vaults for fees and market pools
    access(self) var platformVault: @FlowToken.Vault
    access(contract) var marketVaults: @{UInt64: FlowToken.Vault}

    access(all) let deployerAddress: Address
    access(all) var adminAddress: Address
    access(all) var paused: Bool
    access(all) var pendingAdmin: Address?
    access(all) var maxMarkets: UInt64
    access(all) var maxPositionsPerUser: UInt64

    // Market and user tracking
    access(contract) let markets: {UInt64: Market}
    access(contract) let registeredUsers: {Address: Bool}
    access(contract) let userStats: {Address: UserStats}
    access(contract) let marketsByCreator: {Address: [UInt64]}
    access(contract) let marketParticipants: {UInt64: {Address: Bool}}
    access(contract) let userMarketParticipation: {Address: {UInt64: Bool}}
    access(contract) let resolutionEvidence: {UInt64: ResolutionEvidence}
    access(contract) var referralCodes: {String: Address}
    access(contract) var wagerPoints: {Address: UInt64}
    access(contract) var referralCodeCounter: UInt64

    // Enforce unique usernames and display names
    access(contract) let takenUsernames: {String: Address}
    access(contract) let takenDisplayNames: {String: Address}

    // =====================================
    // RESOURCE INTERFACES
    // =====================================

    access(all) resource interface UserPositionsPublic {
        access(all) fun getAllPositions(): {UInt64: UserPosition}
    }

    access(all) resource interface UserStatsPublic {
        access(all) fun getStats(): UserStats
    }

    // =====================================
    // RESOURCES
    // =====================================

    access(all) resource UserPositions: UserPositionsPublic {
        access(all) var positions: {UInt64: UserPosition}

        init() {
            self.positions = {}
        }

        access(contract) fun addPosition(_ position: UserPosition) {
        if let existingPosition = self.positions[position.marketId] {
            // Combine positions
            var newOptionShares: [UFix64] = []
            var i = 0
            while i < existingPosition.optionShares.length {
                let existingShares = existingPosition.optionShares[i]
                let newShares = i < position.optionShares.length ? position.optionShares[i] : 0.0
                newOptionShares.append(existingShares + newShares)
                i = i + 1
            }

                let newPosition = UserPosition(
                    marketId: position.marketId,
                    optionShares: newOptionShares,
                    totalInvested: existingPosition.totalInvested + position.totalInvested,
                    claimed: false
                )
                self.positions[position.marketId] = newPosition
            } else {
                self.positions[position.marketId] = position
            }
        }

        access(contract) fun getPosition(marketId: UInt64): UserPosition? {
            return self.positions[marketId]
        }

        access(contract) fun markClaimed(marketId: UInt64) {
            if let existingPosition = self.positions[marketId] {
                let updatedPosition = UserPosition(
                    marketId: existingPosition.marketId,
                    optionShares: existingPosition.optionShares,
                    totalInvested: existingPosition.totalInvested,
                    claimed: true
                )
                self.positions[marketId] = updatedPosition
            }
        }

        access(all) fun getAllPositions(): {UInt64: UserPosition} {
            return self.positions
        }
    }

    access(all) resource UserStatsResource: UserStatsPublic {
        access(all) var stats: UserStats

        init() {
            self.stats = UserStats(
                totalMarketsParticipated: 0,
                totalWinnings: 0.0,
                totalLosses: 0.0,
                winStreak: 0,
                currentStreak: 0,
                longestWinStreak: 0,
                roi: 0.0,
                averageBetSize: 0.0,
                totalStaked: 0.0
            )
        }

        access(all) fun getStats(): UserStats {
            return self.stats
        }

        access(contract) fun updateStats(_ newStats: UserStats) {
            self.stats = newStats
        }
    }

    access(all) resource Admin {
        access(all) fun pauseContract() {
            pre {
                self.owner!.address == FlowWagerV2.adminAddress: "Only admin can pause"
            }
            FlowWagerV2.paused = true
        }

        access(all) fun unpauseContract() {
            pre {
                self.owner!.address == FlowWagerV2.adminAddress: "Only admin can unpause"
            }
            FlowWagerV2.paused = false
        }

        access(all) fun updatePlatformFee(newFeePercentage: UFix64) {
            pre {
                self.owner!.address == FlowWagerV2.adminAddress: "Only admin can update fees"
                newFeePercentage >= 0.0 && newFeePercentage <= 10.0: "Fee must be between 0% and 10%"
            }
            FlowWagerV2.platformFeePercentage = newFeePercentage
        }

        access(all) fun withdrawPlatformFees(amount: UFix64): @FlowToken.Vault {
            pre {
                self.owner!.address == FlowWagerV2.adminAddress: "Only admin can withdraw fees"
                amount > 0.0: "Amount must be positive"
            }

            let availableFees = FlowWagerV2.totalPlatformFees
            assert(amount <= availableFees, message: "Insufficient platform fees available for withdrawal")
            assert(amount <= FlowWagerV2.platformVault.balance, message: "Insufficient balance in platform vault")

            let feeVault <- FlowWagerV2.platformVault.withdraw(amount: amount) as! @FlowToken.Vault
            FlowWagerV2.totalPlatformFees = FlowWagerV2.totalPlatformFees - amount

            emit PlatformFeesWithdrawn(admin: self.owner!.address, amount: amount)
            return <-feeVault
        }

        access(all) fun withdrawAllPlatformFees(): @FlowToken.Vault {
            let availableFees = FlowWagerV2.totalPlatformFees
            return <-self.withdrawPlatformFees(amount: availableFees)
        }

        access(all) fun adminUpdateUserDisplayName(
            userProfile: &FlowWagerV2.UserProfile,
            newName: String
        ) {
            pre {
                self.owner!.address == FlowWagerV2.adminAddress: "Only admin can update display names"
                newName.length > 0 && newName.length <= 50: "New display name cannot be empty or too long"
            }

            if let existingAddress = FlowWagerV2.takenDisplayNames[newName] {
                assert(existingAddress == userProfile.address, message: "Display name is already taken")
            }

            let oldDisplayName = userProfile.displayName
            userProfile.internalUpdateDisplayName(newName: newName)
            let _ = FlowWagerV2.takenDisplayNames.remove(key: oldDisplayName)
            FlowWagerV2.takenDisplayNames[newName] = userProfile.address
        }

        access(all) fun updateMarketCreationFee(newFee: UFix64) {
            pre {
                self.owner!.address == FlowWagerV2.adminAddress: "Only admin can update market creation fee"
                newFee >= 0.0: "Fee cannot be negative"
            }
            let oldFee = FlowWagerV2.marketCreationFee
            FlowWagerV2.marketCreationFee = newFee
            emit MarketCreationFeeUpdated(oldFee: oldFee, newFee: newFee)
        }

        access(all) fun proposeAdminTransfer(newAdmin: Address) {
            pre {
                self.owner!.address == FlowWagerV2.adminAddress: "Only admin can propose transfer"
                newAdmin != FlowWagerV2.adminAddress: "New admin must be different from current"
            }
            FlowWagerV2.pendingAdmin = newAdmin
            emit AdminTransferProposed(currentAdmin: FlowWagerV2.adminAddress, proposedAdmin: newAdmin)
        }

        access(all) fun cancelAdminTransfer() {
            pre {
                self.owner!.address == FlowWagerV2.adminAddress: "Only admin can cancel transfer"
            }
            FlowWagerV2.pendingAdmin = nil
            emit AdminTransferCancelled(admin: self.owner!.address)
        }

        access(all) fun resolveMarket(
            marketId: UInt64,
            winningOptionIndex: UInt8,
            justification: String
        ) {
            pre {
                self.owner!.address == FlowWagerV2.adminAddress: "Only admin can resolve markets"
                winningOptionIndex < 10: "Invalid option index"
            }

            assert(FlowWagerV2.markets[marketId] != nil, message: "Market does not exist")
            let market = FlowWagerV2.markets[marketId]!

            assert(!market.resolved, message: "Market is already resolved")
            assert(market.status == MarketStatus.Active || market.status == MarketStatus.PendingResolution,
                   message: "Market cannot be resolved in its current state")
            assert(winningOptionIndex < UInt8(market.options.length), message: "Invalid winning option")

            let updatedMarket = Market(
                id: market.id,
                title: market.title,
                description: market.description,
                category: market.category,
                options: market.options,
                creator: market.creator,
                endTime: market.endTime,
                minBet: market.minBet,
                maxBet: market.maxBet,
                status: MarketStatus.Resolved,
                resolved: true,
                winningOption: winningOptionIndex,
                totalPool: market.totalPool,
                imageUrl: market.imageUrl
            )

            FlowWagerV2.markets[marketId] = updatedMarket
            emit MarketResolved(marketId: marketId, winningOption: winningOptionIndex, resolver: self.owner!.address, justification: justification)
        }

        access(all) fun rejectEvidence(marketId: UInt64, reason: String) {
            pre {
                self.owner!.address == FlowWagerV2.adminAddress: "Only admin can reject evidence"
            }
            assert(FlowWagerV2.resolutionEvidence[marketId] != nil, message: "No evidence found for this market")
            let _ = FlowWagerV2.resolutionEvidence.remove(key: marketId)
            emit EvidenceRejected(marketId: marketId, admin: self.owner!.address, reason: reason)
        }
    }

    // =====================================
    // HELPER FUNCTIONS
    // =====================================

    access(all) fun getTotalShares(shares: [UFix64]): UFix64 {
        var total: UFix64 = 0.0
        for share in shares {
            total = total + share
        }
        return total
    }

    access(all) fun getPlatformFeesAvailable(): UFix64 {
        let contractBalance = self.platformVault.balance
        return contractBalance > self.totalPlatformFees ? self.totalPlatformFees : contractBalance
    }

    access(all) fun getTotalMarketFunds(): UFix64 {
        var totalFunds: UFix64 = 0.0
        for marketId in self.marketVaults.keys {
            if let vault = &self.marketVaults[marketId] as &FlowToken.Vault? {
                totalFunds = totalFunds + vault.balance
            }
        }
        return totalFunds
    }

    access(all) fun updateUserStatsAfterWin(user: Address, payout: UFix64, invested: UFix64) {
        if let stats = self.userStats[user] {
            let newStats = UserStats(
                totalMarketsParticipated: stats.totalMarketsParticipated,
                totalWinnings: stats.totalWinnings + payout,
                totalLosses: stats.totalLosses,
                winStreak: stats.winStreak + 1,
                currentStreak: stats.currentStreak + 1,
                longestWinStreak: stats.longestWinStreak > stats.currentStreak + 1 ? stats.longestWinStreak : stats.currentStreak + 1,
                roi: ((stats.totalWinnings + payout) - stats.totalStaked) / stats.totalStaked,
                averageBetSize: stats.totalStaked / UFix64(stats.totalMarketsParticipated),
                totalStaked: stats.totalStaked
            )
            self.userStats[user] = newStats
        }
    }

    access(all) fun updateUserStatsAfterLoss(user: Address, lossAmount: UFix64) {
        if let stats = self.userStats[user] {
            let newStats = UserStats(
                totalMarketsParticipated: stats.totalMarketsParticipated,
                totalWinnings: stats.totalWinnings,
                totalLosses: stats.totalLosses + lossAmount,
                winStreak: 0,
                currentStreak: 0,
                longestWinStreak: stats.longestWinStreak,
                roi: (stats.totalWinnings - (stats.totalLosses + lossAmount)) / stats.totalStaked,
                averageBetSize: stats.totalStaked / UFix64(stats.totalMarketsParticipated),
                totalStaked: stats.totalStaked
            )
            self.userStats[user] = newStats
        }
    }

    access(all) fun getPlatformStats(): PlatformStats {
        var activeMarketsCount: UInt64 = 0
        var pendingResolutionMarketsCount: UInt64 = 0
        for market in self.markets.values {
            if market.status == MarketStatus.Active {
                activeMarketsCount = activeMarketsCount + 1
            } else if market.status == MarketStatus.PendingResolution {
                pendingResolutionMarketsCount = pendingResolutionMarketsCount + 1
            }
        }

        return PlatformStats(
            totalMarkets: UInt64(self.markets.length),
            activeMarkets: activeMarketsCount,
            pendingResolutionMarkets: pendingResolutionMarketsCount,
            totalUsers: UInt64(self.registeredUsers.length),
            totalVolume: self.totalVolumeTraded,
            totalFees: self.totalPlatformFees,
            availableFeesForWithdrawal: self.getPlatformFeesAvailable()
        )
    }

    access(all) fun getMarketById(marketId: UInt64): Market? {
        return self.markets[marketId]
    }

    access(all) fun getAllMarkets(): [Market] {
        return self.markets.values
    }

    access(all) fun getMarketsByCreator(creator: Address): [Market] {
        let marketIds = self.marketsByCreator[creator] ?? []
        var markets: [Market] = []
        for marketId in marketIds {
            if let market = self.markets[marketId] {
                markets.append(market)
            }
        }
        return markets
    }

    access(all) fun getUserStats(user: Address): UserStats? {
        return self.userStats[user]
    }

    // =====================================
    // MAIN FUNCTIONS
    // =====================================

    access(all) fun createMarket(
        title: String,
        description: String,
        category: MarketCategory,
        options: [String],
        endTime: UFix64,
        minBet: UFix64,
        maxBet: UFix64,
        imageUrl: String,
        creationFeeVault: @FlowToken.Vault?,
        address: Address
    ): UInt64 {
        pre {
            !self.paused: "Contract is paused"
            UInt64(self.markets.length) < self.maxMarkets: "Market cap reached"
            options.length >= 2: "Must have at least 2 options"
            options.length <= 10: "Cannot have more than 10 options"
            endTime > getCurrentBlock().timestamp: "End time must be in the future"
            minBet > 0.0: "Minimum bet must be positive"
            maxBet >= minBet: "Maximum bet must be >= minimum bet"
            imageUrl.length <= 500: "Image URL must be <= 500 characters"
        }

        var i = 0
        while i < options.length {
            let option = options[i]
            assert(option.length > 0 && option.length <= 100, message: "Each option must be 1-100 characters")
            i = i + 1
        }

        let marketId = self.nextMarketId
        let creator = address
        let isDeployer = creator == self.deployerAddress

        if isDeployer {
            if let vault <- creationFeeVault {
                destroy vault
            }
        } else {
            if let vault <- creationFeeVault {
                assert(vault.balance >= self.marketCreationFee, message: "Insufficient creation fee")

                let feeVault <- vault.withdraw(amount: self.marketCreationFee) as! @FlowToken.Vault
                let platformVaultRef = &self.platformVault as &FlowToken.Vault
                platformVaultRef.deposit(from: <-feeVault)
                self.totalPlatformFees = self.totalPlatformFees + self.marketCreationFee
                destroy vault
                emit MarketCreationFeePaid(creator: creator, amount: self.marketCreationFee)
            } else {
                panic("Creation fee required for non-deployers")
            }
        }

        let newMarketVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
        self.marketVaults[marketId] <-! newMarketVault

        let market = Market(
            id: marketId,
            title: title,
            description: description,
            category: category,
            options: options,
            creator: creator,
            endTime: endTime,
            minBet: minBet,
            maxBet: maxBet,
            status: MarketStatus.Active,
            resolved: false,
            winningOption: nil,
            totalPool: 0.0,
            imageUrl: imageUrl
        )

        self.markets[marketId] = market
        self.nextMarketId = self.nextMarketId + 1

        if self.marketsByCreator[creator] == nil {
            self.marketsByCreator[creator] = []
        }
        self.marketsByCreator[creator]!.append(marketId)

        emit MarketCreated(marketId: marketId, title: title, creator: creator, optionCount: UInt8(options.length), imageUrl: imageUrl)
        return marketId
    }

    access(all) fun registerUser(
        userAddress: Address,
        username: String,
        displayName: String,
        bio: String,
        profileImageUrl: String
    ) {
        pre {
            !self.paused: "Contract is paused"
            username.length > 0 && username.length <= 50: "Username must be 1-50 characters"
            displayName.length > 0 && displayName.length <= 50: "Display name must be 1-50 characters"
            bio.length <= 500: "Bio must be <= 500 characters"
            profileImageUrl.length <= 500: "Profile image URL must be <= 500 characters"
            self.registeredUsers[userAddress] == nil: "User already registered"
        }

        assert(self.takenUsernames[username] == nil, message: "Username already taken")
        assert(self.takenDisplayNames[displayName] == nil, message: "Display name already taken")

        self.registeredUsers[userAddress] = true
        self.takenUsernames[username] = userAddress
        self.takenDisplayNames[displayName] = userAddress

        let userStatsData = UserStats(
            totalMarketsParticipated: 0,
            totalWinnings: 0.0,
            totalLosses: 0.0,
            winStreak: 0,
            currentStreak: 0,
            longestWinStreak: 0,
            roi: 0.0,
            averageBetSize: 0.0,
            totalStaked: 0.0
        )
        self.userStats[userAddress] = userStatsData

        emit UserRegistered(address: userAddress, username: username)
    }

    access(all) fun submitEvidence(
        marketId: UInt64,
        evidence: String,
        requestedWinningOption: UInt8,
        creatorAddress: Address
    ) {
        pre {
            !self.paused: "Contract is paused"
            evidence.length > 0 && evidence.length <= 5000: "Evidence must be 1-5000 characters"
        }

        assert(self.markets[marketId] != nil, message: "Market does not exist")
        let market = self.markets[marketId]!

        assert(market.creator == creatorAddress, message: "Only market creator can submit evidence")
        assert(!market.resolved, message: "Market is already resolved")
        assert(requestedWinningOption < UInt8(market.options.length), message: "Invalid winning option")

        let resolutionEvidence = ResolutionEvidence(
            marketId: marketId,
            creator: creatorAddress,
            evidence: evidence,
            requestedOutcome: requestedWinningOption
        )

        self.resolutionEvidence[marketId] = resolutionEvidence

        let _market = self.markets[marketId]!
        let updatedMarket = Market(
            id: market.id,
            title: market.title,
            description: market.description,
            category: market.category,
            options: market.options,
            creator: market.creator,
            endTime: market.endTime,
            minBet: market.minBet,
            maxBet: market.maxBet,
            status: MarketStatus.PendingResolution,
            resolved: false,
            winningOption: nil,
            totalPool: market.totalPool,
            imageUrl: market.imageUrl
        )

        self.markets[marketId] = updatedMarket
        emit EvidenceSubmitted(marketId: marketId, creator: creatorAddress, evidence: evidence, requestedOutcome: requestedWinningOption)
    }

    // =====================================
    // MARKET POOL MANAGEMENT
    // =====================================

    /// Deposits payment into a market vault
    /// Called by transactions when placing bets
    access(contract) fun depositToMarketVault(marketId: UInt64, vault: @FlowToken.Vault) {
        pre {
            self.marketVaults[marketId] != nil: "Market vault does not exist"
        }

        let amount = vault.balance
        let marketVaultRef = &self.marketVaults[marketId] as &FlowToken.Vault?

        if marketVaultRef != nil {
            marketVaultRef!.deposit(from: <-vault)
        } else {
            destroy vault
            panic("Market vault not found")
        }

        // Update market total pool by creating new Market struct
        if let market = self.markets[marketId] {
            let updatedMarket = Market(
                id: market.id,
                title: market.title,
                description: market.description,
                category: market.category,
                options: market.options,
                creator: market.creator,
                endTime: market.endTime,
                minBet: market.minBet,
                maxBet: market.maxBet,
                status: market.status,
                resolved: market.resolved,
                winningOption: market.winningOption,
                totalPool: market.totalPool + amount,
                imageUrl: market.imageUrl
            )
            self.markets[marketId] = updatedMarket
        }

        self.totalVolumeTraded = self.totalVolumeTraded + amount
    }

    /// Records a bet in contract tracking structures
    /// Called by transactions after position is created
    access(contract) fun recordBet(
        marketId: UInt64,
        bettorAddress: Address,
        optionIndex: UInt8,
        betAmount: UFix64
    ) {
        pre {
            self.markets[marketId] != nil: "Market does not exist"
            self.registeredUsers[bettorAddress] != nil: "User is not registered"
        }

        // Track market participation
        if self.marketParticipants[marketId] == nil {
            self.marketParticipants[marketId] = {}
        }

        var marketParticipants = self.marketParticipants[marketId]!
        marketParticipants[bettorAddress] = true
        self.marketParticipants[marketId] = marketParticipants

        if self.userMarketParticipation[bettorAddress] == nil {
            self.userMarketParticipation[bettorAddress] = {}
        }

        var userParticipation = self.userMarketParticipation[bettorAddress]!
        userParticipation[marketId] = true
        self.userMarketParticipation[bettorAddress] = userParticipation

        // Update user stats
        if let stats = self.userStats[bettorAddress] {
            let newStats = UserStats(
                totalMarketsParticipated: stats.totalMarketsParticipated,
                totalWinnings: stats.totalWinnings,
                totalLosses: stats.totalLosses,
                winStreak: stats.winStreak,
                currentStreak: stats.currentStreak,
                longestWinStreak: stats.longestWinStreak,
                roi: stats.roi,
                averageBetSize: (stats.averageBetSize * UFix64(stats.totalMarketsParticipated) + betAmount) / UFix64(stats.totalMarketsParticipated + 1),
                totalStaked: stats.totalStaked + betAmount
            )
            self.userStats[bettorAddress] = newStats
        }

        emit SharesPurchased(marketId: marketId, buyer: bettorAddress, optionIndex: optionIndex, shares: betAmount, amount: betAmount)
    }

    /// Validates that a bet is allowed
    access(all) fun validateBet(marketId: UInt64, optionIndex: UInt8, betAmount: UFix64) {
        pre {
            !self.paused: "Contract is paused"
            self.markets[marketId] != nil: "Market does not exist"
        }

        let market = self.markets[marketId]!

        assert(market.status == MarketStatus.Active, message: "Market is not active")
        assert(optionIndex < UInt8(market.options.length), message: "Invalid option index")
        assert(betAmount >= market.minBet, message: "Bet below minimum")
        assert(betAmount <= market.maxBet, message: "Bet exceeds maximum")
    }

    /// Get market vault balance for validation
    access(all) fun getMarketVaultBalance(marketId: UInt64): UFix64 {
        let vaultRef = &self.marketVaults[marketId] as &FlowToken.Vault?
        if vaultRef != nil {
            return vaultRef!.balance
        }
        return 0.0
    }

    /// Helper function to validate market vault has sufficient funds
    access(all) fun marketVaultHasSufficientFunds(marketId: UInt64, amount: UFix64): Bool {
        let vaultRef = &self.marketVaults[marketId] as &FlowToken.Vault?
        if vaultRef != nil {
            return vaultRef!.balance >= amount
        }
        return false
    }

    /// Calculates winnings for a user in a resolved market
    access(all) fun calculateWinnings(
        marketId: UInt64,
        userPosition: UserPosition
    ): UFix64 {
        pre {
            self.markets[marketId] != nil: "Market does not exist"
        }

        let market = self.markets[marketId]!

        assert(market.resolved, message: "Market is not resolved")
        assert(market.winningOption != nil, message: "No winning option set")
        assert(!userPosition.claimed, message: "Winnings already claimed")

        let winningOptionIndex = market.winningOption!
        let winningShares = userPosition.optionShares[Int(winningOptionIndex)]

        assert(winningShares > 0.0, message: "User did not bet on winning option")

        // Note: The transaction must calculate total winning shares
        // This function only validates and returns the user's share amount
        return winningShares
    }

    /// Marks a position as claimed
    /// Called after winnings are withdrawn
    access(contract) fun markPositionClaimed(userPositions: &FlowWagerV2.UserPositions, marketId: UInt64) {
        userPositions.markClaimed(marketId: marketId)
    }

    /// Get market participants for a market
    access(all) fun getMarketParticipants(marketId: UInt64): {Address: Bool} {
        return self.marketParticipants[marketId] ?? {}
    }

    /// Get user market participation
    access(all) fun getUserMarketParticipation(userAddress: Address, marketId: UInt64): Bool {
        if let userParticipation = self.userMarketParticipation[userAddress] {
            return userParticipation[marketId] ?? false
        }
        return false
    }


       access(all) fun createUserAccount(
            userAddress: Address,
            username: String,
            displayName: String
        ) {
            pre {
                !self.paused: "Contract is paused"
                username.length > 0 && username.length <= 50: "Username must be 1-50 characters"
                displayName.length > 0 && displayName.length <= 50: "Display name must be 1-50 characters"
                self.registeredUsers[userAddress] == nil: "User already registered"
            }

            assert(self.takenUsernames[username] == nil, message: "Username already taken")
            assert(self.takenDisplayNames[displayName] == nil, message: "Display name already taken")

            self.registeredUsers[userAddress] = true
            self.takenUsernames[username] = userAddress
            self.takenDisplayNames[displayName] = userAddress

            let userStatsData = UserStats(
                totalMarketsParticipated: 0,
                totalWinnings: 0.0,
                totalLosses: 0.0,
                winStreak: 0,
                currentStreak: 0,
                longestWinStreak: 0,
                roi: 0.0,
                averageBetSize: 0.0,
                totalStaked: 0.0
            )
            self.userStats[userAddress] = userStatsData

            emit UserRegistered(address: userAddress, username: username)
        }


        access(all) fun createUserPositions(): @UserPositions {
               return <- create UserPositions()
           }

           /// Creates an empty UserStatsResource for a user
           access(all) fun createUserStatsResource(): @UserStatsResource {
               return <- create UserStatsResource()
           }

    init() {
        // Storage paths
        self.UserProfileStoragePath = /storage/FlowWagerV2UserProfile
        self.UserProfilePublicPath = /public/FlowWagerV2UserProfile
        self.UserPositionsStoragePath = /storage/FlowWagerV2UserPositions
        self.UserPositionsPublicPath = /public/FlowWagerV2UserPositions
        self.UserStatsStoragePath = /storage/FlowWagerV2UserStats
        self.UserStatsPublicPath = /public/FlowWagerV2UserStats
        self.AdminStoragePath = /storage/FlowWagerV2Admin

        // Contract state initialization
        self.paused = false
        self.nextMarketId = 1
        self.adminAddress = self.account.address
        self.deployerAddress = self.account.address
        self.platformFeePercentage = 10.0
        self.evidenceResolutionPlatformFeePercentage = 1.0
        self.evidenceResolutionCreatorIncentivePercentage = 2.0
        self.marketCreationFee = 1.0
        self.totalPlatformFees = 0.0
        self.totalVolumeTraded = 0.0
        self.maxMarkets = 100000
        self.maxPositionsPerUser = 10000
        self.pendingAdmin = nil
        self.referralCodeCounter = 0

        // Initialize collections
        self.markets = {}
        self.registeredUsers = {}
        self.userStats = {}
        self.marketsByCreator = {}
        self.marketParticipants = {}
        self.userMarketParticipation = {}
        self.resolutionEvidence = {}
        self.takenUsernames = {}
        self.takenDisplayNames = {}
        self.referralCodes = {}
        self.wagerPoints = {}

        // Initialize vaults
        self.platformVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
        self.marketVaults <- {}

        // Create admin resource
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)

        emit ContractInitialized()
    }
}
