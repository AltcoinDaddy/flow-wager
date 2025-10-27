/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getScript, // Assumes this fetches V2 scripts
  getUserPositions as getUserPositionsScript, // Rename import for clarity
} from "@/lib/flow-wager-scripts";
import flowConfig from "@/lib/flow/config";
// Ensure Market and MarketStatus types are updated for V2
import { Market, MarketStatus } from "@/types/market";
import * as fcl from "@onflow/fcl";
import { useCallback, useEffect, useState } from "react";

// --- V2 Aligned Types ---

export interface Trade {
  // Keep as is - Placeholder for event data
  id: string;
  marketId: string; // Use string IDs consistently
  user: string;
  optionIndex: number; // Use index
  amount: string; // UFix64 string
  shares: string; // UFix64 string
  price: string; // UFix64 string
  timestamp: string; // UFix64 string or ISO date
}

export interface Comment {
  // Keep as is - Placeholder
  id: string;
  marketId: string;
  user: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface PricePoint {
  // Keep as is - Placeholder
  timestamp: string;
  // Consider pricesPerOption: string[] for multi-option
  optionAPrice: string;
  optionBPrice: string;
  volume: string;
}

// V2 Aligned User Position
export interface UserPosition {
  marketId: string;
  optionShares: string[]; // Shares per option
  totalInvested: string; // Total FLOW invested
  currentValue: string; // Calculated current value
  profitLoss: string; // Calculated P/L
  claimed: boolean; // From contract data
  createdAt: string; // From contract data
}

// V2 Aligned User Bet (Represents aggregated position, not history)
export interface UserBet {
  marketId: string;
  optionShares: string[]; // Shares per option from Position
  totalInvested: string; // Total FLOW invested from Position
  createdAt: string; // Timestamp from Position
  status: "active" | "pending" | "resolved" | "cancelled"; // Based on market status
}

// --- Helper ---
const sumShares = (shares: string[]): number => {
  return shares.reduce((acc, share) => acc + parseFloat(share || "0"), 0);
};

// --- Hook ---
export const useMarketDetail = (
  marketId: string | undefined,
  userAddress?: string,
) => {
  const [market, setMarket] = useState<Market | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]); // Placeholder
  const [comments, setComments] = useState<Comment[]>([]); // Placeholder
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]); // Placeholder
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [userBets, setUserBets] = useState<UserBet[]>([]); // Will hold single aggregated bet object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initConfig = useCallback(async () => {
    // useCallback for initConfig
    try {
      flowConfig();
    } catch (error) {
      console.error("Failed to initialize Flow configuration:", error);
      // Don't throw here, let fetches handle errors
    }
  }, []);

  // --- V2 Aligned Data Fetching Functions ---

  const getMarketById = useCallback(
    async (id: string): Promise<Market | null> => {
      try {
        await initConfig();
        const script = await getScript("getMarketById");
        const rawMarket = await fcl.query({
          cadence: script,
          args: (arg: any, t: any) => [arg(id, t.UInt64)],
        });

        if (!rawMarket) return null;

        // Transform using V2 structure
        return {
          id: rawMarket.id.toString(),
          title: rawMarket.title || "Untitled Market",
          description: rawMarket.description || "No description",
          category: parseInt(rawMarket.category?.rawValue ?? "8"), // Default Other
          options: rawMarket.options || [],
          totalShares:
            rawMarket.totalShares?.map((s: any) => s.toString()) || [],
          winningOption:
            rawMarket.winningOption !== null &&
            rawMarket.winningOption !== undefined
              ? parseInt(rawMarket.winningOption.toString())
              : undefined,
          creator: rawMarket.creator || "Unknown",
          createdAt: rawMarket.createdAt?.toString() || "0.0",
          endTime: rawMarket.endTime?.toString() || "0.0",
          minBet: rawMarket.minBet?.toString() || "0.0",
          maxBet: rawMarket.maxBet?.toString() || "0.0",
          status: parseInt(rawMarket.status?.rawValue ?? "0") as MarketStatus,
          resolved: rawMarket.resolved || false,
          totalPool: rawMarket.totalPool?.toString() || "0.0",
          imageUrl: rawMarket.imageUrl || undefined,
        };
      } catch (error) {
        console.error(`Failed to fetch market ${id}:`, error);
        // setError(`Failed to fetch market data: ${error instanceof Error ? error.message : String(error)}`);
        return null; // Return null on error
      }
    },
    [initConfig],
  ); // Add initConfig dependency

  const getUserMarketPosition = useCallback(
    async (
      addr: string,
      mId: string,
      fetchedMarket: Market, // Pass market data for calculations
    ): Promise<UserPosition | null> => {
      if (!fetchedMarket) return null; // Need market data

      try {
        await initConfig();
        const script = await getUserPositionsScript(); // Use the specific script getter
        const allPositionsRaw = await fcl.query({
          cadence: script,
          args: (arg: any, t: any) => [arg(addr, t.Address)],
        });

        // FCL query might return null if capability doesn't exist
        if (!allPositionsRaw) {
          console.log(`User ${addr} has no positions resource set up.`);
          return null;
        }

        // Access the specific position for this market
        const positionRaw = allPositionsRaw[mId]; // Use string marketId as key

        if (!positionRaw) return null;

        // Calculate current value and profit/loss based on market status
        const totalInvestedNum = parseFloat(positionRaw.totalInvested || "0");
        const userTotalSharesNum = sumShares(
          positionRaw.optionShares?.map((s: any) => s.toString()) || [],
        );
        let currentValueNum = 0;
        let profitLossNum = 0;

        if (
          fetchedMarket.resolved &&
          fetchedMarket.winningOption !== undefined &&
          !positionRaw.claimed
        ) {
          // Use calculateWinnings logic concept for resolved markets
          const userWinningShares = parseFloat(
            positionRaw.optionShares?.[
              fetchedMarket.winningOption
            ]?.toString() || "0",
          );
          if (userWinningShares > 0) {
            const totalWinningShares = parseFloat(
              fetchedMarket.totalShares?.[fetchedMarket.winningOption] || "0",
            );
            if (totalWinningShares > 0) {
              // Approximate payout calculation (doesn't account for exact fee % here, needs contract state or const)
              // Assume 10% fee for calculation example
              const feePercentage = 10.0; // TODO: Get this from contract state if needed
              const distributablePool =
                parseFloat(fetchedMarket.totalPool) *
                (1.0 - feePercentage / 100.0);
              currentValueNum =
                (userWinningShares / totalWinningShares) * distributablePool;
            }
          }
        } else if (
          !fetchedMarket.resolved &&
          fetchedMarket.status === MarketStatus.Active
        ) {
          // Use pool share logic for active markets
          const marketTotalShares = sumShares(fetchedMarket.totalShares || []);
          if (marketTotalShares > 0 && userTotalSharesNum > 0) {
            const shareRatio = userTotalSharesNum / marketTotalShares;
            // Assume 10% fee for calculation example
            const feePercentage = 10.0; // TODO: Get this from contract state if needed
            const distributablePool =
              parseFloat(fetchedMarket.totalPool) *
              (1.0 - feePercentage / 100.0);
            currentValueNum = distributablePool * shareRatio;
          } else if (userTotalSharesNum > 0) {
            // If market has no shares yet, value is what user invested
            currentValueNum = totalInvestedNum;
          }
        }
        // If market is pending, cancelled, or resolved but lost/claimed, value is 0 (or could show invested for pending)
        // For simplicity here, defaults to 0 if not active or won/unclaimed

        profitLossNum = currentValueNum - totalInvestedNum;

        return {
          marketId: mId,
          optionShares:
            positionRaw.optionShares?.map((s: any) => s.toString()) || [],
          totalInvested: totalInvestedNum.toString(),
          currentValue: currentValueNum.toFixed(4), // Format to reasonable precision
          profitLoss: profitLossNum.toFixed(4),
          claimed: positionRaw.claimed || false,
          createdAt: positionRaw.createdAt?.toString() || "0.0",
        };
      } catch (error) {
        console.error(
          `Failed to fetch user ${addr} position for market ${mId}:`,
          error,
        );
        // Don't set global error here, just return null
        return null;
      }
    },
    [initConfig],
  ); // Add initConfig dependency

  // Derives *aggregated* bet info from position
  const deriveUserMarketBet = (
    pos: UserPosition | null,
    mkt: Market | null,
  ): UserBet[] => {
    if (!pos || !mkt) return [];

    let status: UserBet["status"] = "active";
    if (mkt.resolved || mkt.status === MarketStatus.Resolved) {
      status = "resolved";
    } else if (mkt.status === MarketStatus.PendingResolution) {
      status = "pending";
    } else if (mkt.status === MarketStatus.Cancelled) {
      status = "cancelled";
    } else if (
      mkt.status === MarketStatus.Active &&
      parseFloat(mkt.endTime) * 1000 <= Date.now()
    ) {
      // Active but end time passed -> treat as pending
      status = "pending";
    }

    // Return a single object representing the total position
    return [
      {
        marketId: pos.marketId,
        optionShares: pos.optionShares,
        totalInvested: pos.totalInvested,
        createdAt: pos.createdAt, // Use position creation/update time
        status: status,
      },
    ];
  };

  // --- Mock Functions (Keep as placeholders) ---
  const getMarketTrades = useCallback(async (mId: string): Promise<Trade[]> => {
    console.log(`Mock: Getting trades for market ${mId}`);
    return [];
  }, []);

  const getMarketComments = useCallback(
    async (mId: string): Promise<Comment[]> => {
      console.log(`Mock: Getting comments for market ${mId}`);
      return [];
    },
    [],
  );

  const getMarketPriceHistory = useCallback(
    async (mId: string): Promise<PricePoint[]> => {
      console.log(`Mock: Getting price history for market ${mId}`);
      return [];
    },
    [],
  );

  // --- Main Data Fetching Logic ---
  const fetchMarketData = useCallback(async () => {
    if (!marketId) {
      setError("Market ID is missing.");
      setLoading(false);
      return;
    }

    // Validate marketId is numeric string
    if (isNaN(Number(marketId))) {
      setError(`Invalid Market ID provided: ${marketId}`);
      setLoading(false);
      return;
    }
    const safeMarketId = marketId; // Already validated

    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching market ${safeMarketId} details...`);

      // Fetch market data first
      const marketData = await getMarketById(safeMarketId);
      if (!marketData) {
        setError("Market not found");
        setLoading(false); // Stop loading if market not found
        return;
      }
      console.log("Market data fetched:", marketData);
      setMarket(marketData);

      // Fetch other data in parallel (using allSettled for non-critical)
      const results = await Promise.allSettled([
        getMarketTrades(safeMarketId),
        getMarketComments(safeMarketId),
        getMarketPriceHistory(safeMarketId),
        userAddress
          ? getUserMarketPosition(userAddress, safeMarketId, marketData)
          : Promise.resolve(null),
      ]);

      // Process results
      if (results[0].status === "fulfilled") setTrades(results[0].value || []);
      else console.error("Failed to fetch trades:", results[0].reason);

      if (results[1].status === "fulfilled")
        setComments(results[1].value || []);
      else console.error("Failed to fetch comments:", results[1].reason);

      if (results[2].status === "fulfilled")
        setPriceHistory(results[2].value || []);
      else console.error("Failed to fetch price history:", results[2].reason);

      let fetchedUserPosition: UserPosition | null = null;
      if (results[3].status === "fulfilled") {
        fetchedUserPosition = results[3].value;
        setUserPosition(fetchedUserPosition);
      } else {
        console.error("Failed to fetch user position:", results[3].reason);
        setUserPosition(null); // Explicitly set to null on error
      }

      // Derive aggregated user bet info *after* fetching position and market
      const derivedBets = deriveUserMarketBet(fetchedUserPosition, marketData);
      setUserBets(derivedBets);

      console.log("All market detail data loaded/attempted.");
    } catch (err: any) {
      console.error("Unexpected error in fetchMarketData:", err);
      setError(err.message || "Failed to fetch market details");
      // Reset states on major error
      setMarket(null);
      setTrades([]);
      setComments([]);
      setPriceHistory([]);
      setUserPosition(null);
      setUserBets([]);
    } finally {
      setLoading(false);
    }
  }, [
    marketId,
    userAddress,
    getMarketById,
    getUserMarketPosition,
    getMarketTrades,
    getMarketComments,
    getMarketPriceHistory,
  ]); // Added dependencies

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]); // fetchMarketData is now stable due to useCallback

  const refreshMarketData = useCallback(() => {
    console.log(`Refreshing market ${marketId} data...`);
    fetchMarketData(); // Re-trigger the fetch
  }, [fetchMarketData]); // Dependency ensures refresh uses latest context

  return {
    market,
    trades,
    comments,
    priceHistory,
    userPosition,
    userBets, // Represents aggregated position
    loading,
    error,
    refreshMarketData,
  };
};
