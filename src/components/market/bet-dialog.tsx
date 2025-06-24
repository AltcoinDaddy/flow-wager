"use client";

// src/components/market/bet-dialog.tsx

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Market } from "@/types/market";
import {
  AlertTriangle,
  Calculator,
  TrendingDown,
  TrendingUp,
  Wallet
} from "lucide-react";
import { useEffect, useState } from "react";

interface BetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: Market;
  initialSide?: "optionA" | "optionB";
  onBetSuccess?: () => void;
}

export function BetDialog({ open, onOpenChange, market, initialSide = "optionA", onBetSuccess }: BetDialogProps) {
  const [side, setSide] = useState<"optionA" | "optionB">(initialSide);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userBalance] = useState(1234.56); // Mock balance

  // Calculate market percentages and prices
  const totalShares = parseFloat(market.totalOptionAShares) + parseFloat(market.totalOptionBShares);
  const optionAPercentage = totalShares > 0 ? (parseFloat(market.totalOptionAShares) / totalShares) * 100 : 50;
  const optionBPercentage = 100 - optionAPercentage;
  
  // Simple price calculation (can be made more sophisticated)
  const optionAPrice = optionAPercentage / 100;
  const optionBPrice = optionBPercentage / 100;
  
  const currentPrice = side === "optionA" ? optionAPrice : optionBPrice;
  const shares = amount ? (parseFloat(amount) / currentPrice) : 0;
  const maxPayout = shares * 1; // Each share pays 1 FLOW if correct
  const potentialProfit = maxPayout - parseFloat(amount || "0");

  // Preset amounts
  const presetAmounts = ["10", "25", "50", "100"];

  useEffect(() => {
    setSide(initialSide);
  }, [initialSide]);

  const handleBet = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    // Check betting limits
    const betAmount = parseFloat(amount);
    const minBet = parseFloat(market.minBet);
    const maxBet = parseFloat(market.maxBet);
    
    if (betAmount < minBet || betAmount > maxBet) {
      alert(`Bet amount must be between ${minBet} and ${maxBet} FLOW`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form and close dialog
      setAmount("");
      onOpenChange(false);
      
      // Call success callback
      if (onBetSuccess) {
        onBetSuccess();
      }
      
      // Show success message (you'd replace this with actual toast)
      console.log("Bet placed successfully!");
    } catch (error) {
      console.error("Failed to place bet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const minBet = parseFloat(market.minBet);
  const maxBet = parseFloat(market.maxBet);
  
  const isValidAmount = amount && 
    parseFloat(amount) >= minBet && 
    parseFloat(amount) <= maxBet && 
    parseFloat(amount) <= userBalance;

  const selectedOption = side === "optionA" ? market.optionA : market.optionB;
  const selectedPercentage = side === "optionA" ? optionAPercentage : optionBPercentage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Place a Bet</DialogTitle>
          <DialogDescription className="text-gray-300 text-left">
            {market.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Side Selection */}
          <Tabs value={side} onValueChange={(value) => setSide(value as "optionA" | "optionB")}>
            <TabsList className="grid w-full grid-cols-2 bg-[#0A0C14] border border-gray-800/50">
              <TabsTrigger 
                value="optionA" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9b87f5] data-[state=active]:to-[#8b5cf6] data-[state=active]:text-white text-gray-400"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="truncate">{market.optionA}</span>
                  <span className="font-bold">{optionAPercentage.toFixed(0)}%</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="optionB"
                className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
              >
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4" />
                  <span className="truncate">{market.optionB}</span>
                  <span className="font-bold">{optionBPercentage.toFixed(0)}%</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="optionA" className="mt-4">
              <div className="p-4 rounded-lg bg-[#9b87f5]/10 border border-[#9b87f5]/30">
                <p className="text-sm text-[#9b87f5]">
                  You&lsquo;re betting on <strong>{market.optionA}</strong>.
                  Current probability: <strong>{optionAPercentage.toFixed(1)}%</strong>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="optionB" className="mt-4">
              <div className="p-4 rounded-lg bg-gray-700/20 border border-gray-600/50">
                <p className="text-sm text-gray-300">
                  You&lsquo;re betting on <strong>{market.optionB}</strong>.
                  Current probability: <strong>{optionBPercentage.toFixed(1)}%</strong>
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Amount Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount" className="text-white">Amount (FLOW)</Label>
              <div className="flex items-center space-x-1 text-sm text-gray-400">
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
              min={minBet}
              max={Math.min(maxBet, userBalance)}
              className="bg-[#0A0C14] border-gray-800/50 text-white placeholder:text-gray-500 focus:border-[#9b87f5]/50 focus:ring-[#9b87f5]/20"
            />

            {/* Betting Limits */}
            <div className="text-xs text-gray-400">
              Limits: {minBet} - {maxBet} FLOW
            </div>

            {/* Preset Amounts */}
            <div className="flex space-x-2">
              {presetAmounts.map((preset) => {
                const presetNum = parseFloat(preset);
                const isValidPreset = presetNum >= minBet && 
                                   presetNum <= maxBet && 
                                   presetNum <= userBalance;
                return (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(preset)}
                    disabled={!isValidPreset}
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white hover:border-[#9b87f5]/50"
                  >
                    {preset}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Bet Summary */}
          {amount && parseFloat(amount) > 0 && (
            <div className="space-y-3 p-4 rounded-lg bg-[#0A0C14] border border-gray-800/50">
              <h4 className="font-medium flex items-center space-x-2 text-white">
                <Calculator className="h-4 w-4" />
                <span>Bet Summary</span>
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="font-medium text-white">{amount} FLOW</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Betting on:</span>
                  <span className="font-medium text-white">{selectedOption}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Current probability:</span>
                  <span className="font-medium text-white">{selectedPercentage.toFixed(1)}%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated shares:</span>
                  <span className="font-medium text-white">{shares.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-800/50 pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max payout:</span>
                    <span className="font-medium text-white">{maxPayout.toFixed(2)} FLOW</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Potential profit:</span>
                    <span className={`font-medium ${potentialProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
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
              {parseFloat(amount) < minBet && (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-400">
                    Minimum bet is {minBet} FLOW
                  </div>
                </div>
              )}
              
              {parseFloat(amount) > maxBet && (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-400">
                    Maximum bet is {maxBet} FLOW
                  </div>
                </div>
              )}
              
              {parseFloat(amount) > userBalance && (
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-400">
                    Insufficient balance
                  </div>
                </div>
              )}
            </>
          )}

          {/* Current Market State */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current market odds:</span>
            </div>
            <Progress value={optionAPercentage} className="h-3 bg-gray-800">
              <div 
                className="h-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] transition-all duration-300 rounded-full"
                style={{ width: `${optionAPercentage}%` }}
              />
            </Progress>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{optionAPercentage.toFixed(1)}% {market.optionA}</span>
              <span>{optionBPercentage.toFixed(1)}% {market.optionB}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-gray-800/50 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBet} 
            disabled={!isValidAmount || isLoading}
            className={`${
              side === "optionA" 
                ? "bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed]" 
                : "bg-gray-700 hover:bg-gray-600"
            } text-white`}
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