# FlowUpdate Multi-Option UI - Quick Start

## Files Created
- ✅ `src/types/flowupdate.ts` - Type definitions (167 lines)
- ✅ `src/lib/flowupdate-scripts.ts` - Transaction & query scripts (417 lines)
- ✅ `src/hooks/useFlowUpdate.ts` - React hook (594 lines)
- ✅ `src/components/market/MultiOptionBetForm.tsx` - Betting UI (302 lines)
- ✅ `src/components/market/MultiOptionMarketsList.tsx` - Market list (323 lines)

**Total: 1,803 lines of new code**

---

## The Quickest Integration

### Step 1: Import Hook
```typescript
import { useFlowUpdate } from "@/hooks/useFlowUpdate";
```

### Step 2: Use it
```typescript
const { activeMarkets, placeBet } = useFlowUpdate();
```

### Step 3: Render Component
```typescript
<MultiOptionMarketsList onBetClick={(m) => placeBet(m)} />
```

**That's it!** 🚀

---

## API At a Glance

```typescript
// Transactions
createMarket(args: CreateMultiOptionMarketArgs) => Promise<string>
placeBet(args: PlaceBetArgs) => Promise<string>
placeBatchBets(args: BatchBetArgs) => Promise<string>
resolveMarket(marketId: string, winningIndex: number) => Promise<string>
claimWinnings(marketId: string) => Promise<string>
submitEvidence(marketId: string, evidence: string) => Promise<string>

// Queries
fetchMarket(marketId: string) => Promise<MultiOptionMarket | null>
fetchActiveMarkets() => Promise<void>
fetchUserMarkets(creator: string) => Promise<void>
fetchUserPositions(address: string) => Promise<void>
fetchClaimableWinnings(address: string) => Promise<void>
fetchContractStats() => Promise<void>
calculateWinnings(marketId, optionIndex, shares) => Promise<string>
isMarketResolved(marketId: string) => Promise<boolean>

// State
activeMarkets: MultiOptionMarket[]
userPositions: UserBetPosition[]
claimableWinnings: ClaimableWinning[]
totalClaimable: string
stats: ContractStats | null
loading: boolean
error: string | null
transactionInProgress: boolean

// Utilities
selectMarket(market: MultiOptionMarket | null) => void
refetch() => Promise<void>
clearError() => void
```

---

## Common Patterns

### Display Markets
```typescript
<MultiOptionMarketsList />
```

### Betting Form
```typescript
<MultiOptionBetForm 
  market={market}
  onBetPlaced={handleSuccess}
/>
```

### User Dashboard
```typescript
const { userPositions, claimableWinnings } = useFlowUpdate();
return (
  <div>
    <h2>Positions: {userPositions.length}</h2>
    <h2>Claimable: {totalClaimable} FLOW</h2>
  </div>
);
```

### Auto-refresh
```typescript
const { activeMarkets } = useFlowUpdate({
  autoFetch: true,
  refreshInterval: 30000, // 30 seconds
});
```

---

## Key Features

✅ **Type Safe** - Full TypeScript support  
✅ **Error Handling** - Toast notifications  
✅ **Auto-Refresh** - Configurable intervals  
✅ **Responsive** - Mobile-friendly UI  
✅ **Dark Mode** - Included  
✅ **Validations** - Built-in form validation  
✅ **Real-time Calcs** - Potential winnings  

---

## Build Status
✅ **Builds successfully with no errors**

## Circular Dependency
✅ **Resolved** - All imports are clean

## Next: Get Started!
1. Import components into your pages
2. Test on Flow testnet
3. Deploy when ready

---

For full documentation, see `FLOWUPDATE_UI_INTEGRATION.md`
