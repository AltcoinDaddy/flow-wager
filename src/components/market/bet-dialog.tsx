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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  placeBetTransaction as buyShares,
  createUserAccountTransaction,
  getUserProfile as getUserAccount,
} from "@/lib/flow-wager-scripts";
import flowConfig from "@/lib/flow/config";
import { useAuth } from "@/providers/auth-provider";
import type { Market } from "@/types/market";
import {
  addBetToHistory,
  getCookie,
  setCookie,
  type BetInfo,
} from "@/utils/cookies";
import * as fcl from "@onflow/fcl";
import {
  Calculator,
  CheckCircle,
  DollarSign,
  Edit3,
  Loader2,
  LogIn,
  TrendingUp,
  User,
  UserPlus,
  Wallet,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: Market;
  initialSide?: "optionA" | "optionB";
  onBetSuccess?: () => void;
}

interface UserAccountStatus {
  exists: boolean;
  isCreating: boolean;
  error: string | null;
  showCreateForm: boolean;
}

export function BetDialog({
  open,
  onOpenChange,
  market,
  initialSide = "optionA",
  onBetSuccess,
}: BetDialogProps) {
  const { user, balance, refreshBalance, login:logIn } = useAuth();
  const [side, setSide] = useState<"optionA" | "optionB">(initialSide);
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
  const totalShares =
    parseFloat(market.totalOptionAShares) +
    parseFloat(market.totalOptionBShares);
  const optionAPercentage =
    totalShares > 0
      ? (parseFloat(market.totalOptionAShares) / totalShares) * 100
      : 50;
  const optionBPercentage = 100 - optionAPercentage;

  const optionAPrice = optionAPercentage / 100;
  const optionBPrice = optionBPercentage / 100;

  const currentPrice = side === "optionA" ? optionAPrice : optionBPrice;
  const shares = amount ? parseFloat(amount) / currentPrice : 0;
  const maxPayout = shares * 1; // Each share pays 1 FLOW if correct
  const potentialProfit = maxPayout - (parseFloat(amount) || 0);

  // Check user account status when dialog opens and wallet is connected
  useEffect(() => {
    if (open && user?.addr) {
      checkUserAccount();
      if (!username) {
        setUsername(`user_${user.addr.slice(-8)}`);
      }
      if (!displayName) {
        setDisplayName(`FlowWager User ${user.addr.slice(0, 6)}...${user.addr.slice(-4)}`);
      }
    } else {
      setUserAccount((prev) => ({
        ...prev,
        exists: false,
        showCreateForm: false,
        error: null,
      }));
    }
  }, [open, user?.addr]);

  useEffect(() => {
    setSide(initialSide);
  }, [initialSide]);

  const checkUserAccount = async () => {
    if (!user?.addr) return;

    try {
      setUserAccount((prev) => ({ ...prev, isCreating: false, error: null }));

      const cachedAccount = getCookie(`flow_wager_account_${user.addr}`);
      if (cachedAccount === "exists") {
        setUserAccount((prev) => ({ ...prev, exists: true }));
        return;
      }

      flowConfig();
      const userAccountScript = await getUserAccount();
      const accountData = await fcl.query({
        cadence: userAccountScript,
        args: (arg, t) => [arg(user.addr || "", t.Address)],
      });

      const accountExists = accountData !== null && accountData !== undefined;
      setUserAccount((prev) => ({
        ...prev,
        exists: accountExists,
        showCreateForm: !accountExists,
      }));

      if (accountExists) {
        setCookie(`flow_wager_account_${user.addr}`, "exists");
      }
    } catch (error: any) {
      console.error("Error checking user account:", error);
      setUserAccount((prev) => ({
        ...prev,
        error: `Failed to check account status: ${error.message || "Unknown error"}`,
        exists: false,
        showCreateForm: true,
      }));
      toast.error("Failed to verify account status. Please try again.");
    }
  };

  const showCreateAccountForm = () => {
    setUserAccount((prev) => ({ ...prev, showCreateForm: true, error: null }));
  };

  const hideCreateAccountForm = () => {
    setUserAccount((prev) => ({ ...prev, showCreateForm: false, error: null }));
  };

  const createAccount = async () => {
    if (!user?.addr || !username.trim() || !displayName.trim()) {
      setUserAccount((prev) => ({
        ...prev,
        error: "Username and display name are required",
      }));
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUserAccount((prev) => ({
        ...prev,
        error: "Username can only contain letters, numbers, and underscores",
      }));
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setUserAccount((prev) => ({
        ...prev,
        error: "Username must be between 3 and 20 characters",
      }));
      return;
    }

    try {
      setUserAccount((prev) => ({ ...prev, isCreating: true, error: null }));
      console.log("Creating account with:", { username, displayName, address: user.addr });

      flowConfig();
      const createAccountScript = await createUserAccountTransaction();
      const authorization = fcl.currentUser().authorization;
      const transactionId = await fcl.mutate({
        cadence: createAccountScript,
        args: (arg, t) => [
          arg(username.trim(), t.String),
          arg(displayName.trim(), t.String),
          arg(`https://api.dicebear.com/9.x/pixel-art/png?seed=${user.addr}`, t.String),
        ],
        proposer: authorization,
        payer: authorization,
        authorizations: [authorization],
        limit: 9999,
      });

      console.log("Account creation transaction ID:", transactionId);
      const transaction = await fcl.tx(transactionId).onceSealed();
      console.log("Account creation transaction result:", transaction);

      if (transaction.status === 4) {
        setUserAccount((prev) => ({
          ...prev,
          exists: true,
          isCreating: false,
          showCreateForm: false,
        }));
        setCookie(`flow_wager_account_${user.addr}`, "exists");
        toast.success(`FlowWager account "${username}" created successfully!`);
      } else {
        throw new Error(`Account creation failed: ${transaction.errorMessage || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Error creating account:", error);
      let errorMessage = "Failed to create account";

      if (error.message?.includes("User rejected")) {
        errorMessage = "Account creation was cancelled";
      } else if (error.message?.includes("User already exists") || error.message?.includes("account already exists")) {
        errorMessage = "Account already exists";
        setUserAccount((prev) => ({
          ...prev,
          exists: true,
          isCreating: false,
          showCreateForm: false,
        }));
        setCookie(`flow_wager_account_${user.addr}`, "exists");
        toast.success("Account already exists - you're ready to bet!");
        return;
      } else if (error.message?.includes("Username already taken")) {
        errorMessage = "This username is already taken. Please choose another.";
      } else if (error.message?.includes("script")) {
        errorMessage = "Error loading account creation script. Please try again.";
      } else if (error.message?.includes("network") || error.message?.includes("connection")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message.substring(0, 150) + (error.message.length > 150 ? "..." : "");
      }

      setUserAccount((prev) => ({
        ...prev,
        error: errorMessage,
        isCreating: false,
      }));
      toast.error(errorMessage);
    }
  };

  const connectWallet = async () => {
    try {
      setError(null);
      await logIn();
      toast.success("Wallet connected successfully!");
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setError("Failed to connect wallet. Please try again.");
      toast.error("Failed to connect wallet. Please try again.");
    }
  };

  const placeBet = async () => {
    if (!user || !amount || !userAccount.exists) {
      setError("Please connect wallet and create an account");
      return;
    }

    const betAmount = parseFloat(amount);
    const userBalanceNum = parseFloat(balance || "0");

    if (betAmount > userBalanceNum) {
      setError(`Insufficient balance. You have ${balance} FLOW`);
      return;
    }

    if (market.status !== 0) {
      setError("Market is not active for betting");
      return;
    }

    if (betAmount < parseFloat(market.minBet) || betAmount > parseFloat(market.maxBet)) {
      setError(`Bet amount must be between ${market.minBet} and ${market.maxBet} FLOW`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      flowConfig();
      const buySharesScript = await buyShares();
      const authorization = fcl.currentUser().authorization;
      const transactionId = await fcl.mutate({
        cadence: buySharesScript,
        args: (arg, t) => [
          arg(market.id, t.UInt64),
          arg(side === "optionA" ? 0 : 1, t.UInt8),
          arg(betAmount.toFixed(8), t.UFix64),
        ],
        proposer: authorization,
        payer: authorization,
        authorizations: [authorization],
        limit: 9999,
      });

      console.log("Bet placement transaction ID:", transactionId);
      const transaction = await fcl.tx(transactionId).onceSealed();
      console.log("Bet placement transaction result:", transaction);

      if (transaction.status === 4) {
        const betInfo: BetInfo = {
          marketId: market.id,
          side,
          amount: betAmount,
          shares,
          timestamp: Date.now(),
          transactionId,
          marketTitle: market.title,
          optionName: side === "optionA" ? market.optionA : market.optionB,
        };

        addBetToHistory(user.addr ?? "", betInfo);
        toast.success(`Successfully placed ${betAmount} FLOW bet on "${betInfo.optionName}"!`);

        await refreshBalance();
        onBetSuccess?.();
        setAmount("");
        onOpenChange(false);
      } else {
        throw new Error(`Transaction failed: ${transaction.errorMessage || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Betting error:", error);
      let errorMessage = "Failed to place bet";

      if (error.message?.includes("Insufficient balance")) {
        errorMessage = "Insufficient FLOW balance in your wallet";
      } else if (error.message?.includes("User rejected")) {
        errorMessage = "Transaction was cancelled";
      } else if (error.message?.includes("Market not found") || error.message?.includes("Market does not exist")) {
        errorMessage = "Market not found or inactive";
      } else if (error.message?.includes("Invalid option")) {
        errorMessage = "Invalid betting option selected";
      } else if (error.message?.includes("User positions resource not found")) {
        errorMessage = "User account not properly initialized. Please try creating account again.";
        setUserAccount((prev) => ({ ...prev, showCreateForm: true }));
      } else if (error.message?.includes("capability")) {
        errorMessage = "Account setup issue. Please ensure your account is properly configured.";
        setUserAccount((prev) => ({ ...prev, showCreateForm: true }));
      } else if (error.message) {
        errorMessage = error.message.substring(0, 100) + (error.message.length > 100 ? "..." : "");
      }

      setError(errorMessage);
      toast.error(errorMessage);
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
      <DialogContent className="bg-gradient-to-br from-[#0A0C14] via-[#1A1F2C] to-[#151923] border border-gray-800/50 max-w-md w-full mx-auto backdrop-blur-xl max-h-[90vh] overflow-hidden flex flex-col">
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
            <p className="text-xs text-gray-400 line-clamp-1 mb-2">
              {market.description}
            </p>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500">Current Odds</div>
              <div className="flex space-x-3 text-xs">
                <span className="text-[#9b87f5]">
                  {market.optionA}: {formatPercentage(optionAPercentage)}
                </span>
                <span className="text-gray-400">
                  {market.optionB}: {formatPercentage(optionBPercentage)}
                </span>
              </div>
            </div>
            <Progress value={optionAPercentage} className="h-1.5 bg-gray-800">
              <div
                className="h-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] transition-all duration-300 rounded-full"
                style={{ width: `${optionAPercentage}%` }}
              />
            </Progress>
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
              <div className="bg-gradient-to-r from-[#0A0C14] to-[#1A1F2C]/50 rounded-xl p-3 border border-gray-800/50">
                {!userAccount.showCreateForm ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {userAccount.exists ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <UserPlus className="h-4 w-4 text-yellow-400" />
                        )}
                        <span className="text-sm font-medium text-gray-300">
                          {userAccount.exists ? "Account Ready" : "Account Setup Required"}
                        </span>
                      </div>
                      {!userAccount.exists && (
                        <Button
                          size="sm"
                          onClick={showCreateAccountForm}
                          disabled={userAccount.isCreating}
                          className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs px-2 py-1 h-7"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Create Account
                        </Button>
                      )}
                    </div>
                    {!userAccount.exists && !userAccount.error && (
                      <p className="text-xs text-gray-400 mt-2">
                        Create a FlowWager account to start placing bets.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-white flex items-center space-x-2">
                        <User className="h-4 w-4 text-[#9b87f5]" />
                        <span>Create Your Account</span>
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={hideCreateAccountForm}
                        className="text-gray-400 hover:text-white h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="username" className="text-xs text-gray-400 mb-1 block">
                          Username
                        </Label>
                        <div className="relative">
                          <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-500" />
                          <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            className="pl-7 bg-[#0A0C14] border-gray-700 text-white placeholder-gray-500 h-8 text-sm focus:border-[#9b87f5] focus:ring-[#9b87f5]/20"
                            maxLength={20}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          3-20 characters, letters, numbers, and underscores only
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="displayName" className="text-xs text-gray-400 mb-1 block">
                          Display Name
                        </Label>
                        <div className="relative">
                          <Edit3 className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-500" />
                          <Input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter display name"
                            className="pl-7 bg-[#0A0C14] border-gray-700 text-white placeholder-gray-500 h-8 text-sm focus:border-[#9b87f5] focus:ring-[#9b87f5]/20"
                            maxLength={50}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          This is how others will see your name
                        </p>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={hideCreateAccountForm}
                          className="flex-1 border-gray-700 text-gray-300 hover:bg-[#1A1F2C] h-8 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={createAccount}
                          disabled={userAccount.isCreating || !username.trim() || !displayName.trim()}
                          className="flex-1 bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white h-8 text-xs"
                        >
                          {userAccount.isCreating ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {userAccount.error && (
                  <Alert className="border-red-500/50 bg-red-500/10 mt-3">
                    <AlertDescription className="text-red-400 text-xs">
                      {userAccount.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Side Selection */}
              {userAccount.exists && (
                <>
                  <div className="space-y-3">
                    <Label className="text-gray-300 flex items-center space-x-2 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>Choose your prediction</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={side === "optionA" ? "default" : "outline"}
                        onClick={() => setSide("optionA")}
                        className={`h-14 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                          side === "optionA"
                            ? "bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white shadow-lg shadow-[#9b87f5]/25"
                            : "border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]/50"
                        }`}
                      >
                        <span className="font-semibold text-xs text-center line-clamp-1">{market.optionA}</span>
                        <span className="text-xs opacity-80">
                          {formatPercentage(optionAPercentage)}
                        </span>
                      </Button>
                      <Button
                        variant={side === "optionB" ? "default" : "outline"}
                        onClick={() => setSide("optionB")}
                        className={`h-14 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                          side === "optionB"
                            ? "bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white shadow-lg shadow-[#9b87f5]/25"
                            : "border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]/50"
                        }`}
                      >
                        <span className="font-semibold text-xs text-center line-clamp-1">{market.optionB}</span>
                        <span className="text-xs opacity-80">
                          {formatPercentage(optionBPercentage)}
                        </span>
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-gray-800/50" />

                  {/* Amount Input */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="amount"
                      className="text-gray-300 flex items-center space-x-2 text-sm"
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
                        className="pl-10 bg-[#0A0C14] border-gray-700 text-white placeholder-gray-500 h-10 text-base font-medium focus:border-[#9b87f5] focus:ring-[#9b87f5]/20"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {quickAmounts.map((quickAmount) => (
                        <Button
                          key={quickAmount}
                          variant="outline"
                          size="sm"
                          onClick={() => setAmount(quickAmount)}
                          className="border-gray-700 text-gray-300 hover:bg-[#9b87f5]/10 hover:border-[#9b87f5]/50 text-xs h-8"
                        >
                          {formatCurrency(quickAmount)}
                        </Button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Min: {formatCurrency(market.minBet)}</span>
                      <span>Max: {formatCurrency(market.maxBet)}</span>
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
                    <div className="bg-gradient-to-r from-[#0A0C14] to-[#1A1F2C]/50 rounded-xl p-3 border border-gray-800/50">
                      <div className="flex items-center space-x-2 mb-3">
                        <Calculator className="h-4 w-4 text-[#9b87f5]" />
                        <span className="text-sm font-medium text-gray-300">
                          Bet Summary
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Betting on:</span>
                          <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30 font-medium text-xs">
                            {side === "optionA" ? market.optionA : market.optionB}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Amount:</span>
                          <span className="text-white font-medium">
                            {formatCurrency(amount)} FLOW
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Shares:</span>
                          <span className="text-white font-medium">
                            {formatCurrency(shares)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
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