import * as fcl from "@onflow/fcl";
import {
  getFlowWagerAddress,
  getFlowTokenAddress,
  getFungibleTokenAddress,
} from "./flow-wager-scripts";

// Forte contract addresses
export const getForteAddresses = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";

  if (network === "mainnet") {
    return {
      DeFiActions: "0x92195d814edf9cb0",
      DeFiActionsMathUtils: "0x92195d814edf9cb0",
      DeFiActionsUtils: "0x92195d814edf9cb0",
      FungibleTokenConnectors: "0x1d9a619393e9fb53",
      EVMNativeFLOWConnectors: "0xcc15a0c9c656b648",
      EVMTokenConnectors: "0xcc15a0c9c656b648",
      SwapConnectors: "0x0bce04a00aedf132",
      IncrementFiSwapConnectors: "0xefa9bd7d1b17f1ed",
      IncrementFiFlashloanConnectors: "0xefa9bd7d1b17f1ed",
      IncrementFiPoolLiquidityConnectors: "0xefa9bd7d1b17f1ed",
      IncrementFiStakingConnectors: "0xefa9bd7d1b17f1ed",
      BandOracleConnectors: "0xf627b5c89141ed99",
      UniswapV2Connectors: "0x0e5b1dececaca3a8",
    };
  } else {
    return {
      DeFiActions: "0x4c2ff9dd03ab442f",
      DeFiActionsMathUtils: "0x4c2ff9dd03ab442f",
      DeFiActionsUtils: "0x4c2ff9dd03ab442f",
      FungibleTokenConnectors: "0x5a7b9cee9aaf4e4e",
      EVMNativeFLOWConnectors: "0xb88ba0e976146cd1",
      EVMTokenConnectors: "0xb88ba0e976146cd1",
      SwapConnectors: "0xaddd594cf410166a",
      IncrementFiSwapConnectors: "0x49bae091e5ea16b5",
      IncrementFiFlashloanConnectors: "0x49bae091e5ea16b5",
      IncrementFiPoolLiquidityConnectors: "0x49bae091e5ea16b5",
      IncrementFiStakingConnectors: "0x49bae091e5ea16b5",
      BandOracleConnectors: "0x1a9f5d18d096cd7a",
      UniswapV2Connectors: "0xfef8e4c5c16ccda5",
    };
  }
};

// Types for Flow Actions
export interface FlowActionResult {
  success: boolean;
  actionId?: string;
  transactionId?: string;
  error?: string;
}

export interface WagerAction {
  type: "PLACE_BET" | "RESOLVE_MARKET" | "CLAIM_WINNINGS" | "AUTOMATED_PAYOUT";
  marketId: string;
  amount?: string;
  outcome?: boolean;
  scheduledTime?: number;
}

export interface ScheduledTransaction {
  id: string;
  action: WagerAction;
  executeAt: number;
  status: "PENDING" | "EXECUTED" | "FAILED" | "CANCELLED";
  createdAt: number;
}

// Flow Actions for automated wagering workflows
export const FORTE_SCRIPTS = {
  // Create a Flow Action for placing a bet with automated conditions
  createAutomatedBetAction: `
    import DeFiActions from ${() => getForteAddresses().DeFiActions}
    import FungibleTokenConnectors from ${() => getForteAddresses().FungibleTokenConnectors}
    import FlowWager from ${() => getFlowWagerAddress()}
    import FlowToken from ${() => getFlowTokenAddress()}
    import FungibleToken from ${() => getFungibleTokenAddress()}

    transaction(
      marketId: String,
      betAmount: UFix64,
      prediction: Bool,
      conditions: {String: AnyStruct}
    ) {
      let actionBuilder: &DeFiActions.ActionBuilder
      let flowWagerRef: &FlowWager.FlowWagerContract

      prepare(signer: AuthAccount) {
        // Get references to required resources
        self.actionBuilder = signer.borrow<&DeFiActions.ActionBuilder>(
          from: /storage/ActionBuilder
        ) ?? panic("Could not borrow ActionBuilder")

        self.flowWagerRef = getAccount(${() => getFlowWagerAddress()}).getCapability<&FlowWager.FlowWagerContract{FlowWager.FlowWagerPublic}>(/public/FlowWager).borrow()
          ?? panic("Could not borrow FlowWager contract reference")
      }

      execute {
        // Create a conditional bet action that executes based on conditions
        let betAction = DeFiActions.Action(
          type: "CONDITIONAL_BET",
          data: {
            "marketId": marketId,
            "amount": betAmount,
            "prediction": prediction,
            "conditions": conditions
          }
        )

        // Add the action to the builder
        self.actionBuilder.addAction(betAction)

        // Execute the action workflow
        self.actionBuilder.execute()
      }
    }
  `,

  // Create automated market resolution with price oracle integration
  createOracleResolvedMarketAction: `
    import DeFiActions from ${() => getForteAddresses().DeFiActions}
    import BandOracleConnectors from ${() => getForteAddresses().BandOracleConnectors}
    import FlowWager from ${() => getFlowWagerAddress()}

    transaction(
      marketId: String,
      oracleSymbol: String,
      targetPrice: UFix64,
      resolutionTime: UFix64
    ) {
      let actionBuilder: &DeFiActions.ActionBuilder

      prepare(signer: AuthAccount) {
        self.actionBuilder = signer.borrow<&DeFiActions.ActionBuilder>(
          from: /storage/ActionBuilder
        ) ?? panic("Could not borrow ActionBuilder")
      }

      execute {
        // Create oracle price check action
        let priceCheckAction = BandOracleConnectors.createPriceCheckAction(
          symbol: oracleSymbol,
          targetPrice: targetPrice,
          comparison: "GREATER_THAN"
        )

        // Create market resolution action
        let resolveAction = DeFiActions.Action(
          type: "RESOLVE_MARKET",
          data: {
            "marketId": marketId,
            "oracleResult": true
          }
        )

        // Chain the actions together
        self.actionBuilder.addAction(priceCheckAction)
        self.actionBuilder.addConditionalAction(resolveAction, dependsOn: priceCheckAction.id)

        // Schedule execution at specified time
        self.actionBuilder.scheduleExecution(at: resolutionTime)
      }
    }
  `,

  // Automated payout distribution using Flow Actions
  createAutomatedPayoutAction: `
    import DeFiActions from ${() => getForteAddresses().DeFiActions}
    import FungibleTokenConnectors from ${() => getForteAddresses().FungibleTokenConnectors}
    import FlowWager from ${() => getFlowWagerAddress()}
    import FlowToken from ${() => getFlowTokenAddress()}

    transaction(marketId: String) {
      let actionBuilder: &DeFiActions.ActionBuilder

      prepare(signer: AuthAccount) {
        self.actionBuilder = signer.borrow<&DeFiActions.ActionBuilder>(
          from: /storage/ActionBuilder
        ) ?? panic("Could not borrow ActionBuilder")
      }

      execute {
        // Create automated payout action
        let payoutAction = DeFiActions.Action(
          type: "DISTRIBUTE_PAYOUTS",
          data: {
            "marketId": marketId,
            "automated": true
          }
        )

        // Add batch payment processing
        let batchPaymentAction = FungibleTokenConnectors.createBatchTransferAction()

        self.actionBuilder.addAction(payoutAction)
        self.actionBuilder.addAction(batchPaymentAction)
        self.actionBuilder.execute()
      }
    }
  `,

  // Query scheduled transactions
  getScheduledTransactions: `
    import DeFiActions from ${() => getForteAddresses().DeFiActions}

    pub fun main(accountAddress: Address): [DeFiActions.ScheduledAction] {
      let account = getAccount(accountAddress)
      let schedulerRef = account.getCapability<&DeFiActions.ActionScheduler{DeFiActions.ActionSchedulerPublic}>(
        /public/ActionScheduler
      ).borrow() ?? panic("Could not borrow ActionScheduler")

      return schedulerRef.getScheduledActions()
    }
  `,

  // Query Flow Actions status
  getActionStatus: `
    import DeFiActions from ${() => getForteAddresses().DeFiActions}

    pub fun main(actionId: String): DeFiActions.ActionStatus? {
      return DeFiActions.getActionStatus(id: actionId)
    }
  `,
};

// Utility functions for Flow Actions integration

/**
 * Initialize Flow Actions for a user account (Demo Version)
 */
export async function initializeFlowActions(
  userAddress?: string,
): Promise<FlowActionResult> {
  try {
    console.log("🚀 Initializing Forte Actions (Demo Mode)", { userAddress });

    // Simulate initialization delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock successful initialization
    const mockTxId = `forte_init_${Date.now()}`;

    // Store initialization flag in localStorage for demo purposes
    if (typeof window !== "undefined" && userAddress) {
      localStorage.setItem(`forte_actions_initialized_${userAddress}`, "true");
      localStorage.setItem(`forte_actions_tx_id_${userAddress}`, mockTxId);
      localStorage.setItem("forte_current_user", userAddress);
    }

    console.log("✅ Forte Actions initialized successfully (Demo)", {
      userAddress,
    });

    return {
      success: true,
      transactionId: mockTxId,
      error: undefined,
    };
  } catch (error) {
    console.error("❌ Forte Actions initialization failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create an automated bet with conditions (Demo Version)
 */
export async function createAutomatedBet(
  marketId: string,
  amount: string,
  prediction: boolean,
  conditions: Record<string, any> = {},
): Promise<FlowActionResult> {
  try {
    console.log("🤖 Creating automated bet (Demo Mode)", {
      marketId,
      amount,
      prediction,
      conditions,
    });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create mock transaction
    const mockTxId = `automated_bet_${Date.now()}`;
    const actionId = `action_${marketId}_${Date.now()}`;

    // Store in localStorage for demo - use current user's data
    if (typeof window !== "undefined") {
      const currentUser = localStorage.getItem("forte_current_user");
      const storageKey = currentUser
        ? `forte_scheduled_actions_${currentUser}`
        : "forte_scheduled_actions";

      const existingActions = JSON.parse(
        localStorage.getItem(storageKey) || "[]",
      );
      const newAction: ScheduledTransaction = {
        id: actionId,
        action: {
          type: "PLACE_BET",
          marketId,
          amount,
          outcome: prediction,
          scheduledTime:
            Date.now() +
            (conditions.timeWindow?.start
              ? new Date(conditions.timeWindow.start).getTime() - Date.now()
              : 0),
        },
        executeAt: conditions.timeWindow?.start
          ? new Date(conditions.timeWindow.start).getTime()
          : Date.now() + 60000, // Execute in 1 minute if no time specified
        status: "PENDING",
        createdAt: Date.now(),
      };

      existingActions.push(newAction);
      localStorage.setItem(storageKey, JSON.stringify(existingActions));
    }

    console.log("✅ Automated bet created successfully (Demo)");

    return {
      success: true,
      transactionId: mockTxId,
      actionId,
      error: undefined,
    };
  } catch (error) {
    console.error("❌ Automated bet creation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Schedule a market resolution using oracle data (Demo Version)
 */
export async function scheduleOracleResolution(
  marketId: string,
  oracleSymbol: string,
  targetPrice: string,
  resolutionTime: number,
): Promise<FlowActionResult> {
  try {
    console.log("📊 Scheduling oracle resolution (Demo Mode)", {
      marketId,
      oracleSymbol,
      targetPrice,
      resolutionTime,
    });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockTxId = `oracle_resolution_${Date.now()}`;
    const actionId = `oracle_resolution_${marketId}_${Date.now()}`;

    // Store in localStorage for demo - use current user's data
    if (typeof window !== "undefined") {
      const currentUser = localStorage.getItem("forte_current_user");
      const storageKey = currentUser
        ? `forte_scheduled_actions_${currentUser}`
        : "forte_scheduled_actions";

      const existingActions = JSON.parse(
        localStorage.getItem(storageKey) || "[]",
      );
      const newAction: ScheduledTransaction = {
        id: actionId,
        action: {
          type: "RESOLVE_MARKET",
          marketId,
          scheduledTime: resolutionTime,
        },
        executeAt: resolutionTime,
        status: "PENDING",
        createdAt: Date.now(),
      };

      existingActions.push(newAction);
      localStorage.setItem(storageKey, JSON.stringify(existingActions));
    }

    console.log("✅ Oracle resolution scheduled successfully (Demo)");

    return {
      success: true,
      transactionId: mockTxId,
      actionId,
      error: undefined,
    };
  } catch (error) {
    console.error("❌ Oracle resolution scheduling failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create automated payout distribution (Demo Version)
 */
export async function createAutomatedPayout(
  marketId: string,
): Promise<FlowActionResult> {
  try {
    console.log("💰 Creating automated payout (Demo Mode)", { marketId });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockTxId = `automated_payout_${Date.now()}`;
    const actionId = `payout_${marketId}_${Date.now()}`;

    // Store in localStorage for demo - use current user's data
    if (typeof window !== "undefined") {
      const currentUser = localStorage.getItem("forte_current_user");
      const storageKey = currentUser
        ? `forte_scheduled_actions_${currentUser}`
        : "forte_scheduled_actions";

      const existingActions = JSON.parse(
        localStorage.getItem(storageKey) || "[]",
      );
      const newAction: ScheduledTransaction = {
        id: actionId,
        action: {
          type: "AUTOMATED_PAYOUT",
          marketId,
          scheduledTime: Date.now() + 300000, // 5 minutes from now
        },
        executeAt: Date.now() + 300000,
        status: "PENDING",
        createdAt: Date.now(),
      };

      existingActions.push(newAction);
      localStorage.setItem(storageKey, JSON.stringify(existingActions));
    }

    console.log("✅ Automated payout created successfully (Demo)");

    return {
      success: true,
      transactionId: mockTxId,
      actionId,
      error: undefined,
    };
  } catch (error) {
    console.error("❌ Automated payout creation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get scheduled transactions for a user (Demo Version)
 */
export async function getScheduledTransactions(
  accountAddress: string,
): Promise<ScheduledTransaction[]> {
  try {
    console.log("📋 Fetching scheduled transactions (Demo Mode)", {
      accountAddress,
    });

    // Get from localStorage for demo - use specific user's data
    if (typeof window !== "undefined") {
      const storageKey = `forte_scheduled_actions_${accountAddress}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const actions: ScheduledTransaction[] = JSON.parse(stored);
        // Update status of expired actions
        const updated = actions.map((action) => {
          if (action.status === "PENDING" && action.executeAt < Date.now()) {
            return { ...action, status: "EXECUTED" as const };
          }
          return action;
        });

        // Save updated statuses
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      }
    }

    return [];
  } catch (error) {
    console.error("Error fetching scheduled transactions:", error);
    return [];
  }
}

/**
 * Get the status of a Flow Action (Demo Version)
 */
export async function getActionStatus(actionId: string): Promise<any> {
  try {
    console.log("🔍 Fetching action status (Demo Mode)", { actionId });

    // Get from localStorage for demo - check all users' data
    if (typeof window !== "undefined") {
      const currentUser = localStorage.getItem("forte_current_user");
      const storageKey = currentUser
        ? `forte_scheduled_actions_${currentUser}`
        : "forte_scheduled_actions";

      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const actions: ScheduledTransaction[] = JSON.parse(stored);
        const action = actions.find((a) => a.id === actionId);

        if (action) {
          return {
            id: action.id,
            status: action.status,
            executeAt: action.executeAt,
            createdAt: action.createdAt,
            action: action.action,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching action status:", error);
    return null;
  }
}

/**
 * Cancel a scheduled transaction (Demo Version)
 */
export async function cancelScheduledTransaction(
  actionId: string,
): Promise<FlowActionResult> {
  try {
    console.log("🚫 Cancelling scheduled transaction (Demo Mode)", {
      actionId,
    });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update in localStorage for demo - use current user's data
    if (typeof window !== "undefined") {
      const currentUser = localStorage.getItem("forte_current_user");
      const storageKey = currentUser
        ? `forte_scheduled_actions_${currentUser}`
        : "forte_scheduled_actions";

      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const actions: ScheduledTransaction[] = JSON.parse(stored);
        const updatedActions = actions.map((action) =>
          action.id === actionId
            ? { ...action, status: "CANCELLED" as const }
            : action,
        );

        localStorage.setItem(storageKey, JSON.stringify(updatedActions));
      }
    }

    const mockTxId = `cancel_${actionId}_${Date.now()}`;

    console.log("✅ Scheduled transaction cancelled successfully (Demo)");

    return {
      success: true,
      transactionId: mockTxId,
      error: undefined,
    };
  } catch (error) {
    console.error("❌ Transaction cancellation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to convert timestamp to Flow UFix64 format
export function timestampToUFix64(timestamp: number): string {
  return (timestamp / 1000).toFixed(8);
}

// Helper function to create conditions for automated bets
export function createBetConditions(options: {
  minOdds?: number;
  maxOdds?: number;
  priceThreshold?: number;
  timeWindow?: { start: number; end: number };
}): Record<string, any> {
  const conditions: Record<string, any> = {};

  if (options.minOdds) conditions.minOdds = options.minOdds;
  if (options.maxOdds) conditions.maxOdds = options.maxOdds;
  if (options.priceThreshold)
    conditions.priceThreshold = options.priceThreshold;
  if (options.timeWindow) conditions.timeWindow = options.timeWindow;

  return conditions;
}

/**
 * Reset all demo data (Demo Mode Only)
 */
export function resetForteDemo(userAddress?: string): void {
  if (typeof window !== "undefined") {
    if (userAddress) {
      // Reset specific user's data
      localStorage.removeItem(`forte_actions_initialized_${userAddress}`);
      localStorage.removeItem(`forte_actions_tx_id_${userAddress}`);
      localStorage.removeItem(`forte_scheduled_actions_${userAddress}`);
      console.log("🧹 Forte demo data reset for user:", userAddress);
    } else {
      // Reset current user's data
      const currentUser = localStorage.getItem("forte_current_user");
      if (currentUser) {
        localStorage.removeItem(`forte_actions_initialized_${currentUser}`);
        localStorage.removeItem(`forte_actions_tx_id_${currentUser}`);
        localStorage.removeItem(`forte_scheduled_actions_${currentUser}`);
      }
      // Also remove legacy keys
      localStorage.removeItem("forte_actions_initialized");
      localStorage.removeItem("forte_actions_tx_id");
      localStorage.removeItem("forte_scheduled_actions");
      localStorage.removeItem("forte_current_user");
      console.log("🧹 Forte demo data reset");
    }
  }
}

/**
 * Get demo statistics (Demo Mode Only)
 */
export function getForteDemo(userAddress?: string): {
  isInitialized: boolean;
  scheduledActionsCount: number;
  actionsData: ScheduledTransaction[];
  userAddress?: string;
} {
  if (typeof window === "undefined") {
    return { isInitialized: false, scheduledActionsCount: 0, actionsData: [] };
  }

  const currentUser = userAddress || localStorage.getItem("forte_current_user");
  const isInitialized = currentUser
    ? localStorage.getItem(`forte_actions_initialized_${currentUser}`) ===
      "true"
    : localStorage.getItem("forte_actions_initialized") === "true";

  const storageKey = currentUser
    ? `forte_scheduled_actions_${currentUser}`
    : "forte_scheduled_actions";
  const actionsData = JSON.parse(localStorage.getItem(storageKey) || "[]");

  return {
    isInitialized,
    scheduledActionsCount: actionsData.length,
    actionsData,
    userAddress: currentUser || undefined,
  };
}

export default {
  getForteAddresses,
  FORTE_SCRIPTS,
  initializeFlowActions,
  createAutomatedBet,
  scheduleOracleResolution,
  createAutomatedPayout,
  getScheduledTransactions,
  getActionStatus,
  cancelScheduledTransaction,
  timestampToUFix64,
  createBetConditions,
  resetForteDemo,
  getForteDemo,
};
