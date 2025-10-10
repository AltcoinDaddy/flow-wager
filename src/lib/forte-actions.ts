import * as fcl from "@onflow/fcl";
import { getFlowWagerAddress, getFlowTokenAddress, getFungibleTokenAddress } from "./flow-wager-scripts";

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
  `
};

// Utility functions for Flow Actions integration

/**
 * Initialize Flow Actions for a user account
 */
export async function initializeFlowActions(): Promise<FlowActionResult> {
  try {
    const addresses = getForteAddresses();

    const transaction = `
      import DeFiActions from ${addresses.DeFiActions}

      transaction() {
        prepare(signer: AuthAccount) {
          // Create ActionBuilder resource if it doesn't exist
          if signer.borrow<&DeFiActions.ActionBuilder>(from: /storage/ActionBuilder) == nil {
            let actionBuilder <- DeFiActions.createActionBuilder()
            signer.save(<-actionBuilder, to: /storage/ActionBuilder)
          }

          // Create ActionScheduler resource if it doesn't exist
          if signer.borrow<&DeFiActions.ActionScheduler>(from: /storage/ActionScheduler) == nil {
            let scheduler <- DeFiActions.createActionScheduler()
            signer.save(<-scheduler, to: /storage/ActionScheduler)

            // Link public capability
            signer.link<&DeFiActions.ActionScheduler{DeFiActions.ActionSchedulerPublic}>(
              /public/ActionScheduler,
              target: /storage/ActionScheduler
            )
          }
        }
      }
    `;

    const authorization = fcl.currentUser().authorization;
    const txId = await fcl.mutate({
      cadence: transaction,
      proposer: authorization,
      payer: authorization,
      authorizations: [authorization],
      limit: 1000,
    });

    const result = await fcl.tx(txId).onceSealed();

    return {
      success: result.status === 4,
      transactionId: txId,
      error: result.status !== 4 ? "Transaction failed" : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create an automated bet with conditions
 */
export async function createAutomatedBet(
  marketId: string,
  amount: string,
  prediction: boolean,
  conditions: Record<string, any> = {}
): Promise<FlowActionResult> {
  try {
    const authorization = fcl.currentUser().authorization;
    const txId = await fcl.mutate({
      cadence: FORTE_SCRIPTS.createAutomatedBetAction,
      args: (arg, t) => [
        arg(marketId, t.String),
        arg(amount, t.UFix64),
        arg(prediction, t.Bool),
        arg(conditions, t.Dictionary({ key: t.String, value: t.AnyStruct })),
      ],
      proposer: authorization,
      payer: authorization,
      authorizations: [authorization],
      limit: 1000,
    });

    const result = await fcl.tx(txId).onceSealed();

    return {
      success: result.status === 4,
      transactionId: txId,
      error: result.status !== 4 ? "Transaction failed" : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Schedule a market resolution using oracle data
 */
export async function scheduleOracleResolution(
  marketId: string,
  oracleSymbol: string,
  targetPrice: string,
  resolutionTime: number
): Promise<FlowActionResult> {
  try {
    const authorization = fcl.currentUser().authorization;
    const txId = await fcl.mutate({
      cadence: FORTE_SCRIPTS.createOracleResolvedMarketAction,
      args: (arg, t) => [
        arg(marketId, t.String),
        arg(oracleSymbol, t.String),
        arg(targetPrice, t.UFix64),
        arg(resolutionTime.toString(), t.UFix64),
      ],
      proposer: authorization,
      payer: authorization,
      authorizations: [authorization],
      limit: 1000,
    });

    const result = await fcl.tx(txId).onceSealed();

    return {
      success: result.status === 4,
      transactionId: txId,
      actionId: `oracle_resolution_${marketId}_${Date.now()}`,
      error: result.status !== 4 ? "Transaction failed" : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create automated payout distribution
 */
export async function createAutomatedPayout(marketId: string): Promise<FlowActionResult> {
  try {
    const authorization = fcl.currentUser().authorization;
    const txId = await fcl.mutate({
      cadence: FORTE_SCRIPTS.createAutomatedPayoutAction,
      args: (arg, t) => [arg(marketId, t.String)],
      proposer: authorization,
      payer: authorization,
      authorizations: [authorization],
      limit: 1000,
    });

    const result = await fcl.tx(txId).onceSealed();

    return {
      success: result.status === 4,
      transactionId: txId,
      error: result.status !== 4 ? "Transaction failed" : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get scheduled transactions for a user
 */
export async function getScheduledTransactions(accountAddress: string): Promise<ScheduledTransaction[]> {
  try {
    const result = await fcl.query({
      cadence: FORTE_SCRIPTS.getScheduledTransactions,
      args: (arg, t) => [arg(accountAddress, t.Address)],
    });

    return result || [];
  } catch (error) {
    console.error("Error fetching scheduled transactions:", error);
    return [];
  }
}

/**
 * Get the status of a Flow Action
 */
export async function getActionStatus(actionId: string): Promise<any> {
  try {
    const result = await fcl.query({
      cadence: FORTE_SCRIPTS.getActionStatus,
      args: (arg, t) => [arg(actionId, t.String)],
    });

    return result;
  } catch (error) {
    console.error("Error fetching action status:", error);
    return null;
  }
}

/**
 * Cancel a scheduled transaction
 */
export async function cancelScheduledTransaction(actionId: string): Promise<FlowActionResult> {
  try {
    const addresses = getForteAddresses();

    const transaction = `
      import DeFiActions from ${addresses.DeFiActions}

      transaction(actionId: String) {
        let scheduler: &DeFiActions.ActionScheduler

        prepare(signer: AuthAccount) {
          self.scheduler = signer.borrow<&DeFiActions.ActionScheduler>(
            from: /storage/ActionScheduler
          ) ?? panic("Could not borrow ActionScheduler")
        }

        execute {
          self.scheduler.cancelAction(id: actionId)
        }
      }
    `;

    const authorization = fcl.currentUser().authorization;
    const txId = await fcl.mutate({
      cadence: transaction,
      args: (arg, t) => [arg(actionId, t.String)],
      proposer: authorization,
      payer: authorization,
      authorizations: [authorization],
      limit: 1000,
    });

    const result = await fcl.tx(txId).onceSealed();

    return {
      success: result.status === 4,
      transactionId: txId,
      error: result.status !== 4 ? "Transaction failed" : undefined,
    };
  } catch (error) {
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
  if (options.priceThreshold) conditions.priceThreshold = options.priceThreshold;
  if (options.timeWindow) conditions.timeWindow = options.timeWindow;

  return conditions;
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
};
