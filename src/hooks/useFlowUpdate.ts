import { useState, useCallback, useEffect } from "react";
import * as fcl from "@onflow/fcl";
import { toast } from "sonner";
import {
  createMultiOptionMarketTransaction,
  placeBetTransaction,
  placeBatchBetsTransaction,
  resolveMarketTransaction,
  claimWinningsTransaction,
  submitResolutionEvidenceTransaction,
  getMarketQuery,
  getActiveMarketsQuery,
  getMarketsByCreatorQuery,
  getUserPositionsQuery,
  calculatePotentialWinningsQuery,
  getClaimableWinningsQuery,
  getContractStatsQuery,
  getMarketEvidenceQuery,
  isMarketResolvedQuery,
} from "@/lib/flowupdate-scripts";
import {
  MultiOptionMarket,
  UserBetPosition,
  ContractStats,
  PlaceBetArgs,
  BatchBetArgs,
  CreateMultiOptionMarketArgs,
  ResolutionEvidence,
  ClaimableWinning,
} from "@/types/flowupdate";

interface UseFlowUpdateOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

interface UseFlowUpdateReturn {
  // Markets
  activeMarkets: MultiOptionMarket[];
  userMarkets: MultiOptionMarket[];
  selectedMarket: MultiOptionMarket | null;

  // User Positions
  userPositions: UserBetPosition[];
  claimableWinnings: ClaimableWinning[];
  totalClaimable: string;

  // Contract Stats
  stats: ContractStats | null;

  // Loading and Error States
  loading: boolean;
  error: string | null;
  transactionInProgress: boolean;

  // Market Operations
  createMarket: (args: CreateMultiOptionMarketArgs) => Promise<string>;
  placeBet: (args: PlaceBetArgs) => Promise<string>;
  placeBatchBets: (args: BatchBetArgs) => Promise<string>;
  resolveMarket: (
    marketId: string,
    winningOptionIndex: number,
  ) => Promise<string>;
  claimWinnings: (marketId: string) => Promise<string>;
  submitEvidence: (marketId: string, evidence: string) => Promise<string>;

  // Query Operations
  fetchMarket: (marketId: string) => Promise<MultiOptionMarket | null>;
  fetchActiveMarkets: () => Promise<void>;
  fetchUserMarkets: (creator: string) => Promise<void>;
  fetchUserPositions: (address: string) => Promise<void>;
  fetchClaimableWinnings: (address: string) => Promise<void>;
  fetchContractStats: () => Promise<void>;
  fetchMarketEvidence: (
    marketId: string,
  ) => Promise<ResolutionEvidence[] | null>;
  calculateWinnings: (
    marketId: string,
    optionIndex: number,
    shares: string,
  ) => Promise<string>;
  isMarketResolved: (marketId: string) => Promise<boolean>;

  // Utilities
  selectMarket: (market: MultiOptionMarket | null) => void;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useFlowUpdate = (
  options: UseFlowUpdateOptions = {},
): UseFlowUpdateReturn => {
  const { autoFetch = true, refreshInterval = 30000 } = options;

  // State
  const [activeMarkets, setActiveMarkets] = useState<MultiOptionMarket[]>([]);
  const [userMarkets, setUserMarkets] = useState<MultiOptionMarket[]>([]);
  const [selectedMarket, setSelectedMarket] =
    useState<MultiOptionMarket | null>(null);
  const [userPositions, setUserPositions] = useState<UserBetPosition[]>([]);
  const [claimableWinnings, setClaimableWinnings] = useState<
    ClaimableWinning[]
  >([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionInProgress, setTransactionInProgress] = useState(false);

  const handleError = (err: unknown, context: string) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[useFlowUpdate] ${context}:`, errorMessage);
    setError(errorMessage);
    toast.error(`${context}: ${errorMessage}`);
  };

  // ============================================
  // Query Operations
  // ============================================

  const fetchMarket = useCallback(
    async (marketId: string): Promise<MultiOptionMarket | null> => {
      try {
        setLoading(true);
        const script = getMarketQuery();
        const result = await fcl.query({
          cadence: script,
          args: (arg, t) => [arg(marketId, t.UInt64)],
        });
        return result as MultiOptionMarket;
      } catch (err) {
        handleError(err, `Failed to fetch market ${marketId}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchActiveMarkets = useCallback(async () => {
    try {
      setLoading(true);
      const script = getActiveMarketsQuery();
      const result = await fcl.query({
        cadence: script,
        args: () => [],
      });
      setActiveMarkets((result as MultiOptionMarket[]) || []);
      setError(null);
    } catch (err) {
      handleError(err, "Failed to fetch active markets");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserMarkets = useCallback(async (creator: string) => {
    try {
      setLoading(true);
      const script = getMarketsByCreatorQuery();
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(creator, t.Address)],
      });
      setUserMarkets((result as MultiOptionMarket[]) || []);
      setError(null);
    } catch (err) {
      handleError(err, "Failed to fetch user markets");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserPositions = useCallback(async (address: string) => {
    try {
      setLoading(true);
      const script = getUserPositionsQuery();
      await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)],
      });

      // Transform raw positions to UserBetPosition format
      const positions: UserBetPosition[] = [];
      // Implementation depends on contract response format
      setUserPositions(positions);
      setError(null);
    } catch (err) {
      handleError(err, "Failed to fetch user positions");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClaimableWinnings = useCallback(async (address: string) => {
    try {
      setLoading(true);
      const script = getClaimableWinningsQuery();
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)],
      });

      const winnings = (result as ClaimableWinning[]) || [];
      setClaimableWinnings(winnings);

      setError(null);
    } catch (err) {
      handleError(err, "Failed to fetch claimable winnings");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContractStats = useCallback(async () => {
    try {
      const script = getContractStatsQuery();
      const result = await fcl.query({
        cadence: script,
        args: () => [],
      });
      setStats(result as ContractStats);
      setError(null);
    } catch (err) {
      handleError(err, "Failed to fetch contract stats");
    }
  }, []);

  const fetchMarketEvidence = useCallback(
    async (marketId: string): Promise<ResolutionEvidence[] | null> => {
      try {
        const script = getMarketEvidenceQuery();
        const result = await fcl.query({
          cadence: script,
          args: (arg, t) => [arg(marketId, t.UInt64)],
        });
        return (result as ResolutionEvidence[]) || null;
      } catch (err) {
        handleError(err, `Failed to fetch evidence for market ${marketId}`);
        return null;
      }
    },
    [],
  );

  const calculateWinnings = useCallback(
    async (
      marketId: string,
      optionIndex: number,
      shares: string,
    ): Promise<string> => {
      try {
        const script = calculatePotentialWinningsQuery();
        const result = await fcl.query({
          cadence: script,
          args: (arg, t) => [
            arg(marketId, t.UInt64),
            arg(optionIndex, t.UInt8),
            arg(shares, t.UFix64),
          ],
        });
        return (result as string) || "0.0";
      } catch (err) {
        handleError(err, "Failed to calculate winnings");
        return "0.0";
      }
    },
    [],
  );

  const isMarketResolved = useCallback(
    async (marketId: string): Promise<boolean> => {
      try {
        const script = isMarketResolvedQuery();
        const result = await fcl.query({
          cadence: script,
          args: (arg, t) => [arg(marketId, t.UInt64)],
        });
        return (result as boolean) || false;
      } catch (err) {
        handleError(err, "Failed to check market resolution status");
        return false;
      }
    },
    [],
  );

  // ============================================
  // Transaction Operations
  // ============================================

  const createMarket = useCallback(
    async (args: CreateMultiOptionMarketArgs): Promise<string> => {
      try {
        setTransactionInProgress(true);
        const user = (await fcl.currentUser()) as { addr?: string };

        if (!user?.addr) {
          throw new Error("User not authenticated");
        }

        const script = createMultiOptionMarketTransaction();
        const txId = await fcl.mutate({
          cadence: script,
          args: (arg, t) => [
            arg(args.title, t.String),
            arg(args.description, t.String),
            arg(args.category.toString(), t.UInt8),
            arg(args.options, t.Array(t.String)),
            arg(args.endTime.toString(), t.UFix64),
            arg(args.minBet, t.UFix64),
            arg(args.maxBet, t.UFix64),
            arg(args.imageUrl, t.String),
            arg(args.creationFeeAmount || "0.0", t.Optional(t.UFix64)),
          ],
          proposer: fcl.currentUser,
          payer: fcl.currentUser,
          authorizations: [fcl.currentUser],
        });

        toast.success("Market created successfully!");
        await fetchActiveMarkets();
        return txId;
      } catch (err) {
        handleError(err, "Failed to create market");
        throw err;
      } finally {
        setTransactionInProgress(false);
      }
    },
    [fetchActiveMarkets],
  );

  const placeBet = useCallback(
    async (args: PlaceBetArgs): Promise<string> => {
      try {
        setTransactionInProgress(true);
        const user = (await fcl.currentUser()) as { addr?: string };

        if (!user?.addr) {
          throw new Error("User not authenticated");
        }

        const script = placeBetTransaction();
        const txId = await fcl.mutate({
          cadence: script,
          args: (arg, t) => [
            arg(args.marketId, t.UInt64),
            arg(args.optionIndex.toString(), t.UInt8),
            arg(args.amount, t.UFix64),
          ],
          proposer: fcl.currentUser,
          payer: fcl.currentUser,
          authorizations: [fcl.currentUser],
        });

        toast.success("Bet placed successfully!");
        await fetchUserPositions(user.addr);
        return txId;
      } catch (err) {
        handleError(err, "Failed to place bet");
        throw err;
      } finally {
        setTransactionInProgress(false);
      }
    },
    [fetchUserPositions],
  );

  const placeBatchBets = useCallback(
    async (args: BatchBetArgs): Promise<string> => {
      try {
        setTransactionInProgress(true);
        const user = (await fcl.currentUser()) as { addr?: string };

        if (!user?.addr) {
          throw new Error("User not authenticated");
        }

        const script = placeBatchBetsTransaction();
        const txId = await fcl.mutate({
          cadence: script,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: (arg, t) => [
            arg(
              args.bets.map((bet) => ({
                marketId: parseInt(bet.marketId),
                optionIndex: bet.optionIndex,
                amount: bet.amount,
              })) as any,
              t.Array(t.Struct("Bet")),
            ),
          ],
          proposer: fcl.currentUser,
          payer: fcl.currentUser,
          authorizations: [fcl.currentUser],
        });

        toast.success(`${args.bets.length} bets placed successfully!`);
        await fetchUserPositions(user.addr);
        return txId;
      } catch (err) {
        handleError(err, "Failed to place batch bets");
        throw err;
      } finally {
        setTransactionInProgress(false);
      }
    },
    [fetchUserPositions],
  );

  const resolveMarket = useCallback(
    async (marketId: string, winningOptionIndex: number): Promise<string> => {
      try {
        setTransactionInProgress(true);
        const user = (await fcl.currentUser()) as { addr?: string };

        if (!user?.addr) {
          throw new Error("User not authenticated");
        }

        const script = resolveMarketTransaction();
        const txId = await fcl.mutate({
          cadence: script,
          args: (arg, t) => [
            arg(marketId, t.UInt64),
            arg(winningOptionIndex.toString(), t.UInt8),
          ],
          proposer: fcl.currentUser,
          payer: fcl.currentUser,
          authorizations: [fcl.currentUser],
        });

        toast.success("Market resolved successfully!");
        await fetchActiveMarkets();
        return txId;
      } catch (err) {
        handleError(err, "Failed to resolve market");
        throw err;
      } finally {
        setTransactionInProgress(false);
      }
    },
    [fetchActiveMarkets],
  );

  const claimWinnings = useCallback(
    async (marketId: string): Promise<string> => {
      try {
        setTransactionInProgress(true);
        const user = (await fcl.currentUser()) as { addr?: string };

        if (!user?.addr) {
          throw new Error("User not authenticated");
        }

        const script = claimWinningsTransaction();
        const txId = await fcl.mutate({
          cadence: script,
          args: (arg, t) => [arg(marketId, t.UInt64)],
          proposer: fcl.currentUser,
          payer: fcl.currentUser,
          authorizations: [fcl.currentUser],
        });

        toast.success("Winnings claimed successfully!");
        await fetchClaimableWinnings(user.addr);
        await fetchUserPositions(user.addr);
        return txId;
      } catch (err) {
        handleError(err, "Failed to claim winnings");
        throw err;
      } finally {
        setTransactionInProgress(false);
      }
    },
    [fetchClaimableWinnings, fetchUserPositions],
  );

  const submitEvidence = useCallback(
    async (marketId: string, evidence: string): Promise<string> => {
      try {
        setTransactionInProgress(true);
        const user = (await fcl.currentUser()) as { addr?: string };

        if (!user?.addr) {
          throw new Error("User not authenticated");
        }

        const script = submitResolutionEvidenceTransaction();
        const txId = await fcl.mutate({
          cadence: script,
          args: (arg, t) => [arg(marketId, t.UInt64), arg(evidence, t.String)],
          proposer: fcl.currentUser,
          payer: fcl.currentUser,
          authorizations: [fcl.currentUser],
        });

        toast.success("Evidence submitted successfully!");
        return txId;
      } catch (err) {
        handleError(err, "Failed to submit evidence");
        throw err;
      } finally {
        setTransactionInProgress(false);
      }
    },
    [],
  );

  // ============================================
  // Utilities
  // ============================================

  const refetch = useCallback(async () => {
    const user = (await fcl.currentUser()) as { addr?: string };
    await Promise.all([
      fetchActiveMarkets(),
      fetchContractStats(),
      ...(user?.addr
        ? [fetchUserPositions(user.addr), fetchClaimableWinnings(user.addr)]
        : []),
    ]);
  }, [
    fetchActiveMarkets,
    fetchContractStats,
    fetchUserPositions,
    fetchClaimableWinnings,
  ]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const selectMarket = useCallback((market: MultiOptionMarket | null) => {
    setSelectedMarket(market);
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [autoFetch, refetch]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoFetch || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoFetch, refreshInterval, refetch]);

  return {
    activeMarkets,
    userMarkets,
    selectedMarket,
    userPositions,
    claimableWinnings,
    totalClaimable: claimableWinnings
      .reduce(
        (sum, w) => (parseFloat(sum) + parseFloat(w.amount)).toString(),
        "0",
      )
      .toString(),
    stats,
    loading,
    error,
    transactionInProgress,
    createMarket,
    placeBet,
    placeBatchBets,
    resolveMarket,
    claimWinnings,
    submitEvidence,
    fetchMarket,
    fetchActiveMarkets,
    fetchUserMarkets,
    fetchUserPositions,
    fetchClaimableWinnings,
    fetchContractStats,
    fetchMarketEvidence,
    calculateWinnings,
    isMarketResolved,
    selectMarket,
    refetch,
    clearError,
  };
};

export default useFlowUpdate;
