'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Star, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketCard } from '@/components/market/market-card';
import { StatsCards } from '@/components/dashboard/stat-cards';
import { OwnerOnly } from '@/components/auth/owner-only';
import { useAuth } from '@/providers/auth-provider';
import { useAllMarkets } from '@/hooks/use-all-markets';
import { Market, MarketStatus } from '@/types/market';
import { UserStats } from '@/types/user';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();
  const { markets: contractMarkets, isLoading, error } = useAllMarkets();
  const [featuredMarkets, setFeaturedMarkets] = useState<Market[]>([]);

  // Transform and filter markets for homepage
  useEffect(() => {
    if (contractMarkets && contractMarkets.length > 0) {
      // Transform contract data to Market interface
      const transformedMarkets: Market[] = contractMarkets.map((market) => ({
        id: market.id,
        creator: market.creator,
        title: market.title,
        description: market.description,
        optionA: market.optionA,
        optionB: market.optionB,
        category: market.category,
        endTime: market.endTime,
        createdAt: market.createdAt,
        outcome: market.outcome,
        totalOptionAShares: market.totalOptionAShares,
        totalOptionBShares: market.totalOptionBShares,
        resolved: market.resolved,
        status: market.status,
        totalPool: market.totalPool,
        minBet: market.minBet,
        maxBet: market.maxBet
      }));

      // Get featured markets (active with highest volume or most recent)
      const featured = transformedMarkets
        .filter(market => market.status === MarketStatus.Active)
        .sort((a, b) => {
          // Sort by pool size first, then by creation time
          const poolDiff = parseFloat(b.totalPool) - parseFloat(a.totalPool);
          if (poolDiff !== 0) return poolDiff;
          return parseFloat(b.createdAt) - parseFloat(a.createdAt);
        })
        .slice(0, 6); // Show top 6 markets

      setFeaturedMarkets(featured);
    }
  }, [contractMarkets]);

  // Calculate platform stats
  const platformStats = React.useMemo(() => {
    if (!contractMarkets || contractMarkets.length === 0) {
      return {
        totalMarkets: 0,
        activeMarkets: 0,
        totalVolume: '0',
        totalUsers: 0
      };
    }

    const totalMarkets = contractMarkets.length;
    const activeMarkets = contractMarkets.filter(m => m.status === MarketStatus.Active).length;
    const totalVolume = contractMarkets.reduce((sum, m) => sum + parseFloat(m.totalPool || '0'), 0);
    
    // Estimate unique users from market creators and participants
    const uniqueCreators = new Set(contractMarkets.map(m => m.creator)).size;
    const totalUsers = Math.max(uniqueCreators * 3, 10); // Rough estimate

    return {
      totalMarkets,
      activeMarkets,
      totalVolume: totalVolume.toFixed(2),
      totalUsers
    };
  }, [contractMarkets]);

  // Mock user stats with all required properties
  const userStats: UserStats = {
    // Basic user info
    address: user?.addr || '',

    // Financial stats
    totalVolume: '1,234.56',
    totalPnL: '+456.78',
    totalWinnings: Number('2,345.67'),
    totalBets: Number('1,888.89'),

    // Trading stats
    totalTrades: 42,
    winRate: 68.5,
    winCount: 29,

    // Position stats
    activePositions: 8,

    // Market creation stats
    marketsCreated: 3,
    marketsResolved: 2,

    // Performance metrics
    accuracy: 72.3,
    rank: 156,
    reputation: 847,
    currentStreak: 0,
    longestStreak: 0,
    totalFeesPaid: 0,
    totalInvested: 0,
    roi: 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 bg-blue-100 text-blue-700 border-blue-200">
              🚀 Powered by Flow Blockchain
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Predict the Future,
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}Earn Rewards
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Trade on real-world events with our decentralized prediction markets. 
              Put your knowledge to work and earn FLOW tokens.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                <Link href="/markets">
                  Explore Markets
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <OwnerOnly showFallback={false}>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                  <Link href="/markets/create">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Market
                  </Link>
                </Button>
              </OwnerOnly>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{platformStats.totalMarkets}</div>
                <div className="text-sm text-gray-600">Total Markets</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{platformStats.activeMarkets}</div>
                <div className="text-sm text-gray-600">Active Now</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{platformStats.totalVolume}</div>
                <div className="text-sm text-gray-600">FLOW Volume</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{platformStats.totalUsers}+</div>
                <div className="text-sm text-gray-600">Traders</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Dashboard Section (only show if logged in) */}
      {user?.loggedIn && (
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user.addr?.slice(0, 8)}...
                </h2>
                <p className="text-gray-600">Here&lsquo;s your trading overview</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/profile">View Full Profile</Link>
              </Button>
            </div>
            
            <StatsCards stats={userStats} />
          </div>
        </section>
      )}

      {/* Featured Markets Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Markets</h2>
              <p className="text-gray-600">Most popular and trending prediction markets</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/markets">View All Markets</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-64"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-400 mb-4">
                <TrendingUp className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load markets</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : featuredMarkets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-400 mb-4">
                <TrendingUp className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No markets yet</h3>
              <p className="text-gray-600 mb-4">Be the first to create a prediction market!</p>
              <OwnerOnly showFallback={false}>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/markets/create">Create First Market</Link>
                </Button>
              </OwnerOnly>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose FlowWager?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the future of prediction markets with cutting-edge blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Decentralized</h3>
              <p className="text-gray-600">
                Built on Flow blockchain for transparent, trustless trading
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Driven</h3>
              <p className="text-gray-600">
                Markets created and resolved by the community
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Earn Rewards</h3>
              <p className="text-gray-600">
                Get rewarded for accurate predictions with FLOW tokens
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of traders making predictions on real-world events. 
            Connect your wallet and start earning today.
          </p>
          
          {user?.loggedIn ? (
            <Button asChild size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href="/markets">
                Explore Markets
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              Connect Wallet to Get Started
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}