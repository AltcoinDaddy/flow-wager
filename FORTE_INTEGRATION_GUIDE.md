# 🚀 Forte Integration Guide for Flow Wager

This guide shows you how to integrate Forte automation features into your existing betting interfaces. The integration provides automated conditional betting, scheduled transactions, and advanced risk management while maintaining backward compatibility.

## 🎯 What's Been Integrated

### ✅ Enhanced Betting Dialog
Your existing `BetDialog` has been enhanced with:
- **Immediate Betting** - Original functionality preserved
- **Conditional Betting** - Automated bets with conditions
- **Scheduled Betting** - Time-based execution (coming soon)
- **Advanced Settings** - Risk management, auto-rebet, slippage protection

### ✅ New Components Added
- `MarketActions` - Streamlined betting interface with automation options
- `ScheduledTransactionsPanel` - Manage all automated actions
- `useForteActions` - React hook for all Forte functionality
- Forte contract integration with testnet/mainnet support

---

## 🔧 Integration Methods

### Method 1: Use Enhanced BetDialog (Recommended)

Your existing `BetDialog` has been automatically upgraded. No code changes needed!

```typescript
import { BetDialog } from '@/components/market/bet-dialog';

// Works exactly the same as before
<BetDialog
  open={showBetDialog}
  onOpenChange={setShowBetDialog}
  market={market}
  initialSide="optionA"
  onBetSuccess={() => refreshMarketData()}
/>
```

**New Features Available:**
- Users can switch between Immediate, Conditional, and Scheduled betting tabs
- Forte Actions are automatically initialized when user connects
- Full automation settings with advanced conditions

### Method 2: Use MarketActions Component

Replace your betting buttons with the new streamlined component:

```typescript
import { MarketActions } from '@/components/market/market-actions';

// Replace your betting section with:
<MarketActions
  market={market}
  onBetSuccess={() => refreshMarketData()}
  className="mt-6"
/>
```

**Benefits:**
- Combines regular and automated betting options
- Shows automation status and scheduled bets
- Dropdown menus for advanced options
- Better UX with clear action separation

### Method 3: Add Forte Hook to Existing Components

Add automation features to any component:

```typescript
import { useForteActions } from '@/hooks/useForteActions';

function YourMarketComponent() {
  const { 
    isInitialized, 
    createConditionalBet, 
    scheduledTransactions 
  } = useForteActions();

  const handleAutomatedBet = async () => {
    const result = await createConditionalBet({
      marketId: market.id,
      amount: "10.0",
      prediction: true,
      conditions: {
        minOdds: 1.5,
        maxOdds: 3.0,
        timeWindow: {
          start: Date.now() + 3600000,
          end: Date.now() + 7200000
        }
      }
    });

    if (result.success) {
      toast.success("Automated bet created!");
    }
  };

  return (
    <div>
      {/* Your existing UI */}
      
      {isInitialized && (
        <Button onClick={handleAutomatedBet}>
          <Bot className="h-4 w-4 mr-2" />
          Create Automated Bet
        </Button>
      )}
    </div>
  );
}
```

---

## 🎨 UI Integration Examples

### Adding Automation Toggle to Existing Bet Buttons

```typescript
// Before
<Button onClick={() => placeBet()}>
  Place Bet
</Button>

// After - Enhanced
<div className="flex gap-2">
  <Button onClick={() => placeBet()} className="flex-1">
    <Zap className="h-4 w-4 mr-2" />
    Bet Now
  </Button>
  
  {forteInitialized && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Bot className="h-4 w-4 mr-2" />
          Automate
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => openConditionalBetDialog()}>
          Conditional Bet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openScheduledBetDialog()}>
          Scheduled Bet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )}
</div>
```

### Adding Automation Status Badge

```typescript
import { useForteActions } from '@/hooks/useForteActions';

function MarketHeader({ market }) {
  const { scheduledTransactions } = useForteActions();
  
  const userScheduledBets = scheduledTransactions.filter(
    tx => tx.action.marketId === market.id && tx.status === 'PENDING'
  );

  return (
    <div className="flex items-center justify-between">
      <h1>{market.title}</h1>
      
      {userScheduledBets.length > 0 && (
        <Badge variant="secondary">
          <Timer className="h-3 w-3 mr-1" />
          {userScheduledBets.length} Scheduled
        </Badge>
      )}
    </div>
  );
}
```

### Adding Automation Panel to Dashboard

```typescript
import { ScheduledTransactionsPanel } from '@/components/forte/ScheduledTransactionsPanel';

function UserDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Existing dashboard content */}
      
      {/* Add automation panel */}
      <ScheduledTransactionsPanel className="lg:col-span-full" />
    </div>
  );
}
```

---

## 🔐 Required Environment Variables

Add these to your `.env.local` (optional - defaults provided):

```bash
# Forte Testnet Addresses (optional - defaults included)
NEXT_PUBLIC_FORTE_DEFI_ACTIONS_TESTNET=0x4c2ff9dd03ab442f
NEXT_PUBLIC_FORTE_ORACLE_CONNECTORS_TESTNET=0x1a9f5d18d096cd7a

# Forte Mainnet Addresses (optional - defaults included)
NEXT_PUBLIC_FORTE_DEFI_ACTIONS_MAINNET=0x92195d814edf9cb0
NEXT_PUBLIC_FORTE_ORACLE_CONNECTORS_MAINNET=0xf627b5c89141ed99
```

---

## 🚀 Features Overview

### ⚡ Immediate Betting (Original)
- Instant bet placement at current market prices
- All existing functionality preserved
- Account creation flow maintained

### 🤖 Conditional Betting (New)
- **Odds Conditions**: Set min/max odds thresholds
- **Time Windows**: Specify when bets can be placed
- **Risk Management**: Slippage protection and stop-loss
- **Auto-Rebet**: Retry failed transactions automatically
- **Advanced Settings**: Fine-tune execution parameters

### ⏰ Scheduled Betting (Coming Soon)
- Time-based bet execution
- Recurring bet patterns  
- Oracle-triggered resolution

### 🛡️ Risk Management Features
- **Slippage Protection**: Maximum acceptable price movement
- **Stop-Loss**: Automatic exit at loss threshold
- **Position Sizing**: Automated bet amount calculation
- **Retry Logic**: Smart transaction retry on failure

---

## 📱 User Experience Flow

### First-Time Setup
1. User connects wallet (existing flow)
2. Forte Actions auto-initialize on first automation attempt
3. One-time setup creates necessary resources
4. User can immediately access all automation features

### Regular Usage
1. **Quick Betting**: Use immediate tab (original experience)
2. **Automated Betting**: Switch to conditional tab
3. **Set Conditions**: Configure odds, timing, risk parameters
4. **Monitor**: View scheduled actions in automation panel
5. **Manage**: Cancel or modify scheduled bets

### Advanced Users
1. **Bulk Actions**: Create multiple conditional bets
2. **Strategy Templates**: Save common betting patterns
3. **Analytics**: Track automation performance
4. **Integration**: Connect with external signals/oracles

---

## 🔍 Key Components Reference

### BetDialog (Enhanced)
```typescript
interface BetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: Market;
  initialSide?: "optionA" | "optionB";
  onBetSuccess?: () => void;
}
```

### MarketActions
```typescript
interface MarketActionsProps {
  market: Market;
  onBetSuccess?: () => void;
  className?: string;
}
```

### useForteActions Hook
```typescript
const {
  // State
  isInitialized,
  isLoading,
  scheduledTransactions,
  error,
  
  // Actions  
  initialize,
  createConditionalBet,
  scheduleMarketResolution,
  setupAutomatedPayout,
  cancelAction,
  
  // Utilities
  createAdvancedBetConditions
} = useForteActions();
```

---

## 🎯 Migration Checklist

### ✅ Immediate (No Code Changes)
- [x] Enhanced BetDialog is automatically active
- [x] Users can access automation features
- [x] Backward compatibility maintained

### 📝 Recommended Updates
- [ ] Replace betting sections with `MarketActions` component
- [ ] Add automation status indicators to market headers
- [ ] Include `ScheduledTransactionsPanel` in user dashboards
- [ ] Add Forte features to navigation menu
- [ ] Update help/tutorial content

### 🔧 Optional Enhancements
- [ ] Custom automation presets for your app
- [ ] Integration with your analytics system
- [ ] Custom notification system for automation events
- [ ] Advanced market maker integration
- [ ] Bulk betting interfaces for power users

---

## 🌟 Next Steps

1. **Test the Integration**: Try the enhanced betting dialog on testnet
2. **User Onboarding**: Update tutorials to show automation features  
3. **Marketing**: Highlight advanced automation in your app
4. **Analytics**: Track adoption of automation features
5. **Feedback**: Gather user feedback on automation UX

## 💡 Pro Tips

- **Gradual Rollout**: Start with conditional betting, add scheduling later
- **Education**: Create tutorials showing automation benefits
- **Defaults**: Set sensible default conditions for new users
- **Performance**: Monitor gas costs and optimize transaction batching
- **Support**: Prepare customer support for automation questions

---

## 🆘 Troubleshooting

### Forte Not Initializing
```typescript
// Check if user is connected first
if (!user) {
  toast.error("Please connect your wallet first");
  return;
}

// Manual initialization
const result = await initialize();
if (!result.success) {
  console.error("Forte initialization failed:", result.error);
}
```

### Conditional Bets Not Executing
- Verify conditions are met (odds, time windows)
- Check user has sufficient balance
- Ensure market is still active
- Review transaction gas limits

### UI Components Missing
- Verify all required UI components are installed
- Check imports are correct
- Ensure Tailwind classes are available

---

**🎉 Integration Complete!** Your users now have access to powerful automation features while maintaining the familiar betting experience they know and love.