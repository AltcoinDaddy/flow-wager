/* eslint-disable @typescript-eslint/no-explicit-any */
import { MarketCategory, MarketStatus } from "@/types/market";

export function formatCurrency(value: string | number, currency = "FLOW"): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(num)) return "0.00 " + currency;
  
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M ${currency}`;
  }
  
  if (Math.abs(num) >= 1000) {
    return `${(num / 1000).toFixed(2)}K ${currency}`;
  }
  
  return `${num.toFixed(2)} ${currency}`;
}

export function formatCompactCurrency(value: string | number, currency = "FLOW"): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(num)) return "0 " + currency;
  
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M ${currency}`;
  }
  
  if (Math.abs(num) >= 1000) {
    return `${(num / 1000).toFixed(1)}K ${currency}`;
  }
  
  return `${num.toFixed(0)} ${currency}`;
}

// Percentage formatting
export function formatPercentage(value: number, decimals = 1): string {
  if (isNaN(value)) return "0%";
  return `${value.toFixed(decimals)}%`;
}

// Price formatting for markets (0-1 range to 0-100¢)
export function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "0¢";
  return `${(num * 100).toFixed(0)}¢`;
}

// Address formatting
export function formatAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Time formatting utilities
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export function formatTimeUntil(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  
  if (diff <= 0) return 'Ended';
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} left`;
  return `${seconds} second${seconds !== 1 ? 's' : ''} left`;
}

// Market utilities
export function getMarketStatusColor(status: MarketStatus): string {
  switch (status) {
    case MarketStatus.Active:
      return "text-green-600";
    case MarketStatus.Paused:
      return "text-yellow-600";
    case MarketStatus.Resolved:
      return "text-blue-600";
    case MarketStatus.Cancelled:
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

export function getCategoryColor(category: MarketCategory): string {
  switch (category) {
    case MarketCategory.Sports:
      return "bg-blue-100 text-blue-800 border-blue-200";
    case MarketCategory.Politics:
      return "bg-red-100 text-red-800 border-red-200";
    case MarketCategory.Entertainment:
      return "bg-purple-100 text-purple-800 border-purple-200";
    // case "Technology":
    //   return "bg-green-100 text-green-800 border-green-200";
    // case "Economics":
    //   return "bg-yellow-100 text-yellow-800 border-yellow-200";
    // case "Science":
    //   return "bg-indigo-100 text-indigo-800 border-indigo-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

// Validation utilities
export function isValidFlowAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{16}$/.test(address);
}

export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < 1000000;
}

export function isValidPrice(price: string): boolean {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0 && num <= 1;
}

// Calculation utilities
export function calculateImpliedProbability(price: string | number): number {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return Math.max(0, Math.min(100, num * 100));
}


export function calculateROI(currentValue: string | number, originalCost: string | number): number {
  const current = typeof currentValue === "string" ? parseFloat(currentValue) : currentValue;
  const cost = typeof originalCost === "string" ? parseFloat(originalCost) : originalCost;
  
  if (cost === 0) return 0;
  return ((current - cost) / cost) * 100;
}

// Debounce utility for search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Local storage utilities
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

export function removeStorageItem(key: string): void {
  if (typeof window === "undefined") return;
  
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}

// =========================
// CONSTANTS
// =========================

// Flow network configuration
export const FLOW_CONFIG = {
  MAINNET: {
    accessNode: "https://rest-mainnet.onflow.org",
    discoveryWallet: "https://fcl-discovery.onflow.org/testnet/authn",
    chainId: "flow-mainnet"
  },
  TESTNET: {
    accessNode: "https://rest-testnet.onflow.org", 
    discoveryWallet: "https://fcl-discovery.onflow.org/testnet/authn",
    chainId: "flow-testnet"
  },
  EMULATOR: {
    accessNode: "http://localhost:8888",
    discoveryWallet: "http://localhost:8701/fcl/authn",
    chainId: "flow-emulator"
  }
} as const;

// Contract addresses (update these with your deployed addresses)
export const CONTRACT_ADDRESSES = {
  MAINNET: {
    FlowWager: "0x6c1b12e35dca8863",
    MarketFactory: "0x6c1b12e35dca8863", 
    UserRegistry: "0x6c1b12e35dca8863",
    FlowTokenHelper: "0x6c1b12e35dca8863"
  },
  TESTNET: {
    FlowWager: "0x6c1b12e35dca8863",
    MarketFactory: "0x6c1b12e35dca8863",
    UserRegistry: "0x6c1b12e35dca8863", 
    FlowTokenHelper: "0x6c1b12e35dca8863"
  }
} as const;

// Market categories
export const MARKET_CATEGORIES: { value: MarketCategory; label: string; emoji: string }[] = [
  { value: MarketCategory.Sports, label: "Sports", emoji: "⚽" },
  { value: MarketCategory.Politics, label: "Politics", emoji: "🗳️" },
  { value: MarketCategory.Entertainment, label: "Entertainment", emoji: "🎬" },
//   { value: "Technology", label: "Technology", emoji: "💻" },
//   { value: "Economics", label: "Economics", emoji: "💰" },
//   { value: "Science", label: "Science", emoji: "🔬" },
//   { value: "Other", label: "Other", emoji: "📋" }
];

// Market status options
export const MARKET_STATUSES: { value: MarketStatus; label: string; color: string }[] = [
  { value: MarketStatus.Active, label: "Active", color: "green" },
  { value: MarketStatus.Cancelled, label: "Closed", color: "yellow" },
  { value: MarketStatus.Resolved, label: "Resolved", color: "blue" },
  { value: MarketStatus.Cancelled, label: "Cancelled", color: "red" }
];

// Trading limits
export const TRADING_LIMITS = {
  MIN_BET_AMOUNT: 0.01,
  MAX_BET_AMOUNT: 10000,
  MIN_MARKET_DURATION: 60 * 60, // 1 hour in seconds
  MAX_MARKET_DURATION: 365 * 24 * 60 * 60, // 1 year in seconds
  MAX_SLIPPAGE: 0.05 // 5%
} as const;

// UI Constants
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 20,
  SEARCH_DEBOUNCE_MS: 300,
  TOAST_DURATION: 5000,
  REFRESH_INTERVAL: 30000, // 30 seconds
  COMPACT_NUMBER_THRESHOLD: 1000
} as const;

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet to continue",
  INSUFFICIENT_BALANCE: "Insufficient balance for this transaction",
  MARKET_CLOSED: "This market is no longer accepting bets",
  INVALID_AMOUNT: "Please enter a valid amount",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNKNOWN_ERROR: "An unexpected error occurred"
} as const;

// Success messages  
export const SUCCESS_MESSAGES = {
  BET_PLACED: "Bet placed successfully!",
  MARKET_CREATED: "Market created successfully!",
  MARKET_RESOLVED: "Market resolved successfully!",
  WINNINGS_CLAIMED: "Winnings claimed successfully!"
} as const;

// Social links
export const SOCIAL_LINKS = {
  TWITTER: "https://twitter.com/flowwager",
  DISCORD: "https://discord.gg/flowwager", 
  GITHUB: "https://github.com/flowwager",
  TELEGRAM: "https://t.me/flowwager",
  DOCS: "https://docs.flowwager.com"
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_MARKET_CREATION: true,
  ENABLE_SOCIAL_FEATURES: true,
  ENABLE_ADVANCED_CHARTS: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_DARK_MODE: true
} as const;