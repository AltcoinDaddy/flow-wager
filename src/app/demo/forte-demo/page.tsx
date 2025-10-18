"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Zap,
  Bot,
  Clock,
  Timer,
  Settings,
  Target,
  Shield,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  CheckCircle,
  AlertCircle,
  Info,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Sparkles,
  Brain,
  Rocket,
  Repeat,
  Eye,
  Code,
  Users,
  Calendar
} from 'lucide-react';
import { useForteActions } from '@/hooks/useForteActions';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

// Mock market data for demonstration
const DEMO_MARKET = {
  id: "demo_crypto_market_001",
  title: "Will Bitcoin reach $100,000 by end of 2024?",
  description: "A prediction market about Bitcoin's price reaching the $100k milestone before December 31, 2024",
  optionA: "Yes - BTC hits $100k",
  optionB: "No - BTC stays below $100k",
  totalOptionAShares: "1250.50",
  totalOptionBShares: "849.50",
  minBet: "1.0",
  maxBet: "1000.0",
  endTime: Math.floor(Date.now() / 1000) + (86400 * 30), // 30 days from now
  resolved: false,
  paused: false,
  category: "Crypto",
  totalPool: "2100.00"
};

const DEMO_SCENARIOS = [
  {
    id: 'conservative_dca',
    title: 'Conservative DCA Strategy',
    description: 'Dollar-cost average into the market with risk management',
    icon: <Shield className="h-5 w-5" />,
    difficulty: 'Beginner',
    conditions: {
      minOdds: 1.2,
      maxOdds: 2.5,
      maxSlippage: 3.0,
      stopLoss: 15.0,
      autoRebet: true,
      rebetSettings: { maxAttempts: 3, delayBetween: 300 }
    },
    amount: "10.0",
    timeWindow: {
      start: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // 1 hour from now
      end: new Date(Date.now() + 86400000).toISOString().slice(0, 16)   // 1 day from now
    }
  },
  {
    id: 'aggressive_momentum',
    title: 'Aggressive Momentum Play',
    description: 'Higher risk strategy targeting optimal odds windows',
    icon: <Rocket className="h-5 w-5" />,
    difficulty: 'Advanced',
    conditions: {
      minOdds: 1.8,
      maxOdds: 4.0,
      maxSlippage: 8.0,
      stopLoss: 25.0,
      autoRebet: true,
      rebetSettings: { maxAttempts: 5, delayBetween: 60 }
    },
    amount: "50.0",
    timeWindow: {
      start: new Date(Date.now() + 1800000).toISOString().slice(0, 16), // 30 min from now
      end: new Date(Date.now() + 7200000).toISOString().slice(0, 16)    // 2 hours from now
    }
  },
  {
    id: 'ai_oracle_based',
    title: 'AI Oracle Integration',
    description: 'Execute based on external price feeds and market sentiment',
    icon: <Brain className="h-5 w-5" />,
    difficulty: 'Expert',
    conditions: {
      minOdds: 1.5,
      maxOdds: 3.5,
      priceThreshold: 95000, // $95k BTC trigger
      maxSlippage: 5.0,
      stopLoss: 20.0,
      autoRebet: false,
    },
    amount: "25.0",
    timeWindow: {
      start: new Date(Date.now() + 7200000).toISOString().slice(0, 16),  // 2 hours from now
      end: new Date(Date.now() + 172800000).toISOString().slice(0, 16)   // 2 days from now
    }
  }
];

export default function ForteDemoPage() {
  const { user } = useAuth();
  const {
    isInitialized,
    isLoading,
    scheduledTransactions,
    initialize,
    createConditionalBet,
    createAdvancedBetConditions,
    cancelAction,
    refreshScheduledTransactions
  } = useForteActions();

  const [activeDemo, setActiveDemo] = useState('overview');
  const [selectedScenario, setSelectedScenario] = useState(DEMO_SCENARIOS[0]);
  const [demoState, setDemoState] = useState({
    step: 1,
    isExecuting: false,
    executedActions: [] as string[],
    currentOdds: { yes: 1.75, no: 2.25 },
    marketVolume: 2100.50,
    userBalance: 100.0
  });

  // Simulate market data changes
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoState(prev => ({
        ...prev,
        currentOdds: {
          yes: Math.max(1.1, Math.min(5.0, prev.currentOdds.yes + (Math.random() - 0.5) * 0.1)),
          no: Math.max(1.1, Math.min(5.0, prev.currentOdds.no + (Math.random() - 0.5) * 0.1))
        },
        marketVolume: prev.marketVolume + Math.random() * 50 - 25
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleInitializeDemo = async () => {
    if (!user) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      await initialize();
      toast.success("Forte Actions initialized! Ready for automation.");
    } catch (error) {
      toast.error("Failed to initialize Forte Actions");
    }
  };

  const handleExecuteScenario = async (scenario: typeof DEMO_SCENARIOS[0]) => {
    if (!isInitialized) {
      toast.error("Please initialize Forte Actions first");
      return;
    }

    setDemoState(prev => ({ ...prev, isExecuting: true }));

    try {
      const conditions = createAdvancedBetConditions({
        ...scenario.conditions,
        timeWindow: {
          start: new Date(scenario.timeWindow.start).getTime(),
          end: new Date(scenario.timeWindow.end).getTime()
        }
      });

      const result = await createConditionalBet({
        marketId: DEMO_MARKET.id,
        amount: scenario.amount,
        prediction: true, // Betting "Yes" for demo
        conditions
      });

      if (result.success) {
        toast.success(`${scenario.title} executed successfully!`);
        setDemoState(prev => ({
          ...prev,
          isExecuting: false,
          executedActions: [...prev.executedActions, scenario.id],
          step: prev.step + 1
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(`Failed to execute ${scenario.title}`);
      setDemoState(prev => ({ ...prev, isExecuting: false }));
    }
  };

  const calculateEstimatedPayout = (amount: string, odds: number) => {
    return (parseFloat(amount) * odds).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0C14] via-[#151923] to-[#1A1F2C] text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold">Forte Actions Live Demo</h1>
            <Sparkles className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the power of automated betting with conditional logic, risk management, and intelligent execution
          </p>

          <div className="flex items-center justify-center gap-4">
            <Badge variant={isInitialized ? "default" : "secondary"} className="px-3 py-1">
              <Bot className="h-4 w-4 mr-2" />
              {isInitialized ? "Automation Ready" : "Initialization Required"}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="h-4 w-4 mr-2" />
              {scheduledTransactions.length} Active Actions
            </Badge>
          </div>
        </div>

        {/* Demo Market Preview */}
        <Card className="bg-gradient-to-r from-[#1A1F2C]/80 to-[#151923]/80 border-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Demo Market: Bitcoin $100k Prediction
            </CardTitle>
            <CardDescription>
              Live market simulation with real-time odds and volume changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-400">Yes ({demoState.currentOdds.yes.toFixed(2)}x)</span>
                  <span className="text-gray-400">No ({demoState.currentOdds.no.toFixed(2)}x)</span>
                </div>
                <Progress value={65} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  65% probability based on current odds
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  ${demoState.marketVolume.toFixed(0)} FLOW
                </div>
                <div className="text-sm text-muted-foreground">Total Volume</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {demoState.userBalance.toFixed(1)} FLOW
                </div>
                <div className="text-sm text-muted-foreground">Your Balance</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Tabs */}
        <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="live-execution">Live Execution</TabsTrigger>
            <TabsTrigger value="code-examples">Code Examples</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    What are Forte Actions?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Forte Actions enable sophisticated automated betting strategies with conditional logic,
                    risk management, and intelligent execution timing.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Bot className="h-4 w-4 text-blue-400 mt-1" />
                      <div>
                        <div className="font-medium text-sm">Conditional Logic</div>
                        <div className="text-xs text-muted-foreground">Execute bets when specific conditions are met</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Shield className="h-4 w-4 text-green-400 mt-1" />
                      <div>
                        <div className="font-medium text-sm">Risk Management</div>
                        <div className="text-xs text-muted-foreground">Automatic slippage protection and stop-loss</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-purple-400 mt-1" />
                      <div>
                        <div className="font-medium text-sm">Time-Based Execution</div>
                        <div className="text-xs text-muted-foreground">Schedule actions for optimal timing</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Repeat className="h-4 w-4 text-orange-400 mt-1" />
                      <div>
                        <div className="font-medium text-sm">Auto-Retry Logic</div>
                        <div className="text-xs text-muted-foreground">Intelligent retry on transaction failures</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-500" />
                    Getting Started
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <span className="text-sm">Connect Wallet</span>
                      </div>
                      <Badge variant={user ? "default" : "outline"}>
                        {user ? "Connected" : "Required"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <span className="text-sm">Initialize Forte Actions</span>
                      </div>
                      <Badge variant={isInitialized ? "default" : "outline"}>
                        {isInitialized ? "Ready" : "Pending"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${demoState.executedActions.length > 0 ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <span className="text-sm">Execute Demo Scenarios</span>
                      </div>
                      <Badge variant={demoState.executedActions.length > 0 ? "default" : "outline"}>
                        {demoState.executedActions.length} Executed
                      </Badge>
                    </div>
                  </div>

                  {!user && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Connect your wallet to try the interactive demo
                      </AlertDescription>
                    </Alert>
                  )}

                  {user && !isInitialized && (
                    <Button
                      onClick={handleInitializeDemo}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      {isLoading ? "Initializing..." : "Initialize Forte Actions"}
                    </Button>
                  )}

                  {isInitialized && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Forte Actions initialized! Try the demo scenarios.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {DEMO_SCENARIOS.map((scenario) => (
                <Card
                  key={scenario.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedScenario.id === scenario.id
                      ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/50'
                      : 'bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 hover:border-gray-700'
                  }`}
                  onClick={() => setSelectedScenario(scenario)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {scenario.icon}
                        <CardTitle className="text-lg">{scenario.title}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {scenario.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>
                      {scenario.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bet Amount:</span>
                        <span className="font-medium">{scenario.amount} FLOW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Odds Range:</span>
                        <span className="font-medium">
                          {scenario.conditions.minOdds}x - {scenario.conditions.maxOdds}x
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Slippage:</span>
                        <span className="font-medium">{scenario.conditions.maxSlippage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stop Loss:</span>
                        <span className="font-medium">{scenario.conditions.stopLoss}%</span>
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecuteScenario(scenario);
                      }}
                      disabled={!isInitialized || demoState.isExecuting || demoState.executedActions.includes(scenario.id)}
                      className="w-full"
                      variant={demoState.executedActions.includes(scenario.id) ? "secondary" : "default"}
                    >
                      {demoState.executedActions.includes(scenario.id) ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Executed
                        </>
                      ) : demoState.isExecuting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Execute Scenario
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Scenario Details */}
            <Card className="bg-gradient-to-r from-[#0A0C14] to-[#1A1F2C]/50 border-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Scenario Details: {selectedScenario.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Execution Conditions</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between p-2 bg-muted/10 rounded">
                          <span>Minimum Odds:</span>
                          <span>{selectedScenario.conditions.minOdds}x</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/10 rounded">
                          <span>Maximum Odds:</span>
                          <span>{selectedScenario.conditions.maxOdds}x</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/10 rounded">
                          <span>Slippage Protection:</span>
                          <span>{selectedScenario.conditions.maxSlippage}%</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/10 rounded">
                          <span>Stop Loss:</span>
                          <span>{selectedScenario.conditions.stopLoss}%</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/10 rounded">
                          <span>Auto-Retry:</span>
                          <span>{selectedScenario.conditions.autoRebet ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Expected Outcomes</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between p-2 bg-muted/10 rounded">
                          <span>Best Case Payout:</span>
                          <span className="text-green-400">
                            {calculateEstimatedPayout(selectedScenario.amount, selectedScenario.conditions.maxOdds)} FLOW
                          </span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/10 rounded">
                          <span>Worst Case Payout:</span>
                          <span className="text-orange-400">
                            {calculateEstimatedPayout(selectedScenario.amount, selectedScenario.conditions.minOdds)} FLOW
                          </span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/10 rounded">
                          <span>Current Payout:</span>
                          <span className="text-blue-400">
                            {calculateEstimatedPayout(selectedScenario.amount, demoState.currentOdds.yes)} FLOW
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Execution Tab */}
          <TabsContent value="live-execution" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    Active Automations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scheduledTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Timer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active automations</p>
                      <p className="text-sm">Execute a demo scenario to see live automation</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {scheduledTransactions.map((tx) => (
                        <div key={tx.id} className="p-3 bg-muted/10 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4 text-blue-400" />
                              <span className="font-medium text-sm">
                                {tx.action.type.replace('_', ' ')}
                              </span>
                            </div>
                            <Badge variant={
                              tx.status === 'PENDING' ? 'secondary' :
                              tx.status === 'EXECUTED' ? 'default' :
                              'destructive'
                            }>
                              {tx.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Amount: {tx.action.amount} FLOW •
                            Market: {tx.action.marketId.slice(0, 20)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    Execution Monitor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/10 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">
                          {demoState.executedActions.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Scenarios Executed</div>
                      </div>
                      <div className="text-center p-3 bg-muted/10 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {scheduledTransactions.filter(tx => tx.status === 'EXECUTED').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Successful Executions</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current BTC Price Target:</span>
                        <span className="text-green-400">$95,000</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Oracle Status:</span>
                        <span className="text-blue-400">Active</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Next Condition Check:</span>
                        <span className="text-yellow-400">30s</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Transaction Feed */}
            <Card className="bg-gradient-to-r from-[#0A0C14] to-[#1A1F2C]/50 border-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Live Transaction Feed
                </CardTitle>
                <CardDescription>
                  Real-time execution of automated betting strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {/* Simulated transaction feed */}
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded text-sm">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-muted-foreground">12:34:56</span>
                    <span>Conservative DCA executed: 10 FLOW bet at 1.8x odds</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded text-sm">
                    <Clock className="h-3 w-3 text-blue-400" />
                    <span className="text-muted-foreground">12:33:42</span>
                    <span>Momentum strategy waiting for odds window: 1.8x - 4.0x</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded text-sm">
                    <Timer className="h-3 w-3 text-yellow-400" />
                    <span className="text-muted-foreground">12:32:18</span>
                    <span>Oracle integration monitoring BTC price: $94,250</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded text-sm">
                    <Bot className="h-3 w-3 text-purple-400" />
                    <span className="text-muted-foreground">12:31:05</span>
                    <span>Risk management triggered: Slippage protection activated</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Code Examples Tab */}
          <TabsContent value="code-examples" className="space-y-6">
            <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-green-500" />
                  Integration Examples
                </CardTitle>
                <CardDescription>
                  Copy-paste code examples for implementing Forte Actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">1. Basic Conditional Bet</h4>
                  <div className="bg-gray-900/50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                    <pre>{`const { createConditionalBet, createAdvancedBetConditions } = useForteActions();

const handleConditionalBet = async () => {
  const conditions = createAdvancedBetConditions({
    minOdds: 1.5,
    maxOdds: 3.0,
    maxSlippage: 5.0,
    timeWindow: {
      start: Date.now() + 3600000,  // 1 hour from now
      end: Date.now() + 86400000    // 24 hours from now
    }
  });

  const result = await createConditionalBet({
    marketId: "market_123",
    amount: "10.0",
    prediction: true,
    conditions
  });

  if (result.success) {
    console.log("Conditional bet created!");
  }
};`}</pre>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">2. Advanced Risk Management</h4>
                  <div className="bg-gray-900/50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                    <pre>{`const advancedStrategy = {
  minOdds: 1.8,
  maxOdds: 4.0,
  maxSlippage: 3.0,      // Max 3% slippage
  stopLoss: 15.0,        // Stop at 15% loss
  autoRebet: true,       // Retry on failure
  rebetConditions: {
    maxAttempts: 5,
    delayBetween: 60     // 60 seconds between retries
  }
};

const conditions = createAdvancedBetConditions(advancedStrategy);`}</pre>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">3. React Hook Integration</h4>
                  <div className="bg-gray-900/50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                    <pre>{`function YourComponent() {
  const {
    isInitialized,
    scheduledTransactions,
    createConditionalBet
  } = useForteActions();

  useEffect(() => {
    // Auto-refresh scheduled transactions
    const interval = setInterval(() => {
      refreshScheduledTransactions();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {isInitialized ? (
        <Button onClick={handleCreateBet}>
          Create Automated Bet
        </Button>
      ) : (
        <Button onClick={initialize}>
          Initialize Forte Actions
        </Button>
      )}
    </div>
  );
}`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Actions */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Rocket className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-semibold">Ready to Get Started?</h3>
              </div>

              <p className="text-muted-foreground max-w-2xl mx-auto">
                Forte Actions are now integrated into your Flow Wager betting interface.
                Try creating conditional bets with advanced automation in any market!
              </p>

              <div className="flex items-center justify-center gap-4">
                <Button asChild>
                  <a href="/markets">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Browse Markets
                  </a>
                </Button>

                <Button variant="outline" asChild>
                  <a href="/forte">
                    <Settings className="h-4 w-4 mr-2" />
                    Forte Features
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
