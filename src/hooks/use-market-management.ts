/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import flowConfig from "@/lib/flow/config";
import {
  Market,
  MarketCategory,
  MarketStatus,
  PlatformStats,
} from "@/types/market";
import {
  getAllMarketsQuery as getAllMarkets,
  getPlatformStats,
} from "@/lib/flowupdate-scripts";
import { useFlowUpdate } from "./useFlowUpdate";
import * as fcl from "@onflow/fcl";
import { transformMarketsData } from "@/lib/data/markets";

export function useMarketManagement() {
  // Initialize Flow configuration
  const initConfig = useCallback(async () => {
    try {
      flowConfig();

      // Debug: Log configuration status
      console.log("Flow configuration initialized:", {
        network: process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet",
        flowWagerContract: process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT,
        accessNode: process.env.NEXT_PUBLIC_FLOW_ACCESS_API,
        discoveryWallet: process.env.NEXT_PUBLIC_FLOW_DISCOVERY_WALLET,
      });
    } catch (error) {
      console.error("Failed to initialize Flow configuration:", error);
      throw error;
    }
  }, []);

  // State with proper types
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(
    null,
  );

  // Filter states with proper types - default to 'active' instead of 'all'
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("active");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<
    "newest" | "ending" | "volume" | "popular"
  >("newest");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | MarketCategory
  >("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | MarketStatus>(
    "all",
  );

  // Use the FlowUpdate hook for multi-option markets
  const {
    activeMarkets: multiOptionMarkets,
    userMarkets,
    selectedMarket: flowUpdateSelectedMarket,
    userPositions,
    claimableWinnings,
    stats: contractStats,
    loading: flowUpdateLoading,
    error: flowUpdateError,
    transactionInProgress,
    fetchActiveMarkets: fetchMultiOptionMarkets,
    fetchUserMarkets,
    fetchUserPositions,
    fetchClaimableWinnings,
    fetchContractStats,
    createMarket: createMultiOptionMarket,
    placeBet,
    placeBatchBets,
    resolveMarket,
    claimWinnings,
    submitEvidence,
    refetch: refetchFlowUpdate,
  } = useFlowUpdate({ autoFetch: false }); // Disable auto-fetch, we'll manage it

  // Fetch markets from smart contract
  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize Flow configuration before making queries
      await initConfig();

      // Fetch all markets using your script
      const getAllMarketsScript = getAllMarkets();
      const contractMarkets = await fcl.query({
        cadence: getAllMarketsScript,
      });

      const transformedMarkets: Market[] = transformMarketsData(
        contractMarkets || [],
      );

      console.log("Transformed markets:", transformedMarkets);

      setMarkets(transformedMarkets);

      // Fetch platform stats using your script
      const getPlatformStatsScript = getPlatformStats();
      const stats = await fcl.query({
        cadence: getPlatformStatsScript,
      });

      console.log("Raw platform stats:", stats);

      setPlatformStats({
        totalMarkets: parseInt(stats.totalMarkets.toString()),
        activeMarkets: parseInt(stats.activeMarkets.toString()),
        totalUsers: parseInt(stats.totalUsers.toString()),
        totalVolume: stats.totalVolume.toString(),
        totalFees: stats.totalFees.toString(),
      });
    } catch (err) {
      console.error("Error fetching markets from smart contract:", err);

      // Enhanced error handling
      if (err instanceof Error) {
        if (err.message.includes("accessNode.api")) {
          setError(
            "Flow network configuration error. Please check environment variables.",
          );
        } else if (err.message.includes("script not found")) {
          setError("Contract script error. Please verify contract deployment.");
        } else if (err.message.includes("location")) {
          setError(
            "Contract address error. Please check NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT.",
          );
        } else {
          setError(`Blockchain error: ${err.message}`);
        }
      } else {
        setError("Failed to fetch markets from blockchain");
      }
    } finally {
      setLoading(false);
    }
  }, [initConfig]);

  // Fetch active markets only (more efficient for dashboard)
  const fetchActiveMarkets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await initConfig();

      // Use getActiveMarkets for better performance if you only need active markets
      const { getActiveMarkets } = await import("@/lib/flow-wager-scripts");
      const getActiveMarketsScript = await getActiveMarkets();

      const contractMarkets = await fcl.query({
        cadence: getActiveMarketsScript,
      });

      const transformedMarkets: Market[] =
        contractMarkets?.map((market: any) => ({
          id: market.id.toString(),
          title: market.title,
          description: market.description,
          category: parseInt(market.category.rawValue),
          optionA: market.optionA,
          optionB: market.optionB,
          creator: market.creator,
          createdAt: market.createdAt.toString(),
          endTime: market.endTime.toString(),
          minBet: market.minBet.toString(),
          maxBet: market.maxBet.toString(),
          status: parseInt(market.status.rawValue),
          outcome: market.outcome
            ? parseInt(market.outcome.rawValue)
            : undefined,
          resolved: market.resolved,
          totalOptionAShares: market.totalOptionAShares.toString(),
          totalOptionBShares: market.totalOptionBShares.toString(),
          totalPool: market.totalPool.toString(),
          imageUrl: market.imageUrl || "",
        })) || [];

      setMarkets(transformedMarkets);
    } catch (err) {
      console.error("Error fetching active markets:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch active markets",
      );
    } finally {
      setLoading(false);
    }
  }, [initConfig]);

  // Filter and sort markets
  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = markets;
    const now = Date.now() / 1000;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (market) =>
          market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          market.optionA.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.optionB.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Tab filter - Updated logic
    switch (activeTab) {
      case "active":
        // Markets that are currently active (not ended and not resolved)
        filtered = filtered.filter(
          (market) =>
            market.status === MarketStatus.Active &&
            parseFloat(market.endTime) > now,
        );
        break;
      case "pending":
        // Markets that have ended but not yet resolved
        filtered = filtered.filter(
          (market) =>
            market.status === MarketStatus.Active &&
            parseFloat(market.endTime) <= now,
        );
        break;
      case "resolved":
        // Markets that have been resolved
        filtered = filtered.filter(
          (market) => market.status === MarketStatus.Resolved,
        );
        break;
      case "trending":
        // Popular active markets (currently running with volume)
        filtered = filtered
          .filter(
            (market) =>
              market.status === MarketStatus.Active &&
              parseFloat(market.endTime) > now &&
              parseFloat(market.totalPool) > 0,
          )
          .sort((a, b) => parseFloat(b.totalPool) - parseFloat(a.totalPool));
        break;
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (market) => market.category === selectedCategory,
      );
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((market) => market.status === selectedStatus);
    }

    // Sort (skip for trending as it's already sorted by volume)
    if (activeTab !== "trending") {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return parseFloat(b.createdAt) - parseFloat(a.createdAt);
          case "ending":
            return parseFloat(a.endTime) - parseFloat(b.endTime);
          case "volume":
            return parseFloat(b.totalPool) - parseFloat(a.totalPool);
          case "popular":
            const aShares =
              parseFloat(a.totalOptionAShares) +
              parseFloat(a.totalOptionBShares);
            const bShares =
              parseFloat(b.totalOptionAShares) +
              parseFloat(b.totalOptionBShares);
            return bShares - aShares;
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [
    markets,
    searchQuery,
    activeTab,
    selectedCategory,
    selectedStatus,
    sortBy,
  ]);

  // Calculate market counts - Updated logic
  const marketCounts = useMemo(() => {
    const now = Date.now() / 1000;

    return {
      active: markets.filter(
        (m) => m.status === MarketStatus.Active && parseFloat(m.endTime) > now,
      ).length,
      pending: markets.filter(
        (m) => m.status === MarketStatus.Active && parseFloat(m.endTime) <= now,
      ).length,
      resolved: markets.filter((m) => m.status === MarketStatus.Resolved)
        .length,
      trending: markets.filter(
        (m) =>
          m.status === MarketStatus.Active &&
          parseFloat(m.endTime) > now &&
          parseFloat(m.totalPool) > 0,
      ).length,
    };
  }, [markets]);

  // Calculate market stats
  const marketStats = useMemo(() => {
    const now = Date.now() / 1000;
    const activeMarkets = markets.filter(
      (m) => m.status === MarketStatus.Active && parseFloat(m.endTime) > now,
    );
    const totalVolume = markets.reduce(
      (sum, m) => sum + parseFloat(m.totalPool || "0"),
      0,
    );
    const avgVolume = markets.length > 0 ? totalVolume / markets.length : 0;

    const pendingMarkets = markets.filter(
      (m) => m.status === MarketStatus.Active && parseFloat(m.endTime) <= now,
    ).length;

    return {
      active: activeMarkets.length,
      totalVolume,
      avgVolume,
      endingSoon: pendingMarkets, // Now represents pending markets
    };
  }, [markets]);

  // Type-safe filter handlers
  const handleCategoryChange = (category: "all" | MarketCategory) => {
    setSelectedCategory(category);
  };

  const handleStatusChange = (status: "all" | MarketStatus) => {
    setSelectedStatus(status);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSortBy("newest");
    setActiveTab("active"); // Default to active instead of all
  };

  // Combined refetch function
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchMarkets(),
      fetchMultiOptionMarkets(),
      fetchContractStats(),
    ]);
  }, [fetchMarkets, fetchMultiOptionMarkets, fetchContractStats]);

  // Fetch data on mount and setup interval for real-time updates
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    // Data - Binary Markets (FlowWager)
    markets,
    filteredAndSortedMarkets,
    marketStats,
    marketCounts,
    platformStats,
    loading: loading || flowUpdateLoading,
    error: error || flowUpdateError,

    // Data - Multi-Option Markets (FlowUpdate)
    multiOptionMarkets,
    userMarkets,
    selectedFlowUpdateMarket: flowUpdateSelectedMarket,
    userPositions,
    claimableWinnings,
    contractStats,
    transactionInProgress,

    // Filter states
    searchQuery,
    activeTab,
    showFilters,
    sortBy,
    selectedCategory,
    selectedStatus,

    // Filter setters
    setSearchQuery,
    setActiveTab,
    setShowFilters,
    setSortBy,
    handleCategoryChange,
    handleStatusChange,

    // Binary Market Actions (FlowWager)
    refetch: fetchMarkets,
    fetchActiveMarkets,
    handleResetFilters,

    // Multi-Option Market Actions (FlowUpdate)
    fetchMultiOptionMarkets,
    fetchUserMarkets,
    fetchUserPositions,
    fetchClaimableWinnings,
    fetchContractStats,
    createMultiOptionMarket,
    placeBet,
    placeBatchBets,
    resolveMarket,
    claimWinnings,
    submitEvidence,
    refetchAll: refetch, // Combined refetch
  };
}
