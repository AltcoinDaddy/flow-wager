/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PointsManager } from "@/lib/points-system"; // 🎯 USE YOUR POINTS SYSTEM
import { useAuth } from "@/providers/auth-provider";
import {
  getUsersByAddresses,
  formatUserDisplayName,
  formatUserShortName,
  User,
  checkUsersInSupabase,
  getUserDisplayInfo,
} from "@/utils/supabase/user";
import {
  Award,
  BarChart3,
  Crown,
  Medal,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface LeaderboardUser {
  user_address: string;
  total_points: number;
  total_staked: number;
  total_winnings: number;
  total_losses: number;
  markets_participated: number;
  win_streak: number;
  current_streak: number;
  longest_win_streak: number;
  rank: number;
  username?: string;
  display_name?: string;
  profile_image_url?: string;
  supabaseUser?: User | null; // Add this to store the actual Supabase user data
  hasProfile?: boolean; // Add this to track if user has a profile
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<
    "total-points" | "market-creation" | "betting" | "resolution"
  >("total-points");
  const [timeframe, setTimeframe] = useState<"all-time" | "monthly" | "weekly">(
    "all-time",
  );

  const { user } = useAuth();
  const [userRank, setUserRank] = useState<LeaderboardUser | null>(null);
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🏆 Fetching leaderboard data...");

      // Get leaderboard data from your PointsManager
      const leaderboardData = await PointsManager.getLeaderboard(100);

      if (leaderboardData.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Extract all user addresses
      const userAddresses = leaderboardData.map((entry) => entry.user_address);

      // Check which users exist in Supabase
      console.log("👥 Checking users in Supabase...");
      const supabaseUsersMap = await checkUsersInSupabase(userAddresses);

      // Log some stats
      const foundUsers = Array.from(supabaseUsersMap.values()).filter(
        (user) => user !== null,
      );
      console.log(
        `✅ Found ${foundUsers.length} users in Supabase out of ${userAddresses.length} total`,
      );

      // Format the data with real user information
      const formattedUsers: LeaderboardUser[] = leaderboardData.map(
        (entry, index) => {
          const supabaseUser = supabaseUsersMap.get(entry.user_address);
          const displayInfo = getUserDisplayInfo(
            supabaseUser!,
            entry.user_address,
          );

          return {
            user_address: entry.user_address,
            total_points: entry.total_points || 0,
            total_staked: entry.total_staked || 0,
            total_winnings: entry.total_winnings || 0,
            total_losses: entry.total_losses || 0,
            markets_participated: entry.markets_participated || 0,
            win_streak: entry.win_streak || 0,
            current_streak: entry.current_streak || 0,
            longest_win_streak: entry.longest_win_streak || 0,
            rank: index + 1,
            username: displayInfo.shortName,
            display_name: displayInfo.displayName,
            profile_image_url: displayInfo.avatarUrl,
            supabaseUser,
            hasProfile: displayInfo.hasProfile,
          };
        },
      );

      // Sort by total points (highest first)
      formattedUsers.sort((a, b) => b.total_points - a.total_points);

      // Re-assign ranks after sorting
      formattedUsers.forEach((user, index) => {
        user.rank = index + 1;
      });

      setUsers(formattedUsers);

      // Find current user's rank
      if (user?.addr) {
        const currentUserEntry = formattedUsers.find(
          (u) => u.user_address === user.addr,
        );
        setUserRank(currentUserEntry || null);
      }
    } catch (err: any) {
      console.error("❌ Error fetching leaderboard:", err);
      setError(err.message || "Failed to fetch leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [user?.addr]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getValueByCategory = (user: LeaderboardUser) => {
    switch (category) {
      case "total-points":
        return `${user.total_points.toLocaleString()} pts`;
      case "market-creation":
        return `${user.markets_participated} markets`; // Using markets_participated since we don't have markets_created
      case "betting":
        return `${user.total_staked.toFixed(2)} FLOW staked`;
      case "resolution":
        return `${user.total_winnings.toFixed(2)} FLOW won`;
      default:
        return `${user.total_points.toLocaleString()} pts`;
    }
  };

  const getSortedUsers = () => {
    const sortedUsers = [...users];
    switch (category) {
      case "total-points":
        return sortedUsers.sort((a, b) => b.total_points - a.total_points);
      case "market-creation":
        return sortedUsers.sort(
          (a, b) => b.markets_participated - a.markets_participated,
        );
      case "betting":
        return sortedUsers.sort((a, b) => b.total_staked - a.total_staked);
      case "resolution":
        return sortedUsers.sort((a, b) => b.total_winnings - a.total_winnings);
      default:
        return sortedUsers;
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case "total-points":
        return "FlowWager Points (All Time)";
      case "market-creation":
        return "Markets Participated";
      case "betting":
        return "Total Staked";
      case "resolution":
        return "Total Winnings";
      default:
        return "FlowWager Points";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C14] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#9b87f5] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0C14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchLeaderboard}>Try Again</Button>
        </div>
      </div>
    );
  }

  const sortedUsers = getSortedUsers();

  return (
    <div className="min-h-screen bg-[#0A0C14]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1A1F2C] via-[#151923] to-[#0A0C14] rounded-2xl border border-gray-800/50 p-8 shadow-2xl mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-white">
              FlowWager Leaderboard
            </h1>
          </div>
          <p className="text-gray-400 mb-4">
            Top performers in the FlowWager Points system
          </p>

          {/* Current User Rank */}
          {user && userRank && (
            <div className="flex items-center gap-4 p-4 bg-[#9b87f5]/10 border border-[#9b87f5]/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[#9b87f5]" />
                <span className="text-white font-medium">Your Rank:</span>
              </div>
              <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30">
                #{userRank.rank}
              </Badge>
              <div className="text-gray-400">
                {userRank.total_points.toLocaleString()} FlowWager Points
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-[#0A0C14]/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{users.length}</p>
              <p className="text-xs text-gray-400">Total Users</p>
            </div>
            <div className="bg-[#0A0C14]/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-[#9b87f5]">
                {users
                  .reduce((sum, u) => sum + u.total_points, 0)
                  .toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">Total Points</p>
            </div>
            <div className="bg-[#0A0C14]/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">
                {users.reduce((sum, u) => sum + u.total_staked, 0).toFixed(0)}
              </p>
              <p className="text-xs text-gray-400">Total Staked</p>
            </div>
            <div className="bg-[#0A0C14]/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {users.reduce((sum, u) => sum + u.markets_participated, 0)}
              </p>
              <p className="text-xs text-gray-400">Markets</p>
            </div>
          </div>
        </div>

        {/* Category Selection */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-white text-sm">
                Ranking Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={category}
                onValueChange={(value) => setCategory(value as any)}
              >
                <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 text-white">
                  <TabsTrigger
                    value="total-points"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Award className="h-3 w-3" />
                    Points
                  </TabsTrigger>
                  <TabsTrigger
                    value="market-creation"
                    className="flex items-center gap-1 text-xs"
                  >
                    <BarChart3 className="h-3 w-3" />
                    Markets
                  </TabsTrigger>
                  <TabsTrigger
                    value="betting"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Target className="h-3 w-3" />
                    Staked
                  </TabsTrigger>
                  <TabsTrigger
                    value="resolution"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Zap className="h-3 w-3" />
                    Winnings
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Top 3 Podium */}
        {sortedUsers.length >= 3 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedUsers.slice(0, 3).map((user, index) => (
                <Card
                  key={user.user_address}
                  className={`bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 relative overflow-hidden ${
                    index === 0
                      ? "ring-2 ring-yellow-500/50"
                      : index === 1
                        ? "ring-2 ring-gray-400/50"
                        : "ring-2 ring-amber-600/50"
                  }`}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      {getRankIcon(index + 1)}
                    </div>
                    <Avatar className="h-16 w-16 mx-auto mb-4">
                      <AvatarImage
                        src={user.profile_image_url}
                        alt={user.username}
                      />
                      <AvatarFallback className="bg-[#9b87f5]/20 text-[#9b87f5]">
                        {user.user_address.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="flex items-center justify-center gap-2 text-white">
                      {user.display_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">
                          FlowWager Points
                        </p>
                        <p className="text-xl font-bold text-[#9b87f5]">
                          {user.total_points.toLocaleString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Staked</p>
                          <p className="font-medium text-white">
                            {user.total_staked.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Winnings</p>
                          <p className="font-medium text-white">
                            {user.total_winnings.toFixed(1)}
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30 text-xs">
                          Rank #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span>{getCategoryLabel()}</span>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Users className="h-3 w-3 mr-1" />
                {sortedUsers.length} Users
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No users found</p>
                  <p className="text-sm">
                    Start betting to appear on the leaderboard!
                  </p>
                </div>
              ) : (
                sortedUsers.map((user, index) => (
                  <div
                    key={user.user_address}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                      user.user_address === `${user?.user_address}`
                        ? "bg-[#9b87f5]/10 border-[#9b87f5]/30 hover:bg-[#9b87f5]/20"
                        : "bg-[#0A0C14]/50 border-gray-800/30 hover:bg-gray-800/20"
                    }`}
                    onClick={() =>
                      (window.location.href = `/dashboard/${user.user_address}`)
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(index + 1)}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.profile_image_url}
                          alt={user.username}
                        />
                        <AvatarFallback className="bg-[#9b87f5]/20 text-[#9b87f5]">
                          {user.user_address.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">
                            {user.display_name}
                          </h3>
                          {index < 10 && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                              Top 10
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span>{user.username}</span>
                          <span>{user.total_points} pts</span>
                          <span>{user.markets_participated} markets</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#9b87f5]">
                        {getValueByCategory(user)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Rank #{index + 1}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Join Competition Banner */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] via-[#151923] to-[#0A0C14] rounded-2xl border border-gray-800/50 p-8  mt-8 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                  Climb the Leaderboard!
                </h3>
                <p className="opacity-90">
                  Earn FlowWager Points by creating markets, placing bets, and
                  staying active.
                </p>
              </div>
              <Button
                variant="secondary"
                className="bg-[#9b87f5] text-white hover:!bg-inherit"
                onClick={() => (window.location.href = "/markets")}
              >
                Start Earning Points
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
