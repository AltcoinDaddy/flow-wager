


access(all) contract FlowWager {
    
    // =====================================
    // EVENTS
    // =====================================
    
    access(all) event ContractInitialized()
    access(all) event MarketCreated(marketId: UInt64, title: String, creator: Address)
    access(all) event SharesPurchased(marketId: UInt64, buyer: Address, option: UInt8, shares: UFix64, amount: UFix64)
    access(all) event MarketResolved(marketId: UInt64, outcome: UInt8)
    access(all) event WinningsClaimed(marketId: UInt64, claimer: Address, amount: UFix64)
    access(all) event UserRegistered(address: Address, username: String)
    
    
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
        access(all) case Paused
        access(all) case Resolved
        access(all) case Cancelled
    }
    
    access(all) enum MarketOutcome: UInt8 {
        access(all) case OptionA
        access(all) case OptionB
        access(all) case Draw
        access(all) case Cancelled
    }
    
    // =====================================
    // STRUCTS - All fields immutable
    // =====================================
    
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
            totalPool: UFix64
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
            self.averagePrice = totalInvested / (optionAShares + optionBShares)
            self.claimed = claimed
        }
    }
    
    access(all) struct UserProfile {
        access(all) let address: Address
        access(all) let username: String
        access(all) let joinedAt: UFix64
        access(all) let displayName: String
        access(all) let bio: String
        access(all) let profileImageUrl: String
        
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
        access(all) let totalWinnings: UFix64
        access(all) let totalLosses: UFix64
        access(all) let winStreak: UInt64
        access(all) let currentStreak: UInt64
        access(all) let longestWinStreak: UInt64
        access(all) let roi: UFix64
        access(all) let averageBetSize: UFix64
        
        init(
            totalMarketsParticipated: UInt64,
            totalWinnings: UFix64,
            totalLosses: UFix64,
            winStreak: UInt64,
            currentStreak: UInt64,
            longestWinStreak: UInt64,
            roi: UFix64,
            averageBetSize: UFix64
        ) {
            self.totalMarketsParticipated = totalMarketsParticipated
            self.totalWinnings = totalWinnings
            self.totalLosses = totalLosses
            self.winStreak = winStreak
            self.currentStreak = currentStreak
            self.longestWinStreak = longestWinStreak
            self.roi = roi
            self.averageBetSize = averageBetSize
        }
    }
    
    access(all) struct PlatformStats {
        access(all) let totalMarkets: UInt64
        access(all) let activeMarkets: UInt64
        access(all) let totalUsers: UInt64
        access(all) let totalVolume: UFix64
        access(all) let totalFees: UFix64
        
        init(
            totalMarkets: UInt64,
            activeMarkets: UInt64,
            totalUsers: UInt64,
            totalVolume: UFix64,
            totalFees: UFix64
        ) {
            self.totalMarkets = totalMarkets
            self.activeMarkets = activeMarkets
            self.totalUsers = totalUsers
            self.totalVolume = totalVolume
            self.totalFees = totalFees
        }
    }
    
    // =====================================
    // CONTRACT STATE
    // =====================================
    
    access(all) var nextMarketId: UInt64
    access(all) var platformFeePercentage: UFix64
    access(all) var totalPlatformFees: UFix64
    access(all) var totalVolumeTraded: UFix64
    
    // Storage paths
    access(all) let UserPositionsStoragePath: StoragePath
    access(all) let UserPositionsPublicPath: PublicPath
    access(all) let UserStatsStoragePath: StoragePath
    access(all) let UserStatsPublicPath: PublicPath
    
    // Markets storage
    access(contract) let markets: {UInt64: Market}
    access(contract) let userProfiles: {Address: UserProfile}
    access(contract) let userStats: {Address: UserStats}
    
    // =====================================
    // RESOURCES
    // =====================================
    
    access(all) resource UserPositions {
        access(all) var positions: {UInt64: UserPosition}
        
        init() {
            self.positions = {}
        }
        
        access(all) fun addPosition(_ position: UserPosition) {
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
        
        access(all) fun getPosition(marketId: UInt64): UserPosition? {
            return self.positions[marketId]
        }
        
        access(all) fun getPositions(): {UInt64: UserPosition} {
            return self.positions
        }
    }
    
    access(all) resource interface UserPositionsPublic {
        access(all) fun getPosition(marketId: UInt64): UserPosition?
        access(all) fun getPositions(): {UInt64: UserPosition}
    }
    
    access(all) resource UserStatsResource {
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
                averageBetSize: 0.0
            )
        }
        
        access(all) fun getStats(): UserStats {
            return self.stats
        }
    }
    
    access(all) resource interface UserStatsPublic {
        access(all) fun getStats(): UserStats
    }
    
    access(all) resource Admin {
        access(all) fun createMarket(
            title: String,
            description: String,
            category: MarketCategory,
            optionA: String,
            optionB: String,
            endTime: UFix64,
            minBet: UFix64,
            maxBet: UFix64
        ): UInt64 {
            let marketId = FlowWager.nextMarketId
            let market = Market(
                id: marketId,
                title: title,
                description: description,
                category: category,
                optionA: optionA,
                optionB: optionB,
                creator: self.owner!.address,
                endTime: endTime,
                minBet: minBet,
                maxBet: maxBet,
                status: MarketStatus.Active,
                outcome: nil,
                resolved: false,
                totalOptionAShares: 0.0,
                totalOptionBShares: 0.0,
                totalPool: 0.0
            )
            
            FlowWager.markets[marketId] = market
            FlowWager.nextMarketId = FlowWager.nextMarketId + 1
            
            emit MarketCreated(marketId: marketId, title: title, creator: self.owner!.address)
            return marketId
        }
        
        access(all) fun resolveMarket(marketId: UInt64, outcome: MarketOutcome) {
            pre {
                FlowWager.markets[marketId] != nil: "Market does not exist"
                FlowWager.markets[marketId]!.resolved == false: "Market already resolved"
            }
            
            if let currentMarket = FlowWager.markets[marketId] {
                // Create new market instance with updated values
                let resolvedMarket = Market(
                    id: currentMarket.id,
                    title: currentMarket.title,
                    description: currentMarket.description,
                    category: currentMarket.category,
                    optionA: currentMarket.optionA,
                    optionB: currentMarket.optionB,
                    creator: currentMarket.creator,
                    endTime: currentMarket.endTime,
                    minBet: currentMarket.minBet,
                    maxBet: currentMarket.maxBet,
                    status: MarketStatus.Resolved,
                    outcome: outcome,
                    resolved: true,
                    totalOptionAShares: currentMarket.totalOptionAShares,
                    totalOptionBShares: currentMarket.totalOptionBShares,
                    totalPool: currentMarket.totalPool
                )
                
                FlowWager.markets[marketId] = resolvedMarket
                emit MarketResolved(marketId: marketId, outcome: outcome.rawValue)
            }
        }
        
        access(all) fun updatePlatformFee(newFeePercentage: UFix64) {
            pre {
                newFeePercentage >= 0.0 && newFeePercentage <= 10.0: "Fee must be between 0% and 10%"
            }
            FlowWager.platformFeePercentage = newFeePercentage
        }
    }
    
    // =====================================
    // PUBLIC FUNCTIONS
    // =====================================
    
    access(all) fun createUserAccount(username: String, displayName: String) {
        pre {
            username.length > 0: "Username cannot be empty"
            displayName.length > 0: "Display name cannot be empty"
        }
        
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
            averageBetSize: 0.0
        )
        
        FlowWager.userProfiles[self.account.address] = userProfile
        FlowWager.userStats[self.account.address] = userStatsData
        
        emit UserRegistered(address: self.account.address, username: username)
    }
    
    access(all) fun buyShares(
        marketId: UInt64,
        option: UInt8,
        amount: UFix64
    ) {
        pre {
            option == 0 || option == 1: "Option must be 0 (Option A) or 1 (Option B)"
            FlowWager.markets[marketId] != nil: "Market does not exist"
            FlowWager.markets[marketId]!.status == MarketStatus.Active: "Market is not active"
            FlowWager.markets[marketId]!.endTime > getCurrentBlock().timestamp: "Market has ended"
            amount >= FlowWager.markets[marketId]!.minBet: "Amount below minimum bet"
            amount <= FlowWager.markets[marketId]!.maxBet: "Amount above maximum bet"
        }
        
        let betAmount = amount
        let platformFee = betAmount * FlowWager.platformFeePercentage / 100.0
        let netAmount = betAmount - platformFee
        let shares = netAmount
        
        // Update platform totals
        FlowWager.totalPlatformFees = FlowWager.totalPlatformFees + platformFee
        FlowWager.totalVolumeTraded = FlowWager.totalVolumeTraded + betAmount
        
        // Update market by creating new instance
        if let currentMarket = FlowWager.markets[marketId] {
            let updatedMarket = Market(
                id: currentMarket.id,
                title: currentMarket.title,
                description: currentMarket.description,
                category: currentMarket.category,
                optionA: currentMarket.optionA,
                optionB: currentMarket.optionB,
                creator: currentMarket.creator,
                endTime: currentMarket.endTime,
                minBet: currentMarket.minBet,
                maxBet: currentMarket.maxBet,
                status: currentMarket.status,
                outcome: currentMarket.outcome,
                resolved: currentMarket.resolved,
                totalOptionAShares: option == 0 ? currentMarket.totalOptionAShares + shares : currentMarket.totalOptionAShares,
                totalOptionBShares: option == 1 ? currentMarket.totalOptionBShares + shares : currentMarket.totalOptionBShares,
                totalPool: currentMarket.totalPool + netAmount
            )
            
            FlowWager.markets[marketId] = updatedMarket
        }
        
        emit SharesPurchased(
            marketId: marketId,
            buyer: self.account.address,
            option: option,
            shares: shares,
            amount: betAmount
        )
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
    
    access(all) fun getMarketsByCategory(category: MarketCategory): [Market] {
        let filteredMarkets: [Market] = []
        for market in FlowWager.markets.values {
            if market.category == category {
                filteredMarkets.append(market)
            }
        }
        return filteredMarkets
    }
    
    access(all) fun getUserProfile(address: Address): UserProfile? {
        return FlowWager.userProfiles[address]
    }
    
    access(all) fun getUserStats(address: Address): UserStats? {
        return FlowWager.userStats[address]
    }
    
    access(all) fun getPlatformStats(): PlatformStats {
        var activeMarkets: UInt64 = 0
        for market in FlowWager.markets.values {
            if market.status == MarketStatus.Active {
                activeMarkets = activeMarkets + 1
            }
        }
        
        return PlatformStats(
            totalMarkets: UInt64(FlowWager.markets.length),
            activeMarkets: activeMarkets,
            totalUsers: UInt64(FlowWager.userProfiles.length),
            totalVolume: FlowWager.totalVolumeTraded,
            totalFees: FlowWager.totalPlatformFees
        )
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
        
        self.UserPositionsStoragePath = /storage/FlowWagerUserPositions
        self.UserPositionsPublicPath = /public/FlowWagerUserPositions
        self.UserStatsStoragePath = /storage/FlowWagerUserStats
        self.UserStatsPublicPath = /public/FlowWagerUserStats
        
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: /storage/FlowWagerAdmin)
        
        emit ContractInitialized()
    }
}