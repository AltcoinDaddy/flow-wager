'use client';

import { OwnerOnly } from '@/components/auth/owner-only';
import { StatsCards } from '@/components/dashboard/stat-cards';
import { MarketCard } from '@/components/market/market-card';
import { Button } from '@/components/ui/button';
import { useAllMarkets } from '@/hooks/use-all-markets';
import { useAuth } from '@/providers/auth-provider';
import { Market, MarketStatus } from '@/types/market';
import { UserStats } from '@/types/user';
import { ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

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
    <div className="min-h-screen bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14]">
      {/* Hero Section - Banner Style */}
      <section className="w-full h-[500px] relative overflow-hidden bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%239b87f5' fillOpacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center px-4">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Predict. <span className="text-[#9b87f5]">Win.</span> Repeat.
            </h1>
            
            {/* Subheading */}
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the ultimate prediction platform where your prediction knowledge pays off. 
              Trade shares on real events and win big.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                asChild 
                size="lg" 
                style={{ 
                  backgroundColor: "#9b87f5", 
                  color: "white",
                  fontSize: '16px',
                  height: 'fit-content',
                  padding: '12px 32px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#8b5cf6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#9b87f5";
                }}
              >
                <Link href="/markets">
                  Explore Markets
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <button 
                className="border border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-[#9b87f5]/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#7c3aed]/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#9b87f5]/5 rounded-full blur-lg animate-bounce delay-500"></div>
        
        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0A0C14] to-transparent"></div>
      </section>

      {/* Platform Stats */}
      <section className="py-16 px-4 bg-[#0A0C14]">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-[#1A1F2C] rounded-lg p-6 shadow-lg border border-gray-800">
              <div className="text-3xl font-bold text-white mb-2">{platformStats.totalMarkets}</div>
              <div className="text-sm text-gray-400">Total Markets</div>
            </div>
            <div className="bg-[#1A1F2C] rounded-lg p-6 shadow-lg border border-gray-800">
              <div className="text-3xl font-bold text-white mb-2">{platformStats.activeMarkets}</div>
              <div className="text-sm text-gray-400">Active Now</div>
            </div>
            <div className="bg-[#1A1F2C] rounded-lg p-6 shadow-lg border border-gray-800">
              <div className="text-3xl font-bold text-[#9b87f5] mb-2">{platformStats.totalVolume}</div>
              <div className="text-sm text-gray-400">FLOW Volume</div>
            </div>
            <div className="bg-[#1A1F2C] rounded-lg p-6 shadow-lg border border-gray-800">
              <div className="text-3xl font-bold text-white mb-2">{platformStats.totalUsers}+</div>
              <div className="text-sm text-gray-400">Traders</div>
            </div>
          </div>
        </div>
      </section>

      {/* User Dashboard Section (only show if logged in) */}
      {user?.loggedIn && (
        <section className="py-16 px-4 bg-[#1A1F2C]">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {user.addr?.slice(0, 8)}...
                </h2>
                <p className="text-gray-400">Here&lsquo;s your trading overview</p>
              </div>
              <Button 
                asChild 
                variant="outline" 
                style={{ 
                  borderColor: "#9b87f5", 
                  color: "#9b87f5",
                  backgroundColor: "transparent"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#9b87f5";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#9b87f5";
                }}
              >
                <Link href="/profile">View Full Profile</Link>
              </Button>
            </div>
            
            <StatsCards stats={userStats} />
          </div>
        </section>
      )}

      {/* Featured Markets Section */}
      <section className="py-16 px-4 bg-[#0A0C14]">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Featured Markets</h2>
              <p className="text-gray-400">Most popular and trending prediction markets</p>
            </div>
            <Button 
              asChild 
              variant="outline"
              style={{ 
                borderColor: "#9b87f5", 
                color: "#9b87f5",
                backgroundColor: "transparent"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#9b87f5";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#9b87f5";
              }}
            >
              <Link href="/markets">View All Markets</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-[#1A1F2C] rounded-lg h-64"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-[#1A1F2C] rounded-lg">
              <div className="text-gray-400 mb-4">
                <TrendingUp className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Unable to load markets</h3>
              <p className="text-gray-400">{error}</p>
            </div>
          ) : featuredMarkets.length === 0 ? (
            <div className="text-center py-12 bg-[#1A1F2C] rounded-lg">
              <div className="text-gray-400 mb-4">
                <TrendingUp className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No markets yet</h3>
              <p className="text-gray-400 mb-4">Be the first to create a prediction market!</p>
              <OwnerOnly showFallback={false}>
                <Button 
                  asChild 
                  style={{ backgroundColor: "#9b87f5", color: "white" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#8b5cf6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#9b87f5";
                  }}
                >
                  <Link href="/admin/create">Create First Market</Link>
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

  

    
    </div>
  );
}