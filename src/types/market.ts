
export interface Market {
   id: string;
  title: string;
  description: string;
  category: number;
  optionA: string;
  optionB: string;
  creator: string;
  createdAt: string;
  endTime: string;
  minBet: string;
  maxBet: string;
  status: number;
  outcome: number | null;
  resolved: boolean;
  totalOptionAShares: string;
  totalOptionBShares: string;
  totalPool: string;
  imageURI?: string; 
  totalBets?: number;
  totalParticipants?: number;
  imageUrl?: string      
}

export interface MarketMetadata {
  ipfsHash?: string;
  source?: string;
  rules?: string;
  additionalInfo?: string;
}

export enum MarketStatus {
  Active = 0,
  Paused = 1,
  Resolved = 2,
  Cancelled = 3
}

export enum MarketOutcome {
  OptionA = 0,
  OptionB = 1,
  Draw = 2,
  Cancelled = 3
}

export enum MarketCategory {
  Sports = 0,
  Entertainment = 1,
  Technology = 2,
  Economics = 3,
  Weather = 4,
  Crypto = 5,
  Politics = 6,
  BreakingNews = 7,
  Other = 8
}

// String mappings for display purposes
export const MarketStatusLabels = {
  [MarketStatus.Active]: "Active",
  [MarketStatus.Paused]: "Paused",
  [MarketStatus.Resolved]: "Resolved",
  [MarketStatus.Cancelled]: "Cancelled"
} as const;

export const MarketOutcomeLabels = {
  [MarketOutcome.OptionA]: "Option A",
  [MarketOutcome.OptionB]: "Option B",
  [MarketOutcome.Draw]: "Draw",
  [MarketOutcome.Cancelled]: "Cancelled"
} as const;

export const MarketCategoryLabels = {
  [MarketCategory.Sports]: "Sports",
  [MarketCategory.Entertainment]: "Entertainment",
  [MarketCategory.Technology]: "Technology",
  [MarketCategory.Economics]: "Economics",
  [MarketCategory.Weather]: "Weather",
  [MarketCategory.Crypto]: "Crypto",
  [MarketCategory.Politics]: "Politics",
  [MarketCategory.BreakingNews]: "Breaking News",
  [MarketCategory.Other]: "Other"
} as const;

// Position interface aligned with contract UserPosition struct
export interface Position {
  marketId: string;              // UInt64 as string
  optionAShares: string;         // UFix64 as string
  optionBShares: string;         // UFix64 as string
  totalInvested: string;         // UFix64 as string
  averagePrice: string;          // UFix64 as string
  claimed: boolean;              // Bool from contract
}

export interface MarketFilter {
  category?: MarketCategory;
  status?: MarketStatus;
  search?: string;
  sortBy?: "volume" | "endTime" | "createdAt" | "activity";
  sortOrder?: "asc" | "desc";
}

export interface BetParams {
  marketId: string;              // UInt64 as string
  option: number;                // 0 for optionA, 1 for optionB (UInt8)
  amount: string;                // UFix64 as string
}

export interface MarketOdds {
  optionA: number;
  optionB: number;
}

export interface MarketFilters {
  category?: MarketCategory | 'ALL';
  status?: MarketStatus;
  search?: string;
  sortBy?: 'newest' | 'ending_soon' | 'popular' | 'pool_size';
  sortOrder?: 'asc' | 'desc';
}

export interface MarketPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface MarketResponse {
  markets: Market[];
  pagination: MarketPagination;
}

export interface CreateMarketRequest {
  title: string;                 // Contract uses 'title'
  description: string;           // Contract field
  optionA: string;
  optionB: string;
  category: MarketCategory;
  endTime: string;               // UFix64 timestamp
  minBet: string;                // UFix64
  maxBet: string;                // UFix64
}

export interface ResolveMarketRequest {
  marketId: string;              // UInt64 as string
  outcome: MarketOutcome;
}

// Market chart data for visualizations
export interface MarketChartData {
  timestamp: number;
  optionAPrice: number;
  optionBPrice: number;
  volume: number;
  optionAShares: number;
  optionBShares: number;
}

// Market activity/events
export interface MarketActivity {
  id: string;
  marketId: string;              // UInt64 as string
  type: 'shares_purchased' | 'market_created' | 'market_resolved' | 'winnings_claimed';
  user: string;
  timestamp: number;
  data: {
    amount?: string;             // UFix64 as string
    option?: number;             // 0 or 1
    outcome?: MarketOutcome;
    shares?: string;             // UFix64 as string
    [key: string]: any;
  };
}

// Utility type helpers
export type MarketId = string;
export type Address = string;
export type UFix64String = string;
export type UInt64String = string;

// Platform statistics interface
export interface PlatformStats {
  totalMarkets: number;
  activeMarkets: number;
  totalUsers: number;
  totalVolume: string;
  totalFees: string;
}