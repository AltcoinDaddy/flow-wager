// src/types/market.ts
// Market-related type definitions

export enum MarketCategory {
  BREAKING_NEWS = 'BREAKING_NEWS',
  POLITICS = 'POLITICS',
  SPORTS = 'SPORTS',
  CRYPTO = 'CRYPTO',
  TECH = 'TECH',
  CULTURE = 'CULTURE',
  WORLD = 'WORLD',
  ECONOMY = 'ECONOMY',
  ELECTIONS = 'ELECTIONS'
}

export enum MarketStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED'
}

export enum MarketOutcome {
  UNRESOLVED = 'UNRESOLVED',
  OPTION_A = 'OPTION_A',
  OPTION_B = 'OPTION_B'
}

export interface Market {
  id: number;
  creator: string;
  question: string;
  optionA: string;
  optionB: string;
  category: MarketCategory;
  imageURI: string;
  endTime: number;
  creationTime: number;
  outcome: MarketOutcome;
  totalOptionAShares: number;
  totalOptionBShares: number;
  resolved: boolean;
  status: MarketStatus;
  totalPool: number;
  isBreakingNews: boolean;
  minBet: number;
  maxBet: number;
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