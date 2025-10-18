# FlowUpdate Reward Testing Commands

## Quick Test Commands for Reward Calculations

### 1. Setup
```bash
cd flow-wager/flow-wager
```

### 2. Test Reward Calculation Logic
```bash
# Run comprehensive reward calculation test
flow scripts execute ./cadence/scripts/flowupdate_test_reward_calculation.cdc --network testnet
```

### 3. Create Test Markets for Reward Testing
```bash
# Create a simple 3-option market
flow transactions send ./cadence/transactions/flowupdate_create_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg String:"Reward Test Market" \
  --arg String:"Testing reward distribution with 3 options" \
  --arg UInt8:5 \
  --arg '[String]':["Option A","Option B","Option C"] \
  --arg UFix64:1800000000 \
  --arg UFix64:1.0 \
  --arg UFix64:100.0 \
  --arg String:"https://example.com/reward-test.jpg" \
  --arg "UFix64?":null

# Create a 5-option market for complex testing
flow transactions send ./cadence/transactions/flowupdate_create_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg String:"Multi-Option Reward Test" \
  --arg String:"Testing rewards with 5 betting options" \
  --arg UInt8:0 \
  --arg '[String]':["Team A","Team B","Team C","Team D","Team E"] \
  --arg UFix64:1800000000 \
  --arg UFix64:2.0 \
  --arg UFix64:200.0 \
  --arg String:"https://example.com/multi-test.jpg" \
  --arg "UFix64?":null
```

### 4. Place Bets to Test Different Scenarios

#### Scenario 1: Single Large Bet
```bash
# Place 50 FLOW on Option A (market ID 1)
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:0 \
  --arg UFix64:50.0
```

#### Scenario 2: Diversified Betting
```bash
# Spread bets across multiple options (market ID 1)
flow transactions send ./cadence/transactions/flowupdate_place_batch_bets.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg '[UInt8]':[0,1,2] \
  --arg '[UFix64]':[30.0,20.0,10.0]
```

#### Scenario 3: Underdog Betting
```bash
# Bet on least popular option (Option C - index 2)
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:2 \
  --arg UFix64:25.0
```

#### Scenario 4: Multiple Small Bets
```bash
# Place several small bets on same option
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:0 \
  --arg UFix64:5.0

flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:0 \
  --arg UFix64:10.0

flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:0 \
  --arg UFix64:15.0
```

### 5. Check Market State After Betting
```bash
# Get updated market details
flow scripts execute ./cadence/scripts/flowupdate_get_market.cdc --network testnet --arg UInt64:1

# Check your positions
flow scripts execute ./cadence/scripts/flowupdate_get_user_positions.cdc --network testnet --arg Address:0x24225e374dfffb2b

# Run market analysis
flow scripts execute ./cadence/scripts/flowupdate_test_market_retrieval.cdc --network testnet
```

### 6. Calculate Potential Winnings for Each Scenario
```bash
# Calculate rewards if Option A wins (index 0)
flow scripts execute ./cadence/scripts/flowupdate_calculate_winnings.cdc \
  --network testnet \
  --arg UInt64:1 \
  --arg Address:0x24225e374dfffb2b \
  --arg UInt8:0

# Calculate rewards if Option B wins (index 1)  
flow scripts execute ./cadence/scripts/flowupdate_calculate_winnings.cdc \
  --network testnet \
  --arg UInt64:1 \
  --arg Address:0x24225e374dfffb2b \
  --arg UInt8:1

# Calculate rewards if Option C wins (index 2)
flow scripts execute ./cadence/scripts/flowupdate_calculate_winnings.cdc \
  --network testnet \
  --arg UInt64:1 \
  --arg Address:0x24225e374dfffb2b \
  --arg UInt8:2
```

### 7. Test Market Resolution and Actual Payouts
```bash
# Resolve market with Option A as winner
flow transactions send ./cadence/transactions/flowupdate_admin_resolve_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:0 \
  --arg String:"Option A won based on test criteria"

# Check market state after resolution
flow scripts execute ./cadence/scripts/flowupdate_get_market.cdc --network testnet --arg UInt64:1

# Verify final positions
flow scripts execute ./cadence/scripts/flowupdate_get_user_positions.cdc --network testnet --arg Address:0x24225e374dfffb2b
```

### 8. Advanced Reward Testing Scenarios

#### Test with Maximum Options (10)
```bash
flow transactions send ./cadence/transactions/flowupdate_create_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg String:"Max Options Test" \
  --arg String:"Testing with maximum 10 options" \
  --arg UInt8:0 \
  --arg '[String]':["Opt1","Opt2","Opt3","Opt4","Opt5","Opt6","Opt7","Opt8","Opt9","Opt10"] \
  --arg UFix64:1800000000 \
  --arg UFix64:1.0 \
  --arg UFix64:500.0 \
  --arg String:"https://example.com/max-options.jpg" \
  --arg "UFix64?":null
```

#### Test Extreme Bet Distribution
```bash
# Create uneven distribution (90% on one option, 10% spread across others)
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:2 \
  --arg UInt8:0 \
  --arg UFix64:90.0

flow transactions send ./cadence/transactions/flowupdate_place_batch_bets.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:2 \
  --arg '[UInt8]':[1,2,3,4,5,6,7,8,9] \
  --arg '[UFix64]':[1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,2.0]
```

### 9. Verify Reward Distribution Math

#### Manual Calculation Verification
```bash
# After betting, check the math manually:
# 1. Get market total pool
# 2. Get total shares for winning option  
# 3. Get user shares for winning option
# 4. Calculate: (user_shares / total_option_shares) * total_pool
# 5. Compare with contract calculation

# Example verification for market 1, option 0:
echo "Manual Calculation Check:"
echo "1. Total Pool: [check from market details]"
echo "2. Option 0 Total Shares: [check from market details]"  
echo "3. Your Option 0 Shares: [check from your position]"
echo "4. Expected Reward: (your_shares / total_shares) * total_pool"
echo "5. Contract Calculation: [run calculate_winnings script]"
```

### 10. Edge Case Testing

#### Test Zero Shares Scenario
```bash
# Calculate winnings for option you didn't bet on
flow scripts execute ./cadence/scripts/flowupdate_calculate_winnings.cdc \
  --network testnet \
  --arg UInt64:1 \
  --arg Address:0x24225e374dfffb2b \
  --arg UInt8:9  # Option you have no shares in
```

#### Test Invalid Option
```bash  
# Test with invalid option index
flow scripts execute ./cadence/scripts/flowupdate_calculate_winnings.cdc \
  --network testnet \
  --arg UInt64:1 \
  --arg Address:0x24225e374dfffb2b \
  --arg UInt8:99  # Invalid option
```

## Expected Reward Behaviors

### Proportional Share Model Results:
- **Winner with 25% of option shares** → Gets 25% of total pool
- **Winner with 50% of option shares** → Gets 50% of total pool
- **Multiple winners** → Pool split proportionally among all winners
- **No shares in winning option** → Gets 0 FLOW
- **Invalid option** → Gets 0 FLOW

### ROI Examples:
- **Favorite option (many bets)** → Lower multiplier (e.g., 1.2x - 2x)
- **Underdog option (few bets)** → Higher multiplier (e.g., 5x - 20x)
- **Diversified betting** → Guaranteed some return, lower max return

## Validation Checklist

- [ ] Rewards sum to total pool amount
- [ ] Users with 0 shares get 0 reward
- [ ] Proportional distribution works correctly  
- [ ] Edge cases return 0 appropriately
- [ ] Math matches manual calculations
- [ ] Large numbers don't cause overflow
- [ ] Small numbers maintain precision