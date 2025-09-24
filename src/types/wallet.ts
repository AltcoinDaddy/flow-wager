
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number;
  isLoading: boolean;
  error: string | null;
  walletProvider: WalletProvider | null;
}

export interface WalletProvider {
  name: string;
  icon: string;
  id: string;
  type: 'extension' | 'mobile' | 'hardware';
  supported: boolean;
}

export interface ConnectedWallet {
  address: string;
  balance: number;
  provider: WalletProvider;
  capabilities: WalletCapabilities;
}

export interface WalletCapabilities {
  signTransactions: boolean;
  signMessages: boolean;
  multiSign: boolean;
  hardwareWallet: boolean;
}

// Transaction types
export interface TransactionStatus {
  status: 'pending' | 'sealed' | 'executed' | 'failed';
  txId: string;
  errorMessage?: string;
  events?: FlowEvent[];
  blockId?: string;
  blockHeight?: number;
}

export interface TransactionRequest {
  cadence: string;
  args: FlowArgument[];
  gasLimit: number;
  proposer?: string;
  authorizers?: string[];
  payer?: string;
}

export interface FlowArgument {
  value: any;
  type: string;
}

export interface FlowEvent {
  type: string;
  transactionId: string;
  transactionIndex: number;
  eventIndex: number;
  data: any;
}

// Specific transaction types for FlowWager
export interface BuySharesTransaction {
  marketId: number;
  isOptionA: boolean;
  amount: number;
}

export interface CreateMarketTransaction {
  question: string;
  optionA: string;
  optionB: string;
  category: number; // enum value
  imageURI: string;
  duration: number;
  isBreakingNews: boolean;
  minBet: number;
  maxBet: number;
}

export interface ResolveMarketTransaction {
  marketId: number;
  outcome: number; // enum value
}

export interface ClaimWinningsTransaction {
  marketId: number;
}

// Script query types
export interface ScriptRequest {
  cadence: string;
  args: FlowArgument[];
}

export interface ScriptResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Wallet connection flow
export interface WalletConnectionRequest {
  provider: WalletProvider;
  redirectUrl?: string;
}

export interface WalletConnectionResponse {
  success: boolean;
  address?: string;
  error?: string;
  signature?: string;
}

// Account information
export interface FlowAccount {
  address: string;
  balance: number;
  keys: FlowAccountKey[];
  contracts: { [name: string]: FlowContract };
  storage: {
    used: number;
    available: number;
  };
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

export interface FlowContract {
  name: string;
  code: string;
}

// Transaction history
export interface TransactionHistoryItem {
  id: string;
  txId: string;
  type: 'buy_shares' | 'create_market' | 'resolve_market' | 'claim_winnings' | 'other';
  status: TransactionStatus['status'];
  timestamp: number;
  amount?: number;
  marketId?: number;
  marketQuestion?: string;
  option?: 'A' | 'B';
  gasUsed: number;
  fees: number;
  blockHeight?: number;
  errorMessage?: string;
}

// Wallet security
export interface WalletSecurity {
  requireConfirmation: boolean;
  sessionTimeout: number; // in minutes
  autoLock: boolean;
  biometricEnabled?: boolean;
  pinEnabled?: boolean;
}

// Multi-signature support
export interface MultiSigProposal {
  id: string;
  proposer: string;
  transaction: TransactionRequest;
  signatures: MultiSigSignature[];
  requiredSignatures: number;
  status: 'pending' | 'approved' | 'executed' | 'rejected';
  createdAt: number;
  expiresAt: number;
}

export interface MultiSigSignature {
  signer: string;
  signature: string;
  timestamp: number;
}

// Wallet errors
export interface WalletError {
  code: string;
  message: string;
  details?: any;
}

export const WalletErrorCodes = {
  USER_REJECTED: 'USER_REJECTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  UNSUPPORTED_METHOD: 'UNSUPPORTED_METHOD',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  GAS_LIMIT_EXCEEDED: 'GAS_LIMIT_EXCEEDED',
} as const;

export type WalletErrorCode = typeof WalletErrorCodes[keyof typeof WalletErrorCodes];