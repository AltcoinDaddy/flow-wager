import "FungibleToken"
import "FlowToken"

access(all) contract FlowWager {
    access(all) event ContractInitialized()
    access(all) event MarketCreated(marketId: UInt64, title: String, creator: Address, imageUrl: String)
    access(all) event SharesPurchased(marketId: UInt64, buyer: Address, option: UInt8, shares: UFix64, amount: UFix64)
    access(all) event MarketResolved(marketId: UInt64, outcome: UInt8, resolver: Address, justification: String)
    access(all) event WinningsClaimed(marketId: UInt64, claimer: Address, amount: UFix64)
    access(all) event UserRegistered(address: Address, username: String)
    access(all) event PlatformFeesWithdrawn(admin: Address, amount: UFix64)
    access(all) event MarketCreationFeePaid(creator: Address, amount: UFix64)
    access(all) event BatchWinningmarketCreationFeesClaimed(claimer: Address, marketCount: UInt64, totalAmount: UFix64)
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

    //
    // ENUMS
    //
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

    access(all) enum MarketOutcome: UInt8 {
        access(all) case OptionA
        access(all) case OptionB
        access(all) case Draw
        access(all) case Cancelled
    }

    //
    // STRUCTS
    //

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
        access(all) let optionA: String
        access(all) let optionB: String
        access(all) let creator: Address
        access(all) let createdAt: UFix64
        access(all) let endTime: UFix64
        access(all) let minBet: UFix64
        access(all) let maxBet: UFix64
        access(all) let status: MarketStatus
        access(all) let outcome: MarketOutcome?
        access(all) let resolved: Bool
        access(all) let totalOptionAShares: UFix64
        access(all) let totalOptionBShares: UFix64
        access(all) let totalPool: UFix64
        access(all) let imageUrl: String

        init(
            id: UInt64,
            title: String,
            description: String,
            category: MarketCategory,
            optionA: String,
            optionB: String,
            creator: Address,
            endTime: UFix64,
            minBet: UFix64,
            maxBet: UFix64,
            status: MarketStatus,
            outcome: MarketOutcome?,
            resolved: Bool,
            totalOptionAShares: UFix64,
            totalOptionBShares: UFix64,
            totalPool: UFix64,
            imageUrl: String,
        ) {
            self.id = id
            self.title = title
            self.description = description
            self.category = category
            self.optionA = optionA
            self.optionB = optionB
            self.creator = creator
            self.createdAt = getCurrentBlock().timestamp
            self.endTime = endTime
            self.minBet = minBet
            self.maxBet = maxBet
            self.status = status
            self.outcome = outcome
            self.resolved = resolved
            self.totalOptionAShares = totalOptionAShares
            self.totalOptionBShares = totalOptionBShares
            self.totalPool = totalPool
            self.imageUrl = imageUrl
        }
    }

    access(all) struct UserPosition {
        access(all) let marketId: UInt64
        access(all) let optionAShares: UFix64
        access(all) let optionBShares: UFix64
        access(all) let totalInvested: UFix64
        access(all) let averagePrice: UFix64
        access(all) let claimed: Bool

        init(marketId: UInt64, optionAShares: UFix64, optionBShares: UFix64, totalInvested: UFix64, claimed: Bool) {
            self.marketId = marketId
            self.optionAShares = optionAShares
            self.optionBShares = optionBShares
            self.totalInvested = totalInvested
            let totalShares = optionAShares + optionBShares
            self.averagePrice = totalShares > 0.0 ? totalInvested / totalShares : 0.0
            self.claimed = claimed
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
        access(all) let outcome: UInt8
        access(all) let justification: String
        access(all) let resolutionType: String

        init(outcome: UInt8, justification: String, resolutionType: String) {
            self.outcome = outcome
            self.justification = justification
            self.resolutionType = resolutionType
        }
    }

    //
    // USER PROFILE RESOURCE
    //

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

        init(address: Address, username: String, displayName: String, bio: String, profileImageUrl: String) {
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

    // PATCH: Resource creation just returns @UserProfile (storage handled in tx)
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

    // Storage paths for UserProfile
    access(all) let UserProfileStoragePath: StoragePath
    access(all) let UserProfilePublicPath: PublicPath

    //
    // CONTRACT STATE
    //

    access(all) var nextMarketId: UInt64
    access(all) var platformFeePercentage: UFix64
    access(all) var evidenceResolutionPlatformFeePercentage: UFix64 
    access(all) var evidenceResolutionCreatorIncentivePercentage: UFix64
    access(all) var totalPlatformFees: UFix64
    access(all) var totalVolumeTraded: UFix64
    access(self) var flowVault: @FlowToken.Vault

    access(all) let deployerAddress: Address
    access(all) var adminAddress: Address
    access(all) var paused: Bool
    access(all) var pendingAdmin: Address?
    access(all) var marketCreationFee: UFix64

    access(all) let UserPositionsStoragePath: StoragePath
    access(all) let UserPositionsPublicPath: PublicPath
    access(all) let UserStatsStoragePath: StoragePath
    access(all) let UserStatsPublicPath: PublicPath
    access(all) let AdminStoragePath: StoragePath

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
    access(all) var maxMarkets: UInt64
    access(all) var maxPositionsPerUser: UInt64

    // Mappings to enforce unique usernames and display names
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
                let newPosition = UserPosition(
                    marketId: position.marketId,
                    optionAShares: existingPosition.optionAShares + position.optionAShares,
                    optionBShares: existingPosition.optionBShares + position.optionBShares,
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
                    optionAShares: existingPosition.optionAShares,
                    optionBShares: existingPosition.optionBShares,
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
                self.owner!.address == FlowWager.adminAddress: "Only admin can pause"
            }
            FlowWager.paused = true
        }
        
        access(all) fun unpauseContract() {
            pre {
                self.owner!.address == FlowWager.adminAddress: "Only admin can unpause"
            }
            FlowWager.paused = false
        }
        
        access(all) fun updatePlatformFee(newFeePercentage: UFix64) {
            pre {
                self.owner!.address == FlowWager.adminAddress: "Only admin can update fees"
                newFeePercentage >= 0.0 && newFeePercentage <= 10.0: "Fee must be between 0% and 10%"
            }
            FlowWager.platformFeePercentage = newFeePercentage
        }
        
        access(all) fun withdrawPlatformFees(amount: UFix64): @FlowToken.Vault {
            pre {
                self.owner!.address == FlowWager.adminAddress: "Only admin can withdraw fees"
                amount > 0.0: "Amount must be positive"
            }
            
            let availableFees = FlowWager.totalPlatformFees
            assert(amount <= availableFees, message: "Insufficient platform fees available for withdrawal")
            
            let feeVault <- FlowWager.flowVault.withdraw(amount: amount) as! @FlowToken.Vault
            FlowWager.totalPlatformFees = FlowWager.totalPlatformFees - amount
            
            emit PlatformFeesWithdrawn(admin: self.owner!.address, amount: amount)
            return <-feeVault
        }
        
        access(all) fun withdrawAllPlatformFees(): @FlowToken.Vault {
            let availableFees = FlowWager.totalPlatformFees
            return <-self.withdrawPlatformFees(amount: availableFees)
        }

        // Admin function to change a user's display name
        access(all) fun adminUpdateUserDisplayName(userProfile: &FlowWager.UserProfile, newName: String) {
            pre {
                self.owner!.address == FlowWager.adminAddress: "Only admin can update display names via this function"
                newName.length > 0 && newName.length <= 50: "New display name cannot be empty or too long"
            }

            // Ensure the new display name is not already taken by another user
            if let existingAddress = FlowWager.takenDisplayNames[newName] {
                assert(existingAddress == userProfile.address, message: "New display name '".concat(newName).concat("' is already taken by another user."))
            }

            // Remove old display name from tracking map
            let oldDisplayName = userProfile.displayName
            let _ = FlowWager.takenDisplayNames.remove(key: oldDisplayName)

            // Update the display name in the UserProfile resource using its internal function
            userProfile.internalUpdateDisplayName(newName: newName)

            // Add new display name to tracking map
            FlowWager.takenDisplayNames[newName] = userProfile.address
        }
    }

    // CONTRACT LEVEL FUNCTIONS
        access(contract) fun determineResolution(
        marketId: UInt64,
        adminOutcome: UInt8,
        adminJustification: String
    ): ResolutionDetails {
        if let evidence = FlowWager.resolutionEvidence[marketId] {
            if adminOutcome == evidence.requestedOutcome {
                return ResolutionDetails(
                    outcome: evidence.requestedOutcome,
                    justification: "Evidence-based: ".concat(evidence.evidence),
                    resolutionType: "approved"
                )
            } else {
                return ResolutionDetails(
                    outcome: adminOutcome,
                    justification: "Admin override: ".concat(adminJustification)
                        .concat(" | Creator evidence: ").concat(evidence.evidence),
                    resolutionType: "override"
                )
            }
        } else {
            return ResolutionDetails(
                outcome: adminOutcome,
                justification: "Emergency resolution: ".concat(adminJustification),
                resolutionType: "emergency"
            )
        }
    }



    // =====================================
    // HELPER FUNCTIONS  
    // =====================================
    // ... [all unchanged] ...

    access(contract) fun calculatePayoutForPosition(marketId: UInt64, position: UserPosition): UFix64 {
        let market = FlowWager.markets[marketId] ?? panic("Market does not exist")
        
        if position.claimed {
            return 0.0
        }
        
        let distributablePool = market.totalPool * (1.0 - (FlowWager.platformFeePercentage / 100.0))

        if market.outcome == MarketOutcome.Draw || market.outcome == MarketOutcome.Cancelled {
            return position.totalInvested
        }
        
        let winningShares: UFix64 =
            (market.outcome == MarketOutcome.OptionA && position.optionAShares > 0.0) ? position.optionAShares :
            (market.outcome == MarketOutcome.OptionB && position.optionBShares > 0.0) ? position.optionBShares : 0.0
        
        var totalWinningShares: UFix64 =
            market.outcome == MarketOutcome.OptionA ? market.totalOptionAShares :
            market.outcome == MarketOutcome.OptionB ? market.totalOptionBShares : 0.0
        
        if totalWinningShares == 0.0 || winningShares == 0.0 {
            return 0.0
        }
        
        return distributablePool * (winningShares / totalWinningShares)
    }


     access(contract) fun updateUserStatsAfterBet(user: Address, betAmount: UFix64, marketId: UInt64) {
        if let currentStats = FlowWager.userStats[user] {
            var isNewMarket = false
            if FlowWager.userMarketParticipation[user] == nil {
                FlowWager.userMarketParticipation[user] = {}
            }
            let userParticipation = FlowWager.userMarketParticipation[user]!
            if !(userParticipation[marketId] ?? false) {
                userParticipation[marketId] = true
                FlowWager.userMarketParticipation[user] = userParticipation
                isNewMarket = true
            }
            
            let totalMarkets = isNewMarket ? currentStats.totalMarketsParticipated + 1 : currentStats.totalMarketsParticipated
            let newTotalStaked = currentStats.totalStaked + betAmount
            let newAverageBetSize = totalMarkets > 0 ? newTotalStaked / UFix64(totalMarkets) : 0.0
            let netProfit = currentStats.totalWinnings - currentStats.totalLosses
            let newRoi = newTotalStaked > 0.0 ? (netProfit / newTotalStaked) * 100.0 : 0.0
            
            let updatedStats = UserStats(
                totalMarketsParticipated: totalMarkets,
                totalWinnings: currentStats.totalWinnings,
                totalLosses: currentStats.totalLosses,
                winStreak: currentStats.winStreak,
                currentStreak: currentStats.currentStreak,
                longestWinStreak: currentStats.longestWinStreak,
                roi: newRoi,
                averageBetSize: newAverageBetSize,
                totalStaked: newTotalStaked
            )
            FlowWager.userStats[user] = updatedStats
        }
    }



     access(all) fun generateReferralCode(address: Address): String {
        pre {
            !self.paused: "Contract is paused for migration/upgrade"
            FlowWager.registeredUsers.containsKey(self.account.address): "User must be registered to generate referral code"
        }
        let user = address
        let globalCounter = FlowWager.referralCodeCounter + 1
        FlowWager.referralCodeCounter = globalCounter
        
        let addressString = user.toString()
        let code = "WAGER-".concat(addressString).concat("-").concat(globalCounter.toString())

        assert(FlowWager.referralCodes[code] == nil, message: "Generated referral code already exists. This should not happen.")

        FlowWager.referralCodes[code] = user
        emit ReferralCodeGenerated(user: user, code: code)
        return code
    }
    
access(all) fun submitResolutionEvidence(
    address: Address,
    marketId: UInt64,
    evidence: String,
    requestedOutcome: UInt8
) {
    pre {
        !self.paused: "Contract is paused for migration/upgrade"
        FlowWager.markets.containsKey(marketId): "Market does not exist"
        evidence.length <= 1000: "Evidence too long (max 1000 characters)"
        requestedOutcome == MarketOutcome.OptionA.rawValue ||
        requestedOutcome == MarketOutcome.OptionB.rawValue ||
        requestedOutcome == MarketOutcome.Draw.rawValue ||
        requestedOutcome == MarketOutcome.Cancelled.rawValue : "Invalid outcome"
    }
    
    let market = FlowWager.markets[marketId]!
    let submitter = address
    
    assert(submitter == market.creator, message: "Only market creator can submit evidence")
    assert(getCurrentBlock().timestamp >= market.endTime, message: "Market hasn't ended yet")
    assert(!market.resolved, message: "Market already resolved")
    
    // Auto-transition if market is still Active but has ended
    if market.status == MarketStatus.Active {
        self.transitionEndedMarketToPendingResolution(marketId: marketId)
    } else {
        assert(market.status == MarketStatus.PendingResolution, message: "Market must be in PendingResolution status")
    }
    
    let evidenceStruct = ResolutionEvidence(
        marketId: marketId,
        creator: submitter,
        evidence: evidence,
        requestedOutcome: requestedOutcome
    )
    
    FlowWager.resolutionEvidence[marketId] = evidenceStruct
    
    emit EvidenceSubmitted(
        marketId: marketId,
        creator: submitter,
        evidence: evidence,
        requestedOutcome: requestedOutcome
    )
}
    
access(all) fun placeBet(
    userAddress: Address,
    marketId: UInt64,
    option: UInt8,
    betVault: @FlowToken.Vault,
    userPositionsCap: Capability<&FlowWager.UserPositions>,
    newPosition: UserPosition
) {
    pre {
        !self.paused: "Contract is paused for migration/upgrade"
        FlowWager.markets.containsKey(marketId): "Market does not exist"
        option == MarketOutcome.OptionA.rawValue || option == MarketOutcome.OptionB.rawValue: "Option must be 0 (A) or 1 (B)"
        betVault.balance > 0.0: "Bet amount must be positive"
        FlowWager.registeredUsers.containsKey(userAddress): "Bettor must be a registered user."
        userPositionsCap.check(): "Invalid UserPositions capability"
        newPosition.marketId == marketId: "Position market ID must match"
        newPosition.totalInvested == betVault.balance: "Position totalInvested must match bet amount"
    }
    
    let market = FlowWager.markets[marketId]!
    let betAmount = betVault.balance
    let bettor = userAddress
    
    assert(market.status == MarketStatus.Active, message: "Market is not active for betting")
    assert(getCurrentBlock().timestamp < market.endTime, message: "Betting has ended for this market")
    assert(betAmount >= market.minBet, message: "Bet amount is below the minimum required for this market")
    assert(betAmount <= market.maxBet, message: "Bet amount exceeds the maximum allowed for this market") 
    
    // Borrow UserPositions using the provided capability
    let userPositionsRef = userPositionsCap.borrow()
        ?? panic("Could not borrow UserPositions from capability")
    
    // Deposit bet amount to contract's vault
    self.flowVault.deposit(from: <-betVault)

    self.totalVolumeTraded = self.totalVolumeTraded + betAmount

    let shares = betAmount
    
    // Update market shares and pool
    let updatedMarket = Market(
        id: market.id,
        title: market.title,
        description: market.description,
        category: market.category,
        optionA: market.optionA,
        optionB: market.optionB,
        creator: market.creator,
        endTime: market.endTime,
        minBet: market.minBet,
        maxBet: market.maxBet,
        status: market.status,
        outcome: market.outcome,
        resolved: market.resolved,
        totalOptionAShares: option == MarketOutcome.OptionA.rawValue ? market.totalOptionAShares + shares : market.totalOptionAShares,
        totalOptionBShares: option == MarketOutcome.OptionB.rawValue ? market.totalOptionBShares + shares : market.totalOptionBShares,
        totalPool: market.totalPool + betAmount,
        imageUrl: market.imageUrl
    )
    
    FlowWager.markets[marketId] = updatedMarket
    
    // Add position to user's UserPositions
    userPositionsRef.addPosition(newPosition)
    
    // Update market participants
    if FlowWager.marketParticipants[marketId] == nil {
        FlowWager.marketParticipants[marketId] = {}
    }
    var participants = FlowWager.marketParticipants[marketId]!
    participants[bettor] = true
    FlowWager.marketParticipants[marketId] = participants
    
    // Update stats and points
    self.updateUserStatsAfterBet(user: bettor, betAmount: betAmount, marketId: marketId)
    
    let currentPoints = FlowWager.wagerPoints[bettor] ?? 0
    FlowWager.wagerPoints[bettor] = currentPoints + UInt64(betAmount)
    
    emit SharesPurchased(
        marketId: marketId,
        buyer: bettor,
        option: option,
        shares: shares,
        amount: betAmount
    )
    emit WagerPointsEarned(user: bettor, points: UInt64(betAmount))
}

    
access(all) fun resolveMarket(
    marketId: UInt64,
    outcome: UInt8,
    justification: String
) {
    pre {
        !self.paused: "Contract is paused for migration/upgrade"
        FlowWager.markets.containsKey(marketId): "Market does not exist"
        outcome == MarketOutcome.OptionA.rawValue ||
        outcome == MarketOutcome.OptionB.rawValue ||
        outcome == MarketOutcome.Draw.rawValue ||
        outcome == MarketOutcome.Cancelled.rawValue : "Invalid outcome"
        justification.length > 0: "Justification required"
    }
    let market = FlowWager.markets[marketId]!
    let resolver = self.account.address
    assert(resolver == self.adminAddress, message: "Only admin can resolve markets")
    assert(!market.resolved, message: "Market already resolved")
    assert(getCurrentBlock().timestamp >= market.endTime, message: "Market not ended yet")

    // Determine the resolution type
    let resolutionDetails = FlowWager.determineResolution(
        marketId: marketId,
        adminOutcome: outcome,
        adminJustification: justification
    )

    let finalOutcomeRaw = resolutionDetails.outcome
    let finalJustification = resolutionDetails.justification
    let resolutionType = resolutionDetails.resolutionType // "approved", "override", "emergency"

    let marketOutcome = MarketOutcome(rawValue: finalOutcomeRaw)!
    let totalPool = market.totalPool

    var platformFeeAmount: UFix64 = 0.0
    var creatorIncentiveAmount: UFix64 = 0.0

    // Calculate fees based on resolution type
    if resolutionType == "approved" {
        // Evidence was approved, apply 1% platform fee and 2% creator incentive
        platformFeeAmount = totalPool * (self.evidenceResolutionPlatformFeePercentage / 100.0)
        creatorIncentiveAmount = totalPool * (self.evidenceResolutionCreatorIncentivePercentage / 100.0)

        // Transfer creator incentive
        if creatorIncentiveAmount > 0.0 {
            let creatorAcct = getAccount(market.creator)
            if let creatorVault = creatorAcct.capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver).borrow() {
                let payoutVault <- self.flowVault.withdraw(amount: creatorIncentiveAmount) as! @FlowToken.Vault
                creatorVault.deposit(from: <-payoutVault)
                emit CreatorIncentivePaid(marketId: market.id, creator: market.creator, amount: creatorIncentiveAmount)
            } else {
                // Handle case where creator doesn't have a public receiver
                platformFeeAmount = platformFeeAmount + creatorIncentiveAmount
                log("Creator does not have a FlowToken.Receiver capability. Creator incentive added to platform fees.")
            }
        }
    } else {
        // Standard resolution (admin override or emergency), apply standard platform fee
        platformFeeAmount = totalPool * (self.platformFeePercentage / 100.0)
    }

    // Accumulate the platform's share of fees
    self.totalPlatformFees = self.totalPlatformFees + platformFeeAmount

    let resolvedMarket = Market(
        id: market.id,
        title: market.title,
        description: market.description,
        category: market.category,
        optionA: market.optionA,
        optionB: market.optionB,
        creator: market.creator,
        endTime: market.endTime,
        minBet: market.minBet,
        maxBet: market.maxBet,
        status: MarketStatus.Resolved,
        outcome: marketOutcome,
        resolved: true,
        totalOptionAShares: market.totalOptionAShares,
        totalOptionBShares: market.totalOptionBShares,
        totalPool: market.totalPool,
        imageUrl: market.imageUrl
    )

    FlowWager.markets[marketId] = resolvedMarket

    let _ = FlowWager.resolutionEvidence.remove(key: marketId)

    emit MarketResolved(
        marketId: marketId,
        outcome: finalOutcomeRaw,
        resolver: resolver,
        justification: finalJustification
    )
}  
    access(all) fun rejectEvidence(marketId: UInt64, rejectionReason: String) {
        pre {
            !self.paused: "Contract is paused for migration/upgrade"
            self.account.address == self.adminAddress: "Only admin can reject evidence"
            FlowWager.resolutionEvidence.containsKey(marketId): "No evidence to reject for this market"
            rejectionReason.length > 0: "Rejection reason required"
        }
        
        let market = FlowWager.markets[marketId]!
        
        assert(market.status == MarketStatus.PendingResolution, message: "Market is not in PendingResolution status.")

        let _ = FlowWager.resolutionEvidence.remove(key: marketId)
        
        let revertedMarket = Market(
            id: market.id,
            title: market.title,
            description: market.description,
            category: market.category,
            optionA: market.optionA,
            optionB: market.optionB,
            creator: market.creator,
            endTime: market.endTime,
            minBet: market.minBet,
            maxBet: market.maxBet, // This 'maxBet' refers to the field from the existing 'market' struct
            status: MarketStatus.Active,
            outcome: market.outcome,
            resolved: market.resolved,
            totalOptionAShares: market.totalOptionAShares,
            totalOptionBShares: market.totalOptionBShares,
            totalPool: market.totalPool,
            imageUrl: market.imageUrl
        )
        
        FlowWager.markets[marketId] = revertedMarket
        
        emit EvidenceRejected(
            marketId: marketId,
            admin: self.account.address,
            reason: rejectionReason
        )
        emit MarketStatusChanged(marketId: marketId, newStatus: MarketStatus.Active.rawValue)
    }
    
   access(all) fun claimWinnings(
    marketId: UInt64, 
   claimerAddress: Address,
    userPositionsCap: Capability<&FlowWager.UserPositions>,
   ): @FlowToken.Vault {
    pre {
        !self.paused: "Contract is paused for migration/upgrade"
        FlowWager.markets.containsKey(marketId): "Market does not exist"
        FlowWager.registeredUsers.containsKey(claimerAddress): "Claimer must be a registered user."
         userPositionsCap.check(): "Invalid UserPositions capability"
    }
    
    let market = FlowWager.markets[marketId]!
    let claimer = claimerAddress
    
    assert(market.resolved, message: "Market not resolved yet")
    
    let userAcct = getAccount(claimer)
 // Borrow UserPositions using the provided capability
    let userPositionsRef = userPositionsCap.borrow()
        ?? panic("Could not borrow UserPositions from capability")
    
    let position = userPositionsRef.getPosition(marketId: marketId)
        ?? panic("No position found for this market for the current user.")
    
    assert(!position.claimed, message: "Winnings for this market already claimed.")
    
    let payout = self.calculatePayoutForPosition(marketId: marketId, position: position)
    assert(payout > 0.0, message: "No winnings to claim for this market or position.")
    
    userPositionsRef.markClaimed(marketId: marketId)
    
    if let currentStats = FlowWager.userStats[claimer] {
        if payout > position.totalInvested {
            FlowWager.updateUserStatsAfterWin(user: claimer, payout: payout, invested: position.totalInvested)
        } else if payout < position.totalInvested {
            let loss = position.totalInvested - payout
            FlowWager.updateUserStatsAfterLoss(user: claimer, lossAmount: loss)
        } else {
            let updatedStats = UserStats(
                totalMarketsParticipated: currentStats.totalMarketsParticipated,
                totalWinnings: currentStats.totalWinnings,
                totalLosses: currentStats.totalLosses,
                winStreak: 0,
                currentStreak: 0,
                longestWinStreak: currentStats.longestWinStreak,
                roi: currentStats.roi,
                averageBetSize: currentStats.averageBetSize,
                totalStaked: currentStats.totalStaked
            )
            FlowWager.userStats[claimer] = updatedStats
        }
    } else {
         panic("User stats not found for registered user ".concat(claimer.toString()))
    }
    
    let payoutVault <- self.flowVault.withdraw(amount: payout) as! @FlowToken.Vault
    
    emit WinningsClaimed(marketId: marketId, claimer: claimer, amount: payout)
    
    return <-payoutVault
}
    


    // =====================================
    // PATCHED: USER REGISTRATION (NO STORAGE SAVE)
    // =====================================
    access(all) fun createUserAccount(userAddress: Address, username: String, displayName: String) {
        pre {
            !self.paused: "Contract is paused for migration/upgrade"
            username.length > 0 && username.length <= 30: "Username must be 1-30 characters"
            displayName.length > 0 && displayName.length <= 50: "Display name must be 1-50 characters"
        }
        assert(FlowWager.registeredUsers[userAddress] == nil || FlowWager.registeredUsers[userAddress] == false, 
            message: "User with this address is already registered")

        assert(FlowWager.takenUsernames[username] == nil, message: "Username is already taken")
        assert(FlowWager.takenDisplayNames[displayName] == nil, message: "Display name is already taken")

        FlowWager.registeredUsers[userAddress] = true
        FlowWager.takenUsernames[username] = userAddress
        FlowWager.takenDisplayNames[displayName] = userAddress

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
        FlowWager.userStats[userAddress] = userStatsData

        emit UserRegistered(address: userAddress, username: username)
    }


     access(all) fun createMarket(
        title: String,
        description: String,
        category: MarketCategory,
        optionA: String,
        optionB: String,
        endTime: UFix64,
        minBet: UFix64,
        maxBet: UFix64,
        imageUrl: String,
        creationFeeVault: @FlowToken.Vault?,
        address: Address
    ): UInt64 {
        pre {
            !self.paused: "Contract is paused for migration/upgrade"
            UInt64(FlowWager.markets.length) < FlowWager.maxMarkets: "Market cap reached"
            title.length > 0 && title.length <= 100: "Title must be 1-100 characters"
            description.length > 0 && description.length <= 500: "Description must be 1-500 characters"
            optionA.length > 0 && optionA.length <= 50: "Option A must be 1-50 characters"
            optionB.length > 0 && optionB.length <= 50: "Option B must be 1-50 characters"
            endTime > getCurrentBlock().timestamp: "End time must be in the future"
            minBet > 0.0: "Minimum bet must be positive"
            maxBet >= minBet: "Maximum bet must be >= minimum bet"
            imageUrl.length <= 500: "Image URL must be <= 500 characters"
        }
        
        let marketId = FlowWager.nextMarketId
        let creator =  address
        
        let isDeployer = creator == FlowWager.deployerAddress

        if isDeployer {
            if let vault <- creationFeeVault {
                destroy vault // Deployer doesn't pay, so destroy any sent vault
            }
        } else {
            if let vault <- creationFeeVault {
                assert(vault.balance >= FlowWager.marketCreationFee, message: "Insufficient creation fee")
                
                let feeVault <- vault.withdraw(amount: FlowWager.marketCreationFee)
                FlowWager.flowVault.deposit(from: <-feeVault)
                
                if vault.balance > 0.0 {
                    destroy vault 
                } else {
                    destroy vault
                }
                
                emit MarketCreationFeePaid(creator: creator, amount: FlowWager.marketCreationFee)
            } else {
                panic("Creation fee required for non-deployers")
            }
        }
        
        let market = Market(
            id: marketId,
            title: title,
            description: description,
            category: category,
            optionA: optionA,
            optionB: optionB,
            creator: creator,
            endTime: endTime,
            minBet: minBet,
            maxBet: maxBet, // This 'maxBet' refers to the parameter passed to the function
            status: MarketStatus.Active,
            outcome: nil,
            resolved: false,
            totalOptionAShares: 0.0,
            totalOptionBShares: 0.0,
            totalPool: 0.0,
            imageUrl: imageUrl,
        )
        
        FlowWager.markets[marketId] = market
        FlowWager.nextMarketId = FlowWager.nextMarketId + 1
        
        if FlowWager.marketsByCreator[creator] == nil {
            FlowWager.marketsByCreator[creator] = []
        }
        FlowWager.marketsByCreator[creator]!.append(marketId)
        
        emit MarketCreated(marketId: marketId, title: title, creator: creator, imageUrl: imageUrl)
        return marketId
    }



    // HELPER FUNCTIONS
   access(all) fun getPlatformFeesAvailable(): UFix64 {
    var totalObligations: UFix64 = 0.0
    
    for marketId in FlowWager.markets.keys {
        let market = FlowWager.markets[marketId]!
        
        if !market.resolved {
            totalObligations = totalObligations + market.totalPool
        }
    }
    
    let contractBalance = FlowWager.flowVault.balance
    
    if totalObligations > contractBalance {
        return 0.0 // Avoid underflow by returning 0 if obligations exceed balance
    }
    
    let liquidBalance = contractBalance - totalObligations
    
    return liquidBalance > FlowWager.totalPlatformFees ? FlowWager.totalPlatformFees : liquidBalance
}

    access(all) fun updateUserStatsAfterWin(user: Address, payout: UFix64, invested: UFix64) {}

    access(all) fun updateUserStatsAfterLoss(user: Address, lossAmount: UFix64) {}

    // access(all) fun determineResolution(marketId: UInt64, adminOutcome: UInt8, adminJustification: String) {}

    access(all) fun getPlatformStats(): PlatformStats {
        var activeMarketsCount: UInt64 = 0
        var pendingResolutionMarketsCount: UInt64 = 0
        for market in FlowWager.markets.values {
            if market.status == MarketStatus.Active {
                activeMarketsCount = activeMarketsCount + 1
            } else if market.status == MarketStatus.PendingResolution {
                pendingResolutionMarketsCount = pendingResolutionMarketsCount + 1
            }
        }
        
        return PlatformStats(
            totalMarkets: UInt64(FlowWager.markets.length),
            activeMarkets: activeMarketsCount,
            pendingResolutionMarkets: pendingResolutionMarketsCount,
            totalUsers: UInt64(FlowWager.registeredUsers.length),
            totalVolume: FlowWager.totalVolumeTraded,
            totalFees: FlowWager.totalPlatformFees,
            availableFeesForWithdrawal: FlowWager.getPlatformFeesAvailable()
        )
    }

     access(all) fun getMarketById(marketId: UInt64): Market? {
        return FlowWager.markets[marketId]
    }
    
    access(all) fun getAllMarkets(): [Market] {
        return FlowWager.markets.values
    }
    
    access(all) fun getActiveMarkets(): [Market] {
        let activeMarkets: [Market] = []
        for market in FlowWager.markets.values {
            if market.status == MarketStatus.Active {
                activeMarkets.append(market)
            }
        }
        return activeMarkets
    }
    
    access(all) fun getPendingResolutionMarkets(): [Market] {
        let pendingMarkets: [Market] = []
        for market in FlowWager.markets.values {
            if market.status == MarketStatus.PendingResolution {
                pendingMarkets.append(market)
            }
        }
        return pendingMarkets
    }
    
    // Fixed: Typo in argument name
    access(all) fun getResolutionEvidence(marketId: UInt64): ResolutionEvidence? {
        return FlowWager.resolutionEvidence[marketId]
    }
    
    access(all) fun getAllPendingEvidence(): {UInt64: ResolutionEvidence} {
        return FlowWager.resolutionEvidence
    }
    
    access(all) fun getMarketsByCreator(creator: Address): [Market] {
        let creatorMarketIds = FlowWager.marketsByCreator[creator] ?? []
        let creatorMarkets: [Market] = []
        for marketId in creatorMarketIds {
            if let market = FlowWager.markets[marketId] {
                creatorMarkets.append(market)
            }
        }
        return creatorMarkets
    }
    
    access(all) fun getUserProfile(address: Address): &{UserProfilePublic}? {
        let acct = getAccount(address)
        return acct.capabilities.get<&{FlowWager.UserProfilePublic}>(FlowWager.UserProfilePublicPath)
            .borrow()
    }
    
    access(all) fun getUserStats(address: Address): UserStats? {
        return FlowWager.userStats[address]
    }


    access(all) fun getMarketParticipantCount(marketId: UInt64): UInt64 {
    if let participants = FlowWager.marketParticipants[marketId] {
        return UInt64(participants.length)
    }
    return 0
    }

    

    access(all) fun getUserPositions(address: Address): {UInt64: UserPosition} {
        let acct = getAccount(address)
        let ref = acct.capabilities.get<&{FlowWager.UserPositionsPublic}>(FlowWager.UserPositionsPublicPath)
            .borrow()
            ?? panic("UserPositions resource public capability not found for this account. User may not be registered or initialized.")
        return ref.getAllPositions()
    }
    
    access(all) fun getClaimableWinnings(address: Address): [ClaimableWinnings] {
        if !FlowWager.registeredUsers.containsKey(address) {
            return []
        }

        let acct = getAccount(address)
        let positionsRef = acct.capabilities.get<&{FlowWager.UserPositionsPublic}>(FlowWager.UserPositionsPublicPath).borrow()
        
        if positionsRef == nil {
            return []
        }

        let positions = positionsRef!.getAllPositions()
        let claimable: [ClaimableWinnings] = []
        for marketId in positions.keys {
            let pos = positions[marketId]!
            if let market = FlowWager.markets[marketId] {
                if market.resolved && !pos.claimed {
                    let payout = FlowWager.calculatePayoutForPosition(marketId: marketId, position: pos)
                    if payout > 0.0 {
                        claimable.append(ClaimableWinnings(marketId: marketId, amount: payout))
                    }
                }
            }
        }
        return claimable
    }

        access(all) fun createUserPositions(): @UserPositions {
            return <- create UserPositions()
        }

    access(all) fun createUserStatsResource(): @UserStatsResource {
         return <- create UserStatsResource()
    }

    access(all) fun transitionEndedMarketToPendingResolution(marketId: UInt64) {
    pre {
        !self.paused: "Contract is paused for migration/upgrade"
        FlowWager.markets.containsKey(marketId): "Market does not exist"
    }
    
    let market = FlowWager.markets[marketId]!
    
    assert(market.status == MarketStatus.Active, message: "Market is not in Active status")
    assert(getCurrentBlock().timestamp >= market.endTime, message: "Market hasn't ended yet")
    assert(!market.resolved, message: "Market already resolved")
    
    let updatedMarket = Market(
        id: market.id,
        title: market.title,
        description: market.description,
        category: market.category,
        optionA: market.optionA,
        optionB: market.optionB,
        creator: market.creator,
        endTime: market.endTime,
        minBet: market.minBet,
        maxBet: market.maxBet,
        status: MarketStatus.PendingResolution,
        outcome: market.outcome,
        resolved: market.resolved,
        totalOptionAShares: market.totalOptionAShares,
        totalOptionBShares: market.totalOptionBShares,
        totalPool: market.totalPool,
        imageUrl: market.imageUrl
    )
    
    FlowWager.markets[marketId] = updatedMarket
    
    emit MarketStatusChanged(marketId: marketId, newStatus: MarketStatus.PendingResolution.rawValue)
}

    // ... [everything else stays the same, including all contract logic, helpers, and the initializer below] ...

    // =====================================
    // CONTRACT INITIALIZATION
    // =====================================
    init() {
        self.nextMarketId = 1
        self.platformFeePercentage = 3.0 // 3% fee
        self.totalPlatformFees = 0.0
        self.totalVolumeTraded = 0.0
        self.markets = {}
        self.registeredUsers = {}
        self.userStats = {} 
        self.marketsByCreator = {}
        self.marketParticipants = {}
        self.userMarketParticipation = {}
        self.referralCodes = {}
        self.wagerPoints = {}
        self.referralCodeCounter = 0
        
        self.resolutionEvidence = {}
        
        self.takenUsernames = {}
        self.takenDisplayNames = {}

        self.deployerAddress = self.account.address
        self.adminAddress = self.account.address
        self.pendingAdmin = nil
        self.marketCreationFee = 10.0 // Example fee
        self.paused = false
        self.evidenceResolutionPlatformFeePercentage = 1.0 // 1% for platform when evidence is approved
        self.evidenceResolutionCreatorIncentivePercentage = 2.0 // 2% for creator when evidence is approved
        self.maxMarkets = 10000
        self.maxPositionsPerUser = 100
        
        self.UserPositionsStoragePath = /storage/FlowWagerUserPositions
        self.UserPositionsPublicPath = /public/FlowWagerUserPositions
        self.UserStatsStoragePath = /storage/FlowWagerUserStats
        self.UserStatsPublicPath = /public/FlowWagerUserStats
        self.UserProfileStoragePath = /storage/FlowWagerUserProfile
        self.UserProfilePublicPath = /public/FlowWagerUserProfile
        self.AdminStoragePath = /storage/FlowWagerAdmin
        
        self.flowVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
        
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
        
        emit ContractInitialized()
    }
}