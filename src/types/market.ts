// src/types/market.ts
// Market-related type definitions
export interface Market {
  id: number | any;
  creator: string;
  question: string;
  description?: string
  optionA: string;
  optionB: string;
  category: MarketCategory | string;
  imageURI: string;
  endTime: number;
  creationTime: number;
  outcome: MarketOutcome | string;
  totalOptionAShares: number;
  totalOptionBShares: number;
  resolved: boolean;
  status: MarketStatus | string;
  totalPool: number;
  isBreakingNews: boolean;
  minBet: number;
  maxBet: number;
}

export interface MarketMetadata {
  ipfsHash?: string;
  source?: string;
  rules?: string;
  additionalInfo?: string;
}

export enum MarketStatus {
  Active = "Active",
  Closed = "Closed", 
  Resolved = "Resolved",
  Cancelled = "Cancelled"
}

export enum MarketOutcome {
  Unresolved = "Unresolved",
  OptionA = "OptionA",
  OptionB = "OptionB",
  Cancelled = "Cancelled"
}

export enum MarketCategory {
  Sports = "Sports",
  Politics = "Politics", 
  Entertainment = "Entertainment",
  Technology = "Technology",
  Economics = "Economics",
  Science = "Science",
  Other = "Other"
}

export interface Position {
  id: string;
  marketId: number;
  user: string;
  side: "optionA" | "optionB";
  shares: number;
  averagePrice: number;
  totalCost: number;
  currentValue: number;
  pnl: number;
  createdAt: number;
}

export interface MarketFilter {
  category?: MarketCategory;
  status?: MarketStatus;
  search?: string;
  sortBy?: "volume" | "endTime" | "creationTime" | "activity";
  sortOrder?: "asc" | "desc";
  isBreakingNews?: boolean;
}

export interface BetParams {
  marketId: number;
  side: "optionA" | "optionB";
  amount: number;
  expectedShares?: number;
  slippage?: number;
}

export interface MarketOdds {
  optionA: number;
  optionB: number;
}

export interface MarketFilters {
  category?: MarketCategory | 'ALL';
  status?: MarketStatus;
  search?: string;
  isBreakingNews?: boolean;
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
  question: string;
  optionA: string;
  optionB: string;
  category: MarketCategory;
  imageFile?: File;
  imageURI?: string;
  duration: number; // in hours
  isBreakingNews: boolean;
  minBet: number;
  maxBet: number;
}

export interface ResolveMarketRequest {
  marketId: number;
  outcome: MarketOutcome;
  reason?: string;
}

export interface CancelMarketRequest {
  marketId: number;
  reason: string;
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
  marketId: number;
  type: 'bet_placed' | 'market_created' | 'market_resolved' | 'winnings_claimed';
  user: string;
  timestamp: number;
  data: {
    amount?: number;
    option?: 'A' | 'B';
    outcome?: MarketOutcome;
    [key: string]: any;
  };
}