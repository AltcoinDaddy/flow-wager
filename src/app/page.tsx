"use client";

import { OwnerOnly } from "@/components/auth/owner-only";
import { StatsCards } from "@/components/dashboard/stat-cards";
import { MarketCard } from "@/components/market/market-card";
import { Button } from "@/components/ui/button";
import { fetchMarketsData } from "@/lib/flow/market-api";
import {
  calculatePlatformStats,
  processFeaturedMarkets,
} from "@/lib/flow/market-data";
import { createFallbackUserStats, fetchUserStats } from "@/lib/flow/user-stats";
import { useAuth } from "@/providers/auth-provider";
import { Market } from "@/types/market";
import { UserStats } from "@/types/user";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const [activeMarkets, setActiveMarkets] = useState<Market[]>([]);
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  const [featuredMarkets, setFeaturedMarkets] = useState<Market[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState<string | null>(null);

  const handleFetchMarkets = async () => {
    try {
      setMarketsLoading(true);
      setMarketsError(null);

      console.log("🚀 Fetching markets using market-api...");
      const { activeMarketsData, allMarketsData } = await fetchMarketsData();

      setActiveMarkets(activeMarketsData);
      setAllMarkets(allMarketsData);
    } catch (err) {
      console.error("❌ Error fetching markets:", err);
      setMarketsError(
        err instanceof Error ? err.message : "Failed to fetch markets"
      );
    } finally {
      setMarketsLoading(false);
    }
  };

  const handleFetchUserStats = async () => {
    if (!user?.addr || !user.loggedIn) return;

    try {
      setStatsLoading(true);
      console.log("🔍 Fetching user stats using user-stats...");
      const stats = await fetchUserStats(user.addr);
      setUserStats(stats);
    } catch (err) {
      console.error("Error fetching user stats:", err);
      const fallbackStats = createFallbackUserStats(user.addr);
      setUserStats(fallbackStats);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchMarkets();
  }, []);

  useEffect(() => {
    if (user?.loggedIn && user?.addr) {
      handleFetchUserStats();
    } else {
      setUserStats(null);
    }
  }, [user?.loggedIn, user?.addr]);

  useEffect(() => {
    const featured = processFeaturedMarkets(activeMarkets, 6);
    setFeaturedMarkets(featured);
  }, [activeMarkets]);

  const platformStats = React.useMemo(
    () => calculatePlatformStats(allMarkets, activeMarkets),
    [allMarkets, activeMarkets]
  );

  console.log("🎯 HomePage state (using market-api):", {
    marketsLoading,
    marketsError,
    activeMarketsCount: activeMarkets.length,
    featuredMarketsCount: featuredMarkets.length,
    allMarketsCount: allMarkets.length,
  });

  console.log("This is the Featured Markets", featuredMarkets);

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14]">
      <section className="w-full h-[500px] relative overflow-hidden bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14]">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%239b87f5' fillOpacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
            }}
          ></div>
        </div>

        <div className="relative z-10 h-full flex items-center justify-center px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Predict. <span className="text-[#9b87f5]">Win.</span> Repeat.
            </h1>

            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the top prediction platform where your foresight earns
              rewards. Trade shares on real-world events and score big wins.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                style={{
                  backgroundColor: "#9b87f5",
                  color: "white",
                  fontSize: "16px",
                  height: "fit-content",
                  padding: "12px 32px",
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
                className="border border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 max-sm:w-[60%]"
                onClick={() =>
                  window.scrollTo({
                    top: window.innerHeight,
                    behavior: "smooth",
                  })
                }
              >
                <Link href={"/learn"}>Learn More</Link>
              </button>
            </div>
          </div>
        </div>

        <div className="absolute top-10 left-10 w-20 h-20 bg-[#9b87f5]/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#7c3aed]/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#9b87f5]/5 rounded-full blur-lg animate-bounce delay-500"></div>

        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0A0C14] to-transparent"></div>
      </section>

      <section className="py-16 px-4 bg-[#0A0C14]">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-[#1A1F2C] rounded-lg p-6 shadow-lg border border-gray-800">
              <div className="text-3xl font-bold text-white mb-2">
                {platformStats.totalMarkets}
              </div>
              <div className="text-sm text-gray-400">Total Markets</div>
            </div>
            <div className="bg-[#1A1F2C] rounded-lg p-6 shadow-lg border border-gray-800">
              <div className="text-3xl font-bold text-white mb-2">
                {platformStats.activeMarkets}
              </div>
              <div className="text-sm text-gray-400">Active Now</div>
            </div>
            <div className="bg-[#1A1F2C] rounded-lg p-6 shadow-lg border border-gray-800">
              <div className="text-3xl font-bold text-[#9b87f5] mb-2">
                {platformStats.totalVolume}
              </div>
              <div className="text-sm text-gray-400">FLOW Volume</div>
            </div>
            <div className="bg-[#1A1F2C] rounded-lg p-6 shadow-lg border border-gray-800">
              <div className="text-3xl font-bold text-white mb-2">
                {platformStats.totalUsers}+
              </div>
              <div className="text-sm text-gray-400">Trades</div>
            </div>
          </div>
        </div>
      </section>

      {/* User Dashboard Section (only show if logged in and stats available) */}
      {/* {user?.loggedIn && (
        <section className="py-16 px-4 bg-[#1A1F2C]">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome back, {user.addr?.slice(0, 8)}...
                </h2>
                <p className="text-gray-400">
                  {statsLoading
                    ? "Loading your trading overview..."
                    : "Here&apos;s your trading overview"}
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                style={{
                  borderColor: "#9b87f5",
                  color: "#9b87f5",
                  backgroundColor: "transparent",
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
                <Link href={`/dashboard/${user.addr}`}>
                  View Full Dashboard
                </Link>
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
                <p className="text-gray-400">
                  Unable to load trading statistics at the moment.
                </p>
                <Button
                  onClick={handleFetchUserStats}
                  variant="outline"
                  className="mt-4 border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </section>
      )} */}

      {/* Featured Markets Section */}
      <section className="py-16 px-4 bg-[#0A0C14]">
        <div className="container mx-auto">
          <div className="flex items-center md:justify-between mb-8 max-sm:flex-col max-sm:gap-4">
            <div className="max-sm:text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                Featured Markets
              </h2>
              <p className="text-gray-400">
                Most popular and trending prediction markets
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              style={{
                borderColor: "#9b87f5",
                color: "#9b87f5",
                backgroundColor: "transparent",
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
              <h3 className="text-lg font-medium text-white mb-2">
                Unable to load markets
              </h3>
              <p className="text-gray-400 mb-2">{marketsError}</p>
              <p className="text-xs text-gray-500 mb-4">
                Check console for market-api debugging info
              </p>
              <Button
                onClick={handleFetchMarkets}
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
              <h3 className="text-lg font-medium text-white mb-2">
                No active markets found
              </h3>
              <p className="text-gray-400 mb-4">
                {allMarkets.length === 0
                  ? "No markets have been created yet. Be the first to create a prediction market!"
                  : "All markets are currently inactive or resolved. Create a new market to get started!"}
              </p>
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
                  <Link href="/admin/create">Create New Market</Link>
                </Button>
              </OwnerOnly>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={{
                    ...market,
                    imageUrl: market.imageURI,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
