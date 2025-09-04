/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/utils/supabase/client';

export type ActivityType = 
  | 'LOGIN'
  | 'BET_PLACED' 
  | 'MARKET_CREATED'
  | 'MARKET_RESOLVED'
  | 'DAILY_BONUS'
  | 'STREAK_BONUS'
  | 'REFERRAL_BONUS';

export interface ActivityData {
  user_address: string;
  activity_type: ActivityType;
  points_earned?: number;
  metadata?: {
    marketId?: string;
    betAmount?: number;
    outcome?: string;
    marketTitle?: string;
    streakDays?: number;
    [key: string]: any;
  };
}

export class ActivityService {
  
  async logActivity(data: ActivityData): Promise<boolean> {
    try {
      // Calculate points based on activity type
      const points = this.calculatePoints(data.activity_type, data.metadata);
      
      // Log the activity
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          user_address: data.user_address,
          activity_type: data.activity_type,
          points_earned: points,
          metadata: data.metadata || {},
          created_at: new Date().toISOString()
        });

      if (activityError) {
        console.error('Error logging activity:', activityError);
        return false;
      }

      // Update user stats
      await this.updateUserStats(data.user_address, data.activity_type, points);
      
      return true;
    } catch (error) {
      console.error('Failed to log activity:', error);
      return false;
    }
  }

  private calculatePoints(activityType: ActivityType, metadata?: any): number {
    switch (activityType) {
      case 'LOGIN':
        return 10;
      case 'BET_PLACED':
        // Base points + bonus for larger bets
        const betAmount = metadata?.betAmount || 0;
        return Math.min(40 + Math.floor(betAmount / 10), 100);
      case 'MARKET_CREATED':
        return 100;
      case 'MARKET_RESOLVED':
        return 75;
      case 'DAILY_BONUS':
        return 25;
      case 'STREAK_BONUS':
        return (metadata?.streakDays || 0) * 5;
      case 'REFERRAL_BONUS':
        return 50;
      default:
        return 0;
    }
  }

  private async updateUserStats(
    userAddress: string, 
    activityType: ActivityType, 
    points: number
  ): Promise<void> {
    try {
      // Get or create user stats
      const { data: existingStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('address', userAddress)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user stats:', fetchError);
        return;
      }

      const currentPoints = existingStats?.flowwager_points || 0;
      const currentActivities = existingStats?.total_activities || 0;
      const currentBets = existingStats?.bets_placed || 0;
      const currentMarkets = existingStats?.markets_created || 0;
      const currentResolved = existingStats?.markets_resolved || 0;

      // Calculate new values
      const newStats = {
        address: userAddress,
        flowwager_points: currentPoints + points,
        total_activities: currentActivities + 1,
        bets_placed: activityType === 'BET_PLACED' ? currentBets + 1 : currentBets,
        markets_created: activityType === 'MARKET_CREATED' ? currentMarkets + 1 : currentMarkets,
        markets_resolved: activityType === 'MARKET_RESOLVED' ? currentResolved + 1 : currentResolved,
        last_updated: new Date().toISOString()
      };

      // Upsert user stats
      const { error: upsertError } = await supabase
        .from('user_stats')
        .upsert(newStats, { onConflict: 'address' });

      if (upsertError) {
        console.error('Error updating user stats:', upsertError);
      }

    } catch (error) {
      console.error('Failed to update user stats:', error);
    }
  }

  async getUserStats(userAddress: string) {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('address', userAddress)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  }

  async getRecentActivities(userAddress: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_address', userAddress)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching activities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get activities:', error);
      return [];
    }
  }
}

export const activityService = new ActivityService();