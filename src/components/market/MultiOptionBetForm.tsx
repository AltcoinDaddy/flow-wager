"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { useFlowUpdate } from "@/hooks/useFlowUpdate";
import { MultiOptionMarket, MarketStatus } from "@/types/flowupdate";
import { toast } from "sonner";
import * as fcl from "@onflow/fcl";

interface MultiOptionBetFormProps {
  market: MultiOptionMarket;
  onBetPlaced?: (marketId: string, optionIndex: number, amount: string) => void;
  onClose?: () => void;
}

export function MultiOptionBetForm({
  market,
  onBetPlaced,
  onClose,
}: MultiOptionBetFormProps) {
  const { placeBet, error, transactionInProgress } = useFlowUpdate({
    autoFetch: false,
  });

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<string>("");
  const [potentialWinnings, setPotentialWinnings] = useState<string>("0.0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userAddress, setUserAddress] = useState<string>("");

  // Check user authentication
  useEffect(() => {
    const checkUser = async () => {
      const user = (await fcl.currentUser()) as { addr?: string };
      if (user?.addr) {
        setUserAddress(user.addr);
      }
    };
    checkUser();
  }, []);

  // Validate bet amount
  const validateBetAmount = (): string | null => {
    const amount = parseFloat(betAmount);
    const minBet = parseFloat(market.minBet);
    const maxBet = parseFloat(market.maxBet);

    if (!betAmount) return "Please enter a bet amount";
    if (isNaN(amount)) return "Invalid amount";
    if (amount < minBet) return `Minimum bet is ${minBet} FLOW`;
    if (amount > maxBet) return `Maximum bet is ${maxBet} FLOW`;

    return null;
  };

  // Calculate potential winnings (simplified - would need actual contract call)
  useEffect(() => {
    if (selectedOption !== null && betAmount) {
      const amount = parseFloat(betAmount);
      if (!isNaN(amount) && amount > 0) {
        // Simplified calculation - in production, call contract
        const totalPool = parseFloat(market.totalPool);
        const optionShares = parseFloat(
          market.optionPoolShares[selectedOption] || "0",
        );
        const newTotalShares = optionShares + amount;
        const shareOfPool = amount / newTotalShares;
        const distributablePool =
          totalPool * (1 - parseFloat(market.platformFeePercentage) / 100);
        const estimatedWinnings = distributablePool * shareOfPool;

        setPotentialWinnings(estimatedWinnings.toFixed(2));
      }
    }
  }, [selectedOption, betAmount, market]);

  const handlePlaceBet = async () => {
    try {
      // Validation
      if (selectedOption === null) {
        toast.error("Please select an option");
        return;
      }

      const validationError = validateBetAmount();
      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (!userAddress) {
        toast.error("Please connect your wallet");
        return;
      }

      // Check market status
      if (market.status !== MarketStatus.Active) {
        toast.error("This market is no longer accepting bets");
        return;
      }

      setIsSubmitting(true);

      // Place bet
      await placeBet({
        marketId: market.id,
        optionIndex: selectedOption,
        amount: betAmount,
      });

      toast.success("Bet placed successfully!");
      onBetPlaced?.(market.id, selectedOption, betAmount);

      // Reset form
      setSelectedOption(null);
      setBetAmount("");
      setPotentialWinnings("0.0");
    } catch (err) {
      console.error("Failed to place bet:", err);
      toast.error(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    selectedOption !== null &&
    betAmount &&
    !validateBetAmount() &&
    !transactionInProgress;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Place a Bet</span>
          <Badge
            variant={
              market.status === MarketStatus.Active ? "default" : "secondary"
            }
          >
            {market.status === MarketStatus.Active ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Market Status Check */}
        {market.status !== MarketStatus.Active && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This market is no longer accepting bets.
            </AlertDescription>
          </Alert>
        )}

        {/* Option Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Select an Option</Label>
          <div className="grid gap-2">
            {market.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                disabled={market.status !== MarketStatus.Active}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedOption === index
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  <span className="text-sm text-gray-500">
                    Pool: {market.optionPoolShares[index]} shares
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bet Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="bet-amount" className="text-base font-semibold">
            Bet Amount (FLOW)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              id="bet-amount"
              type="number"
              placeholder="Enter amount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              disabled={
                market.status !== MarketStatus.Active || transactionInProgress
              }
              className="pl-10"
              step="0.1"
              min={market.minBet}
              max={market.maxBet}
            />
          </div>
          <div className="text-sm text-gray-500 flex items-center justify-between">
            <span>
              Min: {market.minBet} • Max: {market.maxBet}
            </span>
          </div>
        </div>

        {/* Bet Summary */}
        {selectedOption !== null && betAmount && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Bet Amount:
                </span>
                <span className="font-semibold">{betAmount} FLOW</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Selected Option:
                </span>
                <span className="font-semibold">
                  {market.options[selectedOption]}
                </span>
              </div>
              <div className="border-t border-blue-200 dark:border-blue-800 pt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Potential Winnings:
                </span>
                <span className="font-bold text-lg text-green-600 dark:text-green-400">
                  ~{potentialWinnings} FLOW
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Error */}
        {betAmount && validateBetAmount() && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{validateBetAmount()}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handlePlaceBet}
            disabled={!isFormValid || isSubmitting}
            className="flex-1"
            size="lg"
          >
            {isSubmitting || transactionInProgress ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Place Bet"
            )}
          </Button>
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting || transactionInProgress}
              size="lg"
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center">
          Make sure you have enough FLOW tokens in your wallet to cover the bet
          amount plus transaction fees.
        </p>
      </CardContent>
    </Card>
  );
}
