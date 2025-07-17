/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/resolution-scripts.ts
import type { MarketOutcome } from "@/types/market";

const FLOWWAGER_CONTRACT = process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT;

// TypeScript interfaces for script arguments and returns
interface ScriptDefinition {
    cadence: string;
    args: Array<{ value: any; type: string }>;
}

interface TransactionDefinition {
    cadence: string;
    args: Array<{ value: any; type: string }>;
    limit: number;
}

// =====================================
// RESOLUTION SCRIPTS
// =====================================

// Get markets pending resolution (ended but not resolved)
export const GET_PENDING_MARKETS = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(): [FlowWager.Market] {
    let allMarkets = FlowWager.getAllMarkets()
    let pendingMarkets: [FlowWager.Market] = []
    let currentTime = getCurrentBlock().timestamp

    for market in allMarkets {
        if market.endTime < currentTime && !market.resolved && market.status == FlowWager.MarketStatus.Active {
            pendingMarkets.append(market)
        }
    }

    return pendingMarkets
}
`;

// Check if user has admin privileges
export const CHECK_ADMIN_PRIVILEGES = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(userAddress: Address): Bool {
    let account = getAccount(userAddress)
    return account.storage.borrow<&FlowWager.Admin>(from: /storage/FlowWagerAdmin) != nil
}
`;

// =====================================
// RESOLUTION TRANSACTIONS
// =====================================

// Resolve market transaction (matching your pattern)
export const RESOLVE_MARKET_TRANSACTION = `
import FlowWager from ${FLOWWAGER_CONTRACT}

transaction(marketId: UInt64, outcome: UInt8) {
    let adminRef: &FlowWager.Admin
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Get reference to Admin resource
        self.adminRef = signer.storage.borrow<&FlowWager.Admin>(from: /storage/FlowWagerAdmin)
            ?? panic("Could not borrow Admin reference")
    }
    
    execute {
        // Convert UInt8 to MarketOutcome enum
        let outcomeEnum = FlowWager.MarketOutcome(rawValue: outcome)
            ?? panic("Invalid outcome value")
        
        // Resolve the market
        self.adminRef.resolveMarket(marketId: marketId, outcome: outcomeEnum)
        
        log("Market resolved with outcome: ".concat(outcome.toString()))
    }
}
`;

// =====================================
// SCRIPT GENERATORS
// =====================================

export const getPendingMarketsScript = (): ScriptDefinition => {
    return {
        cadence: GET_PENDING_MARKETS,
        args: [],
    };
};

export const getMarketByIdScript = (marketId: string | number): ScriptDefinition => {
    return {
        cadence: `
            import FlowWager from ${FLOWWAGER_CONTRACT}
            
            access(all) fun main(marketId: UInt64): FlowWager.Market? {
                return FlowWager.getMarket(marketId: marketId)
            }
        `,
        args: [{ value: marketId.toString(), type: "UInt64" }],
    };
};

export const checkAdminPrivilegesScript = (userAddress: string): ScriptDefinition => {
    return {
        cadence: CHECK_ADMIN_PRIVILEGES,
        args: [{ value: userAddress, type: "Address" }],
    };
};

// Updated to match your transaction pattern
export const resolveMarketTransaction = (
    marketId: number, 
    outcome: MarketOutcome
): TransactionDefinition => {
    return {
        cadence: RESOLVE_MARKET_TRANSACTION,
        args: [
            { value: marketId, type: "UInt64" },
            { value: outcome, type: "UInt8" }
        ],
        limit: 100
    };
};

// Additional transaction generators to match your existing patterns

export const createMarketTransaction = (
    title: string,
    description: string,
    category: number,
    optionA: string,
    optionB: string,
    endTime: number,
    minBet: number,
    maxBet: number
): TransactionDefinition => {
    return {
        cadence: `
            import FlowWager from ${FLOWWAGER_CONTRACT}

            transaction(
                title: String,
                description: String,
                category: UInt8,
                optionA: String,
                optionB: String,
                endTime: UFix64,
                minBet: UFix64,
                maxBet: UFix64
            ) {
                let adminRef: &FlowWager.Admin
                
                prepare(signer: auth(BorrowValue) &Account) {
                    // Get reference to Admin resource
                    self.adminRef = signer.storage.borrow<&FlowWager.Admin>(from: /storage/FlowWagerAdmin)
                        ?? panic("Could not borrow Admin reference")
                }
                
                execute {
                    let marketId = self.adminRef.createMarket(
                        title: title,
                        description: description,
                        category: FlowWager.MarketCategory(rawValue: category)!,
                        optionA: optionA,
                        optionB: optionB,
                        endTime: endTime,
                        minBet: minBet,
                        maxBet: maxBet
                    )
                    
                    log("Market created with ID: ".concat(marketId.toString()))
                }
            }
        `,
        args: [
            { value: title, type: "String" },
            { value: description, type: "String" },
            { value: category, type: "UInt8" },
            { value: optionA, type: "String" },
            { value: optionB, type: "String" },
            { value: endTime.toFixed(1), type: "UFix64" },
            { value: minBet.toFixed(8), type: "UFix64" },
            { value: maxBet.toFixed(8), type: "UFix64" }
        ],
        limit: 150
    };
};

export const buySharesTransaction = (
    marketId: number,
    isOptionA: boolean,
    amount: number
): TransactionDefinition => {
    return {
        cadence: `
            import FlowWager from ${FLOWWAGER_CONTRACT}
            import FlowToken from 0x1654653399040a61
            import FungibleToken from 0xf233dcee88fe0abe

            transaction(marketId: UInt64, option: UInt8, amount: UFix64) {
                let flowVault: &FlowToken.Vault
                
                prepare(signer: auth(BorrowValue) &Account) {
                    // Get reference to signer's FlowToken vault
                    self.flowVault = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                        ?? panic("Could not borrow FlowToken vault reference")
                }
                
                execute {
                    // Call the contract function to buy shares
                    FlowWager.buyShares(marketId: marketId, option: option, amount: amount)
                    
                    log("Shares purchased for market: ".concat(marketId.toString()))
                }
            }
        `,
        args: [
            { value: marketId, type: "UInt64" },
            { value: isOptionA ? 1 : 2, type: "UInt8" },
            { value: amount.toFixed(8), type: "UFix64" }
        ],
        limit: 100
    };
};

export const claimWinningsTransaction = (marketId: number): TransactionDefinition => {
    return {
        cadence: `
            import FlowWager from ${FLOWWAGER_CONTRACT}
            import FungibleToken from 0xf233dcee88fe0abe
            import FlowToken from 0x1654653399040a61
            
            transaction(marketId: UInt64) {
                let signerVault: &FlowToken.Vault
                
                prepare(signer: auth(BorrowValue) &Account) {
                    self.signerVault = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
                        ?? panic("Could not borrow FlowToken.Vault reference")
                }
                
                execute {
                    let winningsVault <- FlowWager.claimWinnings(marketId: marketId)
                    self.signerVault.deposit(from: <-winningsVault)
                    
                    log("Winnings claimed for market: ".concat(marketId.toString()))
                }
            }
        `,
        args: [
            { value: marketId, type: "UInt64" }
        ],
        limit: 100
    };
};

// Export types
export type { ScriptDefinition, TransactionDefinition };