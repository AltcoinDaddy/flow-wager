// lib/flow-service.ts
import * as fcl from "@onflow/fcl";
import flowConfig from "@/lib/flow/config";
import {
    getPendingMarketsScript,
    getMarketByIdScript,
    checkAdminPrivilegesScript,
    resolveMarketTransaction
} from "./flow/resolve-market";

// Import your existing types
import type { 
  Market, 
  MarketOutcome, 
  Address 
} from "@/types/market";

// Flow-specific interfaces
interface TransactionResult {
    success: boolean;
    transactionId: string;
    result?: any;
}

interface ResolutionOptions {
    evidence: string;
    sourceUrl: string;
    adminNotes: string;
}

// Initialize Flow config
const initConfig = async () => {
  flowConfig();
};

// =====================================
// EXPORTED FLOW FUNCTIONS
// =====================================

// Get all markets pending resolution
export const getPendingMarkets = async (): Promise<Market[]> => {
    try {
        await initConfig();
        
        const script = getPendingMarketsScript();
        const result = await fcl.query({
            cadence: script.cadence,
            args: () => script.args
        });
        
        return result || [];
    } catch (error) {
        console.error("Error fetching pending markets:", error);
        throw new Error("Failed to fetch pending markets");
    }
};

// Get a specific market by ID
export const getMarket = async (marketId: string | number): Promise<Market | null> => {
    try {
        await initConfig();
        
        const script = getMarketByIdScript(marketId);
        const result = await fcl.query({
            cadence: script.cadence,
            args: () => script.args
        });
        
        return result;
    } catch (error) {
        console.error(`Error fetching market ${marketId}:`, error);
        throw new Error(`Failed to fetch market ${marketId}`);
    }
};

// Check if current user has admin privileges
export const checkAdminPrivileges = async (userAddress: Address): Promise<boolean> => {
    try {
        if (!userAddress) return false;
        
        await initConfig();
        
        const script = checkAdminPrivilegesScript(userAddress);
        const result = await fcl.query({
            cadence: script.cadence,
            args: () => script.args
        });
        
        return result === true;
    } catch (error) {
        console.error("Error checking admin privileges:", error);
        return false;
    }
};

// Resolve a market
export const resolveMarket = async (
    marketId: number, 
    outcome: MarketOutcome, 
    options: ResolutionOptions = { evidence: "", sourceUrl: "", adminNotes: "" }
): Promise<TransactionResult> => {
    try {
        await initConfig();
        
        const { evidence, sourceUrl, adminNotes } = options;
        
        // Get the transaction
        const transaction = resolveMarketTransaction(marketId, outcome);
        
        // Execute the transaction
        const transactionId = await fcl.mutate({
            cadence: transaction.cadence,
            args: () => transaction.args,
            payer: fcl.authz,
            proposer: fcl.authz,
            authorizations: [fcl.authz],
            limit: transaction.limit
        });

        console.log("Transaction submitted:", transactionId);

        // Wait for transaction to be sealed
        const result = await fcl.tx(transactionId).onceSealed();
        
        console.log("Transaction sealed:", result);

        // Log resolution details for audit trail
        console.log("Market Resolution Details:", {
            marketId,
            outcome,
            evidence,
            sourceUrl,
            adminNotes,
            transactionId,
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            transactionId,
            result
        };

    } catch (error) {
        console.error("Error resolving market:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(`Failed to resolve market: ${errorMessage}`);
    }
};

// =====================================
// REACT HOOKS FOR FLOW INTEGRATION
// =====================================

import { useState, useEffect } from 'react';

interface UsePendingMarketsReturn {
    markets: Market[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

interface UseMarketResolutionReturn {
    resolveMarket: (marketId: number, outcome: MarketOutcome, options?: ResolutionOptions) => Promise<TransactionResult>;
    resolving: boolean;
    error: string | null;
}

// Hook for managing pending markets
export function usePendingMarkets(): UsePendingMarketsReturn {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMarkets = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const pendingMarkets = await getPendingMarkets();
            setMarkets(pendingMarkets);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
            setError(errorMessage);
            console.error("Failed to fetch pending markets:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarkets();
    }, []);

    return {
        markets,
        loading,
        error,
        refetch: fetchMarkets
    };
}

// Hook for market resolution
export function useMarketResolution(): UseMarketResolutionReturn {
    const [resolving, setResolving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const resolveMarketHook = async (
        marketId: number, 
        outcome: MarketOutcome, 
        options: ResolutionOptions = { evidence: "", sourceUrl: "", adminNotes: "" }
    ): Promise<TransactionResult> => {
        try {
            setResolving(true);
            setError(null);
            
            const result = await resolveMarket(marketId, outcome, options);
            
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
            setError(errorMessage);
            throw err;
        } finally {
            setResolving(false);
        }
    };

    return {
        resolveMarket: resolveMarketHook,
        resolving,
        error
    };
}

// Export types for use in other components
export type { TransactionResult, ResolutionOptions };