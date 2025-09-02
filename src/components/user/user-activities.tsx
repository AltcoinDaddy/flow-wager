/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { usePoints } from "@/hooks/usePoints";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Plus, 
  Target, 
  Award, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ACTIVITY_ICONS = {
  registration: Award,
  create_market: Plus,
  place_bet: Target,
  win_bet: TrendingUp,
  market_resolved: DollarSign,
  daily_login: Calendar,
  weekly_streak: Zap,
  monthly_active: Activity,
} as const;

const ACTIVITY_COLORS = {
  registration: "bg-green-500/20 text-green-400 border-green-500/30",
  create_market: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  place_bet: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  win_bet: "bg-green-500/20 text-green-400 border-green-500/30",
  market_resolved: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  daily_login: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  weekly_streak: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  monthly_active: "bg-pink-500/20 text-pink-400 border-pink-500/30",
} as const;

export function UserActivities() {
  const { activities, isLoadingActivities, fetchActivities, userPoints } = usePoints();

  useEffect(() => {
    fetchActivities(25);
  }, [fetchActivities]);

  const getActivityDescription = (activity: any) => {
    const { activity_type, details } = activity;
    
    switch (activity_type) {
      case 'registration':
        return `Welcome to FlowWager! Account created successfully.`;
      case 'create_market':
        return `Created a new prediction market: "${details?.marketTitle || 'Untitled Market'}"`;
      case 'place_bet':
        return `Placed a bet of ${details?.betAmount || 0} FLOW on "${details?.marketTitle || 'a market'}"`;
      case 'win_bet':
        return `Won ${details?.winnings || 0} FLOW from "${details?.marketTitle || 'a market'}"`;
      case 'market_resolved':
        return `Market resolved: "${details?.marketTitle || 'Unknown Market'}"`;
      case 'daily_login':
        return `Daily login bonus claimed`;
      case 'weekly_streak':
        return `Weekly activity streak maintained`;
      case 'monthly_active':
        return `Monthly activity milestone reached`;
      default:
        return `Activity: ${activity_type.replace('_', ' ')}`;
    }
  };

  if (isLoadingActivities) {
    return (
      <Card className="w-full bg-[#1A1F2C] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-[#9b87f5]" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-[#1A1F2C] border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-6 w-6 text-[#9b87f5]" />
          Recent Activities
        </CardTitle>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#9b87f5]">
            {userPoints.points.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400">Total Points</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => {
            const IconComponent = ACTIVITY_ICONS[activity.activity_type as keyof typeof ACTIVITY_ICONS] || Activity;
            const colorClass = ACTIVITY_COLORS[activity.activity_type as keyof typeof ACTIVITY_COLORS] || ACTIVITY_COLORS.monthly_active;
            
            return (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                {/* Icon */}
                <div className={`p-2 rounded-full border ${colorClass}`}>
                  <IconComponent className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm mb-1">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                  
                  {/* Additional details */}
                  {activity.details && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activity.details.betAmount && (
                        <Badge variant="outline" className="text-xs text-purple-400 border-purple-500/30">
                          {activity.details.betAmount} FLOW
                        </Badge>
                      )}
                      {activity.details.winnings && (
                        <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                          +{activity.details.winnings} FLOW
                        </Badge>
                      )}
                      {activity.details.marketCategory && (
                        <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                          {activity.details.marketCategory}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Points */}
                {activity.points_earned && (
                  <div className="text-right">
                    <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border border-[#9b87f5]/30">
                      +{activity.points_earned}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activities yet.</p>
            <p className="text-sm">Start betting or creating markets to earn points!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}