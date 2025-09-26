export interface FlowArgument {
  value: any;
  type: string;
}


export interface FlowAccountKey {
  index: number;
  publicKey: string;
  signAlgo: number;
  hashAlgo: number;
  weight: number;
  sequenceNumber: number;
  revoked: boolean;
}


export interface FlowEvent {
  type: string;
  transactionId: string;
  transactionIndex: number;
  eventIndex: number;
  data: any;
}


export interface FCLUser {
  addr: string | null;
  cid: string | null;
  loggedIn: boolean | null;
  expiresAt: number | null;
  services: FCLService[];
}

export interface FCLService {
  f_type: string;
  f_vsn: string;
  type: string;
  method: string;
  endpoint: string;
  uid: string;
  id: string;
  identity: {
    address: string;
    keyId: number;
  };
  provider: {
    address: string | null;
    name: string;
    icon: string | null;
    description: string;
  };
}

export interface FCLConfig {
  accessNode: string;
  discoveryWallet: string;
  appIdentifier: string;
  walletConnectProjectId?: string;
}


export interface CadenceValue {
  type: string;
  value: any;
}

export interface CadenceStruct extends CadenceValue {
  type: 'Struct';
  value: {
    id: string;
    fields: CadenceField[];
  };
}

export interface CadenceField {
  name: string;
  value: CadenceValue;
}

export interface CadenceArray extends CadenceValue {
  type: 'Array';
  value: CadenceValue[];
}

export interface CadenceOptional extends CadenceValue {
  type: 'Optional';
  value: CadenceValue | null;
}

export interface CadenceDictionary extends CadenceValue {
  type: 'Dictionary';
  value: Array<{
    key: CadenceValue;
    value: CadenceValue;
  }>;
}


export interface FlowTransaction {
  cadence: string;
  args: FlowArgument[];
  gasLimit: number;
  proposer?: FlowAuthorization;
  authorizations: FlowAuthorization[];
  payer?: FlowAuthorization;
}

export interface FlowAuthorization {
  address: string;
  keyId: number;
  sequenceNum: number;
}

export interface FlowScript {
  cadence: string;
  args: FlowArgument[];
}


export interface CadenceMarket {
  id: string;
  creator: string;
  question: string;
  optionA: string;
  optionB: string;
  category: number;
  imageURI: string;
  endTime: string;
  creationTime: string;
  outcome: number;
  totalOptionAShares: string;
  totalOptionBShares: string;
  resolved: boolean;
  status: number;
  totalPool: string;
  isBreakingNews: boolean;
  minBet: string;
  maxBet: string;
}

export interface CadenceUserStats {
  address: string;
  totalWinnings: string;
  totalBets: string;
  winCount: string;
  currentStreak: string;
  longestStreak: string;
  totalFeesPaid: string;
  totalInvested: string;
}

export interface CadenceUserPosition {
  marketId: string;
  userAddress: string;
  isOptionA: boolean;
  shares: string;
  amountInvested: string;
  timestamp: string;
  claimed: boolean;
}


export interface FlowEventType {
  MarketCreated: {
    marketId: string;
    creator: string;
    question: string;
    optionA: string;
    optionB: string;
    category: number;
    endTime: string;
    isBreakingNews: boolean;
  };
  SharesPurchased: {
    marketId: string;
    buyer: string;
    isOptionA: boolean;
    shares: string;
    amount: string;
    newOdds: Record<string, string>;
  };
  MarketResolved: {
    marketId: string;
    outcome: number;
    totalPool: string;
    winningOption: string;
  };
  WinningsClaimed: {
    marketId: string;
    user: string;
    amount: string;
    fees: string;
  };
  UserProfileCreated: {
    address: string;
  };
  MarketCancelled: {
    marketId: string;
    reason: string;
  };
}

export type FlowEventName = keyof FlowEventType;

export interface ParsedFlowEvent<T extends FlowEventName = FlowEventName> {
  type: T;
  transactionId: string;
  transactionIndex: number;
  eventIndex: number;
  blockId: string;
  blockHeight: number;
  data: FlowEventType[T];
}


export interface ContractAddresses {
  FlowWager: string;
  MarketFactory?: string;
  UserRegistry?: string;
  FlowToken: string;
  FungibleToken: string;
}

export interface StoragePaths {
  FlowWagerAdmin: string;
  UserProfile: string;
  UserProfilePublic: string;
}

// Flow network configuration
export interface FlowNetwork {
  name: 'mainnet' | 'testnet' | 'emulator';
  accessNode: string;
  blockExplorer: string;
  contracts: ContractAddresses;
  chainId: string;
}

// Transaction building utilities
export interface TransactionTemplate {
  name: string;
  cadence: string;
  args: Array<{
    name: string;
    type: string;
    description: string;
    optional?: boolean;
  }>;
  gasLimit: number;
  description: string;
}

export interface ScriptTemplate {
  name: string;
  cadence: string;
  args: Array<{
    name: string;
    type: string;
    description: string;
    optional?: boolean;
  }>;
  returnType: string;
  description: string;
}

// Error handling
export interface FlowError {
  code: number;
  message: string;
  data?: any;
}

export interface CadenceError extends FlowError {
  cadenceTrace?: string[];
  location?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

// Flow account information
export interface FlowAccountInfo {
  address: string;
  balance: string;
  code: string;
  keys: FlowAccountKey[];
  contracts: Record<string, string>;
  storage: {
    used: string;
    available: string;
  };
}

// Block information
export interface FlowBlock {
  id: string;
  parentId: string;
  height: number;
  timestamp: string;
  collectionGuarantees: FlowCollectionGuarantee[];
  blockSeals: FlowBlockSeal[];
  signatures: string[];
}

export interface FlowCollectionGuarantee {
  collectionId: string;
  signatures: string[];
}

export interface FlowBlockSeal {
  blockId: string;
  executionReceiptId: string;
  executionReceiptSignatures: string[];
  resultApprovalSignatures: string[];
}

// Transaction execution results
export interface FlowTransactionResult {
  status: number;
  statusString: string;
  statusCode: number;
  errorMessage: string;
  events: FlowEvent[];
  blockId: string;
  blockHeight: number;
  gasUsed: number;
  computation?: number;
}

// Collection information
export interface FlowCollection {
  id: string;
  transactionIds: string[];
}

// Utility types for type conversion
export type CadenceToTypeScript<T> = T extends string
  ? T extends `${infer N extends number}`
    ? number
    : T extends 'true' | 'false'
    ? boolean
    : string
  : T extends boolean
  ? boolean
  : T extends Array<infer U>
  ? Array<CadenceToTypeScript<U>>
  : T extends Record<string, any>
  ? { [K in keyof T]: CadenceToTypeScript<T[K]> }
  : T;

// Hooks and utilities return types
export interface UseFlowTransactionState {
  isLoading: boolean;
  error: FlowError | null;
  txId: string | null;
  status: FlowTransactionResult['statusString'] | null;
  events: FlowEvent[];
}

export interface UseFlowAccountState {
  account: FlowAccountInfo | null;
  isLoading: boolean;
  error: FlowError | null;
  refetch: () => Promise<void>;
}

export interface UseFlowScriptState<T> {
  data: T | null;
  isLoading: boolean;
  error: FlowError | null;
  refetch: () => Promise<void>;
}