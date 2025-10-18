# FlowUpdate Focused Testing Commands

Quick reference for testing FlowUpdate contract market creation and retrieval functionality.

## Prerequisites

```bash
cd flow-wager/flow-wager
```

## 1. Setup Commands

### Setup your account first
```bash
flow transactions send ./cadence/transactions/flowupdate_setup_account.cdc --network testnet --signer testnet4-account
```

### Check contract status
```bash
flow scripts execute ./cadence/scripts/flowupdate_get_contract_stats.cdc --network testnet
```

## 2. Market Creation Tests

### Test market creation validation
```bash
flow scripts execute ./cadence/scripts/flowupdate_test_market_creation.cdc --network testnet
```

### Create a Sports Market (Champions League)
```bash
flow transactions send ./cadence/transactions/flowupdate_create_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg String:"Champions League Final Winner" \
  --arg String:"Who will win the Champions League Final 2024?" \
  --arg UInt8:0 \
  --arg '[String]':["Real Madrid","Manchester City","Bayern Munich","Barcelona"] \
  --arg UFix64:1893456000 \
  --arg UFix64:1.0 \
  --arg UFix64:100.0 \
  --arg String:"https://example.com/cl-final.jpg" \
  --arg "UFix64?":null
```

### Create a Crypto Market (Bitcoin Price)
```bash
flow transactions send ./cadence/transactions/flowupdate_create_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg String:"Bitcoin Year-End Price" \
  --arg String:"What range will Bitcoin price be in by Dec 31, 2024?" \
  --arg UInt8:3 \
  --arg '[String]':["Below 40k","40k-60k","60k-80k","80k-100k","Above 100k"] \
  --arg UFix64:1735689600 \
  --arg UFix64:5.0 \
  --arg UFix64:500.0 \
  --arg String:"https://example.com/btc-prediction.jpg" \
  --arg "UFix64?":null
```

### Create an Entertainment Market (Oscars)
```bash
flow transactions send ./cadence/transactions/flowupdate_create_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg String:"Oscar Best Picture 2025" \
  --arg String:"Which movie will win Best Picture at the 2025 Academy Awards?" \
  --arg UInt8:2 \
  --arg '[String]':["Dune: Part Three","Avatar 3","Marvel Movie","Scorsese Film","Nolan Film"] \
  --arg UFix64:1740787200 \
  --arg UFix64:2.0 \
  --arg UFix64:200.0 \
  --arg String:"https://example.com/oscars-2025.jpg" \
  --arg "UFix64?":null
```

### Create a Simple Test Market (3 options)
```bash
flow transactions send ./cadence/transactions/flowupdate_create_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg String:"Simple Test Market" \
  --arg String:"A basic test market with 3 options for testing" \
  --arg UInt8:5 \
  --arg '[String]':["Option A","Option B","Option C"] \
  --arg UFix64:1800000000 \
  --arg UFix64:1.0 \
  --arg UFix64:50.0 \
  --arg String:"https://example.com/test-market.jpg" \
  --arg "UFix64?":null
```

## 3. Market Retrieval Tests

### Get all active markets
```bash
flow scripts execute ./cadence/scripts/flowupdate_get_active_markets.cdc --network testnet
```

### Get detailed market analysis
```bash
flow scripts execute ./cadence/scripts/flowupdate_test_market_retrieval.cdc --network testnet
```

### Get specific market by ID (replace 1 with actual market ID)
```bash
flow scripts execute ./cadence/scripts/flowupdate_get_market.cdc --network testnet --arg UInt64:1
```

### Check contract statistics after market creation
```bash
flow scripts execute ./cadence/scripts/flowupdate_get_contract_stats.cdc --network testnet
```

## 4. Betting Tests

### Place a single bet (10 FLOW on option 0 of market 1)
```bash
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:0 \
  --arg UFix64:10.0
```

### Place multiple single bets on different options
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

### Place batch bets (hedge across multiple options)
```bash
flow transactions send ./cadence/transactions/flowupdate_place_batch_bets.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg '[UInt8]':[0,1,2,3] \
  --arg '[UFix64]':[20.0,15.0,10.0,5.0]
```

## 5. User Position Tests

### Check your positions
```bash
flow scripts execute ./cadence/scripts/flowupdate_get_user_positions.cdc --network testnet --arg Address:0x24225e374dfffb2b
```

### Calculate potential winnings (market 1, option 0 wins)
```bash
flow scripts execute ./cadence/scripts/flowupdate_calculate_winnings.cdc --network testnet --arg UInt64:1 --arg Address:0x24225e374dfffb2b --arg UInt8:0
```

## 6. Admin Tests

### Resolve a market (Real Madrid wins - option 0)
```bash
flow transactions send ./cadence/transactions/flowupdate_admin_resolve_market.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg UInt64:1 \
  --arg UInt8:0 \
  --arg String:"Real Madrid won the Champions League Final 3-1 against Manchester City"
```

### Pause the contract
```bash
flow transactions send ./cadence/transactions/flowupdate_admin_pause_contract.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg Bool:true
```

### Unpause the contract
```bash
flow transactions send ./cadence/transactions/flowupdate_admin_pause_contract.cdc \
  --network testnet \
  --signer testnet4-account \
  --arg Bool:false
```

## 7. Complete Test Flow

### End-to-end test sequence
```bash
# 1. Setup
flow transactions send ./cadence/transactions/flowupdate_setup_account.cdc --network testnet --signer testnet4-account

# 2. Check initial state
flow scripts execute ./cadence/scripts/flowupdate_get_contract_stats.cdc --network testnet

# 3. Create a test market
flow transactions send ./cadence/transactions/flowupdate_create_market.cdc --network testnet --signer testnet4-account --arg String:"Test Market" --arg String:"Test Description" --arg UInt8:5 --arg '[String]':["A","B","C"] --arg UFix64:1800000000 --arg UFix64:1.0 --arg UFix64:50.0 --arg String:"test.jpg" --arg "UFix64?":null

# 4. Verify market creation
flow scripts execute ./cadence/scripts/flowupdate_get_active_markets.cdc --network testnet

# 5. Get market details (assuming market ID is 1)
flow scripts execute ./cadence/scripts/flowupdate_get_market.cdc --network testnet --arg UInt64:1

# 6. Place a bet
flow transactions send ./cadence/transactions/flowupdate_place_bet.cdc --network testnet --signer testnet4-account --arg UInt64:1 --arg UInt8:0 --arg UFix64:10.0

# 7. Check positions
flow scripts execute ./cadence/scripts/flowupdate_get_user_positions.cdc --network testnet --arg Address:0x24225e374dfffb2b

# 8. Check market after bet
flow scripts execute ./cadence/scripts/flowupdate_get_market.cdc --network testnet --arg UInt64:1

# 9. Resolve market
flow transactions send ./cadence/transactions/flowupdate_admin_resolve_market.cdc --network testnet --signer testnet4-account --arg UInt64:1 --arg UInt8:0 --arg String:"Option A was correct"

# 10. Final state check
flow scripts execute ./cadence/scripts/flowupdate_get_contract_stats.cdc --network testnet
```

## Market Categories Reference

- **0**: Sports
- **1**: Politics  
- **2**: Entertainment
- **3**: Crypto
- **4**: Finance
- **5**: Other

## Market Status Reference

- **0**: Active
- **1**: Paused
- **2**: Resolved
- **3**: Cancelled

## Tips

1. **Start with small amounts**: Use 1-5 FLOW for initial testing
2. **Check active markets first**: Run `flowupdate_get_active_markets.cdc` to see existing markets
3. **Note market IDs**: Use the correct market ID when placing bets or resolving
4. **Validate options**: Remember max 10 options, min 2 options per market
5. **Time validation**: Ensure end times are in the future (use Unix timestamps)

## Error Troubleshooting

- **"Could not borrow MultiOptionPositions resource"**: Run setup account transaction first
- **"Market does not exist"**: Check active markets for valid market IDs  
- **"Invalid option index"**: Check market details for correct number of options
- **"Insufficient Flow token balance"**: Ensure you have enough FLOW tokens