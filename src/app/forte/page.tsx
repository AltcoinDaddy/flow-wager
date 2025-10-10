"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Zap,
  Clock,
  TrendingUp,
  Target,
  Settings,
  Calendar,
  BarChart3,
  Shield,
  Repeat,
  Timer,
  DollarSign,
  Info,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Rocket,
  Bot,
  Activity
} from 'lucide-react';
import { ScheduledTransactionsPanel } from '@/components/forte/ScheduledTransactionsPanel';
import { ConditionalBetDialog } from '@/components/forte/ConditionalBetDialog';
import { useForteActions } from '@/hooks/useForteActions';
import { useAuth } from '@/providers/auth-provider';

export default function FortePage() {
  const { user } = useAuth();
  const { isInitialized, isLoading, scheduledTransactions } = useForteActions();
  const [showConditionalBetDialog, setShowConditionalBetDialog] = useState(false);

  const features = [
    {
      icon: <Bot className="h-8 w-8 text-blue-500" />,
      title: "Automated Betting",
      description: "Set conditions and let smart contracts place bets automatically when criteria are met",
      benefits: ["Time-based execution", "Price threshold triggers", "Odds-based conditions", "Risk management"],
      status: "Available"
    },
    {
      icon: <Clock className="h-8 w-8 text-green-500" />,
      title: "Scheduled Transactions",
      description: "Schedule market resolutions and payouts to execute at specific times",
      benefits: ["Automated market closure", "Time-locked payouts", "Recurring actions", "Blockchain cron jobs"],
      status: "Available"
    },
    {
      icon: <Target className="h-8 w-8 text-purple-500" />,
      title: "Oracle Integration",
      description: "Resolve markets automatically using real-world data from price oracles",
      benefits: ["Real-time price feeds", "Automated resolution", "Trustless execution", "Multi-source data"],
      status: "Available"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-orange-500" />,
      title: "DeFi Composability",
      description: "Combine betting with other DeFi protocols for advanced strategies",
      benefits: ["Yield farming integration", "Liquidity provision", "Cross-protocol actions", "Complex workflows"],
      status: "Coming Soon"
    }
  ];

  const useCases = [
    {
      title: "Dollar Cost Averaging Bets",
      description: "Automatically place small bets over time to average out market volatility",
      icon: <BarChart3 className="h-6 w-6" />,
      complexity: "Medium"
    },
    {
      title: "Price Target Betting",
      description: "Bet on cryptocurrency prices reaching specific targets using oracle data",
      icon: <Target className="h-6 w-6" />,
      complexity: "Easy"
    },
    {
      title: "Event-Driven Wagering",
      description: "Create markets that automatically resolve based on external events",
      icon: <Calendar className="h-6 w-6" />,
      complexity: "Advanced"
    },
    {
      title: "Risk-Managed Trading",
      description: "Implement stop-losses and take-profits for your betting strategies",
      icon: <Shield className="h-6 w-6" />,
      complexity: "Medium"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-blue-500" />
          <h1 className="text-4xl font-bold">Forte Network Features</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Advanced automation and DeFi capabilities for Flow Wager powered by the Forte network upgrade
        </p>

        <div className="flex items-center justify-center gap-4">
          <Badge variant="default" className="px-3 py-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Live on Testnet
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            <Timer className="h-4 w-4 mr-2" />
            Mainnet: Oct 22, 2025
          </Badge>
        </div>
      </div>

      {/* Status Alert */}
      {!user ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to access Forte features and create automated transactions.
          </AlertDescription>
        </Alert>
      ) : !isInitialized ? (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Initialize Forte Actions to start using advanced automation features. This is a one-time setup.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Forte Actions initialized! You can now create automated transactions and scheduled actions.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  What's New in Forte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Flow Actions</p>
                      <p className="text-sm text-muted-foreground">Composable DeFi workflow automation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Scheduled Transactions</p>
                      <p className="text-sm text-muted-foreground">Time-based smart contract execution</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Enhanced Composability</p>
                      <p className="text-sm text-muted-foreground">Complex interconnected applications</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Your Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={isInitialized ? "default" : "secondary"}>
                        {isInitialized ? "Initialized" : "Not Initialized"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scheduled Actions:</span>
                      <span className="font-medium">{scheduledTransactions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Automations:</span>
                      <span className="font-medium">
                        {scheduledTransactions.filter(t => t.status === 'PENDING').length}
                      </span>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => setShowConditionalBetDialog(true)}
                      disabled={!isInitialized}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Create Automated Action
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Connect your wallet to see activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with Forte features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setShowConditionalBetDialog(true)}
                  disabled={!user || !isInitialized}
                >
                  <Bot className="h-8 w-8" />
                  <div className="text-center">
                    <p className="font-medium">Conditional Bet</p>
                    <p className="text-xs text-muted-foreground">Automate betting with conditions</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  disabled={!user || !isInitialized}
                >
                  <Clock className="h-8 w-8" />
                  <div className="text-center">
                    <p className="font-medium">Schedule Resolution</p>
                    <p className="text-xs text-muted-foreground">Auto-resolve with oracles</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  disabled={!user || !isInitialized}
                >
                  <TrendingUp className="h-8 w-8" />
                  <div className="text-center">
                    <p className="font-medium">Auto Payouts</p>
                    <p className="text-xs text-muted-foreground">Automated distribution</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {feature.icon}
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                    <Badge variant={feature.status === 'Available' ? 'default' : 'secondary'}>
                      {feature.status}
                    </Badge>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Key Benefits:</p>
                    <ul className="space-y-1">
                      {feature.benefits.map((benefit, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          {user && <ScheduledTransactionsPanel />}
          {!user && (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Wallet Not Connected</p>
                <p className="text-muted-foreground mb-4">
                  Connect your wallet to access automation features
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Use Case Examples</CardTitle>
              <CardDescription>
                Real-world scenarios where Forte automation can enhance your wagering experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {useCases.map((useCase, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {useCase.icon}
                          <CardTitle className="text-base">{useCase.title}</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {useCase.complexity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {useCase.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Code Example */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Integration Example
              </CardTitle>
              <CardDescription>
                How to implement conditional betting in your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
{`// Example: Create a conditional bet
import { useForteActions } from '@/hooks/useForteActions';

const { createConditionalBet } = useForteActions();

const handleConditionalBet = async () => {
  const result = await createConditionalBet({
    marketId: "market_123",
    amount: "10.0",
    prediction: true,
    conditions: {
      minOdds: 1.5,
      maxOdds: 3.0,
      timeWindow: {
        start: Date.now() + 3600000, // 1 hour from now
        end: Date.now() + 7200000    // 2 hours from now
      }
    }
  });

  if (result.success) {
    console.log("Conditional bet created!");
  }
};`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Conditional Bet Dialog */}
      <ConditionalBetDialog
        open={showConditionalBetDialog}
        onOpenChange={setShowConditionalBetDialog}
        onSuccess={() => {
          // Refresh data or show success message
          console.log("Conditional bet created successfully!");
        }}
      />
    </div>
  );
}
