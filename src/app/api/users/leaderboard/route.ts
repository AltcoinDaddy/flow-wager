import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get('sortBy') || 'winnings';
  const limit = parseInt(searchParams.get('limit') || '10');
  
  let sortedUsers = Object.values(userStats);
  
  switch (sortBy) {
    case 'winnings':
      sortedUsers.sort((a, b) => b.totalWinnings - a.totalWinnings);
      break;
    case 'winrate':
      sortedUsers.sort((a, b) => {
        const aRate = a.totalBets > 0 ? a.winCount / a.totalBets : 0;
        const bRate = b.totalBets > 0 ? b.winCount / b.totalBets : 0;
        return bRate - aRate;
      });
      break;
    case 'streak':
      sortedUsers.sort((a, b) => b.longestStreak - a.longestStreak);
      break;
    default:
      sortedUsers.sort((a, b) => b.totalWinnings - a.totalWinnings);
  }
  
  return NextResponse.json(sortedUsers.slice(0, limit));
}
