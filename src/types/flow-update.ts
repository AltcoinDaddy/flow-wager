import { FlowUpdateScripts as  FLOWUPDATE_SCRIPTS} from "@/lib/flow-update";

export enum MultiMarketStatus {
  Active = 0,
  Paused = 1,
  Resolved = 2,
}

export enum MultiMarketCategory {
  Sports = 0,
  Politics = 1,
  Entertainment = 2,
  Crypto = 3,
  Other = 4,
}

// Interfaces for Cadence structs
export interface MultiOptionMarket {
  id: number;
  title: string;
  description: string;
  options: string[];
  maxOptions: number;
  creator: string;
  endTime: number;
  minBet: number;
  maxBet: number;
  totalPool: number;
  totalShares: number[];
  status: MultiMarketStatus;
  resolved: boolean;
  winningOption?: number;
  imageUrl: string;
  category: MultiMarketCategory;
}

export interface UserMultiOptionPosition {
  marketId: number;
  marketTitle: string;
  marketDescription: string;
  options: string[];
  optionShares: number[];
  totalInvested: number;
  claimed: boolean;
  endTime: number;
  status: number;
  resolved: boolean;
  winningOption?: number;
}

export interface ActiveMultiOptionPosition {
  marketId: number;
  marketTitle: string;
  options: string[];
  optionShares: number[];
  totalInvested: number;
  endTime: number;
}

export interface ClaimableMultiOptionWinnings {
  marketId: number;
  marketTitle: string;
  amount: number;
  winningOption: number;
  userWinningShares: number;
}

export interface CreatorMarketInfo {
  marketId: number;
  title: string;
  optionCount: number;
  status: number;
  resolved: boolean;
  endTime: number;
  totalPool: number;
  winningOption?: number;
}

export interface PendingMultiOptionMarket {
  marketId: number;
  title: string;
  description: string;
  options: string[];
  creator: string;
  endTime: number;
  totalPool: number;
  totalShares: number[];
  daysSinceEnded: number;
}

// Type aliases for script names (from flow-update.ts)
export type FlowUpdateScriptName = keyof typeof FLOWUPDATE_SCRIPTS; // Assuming FLOWUPDATE_SCRIPTS is exported from flow-update.ts
export type FlowUpdateTransactionName =
  | "createMultiOptionMarket"
  | "placeMultiOptionBet"
  | "placeBatchMultiOptionBets"
  | "resolveMultiOptionMarket"
  | "claimMultiOptionWinnings";
export type FlowUpdateQueryName =
  | "getActiveMultiOptionMarkets"
  | "getMultiOptionMarket"
  | "getUserMultiOptionPositions"
  | "getActiveMultiOptionPositions"
  | "getClaimableMultiOptionWinnings"
  | "getMultiOptionContractStats"
  | "getMultiOptionMarketsByCreator"
  | "calculateMultiOptionWinnings"
  | "getPendingMultiOptionMarkets"
  | "hasUserMultiOptionPositions";

// Additional utility types
export interface ContractStats {
  totalMarkets: number;
  activeMarkets: number;
  paused: boolean;
  nextMarketId: number;
}

export interface BatchBet {
  optionIndex: number;
  amount: number;
}