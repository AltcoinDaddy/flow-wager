import { Metadata } from 'next';
import { Suspense } from 'react';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics - Flow Wager Admin',
  description: 'Comprehensive analytics and insights for Flow Wager prediction markets',
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0C14] via-[#151923] to-[#1A1F2C]">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <BarChart3 className="h-8 w-8 text-[#9b87f5]" />
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Comprehensive insights into your Flow Wager prediction market platform
          </p>
        </div>

        {/* Quick Stats Overview */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-[#9b87f5]/10 to-[#8b5cf6]/10 border-[#9b87f5]/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-[#9b87f5]" />
                  <h3 className="text-lg font-semibold text-white">Market Analytics</h3>
                  <p className="text-sm text-gray-400">
                    Track market performance, volume, and resolution rates
                  </p>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-[#9b87f5]" />
                  <h3 className="text-lg font-semibold text-white">User Insights</h3>
                  <p className="text-sm text-gray-400">
                    Analyze user behavior, engagement, and betting patterns
                  </p>
                </div>
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-[#9b87f5]" />
                  <h3 className="text-lg font-semibold text-white">Category Trends</h3>
                  <p className="text-sm text-gray-400">
                    Monitor category performance and popularity trends
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Dashboard */}
        <Suspense fallback={<AnalyticsLoadingFallback />}>
          <AnalyticsDashboard />
        </Suspense>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Analytics data is powered by Dune Analytics and updated in real-time.
            <br />
            Data includes all markets on the Flow blockchain for your contract address.
          </p>
        </div>
      </div>
    </div>
  );
}

function AnalyticsLoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-[#1A1F2C] border-gray-800">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#1A1F2C] border-gray-800">
          <CardContent className="p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1F2C] border-gray-800">
          <CardContent className="p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
