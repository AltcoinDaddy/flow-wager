import { supabase } from '@/utils/supabase/client';

export interface MarketActivity {
  id: string;
  user_address: string;
  activity_type: string;
  points_earned: number;
  metadata: {
    marketId?: string;
    betAmount?: number;
    outcome?: string;
    transactionId?: string;
  };
  created_at: string;
  user_profile?: {
    username?: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

export class MarketActivityService {
  async getMarketActivities(marketId: string, limit: number = 50): Promise<MarketActivity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          profiles:user_address (
            username,
            display_name,
            profile_image_url
          )
        `)
        .eq('activity_type', 'BET_PLACED')
        .contains('metadata', { marketId })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching market activities:', error);
        return [];
      }

      return data?.map(activity => ({
        ...activity,
        user_profile: activity.profiles
      })) || [];
    } catch (error) {
      console.error('Failed to get market activities:', error);
      return [];
    }
  }

  async getMarketStats(marketId: string) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('user_address, metadata')
        .eq('activity_type', 'BET_PLACED')
        .contains('metadata', { marketId });

      if (error) {
        console.error('Error fetching market stats:', error);
        return {
          totalBettors: 0,
          totalVolume: 0,
          optionAVolume: 0,
          optionBVolume: 0
        };
      }

      const uniqueBettors = new Set(data?.map(d => d.user_address) || []).size;
      const totalVolume = data?.reduce((sum, d) => sum + (d.metadata?.betAmount || 0), 0) || 0;
      const optionAVolume = data
        ?.filter(d => d.metadata?.outcome === 'optionA')
        .reduce((sum, d) => sum + (d.metadata?.betAmount || 0), 0) || 0;
      const optionBVolume = totalVolume - optionAVolume;

      return {
        totalBettors: uniqueBettors,
        totalVolume,
        optionAVolume,
        optionBVolume
      };
    } catch (error) {
      console.error('Failed to get market stats:', error);
      return {
        totalBettors: 0,
        totalVolume: 0,
        optionAVolume: 0,
        optionBVolume: 0
      };
    }
  }
}

export const marketActivityService = new MarketActivityService();