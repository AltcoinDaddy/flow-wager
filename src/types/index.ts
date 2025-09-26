

// Market types
export * from './market';

// User types  
export * from './user';

// Wallet types
export * from './wallet';


// Common utility types
export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  category?: string;
  status?: string;
  dateFrom?: number;
  dateTo?: number;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}


export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}


export type ComponentSize = 'sm' | 'md' | 'lg';
export type ComponentVariant = 'default' | 'outline' | 'ghost' | 'destructive';
export type ComponentColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';


export interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  optionA: string;
  optionB: string;
  creator: string;
  endTime: string;
  minBet: string;
  maxBet: string;
  status: string;
  resolved: boolean;
  totalOptionAShares: string;
  totalOptionBShares: string;
  totalPool: string;
  imageUrl?: string;
  outcome?: string;
}

export interface ResolutionEvidence {
  marketId: string;
  creator: string;
  evidence: string;
  requestedOutcome: string;
  submittedAt: string;
}

export interface PendingMarketDetails {
  market: Market;
  evidence: ResolutionEvidence;
  totalVolume: string;
  participantCount: string;
  daysSinceEnded: string;
  hasEvidence: boolean;
}

export enum MarketOutcome {
  OptionA = 0,
  OptionB = 1,
  Draw = 2,
  Cancelled = 3,
}

export const MarketCategoryLabels: { [key: string]: string } = {
  "0": "Sports",
  "1": "Politics",
  "2": "Entertainment",
  "3": "Finance",
  "4": "Technology",
  "5": "Weather",
  "6": "Other",
};