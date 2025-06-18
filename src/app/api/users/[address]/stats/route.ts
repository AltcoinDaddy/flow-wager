import { NextRequest, NextResponse } from 'next/server';

interface UserStatsParams {
  params: { address: string };
}

interface UserStats {
  address: string;
  totalWinnings: number;
  totalBets: number;
  winCount: number;
  currentStreak: number;
  longestStreak: number;
  totalFeesPaid: number;
}

// Mock user stats storage
const userStats: { [address: string]: UserStats } = {
  "0x123456789": {
    address: "0x123456789",
    totalWinnings: 1250.75,
    totalBets: 15,
    winCount: 9,
    currentStreak: 3,
    longestStreak: 5,
    totalFeesPaid: 45.25
  }
};

export async function GET(req: NextRequest, { params }: UserStatsParams) {
  const { address } = params;
  const stats = userStats[address];
  
  if (!stats) {
    // Return default stats for new users
    const defaultStats: UserStats = {
      address,
      totalWinnings: 0,
      totalBets: 0,
      winCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalFeesPaid: 0
    };
    return NextResponse.json(defaultStats);
  }
  
  return NextResponse.json(stats);
}

export async function POST(req: NextRequest, { params }: UserStatsParams) {
  try {
    const { address } = params;
    const body = await req.json();
    const { won, winnings, fees } = body;
    
    if (!userStats[address]) {
      userStats[address] = {
        address,
        totalWinnings: 0,
        totalBets: 0,
        winCount: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalFeesPaid: 0
      };
    }
    
    const stats = userStats[address];
    stats.totalBets += 1;
    stats.totalFeesPaid += fees || 0;
    
    if (won) {
      stats.winCount += 1;
      stats.totalWinnings += winnings || 0;
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
      }
    } else {
      stats.currentStreak = 0;
    }
    
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user stats" },
      { status: 500 }
    );
  }
}
