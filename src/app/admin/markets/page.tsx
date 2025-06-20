/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

// src/app/admin/markets/page.tsx

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { MarketManagement } from "@/components/admin/market-management";
import {
  ArrowLeft,
  Plus,
  Settings,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function AdminMarketsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // const handleMarketAction = async (action: string, marketIds: number[]) => {
  //   setIsLoading(true);
  //   setLastAction(action);

  //   try {
  //     // Simulate API call
  //     console.log(`Performing ${action} on markets:`, marketIds);

  //     switch (action) {
  //       case "export":
  //         // Simulate export
  //         await new Promise((resolve) => setTimeout(resolve, 2000));
  //         alert(`Exported ${marketIds.length} markets successfully`);
  //         break;

  //       case "featured":
  //         // Simulate marking as featured
  //         await new Promise((resolve) => setTimeout(resolve, 1500));
  //         alert(`Marked ${marketIds.length} markets as featured`);
  //         break;

  //       case "cancel":
  //         // Simulate cancellation
  //         if (
  //           confirm(
  //             `Are you sure you want to cancel ${marketIds.length} markets? This action cannot be undone.`
  //           )
  //         ) {
  //           await new Promise((resolve) => setTimeout(resolve, 2000));
  //           alert(`Cancelled ${marketIds.length} markets successfully`);
  //         }
  //         break;

  //       default:
  //         await new Promise((resolve) => setTimeout(resolve, 1000));
  //         alert(`Performed ${action} on ${marketIds.length} markets`);
  //     }
  //   } catch (error) {
  //     console.error("Action failed:", error);
  //     alert("Action failed. Please try again.");
  //   } finally {
  //     setIsLoading(false);
  //     setLastAction(null);
  //   }
  // };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Market Management</h1>
            <p className="text-muted-foreground">
              Manage all prediction markets on the platform
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant="secondary">Admin Panel</Badge>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium">Market Operations</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Create, edit, resolve, and manage all prediction markets
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/resolve">
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve Markets
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Market
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Message */}
      {lastAction && isLoading && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700 dark:text-blue-300">
            Processing {lastAction} action...
          </span>
        </div>
      )}

      {/* Management Guidelines */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-medium">Active Markets</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor ongoing markets for unusual activity or disputes
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-medium">Pending Resolution</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Resolve markets promptly after their end time to maintain trust
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">Quality Control</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Review and moderate market content for policy compliance
          </p>
        </div>
      </div>

      {/* Market Management Component */}
      {/* <MarketManagement onMarketAction={handleMarketAction} /> */}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-16 flex-col space-y-2" asChild>
          <Link href="/admin/create">
            <Plus className="h-6 w-6" />
            <span>Create Market</span>
          </Link>
        </Button>

        <Button variant="outline" className="h-16 flex-col space-y-2" asChild>
          <Link href="/admin/resolve">
            <CheckCircle className="h-6 w-6" />
            <span>Resolve Markets</span>
          </Link>
        </Button>

        <Button variant="outline" className="h-16 flex-col space-y-2">
          <Download className="h-6 w-6" />
          <span>Export Data</span>
        </Button>

        <Button variant="outline" className="h-16 flex-col space-y-2" asChild>
          <Link href="/admin/settings">
            <Settings className="h-6 w-6" />
            <span>Settings</span>
          </Link>
        </Button>
      </div>

      {/* Loading Overlay for Actions */}
      {isLoading && lastAction && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background border rounded-lg p-8 text-center max-w-sm w-full mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Processing Action</h3>
            <p className="text-muted-foreground">
              {lastAction === "export" && "Exporting market data..."}
              {lastAction === "featured" && "Updating featured status..."}
              {lastAction === "cancel" && "Cancelling markets..."}
              {!["export", "featured", "cancel"].includes(lastAction) &&
                "Processing request..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
