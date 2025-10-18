# FlowUpdate Multi-Option UI Integration Guide

## Overview

This guide walks you through integrating the new FlowUpdate multi-option market UI components into your Flow Wager application. The integration includes:

- **Type definitions** (`flowupdate.ts`) - TypeScript interfaces for markets, positions, and contracts
- **Transaction & query scripts** (`flowupdate-scripts.ts`) - Cadence scripts for on-chain operations
- **React hook** (`useFlowUpdate.ts`) - Custom hook for managing market data and operations
- **UI components** - Ready-to-use React components for displaying and betting on markets

## What Was Fixed

### ✅ Circular Dependency Resolution

The circular import issue between `flow-wager-scripts.ts` and `create-market.ts` has been resolved:

- **Root cause**: `create-market.ts` was importing address getters and calling them at module load time
- **Solution**: Deleted `create-market.ts` and inlined transaction scripts into `flow-wager-scripts.ts` as functions
- **Result**: All transaction and query scripts now use lazy evaluation (functions that call address getters at runtime)

## File Structure

```
src/
├── types/
│   └── flowupdate.ts                 # FlowUpdate TypeScript types
├── lib/
│   ├── flow-wager-scripts.ts         # (Updated) Contains transaction scripts as functions
│   └── flowupdate-scripts.ts         # FlowUpdate-specific transactions and queries
├── hooks/
│   ├── useFlowUpdate.ts              # Main hook for all FlowUpdate operations
│   └── ... (existing hooks)
└── components/
    ├── market/
    │   ├── MultiOptionBetForm.tsx    # Betting form component
    │   ├── MultiOptionMarketsList.tsx # Markets display component
    │   └── ... (other market components)
    └── ... (other components)
```

## Quick Start

### 1. Import the Hook in Your Component

```typescript
import { useFlowUpdate } from "@/hooks/useFlowUpdate";

export function MyMarketComponent() {
  const {
    activeMarkets,
    loading,
    placeBet,
    fetchActiveMarkets,
  } = useFlowUpdate({ autoFetch: true });

  return (
    // Your JSX here
  );
}
```

### 2. Display Markets

```typescript
import { MultiOptionMarketsList } from "@/components/market/MultiOptionMarketsList";

export function MarketsPage() {
  return (
    <MultiOptionMarketsList
      onBetClick={(market) => {
        // Handle bet click
      }}
    />
  );
}
```

### 3. Place a Bet

```typescript
import { MultiOptionBetForm } from "@/components/market/MultiOptionBetForm";

export function BettingPage({ market }) {
  return (
    <MultiOptionBetForm
      market={market}
      onBetPlaced={(marketId, optionIndex, amount) => {
        console.log(`Bet placed: ${amount} FLOW on option ${optionIndex}`);
      }}
    />
  );
}
```

## Hook API Reference

### `useFlowUpdate(options?)`

Main hook for all FlowUpdate operations.

#### Options

```typescript
{
  autoFetch?: boolean;        // Auto-fetch markets on mount (default: true)
  refreshInterval?: number;   // Refresh interval in ms (default: 30000)
}
```

#### Return Values

**Markets:**
- `activeMarkets: MultiOptionMarket[]` - All active markets
- `userMarkets: MultiOptionMarket[]` - Markets created by user
- `selectedMarket: MultiOptionMarket | null` - Currently selected market
- `markets: MultiOptionMarket[]` - Combined market list

**User Data:**
- `userPositions: UserBetPosition[]` - User's current positions
- `claimableWinnings: ClaimableWinning[]` - Claimable winnings
- `totalClaimable: string` - Sum of all claimable amounts

**Contract Data:**
- `stats: ContractStats | null` - Overall contract statistics

**State:**
- `loading: boolean` - Data is being fetched
- `error: string | null` - Current error message
- `transactionInProgress: boolean` - Transaction is pending

#### Transaction Methods

All return the transaction ID on success and throw on error.

**Create Market:**
```typescript
const txId = await createMarket({
  title: "Will Bitcoin hit $50k?",
  description: "Bitcoin price prediction",
  category: 5,  // Crypto
  options: ["Yes", "No"],
  endTime: Math.floor(Date.now() / 1000) + 86400 * 7,
  minBet: "1.0",
  maxBet: "100.0",
  imageUrl: "https://...",
  creationFeeAmount: "1.0",
});
```

**Place Single Bet:**
```typescript
const txId = await placeBet({
  marketId: "123",
  optionIndex: 0,
  amount: "10.5",
});
```

**Place Batch Bets:**
```typescript
const txId = await placeBatchBets({
  bets: [
    { marketId: "123", optionIndex: 0, amount: "10.0" },
    { marketId: "124", optionIndex: 1, amount: "5.0" },
  ],
});
```

**Resolve Market (Admin):**
```typescript
const txId = await resolveMarket("123", 0);  // Market ID, winning option index
```

**Claim Winnings:**
```typescript
const txId = await claimWinnings("123");  // Market ID
```

**Submit Evidence:**
```typescript
const txId = await submitEvidence("123", "Evidence text");
```

#### Query Methods

All return data on success, null/error message on failure.

**Fetch Single Market:**
```typescript
const market = await fetchMarket("123");
```

**Fetch All Active Markets:**
```typescript
await fetchActiveMarkets();
// Then use: activeMarkets state
```

**Fetch User's Markets:**
```typescript
await fetchUserMarkets("0x1234567890abcdef");
// Then use: userMarkets state
```

**Fetch User Positions:**
```typescript
await fetchUserPositions("0x1234567890abcdef");
// Then use: userPositions state
```

**Fetch Claimable Winnings:**
```typescript
await fetchClaimableWinnings("0x1234567890abcdef");
// Then use: claimableWinnings state
```

**Fetch Contract Stats:**
```typescript
await fetchContractStats();
// Then use: stats state
```

**Calculate Potential Winnings:**
```typescript
const winnings = await calculateWinnings("123", 0, "10.0");
// Returns: "15.5" (estimated winnings)
```

**Check Market Resolution:**
```typescript
const isResolved = await isMarketResolved("123");
```

**Fetch Market Evidence:**
```typescript
const evidence = await fetchMarketEvidence("123");
```

#### Utility Methods

```typescript
selectMarket(market);        // Set selected market
refetch();                   // Refresh all data
clearError();                // Clear error state
```

## Component API Reference

### `MultiOptionMarketsList`

Displays a grid of multi-option markets with filtering and sorting.

```typescript
<MultiOptionMarketsList
  markets={customMarkets}              // Override markets (optional)
  onMarketSelect={(market) => {}}      // Callback when market clicked
  onBetClick={(market) => {}}          // Callback for bet button
  isLoading={false}                    // Loading state (optional)
  title="Available Markets"            // Component title
  showFilters={true}                   // Show search/filter controls
  emptyMessage="No markets found"      // Empty state message
/>
```

**Features:**
- Search by title, description, or options
- Filter by category
- Sort by newest, ending soon, or volume
- Responsive grid layout (1-3 columns)
- Time remaining countdown
- Pool and bet limits display
- Market status badges

### `MultiOptionBetForm`

Form for placing bets on a single market.

```typescript
<MultiOptionBetForm
  market={market}                      // Market object (required)
  onBetPlaced={(id, idx, amt) => {}}  // Callback after bet placed
  onClose={() => {}}                   // Callback for cancel/close
/>
```

**Features:**
- Option selection with visual feedback
- Amount input with min/max validation
- Real-time potential winnings calculation
- Market status checking
- Wallet connection verification
- Loading and error states
- Transaction progress indicator

## Integration Patterns

### Pattern 1: Markets List Page

```typescript
"use client";

import { MultiOptionMarketsList } from "@/components/market/MultiOptionMarketsList";
import { MultiOptionBetForm } from "@/components/market/MultiOptionBetForm";
import { useState } from "react";
import { MultiOptionMarket } from "@/types/flowupdate";

export default function MarketsPage() {
  const [selectedMarket, setSelectedMarket] = useState<MultiOptionMarket | null>(null);

  if (selectedMarket) {
    return (
      <MultiOptionBetForm
        market={selectedMarket}
        onBetPlaced={() => setSelectedMarket(null)}
        onClose={() => setSelectedMarket(null)}
      />
    );
  }

  return (
    <MultiOptionMarketsList
      title="Multi-Option Markets"
      onBetClick={setSelectedMarket}
    />
  );
}
```

### Pattern 2: User Dashboard

```typescript
"use client";

import { useFlowUpdate } from "@/hooks/useFlowUpdate";
import { useEffect, useState } from "react";
import * as fcl from "@onflow/fcl";

export default function Dashboard() {
  const [userAddr, setUserAddr] = useState<string>("");
  const { userPositions, claimableWinnings, loading } = useFlowUpdate();

  useEffect(() => {
    fcl.currentUser().then((user) => {
      if (user.addr) setUserAddr(user.addr);
    });
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h2>Your Positions</h2>
        {userPositions.map((pos) => (
          <div key={pos.marketId}>
            <h3>{pos.marketTitle}</h3>
            <p>Invested: {pos.totalInvested} FLOW</p>
            <p>Current Value: {pos.currentValue} FLOW</p>
            <p>P&L: {pos.profitLoss} FLOW</p>
          </div>
        ))}
      </section>

      <section>
        <h2>Claimable Winnings</h2>
        <p className="text-lg font-bold">
          Total: {claimableWinnings.reduce((sum, w) => 
            parseFloat(sum) + parseFloat(w.amount), 0
          ).toFixed(2)} FLOW
        </p>
      </section>
    </div>
  );
}
```

### Pattern 3: Create Market Form

The existing `create-market-form.tsx` already supports multi-option markets:

```typescript
import {
  createMarketTransaction,
  getFlowWagerAddress,
} from "@/lib/flow-wager-scripts";

// In your component:
const transactionScript = createMarketTransaction();
const txId = await fcl.mutate({
  cadence: transactionScript,
  args: (arg, t) => [
    arg(title, t.String),
    arg(description, t.String),
    arg(category, t.UInt8),
    arg(["Yes", "No", "Maybe"], t.Array(t.String)),  // Multi-option!
    arg(endTime, t.UFix64),
    arg(minBet, t.UFix64),
    arg(maxBet, t.UFix64),
    arg(imageUrl, t.String),
    arg(creationFeeAmount, t.Optional(t.UFix64)),
  ],
  // ... rest of mutation
});
```

### Pattern 4: Admin Market Resolution

```typescript
"use client";

import { useFlowUpdate } from "@/hooks/useFlowUpdate";
import { MultiOptionMarket } from "@/types/flowupdate";
import { useState } from "react";

interface AdminResolveProps {
  market: MultiOptionMarket;
}

export function AdminResolveMarket({ market }: AdminResolveProps) {
  const { resolveMarket, loading } = useFlowUpdate({ autoFetch: false });
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleResolve = async () => {
    if (selectedOption === null) return;
    await resolveMarket(market.id, selectedOption);
  };

  return (
    <div>
      <h3>Resolve: {market.title}</h3>
      <div>
        {market.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedOption(idx)}
            className={selectedOption === idx ? "selected" : ""}
          >
            {opt}
          </button>
        ))}
      </div>
      <button onClick={handleResolve} disabled={loading}>
        Resolve
      </button>
    </div>
  );
}
```

## Type Definitions

### Key Types

```typescript
// Market
interface MultiOptionMarket {
  id: string;
  title: string;
  description: string;
  category: MultiMarketCategory;
  options: string[];              // Array of option names
  creator: string;
  createdAt: number;
  endTime: number;
  minBet: string;
  maxBet: string;
  imageUrl: string;
  status: MarketStatus;
  resolved: boolean;
  winningOptionIndex?: number;
  totalPool: string;
  optionPoolShares: string[];     // Pool shares per option
  platformFeePercentage: string;
}

// User Position
interface UserBetPosition {
  marketId: string;
  marketTitle: string;
  options: string[];
  shares: string[];               // Shares per option
  totalInvested: string;
  currentValue: string;
  profitLoss: string;
  status: MarketStatus;
  resolved: boolean;
  winningOptionIndex?: number;
  claimableAmount?: string;
}

// Enums
enum MarketStatus {
  Active = 0,
  PendingResolution = 1,
  Resolved = 2,
  Cancelled = 3,
}

enum MultiMarketCategory {
  Sports = 0,
  Entertainment = 1,
  Technology = 2,
  Economics = 3,
  Weather = 4,
  Crypto = 5,
  Politics = 6,
  BreakingNews = 7,
  Other = 8,
}
```

## Error Handling

All async operations include error handling via the hook:

```typescript
const { error, clearError } = useFlowUpdate();

useEffect(() => {
  if (error) {
    console.error("Operation failed:", error);
    // Show error to user
    // clearError(); // Clear after showing
  }
}, [error, clearError]);
```

## Testing Checklist

- [ ] Markets load and display correctly
- [ ] Filtering and sorting work as expected
- [ ] Betting form validates input correctly
- [ ] Bet placement transactions succeed
- [ ] Claimable winnings display accurately
- [ ] User positions show correct calculations
- [ ] Market resolution works (admin)
- [ ] Evidence submission works (admin)
- [ ] Responsive design works on mobile
- [ ] Error messages display properly
- [ ] Loading states show during transactions

## Environment Variables

Ensure these are set in your `.env.local`:

```
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOWUPDATE_ADDRESS=0x24225e374dfffb2b
NEXT_PUBLIC_FLOW_TESTNET_TOKEN=0x7e60df042a9c0868
NEXT_PUBLIC_FLOW_FUNGIBLE_TESTNET_TOKEN=0x9a0766d93b6608b7
```

## Troubleshooting

### "User not authenticated"
- Ensure `@onflow/fcl` is configured with your Flow testnet/mainnet
- Check that user has connected their wallet

### "Invalid market category"
- Verify category is between 0-8 (see `MultiMarketCategory` enum)

### "Minimum bet is X FLOW"
- Check that bet amount is >= market.minBet

### "Failed to calculate winnings"
- Ensure market exists and has valid pool data
- Check that option index is valid (0 to options.length-1)

### Market list not updating
- Check `autoFetch` is true in hook options
- Manually call `refetch()` after transactions
- Verify `refreshInterval` is set appropriately

## Next Steps

1. **Test on testnet**: Use the components in a test environment
2. **Customize styling**: Modify components to match your theme
3. **Add analytics**: Track betting patterns and market performance
4. **Optimize queries**: Add pagination for large market lists
5. **Implement caching**: Cache market data to reduce query load
6. **Add notifications**: Show real-time updates for market events

## Resources

- [FlowUpdate Integration Guide](./FLOWUPDATE_INTEGRATION_GUIDE.md)
- [FlowUpdate Contract Patterns](./FLOWUPDATE_PATTERNS.md)
- [Flow Documentation](https://docs.onflow.org)
- [FCL Documentation](https://developers.flow.com/tools/fcl-js)