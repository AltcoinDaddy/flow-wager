/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { usePoints } from '@/hooks/usePoints';
import { LeaderboardUser } from '@/lib/leaderboard-service';
import { useAuth } from '@/providers/auth-provider';
import { Award, BarChart3, Calendar, Crown, Medal, Target, Trophy, Users, Zap } from 'lucide-react';

export default function LeaderboardPage() {
  const { 
    users, 
    loading, 
    error, 
    timeframe, 
    setTimeframe, 
    category, 
    setCategory 
  } = useLeaderboard();
  
  const { user } = useAuth();
  const { userPoints } = usePoints();

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
      case 'total-points':
        if (timeframe === 'weekly') return `${user.weekly_points.toLocaleString()} pts`;
        if (timeframe === 'monthly') return `${user.monthly_points.toLocaleString()} pts`;
        return `${user.flowwager_points.toLocaleString()} pts`;
      case 'market-creation':
        return `${user.markets_created} markets`;
      case 'betting':
        return `${user.bets_placed} bets`;
      case 'resolution':
        return `${user.markets_resolved} resolved`;
      default:
        return `${user.flowwager_points.toLocaleString()} pts`;
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'total-points':
        return `FlowWager Points ${timeframe === 'all-time' ? '(All Time)' : timeframe === 'weekly' ? '(This Week)' : '(This Month)'}`;
      case 'market-creation':
        return 'Markets Created';
      case 'betting':
        return 'Bets Placed';
      case 'resolution':
        return 'Markets Resolved';
      default:
        return 'FlowWager Points';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#9b87f5]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0C14] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

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
          {user && userPoints.rank > 0 && (
            <div className="flex items-center gap-4 p-4 bg-[#9b87f5]/10 border border-[#9b87f5]/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[#9b87f5]" />
                <span className="text-white font-medium">Your Rank:</span>
              </div>
              <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30">
                #{userPoints.rank}
              </Badge>
              <div className="text-gray-400">
                {userPoints.points.toLocaleString()} FlowWager Points
              </div>
            </div>
          )}
        </div>

        {/* Category and Timeframe Selection */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Selection */}
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white text-sm">Ranking Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={category} onValueChange={(value) => setCategory(value as any)}>
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gray-800/50">
                    <TabsTrigger value="total-points" className="flex items-center gap-1 text-xs">
                      <Award className="h-3 w-3" />
                      Points
                    </TabsTrigger>
                    <TabsTrigger value="market-creation" className="flex items-center gap-1 text-xs">
                      <BarChart3 className="h-3 w-3" />
                      Create
                    </TabsTrigger>
                    <TabsTrigger value="betting" className="flex items-center gap-1 text-xs">
                      <Target className="h-3 w-3" />
                      Bet
                    </TabsTrigger>
                    <TabsTrigger value="resolution" className="flex items-center gap-1 text-xs">
                      <Zap className="h-3 w-3" />
                      Resolve
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Timeframe Selection */}
            {category === 'total-points' && (
              <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Time Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
                    <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                      <TabsTrigger value="all-time" className="flex items-center gap-1 text-xs">
                        <Trophy className="h-3 w-3" />
                        All Time
                      </TabsTrigger>
                      <TabsTrigger value="monthly" className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        Month
                      </TabsTrigger>
                      <TabsTrigger value="weekly" className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        Week
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Top 3 Podium */}
        {users.length >= 3 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {users.slice(0, 3).map((user, index) => (
                <Card 
                  key={user.id} 
                  className={`bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 relative overflow-hidden ${
                    index === 0 ? 'ring-2 ring-yellow-500/50' : 
                    index === 1 ? 'ring-2 ring-gray-400/50' : 
                    'ring-2 ring-amber-600/50'
                  }`}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      {getRankIcon(index + 1)}
                    </div>
                    <Avatar className="h-16 w-16 mx-auto mb-4">
                      <AvatarImage src={user.profile_image_url} alt={user.username} />
                      <AvatarFallback className="bg-[#9b87f5]/20 text-[#9b87f5]">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="flex items-center justify-center gap-2 text-white">
                      {user.display_name || user.username}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">FlowWager Points</p>
                        <p className="text-xl font-bold text-[#9b87f5]">
                          {user.flowwager_points.toLocaleString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Markets</p>
                          <p className="font-medium text-white">{user.markets_created}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Bets</p>
                          <p className="font-medium text-white">{user.bets_placed}</p>
                        </div>
                      </div>
                      {user.login_streak > 0 && (
                        <div className="text-center">
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                            🔥 {user.login_streak} day streak
                          </Badge>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 justify-center">
                        {user.badges.slice(0, 2).map((badge) => (
                          <Badge key={badge} className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30 text-xs">
                            {badge}
                          </Badge>
                        ))}
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
                {users.length} Traders
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user, index) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-4 rounded-lg bg-[#0A0C14]/50 border border-gray-800/30 hover:bg-gray-800/20 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/dashboard/${user.address}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(index + 1)}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profile_image_url} alt={user.username} />
                      <AvatarFallback className="bg-[#9b87f5]/20 text-[#9b87f5]">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">
                          {user.display_name || user.username}
                        </h3>
                        {user.login_streak > 7 && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                            🔥 {user.login_streak}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>Activities: {user.total_activities}</span>
                        <span>Markets: {user.markets_created}</span>
                        <span>Bets: {user.bets_placed}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#9b87f5]">
                      {getValueByCategory(user)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {category === 'total-points' 
                        ? `${user.total_activities} activities` 
                        : `${user.flowwager_points.toLocaleString()} pts total`
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Join Competition Banner */}
        <Card className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white mt-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  Climb the Leaderboard!
                </h3>
                <p className="opacity-90">
                  Earn FlowWager Points by creating markets, placing bets, and staying active.
                </p>
              </div>
              <Button 
                variant="secondary" 
                className="bg-white text-[#9b87f5] hover:bg-gray-100"
                onClick={() => window.location.href = '/markets'}
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