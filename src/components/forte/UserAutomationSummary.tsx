"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Clock,
  TrendingUp,
  User,
  Activity,
  CheckCircle,
  XCircle,
  Timer,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useForteActions } from "@/hooks/useForteActions";
import { getForteDemo } from "@/lib/forte-actions";

interface UserAutomationSummaryProps {
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export function UserAutomationSummary({
  className = "",
  showHeader = true,
  compact = false,
}: UserAutomationSummaryProps) {
  const { user } = useAuth();
  const { isInitialized, scheduledTransactions, initialize, isLoading } =
    useForteActions();

  if (!user?.addr) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <User className="h-8 w-8 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-600">
            Connect your wallet to view automation summary
          </p>
        </CardContent>
      </Card>
    );
  }

  const demoStats = getForteDemo(user.addr);
  const pendingActions = scheduledTransactions.filter(
    (tx) => tx.status === "PENDING"
  );
  const executedActions = scheduledTransactions.filter(
    (tx) => tx.status === "EXECUTED"
  );
  const cancelledActions = scheduledTransactions.filter(
    (tx) => tx.status === "CANCELLED"
  );

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case "PLACE_BET":
        return <Bot className="h-4 w-4 text-blue-500" />;
      case "RESOLVE_MARKET":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "AUTOMATED_PAYOUT":
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case "CLAIM_WINNINGS":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-sm">My Automation</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {formatAddress(user.addr)}
            </Badge>
          </div>

          {!isInitialized ? (
            <div className="text-center">
              <Button size="sm" onClick={initialize} disabled={isLoading}>
                {isLoading ? "Setting up..." : "Setup Automation"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {pendingActions.length}
                </div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {executedActions.length}
                </div>
                <div className="text-xs text-gray-600">Executed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-600">
                  {scheduledTransactions.length}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-500" />
              <span>My Automation Dashboard</span>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {formatAddress(user.addr)}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        {/* Initialization Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm">Automation Status</h3>
            {isInitialized ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-600">
                <XCircle className="h-3 w-3 mr-1" />
                Not Setup
              </Badge>
            )}
          </div>

          {!isInitialized ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Set up automation to unlock conditional betting, scheduling, and
                risk management tools.
              </p>
              <Button onClick={initialize} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Timer className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Setup Automation
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              ✅ All automation features are active and ready to use
            </div>
          )}
        </div>

        {isInitialized && (
          <>
            {/* Statistics Overview */}
            <div>
              <h3 className="font-medium text-sm mb-3">Activity Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">
                    {pendingActions.length}
                  </div>
                  <div className="text-xs text-blue-700">Active Actions</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {executedActions.length}
                  </div>
                  <div className="text-xs text-green-700">Executed</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-600">
                    {cancelledActions.length}
                  </div>
                  <div className="text-xs text-gray-700">Cancelled</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">
                    {scheduledTransactions.length}
                  </div>
                  <div className="text-xs text-purple-700">Total Actions</div>
                </div>
              </div>
            </div>

            {/* Recent Actions */}
            {scheduledTransactions.length > 0 && (
              <div>
                <h3 className="font-medium text-sm mb-3">Recent Actions</h3>
                <div className="space-y-2">
                  {scheduledTransactions
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .slice(0, 5)
                    .map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getActionTypeIcon(action.action.type)}
                          <div>
                            <div className="font-medium text-sm">
                              {action.action.type.replace(/_/g, " ")}
                            </div>
                            <div className="text-xs text-gray-600">
                              Market: {action.action.marketId}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              action.status === "PENDING"
                                ? "default"
                                : action.status === "EXECUTED"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {action.status}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {action.status === "PENDING"
                              ? `Execute: ${formatTime(action.executeAt)}`
                              : `Created: ${formatTime(action.createdAt)}`}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {scheduledTransactions.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-2">
                  No automation actions yet
                </p>
                <p className="text-xs text-gray-500">
                  Create conditional bets and scheduled actions to see them here
                </p>
              </div>
            )}
          </>
        )}

        {/* Demo Notice */}
        <Separator />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>🧪 Demo Mode - Personalized to your wallet</span>
          <span>Data: {demoStats.scheduledActionsCount} actions stored</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserAutomationSummary;
