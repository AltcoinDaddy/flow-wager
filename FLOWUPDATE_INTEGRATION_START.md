# 🚀 FlowUpdate Integration - Get Started Now

## What You Have

✅ **Market Creation Form** - Already integrated with multiple-options support
✅ **FlowUpdate Contract** - Deployed and ready on testnet
✅ **6 Transactions** - Setup, Create, Bet, Batch Bet, Resolve, Pause
✅ **5 Query Scripts** - Get market, active markets, positions, winnings, stats

## What You Need To Do (3 Steps)

### Step 1: Create Scripts Manager (30 min)
**File**: `src/lib/flowupdate-scripts.ts`

Follow the template in `FLOWUPDATE_INTEGRATION_GUIDE.md` → "Step 1: Create FlowUpdate Scripts Manager"

This file exports all transaction and script functions.

### Step 2: Define Types (15 min)
**File**: `src/types/flowupdate.ts`

Follow the template in `FLOWUPDATE_INTEGRATION_GUIDE.md` → "Step 2: Create TypeScript Types"

Defines all data structures returned from the contract.

### Step 3: Create Custom Hook (30 min)
**File**: `src/hooks/useFlowUpdate.ts`

Follow the template in `FLOWUPDATE_INTEGRATION_GUIDE.md` → "Step 3: Create Custom Hooks"

This hook manages all FlowUpdate interactions.

---

## Integration Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create flowupdate-scripts.ts
- [ ] Create flowupdate types
- [ ] Create useFlowUpdate hook
- [ ] Test scripts locally

### Phase 2: Components (Week 2)
- [ ] Create BetForm component
- [ ] Create MarketsList component
- [ ] Create UserPositions component
- [ ] Create MarketDetail page

### Phase 3: Features (Week 3)
- [ ] Implement batch betting
- [ ] Add market resolution (admin)
- [ ] Create stats dashboard
- [ ] Add event listeners

### Phase 4: Polish (Week 4)
- [ ] Error handling
- [ ] Loading states
- [ ] Form validation
- [ ] Mobile responsive
- [ ] Deploy to production

---

## Quick Reference

### Available Transactions
1. **setupFlowUpdateAccount** - Initialize user
2. **createMultiOptionMarket** - Create market (DONE ✓)
3. **placeBet** - Bet on option
4. **placeBatchBets** - Multiple bets
5. **resolveMarket** - Resolve market (admin)
6. **pauseContract** - Pause contract (admin)

### Available Scripts
1. **getMarket** - Get market details
2. **getActiveMarkets** - Get all active markets
3. **getUserPositions** - Get user's positions
4. **calculateWinnings** - Calculate potential winnings
5. **getContractStats** - Get contract statistics

---

## Code Examples

### Example 1: Fetch Markets
```typescript
import { useFlowUpdate } from '@/hooks/useFlowUpdate';

function MyComponent() {
  const { markets, fetchActiveMarkets } = useFlowUpdate();

  useEffect(() => {
    fetchActiveMarkets();
  }, []);

  return markets.map(m => <div key={m.id}>{m.title}</div>);
}
```

### Example 2: Place Bet
```typescript
import { useFlowUpdate } from '@/hooks/useFlowUpdate';

function BetComponent({ marketId }) {
  const { placeBet, loading } = useFlowUpdate();

  const handleBet = async () => {
    await placeBet(marketId, 0, '10'); // Bet 10 FLOW on option 0
  };

  return <button onClick={handleBet} disabled={loading}>Place Bet</button>;
}
```

### Example 3: User Positions
```typescript
import { useFlowUpdate } from '@/hooks/useFlowUpdate';
import { useAuth } from '@/hooks/useAuth';

function PositionsComponent() {
  const { user } = useAuth();
  const { positions, fetchUserPositions } = useFlowUpdate(user?.addr);

  useEffect(() => {
    if (user?.addr) {
      fetchUserPositions(user.addr);
    }
  }, [user?.addr]);

  return Object.entries(positions).map(([marketId, pos]) => (
    <div key={marketId}>
      Market {marketId}: {pos.totalInvested} FLOW invested
    </div>
  ));
}
```

---

## Documentation Files

### Must Read
1. **FLOWUPDATE_INTEGRATION_GUIDE.md** - Complete integration guide
2. **FLOWUPDATE_PATTERNS.md** - 7 implementation patterns

### Reference
3. **FLOWUPDATE_INTEGRATION_START.md** - This file (quick start)

### Contract
4. **FlowUpdate.cdc** - Contract source code
5. **flowupdate_create_market.cdc** - Market creation transaction

---

## Environment Variables

Add to `.env.local`:

```
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOWUPDATE_ADDRESS=0x24225e374dfffb2b
NEXT_PUBLIC_FLOW_TESTNET_TOKEN=0x7e60df042a9c0868
NEXT_PUBLIC_FLOW_FUNGIBLE_TESTNET_TOKEN=0x9a0766d93b6608b7
```

---

## Testing Checklist

### Local Testing
- [ ] Fetch markets script works
- [ ] Place bet transaction works
- [ ] Fetch user positions works
- [ ] Get market details works
- [ ] All error cases handled

### Integration Testing
- [ ] Create market → Place bet flow
- [ ] Multiple markets display correctly
- [ ] User positions update after bet
- [ ] Market resolution works
- [ ] Batch betting works

### Production Testing (Testnet)
- [ ] Create market with real FLOW
- [ ] Place bets with real FLOW
- [ ] Resolve market
- [ ] Claim winnings
- [ ] All notifications working

---

## Common Issues & Solutions

### Issue: "Could not borrow vault"
**Solution**: User needs to setup account first
```typescript
await setupFlowUpdateAccount(); // Call in onboarding
```

### Issue: "Market not found"
**Solution**: Market ID might be invalid
```typescript
const market = await getMarket(marketId);
if (!market) {
  toast.error('Market not found');
}
```

### Issue: "Insufficient funds"
**Solution**: User balance too low
```typescript
const balance = await getFlowBalance(userAddress);
if (balance < betAmount) {
  toast.error('Insufficient FLOW balance');
}
```

### Issue: Transaction times out
**Solution**: Increase gas limit
```typescript
limit: 5000, // Increased from 1000
```

---

## Next Steps

### Immediately
1. Create flowupdate-scripts.ts
2. Define types
3. Create useFlowUpdate hook
4. Test with console

### This Week
5. Create BetForm component
6. Create MarketsList component
7. Integrate into existing pages
8. Test on testnet

### Next Week
9. Add batch betting
10. Add admin functions
11. Add statistics dashboard
12. Deploy to production

---

## File Structure

```
src/
├── lib/
│   └── flowupdate-scripts.ts        ← Create first
├── types/
│   └── flowupdate.ts                ← Create second
├── hooks/
│   └── useFlowUpdate.ts             ← Create third
├── components/
│   ├── BetForm.tsx
│   ├── MarketsList.tsx
│   └── UserPositions.tsx
└── pages/
    └── markets/
        ├── index.tsx                ← Markets list
        └── [id].tsx                 ← Market detail
```

---

## Getting Help

### Documentation
- **Full Integration**: FLOWUPDATE_INTEGRATION_GUIDE.md
- **Code Examples**: FLOWUPDATE_PATTERNS.md (7 patterns)
- **Contract**: flow-wager/cadence/contracts/FlowUpdate.cdc

### Issues
- Check console for error messages
- Verify environment variables set
- Ensure contract is deployed
- Check testnet FLOW balance

---

## Success Metrics

✅ Markets display in UI
✅ Users can place bets
✅ Positions update after bet
✅ Admin can resolve markets
✅ Winnings can be claimed
✅ No console errors
✅ Smooth user experience

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Setup | 1-2 hrs | Scripts, types, hooks |
| Build | 1 day | Components, integration |
| Test | 1 day | Local + testnet testing |
| Deploy | A few hours | Mainnet ready |

---

## Support Resources

- Flow Docs: https://docs.onflow.org
- FCL Docs: https://github.com/onflow/flow-js-sdk
- Cadence: https://cadence-lang.org
- FlowUpdate Contract: ./cadence/contracts/FlowUpdate.cdc

---

**Ready to start?**

1. Open: `FLOWUPDATE_INTEGRATION_GUIDE.md`
2. Follow: Step 1 → Step 2 → Step 3
3. Test: Follow integration checklist
4. Deploy: Follow deployment steps

**Time to implement**: 3-4 hours for basic integration, 1-2 days for full featured platform

Let's go! 🚀
