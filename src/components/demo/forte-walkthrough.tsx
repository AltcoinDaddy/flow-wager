"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  Brain,
  Rocket,
  Activity,
  Eye,
  Code2,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useForteActions } from '@/hooks/useForteActions';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  action?: () => Promise<void> | void;
  actionLabel?: string;
  completed?: boolean;
}

export function ForteWalkthrough() {
  const { user } = useAuth();
  const {
    isInitialized,
    isLoading,
    scheduledTransactions,
    initialize,
    createConditionalBet,
    createAdvancedBetConditions
  } = useForteActions();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);
  const [demoState, setDemoState] = useState({
    betAmount: "10.0",
    minOdds: 1.5,
    maxOdds: 3.0,
    maxSlippage: 5.0,
    stopLoss: 15.0,
    autoRebet: false,
    timeWindow: {
      start: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      end: new Date(Date.now() + 86400000).toISOString().slice(0, 16)
    },
    currentOdds: 2.1,
    executionStatus: 'waiting'
  });

  const steps: WalkthroughStep[] = [
    {
      id: 'introduction',
      title: 'Welcome to Forte Actions',
      description: 'Learn how to automate your betting with intelligent conditions',
      icon: <Sparkles className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Automated Betting Revolution</h3>
            <p className="text-muted-foreground">
              Forte Actions bring professional-grade automation to decentralized wagering.
              Set conditions, manage risk, and let smart contracts execute your strategy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-center">
              <Clock className="h-6 w-6 text-blue-400 mx-auto mb-1" />
              <div className="text-sm font-medium">Time-Based</div>
              <div className="text-xs text-muted-foreground">Execute at optimal moments</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg text-center">
              <Shield className="h-6 w-6 text-green-400 mx-auto mb-1" />
              <div className="text-sm font-medium">Risk Protected</div>
              <div className="text-xs text-muted-foreground">Automatic safeguards</div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-center">
              <Target className="h-6 w-6 text-purple-400 mx-auto mb-1" />
              <div className="text-sm font-medium">Condition-Based</div>
              <div className="text-xs text-muted-foreground">Smart execution logic</div>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg text-center">
              <Rocket className="h-6 w-6 text-orange-400 mx-auto mb-1" />
              <div className="text-sm font-medium">Auto-Retry</div>
              <div className="text-xs text-muted-foreground">Intelligent failure handling</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'setup',
      title: 'Initialize Forte Actions',
      description: 'Connect your wallet and set up automation capabilities',
      icon: <Settings className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This is a one-time setup that creates the necessary blockchain resources for automation.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${user ? 'bg-green-400' : 'bg-gray-400'}`} />
                <span className="text-sm">Wallet Connection</span>
              </div>
              <Badge variant={user ? "default" : "outline"}>
                {user ? "Connected" : "Required"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-400' : 'bg-gray-400'}`} />
                <span className="text-sm">Forte Actions</span>
              </div>
              <Badge variant={isInitialized ? "default" : "outline"}>
                {isInitialized ? "Ready" : "Initialize"}
              </Badge>
            </div>
          </div>

          {user && !isInitialized && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-lg border border-blue-500/20">
              <h4 className="font-medium mb-2">What happens during initialization?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Creates ActionBuilder resource in your account</li>
                <li>• Sets up ActionScheduler for managing automations</li>
                <li>• Links public capabilities for interaction</li>
                <li>• Enables conditional betting features</li>
              </ul>
            </div>
          )}
        </div>
      ),
      action: async () => {
        if (!user) {
          toast.error("Please connect your wallet first");
          return;
        }
        if (!isInitialized) {
          await initialize();
          toast.success("Forte Actions initialized successfully!");
        }
      },
      actionLabel: user ? (isInitialized ? "Already Initialized" : "Initialize Now") : "Connect Wallet First"
    },
    {
      id: 'basic-conditions',
      title: 'Set Basic Conditions',
      description: 'Configure odds range and bet amount for your automation',
      icon: <Target className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bet-amount">Bet Amount (FLOW)</Label>
              <Input
                id="bet-amount"
                type="number"
                value={demoState.betAmount}
                onChange={(e) => setDemoState(prev => ({ ...prev, betAmount: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Current Market Odds</Label>
              <div className="mt-1 p-2 bg-muted/20 rounded text-center">
                <span className="text-lg font-bold text-blue-400">{demoState.currentOdds}x</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Odds Range Conditions</h4>

            <div>
              <Label>Minimum Odds: {demoState.minOdds}x</Label>
              <Slider
                value={[demoState.minOdds]}
                onValueChange={([value]) => setDemoState(prev => ({ ...prev, minOdds: value }))}
                max={5.0}
                min={1.1}
                step={0.1}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Only execute bet if odds are at least {demoState.minOdds}x
              </div>
            </div>

            <div>
              <Label>Maximum Odds: {demoState.maxOdds}x</Label>
              <Slider
                value={[demoState.maxOdds]}
                onValueChange={([value]) => setDemoState(prev => ({ ...prev, maxOdds: value }))}
                max={10.0}
                min={1.2}
                step={0.1}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Only execute bet if odds are at most {demoState.maxOdds}x
              </div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Current odds ({demoState.currentOdds}x) are {
                demoState.currentOdds >= demoState.minOdds && demoState.currentOdds <= demoState.maxOdds
                  ? "within your range - bet would execute!"
                  : "outside your range - bet will wait for better odds"
              }
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      id: 'risk-management',
      title: 'Configure Risk Management',
      description: 'Set up slippage protection and stop-loss mechanisms',
      icon: <Shield className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 p-4 rounded-lg border border-red-500/20">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Protection Settings
            </h4>
            <p className="text-sm text-muted-foreground">
              These settings protect you from unexpected market movements and transaction failures.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Maximum Slippage: {demoState.maxSlippage}%</Label>
              <Slider
                value={[demoState.maxSlippage]}
                onValueChange={([value]) => setDemoState(prev => ({ ...prev, maxSlippage: value }))}
                max={20.0}
                min={0.5}
                step={0.5}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Cancel bet if price moves more than {demoState.maxSlippage}% during execution
              </div>
            </div>

            <div>
              <Label>Stop Loss: {demoState.stopLoss}%</Label>
              <Slider
                value={[demoState.stopLoss]}
                onValueChange={([value]) => setDemoState(prev => ({ ...prev, stopLoss: value }))}
                max={50.0}
                min={5.0}
                step={1.0}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Automatically exit position if losses exceed {demoState.stopLoss}%
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-rebet"
                checked={demoState.autoRebet}
                onCheckedChange={(checked) => setDemoState(prev => ({ ...prev, autoRebet: checked }))}
              />
              <Label htmlFor="auto-rebet">Enable auto-retry on transaction failure</Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <div className="font-medium text-green-400">✓ Protected</div>
              <div className="text-muted-foreground">Slippage under {demoState.maxSlippage}%</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <div className="font-medium text-green-400">✓ Safe Exit</div>
              <div className="text-muted-foreground">Stop-loss at {demoState.stopLoss}%</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'time-windows',
      title: 'Set Time Windows',
      description: 'Define when your automated bet should be active',
      icon: <Clock className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-lg border border-blue-500/20">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Execution Timing
            </h4>
            <p className="text-sm text-muted-foreground">
              Control exactly when your automation is active. Perfect for targeting specific market events or avoiding low-activity periods.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={demoState.timeWindow.start}
                onChange={(e) => setDemoState(prev => ({
                  ...prev,
                  timeWindow: { ...prev.timeWindow, start: e.target.value }
                }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={demoState.timeWindow.end}
                onChange={(e) => setDemoState(prev => ({
                  ...prev,
                  timeWindow: { ...prev.timeWindow, end: e.target.value }
                }))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Window Duration:</span>
              <span className="font-medium">
                {Math.round((new Date(demoState.timeWindow.end).getTime() - new Date(demoState.timeWindow.start).getTime()) / (1000 * 60 * 60))} hours
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={new Date(demoState.timeWindow.start) > new Date() ? "secondary" : "default"}>
                {new Date(demoState.timeWindow.start) > new Date() ? "Scheduled" : "Active"}
              </Badge>
            </div>
          </div>

          <Alert>
            <Timer className="h-4 w-4" />
            <AlertDescription>
              Your automation will only execute bets between the specified start and end times.
              Outside this window, it will wait patiently for the next opportunity.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      id: 'execution',
      title: 'Execute Conditional Bet',
      description: 'Create your automated betting strategy with all configured conditions',
      icon: <Rocket className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-4 rounded-lg border border-green-500/20">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Ready for Launch
            </h4>
            <p className="text-sm text-muted-foreground">
              Your automated betting strategy is configured and ready to execute. Review the summary below.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Execution Conditions</h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between p-2 bg-muted/10 rounded">
                  <span>Bet Amount:</span>
                  <span>{demoState.betAmount} FLOW</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/10 rounded">
                  <span>Odds Range:</span>
                  <span>{demoState.minOdds}x - {demoState.maxOdds}x</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/10 rounded">
                  <span>Max Slippage:</span>
                  <span>{demoState.maxSlippage}%</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/10 rounded">
                  <span>Stop Loss:</span>
                  <span>{demoState.stopLoss}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-sm">Expected Outcomes</h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between p-2 bg-muted/10 rounded">
                  <span>Min Payout:</span>
                  <span className="text-orange-400">{(parseFloat(demoState.betAmount) * demoState.minOdds).toFixed(2)} FLOW</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/10 rounded">
                  <span>Max Payout:</span>
                  <span className="text-green-400">{(parseFloat(demoState.betAmount) * demoState.maxOdds).toFixed(2)} FLOW</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/10 rounded">
                  <span>Current Payout:</span>
                  <span className="text-blue-400">{(parseFloat(demoState.betAmount) * demoState.currentOdds).toFixed(2)} FLOW</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/10 rounded">
                  <span>Auto-Retry:</span>
                  <span>{demoState.autoRebet ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
            </div>
          </div>

          {demoState.executionStatus === 'executed' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                🎉 Conditional bet created successfully! Your automation is now active and monitoring market conditions.
              </AlertDescription>
            </Alert>
          )}
        </div>
      ),
      action: async () => {
        if (!isInitialized) {
          toast.error("Please initialize Forte Actions first");
          return;
        }

        try {
          const conditions = createAdvancedBetConditions({
            minOdds: demoState.minOdds,
            maxOdds: demoState.maxOdds,
            maxSlippage: demoState.maxSlippage,
            stopLoss: demoState.stopLoss,
            autoRebet: demoState.autoRebet,
            timeWindow: {
              start: new Date(demoState.timeWindow.start).getTime(),
              end: new Date(demoState.timeWindow.end).getTime()
            }
          });

          const result = await createConditionalBet({
            marketId: "demo_bitcoin_100k",
            amount: demoState.betAmount,
            prediction: true,
            conditions
          });

          if (result.success) {
            setDemoState(prev => ({ ...prev, executionStatus: 'executed' }));
            toast.success("Conditional bet created successfully!");
          } else {
            throw new Error(result.error);
          }
        } catch (error) {
          toast.error("Failed to create conditional bet");
        }
      },
      actionLabel: demoState.executionStatus === 'executed' ? "✓ Executed" : "Execute Conditional Bet"
    },
    {
      id: 'monitoring',
      title: 'Monitor Your Automations',
      description: 'Track active automations and view execution results',
      icon: <Activity className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 rounded-lg border border-purple-500/20">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Automation Dashboard
            </h4>
            <p className="text-sm text-muted-foreground">
              Monitor all your active automations, view execution history, and manage scheduled actions.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{scheduledTransactions.length}</div>
              <div className="text-xs text-muted-foreground">Active Automations</div>
            </div>
            <div className="text-center p-3 bg-muted/10 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {scheduledTransactions.filter(tx => tx.status === 'EXECUTED').length}
              </div>
              <div className="text-xs text-muted-foreground">Successful Executions</div>
            </div>
            <div className="text-center p-3 bg-muted/10 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {scheduledTransactions.filter(tx => tx.status === 'PENDING').length}
              </div>
              <div className="text-xs text-muted-foreground">Pending Actions</div>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-medium text-sm">What You Can Do</h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 p-2 bg-muted/10 rounded">
                <Eye className="h-4 w-4 text-blue-400" />
                <span>View execution history</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/10 rounded">
                <Settings className="h-4 w-4 text-green-400" />
                <span>Modify conditions</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/10 rounded">
                <Pause className="h-4 w-4 text-yellow-400" />
                <span>Pause automations</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/10 rounded">
                <BarChart3 className="h-4 w-4 text-purple-400" />
                <span>Track performance</span>
              </div>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Visit the <strong>Forte Dashboard</strong> at any time to manage your automations, view detailed analytics, and create new conditional strategies.
            </AlertDescription>
          </Alert>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const markStepCompleted = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  };

  const executeStepAction = async () => {
    const step = steps[currentStep];
    if (step.action) {
      await step.action();
      markStepCompleted(step.id);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                {currentStepData.icon}
              </div>
              <div>
                <CardTitle>Interactive Forte Actions Walkthrough</CardTitle>
                <CardDescription>
                  Step {currentStep + 1} of {steps.length}: {currentStepData.title}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsWalkthroughActive(!isWalkthroughActive)}
            >
              {isWalkthroughActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Introduction</span>
              <span>Setup</span>
              <span>Configuration</span>
              <span>Execution</span>
              <span>Monitoring</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step Content */}
          <div className="min-h-[400px]">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">{currentStepData.title}</h3>
              <p className="text-muted-foreground">{currentStepData.description}</p>
            </div>
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-500'
                      : index < currentStep || completedSteps.includes(step.id)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStepData.action && (
                <Button
                  onClick={executeStepAction}
                  disabled={isLoading || completedSteps.includes(currentStepData.id)}
                  variant={completedSteps.includes(currentStepData.id) ? "secondary" : "default"}
                >
                  {isLoading ? (
                    <>
                      <Timer className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    currentStepData.actionLabel || "Execute"
                  )}
                </Button>
              )}
              <Button
                onClick={nextStep}
                disabled={currentStep === steps.length - 1}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Dialog */}
      <Dialog open={currentStep === steps.length - 1 && completedSteps.length === steps.length}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Walkthrough Complete!
            </DialogTitle>
            <DialogDescription>
              You've successfully learned how to use Forte Actions for automated betting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Automate!</h3>
              <p className="text-sm text-muted-foreground">
                You can now create sophisticated automated betting strategies with conditional logic,
                risk management, and intelligent execution.
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" asChild>
                <a href="/markets">Try in Real Markets</a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href="/forte">Forte Dashboard</a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
