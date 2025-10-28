export interface Market {
  id: string; // UInt64 as string
  title: string;
  description: string;
  category: MarketCategory; // Raw enum value (number)
  options: string[]; // Descriptions for each outcome option
  totalShares: string[]; // UFix64 string array - shares per option
  winningOption?: number; // Optional index of the winning option
  creator: string; // Address as string
  createdAt: string; // UFix64 timestamp as string
  endTime: string; // UFix64 timestamp as string
  minBet: string; // UFix64 as string
  maxBet: string; // UFix64 as string
  status: MarketStatus; // Raw enum value (number)
  resolved: boolean;
  totalPool: string; // UFix64 total FLOW in the market pool
  imageUrl?: string; // Optional image URL
  // Optional fields
  totalBets?: number;
  totalParticipants?: number;

  // --- Deprecated fields (remove if not needed for compatibility) ---
  optionA?: string;
  optionB?: string;
  totalOptionAShares?: string;
  totalOptionBShares?: string;
  outcome?: number | null; // Use winningOption instead
}

export interface MarketMetadata {
  ipfsHash?: string;
  source?: string;
  rules?: string;
  additionalInfo?: string;
}

// --- ENUMS ---

/**
 * Represents the possible states of a market.
 * Aligned with FlowWagerV2.MarketStatus enum.
 */
export enum MarketStatus {
  Active = 0,
  PendingResolution = 1, // Updated from Pending
  Resolved = 2,
  Cancelled = 3, // Added
}

/**
 * Represents the categories for markets.
 * Aligned with FlowWagerV2.MarketCategory enum.
 */
export enum MarketCategory {
  Sports = 0,
  Entertainment = 1,
  Technology = 2,
  Economics = 3,
  Weather = 4,
  Crypto = 5,
  Politics = 6,
  BreakingNews = 7,
  Other = 8,
}

// --- CORE INTERFACES ---

/**
 * Represents a prediction market data structure from FlowWagerV2.
 */
export interface Market {
  id: string; // UInt64 as string
  title: string;
  description: string;
  category: MarketCategory; // Raw enum value (number)
  options: string[]; // Descriptions for each outcome option
  totalShares: string[]; // UFix64 string array - shares per option
  winningOption?: number; // Optional index of the winning option
  creator: string; // Address as string
  createdAt: string; // UFix64 timestamp as string
  endTime: string; // UFix64 timestamp as string
  minBet: string; // UFix64 as string
  maxBet: string; // UFix64 as string
  status: MarketStatus; // Raw enum value (number)
  resolved: boolean;
  totalPool: string; // UFix64 total FLOW in the market pool
  imageUrl?: string; // Optional image URL
  // Optional fields, might need separate fetching if not directly on Market struct
  totalBets?: number;
  totalParticipants?: number;
}

/**
 * Represents a user's position (bets) in a specific market.
 * Aligned with FlowWagerV2.UserPosition struct.
 */
export interface Position {
  marketId: string; // UInt64 as string
  optionShares: string[]; // UFix64 string array - shares user holds per option
  totalInvested: string; // UFix64 total FLOW user invested in this market
  averagePrice: string; // UFix64 average price paid per share
  claimed: boolean; // Whether winnings have been claimed
  createdAt: string; // UFix64 timestamp as string when position was created/updated
}

/**
 * Represents platform-wide statistics.
 * Aligned with FlowWagerV2.PlatformStats struct.
 */
export interface PlatformStats {
  totalMarkets: number; // UInt64
  activeMarkets: number; // UInt64
  pendingResolutionMarkets: number; // UInt64 - Added
  totalUsers: number; // UInt64
  totalVolume: string; // UFix64 total volume traded
  totalFees: string; // UFix64 total fees collected
  availableFeesForWithdrawal: string; // UFix64 fees available for admin
}

// --- ACTION PARAMETERS ---

/**
 * Parameters needed to place a bet.
 */
export interface BetParams {
  marketId: string; // UInt64 as string
  optionIndex: number; // Index of the chosen option (UInt8)
  amount: string; // UFix64 bet amount as string
}

/**
 * Parameters needed to create a new market.
 */
export interface CreateMarketRequest {
  title: string;
  description: string;
  options: string[]; // Array of option descriptions
  category: MarketCategory; // Raw enum value
  endTime: string; // UFix64 timestamp as string
  minBet: string; // UFix64 as string
  maxBet: string; // UFix64 as string
  imageUrl?: string; // Optional image URL
}

/**
 * Parameters needed for an admin to resolve a market.
 */
export interface ResolveMarketRequest {
  marketId: string; // UInt64 as string
  winningOptionIndex: number; // Index of the winning option (UInt8)
  justification: string;
}

/**
 * Parameters needed for a market creator to submit resolution evidence.
 */
export interface SubmitEvidenceRequest {
  marketId: string; // UInt64 as string
  evidence: string;
  requestedWinningOption: number; // Index of the option requested (UInt8)
}

// --- UI / HELPER TYPES ---

/**
 * Represents calculated odds for each option in a market.
 * This needs calculation based on totalShares and totalPool.
 */
export interface MarketOdds {
  odds: number[]; // Array of odds corresponding to each option
}

/**
 * Filtering options for displaying markets.
 */
export interface MarketFilters {
  category?: MarketCategory | "ALL";
  status?: MarketStatus | "ALL"; // Allow filtering by specific status
  search?: string;
  sortBy?: "newest" | "ending" | "volume" | "popular"; // Removed 'ending_soon', 'pool_size', added 'ending'
  sortOrder?: "asc" | "desc";
}

/**
 * Pagination details for market lists.
 */
export interface MarketPagination {
  page: number;
  limit: number;
  total: number; // Total number of markets matching filters
  pages: number; // Total number of pages
}

/**
 * Structure for API responses returning lists of markets.
 */
export interface MarketResponse {
  markets: Market[];
  pagination: MarketPagination;
}

// Optional: Represents additional off-chain metadata for a market
export interface MarketMetadata {
  ipfsHash?: string;
  source?: string; // Link to resolution source
  rules?: string;
  additionalInfo?: string;
}

// Market chart data for visualizations (Generalized)
export interface MarketChartDataPoint {
  timestamp: number; // Unix timestamp
  pricesPerOption: number[]; // Price for each option at this time
  sharesPerOption: number[]; // Total shares for each option at this time
  volume: number; // Volume traded in this interval
}

// Market activity/events (Generalized)
export interface MarketActivity {
  id: string; // Unique event ID
  marketId: string; // UInt64 as string
  type:
    | "SharesPurchased" // Corresponds to contract event
    | "MarketCreated"
    | "MarketResolved"
    | "WinningsClaimed"
    | "EvidenceSubmitted"; // Added event
  user: string; // Address of user involved
  timestamp: number; // Unix timestamp of the event
  data: {
    amount?: string; // UFix64 string (e.g., bet amount, payout amount)
    optionIndex?: number; // Index of the option involved
    winningOption?: number; // Index of winning option (for Resolved event)
    shares?: string; // UFix64 string (shares purchased)
    justification?: string; // For Resolved event
    evidence?: string; // For EvidenceSubmitted event
    [key: string]: any; // Allow other event-specific data
  };
}

// --- UTILITY TYPES ---
export type MarketId = string;
export type Address = string;
export type UFix64String = string;
export type UInt64String = string;

// --- LABELS ---

export const MarketStatusLabels = {
  [MarketStatus.Active]: "Active",
  [MarketStatus.PendingResolution]: "Pending", // Updated label
  [MarketStatus.Resolved]: "Resolved",
  [MarketStatus.Cancelled]: "Cancelled", // Added label
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
  [MarketCategory.Other]: "Other",
} as const;

// MarketOutcome enum and labels are removed as they are less relevant with indexed options.
