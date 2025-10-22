import {
  getFlowTokenAddress,
  getFlowUpdateAddress,
  getFungibleTokenAddress,
} from "@/lib/flow-wager-scripts";

// ============================================
// TRANSACTION SCRIPTS
// ============================================

/**
 * Create a multi-option market on FlowUpdate
 */
export const createMultiOptionMarketTransaction = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}
  import FlowToken from ${getFlowTokenAddress()}
  import FungibleToken from ${getFungibleTokenAddress()}

  transaction(
      title: String,
      description: String,
      category: UInt8,
      options: [String],
      endTime: UFix64,
      minBet: UFix64,
      maxBet: UFix64,
      imageUrl: String,
      creationFeeAmount: UFix64?
  ) {
      let creatorVaultRef: auth(FungibleToken.Withdraw) &FlowToken.Vault
      let signerAddress: Address

      prepare(signer: auth(Storage, Capabilities) &Account) {
          self.signerAddress = signer.address
          self.creatorVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
              ?? panic("Could not borrow reference to the owner's Vault!")
      }

      execute {
          var creationFeeVault: @FlowToken.Vault? <- nil
          if let feeAmount = creationFeeAmount {
              if feeAmount > 0.0 {
                  creationFeeVault <-! self.creatorVaultRef.withdraw(amount: feeAmount) as! @FlowToken.Vault
              }
          }

          let marketCategory = FlowUpdate.MultiMarketCategory(rawValue: category)
              ?? panic("Invalid market category")

          let marketId = FlowUpdate.createMultiOptionMarket(
              title: title,
              description: description,
              category: marketCategory,
              options: options,
              endTime: endTime,
              minBet: minBet,
              maxBet: maxBet,
              imageUrl: imageUrl,
              creator: self.signerAddress,
              creationFeeVault: <-creationFeeVault
          )

          log("Multi-option market created with ID: ".concat(marketId.toString()))
          log("Market title: ".concat(title))
          log("Number of options: ".concat(options.length.toString()))
      }
  }
`;

/**
 * Place a single bet on a market option
 */
export const placeBetTransaction = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}
  import FlowToken from ${getFlowTokenAddress()}
  import FungibleToken from ${getFungibleTokenAddress()}

  transaction(
      marketId: UInt64,
      optionIndex: UInt8,
      amount: UFix64
  ) {
      let betterVaultRef: auth(FungibleToken.Withdraw) &FlowToken.Vault
      let betterAddress: Address

      prepare(signer: auth(Storage, Capabilities) &Account) {
          self.betterAddress = signer.address
          self.betterVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
              ?? panic("Could not borrow reference to the signer's Vault!")
      }

      execute {
          let betVault <- self.betterVaultRef.withdraw(amount: amount) as! @FlowToken.Vault

          FlowUpdate.placeBet(
              marketId: marketId,
              optionIndex: optionIndex,
              betVault: <-betVault,
              betterAddress: self.betterAddress
          )

          log("Bet placed on market ".concat(marketId.toString()))
          log("Option index: ".concat(optionIndex.toString()))
          log("Amount: ".concat(amount.toString()))
      }
  }
`;

/**
 * Place multiple bets in a single transaction
 */
export const placeBatchBetsTransaction = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}
  import FlowToken from ${getFlowTokenAddress()}
  import FungibleToken from ${getFungibleTokenAddress()}

  transaction(
      bets: [{marketId: UInt64, optionIndex: UInt8, amount: UFix64}]
  ) {
      let betterVaultRef: auth(FungibleToken.Withdraw) &FlowToken.Vault
      let betterAddress: Address
      let totalAmount: UFix64

      prepare(signer: auth(Storage, Capabilities) &Account) {
          self.betterAddress = signer.address
          self.betterVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
              ?? panic("Could not borrow reference to the signer's Vault!")

          var total: UFix64 = 0.0
          for bet in bets {
              total = total + bet.amount
          }
          self.totalAmount = total
      }

      execute {
          let totalVault <- self.betterVaultRef.withdraw(amount: self.totalAmount) as! @FlowToken.Vault

          for bet in bets {
              let betVault <- totalVault.withdraw(amount: bet.amount) as! @FlowToken.Vault

              FlowUpdate.placeBet(
                  marketId: bet.marketId,
                  optionIndex: bet.optionIndex,
                  betVault: <-betVault,
                  betterAddress: self.betterAddress
              )

              log("Batch bet placed on market ".concat(bet.marketId.toString()))
          }

          destroy totalVault
          log("All batch bets processed. Total amount: ".concat(self.totalAmount.toString()))
      }
  }
`;

/**
 * Resolve a market by selecting the winning option
 */
export const resolveMarketTransaction = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  transaction(
      marketId: UInt64,
      winningOptionIndex: UInt8
  ) {
      prepare(signer: auth(BorrowValue) &Account) {
          // Verify signer is market creator or admin
      }

      execute {
          FlowUpdate.resolveMarket(
              marketId: marketId,
              winningOptionIndex: winningOptionIndex
          )

          log("Market ".concat(marketId.toString()).concat(" resolved"))
          log("Winning option index: ".concat(winningOptionIndex.toString()))
      }
  }
`;

/**
 * Claim winnings from a resolved market
 */
export const claimWinningsTransaction = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  transaction(
      marketId: UInt64
  ) {
      let receiverRef: &{FlowToken.Receiver}

      prepare(signer: auth(Storage, Capabilities) &Account) {
          self.receiverRef = signer.capabilities.get<&{FlowToken.Receiver}>(/public/flowTokenReceiver)
              .borrow()
              ?? panic("Could not borrow receiver reference")
      }

      execute {
          let winnings <- FlowUpdate.claimWinnings(marketId: marketId)

          self.receiverRef.deposit(from: <-winnings)

          log("Winnings claimed for market ".concat(marketId.toString()))
      }
  }
`;

/**
 * Submit resolution evidence for a market
 */
export const submitResolutionEvidenceTransaction = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  transaction(
      marketId: UInt64,
      evidence: String
  ) {
      prepare(signer: auth(BorrowValue) &Account) {
      }

      execute {
          FlowUpdate.submitResolutionEvidence(
              marketId: marketId,
              evidence: evidence
          )

          log("Evidence submitted for market ".concat(marketId.toString()))
      }
  }
`;

// ============================================
// QUERY SCRIPTS
// ============================================

/**
 * Get a specific market by ID
 */
export const getMarketQuery = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  access(all) fun main(marketId: UInt64): FlowUpdate.MultiOptionMarket? {
      return FlowUpdate.getMarket(marketId: marketId)
  }
`;

/**
 * Get all active markets - FIXED: Convert dictionary to array
 */
export const getActiveMarketsQuery = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  access(all) fun main(): [FlowUpdate.MultiOptionMarket] {
      let activeMarketsDict = FlowUpdate.getActiveMarkets()
      var markets: [FlowUpdate.MultiOptionMarket] = []

      for marketId in activeMarketsDict.keys {
          markets.append(activeMarketsDict[marketId]!)
      }

      return markets
  }
`;

/**
 * Get markets created by a specific address
 */
export const getMarketsByCreatorQuery = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  access(all) fun main(creator: Address): [FlowUpdate.MultiOptionMarket] {
      let allMarketsDict = FlowUpdate.getActiveMarkets()
      var creatorMarkets: [FlowUpdate.MultiOptionMarket] = []

      for marketId in allMarketsDict.keys {
          let market = allMarketsDict[marketId]!
          if market.creator == creator {
              creatorMarkets.append(market)
          }
      }

      return creatorMarkets
  }
`;

/**
 * Get user positions across all markets
 */
export const getUserPositionsQuery = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  access(all) fun main(userAddress: Address): {UInt64: FlowUpdate.UserPosition} {
      return FlowUpdate.getUserPositions(address: userAddress)
  }
`;

/**
 * Calculate potential winnings for a bet
 */
export const calculatePotentialWinningsQuery = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  access(all) fun main(
      marketId: UInt64,
      optionIndex: UInt8,
      shares: UFix64
  ): UFix64 {
      return FlowUpdate.calculatePotentialWinnings(
          marketId: marketId,
          optionIndex: optionIndex,
          shares: shares
      )
  }
`;

/**
 * Get claimable winnings for a user
 */
export const getClaimableWinningsQuery = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  access(all) fun main(userAddress: Address): [{marketId: UInt64, amount: UFix64}] {
      return FlowUpdate.getClaimableWinnings(address: userAddress)
  }
`;

/**
 * Get contract statistics - FIXED: Return {String: AnyStruct} not FlowUpdate.ContractStats
 */
export const getContractStatsQuery = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  access(all) fun main(): {String: AnyStruct} {
      return FlowUpdate.getContractStats()
  }
`;

/**
 * Get market resolution evidence
 */
export const getMarketEvidenceQuery = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  access(all) fun main(marketId: UInt64): [FlowUpdate.ResolutionEvidence]? {
      return FlowUpdate.getMarketEvidence(marketId: marketId)
  }
`;

/**
 * Check if market is resolved
 */
export const isMarketResolvedQuery = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  access(all) fun main(marketId: UInt64): Bool {
      if let market = FlowUpdate.getMarket(marketId: marketId) {
          return market.resolved
      }
      return false
  }
`;

/**
 * Get market pool information
 */
export const getMarketPoolQuery = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  access(all) struct PoolInfo {
      access(all) let totalPool: UFix64
      access(all) let optionPoolShares: [UFix64]
      access(all) let platformFeePercentage: UFix64

      init(totalPool: UFix64, optionPoolShares: [UFix64], platformFeePercentage: UFix64) {
          self.totalPool = totalPool
          self.optionPoolShares = optionPoolShares
          self.platformFeePercentage = platformFeePercentage
      }
  }

  access(all) fun main(marketId: UInt64): PoolInfo? {
      if let market = FlowUpdate.getMarket(marketId: marketId) {
          return PoolInfo(
              totalPool: market.totalPool,
              optionPoolShares: market.optionPoolShares,
              platformFeePercentage: market.platformFeePercentage
          )
      }
      return nil
  }
`;

export const getPlatformStats = () => `
  import FlowUpdate from ${getFlowUpdateAddress()}

  // Script to get FlowUpdate contract statistics
  access(all) fun main(): {String: AnyStruct} {
      return FlowUpdate.getContractStats()
  }

  `;

export const getAllMarketsQuery = () => `
   import FlowUpdate from ${getFlowUpdateAddress()}

  access(all) fun main(): [FlowUpdate.MultiOptionMarket] {

      // Fetch the contract-level statistics to determine the range of market IDs.
      let stats = FlowUpdate.getContractStats()
      let nextId = stats["nextMarketId"] as! UInt64? ?? panic("Could not read nextMarketId")

      // Initialize an array to store the market data.
      let allMarkets: [FlowUpdate.MultiOptionMarket] = []

      // Loop through all possible market IDs.
      // Market IDs start at 1. The loop continues up to the next available ID.
      var marketId: UInt64 = 1
      while marketId < nextId {
          // Attempt to fetch the market for the current ID.
          // We use an optional binding  to safely handle cases
          // where a market might not exist for a given ID, preventing panics.
          if let market = FlowUpdate.getMarket(marketId: marketId) {
              allMarkets.append(market)
          }
          marketId = marketId + 1
      }

      return allMarkets
  }
  `;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a script string by name (for dynamic loading)
 */
export const getScript = (scriptName: string): (() => string) | null => {
  const scripts: { [key: string]: () => string } = {
    getMarket: getMarketQuery,
    getActiveMarkets: getActiveMarketsQuery,
    getMarketsByCreator: getMarketsByCreatorQuery,
    getUserPositions: getUserPositionsQuery,
    calculatePotentialWinnings: calculatePotentialWinningsQuery,
    getClaimableWinnings: getClaimableWinningsQuery,
    getContractStats: getContractStatsQuery,
    getMarketEvidence: getMarketEvidenceQuery,
    isMarketResolved: isMarketResolvedQuery,
    getMarketPool: getMarketPoolQuery,
    getMarkets: getAllMarketsQuery,
  };

  return scripts[scriptName] || null;
};

/**
 * Get a transaction script by name (for dynamic loading)
 */
export const getTransaction = (
  transactionName: string,
): (() => string) | null => {
  const transactions: { [key: string]: () => string } = {
    createMultiOptionMarket: createMultiOptionMarketTransaction,
    placeBet: placeBetTransaction,
    placeBatchBets: placeBatchBetsTransaction,
    resolveMarket: resolveMarketTransaction,
    claimWinnings: claimWinningsTransaction,
    submitResolutionEvidence: submitResolutionEvidenceTransaction,
  };

  return transactions[transactionName] || null;
};
