/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { marketActivityService, MarketActivity } from '@/lib/market-activity-service';

export function useMarketActivity(marketId: string) {
  const [activities, setActivities] = useState<MarketActivity[]>([]);
  const [stats, setStats] = useState({
    totalBettors: 0,
    totalVolume: 0,
    optionAVolume: 0,
    optionBVolume: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    if (!marketId) return;

    try {
      setLoading(true);
      setError(null);

      const [activitiesData, statsData] = await Promise.all([
        marketActivityService.getMarketActivities(marketId),
        marketActivityService.getMarketStats(marketId)
      ]);

      setActivities(activitiesData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error fetching market activity:', err);
      setError(err.message || 'Failed to fetch market activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [marketId]);

  return {
    activities,
    stats,
    loading,
    error,
    refetch: fetchActivities
  };
}