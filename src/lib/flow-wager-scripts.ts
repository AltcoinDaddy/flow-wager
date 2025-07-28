export const getFlowWagerAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT || "0x512a5459cb3a2b20"
    : process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT ||
        "0x512a5459cb3a2b20";
};

export const getFlowTokenAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOW_MAINNET_TOKEN || "0x1654653399040a61"
    : process.env.NEXT_PUBLIC_FLOW_TESTNET_TOKEN || "0x7e60df042a9c0868";
};

export const getFungibleTokenAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_MAINNET_TOKEN ||
        "0xf233dcee88fe0abe"
    : process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_TESTNET_TOKEN ||
        "0x9a0766d93b6608b7";
};

const CADENCE_SCRIPTS = {
  getUserTrades: `
    import FlowWager from ${getFlowWagerAddress()}
    import FlowToken from ${getFlowTokenAddress()}
import FungibleToken from  ${getFungibleTokenAddress()}

access(all) struct TradeDetails {
    access(all) let marketId: UInt64
    access(all) let marketTitle: String
    access(all) let marketDescription: String
    access(all) let optionA: String
    access(all) let optionB: String
    access(all) let optionAShares: UFix64
    access(all) let optionBShares: UFix64
    access(all) let totalInvested: UFix64
    access(all) let averagePrice: UFix64
    access(all) let endTime: UFix64
    access(all) let currentValue: UFix64
    access(all) let profitLoss: Fix64

    init(
        marketId: UInt64,
        marketTitle: String,
        marketDescription: String,
        optionA: String,
        optionB: String,
        optionAShares: UFix64,
        optionBShares: UFix64,
        totalInvested: UFix64,
        averagePrice: UFix64,
        endTime: UFix64,
        currentValue: UFix64,
        profitLoss: Fix64
    ) {
        self.marketId = marketId
        self.marketTitle = marketTitle
        self.marketDescription = marketDescription
        self.optionA = optionA
        self.optionB = optionB
        self.optionAShares = optionAShares
        self.optionBShares = optionBShares
        self.totalInvested = totalInvested
        self.averagePrice = averagePrice
        self.endTime = endTime
        self.currentValue = currentValue
        self.profitLoss = profitLoss
    }
}

access(all) struct UserTrades {
    access(all) let activeTrades: [TradeDetails]
    access(all) let totalDeposited: UFix64

    init(activeTrades: [TradeDetails], totalDeposited: UFix64) {
        self.activeTrades = activeTrades
        self.totalDeposited = totalDeposited
    }
}

access(all) fun calculateCurrentValue(
    position: FlowWager.UserPosition,
    market: FlowWager.Market
): UFix64 {
    let totalShares = position.optionAShares + position.optionBShares
    if totalShares == 0.0 {
        return 0.0
    }
    
    let totalMarketShares = market.totalOptionAShares + market.totalOptionBShares
    if totalMarketShares == 0.0 {
        return position.totalInvested
    }
    
    let shareRatio = totalShares / totalMarketShares
    let distributablePool = market.totalPool * (1.0 - (FlowWager.platformFeePercentage / 100.0))
    
    return distributablePool * shareRatio
}

access(all) fun main(userAddress: Address): UserTrades {
    let positionsDict = FlowWager.getUserPositions(address: userAddress)
    var activeTrades: [TradeDetails] = []
    var totalDeposited: UFix64 = 0.0
    
    for marketId in positionsDict.keys {
        if let market = FlowWager.getMarketById(marketId: marketId) {
            if market.status == FlowWager.MarketStatus.Active {
                let position = positionsDict[marketId]!
                
                let currentValue = calculateCurrentValue(position: position, market: market)
                let profitLoss = Fix64(currentValue) - Fix64(position.totalInvested)
                
                activeTrades.append(TradeDetails(
                    marketId: marketId,
                    marketTitle: market.title,
                    marketDescription: market.description,
                    optionA: market.optionA,
                    optionB: market.optionB,
                    optionAShares: position.optionAShares,
                    optionBShares: position.optionBShares,
                    totalInvested: position.totalInvested,
                    averagePrice: position.averagePrice,
                    endTime: market.endTime,
                    currentValue: currentValue,
                    profitLoss: profitLoss
                ))
            }
            // Sum totalInvested for all positions (active or not)
            totalDeposited = totalDeposited + positionsDict[marketId]!.totalInvested
        }
    }
    
    return UserTrades(activeTrades: activeTrades, totalDeposited: totalDeposited)
}
  `,

  getActiveUserPositions: `
    import FlowWager from ${getFlowWagerAddress()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    access(all) struct PositionDetails {
        access(all) let marketId: UInt64
        access(all) let marketTitle: String
        access(all) let optionAShares: UFix64
        access(all) let optionBShares: UFix64
        access(all) let totalInvested: UFix64
        access(all) let currentValue: UFix64
        access(all) let pnl: Fix64
        access(all) let pnlPercentage: Fix64
        access(all) let status: FlowWager.MarketStatus
        access(all) let outcome: UInt8?

        init(
            marketId: UInt64,
            marketTitle: String,
            optionAShares: UFix64,
            optionBShares: UFix64,
            totalInvested: UFix64,
            currentValue: UFix64,
            pnl: Fix64,
            pnlPercentage: Fix64,
            status: FlowWager.MarketStatus,
            outcome: UInt8?
        ) {
            self.marketId = marketId
            self.marketTitle = marketTitle
            self.optionAShares = optionAShares
            self.optionBShares = optionBShares
            self.totalInvested = totalInvested
            self.currentValue = currentValue
            self.pnl = pnl
            self.pnlPercentage = pnlPercentage
            self.status = status
            self.outcome = outcome
        }
    }

    access(all) fun calculateCurrentValue(
        position: FlowWager.UserPosition,
        market: FlowWager.Market,
        claimableWinnings: {UInt64: UFix64}
    ): UFix64 {
        let totalShares = position.optionAShares + position.optionBShares
        if totalShares == 0.0 {
            return 0.0
        }
        
        if market.resolved {
            return claimableWinnings[market.id] ?? 0.0
        }
        
        let totalMarketShares = market.totalOptionAShares + market.totalOptionBShares
        if totalMarketShares == 0.0 {
            return position.totalInvested
        }
        
        let shareRatio = totalShares / totalMarketShares
        let distributablePool = market.totalPool * (1.0 - (FlowWager.platformFeePercentage / 100.0))
        
        return distributablePool * shareRatio
    }

    access(all) fun main(userAddress: Address): [PositionDetails] {
        let positionsDict = FlowWager.getUserPositions(address: userAddress)
        let claimableWinningsRaw = FlowWager.getClaimableWinnings(address: userAddress)
        let claimableWinnings: {UInt64: UFix64} = {}
        for cw in claimableWinningsRaw {
            claimableWinnings[cw.marketId] = cw.amount
        }
        
        var positionDetails: [PositionDetails] = []
        
        for marketId in positionsDict.keys {
            if let market = FlowWager.getMarketById(marketId: marketId) {
                let position = positionsDict[marketId]!
                let currentValue = calculateCurrentValue(
                    position: position,
                    market: market,
                    claimableWinnings: claimableWinnings
                )
                let pnl = Fix64(currentValue) - Fix64(position.totalInvested)
                let pnlPercentage = position.totalInvested > 0.0 
                    ? (pnl / Fix64(position.totalInvested)) * 100.0 
                    : 0.0
                
                positionDetails.append(PositionDetails(
                    marketId: marketId,
                    marketTitle: market.title,
                    optionAShares: position.optionAShares,
                    optionBShares: position.optionBShares,
                    totalInvested: position.totalInvested,
                    currentValue: currentValue,
                    pnl: pnl,
                    pnlPercentage: pnlPercentage,
                    status: market.status,
                    outcome: market.outcome
                ))
            }
        }
        
        return positionDetails
    }
  `,


  getActiveMarkets: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) fun main(): [FlowWager.Market] {
        return FlowWager.getActiveMarkets()
    }
  `,

  getAllMarkets: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) fun main(): [FlowWager.Market] {
        return FlowWager.getAllMarkets()
    }
  `,

  getMarketById: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) fun main(marketId: UInt64): FlowWager.Market? {
        return FlowWager.getMarketById(marketId: marketId)
    }
  `,

  getMarketByCreator: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) fun main(creator: Address): [FlowWager.Market] {
      return FlowWager.getMarketsByCreator(creator: creator)
    }
  `,

  getPlatformStats: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) fun main(): FlowWager.PlatformStats {
        return FlowWager.getPlatformStats()
    }
  `,

  getUserFlowBalance: `
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    access(all) fun main(address: Address): UFix64 {
        let account = getAccount(address)
        let vaultRef = account.capabilities.get<&FlowToken.Vault>(/public/flowTokenBalance)
            .borrow()
            ?? panic("Could not borrow Vault reference")
        return vaultRef.balance
    }
  `,

  getUserProfile: `
    import FlowWager from ${getFlowWagerAddress()}

access(all) fun main(address: Address): &{FlowWager.UserProfilePublic}? {
    return FlowWager.getUserProfile(address: address)
}
  `,

  getPendingMarkets: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) fun main(): [FlowWager.Market] {
        return FlowWager.getPendingResolutionMarkets()
    }
  `,

  getPendingMarketsWithEvidence: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) struct PendingMarketWithEvidence {
        access(all) let market: FlowWager.Market
        access(all) let evidence: FlowWager.ResolutionEvidence?
        
        init(market: FlowWager.Market, evidence: FlowWager.ResolutionEvidence?) {
            self.market = market
            self.evidence = evidence
        }
    }

    access(all) fun main(): [PendingMarketWithEvidence] {
        let pendingMarkets = FlowWager.getPendingResolutionMarkets()
        let result: [PendingMarketWithEvidence] = []
        
        for market in pendingMarkets {
            let evidence = FlowWager.getResolutionEvidence(marketId: market.id)
            result.append(PendingMarketWithEvidence(market: market, evidence: evidence))
        }
        
        return result
    }
  `,

  getUserPositions: `
  import FlowWager from ${getFlowWagerAddress()}
  import FlowToken from ${getFlowTokenAddress()}
  import FungibleToken from ${getFungibleTokenAddress()}

  access(all) struct PositionDetails {
      access(all) let marketId: UInt64
      access(all) let marketTitle: String
      access(all) let marketDescription: String
      access(all) let optionA: String
      access(all) let optionB: String
      access(all) let optionAShares: UFix64
      access(all) let optionBShares: UFix64
      access(all) let totalInvested: UFix64
      access(all) let averagePrice: UFix64
      access(all) let endTime: UFix64
      access(all) let status: FlowWager.MarketStatus
      access(all) let currentValue: UFix64
      access(all) let profitLoss: Fix64
      access(all) let claimableAmount: UFix64
      access(all) let claimed: Bool

      init(
          marketId: UInt64,
          marketTitle: String,
          marketDescription: String,
          optionA: String,
          optionB: String,
          optionAShares: UFix64,
          optionBShares: UFix64,
          totalInvested: UFix64,
          averagePrice: UFix64,
          endTime: UFix64,
          status: FlowWager.MarketStatus,
          currentValue: UFix64,
          profitLoss: Fix64,
          claimableAmount: UFix64,
          claimed: Bool
      ) {
          self.marketId = marketId
          self.marketTitle = marketTitle
          self.marketDescription = marketDescription
          self.optionA = optionA
          self.optionB = optionB
          self.optionAShares = optionAShares
          self.optionBShares = optionBShares
          self.totalInvested = totalInvested
          self.averagePrice = averagePrice
          self.endTime = endTime
          self.status = status
          self.currentValue = currentValue
          self.profitLoss = profitLoss
          self.claimableAmount = claimableAmount
          self.claimed = claimed
      }
  }

  access(all) fun calculateCurrentValue(
      position: FlowWager.UserPosition,
      market: FlowWager.Market,
      claimableWinnings: {UInt64: UFix64}
  ): UFix64 {
      let totalShares = position.optionAShares + position.optionBShares
      if totalShares == 0.0 {
          return 0.0
      }
      
      if market.resolved {
          return claimableWinnings[market.id] ?? 0.0
      }
      
      let totalMarketShares = market.totalOptionAShares + market.totalOptionBShares
      if totalMarketShares == 0.0 {
          return position.totalInvested
      }
      
      let shareRatio = totalShares / totalMarketShares
      let distributablePool = market.totalPool * (1.0 - (FlowWager.platformFeePercentage / 100.0))
      
      return distributablePool * shareRatio
  }

  access(all) fun main(userAddress: Address): [PositionDetails] {
      let positionsDict = FlowWager.getUserPositions(address: userAddress)
      let claimableWinningsRaw = FlowWager.getClaimableWinnings(address: userAddress)
      let claimableWinnings: {UInt64: UFix64} = {}
      for cw in claimableWinningsRaw {
          claimableWinnings[cw.marketId] = cw.amount
      }
      
      var positionDetails: [PositionDetails] = []
      
      for marketId in positionsDict.keys {
          if let market = FlowWager.getMarketById(marketId: marketId) {
              let position = positionsDict[marketId]!
              
              let currentValue = calculateCurrentValue(
                  position: position,
                  market: market,
                  claimableWinnings: claimableWinnings
              )
              let profitLoss = Fix64(currentValue) - Fix64(position.totalInvested)
              let claimableAmount = market.resolved && !position.claimed
                  ? claimableWinnings[marketId] ?? 0.0
                  : 0.0
              
              positionDetails.append(PositionDetails(
                  marketId: marketId,
                  marketTitle: market.title,
                  marketDescription: market.description,
                  optionA: market.optionA,
                  optionB: market.optionB,
                  optionAShares: position.optionAShares,
                  optionBShares: position.optionBShares,
                  totalInvested: position.totalInvested,
                  averagePrice: position.averagePrice,
                  endTime: market.endTime,
                  status: market.status,
                  currentValue: currentValue,
                  profitLoss: profitLoss,
                  claimableAmount: claimableAmount,
                  claimed: position.claimed
              ))
          }
      }
      
      return positionDetails
  }
`,

  getUserDashboardData: `
    import FlowWager from ${getFlowWagerAddress()}

access(all) struct UserDashboard {
    access(all) let profile: &{FlowWager.UserProfilePublic}?
    access(all) let stats: FlowWager.UserStats?
    access(all) let positions: {UInt64: FlowWager.UserPosition}
    access(all) let claimableWinnings: [FlowWager.ClaimableWinnings]
    access(all) let isRegistered: Bool
    access(all) let totalMarketsCreated: UInt64
    access(all) let createdMarkets: [FlowWager.Market]
    
    init(
        profile: &{FlowWager.UserProfilePublic}?,
        stats: FlowWager.UserStats?,
        positions: {UInt64: FlowWager.UserPosition},
        claimableWinnings: [FlowWager.ClaimableWinnings],
        isRegistered: Bool,
        totalMarketsCreated: UInt64,
        createdMarkets: [FlowWager.Market]
    ) {
        self.profile = profile
        self.stats = stats
        self.positions = positions
        self.claimableWinnings = claimableWinnings
        self.isRegistered = isRegistered
        self.totalMarketsCreated = totalMarketsCreated
        self.createdMarkets = createdMarkets
    }
}

access(all) fun main(userAddress: Address): UserDashboard {
    // Get user profile (returns a reference, not the resource itself)
    let profile = FlowWager.getUserProfile(address: userAddress)
    
    // Get user stats
    let stats = FlowWager.getUserStats(address: userAddress)
    
    // Get user positions (with error handling for unregistered users)
    var positions: {UInt64: FlowWager.UserPosition} = {}
    if stats != nil {
        positions = FlowWager.getUserPositions(address: userAddress)
    }
    
    // Get claimable winnings
    let claimableWinnings = FlowWager.getClaimableWinnings(address: userAddress)
    
    // Check if user is registered
    let isRegistered = stats != nil && profile != nil
    
    // Get markets created by this user
    let createdMarkets = FlowWager.getMarketsByCreator(creator: userAddress)
    let totalMarketsCreated = UInt64(createdMarkets.length)
    
    return UserDashboard(
        profile: profile,
        stats: stats,
        positions: positions,
        claimableWinnings: claimableWinnings,
        isRegistered: isRegistered,
        totalMarketsCreated: totalMarketsCreated,
        createdMarkets: createdMarkets
    )
}
  `,

  activeUserPositions: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) struct ActivePosition {
        access(all) let marketId: UInt64
        access(all) let marketTitle: String
        access(all) let optionAShares: UFix64
        access(all) let optionBShares: UFix64
        access(all) let totalInvested: UFix64

        init(
            marketId: UInt64,
            marketTitle: String,
            optionAShares: UFix64self.optionAShares: optionAShares,
            optionBShares: UFix64,
            totalInvested: UFix64
        ) {
            self.marketId = marketId
            self.marketTitle = marketTitle
            self.optionAShares = optionAShares
            self.optionBShares = optionBShares
            self.totalInvested = totalInvested
        }
    }

    access(all) fun main(userAddress: Address): [ActivePosition] {
        let positionsDict = FlowWager.getUserPositions(address: userAddress)
        var activePositions: [ActivePosition] = []
        for marketId in positionsDict.keys {
            if let market = FlowWager.getMarketById(marketId: marketId) {
                if market.status == FlowWager.MarketStatus.Active {
                    let position = positionsDict[marketId]!
                    activePositions.append(ActivePosition(
                        marketId: marketId,
                        marketTitle: market.title,
                        optionAShares: position.optionAShares,
                        optionBShares: position.optionBShares,
                        totalInvested: position.totalInvested
                    ))
                }
            }
        }
        return activePositions
    }
  `,

  getClaimableWinnings: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) fun main(address: Address): [FlowWager.ClaimableWinnings] {
        return FlowWager.getClaimableWinnings(address: address)
    }
  `,

  createUserAccount: `
    import FlowWager from ${getFlowWagerAddress()}
    import FlowToken from ${getFlowTokenAddress()}

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
  `,

  createMarket: `
    import FlowWager from ${getFlowWagerAddress()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

   transaction(
    title: String,
    description: String,
    categoryRaw: UInt8,
    optionA: String,
    optionB: String,
    endTime: UFix64,
    minBet: UFix64,
    maxBet: UFix64,
    imageUrl: String
) {
    let flowVault: @FlowToken.Vault?
    let category: FlowWager.MarketCategory
    let signerAddress: Address
    let isDeployer: Bool
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Store the category and signer address for use in execute
        self.category = FlowWager.MarketCategory(rawValue: categoryRaw)!
        self.signerAddress = signer.address
        
        // Check if signer is the deployer (gets contract deployer address)
        let deployerAddress = FlowWager.deployerAddress
        self.isDeployer = signer.address == deployerAddress
        
        // Only prepare creation fee if user is NOT the deployer
        if !self.isDeployer {
            let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow FlowToken vault")
            
            // Get the current market creation fee from contract
            let marketCreationFee = FlowWager.marketCreationFee
            self.flowVault <- vault.withdraw(amount: marketCreationFee) as! @FlowToken.Vault
            
            log("Creation fee of ".concat(marketCreationFee.toString()).concat(" FLOW will be charged"))
        } else {
            self.flowVault <- nil
            log("No creation fee required for deployer")
        }
    }
    
    execute {
        let marketId = FlowWager.createMarket(
            title: title,
            description: description,
            category: self.category,
            optionA: optionA,
            optionB: optionB,
            endTime: endTime,
            minBet: minBet,
            maxBet: maxBet,
            imageUrl: imageUrl,
            creationFeeVault: <-self.flowVault,
            address: self.signerAddress
        )
        
        log("Market created with ID: ".concat(marketId.toString()))
    }
}
  `,

  checkUserRegistered: `
  import FlowWager from ${getFlowWagerAddress()}

access(all) fun main(userAddress: Address): {String: AnyStruct} {
    // Check if user is registered in the contract
    let userStats = FlowWager.getUserStats(address: userAddress)
    let isRegisteredInContract = userStats != nil
    
    // Check if user has UserProfile resource
    let account = getAccount(userAddress)
    let userProfile = account.capabilities.get<&{FlowWager.UserProfilePublic}>(
        FlowWager.UserProfilePublicPath
    ).borrow()
    let hasUserProfile = userProfile != nil
    
    // Check if user has UserPositions resource
    let userPositions = account.capabilities.get<&{FlowWager.UserPositionsPublic}>(
        FlowWager.UserPositionsPublicPath
    ).borrow()
    let hasUserPositions = userPositions != nil
    
    // Check if user has UserStats resource
    let userStatsResource = account.capabilities.get<&{FlowWager.UserStatsPublic}>(
        FlowWager.UserStatsPublicPath
    ).borrow()
    let hasUserStatsResource = userStatsResource != nil
    
    // Get user profile details if available
    var username: String? = nil
    var displayName: String? = nil
    var joinedAt: UFix64? = nil
    
    if let profile = userProfile {
        username = profile.getUsername()
        displayName = profile.getDisplayName()
        joinedAt = profile.joinedAt
    }
    
    // Determine overall registration status
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

// Simple version - just returns boolean
access(all) fun isUserRegistered(userAddress: Address): Bool {
    let userStats = FlowWager.getUserStats(address: userAddress)
    let account = getAccount(userAddress)
    let userProfile = account.capabilities.get<&{FlowWager.UserProfilePublic}>(
        FlowWager.UserProfilePublicPath
    ).borrow()
    
    return userStats != nil && userProfile != nil
}`,

  placeBet: `
    import FlowWager from ${getFlowWagerAddress()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

     transaction(marketId: UInt64, option: UInt8, betAmount: UFix64) {
        let betVault: @FlowToken.Vault
        let userPositionsCap: Capability<&FlowWager.UserPositions>
        let signerAddress: Address

        prepare(signer: auth(Storage, Capabilities, BorrowValue) &Account) {
            self.signerAddress = signer.address
            // Borrow FlowToken vault
            let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow FlowToken vault")
            
            // Withdraw the bet amount
            self.betVault <- vault.withdraw(amount: betAmount) as! @FlowToken.Vault

            // Initialize UserPositions if not present
            if !signer.storage.check<@FlowWager.UserPositions>(from: FlowWager.UserPositionsStoragePath) {
                let userPositions <- FlowWager.createUserPositions()
                signer.storage.save(<-userPositions, to: FlowWager.UserPositionsStoragePath)
                signer.capabilities.publish(
                    signer.capabilities.storage.issue<&{FlowWager.UserPositionsPublic}>(FlowWager.UserPositionsStoragePath),
                    at: FlowWager.UserPositionsPublicPath
                )
            }

            // Get UserPositions capability from storage path
            let storageCap = signer.capabilities.storage.issue<&FlowWager.UserPositions>(FlowWager.UserPositionsStoragePath)
            self.userPositionsCap = storageCap
            
            // Verify UserPositions exists and check position limit
            let userPositionsRef = signer.storage.borrow<&FlowWager.UserPositions>(
                from: FlowWager.UserPositionsStoragePath
            ) ?? panic("User positions resource not found for account")
            
            if !userPositionsRef.positions.containsKey(marketId) {
                assert(
                    UInt64(userPositionsRef.positions.length) < FlowWager.maxPositionsPerUser,
                    message: "User has reached the maximum number of distinct market positions"
                )
            }
        }

        execute {
            // Create new position
            let newPosition = FlowWager.UserPosition(
                marketId: marketId,
                optionAShares: option == FlowWager.MarketOutcome.OptionA.rawValue ? betAmount : 0.0,
                optionBShares: option == FlowWager.MarketOutcome.OptionB.rawValue ? betAmount : 0.0,
                totalInvested: betAmount,
                claimed: false
            )

            // Call placeBet with capability and position
            FlowWager.placeBet(
                userAddress: self.signerAddress,
                marketId: marketId,
                option: option,
                betVault: <-self.betVault,
                userPositionsCap: self.userPositionsCap,
                newPosition: newPosition
            )

            log("Bet placed successfully on market ".concat(marketId.toString()))
            log("Bet amount: ".concat(betAmount.toString()).concat(" FLOW"))
            log("Option selected: ".concat(option.toString()))
        }
    }
  `,

  resolveMarket: `
    import FlowWager from ${getFlowWagerAddress()}

    transaction(marketId: UInt64, outcome: UInt8, justification: String) {
        prepare(signer: auth(Storage, Capabilities) &Account) {
            FlowWager.resolveMarket(
                marketId: marketId,
                outcome: outcome,
                justification: justification
            )
        }

        execute {
            log("Market resolved successfully!")
            log("Market ID: ".concat(marketId.toString()))
            log("Outcome: ".concat(outcome.toString()))
            log("Justification: ".concat(justification))
        }
    }
  `,

  claimWinnings: `
    import FlowWager from ${getFlowWagerAddress()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    transaction(marketId: UInt64) {
        prepare(signer: auth(Storage, Capabilities) &Account) {
            let vault <- FlowWager.claimWinnings(
                marketId: marketId,
                claimerAddress: signer.address
            )
            
            let vaultRef = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                ?? panic("Could not borrow reference to FlowToken Vault")
            
            vaultRef.deposit(from: <-vault)
        }

        execute {
            log("Winnings claimed successfully")
        }
    }
  `,

  submitResolutionEvidence: `
    import FlowWager from ${getFlowWagerAddress()}

    transaction(marketId: UInt64, evidence: String, requestedOutcome: UInt8) {
        prepare(signer: auth(Storage, Capabilities) &Account) {
            FlowWager.submitResolutionEvidence(
                address: signer.address,
                marketId: marketId,
                evidence: evidence,
                requestedOutcome: requestedOutcome
            )
        }

        execute {
            log("Evidence submitted successfully")
        }
    }
  `,

  withdrawPlatformFees: `
    import FlowWager from ${getFlowWagerAddress()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    transaction(amount: UFix64) {
        prepare(signer: auth(Storage, Capabilities) &Account) {
            let admin = signer.storage.borrow<&FlowWager.Admin>(from: FlowWager.AdminStoragePath)
                ?? panic("Could not borrow Admin resource")
            let vaultRef = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                ?? panic("Could not borrow reference to FlowToken Vault")
            
            let fees <- admin.withdrawPlatformFees(amount: amount)
            vaultRef.deposit(from: <-fees)
        }

        execute {
            log("Platform fees withdrawn successfully")
        }
    }
  `,

  withdrawAllPlatformFees: `
    import FlowWager from ${getFlowWagerAddress()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    transaction {
        prepare(signer: auth(Storage, Capabilities) &Account) {
            let admin = signer.storage.borrow<&FlowWager.Admin>(from: FlowWager.AdminStoragePath)
                ?? panic("Could not borrow Admin resource")
            let vaultRef = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                ?? panic("Could not borrow reference to FlowToken Vault")
            
            let fees <- admin.withdrawAllPlatformFees()
            vaultRef.deposit(from: <-fees)
        }

        execute {
            log("All platform fees withdrawn successfully")
        }
    }
  `,
};

export class FlowWagerScripts {
  private static cache: Map<string, string> = new Map();

  static async getScript(scriptName: string): Promise<string> {
    if (this.cache.has(scriptName)) {
      return this.cache.get(scriptName)!;
    }

    if (scriptName in CADENCE_SCRIPTS) {
      const script =
        CADENCE_SCRIPTS[scriptName as keyof typeof CADENCE_SCRIPTS];
      this.cache.set(scriptName, script);
      return script;
    }

    throw new Error(`Flow Wager script not found: ${scriptName}`);
  }

  static async getTransaction(transactionName: string): Promise<string> {
    return this.getScript(transactionName);
  }

  static async getQuery(queryName: string): Promise<string> {
    return this.getScript(queryName);
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

export const getScript = FlowWagerScripts.getScript.bind(FlowWagerScripts);
export const getTransaction =
  FlowWagerScripts.getTransaction.bind(FlowWagerScripts);
export const getQuery = FlowWagerScripts.getQuery.bind(FlowWagerScripts);

export const getActiveMarkets = () =>
  FlowWagerScripts.getScript("getActiveMarkets");
export const getAllMarkets = () => FlowWagerScripts.getScript("getAllMarkets");
export const getMarketById = () => FlowWagerScripts.getScript("getMarketById");
export const getMarketCreator = () =>
  FlowWagerScripts.getScript("getMarketByCreator");
export const getPlatformStats = () =>
  FlowWagerScripts.getScript("getPlatformStats");
export const getUserFlowBalance = () =>
  FlowWagerScripts.getScript("getUserFlowBalance");
export const getUserProfile = () =>
  FlowWagerScripts.getScript("getUserProfile");
export const getPendingMarkets = () =>
  FlowWagerScripts.getScript("getPendingMarkets");
export const getPendingMarketsWithEvidence = () =>
  FlowWagerScripts.getScript("getPendingMarketsWithEvidence");
export const getUserPositions = () =>
  FlowWagerScripts.getScript("getUserPositions");
export const getUserDashboardData = () =>
  FlowWagerScripts.getScript("getUserDashboardData");
export const getActiveUserPositions = () =>
  FlowWagerScripts.getScript("activeUserPositions");
export const getClaimableWinnings = () =>
  FlowWagerScripts.getScript("getClaimableWinnings");
export const checkUserRegistered = () =>
  FlowWagerScripts.getScript("checkUserRegistered");
export const getUserTrades = ()=> FlowWagerScripts.getScript("getUserTrades")
// export const checkUsernameAvailability = () =>
//   FlowWagerScripts.getScript("checkUsernameAvailability");

export const createUserAccountTransaction = () =>
  FlowWagerScripts.getTransaction("createUserAccount");
export const createMarketTransaction = () =>
  FlowWagerScripts.getTransaction("createMarket");
export const placeBetTransaction = () =>
  FlowWagerScripts.getTransaction("placeBet");
export const resolveMarketTransaction = () =>
  FlowWagerScripts.getTransaction("resolveMarket");
export const claimWinningsTransaction = () =>
  FlowWagerScripts.getTransaction("claimWinnings");
export const submitResolutionEvidenceTransaction = () =>
  FlowWagerScripts.getTransaction("submitResolutionEvidence");
export const withdrawPlatformFeesTransaction = () =>
  FlowWagerScripts.getTransaction("withdrawPlatformFees");
export const withdrawAllPlatformFeesTransaction = () =>
  FlowWagerScripts.getTransaction("withdrawAllPlatformFees");

export type ScriptName = keyof typeof CADENCE_SCRIPTS;

export type TransactionName =
  | "createUserAccount"
  | "createMarket"
  | "placeBet"
  | "resolveMarket"
  | "claimWinnings"
  | "submitResolutionEvidence"
  | "withdrawPlatformFees"
  | "withdrawAllPlatformFees"
  | "checkUserRegistered"
  | "checkUsernameAvailability";

export type QueryName =
  | "getActiveMarkets"
  | "getAllMarkets"
  | "getMarketById"
  | "getMarketCreator"
  | "getPlatformStats"
  | "getUserFlowBalance"
  | "getUserProfile"
  | "getPendingMarkets"
  | "getPendingMarketsWithEvidence"
  | "getUserPositions"
  | "getUserDashboardData"
  | "activeUserPositions"
  | "getClaimableWinnings"
  | "checkUserRegistered"
  | "checkUsernameAvailability"
  | "getUserTrades"
