// eslint-disable-next-line @typescript-eslint/no-unused-vars
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Zap,
  Bot,
  Clock,
  ChevronDown,
  TrendingUp,
  Target,
  Shield,
  Info,
  Sparkles,
  Timer,
  Activity,
  Settings,
} from "lucide-react";
import { BetDialog } from "./bet-dialog";
import { ScheduledTransactionsPanel } from "../forte/ScheduledTransactionsPanel";
import { useForteActions } from "@/hooks/useForteActions";
import { useAuth } from "@/providers/auth-provider";
import type { Market } from "@/types/market";

interface MarketActionsProps {
  market: Market;
  onBetSuccess?: () => void;
  className?: string;
}

export function MarketActions({
  market,
  onBetSuccess,
  className,
}: MarketActionsProps) {
  const { user } = useAuth();
  const {
    isInitialized: forteInitialized,
    scheduledTransactions,
    initialize: initializeForte,
  } = useForteActions();

  const [showBetDialog, setShowBetDialog] = useState(false);
  const [selectedSide, setSelectedSide] = useState<"optionA" | "optionB">(
    "optionA",
  );
  const [showAutomationPanel, setShowAutomationPanel] = useState(false);

  // Calculate market stats
  const totalShares =
    parseFloat(market.totalOptionAShares) +
    parseFloat(market.totalOptionBShares);
  const optionAPercentage =
    totalShares > 0
      ? (parseFloat(market.totalOptionAShares) / totalShares) * 100
      : 50;
  const optionBPercentage = 100 - optionAPercentage;

  const optionAOdds = optionAPercentage > 0 ? 100 / optionAPercentage : 1;
  const optionBOdds = optionBPercentage > 0 ? 100 / optionBPercentage : 1;

  const isMarketActive =
    !market.resolved && new Date(Number(market.endTime) * 1000) > new Date();
  const userScheduledBets = scheduledTransactions.filter(
    (tx) => tx.action.marketId === market.id && tx.status === "PENDING",
  );

  const handleQuickBet = (side: "optionA" | "optionB") => {
    setSelectedSide(side);
    setShowBetDialog(true);
  };

  const handleAdvancedBet = (side: "optionA" | "optionB") => {
    if (!forteInitialized) {
      initializeForte();
      return;
    }
    setSelectedSide(side);
    setShowBetDialog(true);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Market Status */}
      <Card className="bg-gradient-to-r from-[#1A1F2C]/80 to-[#151923]/80 border-gray-800/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#9b87f5]" />
              <span className="text-sm font-medium text-white">
                Market Status
              </span>
            </div>
            <Badge variant={isMarketActive ? "default" : "secondary"}>
              {market.resolved
                ? "Resolved"
                : isMarketActive
                  ? "Active"
                  : "Ended"}
            </Badge>
          </div>

          {isMarketActive && (
            <div className="text-xs text-gray-400">
              Ends:{" "}
              {new Date(Number(market.endTime) * 1000).toLocaleDateString()} at{" "}
              {new Date(Number(market.endTime) * 1000).toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Betting Actions */}
      {isMarketActive && user && (
        <Card className="bg-gradient-to-r from-[#0A0C14] to-[#1A1F2C]/50 border-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-[#9b87f5]" />
              Place Your Bet
            </CardTitle>
            <CardDescription>
              Choose your prediction and betting method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Bet Options */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    {market.optionA}
                  </span>
                  <span className="text-xs text-gray-400">
                    {optionAOdds.toFixed(2)}x
                  </span>
                </div>
                <div className="space-y-1">
                  <Button
                    onClick={() => handleQuickBet("optionA")}
                    className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white h-10"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Bet Now
                  </Button>

                  {forteInitialized ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full border-[#9b87f5]/30 text-[#9b87f5] hover:bg-[#9b87f5]/10 h-8 text-xs"
                        >
                          <Bot className="h-3 w-3 mr-2" />
                          Automate
                          <ChevronDown className="h-3 w-3 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleAdvancedBet("optionA")}
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          Conditional Bet
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <Clock className="h-4 w-4 mr-2" />
                          Scheduled Bet
                          <Badge variant="outline" className="ml-2 text-xs">
                            Soon
                          </Badge>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={initializeForte}
                      className="w-full border-gray-700 text-gray-400 hover:text-white hover:border-[#9b87f5] h-8 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-2" />
                      Enable Automation
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    {market.optionB}
                  </span>
                  <span className="text-xs text-gray-400">
                    {optionBOdds.toFixed(2)}x
                  </span>
                </div>
                <div className="space-y-1">
                  <Button
                    onClick={() => handleQuickBet("optionB")}
                    className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white h-10"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Bet Now
                  </Button>

                  {forteInitialized ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full border-[#9b87f5]/30 text-[#9b87f5] hover:bg-[#9b87f5]/10 h-8 text-xs"
                        >
                          <Bot className="h-3 w-3 mr-2" />
                          Automate
                          <ChevronDown className="h-3 w-3 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleAdvancedBet("optionB")}
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          Conditional Bet
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <Clock className="h-4 w-4 mr-2" />
                          Scheduled Bet
                          <Badge variant="outline" className="ml-2 text-xs">
                            Soon
                          </Badge>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={initializeForte}
                      className="w-full border-gray-700 text-gray-400 hover:text-white hover:border-[#9b87f5] h-8 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-2" />
                      Enable Automation
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Automation Features Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  Automation Features
                </span>
                {forteInitialized ? (
                  <Badge variant="default" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <Settings className="h-3 w-3 mr-1" />
                    Initialize Required
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1 text-gray-400">
                  <Bot className="h-3 w-3" />
                  <span>Conditional</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Shield className="h-3 w-3" />
                  <span>Risk Mgmt</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Target className="h-3 w-3" />
                  <span>Auto-Rebet</span>
                </div>
              </div>

              {userScheduledBets.length > 0 && (
                <Alert>
                  <Timer className="h-4 w-4" />
                  <AlertDescription>
                    You have {userScheduledBets.length} scheduled bet
                    {userScheduledBets.length > 1 ? "s" : ""} for this market.{" "}
                    <button
                      onClick={() => setShowAutomationPanel(true)}
                      className="text-[#9b87f5] underline hover:text-[#8b5cf6]"
                    >
                      View details
                    </button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Not Active */}
      {!isMarketActive && (
        <Card className="bg-[#1A1F2C]/50 border-gray-800/50">
          <CardContent className="text-center py-8">
            <Timer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 font-medium mb-2">
              {market.resolved ? "Market Resolved" : "Betting Closed"}
            </p>
            <p className="text-sm text-gray-500">
              {market.resolved
                ? "This market has been resolved and payouts distributed"
                : "Betting has ended. Waiting for resolution."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* User Not Connected */}
      {!user && isMarketActive && (
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="text-center py-6">
            <Info className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <p className="text-yellow-400 font-medium mb-2">
              Connect Your Wallet
            </p>
            <p className="text-sm text-yellow-400/80">
              Connect your wallet to place bets and use automation features
            </p>
          </CardContent>
        </Card>
      )}

      {/* Forte Features Preview */}
      {forteInitialized && isMarketActive && (
        <Card className="bg-gradient-to-r from-[#9b87f5]/10 to-[#8b5cf6]/10 border-[#9b87f5]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-[#9b87f5]" />
              Automation Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Bot className="h-3 w-3 text-[#9b87f5]" />
                <span>Set odds thresholds and time windows</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-[#9b87f5]" />
                <span>Automatic slippage protection & stop-loss</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3 text-[#9b87f5]" />
                <span>Auto-retry failed transactions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Bet Dialog */}
      <BetDialog
        open={showBetDialog}
        onOpenChange={setShowBetDialog}
        market={market}
        initialSide={selectedSide}
        onBetSuccess={() => {
          onBetSuccess?.();
          setShowBetDialog(false);
        }}
      />

      {/* Automation Panel Modal */}
      {showAutomationPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1F2C] border border-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">
                Your Scheduled Actions
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAutomationPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <div className="p-4">
              <ScheduledTransactionsPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketActions;
