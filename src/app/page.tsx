"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketGrid } from "@/components/market/market-grid";
import { StatsCards } from "@/components/dashboard/stat-cards";
import { RankingList } from "@/components/leaderboard/ranking-list";
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  Target,
  ArrowRight,
  BarChart3,
  Shield,
  Zap,
  Globe
} from "lucide-react";

// Mock data for homepage
const mockStats = {
  totalVolume: "2,847,293.45",
  totalPnL: "15,847.23", 
  totalTrades: 1247,
  winRate: 73.2,
  activePositions: 8,
  marketsCreated: 3,
  marketsResolved: 15,
  accuracy: 78.5,
  rank: 42,
  reputation: 95.7
};

const platformStats = [
  {
    label: "Total Volume",
    value: "$2.8M",
    icon: DollarSign,
    change: "+12.5%"
  },
  {
    label: "Active Markets", 
    value: "156",
    icon: TrendingUp,
    change: "+8 today"
  },
  {
    label: "Total Users",
    value: "12.4K", 
    icon: Users,
    change: "+234 this week"
  },
  {
    label: "Accuracy Rate",
    value: "84.7%",
    icon: Target,
    change: "+2.1% avg"
  }
];

const features = [
  {
    icon: Shield,
    title: "Decentralized & Secure",
    description: "Built on Flow blockchain with smart contract security and transparent execution."
  },
  {
    icon: Zap,
    title: "Fast & Low Cost",
    description: "Instant trades with minimal fees thanks to Flow's efficient architecture."
  },
  {
    icon: Globe,
    title: "Global Markets",
    description: "Trade on events worldwide - from sports to politics to technology trends."
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track your performance with detailed statistics and leaderboards."
  }
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6">
            🎉 Now live on Flow Mainnet
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Predict the Future,
            <br />
            Earn Real Rewards
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Trade on the outcomes of real-world events with FlowWager, 
            the most advanced prediction market platform built on Flow blockchain.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/markets">
                Explore Markets
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/how-it-works">
                How It Works
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {platformStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
                <div className="text-xs text-green-600 font-medium">{stat.change}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Markets */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Markets</h2>
            <p className="text-muted-foreground">
              Most popular prediction markets trending now
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/markets">
              View All Markets
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <MarketGrid showFilters={false} />
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose FlowWager?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the future of prediction markets with cutting-edge technology 
              and user-friendly design.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Track Your Performance</h2>
            <p className="text-muted-foreground">
              Monitor your trading stats and climb the leaderboard
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              View Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <StatsCards stats={mockStats} />
      </section>

      {/* Leaderboard Preview */}
      <section className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">Top Traders</h2>
            <p className="text-muted-foreground mb-6">
              See how you stack up against the best prediction market traders
            </p>
            <Button asChild>
              <Link href="/leaderboard">
                View Full Leaderboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div>
            <RankingList showTop={5} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of traders earning real rewards by predicting real-world events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/markets">
                Browse Markets
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/dashboard">
                Connect Wallet
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}