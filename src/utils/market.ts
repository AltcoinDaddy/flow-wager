import { Market, MarketCategory, MarketStatus } from "@/types/market";

export interface MarketStats {
  active: number;
  totalVolume: number;
  avgVolume: number;
  endingSoon: number;
}

export interface FilterOptions {
  searchQuery: string;
  activeTab: string;
  selectedCategory: MarketCategory | "all";
  selectedStatus: MarketStatus | "all";
}

export interface SortOptions {
  sortBy: "newest" | "ending" | "volume" | "popular";
}

export const transformContractMarkets = (contractMarkets: any[]): Market[] => {
  return contractMarkets.map((market) => ({
    id: market.id,
    creator: market.creator,
    title: market.title,
    description: market.description,
    optionA: market.optionA,
    optionB: market.optionB,
    category: market.category,
    endTime: market.endTime,
    createdAt: market.createdAt,
    outcome: market.outcome,
    totalOptionAShares: market.totalOptionAShares,
    totalOptionBShares: market.totalOptionBShares,
    resolved: market.resolved,
    status: market.status,
    totalPool: market.totalPool,
    minBet: market.minBet,
    maxBet: market.maxBet,
  }));
};

export const filterMarketsBySearch = (
  markets: Market[],
  searchQuery: string
): Market[] => {
  if (!searchQuery) return markets;

  const query = searchQuery.toLowerCase();
  return markets.filter(
    (market) =>
      market.title.toLowerCase().includes(query) ||
      market.description.toLowerCase().includes(query) ||
      market.optionA.toLowerCase().includes(query) ||
      market.optionB.toLowerCase().includes(query)
  );
};

export const filterMarketsByTab = (
  markets: Market[],
  activeTab: string
): Market[] => {
  switch (activeTab) {
    case "active":
      return markets.filter((market) => market.status === MarketStatus.Active);

    case "ending":
      const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
      return markets.filter(
        (market) =>
          market.status === MarketStatus.Active &&
          parseFloat(market.endTime) * 1000 < sevenDaysFromNow
      );

    case "resolved":
      return markets.filter((market) => market.resolved);

    case "trending":
      return markets.filter((market) => parseFloat(market.totalPool) > 100);

    default:
      return markets;
  }
};

export const filterMarketsByCategory = (
  markets: Market[],
  selectedCategory: MarketCategory | "all"
): Market[] => {
  if (selectedCategory === "all") return markets;
  return markets.filter((market) => market.category === selectedCategory);
};

export const filterMarketsByStatus = (
  markets: Market[],
  selectedStatus: MarketStatus | "all"
): Market[] => {
  if (selectedStatus === "all") return markets;
  return markets.filter((market) => market.status === selectedStatus);
};

export const sortMarkets = (
  markets: Market[],
  sortBy: SortOptions["sortBy"]
): Market[] => {
  return [...markets].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return parseFloat(b.createdAt) - parseFloat(a.createdAt);

      case "ending":
        return parseFloat(a.endTime) - parseFloat(b.endTime);

      case "volume":
        return parseFloat(b.totalPool) - parseFloat(a.totalPool);

      case "popular":
        const aTotal =
          parseFloat(a.totalOptionAShares) + parseFloat(a.totalOptionBShares);
        const bTotal =
          parseFloat(b.totalOptionAShares) + parseFloat(b.totalOptionBShares);
        return bTotal - aTotal;

      default:
        return 0;
    }
  });
};

export const filterAndSortMarkets = (
  markets: Market[],
  filters: FilterOptions,
  sortOptions: SortOptions
): Market[] => {
  let filtered = markets;

  filtered = filterMarketsBySearch(filtered, filters.searchQuery);

  filtered = filterMarketsByTab(filtered, filters.activeTab);

  filtered = filterMarketsByCategory(filtered, filters.selectedCategory);

  filtered = filterMarketsByStatus(filtered, filters.selectedStatus);

  return sortMarkets(filtered, sortOptions.sortBy);
};

export const calculateMarketStats = (markets: Market[]): MarketStats => {
  const active = markets.filter((m) => m.status === MarketStatus.Active).length;
  const totalVolume = markets.reduce(
    (sum, m) => sum + parseFloat(m.totalPool),
    0
  );
  const avgVolume = markets.length > 0 ? totalVolume / markets.length : 0;
  const oneDayFromNow = Date.now() + 24 * 60 * 60 * 1000;
  const endingSoon = markets.filter(
    (m) =>
      m.status === MarketStatus.Active &&
      parseFloat(m.endTime) * 1000 < oneDayFromNow
  ).length;

  return { active, totalVolume, avgVolume, endingSoon };
};

export const getMarketCountsByTab = (markets: Market[]) => {
  const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;

  return {
    all: markets.length,
    active: markets.filter((m) => m.status === MarketStatus.Active).length,
    ending: markets.filter(
      (m) =>
        m.status === MarketStatus.Active &&
        parseFloat(m.endTime) * 1000 < sevenDaysFromNow
    ).length,
    resolved: markets.filter((m) => m.resolved).length,
    trending: markets.filter((m) => parseFloat(m.totalPool) > 100).length,
  };
};

export const resetAllFilters = () => ({
  searchQuery: "",
  selectedCategory: "all" as const,
  selectedStatus: "all" as const,
  activeTab: "all",
});
