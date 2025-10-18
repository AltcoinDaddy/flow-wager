"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Calendar,
  TrendingUp,
  Zap,
  X,
  Plus,
  Settings,
  Play,
  Pause,
  Trash2,
  AlertCircle,
  CheckCircle,
  Timer,
  DollarSign,
  Target,
  BarChart3
} from 'lucide-react';
import { useForteActions, ConditionalBetParams, OracleResolutionParams } from '@/hooks/useForteActions';
import { toast } from 'sonner';

interface ScheduledTransactionsPanelProps {
  className?: string;
}

export const ScheduledTransactionsPanel: React.FC<ScheduledTransactionsPanelProps> = ({ className }) => {
  const {
    isInitialized,
    isLoading,
    scheduledTransactions,
    error,
    initialize,
    createConditionalBet,
    scheduleMarketResolution,
    setupAutomatedPayout,
    cancelAction,
    refreshScheduledTransactions,
    createAdvancedBetConditions,
  } = useForteActions();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('scheduled');

  // Form state for conditional betting
  const [betForm, setBetForm] = useState({
    marketId: '',
    amount: '',
    prediction: true,
    minOdds: '',
    maxOdds: '',
    priceThreshold: '',
    timeStart: '',
    timeEnd: '',
    maxSlippage: '',
    stopLoss: '',
    autoRebet: false,
    maxAttempts: '3',
    delayBetween: '60',
  });

  // Form state for oracle resolution
  const [oracleForm, setOracleForm] = useState({
    marketId: '',
    oracleSymbol: 'FLOW/USD',
    targetPrice: '',
    resolutionTime: '',
  });

  const handleCreateConditionalBet = async () => {
    try {
      const conditions = createAdvancedBetConditions({
        minOdds: betForm.minOdds ? parseFloat(betForm.minOdds) : undefined,
        maxOdds: betForm.maxOdds ? parseFloat(betForm.maxOdds) : undefined,
        priceThreshold: betForm.priceThreshold ? parseFloat(betForm.priceThreshold) : undefined,
        timeWindow: betForm.timeStart && betForm.timeEnd ? {
          start: new Date(betForm.timeStart).getTime(),
          end: new Date(betForm.timeEnd).getTime(),
        } : undefined,
        maxSlippage: betForm.maxSlippage ? parseFloat(betForm.maxSlippage) : undefined,
        stopLoss: betForm.stopLoss ? parseFloat(betForm.stopLoss) : undefined,
        autoRebet: betForm.autoRebet,
        rebetConditions: betForm.autoRebet ? {
          maxAttempts: parseInt(betForm.maxAttempts),
          delayBetween: parseInt(betForm.delayBetween),
        } : undefined,
      });

      const result = await createConditionalBet({
        marketId: betForm.marketId,
        amount: betForm.amount,
        prediction: betForm.prediction,
        conditions,
      });

      if (result.success) {
        setShowCreateDialog(false);
        setBetForm({
          marketId: '',
          amount: '',
          prediction: true,
          minOdds: '',
          maxOdds: '',
          priceThreshold: '',
          timeStart: '',
          timeEnd: '',
          maxSlippage: '',
          stopLoss: '',
          autoRebet: false,
          maxAttempts: '3',
          delayBetween: '60',
        });
      }
    } catch (error) {
      console.error('Error creating conditional bet:', error);
    }
  };

  const handleScheduleOracleResolution = async () => {
    try {
      const result = await scheduleMarketResolution({
        marketId: oracleForm.marketId,
        oracleSymbol: oracleForm.oracleSymbol,
        targetPrice: oracleForm.targetPrice,
        resolutionTime: new Date(oracleForm.resolutionTime).getTime(),
      });

      if (result.success) {
        setShowCreateDialog(false);
        setOracleForm({
          marketId: '',
          oracleSymbol: 'FLOW/USD',
          targetPrice: '',
          resolutionTime: '',
        });
      }
    } catch (error) {
      console.error('Error scheduling oracle resolution:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Timer className="h-4 w-4 text-yellow-500" />;
      case 'EXECUTED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'CANCELLED':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'PLACE_BET':
        return <DollarSign className="h-4 w-4" />;
      case 'RESOLVE_MARKET':
        return <Target className="h-4 w-4" />;
      case 'CLAIM_WINNINGS':
        return <TrendingUp className="h-4 w-4" />;
      case 'AUTOMATED_PAYOUT':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  if (!isInitialized) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Forte Actions
          </CardTitle>
          <CardDescription>
            Advanced automation features for Flow Wager
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Forte Actions need to be initialized to use advanced automation features.
            </AlertDescription>
          </Alert>
          <Button
            onClick={initialize}
            disabled={isLoading}
            className="mt-4 w-full"
          >
            {isLoading ? 'Initializing...' : 'Initialize Forte Actions'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Forte Actions
            </CardTitle>
            <CardDescription>
              Manage automated transactions and scheduled actions
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshScheduledTransactions}
              disabled={isLoading}
            >
              <Clock className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Action
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Automated Action</DialogTitle>
                  <DialogDescription>
                    Set up automated betting, market resolution, or payout distribution
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="conditional-bet" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="conditional-bet">Conditional Bet</TabsTrigger>
                    <TabsTrigger value="oracle-resolution">Oracle Resolution</TabsTrigger>
                    <TabsTrigger value="automated-payout">Auto Payout</TabsTrigger>
                  </TabsList>

                  <TabsContent value="conditional-bet" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="market-id">Market ID</Label>
                        <Input
                          id="market-id"
                          value={betForm.marketId}
                          onChange={(e) => setBetForm(prev => ({ ...prev, marketId: e.target.value }))}
                          placeholder="Enter market ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bet-amount">Bet Amount (FLOW)</Label>
                        <Input
                          id="bet-amount"
                          type="number"
                          value={betForm.amount}
                          onChange={(e) => setBetForm(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Prediction</Label>
                      <Select
                        value={betForm.prediction.toString()}
                        onValueChange={(value) => setBetForm(prev => ({ ...prev, prediction: value === 'true' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes/True</SelectItem>
                          <SelectItem value="false">No/False</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Conditions (Optional)</h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="min-odds">Min Odds</Label>
                          <Input
                            id="min-odds"
                            type="number"
                            step="0.01"
                            value={betForm.minOdds}
                            onChange={(e) => setBetForm(prev => ({ ...prev, minOdds: e.target.value }))}
                            placeholder="1.50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="max-odds">Max Odds</Label>
                          <Input
                            id="max-odds"
                            type="number"
                            step="0.01"
                            value={betForm.maxOdds}
                            onChange={(e) => setBetForm(prev => ({ ...prev, maxOdds: e.target.value }))}
                            placeholder="5.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="time-start">Start Time</Label>
                          <Input
                            id="time-start"
                            type="datetime-local"
                            value={betForm.timeStart}
                            onChange={(e) => setBetForm(prev => ({ ...prev, timeStart: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="time-end">End Time</Label>
                          <Input
                            id="time-end"
                            type="datetime-local"
                            value={betForm.timeEnd}
                            onChange={(e) => setBetForm(prev => ({ ...prev, timeEnd: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto-rebet"
                          checked={betForm.autoRebet}
                          onCheckedChange={(checked) => setBetForm(prev => ({ ...prev, autoRebet: checked }))}
                        />
                        <Label htmlFor="auto-rebet">Enable auto-rebet on failure</Label>
                      </div>

                      {betForm.autoRebet && (
                        <div className="grid grid-cols-2 gap-4 pl-6">
                          <div>
                            <Label htmlFor="max-attempts">Max Attempts</Label>
                            <Input
                              id="max-attempts"
                              type="number"
                              value={betForm.maxAttempts}
                              onChange={(e) => setBetForm(prev => ({ ...prev, maxAttempts: e.target.value }))}
                              min="1"
                              max="10"
                            />
                          </div>
                          <div>
                            <Label htmlFor="delay-between">Delay Between (seconds)</Label>
                            <Input
                              id="delay-between"
                              type="number"
                              value={betForm.delayBetween}
                              onChange={(e) => setBetForm(prev => ({ ...prev, delayBetween: e.target.value }))}
                              min="10"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <Button onClick={handleCreateConditionalBet} disabled={isLoading} className="w-full">
                      {isLoading ? 'Creating...' : 'Create Conditional Bet'}
                    </Button>
                  </TabsContent>

                  <TabsContent value="oracle-resolution" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="oracle-market-id">Market ID</Label>
                        <Input
                          id="oracle-market-id"
                          value={oracleForm.marketId}
                          onChange={(e) => setOracleForm(prev => ({ ...prev, marketId: e.target.value }))}
                          placeholder="Enter market ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="oracle-symbol">Oracle Symbol</Label>
                        <Select
                          value={oracleForm.oracleSymbol}
                          onValueChange={(value) => setOracleForm(prev => ({ ...prev, oracleSymbol: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FLOW/USD">FLOW/USD</SelectItem>
                            <SelectItem value="BTC/USD">BTC/USD</SelectItem>
                            <SelectItem value="ETH/USD">ETH/USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="target-price">Target Price</Label>
                        <Input
                          id="target-price"
                          type="number"
                          step="0.01"
                          value={oracleForm.targetPrice}
                          onChange={(e) => setOracleForm(prev => ({ ...prev, targetPrice: e.target.value }))}
                          placeholder="1.25"
                        />
                      </div>
                      <div>
                        <Label htmlFor="resolution-time">Resolution Time</Label>
                        <Input
                          id="resolution-time"
                          type="datetime-local"
                          value={oracleForm.resolutionTime}
                          onChange={(e) => setOracleForm(prev => ({ ...prev, resolutionTime: e.target.value }))}
                        />
                      </div>
                    </div>

                    <Button onClick={handleScheduleOracleResolution} disabled={isLoading} className="w-full">
                      {isLoading ? 'Scheduling...' : 'Schedule Oracle Resolution'}
                    </Button>
                  </TabsContent>

                  <TabsContent value="automated-payout" className="space-y-4">
                    <div>
                      <Label htmlFor="payout-market-id">Market ID</Label>
                      <Input
                        id="payout-market-id"
                        placeholder="Enter market ID for automated payout"
                      />
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This will automatically distribute payouts when the market is resolved.
                      </AlertDescription>
                    </Alert>
                    <Button disabled={isLoading} className="w-full">
                      {isLoading ? 'Setting up...' : 'Setup Automated Payout'}
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="scheduled">Scheduled ({scheduledTransactions.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[400px]">
              {scheduledTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled transactions</p>
                  <p className="text-sm">Create automated actions to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledTransactions.map((transaction) => (
                    <Card key={transaction.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getActionTypeIcon(transaction.action.type)}
                          <div>
                            <div className="font-medium">
                              {transaction.action.type.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Market: {transaction.action.marketId}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            transaction.status === 'PENDING' ? 'secondary' :
                            transaction.status === 'EXECUTED' ? 'default' :
                            transaction.status === 'FAILED' ? 'destructive' : 'outline'
                          }>
                            {getStatusIcon(transaction.status)}
                            {transaction.status}
                          </Badge>
                          {transaction.status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelAction(transaction.id)}
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Execute at: {new Date(transaction.executeAt).toLocaleString()}
                      </div>
                      {transaction.action.amount && (
                        <div className="text-sm text-muted-foreground">
                          Amount: {transaction.action.amount} FLOW
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history">
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Transaction history coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ScheduledTransactionsPanel;
