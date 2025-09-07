/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { PointsManager, ActivityType, ActivityDetails } from "@/lib/points-system";
import { useAuth } from "@/providers/auth-provider";

export interface UserPointsData {
  points: number;
  rank: number;
  isLoading: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
  totalStaked: number;
  totalWinnings: number;
  marketsParticipated: number;
  winStreak: number;
  roi: number;
  username: string;
  displayName: string;
  profileImage: string | null;
}

export const usePoints = () => {
  const { user, isAuthenticated } = useAuth();
  const [userPoints, setUserPoints] = useState<UserPointsData>({
    points: 0,
    rank: 0,
    isLoading: true
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Fetch user's points and rank
  const fetchUserPoints = useCallback(async () => {
    if (!user?.addr || !isAuthenticated) {
      setUserPoints({ points: 0, rank: 0, isLoading: false });
      return;
    }

    try {
      const { points, rank } = await PointsManager.getUserPointsAndRank(user.addr);
      setUserPoints({ points, rank, isLoading: false });
    } catch (error) {
      console.error("Error fetching user points:", error);
      setUserPoints({ points: 0, rank: 0, isLoading: false });
    }
  }, [user?.addr, isAuthenticated]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async (limit: number = 50) => {
    setIsLoadingLeaderboard(true);
    try {
      const data = await PointsManager.getLeaderboard(limit);
      setLeaderboard(data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, []);

  // Fetch user activities
  const fetchActivities = useCallback(async (limit: number = 20) => {
    if (!user?.addr || !isAuthenticated) {
      setActivities([]);
      return;
    }

    setIsLoadingActivities(true);
    try {
      const data = await PointsManager.getUserActivities(user.addr, limit);
      setActivities(data);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [user?.addr, isAuthenticated]);

  // Award points for an activity
  const awardPoints = useCallback(async (
    activityType: ActivityType,
    details?: ActivityDetails,
    marketId?: number
  ) => {
    if (!user?.addr || !isAuthenticated) return false;

    const success = await PointsManager.awardPoints(user.addr, activityType, details!, marketId);
    
    if (success) {
      // Refresh user points and activities
      await fetchUserPoints();
      await fetchActivities();
    }

    return success;
  }, [user?.addr, isAuthenticated, fetchUserPoints, fetchActivities]);

  // Initial data fetch
  useEffect(() => {
    fetchUserPoints();
    fetchActivities();
  }, [fetchUserPoints, fetchActivities]);

  return {
    // User data
    userPoints,
    
    // Leaderboard data
    leaderboard,
    isLoadingLeaderboard,
    fetchLeaderboard,
    
    // Activities data
    activities,
    isLoadingActivities,
    fetchActivities,
    
    // Actions
    awardPoints,
    refreshUserPoints: fetchUserPoints,
  };
};