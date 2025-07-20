/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateMarketForm } from "@/components/admin/create/create-market-form";
import { useAuth } from "@/providers/auth-provider";
import { 
  getPlatformStats,
  getAllMarkets,
} from '@/lib/flow-wager-scripts';
import * as fcl from '@onflow/fcl';
import flowConfig from '@/lib/flow/config';
import { 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Target,
  Activity,
  Loader2
} from "lucide-react";

export default function AdminCreatePage() {
  const { user, isAuthenticated: loggedIn } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [createdMarketId, setCreatedMarketId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creationStats, setCreationStats] = useState({
    marketsCreatedToday: 0,
    marketsCreatedThisWeek: 0,
    averageVolume: 0,
    successRate: 100,
    totalCreators: 1,
    totalMarkets: 0,
    activeMarkets: 0,
    totalUsers: 0,
    totalVolume: "0",
    totalFees: "0"
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Initialize Flow configuration
  const initConfig = async () => {
    try {
      flowConfig();
      console.log('Flow configuration initialized for admin panel');
    } catch (error) {
      console.error('Failed to initialize Flow configuration:', error);
      throw error;
    }
  };

  // Fetch real admin stats using your Flow scripts
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.addr) return;
      
      try {
        setIsLoadingStats(true);
        await initConfig();

        // Fetch platform stats using your script
        const platformStatsScript = await getPlatformStats();
        const stats = await fcl.query({
          cadence: platformStatsScript,
        });

        console.log('Platform stats from contract:', stats);

        // Fetch all markets to calculate daily/weekly stats
        const allMarketsScript = await getAllMarkets();
        const markets = await fcl.query({
          cadence: allMarketsScript,
        });

        console.log('All markets from contract:', markets);

        // Calculate daily/weekly creation stats
        const now = Date.now() / 1000;
        const oneDayAgo = now - (24 * 60 * 60);
        const oneWeekAgo = now - (7 * 24 * 60 * 60);

        const marketsCreatedToday = markets?.filter((market: any) => 
          parseFloat(market.createdAt) >= oneDayAgo
        ).length || 0;

        const marketsCreatedThisWeek = markets?.filter((market: any) => 
          parseFloat(market.createdAt) >= oneWeekAgo
        ).length || 0;

        // Calculate average volume
        const totalVolume = parseFloat(stats.totalVolume || "0");
        const averageVolume = markets?.length > 0 ? totalVolume / markets.length : 0;

        setCreationStats({
          marketsCreatedToday,
          marketsCreatedThisWeek,
          averageVolume,
          successRate: 100, // You can calculate this based on resolved markets
          totalCreators: parseInt(stats.totalUsers?.toString() || "0"),
          totalMarkets: parseInt(stats.totalMarkets?.toString() || "0"),
          activeMarkets: parseInt(stats.activeMarkets?.toString() || "0"),
          totalUsers: parseInt(stats.totalUsers?.toString() || "0"),
          totalVolume: stats.totalVolume?.toString() || "0",
          totalFees: stats.totalFees?.toString() || "0"
        });

      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        setError("Failed to load admin statistics from contract");
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (loggedIn) {
      fetchStats();
    }
  }, [loggedIn, user]);

  const handleMarketSubmission = async (marketData: any) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Creating market with data:", marketData);
      
      // The CreateMarketForm handles the actual contract interaction using your scripts
      // This will be called after successful transaction
      if (marketData.success && marketData.transactionId) {
        setCreatedMarketId(marketData.marketId || Math.floor(Math.random() * 1000) + 100);
        setCreationSuccess(true);
        
        // Refresh stats after successful creation
        const fetchUpdatedStats = async () => {
          try {
            await initConfig();
            const platformStatsScript = await getPlatformStats();
            const updatedStats = await fcl.query({
              cadence: platformStatsScript,
            });
            
            setCreationStats(prev => ({
              ...prev,
              totalMarkets: parseInt(updatedStats.totalMarkets?.toString() || "0"),
              activeMarkets: parseInt(updatedStats.activeMarkets?.toString() || "0"),
              totalVolume: updatedStats.totalVolume?.toString() || "0",
              marketsCreatedToday: prev.marketsCreatedToday + 1,
              marketsCreatedThisWeek: prev.marketsCreatedThisWeek + 1
            }));
          } catch (error) {
            console.error("Failed to refresh stats:", error);
          }
        };

        fetchUpdatedStats();
        
        // Redirect after a delay
        setTimeout(() => {
          router.push(`/markets`);
        }, 3000);
      } else if (!marketData.success) {
        setError(marketData.error || "Failed to create market");
      }
      
    } catch (error: any) {
      console.error("Failed to create market:", error);
      setError(`Failed to create market: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show login prompt if not connected
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#0A0C14] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-[#9b87f5] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-4">
              You need to connect your Flow wallet to access admin features.
            </p>
            <Button 
              onClick={() => router.push("/markets")}
              className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
            >
              Go to Markets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (creationSuccess) {
    return (
      <div className="min-h-screen bg-[#0A0C14] flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Market Created Successfully!</h1>
              <p className="text-gray-400 mb-6">
                Your market has been deployed to the Flow blockchain and is now live on the platform.
              </p>
              
              <div className="bg-[#0A0C14] p-4 rounded-lg border border-gray-800/50 mb-6">
                <p className="text-sm font-medium text-[#9b87f5]">Market ID: #{createdMarketId}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Contract: {process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT}
                </p>
                <p className="text-xs text-gray-400">
                  Network: {process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet'}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  asChild
                  className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
                >
                  <Link href="/markets">
                    View Markets
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  asChild
                  className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
                >
                  <Link href="/admin">
                    Back to Admin
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  asChild
                  className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
                >
                  <Link href="/admin/create">
                    Create Another
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C14]">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
            >
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Zap className="h-8 w-8 text-[#9b87f5]" />
                <h1 className="text-4xl font-bold text-white">Create New Market</h1>
              </div>
              <p className="text-gray-400">
                Deploy a new prediction market to the Flow blockchain
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30">
                  Connected: {user?.addr?.slice(0, 10)}...
                </Badge>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Admin Panel
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <Activity className="h-3 w-3 mr-1" />
                  {process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet'} Network
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Creation Stats - Now using real data from your Flow scripts */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Created Today</p>
                  {isLoadingStats ? (
                    <div className="h-8 w-8 bg-gray-700 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white">{creationStats.marketsCreatedToday}</p>
                  )}
                  <p className="text-xs text-blue-400">Markets</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">This Week</p>
                  {isLoadingStats ? (
                    <div className="h-8 w-8 bg-gray-700 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white">{creationStats.marketsCreatedThisWeek}</p>
                  )}
                  <p className="text-xs text-green-400">Markets</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Volume</p>
                  {isLoadingStats ? (
                    <div className="h-8 w-8 bg-gray-700 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white">
                      {(parseFloat(creationStats.totalVolume) / 1000).toFixed(1)}K
                    </p>
                  )}
                  <p className="text-xs text-yellow-400">FLOW</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Markets</p>
                  {isLoadingStats ? (
                    <div className="h-8 w-8 bg-gray-700 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white">{creationStats.activeMarkets}</p>
                  )}
                  <p className="text-xs text-green-400">Live</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  {isLoadingStats ? (
                    <div className="h-8 w-8 bg-gray-700 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white">{creationStats.totalUsers}</p>
                  )}
                  <p className="text-xs text-[#9b87f5]">Registered</p>
                </div>
                <Users className="h-8 w-8 text-[#9b87f5]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guidelines */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <span>Market Creation Guidelines</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-green-400 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Best Practices</span>
                </h4>
                <ul className="text-sm space-y-2 text-gray-400">
                  <li className="flex items-start space-x-2">
                    <Target className="h-3 w-3 mt-1 text-green-400 flex-shrink-0" />
                    <span>Use clear, unambiguous language</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Target className="h-3 w-3 mt-1 text-green-400 flex-shrink-0" />
                    <span>Set realistic end dates and resolution criteria</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Target className="h-3 w-3 mt-1 text-green-400 flex-shrink-0" />
                    <span>Choose appropriate betting limits (Min: 0.1 FLOW, Max: 1000 FLOW)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Target className="h-3 w-3 mt-1 text-green-400 flex-shrink-0" />
                    <span>Include reliable data sources for resolution</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Target className="h-3 w-3 mt-1 text-green-400 flex-shrink-0" />
                    <span>Test market parameters thoroughly</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Target className="h-3 w-3 mt-1 text-green-400 flex-shrink-0" />
                    <span>Consider transaction fees (Creation fee: 10 FLOW)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-red-400 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Avoid</span>
                </h4>
                <ul className="text-sm space-y-2 text-gray-400">
                  <li className="flex items-start space-x-2">
                    <AlertTriangle className="h-3 w-3 mt-1 text-red-400 flex-shrink-0" />
                    <span>Subjective or opinion-based questions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <AlertTriangle className="h-3 w-3 mt-1 text-red-400 flex-shrink-0" />
                    <span>Markets that could influence outcomes</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <AlertTriangle className="h-3 w-3 mt-1 text-red-400 flex-shrink-0" />
                    <span>Illegal, harmful, or inappropriate content</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <AlertTriangle className="h-3 w-3 mt-1 text-red-400 flex-shrink-0" />
                    <span>Extremely short timeframes (&lt;1 hour)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <AlertTriangle className="h-3 w-3 mt-1 text-red-400 flex-shrink-0" />
                    <span>Markets without clear resolution criteria</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <AlertTriangle className="h-3 w-3 mt-1 text-red-400 flex-shrink-0" />
                    <span>Duplicate or very similar existing markets</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Information - Now shows real contract info */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Shield className="h-5 w-5 text-[#9b87f5]" />
              <span>Contract Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-[#0A0C14] p-4 rounded-lg border border-gray-800/50">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Contract Address:</span>
                  <p className="text-[#9b87f5] font-mono break-all">
                    {process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Network:</span>
                  <p className="text-green-400">Flow {process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Admin Address:</span>
                  <p className="text-blue-400 font-mono">{user?.addr}</p>
                </div>
                <div>
                  <span className="text-gray-400">Creation Fee:</span>
                  <p className="text-yellow-400">10.0 FLOW</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Creation Form */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Zap className="h-5 w-5 text-[#9b87f5]" />
              <span>Market Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreateMarketForm 
              onSubmit={handleMarketSubmission}
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-[#0A0C14]/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="w-full max-w-md bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
              <CardContent className="p-8 text-center">
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-[#9b87f5] mx-auto"></div>
                  <Loader2 className="absolute inset-0 h-16 w-16 mx-auto text-[#9b87f5] animate-pulse" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Creating Market...</h3>
                <p className="text-gray-400 mb-4">
                  Deploying smart contract transaction to Flow blockchain
                </p>
                <div className="bg-[#0A0C14] p-3 rounded-lg border border-gray-800/50">
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                    <div className="animate-pulse">⚡</div>
                    <span>Using contract: {process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT}</span>
                    <div className="animate-pulse">⚡</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  This may take 10-30 seconds depending on network congestion
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}