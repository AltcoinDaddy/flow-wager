
export interface UserStats {
  address: string;
  totalWinnings: number;
  totalBets: number;
  winCount: number;
  currentStreak: number;
  longestStreak: number;
  totalFeesPaid: number;
  totalInvested?: number;
  winRate: number;
  roi: number; // Return on Investment
  rank?: number;
  totalMarketsParticipated?: number; 
  totalLosses?: number; 
  winStreak?: number; 
}

export interface UserPosition {
  marketId: number;
  userAddress: string;
  isOptionA: boolean;
  shares: number;
  amountInvested: number;
  timestamp: number;
  claimed: boolean;
  potentialWinnings?: number;
  currentValue?: number;
}

export interface UserProfile {
  address: string;
  username?: string;
  avatar?: string;
  bio?: string;
  stats: UserStats;
  positions: UserPosition[];
  notifications: UserNotification[];
  preferences: UserPreferences;
  createdAt: number;
  lastActive: number;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    marketResolution: boolean;
    newMarkets: boolean;
    breakingNews: boolean;
    winnings: boolean;
  };
  privacy: {
    showStats: boolean;
    showPositions: boolean;
    allowFollow: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    currency: 'FLOW' | 'USD';
    timeZone: string;
  };
}

export interface UserNotification {
  id: string;
  type: 'market_resolved' | 'winnings_available' | 'market_ending' | 'new_market' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  data?: {
    marketId?: number;
    amount?: number;
    [key: string]: any;
  };
}

export interface LeaderboardUser {
  address: string;
  username?: string;
  avatar?: string;
  rank: number;
  totalPnL?: string;
  winRate?: number;
  totalVolume?: string;
  accuracy?: number;
  change?: number; // rank change from previous period
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  userRank?: number; // Current user's rank
  period: 'all_time' | 'monthly' | 'weekly';
  sortBy: 'winnings' | 'win_rate' | 'streak' | 'roi';
}

export interface UserActivityItem {
  id: string;
  type: 'bet_placed' | 'winnings_claimed' | 'market_created' | 'achievement_earned';
  timestamp: number;
  marketId?: number;
  marketQuestion?: string;
  amount?: number;
  option?: 'A' | 'B';
  outcome?: 'win' | 'loss' | 'pending';
  description: string;
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: number;
  progress?: {
    current: number;
    target: number;
  };
}

export interface UserPortfolio {
  totalValue: number;
  totalInvested: number;
  unrealizedPnL: number;
  realizedPnL: number;
  activePositions: UserPosition[];
  historicalPositions: UserPosition[];
  performanceChart: PortfolioDataPoint[];
}

export interface PortfolioDataPoint {
  timestamp: number;
  totalValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

// Follow system types
export interface UserFollow {
  follower: string;
  following: string;
  timestamp: number;
}

export interface FollowStats {
  followers: number;
  following: number;
  isFollowing?: boolean;
  isFollower?: boolean;
}




export interface User {
  address: string;
  username?: string;
  avatar?: string;
  createdAt: number;
  stats: UserStats;
  verified?: boolean;
  bio?: string;
  socialLinks?: SocialLinks;
}



export interface SocialLinks {
  twitter?: string;
  discord?: string;
  website?: string;
}



export interface UserActivity {
  id: string;
  type: ActivityType;
  marketId?: string;
  marketTitle?: string;
  amount?: string;
  side?: "yes" | "no";
  timestamp: number;
  txHash: string;
}

export enum ActivityType {
  BuyShares = "BuyShares",
  SellShares = "SellShares", 
  CreateMarket = "CreateMarket",
  ResolveMarket = "ResolveMarket",
  ClaimWinnings = "ClaimWinnings"
}