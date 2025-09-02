/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

export interface ActivityDetails {
  marketId?: number;
  betAmount?: number;
  marketTitle?: string;
  marketCategory?: string;
  outcome?: string;
  winnings?: number;
  [key: string]: any;
}

export const ACTIVITY_POINTS = {
  REGISTRATION: 100,
  CREATE_MARKET: 100,
  PLACE_BET: 40,
  WIN_BET: 50,
  MARKET_RESOLVED: 25,
  DAILY_LOGIN: 10,
  WEEKLY_STREAK: 50,
  MONTHLY_ACTIVE: 100,
} as const;

export type ActivityType = keyof typeof ACTIVITY_POINTS;

export class PointsManager {
  /**
   * Award points for a specific activity
   */
  static async awardPoints(
    userAddress: string,
    activityType: ActivityType,
    details?: ActivityDetails,
    marketId?: number
  ): Promise<boolean> {
    try {
      const points = ACTIVITY_POINTS[activityType];
      const now = new Date().toISOString();

      // Start a transaction-like operation
      const { data: currentStats, error: fetchError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("address", userAddress)
        .single();

      if (fetchError) {
        console.error("Error fetching user stats:", fetchError);
        return false;
      }

      // Calculate new stats
      const newPoints = (currentStats.flowwager_points || 0) + points;
      
      // Update user stats
      const { error: updateError } = await supabase
        .from("user_stats")
        .update({
          flowwager_points: newPoints,
          last_updated: now,
          // Update other relevant stats based on activity
          ...(activityType === "PLACE_BET" && details?.betAmount && {
            total_staked: (currentStats.total_staked || 0) + details.betAmount,
            total_markets_participated: (currentStats.total_markets_participated || 0) + 1,
            average_bet_size: ((currentStats.total_staked || 0) + details.betAmount) / 
                            ((currentStats.total_markets_participated || 0) + 1)
          }),
          ...(activityType === "WIN_BET" && details?.winnings && {
            total_winnings: (currentStats.total_winnings || 0) + details.winnings,
            win_streak: (currentStats.win_streak || 0) + 1,
            current_streak: (currentStats.current_streak || 0) + 1,
            longest_win_streak: Math.max(
              currentStats.longest_win_streak || 0, 
              (currentStats.win_streak || 0) + 1
            ),
            roi: (((currentStats.total_winnings || 0) + details.winnings) / 
                  Math.max(currentStats.total_staked || 1, 1)) * 100
          })
        })
        .eq("address", userAddress);

      if (updateError) {
        console.error("Error updating user stats:", updateError);
        return false;
      }

      // Log the activity
      const { error: activityError } = await supabase
        .from("activities")
        .insert({
          user_address: userAddress,
          activity_type: activityType.toLowerCase(),
          details: {
            ...details,
            points_awarded: points,
            timestamp: now
          },
          points_earned: points,
          market_id: marketId || null,
          created_at: now
        });

      if (activityError) {
        console.error("Error logging activity:", activityError);
        return false;
      }

      // Show success notification
      toast.success(`+${points} FlowWager Points earned!`, {
        description: `Activity: ${activityType.replace(/_/g, ' ').toLowerCase()}`
      });

      return true;
    } catch (error) {
      console.error("Error awarding points:", error);
      return false;
    }
  }

  /**
   * Get user's current points and rank
   */
  static async getUserPointsAndRank(userAddress: string) {
    try {
      // Get user's points
      const { data: userStats, error: userError } = await supabase
        .from("user_stats")
        .select("flowwager_points")
        .eq("address", userAddress)
        .single();

      if (userError) {
        console.error("Error fetching user points:", userError);
        return { points: 0, rank: 0 };
      }

      const userPoints = userStats.flowwager_points || 0;

      // Get user's rank
      const { data: rankings, error: rankError } = await supabase
        .from("user_stats")
        .select("address, flowwager_points")
        .order("flowwager_points", { ascending: false });

      if (rankError) {
        console.error("Error fetching rankings:", rankError);
        return { points: userPoints, rank: 0 };
      }

      const rank = rankings.findIndex(user => user.address === userAddress) + 1;

      return { points: userPoints, rank };
    } catch (error) {
      console.error("Error getting user points and rank:", error);
      return { points: 0, rank: 0 };
    }
  }

  /**
   * Get leaderboard data
   */
  static async getLeaderboard(limit: number = 50) {
    try {
      const { data: leaderboard, error } = await supabase
        .from("user_stats")
        .select(`
          address,
          flowwager_points,
          total_staked,
          total_winnings,
          total_markets_participated,
          win_streak,
          roi,
          users!inner (
            username,
            display_name,
            profile_image_url
          )
        `)
        .order("flowwager_points", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
      }

      return leaderboard.map((entry, index) => {
        // Handle the case where users might be an array (though it should be a single object with inner join)
        const userInfo = Array.isArray(entry.users) ? entry.users[0] : entry.users;
        
        return {
          rank: index + 1,
          address: entry.address,
          points: entry.flowwager_points || 0,
          totalStaked: entry.total_staked || 0,
          totalWinnings: entry.total_winnings || 0,
          marketsParticipated: entry.total_markets_participated || 0,
          winStreak: entry.win_streak || 0,
          roi: entry.roi || 0,
          username: userInfo?.username || "Anonymous",
          displayName: userInfo?.display_name || "Unknown User",
          profileImage: userInfo?.profile_image_url || null
        };
      });
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  }

  /**
   * Get user's recent activities
   */
  static async getUserActivities(userAddress: string, limit: number = 20) {
    try {
      const { data: activities, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_address", userAddress)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching user activities:", error);
        return [];
      }

      return activities;
    } catch (error) {
      console.error("Error getting user activities:", error);
      return [];
    }
  }

  /**
   * Get global activity feed (for homepage/dashboard)
   */
  static async getGlobalActivities(limit: number = 50) {
    try {
      const { data: activities, error } = await supabase
        .from("activities")
        .select(`
          *,
          users!inner (
            username,
            display_name,
            profile_image_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching global activities:", error);
        return [];
      }

      return activities.map(activity => {
        const userInfo = Array.isArray(activity.users) ? activity.users[0] : activity.users;
        
        return {
          ...activity,
          user: {
            username: userInfo?.username || "Anonymous",
            displayName: userInfo?.display_name || "Unknown User",
            profileImage: userInfo?.profile_image_url || null
          }
        };
      });
    } catch (error) {
      console.error("Error getting global activities:", error);
      return [];
    }
  }

  /**
   * Get user stats summary
   */
  static async getUserStats(userAddress: string) {
    try {
      const { data: stats, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("address", userAddress)
        .single();

      if (error) {
        console.error("Error fetching user stats:", error);
        return null;
      }

      return {
        address: stats.address,
        points: stats.flowwager_points || 0,
        totalStaked: stats.total_staked || 0,
        totalWinnings: stats.total_winnings || 0,
        totalLosses: stats.total_losses || 0,
        marketsParticipated: stats.total_markets_participated || 0,
        winStreak: stats.win_streak || 0,
        currentStreak: stats.current_streak || 0,
        longestWinStreak: stats.longest_win_streak || 0,
        averageBetSize: stats.average_bet_size || 0,
        roi: stats.roi || 0,
        lastUpdated: stats.last_updated
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return null;
    }
  }

  /**
   * Check and award daily login bonus
   */
  static async checkDailyLoginBonus(userAddress: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
      
      // Check if user already got daily bonus today
      const { data: todayActivity, error } = await supabase
        .from("activities")
        .select("id")
        .eq("user_address", userAddress)
        .eq("activity_type", "daily_login")
        .gte("created_at", `${today}T00:00:00.000Z`)
        .lt("created_at", `${today}T23:59:59.999Z`)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error checking daily login:", error);
        return false;
      }

      // If already got bonus today, return false
      if (todayActivity) {
        return false;
      }

      // Award daily login bonus
      return await this.awardPoints(userAddress, "DAILY_LOGIN", {
        loginDate: today,
        bonusType: "daily_login"
      });
    } catch (error) {
      console.error("Error checking daily login bonus:", error);
      return false;
    }
  }

  /**
   * Update user stats when they lose a bet
   */
  static async recordLoss(
    userAddress: string,
    lossAmount: number,
    marketId: number,
    marketTitle?: string
  ): Promise<boolean> {
    try {
      const now = new Date().toISOString();

      // Get current stats
      const { data: currentStats, error: fetchError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("address", userAddress)
        .single();

      if (fetchError) {
        console.error("Error fetching user stats for loss:", fetchError);
        return false;
      }

      // Update stats for loss
      const { error: updateError } = await supabase
        .from("user_stats")
        .update({
          total_losses: (currentStats.total_losses || 0) + lossAmount,
          win_streak: 0, // Reset win streak
          current_streak: 0, // Reset current streak
          roi: (((currentStats.total_winnings || 0) - ((currentStats.total_losses || 0) + lossAmount)) / 
                Math.max(currentStats.total_staked || 1, 1)) * 100,
          last_updated: now
        })
        .eq("address", userAddress);

      if (updateError) {
        console.error("Error updating user stats for loss:", updateError);
        return false;
      }

      // Log the loss activity (no points awarded)
      const { error: activityError } = await supabase
        .from("activities")
        .insert({
          user_address: userAddress,
          activity_type: "bet_loss",
          details: {
            lossAmount,
            marketId,
            marketTitle,
            timestamp: now
          },
          points_earned: 0,
          market_id: marketId,
          created_at: now
        });

      if (activityError) {
        console.error("Error logging loss activity:", activityError);
      }

      return true;
    } catch (error) {
      console.error("Error recording loss:", error);
      return false;
    }
  }
}