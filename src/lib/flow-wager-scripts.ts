const getFlowWagerAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT || "0x512a5459cb3a2b20"
    : process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT ||
        "0x512a5459cb3a2b20";
};

const getFlowTokenAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOW_MAINNET_TOKEN || "0x1654653399040a61"
    : process.env.NEXT_PUBLIC_FLOW_TESTNET_TOKEN || "0x7e60df042a9c0868";
};

const getFungibleTokenAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_MAINNET_TOKEN ||
        "0xf233dcee88fe0abe"
    : process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_TESTNET_TOKEN ||
        "0x9a0766d93b6608b7";
};

const CADENCE_SCRIPTS = {
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

  getMarketCreator: `
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

    access(all) fun main(userAddress: Address): {UInt64: FlowWager.UserPosition} {
        return FlowWager.getUserPositions(address: userAddress)
    }
  `,

  getUserDashboardData: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) struct UserDashboard {
        access(all) let profile: {String: String}?
        access(all) let stats: FlowWager.UserStats?
        access(all) let positions: {UInt64: FlowWager.UserPosition}
        access(all) let claimableWinnings: [FlowWager.ClaimableWinnings]
        
        init(
            profile: {String: String}?,
            stats: FlowWager.UserStats?,
            positions: {UInt64: FlowWager.UserPosition},
            claimableWinnings: [FlowWager.ClaimableWinnings]
        ) {
            self.profile = profile
            self.stats = stats
            self.positions = positions
            self.claimableWinnings = claimableWinnings
        }
    }

    access(all) fun main(userAddress: Address): UserDashboard {
        let profileRef = FlowWager.getUserProfile(address: userAddress)
        let profile: {String: String}? = profileRef == nil ? nil : {
            "username": profileRef!.getUsername(),
            "displayName": profileRef!.getDisplayName(),
            "bio": profileRef!.bio,
            "profileImageUrl": profileRef!.profileImageUrl,
            "address": profileRef!.address.toString(),
            "joinedAt": profileRef!.joinedAt.toString()
        }
        let stats = FlowWager.getUserStats(address: userAddress)
        let positions = FlowWager.getUserPositions(address: userAddress)
        let claimableWinnings = FlowWager.getClaimableWinnings(address: userAddress)
        
        return UserDashboard(
            profile: profile,
            stats: stats,
            positions: positions,
            claimableWinnings: claimableWinnings
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

    transaction(marketId: UInt64, option: UInt8, amount: UFix64) {
        prepare(signer: auth(Storage, Capabilities) &Account) {
            let vaultRef = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                ?? panic("Could not borrow reference to FlowToken Vault")
            
            let betVault <- vaultRef.withdraw(amount: amount) as! @FlowToken.Vault
            
            FlowWager.placeBet(
               十五userAddress: signer.address,
                marketId: marketId,
                option: option,
                betVault: <-betVault
            )
        }

        execute {
            log("Bet placed successfully!")
            log("Market ID: ".concat(marketId.toString()))
            log("Option: ".concat(option.toString()).concat(" (0=Option A, 1=Option B)"))
            log("Amount: ".concat(amount.toString()).concat(" FLOW"))
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
  FlowWagerScripts.getScript("getMarketCreator");
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
  | "checkUsernameAvailability";
