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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  placeBetTransaction as buyShares,
  createUserAccountTransaction,
  getUserProfile as getUserAccount,
} from "@/lib/flow-wager-scripts";
import flowConfig from "@/lib/flow/config";
import { useAuth } from "@/providers/auth-provider";
import { useForteActions } from "@/hooks/useForteActions";
import type { Market } from "@/types/market";
import {
  addBetToHistory,
  getCookie,
  setCookie,
  type BetInfo,
  getUserBetHistory,
} from "@/utils/cookies";
import * as fcl from "@onflow/fcl";
import {
  Calculator,
  Loader2,
  LogIn,
  UserPlus,
  Wallet,
  Zap,
  Bot,
  Clock,
  Timer,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PointsManager, type ActivityDetails } from "@/lib/points-system";

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

interface AutomationSettings {
  enabled: boolean;
  type: "immediate" | "conditional" | "scheduled";
  conditions: {
    minOdds?: number;
    maxOdds?: number;
    priceThreshold?: number;
    timeWindow?: { start: string; end: string };
    maxSlippage?: number;
    stopLoss?: number;
  };
  autoRebet: boolean;
  rebetSettings: {
    maxAttempts: number;
    delayBetween: number;
  };
}

export function BetDialog({
  open,
  onOpenChange,
  market,
  initialSide = "optionA",
  onBetSuccess,
}: BetDialogProps) {
  const { user, balance, refreshBalance, login: logIn } = useAuth();
  const {
    isInitialized: forteInitialized,
    isLoading: forteLoading,
    createConditionalBet,
    createAdvancedBetConditions,
    initialize: initializeForte,
  } = useForteActions();

  const [side, setSide] = useState<"optionA" | "optionB">(initialSide);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("immediate");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const [userAccount, setUserAccount] = useState<UserAccountStatus>({
    exists: false,
    isCreating: false,
    error: null,
    showCreateForm: false,
  });

  // Account creation form fields
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Automation settings
  const [automation, setAutomation] = useState<AutomationSettings>({
    enabled: false,
    type: "immediate",
    conditions: {},
    autoRebet: false,
    rebetSettings: {
      maxAttempts: 3,
      delayBetween: 60,
    },
  });

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

  // Calculate current odds
  const optionAOdds = optionAPrice > 0 ? 1 / optionAPrice : 1;
  const optionBOdds = optionBPrice > 0 ? 1 / optionBPrice : 1;
  const currentOdds = side === "optionA" ? optionAOdds : optionBOdds;

  useEffect(() => {
    if (open) {
      setSide(initialSide);
      setAmount("");
      setError(null);
      setAutomation({
        enabled: false,
        type: "immediate",
        conditions: {},
        autoRebet: false,
        rebetSettings: {
          maxAttempts: 3,
          delayBetween: 60,
        },
      });
      setActiveTab("immediate");
    }
  }, [open, initialSide]);

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
    if (!user?.addr || !amount || !isValidAmount) return;

    // Check if this is an automated bet
    if (automation.enabled && automation.type !== "immediate") {
      return placeAutomatedBet();
    }

    setIsLoading(true);
    setError(null);

    try {
      await flowConfig();
      const buySharesScript = await buyShares();
      const authorization = fcl.currentUser().authorization;

      const txId = await fcl.mutate({
        cadence: buySharesScript,
        args: (arg: any, t: any) => [
          arg(market.id, t.String),
          arg(amount, t.UFix64),
          arg(side === "optionA", t.Bool),
        ],
        proposer: authorization,
        payer: authorization,
        authorizations: [authorization],
        limit: 1000,
      });

      toast.loading("Placing bet...");
      const result = await fcl.tx(txId).onceSealed();
      toast.dismiss();

      if (result.status === 4) {
        toast.success("Bet placed successfully!");

        // Add to bet history
        const betInfo: BetInfo = {
          marketId: market.id,
          marketTitle: market.title,
          side: side,
          amount: parseFloat(amount),
          shares: parseFloat(amount) / currentPrice,
          timestamp: Date.now(),
          transactionId: txId,
          optionName: side === "optionA" ? market.optionA : market.optionB,
        };
        addBetToHistory(user.addr, betInfo);

        // Award points for betting
        try {
          await PointsManager.awardPoints(user.addr, "PLACE_BET", {
            betAmount: parseFloat(amount),
            marketTitle: market.title,
            marketId: parseInt(market.id),
          });
        } catch (pointsError) {
          console.error("Error awarding points:", pointsError);
        }

        await refreshBalance();
        onBetSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Bet placement failed:", error);

      let errorMessage = "Failed to place bet. Please try again.";
      if (error?.message) {
        if (error.message.includes("insufficient balance")) {
          errorMessage = "Insufficient balance to place this bet.";
        } else if (error.message.includes("market ended")) {
          errorMessage = "This market has already ended.";
        } else if (error.message.includes("market resolved")) {
          errorMessage = "This market has already been resolved.";
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const placeAutomatedBet = async () => {
    if (!forteInitialized) {
      toast.error("Forte Actions not initialized. Please initialize first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const conditions = createAdvancedBetConditions({
        minOdds: automation.conditions.minOdds,
        maxOdds: automation.conditions.maxOdds,
        priceThreshold: automation.conditions.priceThreshold,
        timeWindow: automation.conditions.timeWindow
          ? {
              start: new Date(automation.conditions.timeWindow.start).getTime(),
              end: new Date(automation.conditions.timeWindow.end).getTime(),
            }
          : undefined,
        maxSlippage: automation.conditions.maxSlippage,
        stopLoss: automation.conditions.stopLoss,
        autoRebet: automation.autoRebet,
        rebetConditions: automation.autoRebet
          ? automation.rebetSettings
          : undefined,
      });

      const result = await createConditionalBet({
        marketId: market.id,
        amount: amount,
        prediction: side === "optionA",
        conditions,
      });

      if (result.success) {
        toast.success("Automated bet scheduled successfully!");
        onBetSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(result.error || "Failed to create automated bet");
      }
    } catch (error: any) {
      console.error("Automated bet failed:", error);
      setError(error.message || "Failed to create automated bet");
      toast.error(error.message || "Failed to create automated bet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutomationChange = (field: string, value: any) => {
    setAutomation((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConditionChange = (field: string, value: any) => {
    setAutomation((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [field]: value,
      },
    }));
  };

  const handleTimeWindowChange = (field: "start" | "end", value: string) => {
    setAutomation((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        timeWindow: {
          ...prev.conditions.timeWindow,
          start:
            field === "start" ? value : prev.conditions.timeWindow?.start || "",
          end: field === "end" ? value : prev.conditions.timeWindow?.end || "",
        },
      },
    }));
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(num) ? "0.00" : num.toFixed(2);
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
      arr.indexOf(amt) === index && parseFloat(amt) <= userBalanceNum,
  );

  const getEstimatedPayout = () => {
    if (!amount) return "0.00";
    return (parseFloat(amount) * currentOdds).toFixed(2);
  };

  const getBetTypeIcon = () => {
    switch (automation.type) {
      case "conditional":
        return <Bot className="h-4 w-4" />;
      case "scheduled":
        return <Clock className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getBetTypeDescription = () => {
    switch (automation.type) {
      case "conditional":
        return "Bet will execute when conditions are met";
      case "scheduled":
        return "Bet will execute at specified time";
      default:
        return "Bet will execute immediately";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-[#0A0C14] via-[#1A1F2C] to-[#151923] border border-gray-800/50 max-w-2xl w-full mx-auto backdrop-blur-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#9b87f5]/10 rounded-lg">
                <Zap className="h-5 w-5 text-[#9b87f5]" />
              </div>
              <DialogTitle className="text-xl text-white">
                Place Your Bet
              </DialogTitle>
            </div>
            {forteInitialized && (
              <Badge variant="secondary" className="text-xs">
                <Bot className="h-3 w-3 mr-1" />
                Automation Ready
              </Badge>
            )}
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
                  {market.optionA}: {formatCurrency(optionAOdds)}x
                </span>
                <span className="text-gray-400">
                  {market.optionB}: {formatCurrency(optionBOdds)}x
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
                  {/* Betting Type Selector */}
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3 bg-[#1A1F2C] border-gray-800">
                      <TabsTrigger
                        value="immediate"
                        className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white"
                        onClick={() =>
                          handleAutomationChange("type", "immediate")
                        }
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Immediate
                      </TabsTrigger>
                      <TabsTrigger
                        value="conditional"
                        className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white"
                        disabled={!forteInitialized}
                        onClick={() =>
                          handleAutomationChange("type", "conditional")
                        }
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        Conditional
                      </TabsTrigger>
                      <TabsTrigger
                        value="scheduled"
                        className="data-[state=active]:bg-[#9b87f5] data-[state=active]:text-white"
                        disabled={!forteInitialized}
                        onClick={() =>
                          handleAutomationChange("type", "scheduled")
                        }
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Scheduled
                      </TabsTrigger>
                    </TabsList>

                    {!forteInitialized && (
                      <Alert className="mt-2">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>
                            Initialize Forte Actions to use automation features
                          </span>
                          <Button
                            size="sm"
                            onClick={initializeForte}
                            disabled={forteLoading}
                            className="ml-2"
                          >
                            {forteLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Initialize"
                            )}
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    <TabsContent value="immediate" className="space-y-4 mt-4">
                      <Card className="bg-[#1A1F2C]/50 border-gray-800/50">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-400 mb-3">
                            Place your bet immediately at current market prices
                          </p>

                          {/* Bet Amount and Side Selection - Immediate */}
                          <div className="space-y-4">
                            {/* Side Selection */}
                            <div>
                              <Label className="text-gray-300 text-sm font-medium mb-2 block">
                                Choose Your Prediction
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant={
                                    side === "optionA" ? "default" : "outline"
                                  }
                                  onClick={() => setSide("optionA")}
                                  className={`p-3 h-auto ${
                                    side === "optionA"
                                      ? "bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white"
                                      : "border-gray-700 text-gray-300 hover:bg-[#1A1F2C]"
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="font-medium text-sm">
                                      {market.optionA}
                                    </div>
                                    <div className="text-xs opacity-80">
                                      {formatCurrency(optionAOdds)}x odds
                                    </div>
                                  </div>
                                </Button>
                                <Button
                                  variant={
                                    side === "optionB" ? "default" : "outline"
                                  }
                                  onClick={() => setSide("optionB")}
                                  className={`p-3 h-auto ${
                                    side === "optionB"
                                      ? "bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white"
                                      : "border-gray-700 text-gray-300 hover:bg-[#1A1F2C]"
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="font-medium text-sm">
                                      {market.optionB}
                                    </div>
                                    <div className="text-xs opacity-80">
                                      {formatCurrency(optionBOdds)}x odds
                                    </div>
                                  </div>
                                </Button>
                              </div>
                            </div>

                            {/* Amount Input */}
                            <div>
                              <Label
                                htmlFor="amount"
                                className="text-gray-300 text-sm font-medium mb-2 block"
                              >
                                Bet Amount (FLOW)
                              </Label>
                              <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="bg-[#0A0C14] border-gray-700 text-white h-12 text-lg"
                              />
                              <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>
                                  Balance: {formatCurrency(balance)} FLOW
                                </span>
                                <span>
                                  Min: {formatCurrency(market.minBet)} | Max:{" "}
                                  {formatCurrency(market.maxBet)}
                                </span>
                              </div>

                              {/* Quick Amount Buttons */}
                              {quickAmounts.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  {quickAmounts.map((quickAmount) => (
                                    <Button
                                      key={quickAmount}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setAmount(quickAmount)}
                                      className="text-xs border-gray-700 text-gray-400 hover:text-white hover:border-[#9b87f5]"
                                    >
                                      {formatCurrency(quickAmount)}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="conditional" className="space-y-4 mt-4">
                      <Card className="bg-[#1A1F2C]/50 border-gray-800/50">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-400 mb-3">
                            Set conditions for when your bet should be placed
                            automatically
                          </p>

                          <div className="space-y-4">
                            {/* Basic Bet Setup */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-gray-300 text-sm">
                                  Prediction
                                </Label>
                                <Select
                                  value={side}
                                  onValueChange={(
                                    value: "optionA" | "optionB",
                                  ) => setSide(value)}
                                >
                                  <SelectTrigger className="bg-[#0A0C14] border-gray-700 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="optionA">
                                      {market.optionA}
                                    </SelectItem>
                                    <SelectItem value="optionB">
                                      {market.optionB}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-gray-300 text-sm">
                                  Amount (FLOW)
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={amount}
                                  onChange={(e) => setAmount(e.target.value)}
                                  placeholder="0.00"
                                  className="bg-[#0A0C14] border-gray-700 text-white"
                                />
                              </div>
                            </div>

                            {/* Odds Conditions */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-gray-300 text-sm">
                                  Min Odds
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={automation.conditions.minOdds || ""}
                                  onChange={(e) =>
                                    handleConditionChange(
                                      "minOdds",
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined,
                                    )
                                  }
                                  placeholder="1.50"
                                  className="bg-[#0A0C14] border-gray-700 text-white"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-300 text-sm">
                                  Max Odds
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={automation.conditions.maxOdds || ""}
                                  onChange={(e) =>
                                    handleConditionChange(
                                      "maxOdds",
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined,
                                    )
                                  }
                                  placeholder="5.00"
                                  className="bg-[#0A0C14] border-gray-700 text-white"
                                />
                              </div>
                            </div>

                            {/* Advanced Settings Collapsible */}
                            <Collapsible
                              open={showAdvancedSettings}
                              onOpenChange={setShowAdvancedSettings}
                            >
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="w-full justify-between text-gray-400 hover:text-white"
                                >
                                  <span className="flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    Advanced Settings
                                  </span>
                                  {showAdvancedSettings ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="space-y-4">
                                {/* Time Window */}
                                <div>
                                  <Label className="text-gray-300 text-sm mb-2 block">
                                    Time Window (Optional)
                                  </Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs text-gray-400">
                                        Start Time
                                      </Label>
                                      <Input
                                        type="datetime-local"
                                        value={
                                          automation.conditions.timeWindow
                                            ?.start || ""
                                        }
                                        onChange={(e) =>
                                          handleTimeWindowChange(
                                            "start",
                                            e.target.value,
                                          )
                                        }
                                        className="bg-[#0A0C14] border-gray-700 text-white text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-400">
                                        End Time
                                      </Label>
                                      <Input
                                        type="datetime-local"
                                        value={
                                          automation.conditions.timeWindow
                                            ?.end || ""
                                        }
                                        onChange={(e) =>
                                          handleTimeWindowChange(
                                            "end",
                                            e.target.value,
                                          )
                                        }
                                        className="bg-[#0A0C14] border-gray-700 text-white text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Risk Management */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-gray-300 text-sm">
                                      Max Slippage (%)
                                    </Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={
                                        automation.conditions.maxSlippage || ""
                                      }
                                      onChange={(e) =>
                                        handleConditionChange(
                                          "maxSlippage",
                                          e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined,
                                        )
                                      }
                                      placeholder="5.0"
                                      className="bg-[#0A0C14] border-gray-700 text-white"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-gray-300 text-sm">
                                      Stop Loss (%)
                                    </Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={
                                        automation.conditions.stopLoss || ""
                                      }
                                      onChange={(e) =>
                                        handleConditionChange(
                                          "stopLoss",
                                          e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined,
                                        )
                                      }
                                      placeholder="10.0"
                                      className="bg-[#0A0C14] border-gray-700 text-white"
                                    />
                                  </div>
                                </div>

                                {/* Auto-Rebet */}
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id="auto-rebet"
                                      checked={automation.autoRebet}
                                      onCheckedChange={(checked) =>
                                        handleAutomationChange(
                                          "autoRebet",
                                          checked,
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor="auto-rebet"
                                      className="text-gray-300 text-sm"
                                    >
                                      Enable auto-rebet on failure
                                    </Label>
                                  </div>
                                  {automation.autoRebet && (
                                    <div className="grid grid-cols-2 gap-4 pl-6">
                                      <div>
                                        <Label className="text-gray-300 text-sm">
                                          Max Attempts
                                        </Label>
                                        <Slider
                                          value={[
                                            automation.rebetSettings
                                              .maxAttempts,
                                          ]}
                                          onValueChange={([value]) =>
                                            setAutomation((prev) => ({
                                              ...prev,
                                              rebetSettings: {
                                                ...prev.rebetSettings,
                                                maxAttempts: value,
                                              },
                                            }))
                                          }
                                          max={10}
                                          min={1}
                                          step={1}
                                          className="mt-2"
                                        />
                                        <div className="text-xs text-gray-400 text-center mt-1">
                                          {automation.rebetSettings.maxAttempts}{" "}
                                          attempts
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-gray-300 text-sm">
                                          Delay (seconds)
                                        </Label>
                                        <Slider
                                          value={[
                                            automation.rebetSettings
                                              .delayBetween,
                                          ]}
                                          onValueChange={([value]) =>
                                            setAutomation((prev) => ({
                                              ...prev,
                                              rebetSettings: {
                                                ...prev.rebetSettings,
                                                delayBetween: value,
                                              },
                                            }))
                                          }
                                          max={300}
                                          min={10}
                                          step={10}
                                          className="mt-2"
                                        />
                                        <div className="text-xs text-gray-400 text-center mt-1">
                                          {
                                            automation.rebetSettings
                                              .delayBetween
                                          }
                                          s delay
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="scheduled" className="space-y-4 mt-4">
                      <Card className="bg-[#1A1F2C]/50 border-gray-800/50">
                        <CardContent className="p-4">
                          <div className="text-center py-8">
                            <Timer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400">
                              Scheduled betting coming soon
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Schedule bets to execute at specific times
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  {/* Bet Summary */}
                  {amount && isValidAmount && (
                    <Card className="bg-gradient-to-r from-[#0A0C14] to-[#1A1F2C]/50 border border-gray-800/50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Calculator className="h-4 w-4 text-[#9b87f5]" />
                          <span className="text-sm font-medium text-gray-300">
                            Bet Summary
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Betting on:</span>
                            <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30">
                              {side === "optionA"
                                ? market.optionA
                                : market.optionB}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Amount:</span>
                            <span className="text-white font-medium">
                              {formatCurrency(amount)} FLOW
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Current Odds:</span>
                            <span className="text-white font-medium">
                              {formatCurrency(currentOdds)}x
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">
                              Potential Payout:
                            </span>
                            <span className="text-green-400 font-medium">
                              {getEstimatedPayout()} FLOW
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Execution:</span>
                            <div className="flex items-center gap-1 text-white font-medium">
                              {getBetTypeIcon()}
                              <span className="capitalize">
                                {automation.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-[#9b87f5]/10 rounded text-xs text-gray-400">
                          {getBetTypeDescription()}
                        </div>
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
            className="flex-1 border-gray-700 text-gray-300 hover:bg-[#1A1F2C] h-12"
            disabled={isLoading || userAccount.isCreating}
          >
            Cancel
          </Button>
          {user && userAccount.exists ? (
            <Button
              onClick={placeBet}
              disabled={
                !amount ||
                !isValidAmount ||
                isLoading ||
                (automation.type !== "immediate" && !forteInitialized)
              }
              className="flex-1 bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white h-12 font-semibold shadow-lg shadow-[#9b87f5]/25 hover:shadow-[#9b87f5]/40 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {automation.type === "immediate"
                    ? "Placing Bet..."
                    : "Creating Automation..."}
                </>
              ) : (
                <>
                  {getBetTypeIcon()}
                  <span className="ml-2">
                    {automation.type === "immediate"
                      ? "Place Bet"
                      : automation.type === "conditional"
                        ? "Create Conditional Bet"
                        : "Schedule Bet"}
                  </span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={connectWallet}
              disabled={isLoading || userAccount.isCreating}
              className="flex-1 bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white h-12 font-semibold shadow-lg shadow-[#9b87f5]/25 hover:shadow-[#9b87f5]/40 transition-all duration-200"
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
