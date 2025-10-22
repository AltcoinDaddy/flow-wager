import "FlowToken"
import "FungibleToken"

access(all) contract FlowUpdate {

    // Events
    access(all) event ContractInitialized()
    access(all) event MultiOptionMarketCreated(marketId: UInt64, title: String, creator: Address, optionCount: UInt8)
    access(all) event MultiOptionBetPlaced(marketId: UInt64, user: Address, optionIndex: UInt8, amount: UFix64, shares: UFix64)
    access(all) event MultiOptionMarketResolved(marketId: UInt64, winningOption: UInt8, resolver: Address)
    access(all) event MultiOptionWinningsClaimed(marketId: UInt64, claimer: Address, amount: UFix64)
    access(all) event BatchBetsPlaced(marketId: UInt64, user: Address, betCount: UInt8, totalAmount: UFix64)

    // Storage Paths
    access(all) let AdminStoragePath: StoragePath
    access(all) let MultiOptionPositionsStoragePath: StoragePath
    access(all) let MultiOptionPositionsPublicPath: PublicPath

    // Contract state
    access(contract) var paused: Bool
    access(contract) var nextMarketId: UInt64
    access(contract) var marketCount: UInt64
    access(contract) let adminAddress: Address

    // Market categories for multi-option markets
    access(all) enum MultiMarketCategory: UInt8 {
        access(all) case Sports
        access(all) case Politics
        access(all) case Entertainment
        access(all) case Crypto
        access(all) case Finance
        access(all) case Other
    }

    // Market status
    access(all) enum MultiMarketStatus: UInt8 {
        access(all) case Active
        access(all) case Paused
        access(all) case Resolved
        access(all) case Cancelled
    }

    // Multi-option market structure
    access(all) struct MultiOptionMarket {
        access(all) let id: UInt64
        access(all) let title: String
        access(all) let description: String
        access(all) let category: MultiMarketCategory
        access(all) let options: [String] // Array of option descriptions
        access(all) let creator: Address
        access(all) let createdAt: UFix64
        access(all) let endTime: UFix64
        access(all) let minBet: UFix64
        access(all) let maxBet: UFix64
        access(all) let status: MultiMarketStatus
        access(all) let resolved: Bool
        access(all) let winningOption: UInt8?
        access(all) let totalShares: [UFix64] // Shares for each option
        access(all) let totalPool: UFix64
        access(all) let imageUrl: String
        access(all) let maxOptions: UInt8

        init(
            id: UInt64,
            title: String,
            description: String,
            category: MultiMarketCategory,
            options: [String],
            creator: Address,
            endTime: UFix64,
            minBet: UFix64,
            maxBet: UFix64,
            imageUrl: String
        ) {
            pre {
                options.length >= 2: "Must have at least 2 options"
                options.length <= 10: "Cannot have more than 10 options"
                endTime > getCurrentBlock().timestamp: "End time must be in the future"
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
            self.status = MultiMarketStatus.Active
            self.resolved = false
            self.winningOption = nil
            self.totalPool = 0.0
            self.imageUrl = imageUrl
            self.maxOptions = UInt8(options.length)

            // Initialize total shares array with zeros
            self.totalShares = []
            var i = 0
            while i < options.length {
                self.totalShares.append(0.0)
                i = i + 1
            }
        }
    }

    // User position in multi-option market
access(all) struct MultiOptionPosition {
    access(all) let marketId: UInt64
    access(all) let optionShares: [UFix64]
    access(all) let totalInvested: UFix64
    access(all) var claimed: Bool  // Changed from access(all) to access(contract)
    access(all) let createdAt: UFix64

    init(marketId: UInt64, optionShares: [UFix64], totalInvested: UFix64) {
        self.marketId = marketId
        self.optionShares = optionShares
        self.totalInvested = totalInvested
        self.claimed = false
        self.createdAt = getCurrentBlock().timestamp
    }


    access(contract) fun setClaimed() {
        pre {
            !self.claimed: "Already claimed"
        }
        self.claimed = true
    }
}

    // Batch bet structure for placing multiple bets at once
    access(all) struct BatchBet {
        access(all) let optionIndex: UInt8
        access(all) let amount: UFix64

        init(optionIndex: UInt8, amount: UFix64) {
            self.optionIndex = optionIndex
            self.amount = amount
        }
    }

    // Resource to hold user's multi-option positions
    access(all) resource MultiOptionPositions {
        access(all) var positions: {UInt64: MultiOptionPosition}

        init() {
            self.positions = {}
        }

        access(contract) fun addPosition(_ position: MultiOptionPosition) {
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

                let combinedPosition = MultiOptionPosition(
                    marketId: position.marketId,
                    optionShares: newOptionShares,
                    totalInvested: existingPosition.totalInvested + position.totalInvested
                )
                self.positions[position.marketId] = combinedPosition
            } else {
                self.positions[position.marketId] = position
            }
        }

        access(all) fun getPosition(marketId: UInt64): MultiOptionPosition? {
            return self.positions[marketId]
        }

        access(all) fun getAllPositions(): {UInt64: MultiOptionPosition} {
            return self.positions
        }

 access(all) fun markClaimed(marketId: UInt64) {
    if let existingPosition = self.positions[marketId] {
        // Create a mutable copy of the position
        var claimedPosition = MultiOptionPosition(
            marketId: existingPosition.marketId,
            optionShares: existingPosition.optionShares,
            totalInvested: existingPosition.totalInvested
        )
        // Use the setter to mark it as claimed
        claimedPosition.setClaimed()
        // Update the position in storage
        self.positions[marketId] = claimedPosition
    }
}

    }

    // Admin resource for managing multi-option markets
    access(all) resource Admin {
        access(all) fun pauseContract() {
            pre {
                self.owner!.address == FlowUpdate.adminAddress: "Only admin can pause"
            }
            FlowUpdate.paused = true
        }

        access(all) fun unpauseContract() {
            pre {
                self.owner!.address == FlowUpdate.adminAddress: "Only admin can unpause"
            }
            FlowUpdate.paused = false
        }

        access(all) fun resolveMarket(marketId: UInt64, winningOption: UInt8, justification: String) {
            pre {
                !FlowUpdate.paused: "Contract is paused"
                FlowUpdate.markets.containsKey(marketId): "Market does not exist"
                winningOption < FlowUpdate.markets[marketId]!.maxOptions: "Invalid winning option"
            }

            let market = FlowUpdate.markets[marketId]!
            let resolvedMarket = MultiOptionMarket(
                id: market.id,
                title: market.title,
                description: market.description,
                category: market.category,
                options: market.options,
                creator: market.creator,
                endTime: market.endTime,
                minBet: market.minBet,
                maxBet: market.maxBet,
                imageUrl: market.imageUrl
            )

            // Update market with resolution (this would need struct modification for proper implementation)
            FlowUpdate.markets[marketId] = resolvedMarket

            emit MultiOptionMarketResolved(marketId: marketId, winningOption: winningOption, resolver: self.owner!.address)
        }
    }

    // Contract storage
    access(contract) let markets: {UInt64: MultiOptionMarket}
    access(contract) let marketVaults: @{UInt64: FlowToken.Vault}
    access(self) var platformVault: @FlowToken.Vault

    // Public functions

    // Create a multi-option market
    access(all) fun createMultiOptionMarket(
        title: String,
        description: String,
        category: MultiMarketCategory,
        options: [String],
        endTime: UFix64,
        minBet: UFix64,
        maxBet: UFix64,
        imageUrl: String,
        creator: Address,
        creationFeeVault: @FlowToken.Vault?
    ): UInt64 {
        pre {
            !self.paused: "Contract is paused"
            options.length >= 2: "Must have at least 2 options"
            options.length <= 10: "Cannot have more than 10 options"
            endTime > getCurrentBlock().timestamp: "End time must be in the future"
            minBet > 0.0: "Minimum bet must be greater than 0"
            maxBet >= minBet: "Maximum bet must be greater than or equal to minimum bet"
        }

        // Handle creation fee if provided
        if let feeVault <- creationFeeVault {
            self.platformVault.deposit(from: <-feeVault)
        }

        let marketId = self.nextMarketId
        let market = MultiOptionMarket(
            id: marketId,
            title: title,
            description: description,
            category: category,
            options: options,
            creator: creator,
            endTime: endTime,
            minBet: minBet,
            maxBet: maxBet,
            imageUrl: imageUrl
        )

        self.markets[marketId] = market
        self.marketVaults[marketId] <-! FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
        self.nextMarketId = marketId + 1
        self.marketCount = self.marketCount + 1

        emit MultiOptionMarketCreated(
            marketId: marketId,
            title: title,
            creator: market.creator,
            optionCount: UInt8(options.length)
        )

        return marketId
    }

    // Place a single bet on a specific option
    access(all) fun placeBet(
        marketId: UInt64,
        optionIndex: UInt8,
        betVault: @FlowToken.Vault,
        userPositions: &MultiOptionPositions,
        user: Address
    ) {
        pre {
            !self.paused: "Contract is paused"
            self.markets.containsKey(marketId): "Market does not exist"
            betVault.balance > 0.0: "Bet amount must be greater than 0"
            self.markets[marketId]!.status == MultiMarketStatus.Active: "Market is not active"
            getCurrentBlock().timestamp < self.markets[marketId]!.endTime: "Market has ended"
            optionIndex < self.markets[marketId]!.maxOptions: "Invalid option index"
            betVault.balance >= self.markets[marketId]!.minBet: "Bet amount too low"
            betVault.balance <= self.markets[marketId]!.maxBet: "Bet amount too high"
        }

        let market = self.markets[marketId]!
        let betAmount = betVault.balance

        // Calculate shares (simple 1:1 for now, could implement more complex pricing)
        let shares = betAmount

        // Deposit bet into market vault
        let marketVaultRef = &self.marketVaults[marketId] as &FlowToken.Vault?
        marketVaultRef!.deposit(from: <-betVault)

        // Create position
        var optionShares: [UFix64] = []
        var i = 0
        while i < Int(market.maxOptions) {
            if UInt8(i) == optionIndex {
                optionShares.append(shares)
            } else {
                optionShares.append(0.0)
            }
            i = i + 1
        }

        let position = MultiOptionPosition(
            marketId: marketId,
            optionShares: optionShares,
            totalInvested: betAmount
        )

        userPositions.addPosition(position)

        emit MultiOptionBetPlaced(
            marketId: marketId,
            user: user,
            optionIndex: optionIndex,
            amount: betAmount,
            shares: shares
        )
    }

    // Place multiple bets in a single transaction
    access(all) fun placeBatchBets(
        marketId: UInt64,
        bets: [BatchBet],
        betVaults: @[FlowToken.Vault],
        userPositions: &MultiOptionPositions,
        user: Address
    ) {
        pre {
            !self.paused: "Contract is paused"
            self.markets.containsKey(marketId): "Market does not exist"
            bets.length == betVaults.length: "Bets and vaults count mismatch"
            bets.length > 0: "Must provide at least one bet"
            bets.length <= 10: "Cannot place more than 10 bets at once"
        }

        let market = self.markets[marketId]!
        var totalAmount = 0.0
        var combinedOptionShares: [UFix64] = []

        // Initialize shares array
        var i = 0
        while i < Int(market.maxOptions) {
            combinedOptionShares.append(0.0)
            i = i + 1
        }

        // Process each bet
        var betIndex = 0
        while betIndex < bets.length {
            let bet = bets[betIndex]
            let vault <- betVaults.removeFirst()
            let betAmount = vault.balance

            // Validate bet
            assert(bet.optionIndex < market.maxOptions, message: "Invalid option index")
            assert(betAmount >= market.minBet, message: "Bet amount too low")
            assert(betAmount <= market.maxBet, message: "Bet amount too high")

            // Add to combined shares
            let shares = betAmount
            let optionIdx = Int(bet.optionIndex)
            combinedOptionShares[optionIdx] = combinedOptionShares[optionIdx] + shares
            totalAmount = totalAmount + betAmount

            // Deposit into market vault
            let marketVaultRef = &self.marketVaults[marketId] as &FlowToken.Vault?
            marketVaultRef!.deposit(from: <-vault)

            betIndex = betIndex + 1
        }

        // Destroy any remaining vaults (should be empty)
        destroy betVaults

        // Create combined position
        let position = MultiOptionPosition(
            marketId: marketId,
            optionShares: combinedOptionShares,
            totalInvested: totalAmount
        )

        userPositions.addPosition(position)

        emit BatchBetsPlaced(
            marketId: marketId,
            user: user,
            betCount: UInt8(bets.length),
            totalAmount: totalAmount
        )
    }

    // Get market information
    access(all) fun getMarket(marketId: UInt64): MultiOptionMarket? {
        return self.markets[marketId]
    }

    // Get all active markets
    access(all) fun getActiveMarkets(): {UInt64: MultiOptionMarket} {
        let activeMarkets: {UInt64: MultiOptionMarket} = {}
        for marketId in self.markets.keys {
            let market = self.markets[marketId]!
            if market.status == MultiMarketStatus.Active {
                activeMarkets[marketId] = market
            }
        }
        return activeMarkets
    }

    // Create user positions resource
    access(all) fun createMultiOptionPositions(): @MultiOptionPositions {
        return <- create MultiOptionPositions()
    }

    // Calculate potential winnings for a position
    access(all) fun calculatePotentialWinnings(marketId: UInt64, position: MultiOptionPosition, winningOption: UInt8): UFix64 {
        let market = self.markets[marketId] ?? panic("Market does not exist")

        if Int(winningOption) >= position.optionShares.length {
            return 0.0
        }

        let userShares = position.optionShares[Int(winningOption)]
        if userShares == 0.0 {
            return 0.0
        }

        // Simple calculation: user's share proportion of total pool
        // In a real implementation, this would be more sophisticated
        let totalWinningShares = market.totalShares[Int(winningOption)]
        if totalWinningShares == 0.0 {
            return 0.0
        }

        let userProportion = userShares / totalWinningShares
        return market.totalPool * userProportion
    }

    // Get contract stats
    access(all) fun getContractStats(): {String: AnyStruct} {
        return {
            "totalMarkets": self.marketCount,
            "activeMarkets": UInt64(self.getActiveMarkets().keys.length),
            "paused": self.paused,
            "nextMarketId": self.nextMarketId
        }
    }


access(all) fun claimWinnings(
    marketId: UInt64,
    userPositions: &MultiOptionPositions,
    recipientVault: &{FungibleToken.Receiver}
) {
    pre {
        !self.paused: "Contract is paused"
        self.markets.containsKey(marketId): "Market does not exist"
        self.markets[marketId]!.resolved: "Market is not resolved"
        self.marketVaults.containsKey(marketId): "Market vault does not exist"
    }

    let market = self.markets[marketId]!
    let position = userPositions.getPosition(marketId: marketId) ?? panic("No position found")

    assert(!position.claimed, message: "Winnings already claimed")

    let winningOption = market.winningOption ?? panic("No winning option set")
    let winnings = self.calculatePotentialWinnings(marketId: marketId, position: position, winningOption: winningOption)

    assert(winnings > 0.0, message: "No winnings to claim")

    // Get authorized reference to the market vault
    let marketVaultRef = (&self.marketVaults[marketId] as auth(FungibleToken.Withdraw) &FlowToken.Vault?)!

    let winningsVault <- marketVaultRef.withdraw(amount: winnings)
    recipientVault.deposit(from: <-winningsVault)

    // Mark position as claimed
    userPositions.markClaimed(marketId: marketId)

    emit MultiOptionWinningsClaimed(
        marketId: marketId,
        claimer: recipientVault.owner!.address,
        amount: winnings
    )
}
    init() {
        // Initialize paths
        self.AdminStoragePath = /storage/FlowUpdateAdmin
        self.MultiOptionPositionsStoragePath = /storage/MultiOptionPositions
        self.MultiOptionPositionsPublicPath = /public/MultiOptionPositions

        // Initialize contract state
        self.paused = false
        self.nextMarketId = 1
        self.marketCount = 0
        self.adminAddress = self.account.address

        // Initialize storage
        self.markets = {}
        self.marketVaults <- {}
        self.platformVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())

        // Save admin resource
        self.account.storage.save(<-create Admin(), to: self.AdminStoragePath)

        emit ContractInitialized()
    }
}
