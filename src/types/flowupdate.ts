// FlowUpdate contract types and interfaces

export enum MultiMarketCategory {
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

export interface MultiOptionMarket {
  id: string;
  title: string;
  description: string;
  category: MultiMarketCategory;
  options: string[];
  creator: string;
  createdAt: number;
  endTime: number;
  minBet: string;
  maxBet: string;
  imageUrl: string;
  status: MarketStatus;
  resolved: boolean;
  winningOptionIndex?: number;
  totalPool: string;
  optionPoolShares: string[];
  platformFeePercentage: string;
}

export interface UserPosition {
  marketId: string;
  shares: string[];
  totalInvested: string;
  createdAt: number;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: MultiMarketCategory;
  options: string[];
  creator: string;
  createdAt: number;
  endTime: number;
  minBet: string;
  maxBet: string;
  imageUrl: string;
  status: MarketStatus;
  resolved: boolean;
  winningOptionIndex?: number;
  totalPool: string;
  optionPoolShares: string[];
  platformFeePercentage: string;
}

export enum MarketStatus {
  Active = 0,
  PendingResolution = 1,
  Resolved = 2,
  Cancelled = 3,
}

export interface PlaceBetArgs {
  marketId: string;
  optionIndex: number;
  amount: string;
}

export interface BatchBetArgs {
  bets: PlaceBetArgs[];
}

export interface CalculatePotentialWinningsArgs {
  marketId: string;
  optionIndex: number;
  shares: string;
}

export interface PotentialWinnings {
  marketId: string;
  optionIndex: number;
  shares: string;
  potentialWinnings: string;
  winProbability: string;
}

export interface UserBetPosition {
  marketId: string;
  marketTitle: string;
  options: string[];
  shares: string[];
  totalInvested: string;
  currentValue: string;
  profitLoss: string;
  status: MarketStatus;
  resolved: boolean;
  winningOptionIndex?: number;
  claimableAmount?: string;
}

export interface ContractStats {
  totalMarketsCreated: string;
  totalActiveMarkets: string;
  totalResolvedMarkets: string;
  totalVolumeTraded: string;
  totalFeesCollected: string;
  platformFeePercentage: string;
}

export interface ResolutionEvidence {
  marketId: string;
  evidence: string;
  submittedBy: string;
  submittedAt: number;
}

export interface ClaimableWinning {
  marketId: string;
  amount: string;
  optionIndex: number;
}

export interface MarketDetailsWithUserPosition extends Market {
  userPosition?: UserPosition;
  claimableWinnings?: string;
  currentValue?: string;
  profitLoss?: string;
}

export interface CreateMultiOptionMarketArgs {
  title: string;
  description: string;
  category: number;
  options: string[];
  endTime: number;
  minBet: string;
  maxBet: string;
  imageUrl: string;
  creationFeeAmount?: string;
}

export interface FlowUpdateTransactionResult {
  transactionId: string;
  status: "sealed" | "executed" | "failed";
  statusCode: number;
  events: TransactionEvent[];
}

export interface TransactionEvent {
  type: string;
  transactionId: string;
  transactionIndex: number;
  eventIndex: number;
  data: Record<string, unknown>;
}

export interface FlowUpdateQueryResult<T> {
  data: T;
  status: "success" | "error";
  error?: string;
}
