export const getFlowUpdateAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOWUPDATE_ADDRESS || "0x24225e374dfffb2b"
    : process.env.NEXT_PUBLIC_FLOWUPDATE_ADDRESS || "0x24225e374dfffb2b";
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
    ? process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_MAINNET_TOKEN || "0xf233dcee88fe0abe"
    : process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_TESTNET_TOKEN || "0x9a0766d93b6608b7";
};

// Dynamic script generation function
const generateScripts = () => ({
  getActiveMultiOptionMarkets: `
    import FlowUpdate from ${getFlowUpdateAddress()}

    access(all) fun main(): [FlowUpdate.MultiOptionMarket] {
        let activeMarketsDict = FlowUpdate.getActiveMarkets()
        var markets: [FlowUpdate.MultiOptionMarket] = []
        
        for marketId in activeMarketsDict.keys {
            markets.append(activeMarketsDict[marketId]!)
        }
        
        return markets
    }
  `,

  getMultiOptionMarket: `
    import FlowUpdate from ${getFlowUpdateAddress()}

    access(all) fun main(marketId: UInt64): FlowUpdate.MultiOptionMarket? {
        return FlowUpdate.getMarket(marketId: marketId)
    }
  `,

  getUserMultiOptionPositions: `
    import FlowUpdate from ${getFlowUpdateAddress()}

    access(all) struct UserMultiOptionPosition {
        access(all) let marketId: UInt64
        access(all) let marketTitle: String
        access(all) let marketDescription: String
        access(all) let options: [String]
        access(all) let optionShares: [UFix64]
        access(all) let totalInvested: UFix64
        access(all) let claimed: Bool
        access(all) let endTime: UFix64
        access(all) let status: UInt8
        access(all) let resolved: Bool
        access(all) let winningOption: UInt8?

        init(
            marketId: UInt64,
            marketTitle: String,
            marketDescription: String,
            options: [String],
            optionShares: [UFix64],
            totalInvested: UFix64,
            claimed: Bool,
            endTime: UFix64,
            status: UInt8,
            resolved: Bool,
            winningOption: UInt8?
        ) {
            self.marketId = marketId
            self.marketTitle = marketTitle
            self.marketDescription = marketDescription
            self.options = options
            self.optionShares = optionShares
            self.totalInvested = totalInvested
            self.claimed = claimed
            self.endTime = endTime
            self.status = status
            self.resolved = resolved
            self.winningOption = winningOption
        }
    }

    access(all) fun main(userAddress: Address): [UserMultiOptionPosition] {
        let account = getAccount(userAddress)
        var positions: [UserMultiOptionPosition] = []
        
        if let positionsRef = account.capabilities.get<&FlowUpdate.MultiOptionPositions>(
            FlowUpdate.MultiOptionPositionsPublicPath
        ).borrow() {
            let allPositions = positionsRef.getAllPositions()
            
            for marketId in allPositions.keys {
                let position = allPositions[marketId]!
                
                if let market = FlowUpdate.getMarket(marketId: marketId) {
                    positions.append(UserMultiOptionPosition(
                        marketId: marketId,
                        marketTitle: market.title,
                        marketDescription: market.description,
                        options: market.options,
                        optionShares: position.optionShares,
                        totalInvested: position.totalInvested,
                        claimed: position.claimed,
                        endTime: market.endTime,
                        status: market.status.rawValue,
                        resolved: market.resolved,
                        winningOption: market.winningOption
                    ))
                }
            }
        }
        
        return positions
    }
  `,

  getActiveMultiOptionPositions: `
    import FlowUpdate from ${getFlowUpdateAddress()}

    access(all) struct ActiveMultiOptionPosition {
        access(all) let marketId: UInt64
        access(all) let marketTitle: String
        access(all) let options: [String]
        access(all) let optionShares: [UFix64]
        access(all) let totalInvested: UFix64
        access(all) let endTime: UFix64

        init(
            marketId: UInt64,
            marketTitle: String,
            options: [String],
            optionShares: [UFix64],
            totalInvested: UFix64,
            endTime: UFix64
        ) {
            self.marketId = marketId
            self.marketTitle = marketTitle
            self.options = options
            self.optionShares = optionShares
            self.totalInvested = totalInvested
            self.endTime = endTime
        }
    }

    access(all) fun main(userAddress: Address): [ActiveMultiOptionPosition] {
        let account = getAccount(userAddress)
        var activePositions: [ActiveMultiOptionPosition] = []
        
        if let positionsRef = account.capabilities.get<&FlowUpdate.MultiOptionPositions>(
            FlowUpdate.MultiOptionPositionsPublicPath
        ).borrow() {
            let allPositions = positionsRef.getAllPositions()
            
            for marketId in allPositions.keys {
                let position = allPositions[marketId]!
                
                if let market = FlowUpdate.getMarket(marketId: marketId) {
                    if market.status == FlowUpdate.MultiMarketStatus.Active && !market.resolved {
                        activePositions.append(ActiveMultiOptionPosition(
                            marketId: marketId,
                            marketTitle: market.title,
                            options: market.options,
                            optionShares: position.optionShares,
                            totalInvested: position.totalInvested,
                            endTime: market.endTime
                        ))
                    }
                }
            }
        }
        
        return activePositions
    }
  `,

  getClaimableMultiOptionWinnings: `
    import FlowUpdate from ${getFlowUpdateAddress()}

    access(all) struct ClaimableMultiOptionWinnings {
        access(all) let marketId: UInt64
        access(all) let marketTitle: String
        access(all) let amount: UFix64
        access(all) let winningOption: UInt8
        access(all) let userWinningShares: UFix64

        init(
            marketId: UInt64,
            marketTitle: String,
            amount: UFix64,
            winningOption: UInt8,
            userWinningShares: UFix64
        ) {
            self.marketId = marketId
            self.marketTitle = marketTitle
            self.amount = amount
            self.winningOption = winningOption
            self.userWinningShares = userWinningShares
        }
    }

    access(all) fun main(userAddress: Address): [ClaimableMultiOptionWinnings] {
        let account = getAccount(userAddress)
        var claimableWinnings: [ClaimableMultiOptionWinnings] = []
        
        if let positionsRef = account.capabilities.get<&FlowUpdate.MultiOptionPositions>(
            FlowUpdate.MultiOptionPositionsPublicPath
        ).borrow() {
            let allPositions = positionsRef.getAllPositions()
            
            for marketId in allPositions.keys {
                let position = allPositions[marketId]!
                
                if position.claimed {
                    continue
                }
                
                if let market = FlowUpdate.getMarket(marketId: marketId) {
                    if market.resolved && market.winningOption != nil {
                        let winningOption = market.winningOption!
                        let userWinningShares = position.optionShares[Int(winningOption)]
                        
                        if userWinningShares > 0.0 {
                            let winnings = FlowUpdate.calculatePotentialWinnings(
                                marketId: marketId,
                                position: position,
                                winningOption: winningOption
                            )
                            
                            claimableWinnings.append(ClaimableMultiOptionWinnings(
                                marketId: marketId,
                                marketTitle: market.title,
                                amount: winnings,
                                winningOption: winningOption,
                                userWinningShares: userWinningShares
                            ))
                        }
                    }
                }
            }
        }
        
        return claimableWinnings
    }
  `,

  getMultiOptionContractStats: `
    import FlowUpdate from ${getFlowUpdateAddress()}

    access(all) fun main(): {String: AnyStruct} {
        return FlowUpdate.getContractStats()
    }
  `,

  getMultiOptionMarketsByCreator: `
    import FlowUpdate from ${getFlowUpdateAddress()}

    access(all) struct CreatorMarketInfo {
        access(all) let marketId: UInt64
        access(all) let title: String
        access(all) let optionCount: UInt8
        access(all) let status: UInt8
        access(all) let resolved: Bool
        access(all) let endTime: UFix64
        access(all) let totalPool: UFix64
        access(all) let winningOption: UInt8?

        init(
            marketId: UInt64,
            title: String,
            optionCount: UInt8,
            status: UInt8,
            resolved: Bool,
            endTime: UFix64,
            totalPool: UFix64,
            winningOption: UInt8?
        ) {
            self.marketId = marketId
            self.title = title
            self.optionCount = optionCount
            self.status = status
            self.resolved = resolved
            self.endTime = endTime
            self.totalPool = totalPool
            self.winningOption = winningOption
        }
    }

    access(all) fun main(creatorAddress: Address): [CreatorMarketInfo] {
        let allMarketsDict = FlowUpdate.getActiveMarkets()
        var creatorMarkets: [CreatorMarketInfo] = []
        
        for marketId in allMarketsDict.keys {
            let market = allMarketsDict[marketId]!
            
            if market.creator == creatorAddress {
                creatorMarkets.append(CreatorMarketInfo(
                    marketId: marketId,
                    title: market.title,
                    optionCount: market.maxOptions,
                    status: market.status.rawValue,
                    resolved: market.resolved,
                    endTime: market.endTime,
                    totalPool: market.totalPool,
                    winningOption: market.winningOption
                ))
            }
        }
        
        return creatorMarkets
    }
  `,

  calculateMultiOptionWinnings: `
    import FlowUpdate from ${getFlowUpdateAddress()}

    access(all) fun main(
        userAddress: Address,
        marketId: UInt64,
        winningOption: UInt8
    ): UFix64 {
        let account = getAccount(userAddress)
        
        if let positionsRef = account.capabilities.get<&FlowUpdate.MultiOptionPositions>(
            FlowUpdate.MultiOptionPositionsPublicPath
        ).borrow() {
            if let position = positionsRef.getPosition(marketId: marketId) {
                return FlowUpdate.calculatePotentialWinnings(
                    marketId: marketId,
                    position: position,
                    winningOption: winningOption
                )
            }
        }
        
        return 0.0
    }
  `,

  getPendingMultiOptionMarkets: `
    import FlowUpdate from ${getFlowUpdateAddress()}

    access(all) struct PendingMultiOptionMarket {
        access(all) let marketId: UInt64
        access(all) let title: String
        access(all) let description: String
        access(all) let options: [String]
        access(all) let creator: Address
        access(all) let endTime: UFix64
        access(all) let totalPool: UFix64
        access(all) let totalShares: [UFix64]
        access(all) let daysSinceEnded: UFix64

        init(
            marketId: UInt64,
            title: String,
            description: String,
            options: [String],
            creator: Address,
            endTime: UFix64,
            totalPool: UFix64,
            totalShares: [UFix64],
            daysSinceEnded: UFix64
        ) {
            self.marketId = marketId
            self.title = title
            self.description = description
            self.options = options
            self.creator = creator
            self.endTime = endTime
            self.totalPool = totalPool
            self.totalShares = totalShares
            self.daysSinceEnded = daysSinceEnded
        }
    }

    access(all) fun main(): [PendingMultiOptionMarket] {
        let allMarketsDict = FlowUpdate.getActiveMarkets()
        var pendingMarkets: [PendingMultiOptionMarket] = []
        let currentTime = getCurrentBlock().timestamp
        
        for marketId in allMarketsDict.keys {
            let market = allMarketsDict[marketId]!
            
            if currentTime > market.endTime && !market.resolved {
                let secondsSinceEnded = currentTime - market.endTime
                let daysSinceEnded = secondsSinceEnded / 86400.0
                
                pendingMarkets.append(PendingMultiOptionMarket(
                    marketId: marketId,
                    title: market.title,
                    description: market.description,
                    options: market.options,
                    creator: market.creator,
                    endTime: market.endTime,
                    totalPool: market.totalPool,
                    totalShares: market.totalShares,
                    daysSinceEnded: daysSinceEnded
                ))
            }
        }
        
        return pendingMarkets
    }
  `,

  hasUserMultiOptionPositions: `
    import FlowUpdate from ${getFlowUpdateAddress()}

    access(all) fun main(userAddress: Address): Bool {
        let account = getAccount(userAddress)
        
        if let positionsRef = account.capabilities.get<&FlowUpdate.MultiOptionPositions>(
            FlowUpdate.MultiOptionPositionsPublicPath
        ).borrow() {
            return positionsRef.getAllPositions().length > 0
        }
        
        return false
    }
  `,

  createMultiOptionMarket: `
    import FlowUpdate from ${getFlowUpdateAddress()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    transaction(
        title: String,
        description: String,
        categoryRaw: UInt8,
        options: [String],
        endTime: UFix64,
        minBet: UFix64,
        maxBet: UFix64,
        imageUrl: String,
        creationFeeAmount: UFix64
    ) {
        let flowVault: @FlowToken.Vault?
        let category: FlowUpdate.MultiMarketCategory
        let signerAddress: Address

        prepare(signer: auth(BorrowValue, Storage) &Account) {
            self.category = FlowUpdate.MultiMarketCategory(rawValue: categoryRaw)!
            self.signerAddress = signer.address

            if creationFeeAmount > 0.0 {
                let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                    from: /storage/flowTokenVault
                ) ?? panic("Could not borrow FlowToken vault")

                self.flowVault <- vault.withdraw(amount: creationFeeAmount) as! @FlowToken.Vault
            } else {
                self.flowVault <- nil
            }
        }

        execute {
            let marketId = FlowUpdate.createMultiOptionMarket(
                title: title,
                description: description,
                category: self.category,
                options: options,
                endTime: endTime,
                minBet: minBet,
                maxBet: maxBet,
                imageUrl: imageUrl,
                creator: self.signerAddress,
                creationFeeVault: <-self.flowVault
            )

            log("Multi-option market created with ID: ".concat(marketId.toString()))
        }
    }
  `,

  placeMultiOptionBet: `
    import FlowUpdate from ${getFlowUpdateAddress()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    transaction(marketId: UInt64, optionIndex: UInt8, betAmount: UFix64) {
        let betVault: @FlowToken.Vault
        let signerAddress: Address

        prepare(signer: auth(BorrowValue, Storage, SaveValue, PublishCapability) &Account) {
            self.signerAddress = signer.address

            let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow FlowToken vault")

            self.betVault <- vault.withdraw(amount: betAmount) as! @FlowToken.Vault

            if !signer.storage.check<@FlowUpdate.MultiOptionPositions>(
                from: FlowUpdate.MultiOptionPositionsStoragePath
            ) {
                let userPositions <- FlowUpdate.createMultiOptionPositions()
                signer.storage.save(<-userPositions, to: FlowUpdate.MultiOptionPositionsStoragePath)

                let positionsCap = signer.capabilities.storage.issue<&FlowUpdate.MultiOptionPositions>(
                    FlowUpdate.MultiOptionPositionsStoragePath
                )
                signer.capabilities.publish(positionsCap, at: FlowUpdate.MultiOptionPositionsPublicPath)
            }
        }

        execute {
            let userPositionsRef = signer.storage.borrow<&FlowUpdate.MultiOptionPositions>(
                from: FlowUpdate.MultiOptionPositionsStoragePath
            ) ?? panic("User positions resource not found")

            FlowUpdate.placeBet(
                marketId: marketId,
                optionIndex: optionIndex,
                betVault: <-self.betVault,
                userPositions: userPositionsRef,
                user: self.signerAddress
            )

            log("Bet placed successfully")
        }
    }
  `,

  placeBatchMultiOptionBets: `
    import FlowUpdate from ${getFlowUpdateAddress()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    transaction(
        marketId: UInt64,
        optionIndices: [UInt8],
        betAmounts: [UFix64]
    ) {
        let betVaults: @[FlowToken.Vault] <- []
        let signerAddress: Address
        let bets: [FlowUpdate.BatchBet] = []

        prepare(signer: auth(BorrowValue, Storage, SaveValue, PublishCapability) &Account) {
            self.signerAddress = signer.address

            let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow FlowToken vault")

            var i = 0
            while i < optionIndices.length {
                self.betVaults.append(<- vault.withdraw(amount: betAmounts[i]) as! @FlowToken.Vault)
                self.bets.append(FlowUpdate.BatchBet(
                    optionIndex: optionIndices[i],
                    amount: betAmounts[i]
                ))
                i = i + 1
            }

            if !signer.storage.check<@FlowUpdate.MultiOptionPositions>(
                from: FlowUpdate.MultiOptionPositionsStoragePath
            ) {
                let userPositions <- FlowUpdate.createMultiOptionPositions()
                signer.storage.save(<-userPositions, to: FlowUpdate.MultiOptionPositionsStoragePath)

                let positionsCap = signer.capabilities.storage.issue<&FlowUpdate.MultiOptionPositions>(
                    FlowUpdate.MultiOptionPositionsStoragePath
                )
                signer.capabilities.publish(positionsCap, at: FlowUpdate.MultiOptionPositionsPublicPath)
            }
        }

        execute {
            let userPositionsRef = signer.storage.borrow<&FlowUpdate.MultiOptionPositions>(
                from: FlowUpdate.MultiOptionPositionsStoragePath
            ) ?? panic("User positions resource not found")

            FlowUpdate.placeBatchBets(
                marketId: marketId,
                bets: self.bets,
                betVaults: <-self.betVaults,
                userPositions: userPositionsRef,
                user: self.signerAddress
            )

            log("Batch bets placed successfully")
        }
    }
  `,

  resolveMultiOptionMarket: `
    import FlowUpdate from ${getFlowUpdateAddress()}

    transaction(marketId: UInt64, winningOption: UInt8) {
        prepare(signer: auth(Storage) &Account) {
            let admin = signer.storage.borrow<&FlowUpdate.Admin>(
                from: FlowUpdate.AdminStoragePath
            ) ?? panic("Could not borrow Admin resource")

            admin.resolveMarket(
                marketId: marketId,
                winningOption: winningOption,
                justification: "Market resolved"
            )
        }

        execute {
            log("Market resolved successfully")
        }
    }
  `,

  claimMultiOptionWinnings: `
    import FlowUpdate from ${getFlowUpdateAddress()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    transaction(marketId: UInt64) {
        let userPositionsRef: &FlowUpdate.MultiOptionPositions
        let flowReceiver: &{FungibleToken.Receiver}

        prepare(signer: auth(Storage) &Account) {
            self.userPositionsRef = signer.storage.borrow<&FlowUpdate.MultiOptionPositions>(
                from: FlowUpdate.MultiOptionPositionsStoragePath
            ) ?? panic("User positions resource not found")

            self.flowReceiver = signer.capabilities.get<&{FungibleToken.Receiver}>(
                /public/flowTokenReceiver
            ).borrow() ?? panic("Could not borrow Flow token receiver")
        }

        execute {
            let winningsVault <- FlowUpdate.claimWinnings(
                marketId: marketId,
                userPositions: self.userPositionsRef,
                recipientVault: self.flowReceiver
            )

            self.flowReceiver.deposit(from: <-winningsVault)

            log("Winnings claimed successfully")
        }
    }
  `,
});

export class FlowUpdateScripts {
  // Version number to force cache invalidation
  private static readonly VERSION = "1.0.2";
  private static cache: Map<string, string> = new Map();

  static async getScript(scriptName: string): Promise<string> {
    // Generate fresh scripts every time - no caching
    const scripts = generateScripts();
    
    if (scriptName in scripts) {
      const script = scripts[scriptName as keyof ReturnType<typeof generateScripts>];
      // Ensure the script is not cached by the browser either
      return script.trim();
    }

    throw new Error(`FlowUpdate script not found: ${scriptName}`);
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

  static getVersion(): string {
    return this.VERSION;
  }
}

export const getFlowUpdateScript = FlowUpdateScripts.getScript.bind(FlowUpdateScripts);
export const getFlowUpdateTransaction = FlowUpdateScripts.getTransaction.bind(FlowUpdateScripts);
export const getFlowUpdateQuery = FlowUpdateScripts.getQuery.bind(FlowUpdateScripts);

// Query Script Exports
export const getActiveMultiOptionMarkets = () =>
  FlowUpdateScripts.getScript("getActiveMultiOptionMarkets");

export const getMultiOptionMarket = () =>
  FlowUpdateScripts.getScript("getMultiOptionMarket");

export const getUserMultiOptionPositions = () =>
  FlowUpdateScripts.getScript("getUserMultiOptionPositions");

export const getActiveMultiOptionPositions = () =>
  FlowUpdateScripts.getScript("getActiveMultiOptionPositions");

export const getClaimableMultiOptionWinnings = () =>
  FlowUpdateScripts.getScript("getClaimableMultiOptionWinnings");

export const getMultiOptionContractStats = () =>
  FlowUpdateScripts.getScript("getMultiOptionContractStats");

export const getMultiOptionMarketsByCreator = () =>
  FlowUpdateScripts.getScript("getMultiOptionMarketsByCreator");

export const calculateMultiOptionWinnings = () =>
  FlowUpdateScripts.getScript("calculateMultiOptionWinnings");

export const getPendingMultiOptionMarkets = () =>
  FlowUpdateScripts.getScript("getPendingMultiOptionMarkets");

export const hasUserMultiOptionPositions = () =>
  FlowUpdateScripts.getScript("hasUserMultiOptionPositions");

// Transaction Exports
export const createMultiOptionMarketTransaction = () =>
  FlowUpdateScripts.getTransaction("createMultiOptionMarket");

export const placeMultiOptionBetTransaction = () =>
  FlowUpdateScripts.getTransaction("placeMultiOptionBet");

export const placeBatchMultiOptionBetsTransaction = () =>
  FlowUpdateScripts.getTransaction("placeBatchMultiOptionBets");

export const resolveMultiOptionMarketTransaction = () =>
  FlowUpdateScripts.getTransaction("resolveMultiOptionMarket");

export const claimMultiOptionWinningsTransaction = () =>
  FlowUpdateScripts.getTransaction("claimMultiOptionWinnings");

// Type Definitions
export type FlowUpdateScriptName = keyof ReturnType<typeof generateScripts>;

export type FlowUpdateTransactionName =
  | "createMultiOptionMarket"
  | "placeMultiOptionBet"
  | "placeBatchMultiOptionBets"
  | "resolveMultiOptionMarket"
  | "claimMultiOptionWinnings";

export type FlowUpdateQueryName =
  | "getActiveMultiOptionMarkets"
  | "getMultiOptionMarket"
  | "getUserMultiOptionPositions"
  | "getActiveMultiOptionPositions"
  | "getClaimableMultiOptionWinnings"
  | "getMultiOptionContractStats"
  | "getMultiOptionMarketsByCreator"
  | "calculateMultiOptionWinnings"
  | "getPendingMultiOptionMarkets"
  | "hasUserMultiOptionPositions";