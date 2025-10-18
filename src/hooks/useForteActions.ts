import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  initializeFlowActions,
  createAutomatedBet,
  scheduleOracleResolution,
  createAutomatedPayout,
  getScheduledTransactions,
  getActionStatus,
  cancelScheduledTransaction,
  createBetConditions,
  FlowActionResult,
  ScheduledTransaction,
} from "@/lib/forte-actions";
import { toast } from "sonner";

// Feature flag for Forte Actions - enabled by default in development
const FORTE_ACTIONS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_FORTE_ACTIONS !== "false";

export interface UseForteActionsReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  scheduledTransactions: ScheduledTransaction[];
  error: string | null;
  isAvailable: boolean;

  // Actions
  initialize: () => Promise<void>;
  createConditionalBet: (
    params: ConditionalBetParams,
  ) => Promise<FlowActionResult>;
  scheduleMarketResolution: (
    params: OracleResolutionParams,
  ) => Promise<FlowActionResult>;
  setupAutomatedPayout: (marketId: string) => Promise<FlowActionResult>;
  cancelAction: (actionId: string) => Promise<FlowActionResult>;
  refreshScheduledTransactions: () => Promise<void>;
  checkActionStatus: (actionId: string) => Promise<unknown>;

  // Utilities
  createAdvancedBetConditions: (
    options: BetConditionsOptions,
  ) => Record<string, unknown>;
}

export interface ConditionalBetParams {
  marketId: string;
  amount: string;
  prediction: boolean;
  conditions?: {
    minOdds?: number;
    maxOdds?: number;
    priceThreshold?: number;
    timeWindow?: { start: number; end: number };
    maxSlippage?: number;
    stopLoss?: number;
  };
}

export interface OracleResolutionParams {
  marketId: string;
  oracleSymbol: string;
  targetPrice: string;
  resolutionTime: number;
}

export interface BetConditionsOptions {
  minOdds?: number;
  maxOdds?: number;
  priceThreshold?: number;
  timeWindow?: { start: number; end: number };
  maxSlippage?: number;
  stopLoss?: number;
  autoRebet?: boolean;
  rebetConditions?: {
    maxAttempts: number;
    delayBetween: number;
  };
}

export const useForteActions = (): UseForteActionsReturn => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledTransactions, setScheduledTransactions] = useState<
    ScheduledTransaction[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  // Refresh scheduled transactions
  const refreshScheduledTransactions = useCallback(async () => {
    if (!user?.addr) return;

    try {
      const transactions = await getScheduledTransactions(user.addr);
      setScheduledTransactions(transactions);
    } catch (err) {
      console.error("Error refreshing scheduled transactions:", err);
      setError("Failed to refresh scheduled transactions");
    }
  }, [user?.addr]);

  // Initialize Forte Actions for the user (opt-in only)
  const initialize = useCallback(async () => {
    if (!FORTE_ACTIONS_ENABLED) {
      const error = "Forte automation features are currently disabled";
      setError(error);
      toast.error(error);
      return;
    }

    if (!user?.addr) {
      setError("Please connect your wallet first");
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Show user what's happening
      toast.info("Setting up Forte automation features...");

      const result = await initializeFlowActions(user.addr);

      if (result.success) {
        setIsInitialized(true);
        toast.success(
          "🚀 Forte automation is now active! You can now create conditional and scheduled bets.",
        );
        await refreshScheduledTransactions();
      } else {
        setError(result.error || "Failed to initialize Forte Actions");
        toast.error(`Setup failed: ${result.error || "Unknown error"}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(`Error during setup: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.addr, refreshScheduledTransactions]);

  // Create a conditional bet with automated conditions
  const createConditionalBet = useCallback(
    async (params: ConditionalBetParams): Promise<FlowActionResult> => {
      if (!isInitialized) {
        const error =
          "Forte automation not set up yet. Please initialize it first.";
        toast.error(error);
        return { success: false, error };
      }

      try {
        setIsLoading(true);
        setError(null);

        const conditions = params.conditions
          ? createBetConditions(params.conditions)
          : {};

        const result = await createAutomatedBet(
          params.marketId,
          params.amount,
          params.prediction,
          conditions,
        );

        if (result.success) {
          toast.success("Conditional bet created successfully!");
          await refreshScheduledTransactions();
        } else {
          toast.error(result.error || "Failed to create conditional bet");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error("Error creating conditional bet");
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, refreshScheduledTransactions],
  );

  // Schedule market resolution with oracle integration
  const scheduleMarketResolution = useCallback(
    async (params: OracleResolutionParams): Promise<FlowActionResult> => {
      if (!isInitialized) {
        const error =
          "Forte automation not set up yet. Please initialize it first.";
        toast.error(error);
        return { success: false, error };
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await scheduleOracleResolution(
          params.marketId,
          params.oracleSymbol,
          params.targetPrice,
          params.resolutionTime,
        );

        if (result.success) {
          toast.success("Oracle-based market resolution scheduled!");
          await refreshScheduledTransactions();
        } else {
          toast.error(result.error || "Failed to schedule market resolution");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error("Error scheduling market resolution");
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, refreshScheduledTransactions],
  );

  // Setup automated payout for a market
  const setupAutomatedPayout = useCallback(
    async (marketId: string): Promise<FlowActionResult> => {
      if (!isInitialized) {
        const error =
          "Forte automation not set up yet. Please initialize it first.";
        toast.error(error);
        return { success: false, error };
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await createAutomatedPayout(marketId);

        if (result.success) {
          toast.success("Automated payout setup successfully!");
          await refreshScheduledTransactions();
        } else {
          toast.error(result.error || "Failed to setup automated payout");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error("Error setting up automated payout");
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, refreshScheduledTransactions],
  );

  // Cancel a scheduled action
  const cancelAction = useCallback(
    async (actionId: string): Promise<FlowActionResult> => {
      if (!isInitialized) {
        const error =
          "Forte automation not set up yet. Please initialize it first.";
        toast.error(error);
        return { success: false, error };
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await cancelScheduledTransaction(actionId);

        if (result.success) {
          toast.success("Scheduled action cancelled successfully!");
          await refreshScheduledTransactions();
        } else {
          toast.error(result.error || "Failed to cancel action");
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error("Error cancelling action");
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized, refreshScheduledTransactions],
  );

  // Check action status
  const checkActionStatus = useCallback(async (actionId: string) => {
    try {
      return await getActionStatus(actionId);
    } catch (err) {
      console.error("Error checking action status:", err);
      return null;
    }
  }, []);

  // Create advanced bet conditions
  const createAdvancedBetConditions = useCallback(
    (options: BetConditionsOptions): Record<string, unknown> => {
      const conditions: Record<string, unknown> = {};

      // Basic conditions
      if (options.minOdds) conditions.minOdds = options.minOdds;
      if (options.maxOdds) conditions.maxOdds = options.maxOdds;
      if (options.priceThreshold)
        conditions.priceThreshold = options.priceThreshold;
      if (options.timeWindow) conditions.timeWindow = options.timeWindow;

      // Advanced trading conditions
      if (options.maxSlippage) conditions.maxSlippage = options.maxSlippage;
      if (options.stopLoss) conditions.stopLoss = options.stopLoss;

      // Auto-rebet conditions
      if (options.autoRebet && options.rebetConditions) {
        conditions.autoRebet = true;
        conditions.rebetConditions = options.rebetConditions;
      }

      return conditions;
    },
    [],
  );

  // Auto-refresh scheduled transactions
  useEffect(() => {
    if (isInitialized && user?.addr) {
      refreshScheduledTransactions();

      // Set up polling for transaction updates
      const interval = setInterval(() => {
        refreshScheduledTransactions();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isInitialized, user?.addr, refreshScheduledTransactions]);

  // Check if user has Forte Actions resources without auto-initializing
  useEffect(() => {
    const checkForteStatus = async () => {
      if (user?.addr && !isInitialized && FORTE_ACTIONS_ENABLED) {
        try {
          // Check if user already has Forte Actions initialized (demo mode)
          if (typeof window !== "undefined") {
            const isInitialized =
              localStorage.getItem(`forte_actions_initialized_${user.addr}`) ===
              "true";
            if (isInitialized) {
              // Set current user for demo
              localStorage.setItem("forte_current_user", user.addr);
              setIsInitialized(true);
              // Load scheduled transactions
              const scheduledTxs = await getScheduledTransactions(user.addr);
              setScheduledTransactions(scheduledTxs);
              console.log("✅ Forte Actions already initialized (Demo Mode)", {
                user: user.addr,
              });
            } else {
              console.log("ℹ️ Forte Actions not yet initialized for user", {
                user: user.addr,
              });
              setIsInitialized(false);
            }
          }
        } catch (err) {
          // User doesn't have Forte Actions initialized yet - this is expected
          console.log("Forte Actions not yet initialized for user");
          setIsInitialized(false);
        }
      } else if (!FORTE_ACTIONS_ENABLED) {
        setIsInitialized(false);
      }
    };

    checkForteStatus();
  }, [user?.addr]);

  return {
    // State
    isInitialized: FORTE_ACTIONS_ENABLED && isInitialized,
    isLoading,
    scheduledTransactions: FORTE_ACTIONS_ENABLED ? scheduledTransactions : [],
    error: FORTE_ACTIONS_ENABLED ? error : null,
    isAvailable: FORTE_ACTIONS_ENABLED,

    // Actions
    initialize,
    createConditionalBet,
    scheduleMarketResolution,
    setupAutomatedPayout,
    cancelAction,
    refreshScheduledTransactions,
    checkActionStatus,

    // Utilities
    createAdvancedBetConditions,
  };
};

// Hook for managing scheduled transaction notifications
export const useScheduledTransactionNotifications = () => {
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "execution" | "failure" | "scheduled";
      message: string;
      timestamp: number;
      actionId: string;
    }>
  >([]);

  const addNotification = useCallback(
    (notification: {
      type: "execution" | "failure" | "scheduled";
      message: string;
      actionId: string;
    }) => {
      const newNotification = {
        ...notification,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };

      setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep only latest 50

      // Show toast notification
      switch (notification.type) {
        case "execution":
          toast.success(notification.message);
          break;
        case "failure":
          toast.error(notification.message);
          break;
        case "scheduled":
          toast.info(notification.message);
          break;
      }
    },
    [],
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    addNotification,
    clearNotifications,
    removeNotification,
  };
};

export default useForteActions;
