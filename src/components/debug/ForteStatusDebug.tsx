"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Bot,
  User,
  Database,
  Info,
} from "lucide-react";
import { useForteActions } from "@/hooks/useForteActions";
import { useAuth } from "@/providers/auth-provider";
import { resetForteDemo, getForteDemo } from "@/lib/forte-actions";

export function ForteStatusDebug() {
  const { user } = useAuth();
  const {
    isInitialized,
    isLoading,
    isAvailable,
    scheduledTransactions,
    error,
    initialize,
  } = useForteActions();

  const getStatusIcon = (condition: boolean, loading = false) => {
    if (loading)
      return <Settings className="h-4 w-4 animate-spin text-blue-500" />;
    if (condition) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (condition: boolean, loading = false) => {
    if (loading)
      return (
        <Badge variant="outline" className="text-blue-600">
          Loading
        </Badge>
      );
    if (condition)
      return (
        <Badge variant="outline" className="text-green-600">
          ✓ Active
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-red-600">
        ✗ Inactive
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Forte Actions Debug Status</span>
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <Info className="h-3 w-3 mr-1" />
            Demo Mode
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Demo Mode Notice */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Demo Mode Active:</strong> Forte Actions are running in
            demonstration mode with mock transactions. All functionality works
            but uses local storage instead of real blockchain interactions.
          </AlertDescription>
        </Alert>

        {/* Environment Status */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-600">
            Environment Configuration
          </h3>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">
                  Forte Actions Available
                </span>
              </div>
              {getStatusBadge(isAvailable)}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">
                  NEXT_PUBLIC_ENABLE_FORTE_ACTIONS
                </span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {process.env.NEXT_PUBLIC_ENABLE_FORTE_ACTIONS || "undefined"}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* User Status */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-600">
            User Authentication
          </h3>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Wallet Connected</span>
            </div>
            {getStatusBadge(!!user?.addr)}
          </div>

          {user?.addr && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-gray-600">Connected Wallet:</div>
              <div className="font-mono text-sm text-blue-800 break-all">
                {user.addr}
              </div>
              <div className="text-xs text-gray-600 mt-2">Demo Data Scope:</div>
              <div className="text-xs text-blue-700">
                All automation data is personalized to this wallet address
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Forte Actions Status */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-600">
            Forte Actions Status
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(isInitialized, isLoading)}
                <span className="text-sm font-medium">
                  Forte Actions Initialized
                </span>
              </div>
              {getStatusBadge(isInitialized, isLoading)}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">
                  Scheduled Transactions
                </span>
              </div>
              <Badge variant="outline">
                {scheduledTransactions.length} active
              </Badge>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    Error
                  </span>
                </div>
                <div className="mt-1 text-sm text-red-600">{error}</div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {isAvailable && user?.addr && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-600">
                Actions
              </h3>

              <div className="flex gap-2">
                {!isInitialized && (
                  <Button
                    onClick={initialize}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Settings className="h-4 w-4 mr-2 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        Initialize Forte Actions
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    resetForteDemo(user?.addr);
                    window.location.reload();
                  }}
                  className={isInitialized ? "flex-1" : ""}
                >
                  🧹 Reset My Demo Data
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Current State Summary */}
        <Separator />
        <div className="p-4 bg-gray-100 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Current State Summary</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div className="text-blue-600 font-medium mb-2">
              🧪 Running in Demo Mode - All features functional with mock data
            </div>
            {!isAvailable && (
              <div className="text-red-600">
                ❌ Forte Actions are disabled (check environment variable)
              </div>
            )}
            {isAvailable && !user?.addr && (
              <div className="text-amber-600">
                ⚠️ Please connect your wallet to use Forte Actions
              </div>
            )}
            {isAvailable && user?.addr && !isInitialized && (
              <div className="text-blue-600">
                ℹ️ Forte Actions available but not initialized - click
                Initialize to enable automation features
              </div>
            )}
            {isAvailable && user?.addr && isInitialized && (
              <div className="text-green-600">
                ✅ Forte Actions fully initialized and ready to use (Demo Mode)
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer font-medium">
            Debug Information
          </summary>
          <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded overflow-auto">
            {JSON.stringify(
              {
                mode: "DEMO",
                isAvailable,
                isInitialized,
                isLoading,
                hasUser: !!user?.addr,
                userAddr: user?.addr,
                scheduledTxCount: scheduledTransactions.length,
                error: error,
                envVar: process.env.NEXT_PUBLIC_ENABLE_FORTE_ACTIONS,
                demoStats: user?.addr ? getForteDemo(user.addr) : null,
                personalizedStorage: user?.addr
                  ? `forte_*_${user.addr}`
                  : "none",
                demoDataKeys:
                  typeof window !== "undefined"
                    ? Object.keys(localStorage).filter((k) =>
                        k.startsWith("forte_"),
                      )
                    : [],
              },
              null,
              2,
            )}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}

export default ForteStatusDebug;
