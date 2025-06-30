'use client';

import { OwnerOnly } from '@/components/auth/owner-only';
import { StatsCards } from '@/components/dashboard/stat-cards';
import { MarketCard } from '@/components/market/market-card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { Market, MarketStatus } from '@/types/market';
import { UserStats } from '@/types/user';
import { ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import * as fcl from "@onflow/fcl";
import flowConfig from "@/lib/flow/config";

// Constants for contract
const FLOWWAGER_CONTRACT = `0x${process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT?.replace('0x', '')}`;

const GET_ACTIVE_MARKETS = `
import FlowWager from ${FLOWWAGER_CONTRACT}

access(all) fun main(): [FlowWager.Market] {
    return FlowWager.getActiveMarkets()
}
`;

// Your getActiveMarkets function with enhanced debugging
const getActiveMarkets = async (): Promise<Market[]> => {
  try {
    flowConfig();
    console.log("Fetching active markets from contract...");

    const rawMarkets = await fcl.query({
      cadence: GET_ACTIVE_MARKETS,
      args: () => [],
    });

    console.log("Raw markets returned from getActiveMarkets():", rawMarkets);

    if (!rawMarkets || !Array.isArray(rawMarkets)) {
      console.warn("No active markets returned");
      return [];
    }

    const currentTime = Math.floor(Date.now() / 1000);
    console.log("Current timestamp:", currentTime);

    const transformedMarkets = rawMarkets.map((market: any) => {
      const transformedMarket = {
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
      };

      // Debug each market
      console.log(`Market ${market.id}:`, {
        title: market.title,
        status: market.status,
        statusRawValue: market.status?.rawValue,
        endTime: market.endTime,
        endTimeReadable: new Date(parseInt(market.endTime) * 1000).toLocaleString(),
        currentTime: currentTime,
        isExpired: parseInt(market.endTime) < currentTime,
        resolved: market.resolved
      });

      return transformedMarket;
    });

    // Client-side double-check for truly active markets
    const validActiveMarkets = transformedMarkets.filter(market => {
      const isStatusActive = market.status === 0 || market.status?.rawValue === 0;
      const isNotExpired = parseInt(market.endTime) > currentTime;
      const isNotResolved = !market.resolved;
      
      const shouldBeActive = isStatusActive && isNotExpired && isNotResolved;
      
      if (!shouldBeActive) {
        console.warn(`Market ${market.id} (${market.title}) returned by getActiveMarkets() but should not be active:`, {
          isStatusActive,
          isNotExpired,
          isNotResolved,
          endTime: new Date(parseInt(market.endTime) * 1000).toLocaleString()
        });
      }
      
      return shouldBeActive;
    });
    
    console.log("Active markets after client-side validation:", validActiveMarkets);
    console.log(`Smart contract returned ${transformedMarkets.length} markets, client validated ${validActiveMarkets.length} as truly active`);

    // Return the client-side validated active markets for now to fix the display
    return validActiveMarkets;
  } catch (error) {
    console.error("Error fetching active markets:", error);
    throw error;
  }
};

export default function HomePage() {
  const { user } = useAuth();
  const [activeMarkets, setActiveMarkets] = useState<Market[]>([]);
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  const [featuredMarkets, setFeaturedMarkets] = useState<Market[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState<string | null>(null);

  // Function to fetch all markets for platform stats
  const getAllMarkets = async (): Promise<Market[]> => {
    try {
      flowConfig();
      
      const GET_ALL_MARKETS = `
        import FlowWager from ${FLOWWAGER_CONTRACT}
        
        access(all) fun main(): [FlowWager.Market] {
          return FlowWager.getAllMarkets()
        }
      `;

      const rawMarkets = await fcl.query({
        cadence: GET_ALL_MARKETS,
        args: () => [],
      });

      if (!rawMarkets || !Array.isArray(rawMarkets)) {
        return [];
      }

      return rawMarkets.map((market: any) => ({
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
    } catch (error) {
      console.error("Error fetching all markets:", error);
      return [];
    }
  };

  // Fetch markets data
  const fetchMarketsData = async () => {
    try {
      setMarketsLoading(true);
      setMarketsError(null);
      
      // Fetch both active markets and all markets
      const [activeMarketsData, allMarketsData] = await Promise.all([
        getActiveMarkets(),
        getAllMarkets()
      ]);
      
      setActiveMarkets(activeMarketsData);
      setAllMarkets(allMarketsData);
    } catch (err) {
      console.error("Error fetching markets:", err);
      setMarketsError(err instanceof Error ? err.message : "Failed to fetch markets");
    } finally {
      setMarketsLoading(false);
    }
  };
  const GET_USER_STATS_SCRIPT = `
    import FlowWager from 0x${process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT?.replace('0x', '')}
    
    access(all) fun main(address: Address): {String: AnyStruct} {
      let allMarkets = FlowWager.getAllMarkets()
      var marketsCreated = 0
      var totalVolume = 0.0
      var activeMarketsCreated = 0
      var resolvedMarketsCreated = 0
      
      // Count markets created by user and calculate stats
      for market in allMarkets {
        if (market.creator == address) {
          marketsCreated = marketsCreated + 1
          totalVolume = totalVolume + market.totalPool
          
          if (market.status.rawValue == 0) { // Active
            activeMarketsCreated = activeMarketsCreated + 1
          } else if (market.status.rawValue == 2) { // Resolved
            resolvedMarketsCreated = resolvedMarketsCreated + 1
          }
        }
      }
      
      return {
        "address": address.toString(),
        "marketsCreated": marketsCreated,
        "marketsResolved": resolvedMarketsCreated,
        "totalVolume": totalVolume.toString(),
        "activePositions": 0, // Would need position tracking in contract
        "totalTrades": 0, // Would need trade tracking in contract
        "winRate": 0.0, // Would need win/loss tracking in contract
        "reputation": 0.0, // Would need reputation system in contract
        "rank": 0 // Would need leaderboard in contract
      } as {String: AnyStruct}
    }
  `;

  // Initialize Flow configuration
  const initConfig = async () => {
    flowConfig();
  };

  // Fetch real user stats from blockchain
  const fetchUserStats = async () => {
    if (!user?.addr || !user.loggedIn) return;
    
    try {
      setStatsLoading(true);
      await initConfig();
      
      const stats = await fcl.query({
        cadence: GET_USER_STATS_SCRIPT,
        args: (arg, t) => [arg(user?.addr || "", t.Address)]
      });

      // Transform blockchain data to UserStats interface
      const realUserStats: UserStats = {
        // Basic user info
        address: user.addr,

        // Financial stats (from blockchain)
        totalVolume: parseFloat(stats.totalVolume || "0").toFixed(2),
        totalPnL: '0.00', // Would need P&L tracking in contract
        totalWinnings: 0,
        totalBets: 0,

        // Trading stats (from blockchain where available)
        totalTrades: parseInt(stats.totalTrades?.toString() || "0"),
        winRate: parseFloat(stats.winRate?.toString() || "0"),
        winCount: 0,

        // Position stats
        activePositions: parseInt(stats.activePositions?.toString() || "0"),

        // Market creation stats (from blockchain)
        marketsCreated: parseInt(stats.marketsCreated?.toString() || "0"),
        marketsResolved: parseInt(stats.marketsResolved?.toString() || "0"),

        // Performance metrics
        accuracy: 0, // Would need accuracy tracking in contract
        rank: parseInt(stats.rank?.toString() || "0"),
        reputation: parseFloat(stats.reputation?.toString() || "0"),
        currentStreak: 0,
        longestStreak: 0,
        totalFeesPaid: 0,
        totalInvested: 0,
        roi: 0
      };

      setUserStats(realUserStats);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      
      // Fallback to basic stats if fetch fails
      const fallbackStats: UserStats = {
        address: user.addr,
        totalVolume: '0.00',
        totalPnL: '0.00',
        totalWinnings: 0,
        totalBets: 0,
        totalTrades: 0,
        winRate: 0,
        winCount: 0,
        activePositions: 0,
        marketsCreated: 0,
        marketsResolved: 0,
        accuracy: 0,
        rank: 0,
        reputation: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalFeesPaid: 0,
        totalInvested: 0,
        roi: 0
      };
      
      setUserStats(fallbackStats);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch markets when component mounts
  useEffect(() => {
    fetchMarketsData();
  }, []);

  // Fetch user stats when user logs in
  useEffect(() => {
    if (user?.loggedIn && user?.addr) {
      fetchUserStats();
    } else {
      setUserStats(null);
    }
  }, [user?.loggedIn, user?.addr]);

  // Transform and filter active markets for featured section
  useEffect(() => {
    if (activeMarkets && activeMarkets.length > 0) {
      // Get featured markets (active markets sorted by engagement)
      const featured = activeMarkets
        .sort((a, b) => {
          // Sort by pool size first, then by creation time
          const poolDiff = parseFloat(b.totalPool) - parseFloat(a.totalPool);
          if (poolDiff !== 0) return poolDiff;
          return parseFloat(b.createdAt) - parseFloat(a.createdAt);
        })
        .slice(0, 6); // Show top 6 markets

      setFeaturedMarkets(featured);
    } else {
      setFeaturedMarkets([]);
    }
  }, [activeMarkets]);

  // Calculate platform stats using allMarkets
  const platformStats = React.useMemo(() => {
    if (!allMarkets || allMarkets.length === 0) {
      return {
        totalMarkets: 0,
        activeMarkets: 0,
        totalVolume: '0',
        totalUsers: 0
      };
    }

    const totalMarkets = allMarkets.length;
    const activeMarketsCount = activeMarkets.length; // Use the fetched active markets count
    const totalVolume = allMarkets.reduce((sum, m) => sum + parseFloat(m.totalPool || '0'), 0);
    
    // Estimate unique users from market creators and participants
    const uniqueCreators = new Set(allMarkets.map(m => m.creator)).size;
    const totalUsers = uniqueCreators // Rough estimate

    return {
      totalMarkets,
      activeMarkets: activeMarketsCount,
      totalVolume: totalVolume.toFixed(2),
      totalUsers
    };
  }, [allMarkets, activeMarkets]);

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

      {/* User Dashboard Section (only show if logged in and stats available) */}
      {user?.loggedIn && (
        <section className="py-16 px-4 bg-[#1A1F2C]">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {user.addr?.slice(0, 8)}...
                </h2>
                <p className="text-gray-400">
                  {statsLoading ? 'Loading your trading overview...' : 'Here&lsquo;s your trading overview'}
                </p>
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
                <Link href={`/dashboard/${user.addr}`}>View Full Dashboard</Link>
              </Button>
            </div>
            
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-800 rounded-lg h-24 p-4">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-6 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : userStats ? (
              <StatsCards stats={userStats} />
            ) : (
              <div className="text-center py-8 bg-gray-800/20 rounded-lg">
                <p className="text-gray-400">Unable to load trading statistics at the moment.</p>
                <Button 
                  onClick={fetchUserStats}
                  variant="outline"
                  className="mt-4 border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white"
                >
                  Retry
                </Button>
              </div>
            )}
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

          {marketsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-[#1A1F2C] rounded-lg h-64"></div>
                </div>
              ))}
            </div>
          ) : marketsError ? (
            <div className="text-center py-12 bg-[#1A1F2C] rounded-lg">
              <div className="text-gray-400 mb-4">
                <TrendingUp className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Unable to load markets</h3>
              <p className="text-gray-400">{marketsError}</p>
              <Button 
                onClick={fetchMarketsData}
                variant="outline"
                className="mt-4 border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white"
              >
                Retry
              </Button>
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