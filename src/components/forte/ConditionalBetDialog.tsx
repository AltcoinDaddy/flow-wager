"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import {
  TrendingUp,
  Clock,
  Target,
  DollarSign,
  Settings,
  AlertCircle,
  Info,
  Zap,
  Timer,
  Repeat,
  Shield,
  BarChart3
} from 'lucide-react';
import { useForteActions, ConditionalBetParams } from '@/hooks/useForteActions';
import { toast } from 'sonner';

interface ConditionalBetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketId?: string;
  marketTitle?: string;
  currentOdds?: { yes: number; no: number };
  onSuccess?: () => void;
}

interface BetConditions {
  minOdds?: number;
  maxOdds?: number;
  priceThreshold?: number;
  timeWindow?: { start: string; end: string };
  maxSlippage?: number;
  stopLoss?: number;
  autoRebet?: boolean;
  rebetConditions?: {
    maxAttempts: number;
    delayBetween: number;
  };
}

export const ConditionalBetDialog: React.FC<ConditionalBetDialogProps> = ({
  open,
  onOpenChange,
  marketId = '',
  marketTitle = '',
  currentOdds,
  onSuccess
}) => {
  const { createConditionalBet, createAdvancedBetConditions, isLoading } = useForteActions();

  const [activeTab, setActiveTab] = useState('basic');
  const [betAmount, setBetAmount] = useState('');
  const [prediction, setPrediction] = useState<boolean>(true);
  const [conditions, setConditions] = useState<BetConditions>({
    autoRebet: false,
    rebetConditions: {
      maxAttempts: 3,
      delayBetween: 60
    }
  });

  // Advanced settings
  const [useAdvancedTiming, setUseAdvancedTiming] = useState(false);
  const [useRiskManagement, setUseRiskManagement] = useState(false);
  const [useAutoRebet, setUseAutoRebet] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setBetAmount('');
      setPrediction(true);
      setConditions({
        autoRebet: false,
        rebetConditions: {
          maxAttempts: 3,
          delayBetween: 60
        }
      });
      setUseAdvancedTiming(false);
      setUseRiskManagement(false);
      setUseAutoRebet(false);
      setActiveTab('basic');
    }
  }, [open]);

  const handleConditionChange = (key: keyof BetConditions, value: any) => {
    setConditions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTimeWindowChange = (field: 'start' | 'end', value: string) => {
    setConditions(prev => ({
      ...prev,
      timeWindow: {
        ...prev.timeWindow,
        start: field === 'start' ? value : prev.timeWindow?.start || '',
        end: field === 'end' ? value : prev.timeWindow?.end || ''
      }
    }));
  };

  const handleRebetConditionChange = (field: 'maxAttempts' | 'delayBetween', value: number) => {
    setConditions(prev => ({
      ...prev,
      rebetConditions: {
        ...prev.rebetConditions,
        [field]: value
      }
    }));
  };

  const validateForm = (): string | null => {
    if (!marketId) return 'Market ID is required';
    if (!betAmount || parseFloat(betAmount) <= 0) return 'Valid bet amount is required';

    if (conditions.minOdds && conditions.maxOdds) {
      if (conditions.minOdds >= conditions.maxOdds) {
        return 'Min odds must be less than max odds';
      }
    }

    if (conditions.timeWindow?.start && conditions.timeWindow?.end) {
      const start = new Date(conditions.timeWindow.start);
      const end = new Date(conditions.timeWindow.end);
      if (start >= end) {
        return 'Start time must be before end time';
      }
      if (start <= new Date()) {
        return 'Start time must be in the future';
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validation = validateForm();
    if (validation) {
      toast.error(validation);
      return;
    }

    try {
      const advancedConditions = createAdvancedBetConditions({
        minOdds: conditions.minOdds,
        maxOdds: conditions.maxOdds,
        priceThreshold: conditions.priceThreshold,
        timeWindow: conditions.timeWindow ? {
          start: new Date(conditions.timeWindow.start).getTime(),
          end: new Date(conditions.timeWindow.end).getTime()
        } : undefined,
        maxSlippage: conditions.maxSlippage,
        stopLoss: conditions.stopLoss,
        autoRebet: conditions.autoRebet,
        rebetConditions: conditions.autoRebet ? conditions.rebetConditions : undefined
      });

      const result = await createConditionalBet({
        marketId,
        amount: betAmount,
        prediction,
        conditions: advancedConditions
      });

      if (result.success) {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error creating conditional bet:', error);
    }
  };

  const getEstimatedPayout = () => {
    if (!betAmount || !currentOdds) return null;

    const amount = parseFloat(betAmount);
    const odds = prediction ? currentOdds.yes : currentOdds.no;
    return (amount * odds).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Create Conditional Bet
          </DialogTitle>
          <DialogDescription>
            Set up automated betting with advanced conditions and risk management
          </DialogDescription>
        </DialogHeader>

        {marketTitle && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Market:</strong> {marketTitle}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bet-amount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Bet Amount (FLOW)
                  </Label>
                  <Input
                    id="bet-amount"
                    type="number"
                    step="0.01"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Prediction
                  </Label>
                  <Select
                    value={prediction.toString()}
                    onValueChange={(value) => setPrediction(value === 'true')}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          Yes/True
                        </div>
                      </SelectItem>
                      <SelectItem value="false">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full" />
                          No/False
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Bet Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="font-medium">{betAmount || '0.00'} FLOW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Prediction:</span>
                    <Badge variant={prediction ? 'default' : 'secondary'}>
                      {prediction ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {currentOdds && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current Odds:</span>
                        <span className="font-medium">
                          {prediction ? currentOdds.yes.toFixed(2) : currentOdds.no.toFixed(2)}x
                        </span>
                      </div>
                      {getEstimatedPayout() && (
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-medium">Est. Payout:</span>
                          <span className="font-bold text-green-600">
                            {getEstimatedPayout()} FLOW
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="conditions" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Odds Conditions
                  </CardTitle>
                  <CardDescription>
                    Set minimum and maximum odds requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="min-odds">Minimum Odds</Label>
                    <Input
                      id="min-odds"
                      type="number"
                      step="0.01"
                      value={conditions.minOdds || ''}
                      onChange={(e) => handleConditionChange('minOdds', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="1.50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-odds">Maximum Odds</Label>
                    <Input
                      id="max-odds"
                      type="number"
                      step="0.01"
                      value={conditions.maxOdds || ''}
                      onChange={(e) => handleConditionChange('maxOdds', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="5.00"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Window
                  </CardTitle>
                  <CardDescription>
                    Specify when the bet should be placed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use-timing"
                      checked={useAdvancedTiming}
                      onCheckedChange={setUseAdvancedTiming}
                    />
                    <Label htmlFor="use-timing">Use time window</Label>
                  </div>

                  {useAdvancedTiming && (
                    <>
                      <div>
                        <Label htmlFor="start-time">Start Time</Label>
                        <Input
                          id="start-time"
                          type="datetime-local"
                          value={conditions.timeWindow?.start || ''}
                          onChange={(e) => handleTimeWindowChange('start', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-time">End Time</Label>
                        <Input
                          id="end-time"
                          type="datetime-local"
                          value={conditions.timeWindow?.end || ''}
                          onChange={(e) => handleTimeWindowChange('end', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Risk Management
                </CardTitle>
                <CardDescription>
                  Configure slippage protection and stop-loss
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-risk-mgmt"
                    checked={useRiskManagement}
                    onCheckedChange={setUseRiskManagement}
                  />
                  <Label htmlFor="use-risk-mgmt">Enable risk management</Label>
                </div>

                {useRiskManagement && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max-slippage">Max Slippage (%)</Label>
                      <Input
                        id="max-slippage"
                        type="number"
                        step="0.1"
                        value={conditions.maxSlippage || ''}
                        onChange={(e) => handleConditionChange('maxSlippage', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="5.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stop-loss">Stop Loss (%)</Label>
                      <Input
                        id="stop-loss"
                        type="number"
                        step="0.1"
                        value={conditions.stopLoss || ''}
                        onChange={(e) => handleConditionChange('stopLoss', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="10.0"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Auto-Rebet Settings
                </CardTitle>
                <CardDescription>
                  Automatically retry failed bets with conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-rebet"
                    checked={useAutoRebet}
                    onCheckedChange={(checked) => {
                      setUseAutoRebet(checked);
                      handleConditionChange('autoRebet', checked);
                    }}
                  />
                  <Label htmlFor="auto-rebet">Enable auto-rebet on failure</Label>
                </div>

                {useAutoRebet && (
                  <>
                    <div>
                      <Label htmlFor="max-attempts">Maximum Attempts</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[conditions.rebetConditions?.maxAttempts || 3]}
                          onValueChange={([value]) => handleRebetConditionChange('maxAttempts', value)}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-center text-sm text-muted-foreground">
                          {conditions.rebetConditions?.maxAttempts || 3} attempts
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="delay-between">Delay Between Attempts (seconds)</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[conditions.rebetConditions?.delayBetween || 60]}
                          onValueChange={([value]) => handleRebetConditionChange('delayBetween', value)}
                          max={300}
                          min={10}
                          step={10}
                          className="w-full"
                        />
                        <div className="text-center text-sm text-muted-foreground">
                          {conditions.rebetConditions?.delayBetween || 60} seconds
                        </div>
                      </div>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Auto-rebet will retry the transaction if it fails due to network issues or temporary conditions.
                        It will not retry if the bet conditions are no longer met.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Execution Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Execution Type:</span>
                    <span>Conditional Transaction</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conditions Count:</span>
                    <span>
                      {[
                        conditions.minOdds && 'Min Odds',
                        conditions.maxOdds && 'Max Odds',
                        useAdvancedTiming && 'Time Window',
                        useRiskManagement && 'Risk Management',
                        useAutoRebet && 'Auto-Rebet'
                      ].filter(Boolean).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Gas:</span>
                    <span>~0.001 FLOW</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActiveTab('basic')}>
              <Settings className="h-4 w-4 mr-2" />
              Review
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !betAmount || !marketId}
            >
              {isLoading ? (
                <>
                  <Timer className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Create Conditional Bet
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConditionalBetDialog;
