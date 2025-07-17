/* eslint-disable @typescript-eslint/no-explicit-any */
import { Market } from "@/types/market";
import { safeToNumber, safeToString } from "../utils";

// Transform function that matches your contract's Market struct exactly
export const transformMarketData = (rawMarket: any): Market => {
  console.log("🔄 Transforming market data:", rawMarket);

  const transformedMarket: Market = {
    // Contract fields - exact mapping
    id: safeToString(rawMarket.id),
    title: rawMarket.title || "",
    description: rawMarket.description || "",
    category: safeToNumber(rawMarket.category, 0),
    optionA: rawMarket.optionA || "",
    optionB: rawMarket.optionB || "",
    creator: rawMarket.creator || "",
    createdAt: safeToString(rawMarket.createdAt),
    endTime: safeToString(rawMarket.endTime),
    minBet: safeToString(rawMarket.minBet) || "0",
    maxBet: safeToString(rawMarket.maxBet) || "0",
    status: safeToNumber(rawMarket.status, 0),
    outcome:
      rawMarket.outcome !== null && rawMarket.outcome !== undefined
        ? safeToNumber(rawMarket.outcome)
        : null,
    resolved: Boolean(rawMarket.resolved),
    totalOptionAShares: safeToString(rawMarket.totalOptionAShares) || "0",
    totalOptionBShares: safeToString(rawMarket.totalOptionBShares) || "0",
    totalPool: safeToString(rawMarket.totalPool) || "0",
    // Contract has imageUrl field - use it directly
    imageURI: rawMarket.imageUrl || "", // Maps contract's imageUrl to frontend's imageURI
  };

  console.log(
    "✅ Transformed market with imageUrl from contract:",
    transformedMarket
  );
  return transformedMarket;
};

// Calculate platform stats from markets
export const calculatePlatformStats = (
  allMarkets: Market[],
  activeMarkets: Market[]
) => {
  if (!allMarkets || allMarkets.length === 0) {
    return {
      totalMarkets: 0,
      activeMarkets: 0,
      totalVolume: "0",
      totalUsers: 0,
    };
  }

  const totalMarkets = allMarkets.length;
  const activeMarketsCount = activeMarkets.length;
  const totalVolume = allMarkets.reduce(
    (sum, m) => sum + parseFloat(m.totalPool || "0"),
    0
  );

  // Estimate unique users from market creators
  const uniqueCreators = new Set(allMarkets.map((m) => m.creator)).size;
  const totalUsers = uniqueCreators;

  console.log("📊 Platform stats calculated:", {
    totalMarkets,
    activeMarkets: activeMarketsCount,
    totalVolume: totalVolume.toFixed(2),
    totalUsers,
  });

  return {
    totalMarkets,
    activeMarkets: activeMarketsCount,
    totalVolume: totalVolume.toFixed(2),
    totalUsers,
  };
};

// Process featured markets from active markets
export const processFeaturedMarkets = (
  activeMarkets: Market[],
  limit: number = 6
): Market[] => {
  console.log(
    "🔄 Processing featured markets from active markets:",
    activeMarkets
  );

  if (activeMarkets && activeMarkets.length > 0) {
    // Get featured markets (active markets sorted by engagement)
    const featured = activeMarkets
      .sort((a, b) => {
        // Sort by pool size first, then by creation time
        const poolDiff =
          parseFloat(b.totalPool || "0") - parseFloat(a.totalPool || "0");
        if (poolDiff !== 0) return poolDiff;
        return parseFloat(b.createdAt || "0") - parseFloat(a.createdAt || "0");
      })
      .slice(0, limit);

    console.log("✨ Featured markets set:", featured);
    return featured;
  } else {
    console.log("📭 No active markets, clearing featured markets");
    return [];
  }
};
