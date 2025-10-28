/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  placeBetTransaction as buyShares,
  createUserAccountTransaction,
  getUserProfile as getUserAccount,
} from "@/lib/flow-wager-scripts";
import flowConfig from "@/lib/flow/config";
import { PointsManager } from "@/lib/points-system";
import { useAuth } from "@/providers/auth-provider";
import type { Market } from "@/types/market";
import { addBetToHistory, type BetInfo } from "@/utils/cookies";
import * as fcl from "@onflow/fcl";
import {
  AlertCircle,
  Calculator,
  Loader2,
  LogIn,
  UserPlus,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface BetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: Market; // Should be the V2 Market type
  initialOptionIndex?: number | null; // Use index
  onBetSuccess?: () => void;
}

// UserAccountStatus Interface
interface UserAccountStatus {
  exists: boolean;
  isCreating: boolean;
  error: string | null;
  showCreateForm: boolean;
}

// Helper to sum shares
const sumShares = (shares: string[]): number => {
  return shares.reduce((acc, share) => acc + parseFloat(share || "0"), 0);
};

export function BetDialog({
  open,
  onOpenChange,
  market,
  initialOptionIndex = 0,
  onBetSuccess,
}: BetDialogProps) {
  const { user, balance, refreshBalance, login: logIn } = useAuth();

  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(
    initialOptionIndex,
  );
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userAccount, setUserAccount] = useState<UserAccountStatus>({
    exists: false,
    isCreating: false,
    error: null,
    showCreateForm: false,
  });

  // Account creation form fields
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Calculate market percentages and prices
  const totalSharesValue = useMemo(
    () => sumShares(market.totalShares || []),
    [market.totalShares],
  );

  const optionPercentages = useMemo(() => {
    if (!market.options || !market.totalShares || totalSharesValue <= 0) {
      const numOptions = market.options?.length || 1;
      return Array(numOptions).fill(100 / numOptions);
    }
    return market.totalShares.map(
      (share) => (parseFloat(share || "0") / totalSharesValue) * 100,
    );
  }, [market.options, market.totalShares, totalSharesValue]);

  const optionPrices = useMemo(
    () => optionPercentages.map((p) => p / 100),
    [optionPercentages],
  );
  const optionOdds = useMemo(
    () => optionPrices.map((p) => (p > 0 ? 1 / p : Infinity)),
    [optionPrices],
  );

  const currentPrice = useMemo(
    () =>
      selectedOptionIndex !== null ? optionPrices[selectedOptionIndex] : 0,
    [selectedOptionIndex, optionPrices],
  );
  const currentOdds = useMemo(
    () =>
      selectedOptionIndex !== null ? optionOdds[selectedOptionIndex] : Infinity,
    [selectedOptionIndex, optionOdds],
  );
  const selectedOptionName = useMemo(
    () =>
      selectedOptionIndex !== null
        ? market.options[selectedOptionIndex]
        : "N/A",
    [selectedOptionIndex, market.options],
  );
  const leadingOptionIndex = useMemo(() => {
    // For market preview styling
    if (!optionPercentages || optionPercentages.length === 0) return -1;
    return optionPercentages.indexOf(Math.max(...optionPercentages));
  }, [optionPercentages]);

  useEffect(() => {
    if (open) {
      setSelectedOptionIndex(initialOptionIndex ?? 0);
      setAmount("");
      setError(null);
    }
  }, [open, initialOptionIndex]);

  useEffect(() => {
    const initConfig = async () => {
      try {
        flowConfig();
      } catch (error) {
        console.error("Failed to initialize Flow config:", error);
      }
    };

    if (open && user) {
      initConfig();
      checkUserAccount();
    }
  }, [open, user]);

  const checkUserAccount = async () => {
    if (!user?.addr) return;

    try {
      const getUserAccountScript = await getUserAccount();
      const profile = await fcl.query({
        cadence: getUserAccountScript,
        args: (arg: any, t: any) => [arg(user.addr, t.Address)],
      });

      setUserAccount({
        exists: !!profile,
        isCreating: false,
        error: null,
        showCreateForm: !profile,
      });
    } catch (error) {
      console.error("Error checking user account:", error);
      setUserAccount({
        exists: false,
        isCreating: false,
        error: "Failed to check account status",
        showCreateForm: true,
      });
    }
  };

  const connectWallet = async () => {
    try {
      await logIn();
    } catch (error) {
      console.error("Wallet connection failed:", error);
      toast.error("Failed to connect wallet");
    }
  };

  const createAccount = async () => {
    if (!username.trim() || !displayName.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUserAccount((prev) => ({ ...prev, isCreating: true, error: null }));

    try {
      await flowConfig();
      const createAccountScript = await createUserAccountTransaction();
      const authorization = fcl.currentUser().authorization;

      const txId = await fcl.mutate({
        cadence: createAccountScript,
        args: (arg: any, t: any) => [
          arg(username.trim(), t.String),
          arg(displayName.trim(), t.String),
        ],
        proposer: authorization,
        payer: authorization,
        authorizations: [authorization],
        limit: 1000,
      });

      toast.loading("Creating account...");
      const result = await fcl.tx(txId).onceSealed();
      toast.dismiss();

      if (result.status === 4) {
        toast.success("Account created successfully!");
        setUserAccount({
          exists: true,
          isCreating: false,
          error: null,
          showCreateForm: false,
        });
        setUsername("");
        setDisplayName("");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Account creation failed:", error);
      setUserAccount((prev) => ({
        ...prev,
        isCreating: false,
        error: "Failed to create account",
      }));
      toast.error("Failed to create account");
    }
  };

  const placeBet = async () => {
    // 1. Validations
    if (
      selectedOptionIndex === null ||
      selectedOptionIndex < 0 ||
      selectedOptionIndex >= market.options.length
    ) {
      setError("Please select an option to bet on.");
      toast.error("Please select an option to bet on.");
      return;
    }
    if (!user?.addr || !amount || !isValidAmount) {
      setError("Invalid amount or user not logged in."); // More specific error
      return;
    }

    // 2. Set loading
    setIsLoading(true);
    setError(null);

    try {
      // 3. Get V2 transaction script
      await flowConfig();
      const placeBetScript = await buyShares(); // V2 script name
      const authorization = fcl.currentUser().authorization;

      // 4. Execute transaction
      const txId = await fcl.mutate({
        cadence: placeBetScript,
        args: (arg: any, t: any) => [
          arg(market.id, t.UInt64), // Market ID as UInt64 string
          arg(selectedOptionIndex, t.UInt8), // Selected option index as UInt8
          arg(amount, t.UFix64), // Bet amount as UFix64 string
        ],
        proposer: authorization,
        payer: authorization,
        authorizations: [authorization],
        limit: 1000,
      });

      // 5. Handle transaction status
      toast.loading("Placing bet...");
      const result = await fcl.tx(txId).onceSealed();
      toast.dismiss();

      if (result.status === 4 && result.errorMessage === "") {
        // Success
        toast.success("Bet placed successfully!");

        // 6. Update Bet History
        const betInfo: BetInfo = {
          marketId: market.id,
          marketTitle: market.title,
          optionIndex: selectedOptionIndex,
          optionName: market.options[selectedOptionIndex],
          amount: parseFloat(amount),
          shares: currentPrice > 0 ? parseFloat(amount) / currentPrice : 0,
          timestamp: Date.now(),
          transactionId: txId,
        };
        addBetToHistory(user.addr, betInfo); // Ensure addBetToHistory handles V2 format

        // 7. Award points (optional)
        try {
          await PointsManager.awardPoints(
            `${user?.addr}`,
            "PLACE_BET",
            {
              marketId: parseInt(market.id),
              betAmount: parseFloat(amount),
              marketTitle: market.title,
              marketCategory: market.category?.toString() || "unknown",
              outcome: market.options[selectedOptionIndex],
              transactionId: txId,
            },
            parseInt(market.id),
          );
          console.log("✅ Betting points awarded successfully");
        } catch (pointsError) {
          console.error("❌ Error awarding betting points:", pointsError);
        }

        // 8. Refresh balance & close
        await refreshBalance();
        onBetSuccess?.();
        onOpenChange(false);
      } else {
        // Handle Transaction Failure
        console.error("Transaction failed:", result);
        const fclError =
          result.errorMessage ||
          `Transaction failed with status ${result.status}`;
        let userFriendlyError = "Transaction failed. Please try again.";
        if (fclError.includes("panic: Market is not active"))
          userFriendlyError = "Betting is closed for this market.";
        if (fclError.includes("panic: Bet below minimum"))
          userFriendlyError = `Bet amount must be at least ${market.minBet} FLOW.`;
        if (fclError.includes("panic: Bet exceeds maximum"))
          userFriendlyError = `Bet amount cannot exceed ${market.maxBet} FLOW.`;
        if (
          fclError.includes("panic: insufficient balance") ||
          fclError.includes("withdraw")
        )
          userFriendlyError = "Insufficient FLOW balance.";
        if (fclError.includes("Could not borrow UserPositions resource"))
          userFriendlyError =
            "Account setup incomplete. Please ensure your profile is created.";
        throw new Error(userFriendlyError);
      }
    } catch (error: any) {
      // Catch errors from mutate/tx or thrown errors
      console.error("Bet placement process failed:", error);
      const errorMessage =
        error.message || "Failed to place bet. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false); // Reset loading state regardless of outcome
    }
  };

  const formatCurrency = (value: string | number): string => {
    const num = typeof value === "string" ? parseFloat(value || "0") : value;
    if (isNaN(num)) return "0.00";
    if (num === Infinity) return "∞"; // Handle infinite odds
    return num.toFixed(2);
  };

  const minBet = parseFloat(market.minBet || "0");
  const maxBet = parseFloat(market.maxBet || "Infinity"); // Use Infinity if maxBet is huge/not restricted
  const currentAmount = parseFloat(amount || "0");
  const userBalanceNum = parseFloat(balance || "0");

  // Validation check for amount input
  const isValidAmount =
    currentAmount > 0 &&
    currentAmount >= minBet &&
    currentAmount <= maxBet &&
    currentAmount <= userBalanceNum;

  // Generate quick amount suggestions
  const quickAmounts = useMemo(() => {
    const amounts = [
      minBet,
      Math.min(maxBet, userBalanceNum, minBet * 5),
      Math.min(maxBet, userBalanceNum, minBet * 10),
      Math.min(maxBet, userBalanceNum * 0.25),
      Math.min(maxBet, userBalanceNum * 0.5),
      Math.min(maxBet, userBalanceNum),
    ]
      .map((a) => Math.max(minBet, a))
      .map((a) => Math.min(maxBet, a))
      .map((a) => parseFloat(a.toFixed(2)))
      .filter((a) => a <= userBalanceNum && a >= minBet); // Ensure >= minBet

    return Array.from(new Set(amounts))
      .sort((a, b) => a - b)
      .map((a) => a.toString());
  }, [minBet, maxBet, userBalanceNum]);

  // Calculate potential payout
  const getEstimatedPayout = () => {
    if (!amount || selectedOptionIndex === null || currentOdds === Infinity)
      return "0.00";
    return (parseFloat(amount) * currentOdds).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-[#0A0C14] via-[#1A1F2C] to-[#151923] border border-gray-800/50 max-w-2xl w-full mx-auto backdrop-blur-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3 pb-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#9b87f5]/10 rounded-lg">
              <Zap className="h-5 w-5 text-[#9b87f5]" />
            </div>
            <DialogTitle className="text-xl text-white">
              Place Your Bet
            </DialogTitle>
          </div>
          {/* Market Preview */}
          <div className="bg-gradient-to-r from-[#1A1F2C]/80 to-[#151923]/80 rounded-xl p-3 border border-gray-800/30">
            <h3 className="font-semibold text-white mb-1 text-sm line-clamp-1">
              {market.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-2">
              {(market.options || []).slice(0, 3).map((opt, idx) => (
                <span
                  key={idx}
                  className={
                    idx === selectedOptionIndex
                      ? "text-[#9b87f5] font-medium"
                      : "text-gray-400"
                  }
                >
                  {opt.length > 15 ? opt.substring(0, 12) + "..." : opt}:{" "}
                  {formatCurrency(optionOdds[idx] ?? Infinity)}x
                </span>
              ))}
              {market.options.length > 3 && (
                <span className="text-gray-500">...</span>
              )}
            </div>
            {/* Optional: Simple visualization */}
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className="h-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] rounded-full transition-all duration-300"
                style={{
                  width: `${optionPercentages[selectedOptionIndex ?? leadingOptionIndex] ?? 0}%`,
                }} // Show selected or leading %
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          {!user ? (
            <div className="text-center p-6 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <Wallet className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
              <p className="text-sm text-yellow-400 mb-4">
                Please connect your wallet to place bets
              </p>
              <Button
                onClick={connectWallet}
                className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white font-semibold h-10 px-4"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          ) : (
            <>
              {/* User Account Status */}
              {userAccount.showCreateForm ? (
                <Card className="bg-[#1A1F2C]/50 border-gray-800/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <UserPlus className="h-5 w-5" />
                      Create Your Profile
                    </CardTitle>
                    <CardDescription>
                      Create a profile to start betting on Flow Wager
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="username" className="text-gray-300">
                        Username *
                      </Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        className="bg-[#0A0C14] border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="displayName" className="text-gray-300">
                        Display Name *
                      </Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter display name"
                        className="bg-[#0A0C14] border-gray-700 text-white"
                      />
                    </div>
                    <Button
                      onClick={createAccount}
                      disabled={
                        userAccount.isCreating ||
                        !username.trim() ||
                        !displayName.trim()
                      }
                      className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
                    >
                      {userAccount.isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="bg-[#1A1F2C]/50 border-gray-800/50">
                    <CardContent className="p-4 space-y-4">
                      {/* Option Selection (Multi-Option Grid) */}
                      <div>
                        <Label className="text-gray-300 text-sm font-medium mb-2 block">
                          Choose Prediction
                        </Label>
                        <div
                          className={`grid grid-cols-${Math.min(market.options.length, 3)} gap-2`}
                        >
                          {(market.options || []).map((option, index) => (
                            <Button
                              key={index}
                              variant={
                                selectedOptionIndex === index
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => setSelectedOptionIndex(index)}
                              className={`p-3 h-auto justify-start text-left text-xs sm:text-sm ${
                                selectedOptionIndex === index
                                  ? "bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white border-[#9b87f5]/50 ring-2 ring-[#9b87f5]/30"
                                  : "border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-gray-600"
                              }`}
                            >
                              <div>
                                <div className="font-medium truncate">
                                  {option}
                                </div>
                                <div className="text-xs opacity-80">
                                  {formatCurrency(
                                    optionOdds[index] ?? Infinity,
                                  )}
                                  x (
                                  {formatCurrency(
                                    optionPercentages[index] ?? 0,
                                  )}
                                  %)
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div>
                        <Label htmlFor="amount-immediate">
                          Bet Amount (FLOW)
                        </Label>
                        <Input
                          id="amount-immediate"
                          type="number"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="bg-[#0A0C14] border-gray-700 text-white h-12 text-lg"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Bal: {formatCurrency(balance)}</span>
                          <span>
                            Min: {formatCurrency(market.minBet)} | Max:{" "}
                            {formatCurrency(market.maxBet)}
                          </span>
                        </div>
                        {/* Quick Amount Buttons */}
                        {quickAmounts.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {quickAmounts.map((quickAmount) => (
                              <Button
                                key={quickAmount}
                                variant="outline"
                                size="sm"
                                onClick={() => setAmount(quickAmount)}
                                className="border-gray-700 text-white hover:border-[#9b87f5]/50 text-xs h-8 bg-purple-700 hover:bg-purple-600"
                              >
                                {formatCurrency(quickAmount)}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bet Summary */}
                  {amount && isValidAmount && selectedOptionIndex !== null && (
                    <Card className="bg-gradient-to-r from-[#0A0C14] to-[#1A1F2C]/50 border border-gray-800/50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          {" "}
                          <Calculator /> Bet Summary{" "}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            {" "}
                            <span>Betting on:</span>{" "}
                            <Badge>{selectedOptionName}</Badge>{" "}
                          </div>
                          <div className="flex justify-between">
                            {" "}
                            <span>Amount:</span>{" "}
                            <span>{formatCurrency(amount)} FLOW</span>{" "}
                          </div>
                          <div className="flex justify-between">
                            {" "}
                            <span>Odds:</span>{" "}
                            <span>{formatCurrency(currentOdds)}x</span>{" "}
                          </div>
                          <div className="flex justify-between">
                            {" "}
                            <span>Payout:</span>{" "}
                            <span className="text-green-400">
                              {getEstimatedPayout()} FLOW
                            </span>{" "}
                          </div>
                          {/* Execution removed */}
                        </div>
                        {/* Description removed */}
                      </CardContent>
                    </Card>
                  )}

                  {amount && !isValidAmount && (
                    <Alert className="border-red-500/50 bg-red-500/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-400 text-xs">
                        Amount must be between {formatCurrency(market.minBet)}{" "}
                        and {formatCurrency(market.maxBet)} FLOW, and not exceed
                        your balance.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-400 text-xs">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 flex-shrink-0 border-t border-gray-800/50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-gray-700 text-gray-300 hover:bg-[#1A1F2C] h-10"
            disabled={isLoading || userAccount.isCreating}
          >
            Cancel
          </Button>
          {user && userAccount.exists ? (
            <Button
              onClick={placeBet}
              disabled={!amount || !isValidAmount || isLoading}
              className="flex-1 bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white h-10 font-semibold shadow-lg shadow-[#9b87f5]/25 hover:shadow-[#9b87f5]/40 transition-all duration-200 disabled:opacity-50"
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
          ) : (
            <Button
              onClick={connectWallet}
              disabled={isLoading || userAccount.isCreating}
              className="flex-1 bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white h-10 font-semibold shadow-lg shadow-[#9b87f5]/25 hover:shadow-[#9b87f5]/40 transition-all duration-200"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
