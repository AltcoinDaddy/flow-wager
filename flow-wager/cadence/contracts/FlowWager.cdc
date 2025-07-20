import "FungibleToken"
import "FlowToken"

access(all) contract FlowWager {
    
    // =====================================
    // EVENTS
    // =====================================
    
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
    
    // NEW EVENTS for evidence submission
    access(all) event EvidenceSubmitted(marketId: UInt64, creator: Address, evidence: String, requestedOutcome: UInt8)
    access(all) event MarketStatusChanged(marketId: UInt64, newStatus: UInt8)
    access(all) event EvidenceRejected(marketId: UInt64, admin: Address, reason: String)
    
    // Add these new events after the existing events:
    access(all) event ContractUpgraded(oldVersion: String, newVersion: String, upgrader: Address)
    access(all) event UpgradePrepared(newVersion: String, upgradeTime: UFix64)
    access(all) event UpgradeExecuted(version: String, timestamp: UFix64)
    access(all) event AdminTransferProposed(currentAdmin: Address, proposedAdmin: Address)
    access(all) event AdminTransferred(oldAdmin: Address, newAdmin: Address)
    access(all) event AdminTransferCancelled(admin: Address)
    access(all) event MarketCreationFeeUpdated(oldFee: UFix64, newFee: UFix64)
    
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
    
    // UPDATED: Added PendingResolution status
    access(all) enum MarketStatus: UInt8 {
        access(all) case Active           // 0 - Market is open for betting
        access(all) case PendingResolution // 1 - Creator submitted evidence, waiting for admin
        access(all) case Resolved         // 2 - Market has been resolved
        access(all) case Cancelled        // 3 - Market was cancelled
    }
    
    access(all) enum MarketOutcome: UInt8 {
        access(all) case OptionA
        access(all) case OptionB
        access(all) case Draw
        access(all) case Cancelled
    }
    
    // =====================================
    // STRUCTS
    // =====================================
    
    // NEW: Evidence submission struct
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
            imageUrl: String
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
    
    access(all) struct UserProfile {
        access(all) let address: Address
        access(all) let username: String
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
    
    // UPDATED: Added pendingResolutionMarkets field
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
    
    // =====================================
    // CONTRACT STATE
    // =====================================
    
    access(all) var nextMarketId: UInt64
    access(all) var platformFeePercentage: UFix64
    access(all) var totalPlatformFees: UFix64
    access(all) var totalVolumeTraded: UFix64
    access(self) var flowVault: @FlowToken.Vault
    
    // FIXED: Separate deployer and admin roles
    access(all) let deployerAddress: Address
    access(all) var adminAddress: Address  // Changed to var so it can be transferred
    access(all) var paused: Bool
    
    // Add admin transfer functionality
    access(all) var pendingAdmin: Address?  // For safe admin transfer

    // ADD THIS LINE - Market creation fee
    access(all) var marketCreationFee: UFix64

    // Storage paths
    access(all) let UserPositionsStoragePath: StoragePath
    access(all) let UserPositionsPublicPath: PublicPath
    access(all) let UserStatsStoragePath: StoragePath
    access(all) let UserStatsPublicPath: PublicPath
    access(all) let AdminStoragePath: StoragePath
    
    // Markets storage
    access(contract) let markets: {UInt64: Market}
    access(contract) let userProfiles: {Address: UserProfile}
    access(contract) let userStats: {Address: UserStats}
    access(contract) let marketsByCreator: {Address: [UInt64]}
    access(contract) let marketParticipants: {UInt64: {Address: Bool}}
    access(contract) let userMarketParticipation: {Address: {UInt64: Bool}}
    
    // NEW: Evidence submission storage
    access(contract) let resolutionEvidence: {UInt64: ResolutionEvidence}
    
    // Referral system
    access(contract) var referralCodes: {String: Address}
    access(contract) var wagerPoints: {Address: UInt64}
    access(contract) var referralCodeCounter: UInt64
    
    // Market caps
    access(all) var maxMarkets: UInt64
    access(all) var maxPositionsPerUser: UInt64
    
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
            
            let availableFees = FlowWager.getPlatformFeesAvailable()
            assert(amount <= availableFees, message: "Insufficient platform fees available for withdrawal")
            
            let feeVault <- FlowWager.flowVault.withdraw(amount: amount) as! @FlowToken.Vault
            FlowWager.totalPlatformFees = FlowWager.totalPlatformFees - amount
            
            emit PlatformFeesWithdrawn(admin: self.owner!.address, amount: amount)
            return <-feeVault
        }
        
        access(all) fun withdrawAllPlatformFees(): @FlowToken.Vault {
            let availableFees = FlowWager.getPlatformFeesAvailable()
            return <-self.withdrawPlatformFees(amount: availableFees)
        }
    }
    
    // =====================================
    // HELPER FUNCTIONS  
    // =====================================
    
    access(contract) fun calculatePayoutForPosition(marketId: UInt64, position: UserPosition): UFix64 {
        let market = FlowWager.markets[marketId] ?? panic("Market does not exist")
        
        if position.claimed {
            return 0.0
        }
        
        if market.outcome == MarketOutcome.Draw || market.outcome == MarketOutcome.Cancelled {
            let platformFee = position.totalInvested * (FlowWager.platformFeePercentage / 100.0)
            return position.totalInvested - platformFee
        }
        
        let winningShares: UFix64 =
            (market.outcome == MarketOutcome.OptionA && position.optionAShares > 0.0) ? position.optionAShares :
            (market.outcome == MarketOutcome.OptionB && position.optionBShares > 0.0) ? position.optionBShares : 0.0
        
        let totalWinningShares: UFix64 =
            market.outcome == MarketOutcome.OptionA ? market.totalOptionAShares :
            market.outcome == MarketOutcome.OptionB ? market.totalOptionBShares : 0.0
        
        if totalWinningShares == 0.0 || winningShares == 0.0 {
            return 0.0
        }
        
        return market.totalPool * (winningShares / totalWinningShares)
    }
    
    access(all) fun getPlatformFeesAvailable(): UFix64 {
        var totalObligations: UFix64 = 0.0
        
        // Only count obligations for UNRESOLVED markets
        for marketId in FlowWager.markets.keys {
            let market = FlowWager.markets[marketId]!
            
            // Only unresolved markets have outstanding obligations
            if !market.resolved {
                // For active/pending markets, the obligation is the total pool
                // (money that needs to be available for payouts when resolved)
                totalObligations = totalObligations + market.totalPool
            }
            // Resolved markets have no obligations - winnings already distributed
        }
        
        let contractBalance = FlowWager.flowVault.balance
        
        // Available for withdrawal = contract balance - outstanding obligations - unclaimed winnings
        let availableBalance = contractBalance > totalObligations ? contractBalance - totalObligations : 0.0
        
        // Can only withdraw up to the amount of fees actually collected
        return availableBalance > FlowWager.totalPlatformFees ? FlowWager.totalPlatformFees : availableBalance
    }
    
    access(contract) fun updateUserStatsAfterBet(user: Address, betAmount: UFix64, marketId: UInt64) {
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
        
        if let currentStats = FlowWager.userStats[user] {
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
    
    access(contract) fun updateUserStatsAfterWin(user: Address, payout: UFix64, invested: UFix64) {
        if let currentStats = FlowWager.userStats[user] {
            // Only call this function for actual wins (payout > invested)
            assert(payout > invested, message: "This function should only be called for wins")
            
            let profit = payout - invested  // Now guaranteed to be positive
            let newTotalWinnings = currentStats.totalWinnings + profit
            let newWinStreak = currentStats.winStreak + 1
            let newCurrentStreak = currentStats.currentStreak + 1
            let newLongestWinStreak = newWinStreak > currentStats.longestWinStreak ? newWinStreak : currentStats.longestWinStreak
            let netProfit = newTotalWinnings - currentStats.totalLosses
            let newRoi = currentStats.totalStaked > 0.0 ? (netProfit / currentStats.totalStaked) * 100.0 : 0.0
            
            let updatedStats = UserStats(
                totalMarketsParticipated: currentStats.totalMarketsParticipated,
                totalWinnings: newTotalWinnings,
                totalLosses: currentStats.totalLosses,
                winStreak: newWinStreak,
                currentStreak: newCurrentStreak,
                longestWinStreak: newLongestWinStreak,
                roi: newRoi,
                averageBetSize: currentStats.averageBetSize,
                totalStaked: currentStats.totalStaked
            )
            FlowWager.userStats[user] = updatedStats
        }
    }
    
    access(contract) fun updateUserStatsAfterLoss(user: Address, lossAmount: UFix64) {
        if let currentStats = FlowWager.userStats[user] {
            let newTotalLosses = currentStats.totalLosses + lossAmount
            let newCurrentStreak: UInt64 = 0
            let netProfit = currentStats.totalWinnings - newTotalLosses
            let newRoi = currentStats.totalStaked > 0.0 ? (netProfit / currentStats.totalStaked) * 100.0 : 0.0
            
            let updatedStats = UserStats(
                totalMarketsParticipated: currentStats.totalMarketsParticipated,
                totalWinnings: currentStats.totalWinnings,
                totalLosses: newTotalLosses,
                winStreak: currentStats.winStreak,
                currentStreak: newCurrentStreak,
                longestWinStreak: currentStats.longestWinStreak,
                roi: newRoi,
                averageBetSize: currentStats.averageBetSize,
                totalStaked: currentStats.totalStaked
            )
            FlowWager.userStats[user] = updatedStats
        }
    }
    
    access(contract) fun determineResolution(
        marketId: UInt64,
        adminOutcome: UInt8,
        adminJustification: String
    ): ResolutionDetails {
        if let evidence = FlowWager.resolutionEvidence[marketId] {
            if adminOutcome == evidence.requestedOutcome {
                // Admin agrees with creator's evidence
                return ResolutionDetails(
                    outcome: evidence.requestedOutcome,
                    justification: "Evidence-based:".concat(evidence.evidence),
                    resolutionType: "approved"
                )
            } else {
                // Admin overrides creator's request
                return ResolutionDetails(
                    outcome: adminOutcome,
                    justification: "Admin override: ".concat(adminJustification)
                        .concat(" | Creator evidence: ").concat(evidence.evidence),
                    resolutionType: "override"
                )
            }
        } else {
            // No evidence submitted - emergency admin resolution
            return ResolutionDetails(
                outcome: adminOutcome,
                justification: "Emergency resolution: ".concat(adminJustification),
                resolutionType: "emergency"
            )
        }
    }
    
    // =====================================
    // PUBLIC FUNCTIONS
    // =====================================
    
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
        creationFeeVault: @FlowToken.Vault?
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
        let creator = self.account.address
        
        // FIXED: Handle creation fee properly
        let isDeployer = creator == FlowWager.deployerAddress

        if isDeployer {
            // Deployer doesn't need to pay fee
            if let vault <- creationFeeVault {
                // If deployer accidentally sent a vault, destroy it
                destroy vault
            }
        } else {
            // Non-deployer must pay fee
            if let vault <- creationFeeVault {
                assert(vault.balance >= FlowWager.marketCreationFee, message: "Insufficient creation fee")
                
                // Take exact fee amount
                let feeVault <- vault.withdraw(amount: FlowWager.marketCreationFee)
                FlowWager.flowVault.deposit(from: <-feeVault)
                log("Platform vault balance after deposit: ".concat(FlowWager.flowVault.balance.toString()))
                
                // Handle any excess (should not happen, but safety check)
                if vault.balance > 0.0 {
                    FlowWager.flowVault.deposit(from: <-vault)
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
            maxBet: maxBet,
            status: MarketStatus.Active,
            outcome: nil,
            resolved: false,
            totalOptionAShares: 0.0,
            totalOptionBShares: 0.0,
            totalPool: 0.0,
            imageUrl: imageUrl
        )
        
        FlowWager.markets[marketId] = market
        FlowWager.nextMarketId = FlowWager.nextMarketId + 1
        
        // Update marketsByCreator for O(1) lookup
        if FlowWager.marketsByCreator[creator] == nil {
            FlowWager.marketsByCreator[creator] = []
        }
        FlowWager.marketsByCreator[creator]!.append(marketId)
        
        emit MarketCreated(marketId: marketId, title: title, creator: creator, imageUrl: imageUrl)
        return marketId
    }
    
    access(all)  fun createUserAccount(username: String, displayName: String) {
        pre {
            !self.paused: "Contract is paused for migration/upgrade"
            username.length > 0: "Username cannot be empty"
            displayName.length > 0: "Display name cannot be empty"
        }
        
        // Check if user is already registered
        assert(FlowWager.getUserProfile(address: self.account.address) != nil, message: "User already registered")
        
        let userProfile = UserProfile(
            address: self.account.address,
            username: username,
            displayName: displayName,
            bio: "",
            profileImageUrl: ""
        )
        
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
        
        FlowWager.userProfiles[self.account.address] = userProfile
        FlowWager.userStats[self.account.address] = userStatsData
        
        // SAFE resource initialization - no race condition
        self.initializeUserResources()
        
        emit UserRegistered(address: self.account.address, username: username)
    }
    
    // Add this helper function to handle safe resource initialization
    access(contract) fun initializeUserResources() {
        // Initialize UserPositions safely
        if self.account.storage.borrow<&FlowWager.UserPositions>(from: FlowWager.UserPositionsStoragePath) == nil {
            let userPositions <- create UserPositions()
            self.account.storage.save(<-userPositions, to: FlowWager.UserPositionsStoragePath)
            
            // Only publish capability if we don't already have one
            if !self.account.capabilities.get<&{FlowWager.UserPositionsPublic}>(FlowWager.UserPositionsPublicPath).check() {
                let userPositionsCap = self.account.capabilities.storage.issue<&{FlowWager.UserPositionsPublic}>(
                    FlowWager.UserPositionsStoragePath
                )
                self.account.capabilities.publish(userPositionsCap, at: FlowWager.UserPositionsPublicPath)
            }
        }
        
        // Initialize UserStats safely
        if self.account.storage.borrow<&FlowWager.UserStatsResource>(from: FlowWager.UserStatsStoragePath) == nil {
            let userStats <- create UserStatsResource()
            self.account.storage.save(<-userStats, to: FlowWager.UserStatsStoragePath)
            
            if !self.account.capabilities.get<&{FlowWager.UserStatsPublic}>(FlowWager.UserStatsPublicPath).check() {
                let userStatsCap = self.account.capabilities.storage.issue<&{FlowWager.UserStatsPublic}>(
                    FlowWager.UserStatsStoragePath
                )
                self.account.capabilities.publish(userStatsCap, at: FlowWager.UserStatsPublicPath)
            }
        }
    }
    
    access(all) fun generateReferralCode(): String {
        pre {
            !self.paused: "Contract is paused for migration/upgrade"
        }
        let user = self.account.address
        let globalCounter = FlowWager.referralCodeCounter + 1
        FlowWager.referralCodeCounter = globalCounter
        
        let addressString = user.toString()
        let addressLen = addressString.length
        let addressSuffix = addressString.slice(from: addressLen-8, upTo: addressLen)
        let code = "WAGER-".concat(addressSuffix).concat("-").concat(globalCounter.toString())
        
        FlowWager.referralCodes[code] = user
        emit ReferralCodeGenerated(user: user, code: code)
        return code
    }
    
    // NEW: Creator submits evidence for market resolution
    access(all) fun submitResolutionEvidence(
        marketId: UInt64,
        evidence: String,
        requestedOutcome: UInt8
    ) {
        pre {
            !self.paused: "Contract is paused for migration/upgrade"
            FlowWager.markets[marketId] != nil: "Market does not exist"
            evidence.length >= 50: "Evidence must be at least 50 characters"
            evidence.length <= 1000: "Evidence too long (max 1000 characters)"
            requestedOutcome <= 3: "Invalid outcome (0=A, 1=B, 2=Draw, 3=Cancelled)"
        }
        
        let market = FlowWager.markets[marketId]!
        let submitter = self.account.address
        
        // Validate submission
        assert(submitter == market.creator, message: "Only market creator can submit evidence")
        assert(market.status == MarketStatus.Active, message: "Market not active")
        assert(getCurrentBlock().timestamp >= market.endTime, message: "Market hasn't ended yet")
        assert(!market.resolved, message: "Market already resolved")
        assert(FlowWager.resolutionEvidence[marketId] == nil, message: "Evidence already submitted")
        
        // Store evidence
        let evidenceStruct = ResolutionEvidence(
            marketId: marketId,
            creator: submitter,
            evidence: evidence,
            requestedOutcome: requestedOutcome
        )
        
        FlowWager.resolutionEvidence[marketId] = evidenceStruct
        
        // Change market status to PendingResolution
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
            status: MarketStatus.PendingResolution,  // Changed status
            outcome: market.outcome,
            resolved: market.resolved,
            totalOptionAShares: market.totalOptionAShares,
            totalOptionBShares: market.totalOptionBShares,
            totalPool: market.totalPool,
            imageUrl: market.imageUrl
        )
        
        FlowWager.markets[marketId] = updatedMarket
        
        emit EvidenceSubmitted(
            marketId: marketId,
            creator: submitter,
            evidence: evidence,
            requestedOutcome: requestedOutcome
        )
        emit MarketStatusChanged(marketId: marketId, newStatus: MarketStatus.PendingResolution.rawValue)
    }
    
    access(all) fun placeBet(
        marketId: UInt64,
        option: UInt8,
        betVault: @FlowToken.Vault
    ) {
        pre {
            !self.paused: "Contract is paused for migration/upgrade"
            FlowWager.markets[marketId] != nil: "Market does not exist"
            option == 0 || option == 1: "Option must be 0 (A) or 1 (B)"
            betVault.balance > 0.0: "Bet amount must be positive"
        }
        
        let market = FlowWager.markets[marketId]!
        let betAmount = betVault.balance
        let bettor = self.account.address
        
        // Only allow betting on Active markets
        assert(market.status == MarketStatus.Active, message: "Market is not active for betting")
        assert(getCurrentBlock().timestamp < market.endTime, message: "Market has ended")
        assert(betAmount >= market.minBet, message: "Bet below minimum")
        assert(betAmount <= market.maxBet, message: "Bet exceeds maximum")
        
        let userPositions = self.getUserPositions(address: bettor)
        assert(UInt64(userPositions.length) < self.maxPositionsPerUser, message: "User has too many positions")
        
        self.flowVault.deposit(from: <-betVault)

        self.totalVolumeTraded = self.totalVolumeTraded + betAmount

        let shares = betAmount
        
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
            totalOptionAShares: option == 0 ? market.totalOptionAShares + shares : market.totalOptionAShares,
            totalOptionBShares: option == 1 ? market.totalOptionBShares + shares : market.totalOptionBShares,
            totalPool: market.totalPool + betAmount,
            imageUrl: market.imageUrl
        )
        
        FlowWager.markets[marketId] = updatedMarket
        
        let userPositionsRef = self.account.storage.borrow<&FlowWager.UserPositions>(
            from: FlowWager.UserPositionsStoragePath
        ) ?? panic("User positions not found")
        
        let newPosition = UserPosition(
            marketId: marketId,
            optionAShares: option == 0 ? shares : 0.0,
            optionBShares: option == 1 ? shares : 0.0,
            totalInvested: betAmount,
            claimed: false
        )
        
        userPositionsRef.addPosition(newPosition)
        
        if FlowWager.marketParticipants[marketId] == nil {
            FlowWager.marketParticipants[marketId] = {}
        }
        var participants = FlowWager.marketParticipants[marketId]!
        participants[bettor] = true
        FlowWager.marketParticipants[marketId] = participants
        
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
    
    // UPDATED: Admin-only resolution with evidence check
    access(all) fun resolveMarket(
        marketId: UInt64,
        outcome: UInt8,
        justification: String
    ) {
        pre {
            !self.paused: "Contract is paused for migration/upgrade"
            FlowWager.markets[marketId] != nil: "Market does not exist"
            outcome <= 3: "Invalid outcome (0=A, 1=B, 2=Draw, 3=Cancelled)"
            justification.length > 0: "Justification required"
        }
        
        let market = FlowWager.markets[marketId]!
        let resolver = self.account.address
        
        // Only admin can resolve
        assert(resolver == self.adminAddress, message: "Only admin can resolve markets")
        assert(!market.resolved, message: "Market already resolved")
        assert(getCurrentBlock().timestamp >= market.endTime, message: "Market not ended yet")
        
        // Determine resolution details using helper function
        let resolutionDetails = self.determineResolution(
            marketId: marketId,
            adminOutcome: outcome,
            adminJustification: justification
        )
        
        let finalOutcome = resolutionDetails.outcome
        let finalJustification = resolutionDetails.justification
        
        // Resolve the market
        let marketOutcome = MarketOutcome(rawValue: finalOutcome)!
        let totalPool = market.totalPool
        let platformFee = totalPool * 0.03
        let distributablePool = totalPool - platformFee

        // Add platformFee to contract's fee vault
        self.totalPlatformFees = self.totalPlatformFees + platformFee

        // Use distributablePool for payout calculations
        // (You may need to update payout logic to use distributablePool instead of totalPool)
        let winningShares: UFix64 =
            (marketOutcome == MarketOutcome.OptionA && market.totalOptionAShares > 0.0) ? market.totalOptionAShares :
            (marketOutcome == MarketOutcome.OptionB && market.totalOptionBShares > 0.0) ? market.totalOptionBShares : 0.0
        
        let totalWinningShares: UFix64 =
            marketOutcome == MarketOutcome.OptionA ? market.totalOptionAShares :
            marketOutcome == MarketOutcome.OptionB ? market.totalOptionBShares : 0.0
        
        if totalWinningShares == 0.0 || winningShares == 0.0 {
            return
        }
        
        let payout = distributablePool * (winningShares / totalWinningShares)
        
        // Resolve the market
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
        
        // Clear evidence if it exists
        let _ = FlowWager.resolutionEvidence.remove(key: marketId)
        
        emit MarketResolved(
            marketId: marketId,
            outcome: finalOutcome,
            resolver: resolver,
            justification: finalJustification
        )
    }
    
    // NEW: Admin can reject evidence
    access(all) fun rejectEvidence(marketId: UInt64, rejectionReason: String) {
        pre {
            !self.paused: "Contract is paused for migration/upgrade"
            self.account.address == self.adminAddress: "Only admin can reject evidence"
            FlowWager.resolutionEvidence[marketId] != nil: "No evidence to reject"
            rejectionReason.length > 0: "Rejection reason required"
        }
        
        let market = FlowWager.markets[marketId]!
        
        // Remove evidence and revert market to Active status
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
            maxBet: market.maxBet,
            status: MarketStatus.Active,  // Revert to Active
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
    
    access(all) fun claimWinnings(marketId: UInt64): @FlowToken.Vault {
        pre {
            !self.paused: "Contract is paused for migration/upgrade"
            FlowWager.markets[marketId] != nil: "Market does not exist"
        }
        
        let market = FlowWager.markets[marketId]!
        let claimer = self.account.address
        
        assert(market.resolved, message: "Market not resolved")
        
        let userPositionsRef = self.account.storage.borrow<&FlowWager.UserPositions>(
            from: FlowWager.UserPositionsStoragePath
        ) ?? panic("User positions not found")
        
        let position = userPositionsRef.getPosition(marketId: marketId)
            ?? panic("No position found for this market")
        
        assert(!position.claimed, message: "Winnings already claimed")
        
        // Mark as claimed using the existing markClaimed function
        userPositionsRef.markClaimed(marketId: marketId)
        
        let payout = self.calculatePayoutForPosition(marketId: marketId, position: position)
        assert(payout > 0.0, message: "No winnings to claim")
        
        // Update stats based on win/loss
        if payout > position.totalInvested {
            self.updateUserStatsAfterWin(user: claimer, payout: payout, invested: position.totalInvested)
        } else if payout < position.totalInvested {
            let loss = position.totalInvested - payout
            self.updateUserStatsAfterLoss(user: claimer, lossAmount: loss)
        }
        
        let payoutVault <- self.flowVault.withdraw(amount: payout) as! @FlowToken.Vault
        
        emit WinningsClaimed(marketId: marketId, claimer: claimer, amount: payout)
        
        return <-payoutVault
    }
    
    // =====================================
    // READ FUNCTIONS
    // =====================================
    
    access(all) fun getMarket(marketId: UInt64): Market? {
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
    
    // NEW: Get markets pending resolution
    access(all) fun getPendingResolutionMarkets(): [Market] {
        let pendingMarkets: [Market] = []
        for market in FlowWager.markets.values {
            if market.status == MarketStatus.PendingResolution {
                pendingMarkets.append(market)
            }
        }
        return pendingMarkets
    }
    
    // NEW: Get resolution evidence for a market
    access(all) fun getResolutionEvidence(marketId: UInt64): ResolutionEvidence? {
        return FlowWager.resolutionEvidence[marketId]
    }
    
    // NEW: Get all markets with pending evidence
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
    
    access(all) fun getUserProfile(address: Address): UserProfile? {
        return FlowWager.userProfiles[address]
    }
    
    access(all) fun getUserStats(address: Address): UserStats? {
        return FlowWager.userStats[address]
    }
    
    access(all) fun getUserPositions(address: Address): {UInt64: UserPosition} {
        let acct = getAccount(address)
        let ref = acct.capabilities.get<&{FlowWager.UserPositionsPublic}>(FlowWager.UserPositionsPublicPath)
            .borrow()
            ?? panic("UserPositions not found")
        return ref.getAllPositions()
    }
    
    access(all) fun getClaimableWinnings(address: Address): [ClaimableWinnings] {
        let positions = FlowWager.getUserPositions(address: address)
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
    
    // UPDATED: Include pending resolution markets
    access(all) fun getPlatformStats(): PlatformStats {
        var activeMarkets: UInt64 = 0
        var pendingMarkets: UInt64 = 0
        for market in FlowWager.markets.values {
            if market.status == MarketStatus.Active {
                activeMarkets = activeMarkets + 1
            } else if market.status == MarketStatus.PendingResolution {
                pendingMarkets = pendingMarkets + 1
            }
        }
        
        return PlatformStats(
            totalMarkets: UInt64(FlowWager.markets.length),
            activeMarkets: activeMarkets,
            pendingResolutionMarkets: pendingMarkets,
            totalUsers: UInt64(FlowWager.userProfiles.length),
            totalVolume: FlowWager.totalVolumeTraded,
            totalFees: FlowWager.totalPlatformFees,
            availableFeesForWithdrawal: FlowWager.getPlatformFeesAvailable()
        )
    }
    
    access(all) fun getWagerPoints(address: Address): UInt64 {
        return FlowWager.wagerPoints[address] ?? 0
    }
    
    // =====================================
    // CONTRACT INITIALIZATION
    // =====================================
    
    init() {
        self.nextMarketId = 1
        self.platformFeePercentage = 3.0
        self.totalPlatformFees = 0.0
        self.totalVolumeTraded = 0.0
        self.markets = {}
        self.userProfiles = {}
        self.userStats = {}
        self.marketsByCreator = {}
        self.marketParticipants = {}
        self.userMarketParticipation = {}
        self.referralCodes = {}
        self.wagerPoints = {}
        self.referralCodeCounter = 0
        
        self.resolutionEvidence = {}
        
        // FIXED: Clearly separate roles
        self.deployerAddress = self.account.address  // Contract deployer (immutable)
        self.adminAddress = self.account.address     // Initial admin (can be transferred)
        self.pendingAdmin = nil
        self.marketCreationFee = 10.0
        self.paused = false
        
        self.maxMarkets = 10000
        self.maxPositionsPerUser = 100
        
        self.UserPositionsStoragePath = /storage/FlowWagerUserPositions
        self.UserPositionsPublicPath = /public/FlowWagerUserPositions
        self.UserStatsStoragePath = /storage/FlowWagerUserStats
        self.UserStatsPublicPath = /public/FlowWagerUserStats
        self.AdminStoragePath = /storage/FlowWagerAdmin
        
        self.flowVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
        
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
        
        emit ContractInitialized()
    }
}