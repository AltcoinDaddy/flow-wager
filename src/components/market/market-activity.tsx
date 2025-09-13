/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { PointsManager } from "@/lib/points-system"; // 🎯 USE YOUR EXISTING SYSTEM
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Target,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/utils/supabase/client";

interface MarketActivityProps {
  marketId: string;
  marketTitle: string;
  optionA: string;
  optionB: string;
}

export function MarketActivity({
  marketId,
  marketTitle,
  optionA,
  optionB,
}: MarketActivityProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalBettors: 0,
    totalVolume: 0,
    optionAVolume: 0,
    optionBVolume: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch market activities from your existing system
  const fetchMarketActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching activities for market:", marketId);

      const { data: activitiesData, error: activitiesError } = await supabase
        .from("activities")
        .select(
          `
          *,
          users (
            username,
            display_name,
            profile_image_url
          )
        `,
        )
        .eq("market_id", parseInt(marketId))
        .in("activity_type", ["place_bet", "win_bet", "market_resolved"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (activitiesError) {
        console.error("❌ Error fetching activities:", activitiesError);
        throw activitiesError;
      }

      console.log(
        "✅ Activities fetched:",
        activitiesData?.length || 0,
        "records",
      );
      console.log("📊 Sample activity:", activitiesData?.[0]);

      setActivities(activitiesData || []);

      // Calculate stats
      if (activitiesData && activitiesData.length > 0) {
        const uniqueBettors = new Set(activitiesData.map((a) => a.user_address))
          .size;
        const betActivities = activitiesData.filter(
          (a) => a.activity_type === "place_bet",
        );

        const totalVolume = betActivities.reduce((sum, a) => {
          return sum + (a.details?.betAmount || 0);
        }, 0);

        const optionAVolume = betActivities
          .filter(
            (a) => a.details?.option === 0 || a.details?.outcome === optionA,
          )
          .reduce((sum, a) => sum + (a.details?.betAmount || 0), 0);

        const optionBVolume = totalVolume - optionAVolume;

        setStats({
          totalBettors: uniqueBettors,
          totalVolume,
          optionAVolume,
          optionBVolume,
        });

        console.log("📈 Market stats calculated:", {
          totalBettors: uniqueBettors,
          totalVolume,
          optionAVolume,
          optionBVolume,
        });
      }
    } catch (err: any) {
      console.error("❌ Error fetching market activities:", err);
      setError(err.message || "Failed to fetch market activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketActivities();
  }, [marketId]);

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown time";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getBetIcon = (outcome: string) => {
    return outcome === optionA ? "🟢" : "🔴";
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8  bg-[#9b87f5]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
        <CardContent className="p-6 text-center text-red-400">
          <p>Failed to load activity data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          <Activity className="h-5 w-5 text-[#9b87f5]" />
          Market Activity
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0A0C14]/50 rounded-lg p-3 border border-gray-800/30">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-gray-400">Participants</span>
            </div>
            <p className="text-lg font-bold text-white">{stats.totalBettors}</p>
          </div>

          <div className="bg-[#0A0C14]/50 rounded-lg p-3 border border-gray-800/30">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs text-gray-400">Total Volume</span>
            </div>
            <p className="text-lg font-bold text-white">
              {stats.totalVolume.toFixed(2)} FLOW
            </p>
          </div>

          <div className="bg-[#0A0C14]/50 rounded-lg p-3 border border-gray-800/30">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-[#9b87f5]" />
              <span className="text-xs text-gray-400">{optionA}</span>
            </div>
            <p className="text-lg font-bold text-white">
              {stats.optionAVolume.toFixed(2)} FLOW
            </p>
          </div>

          <div className="bg-[#0A0C14]/50 rounded-lg p-3 border border-gray-800/30">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-gray-400">{optionB}</span>
            </div>
            <p className="text-lg font-bold text-white">
              {stats.optionBVolume.toFixed(2)} FLOW
            </p>
          </div>
        </div>

        <Separator className="bg-gray-800/50" />

        {/* Activity Feed */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
            <TabsTrigger value="all">
              All Bets ({activities.length})
            </TabsTrigger>
            <TabsTrigger value="optionA">{optionA}</TabsTrigger>
            <TabsTrigger value="optionB">{optionB}</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No betting activity yet</p>
                <p className="text-sm">Be the first to place a bet!</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-[#0A0C14]/50 rounded-lg border border-gray-800/30 hover:bg-gray-800/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={activity.user?.profileImage}
                        alt={activity.user?.username || "User"}
                      />
                      <AvatarFallback className="bg-[#9b87f5]/20 text-[#9b87f5]">
                        {activity.user?.username?.slice(0, 2).toUpperCase() ||
                          formatAddress(activity.user_address).slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {activity.user?.displayName ||
                            activity.user?.username ||
                            formatAddress(activity.user_address)}
                        </span>
                        <span className="text-sm">
                          {getBetIcon(activity.details?.outcome || "")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>
                          Bet {activity.details?.betAmount?.toFixed(2)} FLOW
                        </span>
                        <span>on</span>
                        <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30 text-xs">
                          {activity.details?.outcome}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                      <TrendingUp className="h-3 w-3" />+
                      {activity.points_earned || 40} pts
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="optionA" className="space-y-3 mt-4">
            {activities
              .filter((activity) => activity.details?.outcome === optionA)
              .map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-[#0A0C14]/50 rounded-lg border border-gray-800/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={activity.user?.profileImage}
                        alt={activity.user?.username || "User"}
                      />
                      <AvatarFallback className="bg-[#9b87f5]/20 text-[#9b87f5]">
                        {activity.user?.username?.slice(0, 2).toUpperCase() ||
                          formatAddress(activity.user_address).slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {activity.user?.displayName ||
                            activity.user?.username ||
                            formatAddress(activity.user_address)}
                        </span>
                        <span className="text-sm">🟢</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>
                          Bet {activity.details?.betAmount?.toFixed(2)} FLOW
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                      <TrendingUp className="h-3 w-3" />+
                      {activity.points_earned || 40} pts
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.created_at)}
                    </div>
                  </div>
                </div>
              ))}
          </TabsContent>

          <TabsContent value="optionB" className="space-y-3 mt-4">
            {activities
              .filter((activity) => activity.details?.outcome === optionB)
              .map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-[#0A0C14]/50 rounded-lg border border-gray-800/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={activity.user?.profileImage}
                        alt={activity.user?.username || "User"}
                      />
                      <AvatarFallback className="bg-[#9b87f5]/20 text-[#9b87f5]">
                        {activity.user?.username?.slice(0, 2).toUpperCase() ||
                          formatAddress(activity.user_address).slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {activity.user?.displayName ||
                            activity.user?.username ||
                            formatAddress(activity.user_address)}
                        </span>
                        <span className="text-sm">🔴</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>
                          Bet {activity.details?.betAmount?.toFixed(2)} FLOW
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                      <TrendingUp className="h-3 w-3" />+
                      {activity.points_earned || 40} pts
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.created_at)}
                    </div>
                  </div>
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
