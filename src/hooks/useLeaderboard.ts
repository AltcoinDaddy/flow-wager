/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { leaderboardService, LeaderboardUser, LeaderboardTimeframe, LeaderboardCategory } from '@/lib/leaderboard-service';

export function useLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('all-time');
  const [category, setCategory] = useState<LeaderboardCategory>('total-points');

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await leaderboardService.getLeaderboard(timeframe, category, 100);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [timeframe, category]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getUserRank = useCallback(async (userAddress: string): Promise<number> => {
    return await leaderboardService.getUserRank(userAddress);
  }, []);

  return {
    users,
    loading,
    error,
    timeframe,
    setTimeframe,
    category,
    setCategory,
    fetchLeaderboard,
    getUserRank,
    refresh: fetchLeaderboard
  };
}