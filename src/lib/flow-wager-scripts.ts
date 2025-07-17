// Auto-generated script imports using @flow-wager alias

// Get contract address from environment
const getFlowWagerAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT
    : process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT ||
        "0xfb16e84ea1882f67";
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

// Direct Cadence scripts with dynamic contract addresses
const CADENCE_SCRIPTS = {
  // Query scripts
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

  getContractInfo: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) fun main(): FlowWager.ContractInfo {
        return FlowWager.getContractInfo()
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
        ?? panic("Could not borrow Balance reference to the Vault")
    
    return vaultRef.balance
}
  `,

  getUserProfile: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) fun main(address: Address): FlowWager.UserProfile? {
        return FlowWager.getUserProfile(address: address)
    }
  `,

  testBetValidation: `
    import FlowWager from ${getFlowWagerAddress()}

    access(all) fun main(marketId: UInt64, option: UInt8, amount: UFix64): Bool {
        return FlowWager.validateBet(marketId: marketId, option: option, amount: amount)
    }
  `,

  // Transaction scripts
  placeBet: `
   import FlowWager from ${getFlowWagerAddress()}
import FlowToken from ${getFlowTokenAddress()}
import FungibleToken from ${getFungibleTokenAddress()}

transaction(marketId: UInt64, option: UInt8, amount: UFix64) {
    let flowVault: auth(FungibleToken.Withdraw) &FlowToken.Vault
    
    prepare(signer: auth(Storage) &Account) {
        self.flowVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault")
    }
    
    execute {
        let betVault <- self.flowVault.withdraw(amount: amount) as! @FlowToken.Vault
        
        FlowWager.placeBet(
            marketId: marketId,
            option: option,
            betVault: <-betVault
        )
        
        log("Bet placed successfully!")
        log("Market ID: ".concat(marketId.toString()))
        log("Option: ".concat(option.toString()).concat(" (0=Option A, 1=Option B)"))
        log("Amount: ".concat(amount.toString()).concat(" FLOW"))
    }
}
  `,

  createUserAccount: `
import FlowWager from ${getFlowWagerAddress()}

    transaction(username: String, displayName: String) {
    prepare(signer: auth(Storage) &Account) {}
    
    execute {
        FlowWager.createUserAccount(username: username, displayName: displayName)
        log("User account created successfully!")
        log("Username: ".concat(username))
        log("Display Name: ".concat(displayName))
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
    category: UInt8,
    optionA: String,
    optionB: String,
    endTime: UFix64,
    minBet: UFix64,
    maxBet: UFix64,
    imageUrl: String
) {
    let flowVault: auth(FungibleToken.Withdraw) &FlowToken.Vault?
    
    prepare(signer: auth(Storage) &Account) {
        // Check if this is the deployer (no fee required)
        if signer.address == ${getFlowWagerAddress()} {
            self.flowVault = nil
        } else {
            self.flowVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow FlowToken vault")
        }
    }
    
    execute {
        // Prepare creation fee vault
        var creationFeeVault: @FlowToken.Vault? <- nil
        
        if let vault = self.flowVault {
            creationFeeVault <-! vault.withdraw(amount: 10.0) as! @FlowToken.Vault
        }
        
        let marketCategory = FlowWager.MarketCategory(rawValue: category)!
       
        let marketId = FlowWager.createMarket(
            title: title,
            description: description,
            category: marketCategory,
            optionA: optionA,
            optionB: optionB,
            endTime: endTime,
            minBet: minBet,
            maxBet: maxBet,
            imageUrl: imageUrl,
            creationFeeVault: <-creationFeeVault
        )
        
        log("Market created with ID: ".concat(marketId.toString()))
        log("Image URL (not stored): ".concat(imageUrl))
    }
}
  `,

  resolveMarket: `
    import FlowWager from ${getFlowWagerAddress()}
transaction(
    marketId: UInt64,
    outcome: UInt8,
    justification: String
) {
    prepare(signer: auth(Storage) &Account) {}
    
    execute {
        FlowWager.resolveMarket(
            marketId: marketId,
            outcome: outcome,
            justification: justification
        )
        
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
        let flowReceiver: &{FungibleToken.Receiver}
        
        prepare(signer: auth(BorrowValue) &Account) {
            self.flowReceiver = signer.capabilities.borrow<&{FungibleToken.Receiver}>(
                /public/flowTokenReceiver
            ) ?? panic("Could not borrow receiver reference to the recipient's Vault")
        }
        
        execute {
            let winnings <- FlowWager.claimWinnings(marketId: marketId)
            self.flowReceiver.deposit(from: <-winnings)
        }
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

  withdrawPlatformFees: `
    import FlowWager from ${getFlowWagerAddress()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    transaction(amount: UFix64) {
        let flowReceiver: &{FungibleToken.Receiver}
        
        prepare(signer: auth(BorrowValue) &Account) {
            self.flowReceiver = signer.capabilities.borrow<&{FungibleToken.Receiver}>(
                /public/flowTokenReceiver
            ) ?? panic("Could not borrow receiver reference to the recipient's Vault")
        }
        
        execute {
            let fees <- FlowWager.withdrawPlatformFees(amount: amount)
            self.flowReceiver.deposit(from: <-fees)
        }
    }
  `,

  // USER SCRIPTS
  getUserPositions: `
    import FlowWager from ${getFlowWagerAddress()}

access(all) fun main(userAddress: Address): {UInt64: FlowWager.UserPosition} {
    return FlowWager.getUserPositions(address: userAddress)
}
  `,

  getUserDashboarData: `
    import FlowWager from ${getFlowWagerAddress()}

access(all) struct UserDashboard {
    access(all) let profile: FlowWager.UserProfile?
    access(all) let stats: FlowWager.UserStats?
    access(all) let positions: {UInt64: FlowWager.UserPosition}
    access(all) let claimableWinnings: [FlowWager.ClaimableWinnings]
    access(all) let wagerPoints: UInt64
    
    init(
        profile: FlowWager.UserProfile?,
        stats: FlowWager.UserStats?,
        positions: {UInt64: FlowWager.UserPosition},
        claimableWinnings: [FlowWager.ClaimableWinnings],
        wagerPoints: UInt64
    ) {
        self.profile = profile
        self.stats = stats
        self.positions = positions
        self.claimableWinnings = claimableWinnings
        self.wagerPoints = wagerPoints
    }
}

access(all) fun main(userAddress: Address): UserDashboard {
    let profile = FlowWager.getUserProfile(address: userAddress)
    let stats = FlowWager.getUserStats(address: userAddress)
    let positions = FlowWager.getUserPositions(address: userAddress)
    let claimableWinnings = FlowWager.getClaimableWinnings(address: userAddress)
    let wagerPoints = FlowWager.getWagerPoints(address: userAddress)
    
    return UserDashboard(
        profile: profile,
        stats: stats,
        positions: positions,
        claimableWinnings: claimableWinnings,
        wagerPoints: wagerPoints
    )
}
 `,

  getMarketById: `
 import FlowWager from ${getFlowWagerAddress()}

access(all) fun main(marketId: UInt64): FlowWager.Market? {
    return FlowWager.getMarket(marketId: marketId)
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

// Export convenience methods
export const getScript = FlowWagerScripts.getScript.bind(FlowWagerScripts);
export const getTransaction =
  FlowWagerScripts.getTransaction.bind(FlowWagerScripts);
export const getQuery = FlowWagerScripts.getQuery.bind(FlowWagerScripts);

// Query convenience exports
export const getActiveMarkets = () =>
  FlowWagerScripts.getScript("getActiveMarkets");
export const getAllMarkets = () => FlowWagerScripts.getScript("getAllMarkets");
export const getContractInfo = () =>
  FlowWagerScripts.getScript("getContractInfo");
export const getMarketCreator = () =>
  FlowWagerScripts.getScript("getMarketCreator");
export const getPlatformStats = () =>
  FlowWagerScripts.getScript("getPlatformStats");
export const getUserFlowBalance = () =>
  FlowWagerScripts.getScript("getUserFlowBalance");
export const getUserProfile = () =>
  FlowWagerScripts.getScript("getUserProfile");
export const testBetValidation = () =>
  FlowWagerScripts.getScript("testBetValidation");
export const getPendingMarkets = () =>
  FlowWagerScripts.getScript("getPendingMarkets");
export const getPendingMarketsWithEvidence = () =>
  FlowWagerScripts.getScript("getPendingMarketsWithEvidence");
export const getUserPositions = () =>
  FlowWagerScripts.getScript("getUserPositions");
export const getUserDashboardData = () =>
  FlowWagerScripts.getScript("getUserDashboarData");

export const getMarketById = () => FlowWagerScripts.getScript("getMarketById");

// Transaction convenience exports
export const placeBetTransaction = () =>
  FlowWagerScripts.getTransaction("placeBet");
export const createUserAccountTransaction = () =>
  FlowWagerScripts.getTransaction("createUserAccount");
export const createMarketTransaction = () =>
  FlowWagerScripts.getTransaction("createMarket");
export const resolveMarketTransaction = () =>
  FlowWagerScripts.getTransaction("resolveMarket");
export const claimWinningsTransaction = () =>
  FlowWagerScripts.getTransaction("claimWinnings");
export const withdrawPlatformFeesTransaction = () =>
  FlowWagerScripts.getTransaction("withdrawPlatformFees");

// Type definitions for better IntelliSense
export type ScriptName = keyof typeof CADENCE_SCRIPTS;

export type TransactionName =
  | "placeBet"
  | "createUserAccount"
  | "createMarket"
  | "resolveMarket"
  | "claimWinnings"
  | "withdrawPlatformFees";

export type QueryName =
  | "getActiveMarkets"
  | "getAllMarkets"
  | "getContractInfo"
  | "getMarketCreator"
  | "getPlatformStats"
  | "getUserFlowBalance"
  | "getUserProfile"
  | "testBetValidation"
  | "getPendingMarkets"
  | "getPendingMarketsWithEvidence"
  | "getUserPositions"
  | "getUserDashboardData"
  | "getMarketById";
