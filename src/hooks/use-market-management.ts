/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import flowConfig from "@/lib/flow/config";
import {
  Market, // <-- Ensure this type supports BOTH binary and multi-option fields if needed, OR just the V2 fields.
  MarketCategory,
  MarketStatus,
  PlatformStats,
} from "@/types/market";
import {
  getAllMarkets,
  getPlatformStats,
  getActiveMarkets,
} from "@/lib/flow-wager-scripts"; // Assuming this file exports V2 scripts
import * as fcl from "@onflow/fcl";

// --- IMPORTED Transformer ---
import { transformMarketData } from "@/lib/data/markets"; // Use the universal transformer

// Helper function to sum a UFix64 string array (still needed for sorting)
const sumShares = (shares: string[]): number => {
  return shares.reduce((acc, share) => acc + parseFloat(share || "0"), 0);
};

export function useMarketManagement() {
  const initConfig = useCallback(async () => {
    try {
      flowConfig();
    } catch (error) {
      console.error("Failed to initialize Flow configuration:", error);
      throw error;
    }
  }, []);

  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState<any | null>(null);

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

  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await initConfig();

      const getAllMarketsScript = await getAllMarkets();
      const contractMarkets = await fcl.query({ cadence: getAllMarketsScript });

      // --- USE UNIVERSAL TRANSFORMER ---
      const transformedMarkets: Market[] = (contractMarkets || []).map(
        transformMarketData,
      );
      // --- END ---

      console.log("Transformed markets:", transformedMarkets);
      setMarkets(transformedMarkets);

      const getPlatformStatsScript = await getPlatformStats();
      const stats = await fcl.query({ cadence: getPlatformStatsScript }); // Await the promise here

      console.log("Raw platform stats:", stats);
      // Ensure stats object exists before accessing properties
      if (stats) {
        setPlatformStats({
          totalMarkets: parseInt(stats.totalMarkets?.toString() || "0"),
          activeMarkets: parseInt(stats.activeMarkets?.toString() || "0"),
          totalUsers: parseInt(stats.totalUsers?.toString() || "0"),
          totalVolume: stats.totalVolume?.toString() || "0.0",
          totalFees: stats.totalFees?.toString() || "0.0",
        });
      } else {
        console.warn("Platform stats query returned null or undefined.");
        setPlatformStats(null); // Set to null if stats are missing
      }
    } catch (err) {
      // ... Error handling (ensure detailed logging) ...
      console.error("Error fetching markets/stats:", err);
      if (err instanceof Error) {
        // ... specific error checks ...
        setError(`Blockchain error: ${err.message}`);
      } else {
        setError("Failed to fetch markets from blockchain");
      }
    } finally {
      setLoading(false);
    }
  }, [initConfig]);

  const fetchActiveMarkets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await initConfig();

      const getActiveMarketsScript = await getActiveMarkets();
      const contractMarkets = await fcl.query({
        cadence: getActiveMarketsScript,
      });

      // --- USE UNIVERSAL TRANSFORMER ---
      const transformedMarkets: Market[] = (contractMarkets || []).map(
        transformMarketData,
      );
      // --- END ---

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

  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = markets;
    const now = Date.now() / 1000;

    // Search filter - Checks title, description, and options
    if (searchQuery) {
      filtered = filtered.filter((market) => {
        // 'market' is correct here
        const query = searchQuery.toLowerCase();
        // Use the 'options' array if it exists, otherwise fallback to A/B
        const optionsString =
          market.options && market.options.length > 0
            ? market.options.join(" ").toLowerCase()
            : `${market.optionA?.toLowerCase() || ""} ${market.optionB?.toLowerCase() || ""}`; // Fallback

        return (
          market.title.toLowerCase().includes(query) ||
          market.description.toLowerCase().includes(query) ||
          optionsString.includes(query)
        );
      });
    }

    // Tab filter logic
    switch (activeTab) {
      case "active":
        filtered = filtered.filter(
          (market) =>
            market.status === MarketStatus.Active &&
            parseFloat(market.endTime) > now,
        );
        break;
      case "pending":
        filtered = filtered.filter(
          (market) =>
            (market.status === MarketStatus.Active &&
              parseFloat(market.endTime) <= now) ||
            market.status === MarketStatus.PendingResolution, // Ensure PendingResolution is included
        );
        break;
      case "resolved":
        filtered = filtered.filter(
          (market) => market.status === MarketStatus.Resolved,
        );
        break;
      case "trending":
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

    // Sort
    if (activeTab !== "trending") {
      filtered.sort((a, b) => {
        // 'a' and 'b' are correct here
        switch (sortBy) {
          case "newest":
            return parseFloat(b.createdAt) - parseFloat(a.createdAt);
          case "ending":
            return parseFloat(a.endTime) - parseFloat(b.endTime);
          case "volume":
            return parseFloat(b.totalPool) - parseFloat(a.totalPool);
          case "popular":
            // Use totalShares array if available, otherwise fallback to A/B
            const aShares =
              a.options && a.options.length > 0 // <-- Corrected: Use 'a'
                ? sumShares(a.totalShares || [])
                : parseFloat(a.totalOptionAShares || "0") +
                  parseFloat(a.totalOptionBShares || "0");
            const bShares =
              b.options && b.options.length > 0 // <-- Corrected: Use 'b'
                ? sumShares(b.totalShares || [])
                : parseFloat(b.totalOptionAShares || "0") +
                  parseFloat(b.totalOptionBShares || "0");
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

  // Market counts (remains the same logic)
  const marketCounts = useMemo(() => {
    // ... (logic using status and endTime remains the same) ...
    const now = Date.now() / 1000;
    return {
      active: markets.filter(
        (m) => m.status === MarketStatus.Active && parseFloat(m.endTime) > now,
      ).length,
      pending: markets.filter(
        (m) =>
          (m.status === MarketStatus.Active && parseFloat(m.endTime) <= now) ||
          m.status === MarketStatus.PendingResolution, // Include PendingResolution
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

  // Market stats (remains the same logic)
  const marketStats = useMemo(() => {
    // ... (logic using status, endTime, totalPool remains the same) ...
    const now = Date.now() / 1000;
    const activeMarketsList = markets.filter(
      (m) => m.status === MarketStatus.Active && parseFloat(m.endTime) > now,
    );
    const totalVolume = markets.reduce(
      (sum, m) => sum + parseFloat(m.totalPool || "0"),
      0,
    );
    const avgVolume = markets.length > 0 ? totalVolume / markets.length : 0;
    const pendingMarketsCount = markets.filter(
      (m) =>
        (m.status === MarketStatus.Active && parseFloat(m.endTime) <= now) ||
        m.status === MarketStatus.PendingResolution, // Include PendingResolution
    ).length;

    return {
      active: activeMarketsList.length,
      totalVolume,
      avgVolume,
      endingSoon: pendingMarketsCount,
    };
  }, [markets]);

  // Filter handlers (no change)
  const handleCategoryChange = (category: "all" | MarketCategory) => {
    setSelectedCategory(category);
  };
  const handleStatusChange = (status: "all" | MarketStatus) => {
    setSelectedStatus(status);
  };

  // Reset filters (no change)
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSortBy("newest");
    setActiveTab("active");
  };

  // Combined refetch function
  // Removed references to useFlowUpdate fetches unless confirmed needed
  const refetch = useCallback(async () => {
    await fetchMarkets();
    // Potentially add other fetches if needed
  }, [fetchMarkets]);

  useEffect(() => {
    refetch(); // Initial fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return {
    // Data
    markets, // Raw markets (transformed)
    filteredAndSortedMarkets,
    marketStats,
    marketCounts,
    platformStats,
    loading,
    error,

    // Filter states & setters
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    showFilters,
    setShowFilters,
    sortBy,
    setSortBy,
    selectedCategory,
    handleCategoryChange,
    selectedStatus,
    handleStatusChange,

    // Actions
    refetch: fetchMarkets, // Primary refetch
    fetchActiveMarkets,
    handleResetFilters,
    refetchAll: refetch, // Combined refetch
  };
}
