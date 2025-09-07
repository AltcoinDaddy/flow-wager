import { supabase } from '@/utils/supabase/client';

export interface LeaderboardUser {
  id: string;
  address: string;
  username: string;
  display_name?: string;
  profile_image_url?: string;
  flowwager_points: number;
  rank: number;
  
  // Activity stats
  total_activities: number;
  markets_created: number;
  bets_placed: number;
  markets_resolved: number;
  login_streak: number;
  
  // Time-based points
  weekly_points: number;
  monthly_points: number;
  
  // Engagement metrics
  joined_at: string;
  last_active: string;
  badges: string[];
}

export type LeaderboardTimeframe = 'all-time' | 'weekly' | 'monthly';
export type LeaderboardCategory = 'total-points' | 'market-creation' | 'betting' | 'resolution';

interface UserStatsWithUser {
  address: string;
  flowwager_points: number;
  total_staked: number;
  total_winnings: number;
  total_losses: number;
  total_markets_participated: number;
  win_streak: number;
  current_streak: number;
  longest_win_streak: number;
  last_updated: string;
  users: {
    username: string;
    display_name: string | null;
    profile_image_url: string | null;
    joined_at: string;
  } | {
    username: string;
    display_name: string | null;
    profile_image_url: string | null;
    joined_at: string;
  }[];
}

interface ActivityRecord {
  user_address: string;
  activity_type: string;
  created_at: string;
}

export class LeaderboardService {
  
  async getLeaderboard(
    timeframe: LeaderboardTimeframe = 'all-time',
    category: LeaderboardCategory = 'total-points',
    limit: number = 100
  ): Promise<LeaderboardUser[]> {
    try {
      const query = supabase
        .from('user_stats')
        .select(`
          address,
          flowwager_points,
          total_staked,
          total_winnings,
          total_losses,
          total_markets_participated,
          win_streak,
          current_streak,
          longest_win_streak,
          last_updated,
          users!inner(
            username,
            display_name,
            profile_image_url,
            joined_at
          )
        `)
        .order('flowwager_points', { ascending: false })
        .limit(limit);

      const { data: userStats, error } = await query;

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }

      if (!userStats) return [];

      // Type the userStats properly
      const typedUserStats = userStats as UserStatsWithUser[];

      // Get activity counts for each user
      const addresses = typedUserStats.map(stat => stat.address);
      const { data: activities } = await supabase
        .from('activities')
        .select('user_address, activity_type, created_at')
        .in('user_address', addresses);

      const typedActivities = activities as ActivityRecord[] || [];

      // Process the data
      const leaderboardUsers: LeaderboardUser[] = typedUserStats.map((stat, index) => {
        // Handle both single object and array cases for users data
        const user = Array.isArray(stat.users) ? stat.users[0] : stat.users;
        
        const userActivities = typedActivities.filter(activity => 
          activity.user_address === stat.address
        );

        // Calculate activity stats
        const marketCreationActivities = userActivities.filter(a => 
          a.activity_type === 'MARKET_CREATED'
        );
        const bettingActivities = userActivities.filter(a => 
          a.activity_type === 'BET_PLACED'
        );
        const resolutionActivities = userActivities.filter(a => 
          a.activity_type === 'MARKET_RESOLVED'
        );

        // Calculate time-based points
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const weeklyActivities = userActivities.filter(a => 
          new Date(a.created_at) >= weekAgo
        );
        const monthlyActivities = userActivities.filter(a => 
          new Date(a.created_at) >= monthAgo
        );

        // Estimate points from activities (you can adjust these values)
        const weeklyPoints = this.calculatePointsFromActivities(weeklyActivities);
        const monthlyPoints = this.calculatePointsFromActivities(monthlyActivities);

        // Generate badges based on activity
        const badges = this.generateBadges(stat, userActivities);

        return {
          id: stat.address,
          address: stat.address,
          username: user?.username || `User ${stat.address.slice(0, 6)}`,
          display_name: user?.display_name || undefined,
          profile_image_url: user?.profile_image_url || undefined,
          flowwager_points: stat.flowwager_points || 0,
          rank: index + 1,
          
          total_activities: userActivities.length,
          markets_created: marketCreationActivities.length,
          bets_placed: bettingActivities.length,
          markets_resolved: resolutionActivities.length,
          login_streak: stat.current_streak || 0,
          
          weekly_points: weeklyPoints,
          monthly_points: monthlyPoints,
          
          joined_at: user?.joined_at || new Date().toISOString(),
          last_active: stat.last_updated || new Date().toISOString(),
          badges
        };
      });

      // Sort based on category and timeframe
      return this.sortLeaderboard(leaderboardUsers, category, timeframe);

    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }

  private calculatePointsFromActivities(activities: ActivityRecord[]): number {
    return activities.reduce((total, activity) => {
      switch (activity.activity_type) {
        case 'MARKET_CREATED': return total + 100;
        case 'BET_PLACED': return total + 40;
        case 'MARKET_RESOLVED': return total + 75;
        case 'LOGIN': return total + 10;
        case 'DAILY_BONUS': return total + 25;
        default: return total;
      }
    }, 0);
  }

  private generateBadges(userStats: UserStatsWithUser, activities: ActivityRecord[]): string[] {
    const badges: string[] = [];
    
    if (userStats.flowwager_points >= 10000) badges.push('High Roller');
    if (userStats.flowwager_points >= 5000) badges.push('Points Master');
    if (userStats.longest_win_streak >= 10) badges.push('Streak King');
    if (activities.filter(a => a.activity_type === 'MARKET_CREATED').length >= 10) {
      badges.push('Market Maker');
    }
    if (activities.filter(a => a.activity_type === 'BET_PLACED').length >= 50) {
      badges.push('Active Trader');
    }
    if (userStats.current_streak >= 7) badges.push('Consistent');
    
    return badges;
  }

  private sortLeaderboard(
    users: LeaderboardUser[], 
    category: LeaderboardCategory, 
    timeframe: LeaderboardTimeframe
  ): LeaderboardUser[] {
    let sorted = [...users];

    switch (category) {
      case 'total-points':
        if (timeframe === 'weekly') {
          sorted = sorted.sort((a, b) => b.weekly_points - a.weekly_points);
        } else if (timeframe === 'monthly') {
          sorted = sorted.sort((a, b) => b.monthly_points - a.monthly_points);
        } else {
          sorted = sorted.sort((a, b) => b.flowwager_points - a.flowwager_points);
        }
        break;
      case 'market-creation':
        sorted = sorted.sort((a, b) => b.markets_created - a.markets_created);
        break;
      case 'betting':
        sorted = sorted.sort((a, b) => b.bets_placed - a.bets_placed);
        break;
      case 'resolution':
        sorted = sorted.sort((a, b) => b.markets_resolved - a.markets_resolved);
        break;
    }

    // Update ranks
    return sorted.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  }

  async getUserRank(userAddress: string): Promise<number> {
    try {
      const { data: userStats, error } = await supabase
        .from('user_stats')
        .select('flowwager_points')
        .eq('address', userAddress)
        .single();

      if (error || !userStats) return 0;

      const userPoints = userStats.flowwager_points || 0;

      const { count } = await supabase
        .from('user_stats')
        .select('*', { count: 'exact', head: true })
        .gt('flowwager_points', userPoints);

      return (count || 0) + 1;
    } catch (error) {
      console.error('Error getting user rank:', error);
      return 0;
    }
  }
}

export const leaderboardService = new LeaderboardService();