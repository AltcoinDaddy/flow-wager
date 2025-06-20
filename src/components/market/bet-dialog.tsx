"use client";

// src/components/market/bet-dialog.tsx

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Calculator,
  Wallet
} from "lucide-react";
import type { Market } from "@/types/market";

interface BetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: Market;
  initialSide?: "optionA" | "optionB";
}

export function BetDialog({ open, onOpenChange, market, initialSide = "optionA" }: BetDialogProps) {
  const [side, setSide] = useState<"optionA" | "optionB">(initialSide);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userBalance] = useState(1234.56); // Mock balance

  // Calculate market percentages and prices
  const totalShares = market.totalOptionAShares + market.totalOptionBShares;
  const optionAPercentage = totalShares > 0 ? (market.totalOptionAShares / totalShares) * 100 : 50;
  const optionBPercentage = 100 - optionAPercentage;
  
  // Simple price calculation (can be made more sophisticated)
  const optionAPrice = optionAPercentage / 100;
  const optionBPrice = optionBPercentage / 100;
  
  const currentPrice = side === "optionA" ? optionAPrice : optionBPrice;
  const shares = amount ? (parseFloat(amount) / currentPrice) : 0;
  const maxPayout = shares * 1; // Each share pays 1 FLOW if correct
  const potentialProfit = maxPayout - parseFloat(amount || "0");
  const impliedProbability = currentPrice * 100;

  // Preset amounts
  const presetAmounts = ["10", "25", "50", "100"];

  useEffect(() => {
    setSide(initialSide);
  }, [initialSide]);

  const handleBet = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    // Check betting limits
    const betAmount = parseFloat(amount);
    if (betAmount < market.minBet || betAmount > market.maxBet) {
      alert(`Bet amount must be between ${market.minBet} and ${market.maxBet} FLOW`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form and close dialog
      setAmount("");
      onOpenChange(false);
      
      // Show success message (you'd replace this with actual toast)
      console.log("Bet placed successfully!");
    } catch (error) {
      console.error("Failed to place bet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidAmount = amount && 
    parseFloat(amount) >= market.minBet && 
    parseFloat(amount) <= market.maxBet && 
    parseFloat(amount) <= userBalance;

  const selectedOption = side === "optionA" ? market.optionA : market.optionB;
  const selectedPercentage = side === "optionA" ? optionAPercentage : optionBPercentage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Place a Bet</DialogTitle>
          <DialogDescription className="text-left">
            {market.question}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Side Selection */}
          <Tabs value={side} onValueChange={(value) => setSide(value as "optionA" | "optionB")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="optionA" 
                className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900 dark:data-[state=active]:text-green-300"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="truncate">{market.optionA}</span>
                  <span className="font-bold">{optionAPercentage.toFixed(0)}%</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="optionB"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-300"
              >
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4" />
                  <span className="truncate">{market.optionB}</span>
                  <span className="font-bold">{optionBPercentage.toFixed(0)}%</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="optionA" className="mt-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  You're betting on <strong>{market.optionA}</strong>.
                  Current probability: <strong>{optionAPercentage.toFixed(1)}%</strong>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="optionB" className="mt-4">
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You're betting on <strong>{market.optionB}</strong>.
                  Current probability: <strong>{optionBPercentage.toFixed(1)}%</strong>
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Amount Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount (FLOW)</Label>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                <span>Balance: {userBalance.toFixed(2)} FLOW</span>
              </div>
            </div>
            
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min={market.minBet}
              max={Math.min(market.maxBet, userBalance)}
            />

            {/* Betting Limits */}
            <div className="text-xs text-muted-foreground">
              Limits: {market.minBet} - {market.maxBet} FLOW
            </div>

            {/* Preset Amounts */}
            <div className="flex space-x-2">
              {presetAmounts.map((preset) => {
                const presetNum = parseFloat(preset);
                const isValidPreset = presetNum >= market.minBet && 
                                   presetNum <= market.maxBet && 
                                   presetNum <= userBalance;
                return (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(preset)}
                    disabled={!isValidPreset}
                    className="flex-1"
                  >
                    {preset} FLOW
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Bet Summary */}
          {amount && parseFloat(amount) > 0 && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Bet Summary</span>
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{amount} FLOW</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Betting on:</span>
                  <span className="font-medium">{selectedOption}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current probability:</span>
                  <span className="font-medium">{selectedPercentage.toFixed(1)}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated shares:</span>
                  <span className="font-medium">{shares.toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max payout:</span>
                    <span className="font-medium">{maxPayout.toFixed(2)} FLOW</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Potential profit:</span>
                    <span className={`font-medium ${potentialProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {potentialProfit > 0 ? '+' : ''}{potentialProfit.toFixed(2)} FLOW
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Messages */}
          {amount && parseFloat(amount) > 0 && (
            <>
              {parseFloat(amount) < market.minBet && (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Minimum bet is {market.minBet} FLOW
                  </div>
                </div>
              )}
              
              {parseFloat(amount) > market.maxBet && (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Maximum bet is {market.maxBet} FLOW
                  </div>
                </div>
              )}
              
              {parseFloat(amount) > userBalance && (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700 dark:text-red-300">
                    Insufficient balance
                  </div>
                </div>
              )}
            </>
          )}

          {/* Current Market State */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current market odds:</span>
            </div>
            <Progress value={optionAPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{optionAPercentage.toFixed(1)}% {market.optionA}</span>
              <span>{optionBPercentage.toFixed(1)}% {market.optionB}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleBet} 
            disabled={!isValidAmount || isLoading}
            className={side === "optionA" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
          >
            {isLoading ? (
              "Placing Bet..."
            ) : (
              `Bet ${amount || "0"} FLOW on ${selectedOption}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}