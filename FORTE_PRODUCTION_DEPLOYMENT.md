# 🚀 Forte Actions Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Code Readiness Assessment

**Current Status: DEMO READY → PRODUCTION READY**

- ✅ **UI/UX Complete**: All components production-ready
- ✅ **User Experience**: Fully functional automation workflows  
- ✅ **Personalization**: Wallet-specific data isolation
- ✅ **Error Handling**: Comprehensive error states and recovery
- ✅ **Performance**: Optimized for production loads
- ⚠️ **Backend Integration**: Requires real contract deployment

## 🔄 Migration Strategy: Demo → Production

### Phase 1: Infrastructure Setup (Week 1)

#### 1.1 Smart Contract Deployment
```bash
# Deploy Forte contracts to Flow Mainnet
# Required contracts:
- DeFiActions Contract
- ActionScheduler Contract  
- OracleConnectors Contract
- FungibleTokenConnectors Contract
```

#### 1.2 Contract Address Updates
```typescript
// Update src/lib/forte-actions.ts
export const getForteAddresses = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "mainnet";
  
  if (network === "mainnet") {
    return {
      // REPLACE WITH REAL DEPLOYED ADDRESSES
      DeFiActions: "0x[REAL_MAINNET_ADDRESS]",
      ActionScheduler: "0x[REAL_MAINNET_ADDRESS]", 
      OracleConnectors: "0x[REAL_MAINNET_ADDRESS]",
      FungibleTokenConnectors: "0x[REAL_MAINNET_ADDRESS]"
    };
  }
  // Keep testnet addresses for development
};
```

#### 1.3 Environment Configuration
```bash
# Production .env
NEXT_PUBLIC_FLOW_NETWORK=mainnet
NEXT_PUBLIC_ENABLE_FORTE_ACTIONS=true
NEXT_PUBLIC_FORTE_PRODUCTION_MODE=true

# Remove demo indicators
NEXT_PUBLIC_FORTE_DEMO_MODE=false
```

### Phase 2: Code Migration (Week 1-2)

#### 2.1 Replace Demo Functions with Real Implementations

**File: `src/lib/forte-actions.ts`**
```typescript
// BEFORE (Demo):
export async function initializeFlowActions(userAddress?: string): Promise<FlowActionResult> {
  // Mock implementation with localStorage
}

// AFTER (Production):
export async function initializeFlowActions(userAddress?: string): Promise<FlowActionResult> {
  try {
    const addresses = getForteAddresses();
    
    const transaction = `
      import DeFiActions from ${addresses.DeFiActions}
      import ActionScheduler from ${addresses.ActionScheduler}
      
      transaction() {
        prepare(signer: AuthAccount) {
          // Real smart contract initialization
          if signer.borrow<&DeFiActions.ActionBuilder>(from: /storage/ActionBuilder) == nil {
            let actionBuilder <- DeFiActions.createActionBuilder()
            signer.save(<-actionBuilder, to: /storage/ActionBuilder)
          }
          
          if signer.borrow<&ActionScheduler.Scheduler>(from: /storage/ActionScheduler) == nil {
            let scheduler <- ActionScheduler.createScheduler()
            signer.save(<-scheduler, to: /storage/ActionScheduler)
            
            signer.link<&ActionScheduler.Scheduler{ActionScheduler.SchedulerPublic}>(
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
      limit: 9999,
    });

    const result = await fcl.tx(txId).onceSealed();

    return {
      success: result.status === 4,
      transactionId: txId,
      error: result.status !== 4 ? result.errorMessage : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

#### 2.2 Database Integration

**Replace localStorage with real database:**

```typescript
// Production data storage
interface ProductionDataService {
  // Store scheduled transactions in database
  saveScheduledTransaction(userAddress: string, transaction: ScheduledTransaction): Promise<void>;
  
  // Retrieve user's scheduled transactions
  getUserScheduledTransactions(userAddress: string): Promise<ScheduledTransaction[]>;
  
  // Update transaction status
  updateTransactionStatus(txId: string, status: TransactionStatus): Promise<void>;
  
  // Analytics and metrics
  getUserAutomationStats(userAddress: string): Promise<AutomationStats>;
}

// Implementation example (choose your database):
export class PostgresDataService implements ProductionDataService {
  async saveScheduledTransaction(userAddress: string, transaction: ScheduledTransaction): Promise<void> {
    await db.scheduledTransactions.create({
      data: {
        id: transaction.id,
        userAddress: userAddress,
        actionType: transaction.action.type,
        marketId: transaction.action.marketId,
        executeAt: new Date(transaction.executeAt),
        status: transaction.status,
        conditions: JSON.stringify(transaction.action),
        createdAt: new Date(transaction.createdAt)
      }
    });
  }
  
  async getUserScheduledTransactions(userAddress: string): Promise<ScheduledTransaction[]> {
    const transactions = await db.scheduledTransactions.findMany({
      where: { userAddress },
      orderBy: { createdAt: 'desc' }
    });
    
    return transactions.map(tx => ({
      id: tx.id,
      action: JSON.parse(tx.conditions),
      executeAt: tx.executeAt.getTime(),
      status: tx.status as TransactionStatus,
      createdAt: tx.createdAt.getTime()
    }));
  }
}
```

#### 2.3 Backend Services Setup

**Automation Execution Service:**
```typescript
// services/automationExecutor.ts
export class AutomationExecutor {
  constructor(
    private dataService: ProductionDataService,
    private blockchainService: FlowBlockchainService
  ) {}

  async checkAndExecutePendingActions(): Promise<void> {
    const pendingActions = await this.dataService.getPendingActions();
    const now = Date.now();

    for (const action of pendingActions) {
      if (action.executeAt <= now && this.shouldExecute(action)) {
        await this.executeAction(action);
      }
    }
  }

  private async executeAction(action: ScheduledTransaction): Promise<void> {
    try {
      let result: FlowActionResult;

      switch (action.action.type) {
        case 'PLACE_BET':
          result = await this.blockchainService.executeBet(action);
          break;
        case 'RESOLVE_MARKET':
          result = await this.blockchainService.resolveMarket(action);
          break;
        case 'AUTOMATED_PAYOUT':
          result = await this.blockchainService.distributePayout(action);
          break;
        default:
          throw new Error(`Unknown action type: ${action.action.type}`);
      }

      if (result.success) {
        await this.dataService.updateTransactionStatus(action.id, 'EXECUTED');
        await this.notifyUser(action.userAddress, 'execution_success', action);
      } else {
        await this.dataService.updateTransactionStatus(action.id, 'FAILED');
        await this.notifyUser(action.userAddress, 'execution_failed', action);
      }
    } catch (error) {
      console.error('Action execution failed:', error);
      await this.dataService.updateTransactionStatus(action.id, 'FAILED');
    }
  }

  private shouldExecute(action: ScheduledTransaction): boolean {
    // Check conditions (odds, market status, user balance, etc.)
    // Implement your business logic here
    return true;
  }

  private async notifyUser(userAddress: string, type: string, action: ScheduledTransaction): Promise<void> {
    // Send notifications (