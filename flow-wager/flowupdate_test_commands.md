# FlowUpdate Contract Testing Guide

This guide provides comprehensive testing commands for the FlowUpdate multi-option betting contract deployed at `0x24225e374dfffb2b`.

## Contract Addresses
- **FlowUpdate**: `0x24225e374dfffb2b` 
- **FlowToken**: `0x7e60df042a9c0868`
- **Network**: Flow Testnet

## Prerequisites

1. Ensure you have Flow CLI installed and updated
2. Make sure your account is set up with FlowUpdate resources
3. Have some FLOW tokens for testing bets

## Setup Commands

### 1. Set up your account for FlowUpdate
```bash
flow transactions send ./cadence/transactions/flowupdate_setup_account.cdc --network testnet --signer testnet4-account
```

## Query Scripts (Read-only operations)

### 1. Get Contract Statistics
```bash
flow scripts execute ./cadence/scripts/flowupdate_get_contract_stats.cdc --network testnet
```

### 2. Get All Active Markets
```bash
flow scripts execute ./cadence/scripts/flowupdate_get_active_markets.cdc --network testnet
```

### 3. Get Specific Market by ID
```bash
# Replace 1 with actual market ID
flow scripts execute ./cadence/scripts/flowupdate_get_market.cdc --network testnet --arg UInt64:1
```

### 4. Get User Positions
```bash
# Replace with actual user address
flow scripts execute ./cadence/scripts/flowupdate_get_user_positions.cdc --network testnet --arg Address:0x24225e374dfffb2b
```

### 5. Calculate Potential Winnings
```bash
# Parameters: marketId, userAddress, winningOption
flow scripts execute ./cadence/scripts/flowupdate_calculate_winnings.cdc --network testnet --arg UInt64:1 --arg Address:0x24225e374dfffb2b --arg UInt8:0
```

### 6. Run Comprehensive Test
```bash
flow scripts execute ./cadence/scripts/flowupdate_test_complete_flow.cdc --network testnet
```

## Market Creation

### 1. Create a Sports Market (Football Match)
```bash
flow transactions send ./cadence/transactions/flowupdate_create_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg String:"Champions League Final Winner" \
  --arg String:"Who will win the Champions League Final 2024?" \
  --arg UInt8:0 \
  --arg '[String]':["Real Madrid","Manchester City","Bayern Munich","Barcelona"] \
  --arg UFix64:1800000000 \
  --arg UFix64:1.0 \
  --arg UFix64:100.0 \
  --arg String:"https://example.com/champions-league.jpg" \
  --arg "UFix64?":null
```

### 2. Create a Crypto Market
```bash
flow transactions send ./cadence/transactions/flowupdate_create_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg String:"Bitcoin Price Prediction" \
  --arg String:"What will Bitcoin price be at end of year?" \
  --arg UInt8:3 \
  --arg '[String]':["Below 40k","40k-60k","60k-80k","80k-100k","Above 100k"] \
  --arg UFix64:1800000000 \
  --arg UFix64:5.0 \
  --arg UFix64:500.0 \
  --arg String:"https://example.com/bitcoin.jpg" \
  --arg "UFix64?":null
```

### 3. Create an Entertainment Market
```bash
flow transactions send ./cadence/transactions/flowupdate_create_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg String:"Oscar Best Picture 2025" \
  --arg String:"Which movie will win Best Picture at the 2025 Oscars?" \
  --arg UInt8:2 \
  --arg '[String]':["Dune: Part Three","Avatar 3","Marvel Movie","Scorsese Film","Nolan Film","Indie Surprise"] \
  --arg UFix64:1800000000 \
  --arg UFix64:2.0 \
  --arg UFix64:200.0 \
  --arg String:"https://example.com/oscars.jpg" \
  --arg "UFix64?":null
```

## Placing Bets

### 1. Place a Single Bet
```bash
# Bet 10 FLOW on option 0 of market 1
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:0 \
  --arg UFix64:10.0
```

### 2. Place Multiple Single Bets (Different Options)
```bash
# Bet on Real Madrid (option 0)
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:0 \
  --arg UFix64:15.0

# Bet on Manchester City (option 1) 
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:1 \
  --arg UFix64:10.0

# Bet on Bayern Munich (option 2)
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:2 \
  --arg UFix64:5.0
```

### 3. Place Batch Bets (Multiple options in one transaction)
```bash
# Hedge bets across multiple options
flow transactions send ./cadence/transactions/flowupdate_place_batch_bets.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg '[UInt8]':[0,1,2] \
  --arg '[UFix64]':[20.0,15.0,10.0]
```

### 4. Advanced Batch Betting Strategy
```bash
# Spread bets across all options for Bitcoin price prediction (market 2)
flow transactions send ./cadence/transactions/flowupdate_place_batch_bets.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:2 \
  --arg '[UInt8]':[0,1,2,3,4] \
  --arg '[UFix64]':[5.0,20.0,30.0,25.0,10.0]
```

## Admin Operations

### 1. Resolve a Market
```bash
# Resolve Champions League market - Real Madrid wins (option 0)
flow transactions send ./cadence/transactions/flowupdate_admin_resolve_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:0 \
  --arg String:"Real Madrid won the Champions League Final 3-1"
```

### 2. Pause the Contract
```bash
flow transactions send ./cadence/transactions/flowupdate_admin_pause_contract.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg Bool:true
```

### 3. Unpause the Contract
```bash
flow transactions send ./cadence/transactions/flowupdate_admin_pause_contract.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg Bool:false
```

## Test Scenarios

### Scenario 1: Complete Market Lifecycle
```bash
# 1. Check initial stats
flow scripts execute ./cadence/scripts/flowupdate_get_contract_stats.cdc --network testnet

# 2. Create market
flow transactions send ./cadence/transactions/flowupdate_create_market.cdc --network testnet --signer testnet4-account --arg String:"Test Market" --arg String:"Test Description" --arg UInt8:5 --arg '[String]':["Option A","Option B","Option C"] --arg UFix64:1800000000 --arg UFix64:1.0 --arg UFix64:50.0 --arg String:"https://test.com/image.jpg" --arg "UFix64?":null

# 3. Place bets
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc --network testnet --signer testnet4-account --arg UInt64:3 --arg UInt8:0 --arg UFix64:10.0

# 4. Check positions
flow scripts execute ./cadence/scripts/flowupdate_get_user_positions.cdc --network testnet --arg Address:0x24225e374dfffb2b

# 5. Calculate winnings
flow scripts execute ./cadence/scripts/flowupdate_calculate_winnings.cdc --network testnet --arg UInt64:3 --arg Address:0x24225e374dfffb2b --arg UInt8:0

# 6. Resolve market
flow transactions send ./cadence/transactions/flowupdate_admin_resolve_market.cdc --network testnet --signer testnet4-account --arg UInt64:3 --arg UInt8:0 --arg String:"Option A was the correct outcome"
```

### Scenario 2: Stress Test Batch Betting
```bash
# Place maximum allowed batch bets (10)
flow transactions send ./cadence/transactions/flowupdate_place_batch_bets.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg '[UInt8]':[0,1,2,0,1,2,0,1,2,0] \
  --arg '[UFix64]':[1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0]
```

### Scenario 3: Error Testing
```bash
# Try to bet on non-existent market (should fail)
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:999 \
  --arg UInt8:0 \
  --arg UFix64:10.0

# Try to bet on invalid option (should fail)
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:99 \
  --arg UFix64:10.0
```

## Market Categories Reference

- 0: Sports
- 1: Politics  
- 2: Entertainment
- 3: Crypto
- 4: Finance
- 5: Other

## Market Status Reference

- 0: Active
- 1: Paused
- 2: Resolved
- 3: Cancelled

## Tips for Testing

1. **Start Small**: Begin with small bet amounts (1-5 FLOW) for testing
2. **Check Balances**: Always verify your FLOW balance before placing large bets
3. **Monitor Events**: Watch for transaction events to confirm successful operations
4. **Test Edge Cases**: Try minimum/maximum bet amounts, maximum options, etc.
5. **Batch vs Single**: Compare gas costs between batch betting and multiple single bets

## Common Issues and Solutions

### Issue: "Could not borrow MultiOptionPositions resource"
**Solution**: Run the setup account transaction first
```bash
flow transactions send ./cadence/transactions/flowupdate_setup_account.cdc --network testnet --signer testnet4-account
```

### Issue: "Insufficient Flow token balance"
**Solution**: Check your FLOW balance and ensure you have enough tokens
```bash
flow scripts execute ./cadence/scripts/get_user_flow_balance.cdc --network testnet --arg Address:0x24225e374dfffb2b
```

### Issue: "Market does not exist"
**Solution**: Check active markets to get valid market IDs
```bash
flow scripts execute ./cadence/scripts/flowupdate_get_active_markets.cdc --network testnet
```

### Issue: "Invalid option index"
**Solution**: Check the market details to see how many options it has
```bash
flow scripts execute ./cadence/scripts/flowupdate_get_market.cdc --network testnet --arg UInt64:1
```

## Performance Benchmarks

Track these metrics during testing:

- **Market Creation**: ~2-3 seconds
- **Single Bet**: ~1-2 seconds  
- **Batch Bet (5 options)**: ~2-4 seconds
- **Query Scripts**: <1 second
- **Market Resolution**: ~2-3 seconds

## Contract Import Updates

All FlowUpdate scripts and transactions have been updated to use the correct contract addresses:

```cadence
import FlowUpdate from 0x24225e374dfffb2b
import FlowToken from 0x7e60df042a9c0868
```

## Next Steps

After successful testing:

1. Deploy to mainnet (update contract addresses to mainnet equivalents)
2. Integrate with frontend application
3. Set up event monitoring
4. Implement automated market resolution
5. Add more sophisticated pricing mechanisms

## Contract Verification

To verify contracts are properly deployed:
```bash
flow accounts get 0x24225e374dfffb2b --network testnet
```

Happy Testing! 🎯