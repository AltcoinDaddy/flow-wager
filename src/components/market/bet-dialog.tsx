/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import flowConfig from "@/lib/flow/config";
import { useAuth } from "@/providers/auth-provider";
import type { Market } from "@/types/market";
import * as fcl from "@onflow/fcl";
import {
  ArrowUpRight,
  Calculator,
  Coins,
  DollarSign,
  Loader2,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface BetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: Market;
  initialSide?: "optionA" | "optionB";
  onBetSuccess?: () => void;
}

export function BetDialog({
  open,
  onOpenChange,
  market,
  initialSide = "optionA",
  onBetSuccess,
}: BetDialogProps) {
  const { user, balance } = useAuth();
  const [side, setSide] = useState<"optionA" | "optionB">(initialSide);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate market percentages and prices
  const totalShares =
    parseFloat(market.totalOptionAShares) +
    parseFloat(market.totalOptionBShares);
  const optionAPercentage =
    totalShares > 0
      ? (parseFloat(market.totalOptionAShares) / totalShares) * 100
      : 50;
  const optionBPercentage = 100 - optionAPercentage;

  // Simple price calculation (can be made more sophisticated)
  const optionAPrice = optionAPercentage / 100;
  const optionBPrice = optionBPercentage / 100;

  const currentPrice = side === "optionA" ? optionAPrice : optionBPrice;
  const shares = amount ? parseFloat(amount) / currentPrice : 0;
  const maxPayout = shares * 1; // Each share pays 1 FLOW if correct
  const potentialProfit = maxPayout - (parseFloat(amount) || 0);

  useEffect(() => {
    setSide(initialSide);
  }, [initialSide]);

  const handleBet = async () => {
    if (!user || !amount) return;

    const betAmount = parseFloat(amount);
    const userBalanceNum = parseFloat(balance || "0");

    // Validate sufficient balance
    if (betAmount > userBalanceNum) {
      setError(`Insufficient balance. You have ${balance} FLOW`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      flowConfig();

      const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT;  
  const transactionId = await fcl.mutate({
      cadence: `
        import FlowWager from ${CONTRACT_ADDRESS}
        import FungibleToken from 0xf233dcee88fe0abe
        import FlowToken from 0x1654653399040a61

        transaction(marketId: UInt64, option: UInt8, amount: UFix64) {
          prepare(signer: auth(Storage, Capabilities) &Account) {
            // Check balance
            let vaultRef = signer.storage.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
              ?? panic("Could not borrow FlowToken vault")
            
            if vaultRef.balance < amount {
              panic("Insufficient balance")
            }
          }

          execute {
            // Call the buyShares function from your contract
            FlowWager.buyShares(
              marketId: marketId,
              option: option,
              amount: amount
            )
          }
        }
      `,
      args: (arg, t) => [
        arg(market.id, t.UInt64),
        arg(side === "optionA" ? 0 : 1, t.UInt8),
        arg(betAmount.toFixed(8), t.UFix64),
      ],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 9999,
    });


      const transaction = await fcl.tx(transactionId).onceSealed();

      console.log("Transaction result:", transaction);


      if (transaction.status === 4) {
        onBetSuccess?.();
        setAmount("");
        onOpenChange(false);
      } else {
        throw new Error(
          `Transaction failed with status: ${transaction.status}`
        );
      }
    } catch (error: any) {
      let errorMessage = "Failed to place bet";
      if (error.message) {
        if (error.message.includes("Insufficient balance")) {
          errorMessage = "Insufficient FLOW balance in your wallet";
        } else if (error.message.includes("User rejected")) {
          errorMessage = "Transaction was cancelled";
        } else if (error.message.includes("Market not found")) {
          errorMessage = "Market not found or inactive";
        } else if (error.message.includes("Invalid option")) {
          errorMessage = "Invalid betting option selected";
        } else {
          errorMessage =
            error.message.substring(0, 100) +
            (error.message.length > 100 ? "..." : "");
        }
      }
      setError(errorMessage);

      console.log("Betting error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const minBet = parseFloat(market.minBet);
  const maxBet = parseFloat(market.maxBet);
  const currentAmount = parseFloat(amount || "0");
  const userBalanceNum = parseFloat(balance || "0");
  const isValidAmount =
    currentAmount >= minBet &&
    currentAmount <= maxBet &&
    currentAmount > 0 &&
    currentAmount <= userBalanceNum;

  const quickAmounts = [
    minBet.toString(),
    (minBet * 5).toString(),
    (minBet * 10).toString(),
    Math.min(maxBet, userBalanceNum).toString(),
  ].filter(
    (amt, index, arr) =>
      arr.indexOf(amt) === index && parseFloat(amt) <= userBalanceNum
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-gradient-to-br from-[#0A0C14] via-[#1A1F2C] to-[#151923] border border-gray-800/50 max-w-lg backdrop-blur-xl"
        style={{ maxHeight: "500px", overflowY: "auto" }}
      >
        <DialogHeader className="space-y-4 pb-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#9b87f5]/10 rounded-lg">
              <Zap className="h-5 w-5 text-[#9b87f5]" />
            </div>
            <DialogTitle className="text-xl text-white">
              Place Your Bet
            </DialogTitle>
          </div>

          {/* Market Preview */}
          <div className="bg-gradient-to-r from-[#1A1F2C]/80 to-[#151923]/80 rounded-xl p-4 border border-gray-800/30">
            <h3 className="font-semibold text-white mb-2 line-clamp-1">
              {market.title}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-2 mb-3">
              {market.description}
            </p>

            {/* Market Odds Display */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Current Odds</div>
              <div className="flex space-x-4 text-xs">
                <span className="text-[#9b87f5]">
                  {market.optionA}: {formatPercentage(optionAPercentage)}
                </span>
                <span className="text-gray-400">
                  {market.optionB}: {formatPercentage(optionBPercentage)}
                </span>
              </div>
            </div>
            <Progress
              value={optionAPercentage}
              className="h-2 mt-2 bg-gray-800"
            >
              <div
                className="h-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] transition-all duration-300 rounded-full"
                style={{ width: `${optionAPercentage}%` }}
              />
            </Progress>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Side Selection */}
          <div className="space-y-4">
            <Label className="text-gray-300 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Choose your prediction</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={side === "optionA" ? "default" : "outline"}
                onClick={() => setSide("optionA")}
                className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  side === "optionA"
                    ? "bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white shadow-lg shadow-[#9b87f5]/25 transform scale-105"
                    : "border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]/50"
                }`}
              >
                <span className="font-semibold text-sm">{market.optionA}</span>
                <span className="text-xs opacity-80">
                  {formatPercentage(optionAPercentage)}
                </span>
              </Button>
              <Button
                variant={side === "optionB" ? "default" : "outline"}
                onClick={() => setSide("optionB")}
                className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                  side === "optionB"
                    ? "bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white shadow-lg shadow-[#9b87f5]/25 transform scale-105"
                    : "border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]/50"
                }`}
              >
                <span className="font-semibold text-sm">{market.optionB}</span>
                <span className="text-xs opacity-80">
                  {formatPercentage(optionBPercentage)}
                </span>
              </Button>
            </div>
          </div>

          <Separator className="bg-gray-800/50" />

          {/* Amount Input */}
          <div className="space-y-4">
            <Label
              htmlFor="amount"
              className="text-gray-300 flex items-center space-x-2"
            >
              <Wallet className="h-4 w-4" />
              <span>Bet Amount (FLOW)</span>
            </Label>

            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min={minBet}
                max={maxBet}
                step="0.01"
                className="pl-10 bg-[#0A0C14] border-gray-700 text-white placeholder-gray-500 h-12 text-lg font-medium focus:border-[#9b87f5] focus:ring-[#9b87f5]/20"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount)}
                  className="border-gray-700 text-gray-300 hover:bg-[#9b87f5]/10 hover:border-[#9b87f5]/50 text-xs"
                >
                  {formatCurrency(quickAmount)}
                </Button>
              ))}
            </div>

            <div className="flex justify-between text-xs text-gray-400">
              <span>Min: {formatCurrency(market.minBet)} FLOW</span>
              <span>Max: {formatCurrency(market.maxBet)} FLOW</span>
            </div>

            {amount && !isValidAmount && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-red-400 text-xs">
                  Amount must be between {formatCurrency(market.minBet)} and{" "}
                  {formatCurrency(market.maxBet)} FLOW
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Bet Summary */}
          {amount && isValidAmount && (
            <div className="bg-gradient-to-r from-[#0A0C14] to-[#1A1F2C]/50 rounded-xl p-4 border border-gray-800/50">
              <div className="flex items-center space-x-2 mb-3">
                <Calculator className="h-4 w-4 text-[#9b87f5]" />
                <span className="text-sm font-medium text-gray-300">
                  Bet Summary
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Betting on:</span>
                  <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30 font-medium">
                    {side === "optionA" ? market.optionA : market.optionB}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Amount:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(amount)} FLOW
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">
                    Shares received:
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(shares)}
                  </span>
                </div>

                <Separator className="bg-gray-800/30" />

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm flex items-center space-x-1">
                    <Coins className="h-3 w-3" />
                    <span>Max payout:</span>
                  </span>
                  <span className="text-green-400 font-bold">
                    {formatCurrency(maxPayout)} FLOW
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm flex items-center space-x-1">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>Potential profit:</span>
                  </span>
                  <span className="text-green-400 font-bold">
                    +{formatCurrency(potentialProfit)} FLOW
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-[#1A1F2C] h-12"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBet}
              disabled={!amount || !isValidAmount || isLoading || !user}
              className="flex-1 bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white h-12 font-semibold shadow-lg shadow-[#9b87f5]/25 hover:shadow-[#9b87f5]/40 transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Placing Bet...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Place Bet
                </>
              )}
            </Button>
          </div>

          {!user && (
            <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-sm text-yellow-400">
                Please connect your wallet to place bets
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
