# FlowUpdate Multi-Option Reward System

## 📋 Overview

FlowUpdate implements a **Proportional Share Distribution** model for multi-option betting markets. This document explains how rewards are calculated and distributed among winners.

## 🎯 Current Reward Model

### **Proportional Share Distribution**

The current implementation uses a fair proportional system where:

```
User Reward = (User Shares in Winning Option / Total Shares in Winning Option) × Total Market Pool
```

### **Mathematical Formula**

```cadence
let userProportion = userShares / totalWinningShares
return market.totalPool * userProportion
```

## 📊 Reward Distribution Examples

### **Example 1: Simple 3-Option Market**

```
Market: "Champions League Winner"
Options: [Real Madrid, Manchester City, Bayern Munich]
Total Pool: 1,000 FLOW

Betting Distribution:
- Real Madrid: 400 FLOW (from 20 users)
- Manchester City: 350 FLOW (from 15 users)  
- Bayern Munich: 250 FLOW (from 10 users)

If Real Madrid Wins:
- Each Real Madrid bettor gets: (Their bet / 400 FLOW) × 1,000 FLOW
- User who bet 20 FLOW gets: (20/400) × 1,000 = 50 FLOW
- ROI: 150% (50 FLOW return on 20 FLOW bet)

If Bayern Munich Wins:
- Each Bayern bettor gets: (Their bet / 250 FLOW) × 1,000 FLOW  
- User who bet 25 FLOW gets: (25/250) × 1,000 = 100 FLOW
- ROI: 300% (100 FLOW return on 25 FLOW bet)
```

### **Example 2: Diversified Betting Strategy**

```
User Strategy: Hedge across multiple options
- 30 FLOW on Real Madrid
- 20 FLOW on Manchester City
- 10 FLOW on Bayern Munich
Total Investment: 60 FLOW

Possible Outcomes:
1. Real Madrid wins: (30/400) × 1,000 = 75 FLOW (25% profit)
2. Manchester City wins: (20/350) × 1,000 = 57.14 FLOW (5% loss)
3. Bayern Munich wins: (10/250) × 1,000 = 40 FLOW (33% loss)
```

## 🔧 Implementation Details

### **Core Calculation Function**

```cadence
access(all) fun calculatePotentialWinnings(
    marketId: UInt64, 
    position: MultiOptionPosition, 
    winningOption: UInt8
): UFix64 {
    let market = self.markets[marketId] ?? panic("Market does not exist")
    
    // Check if user has shares in winning option
    if Int(winningOption) >= position.optionShares.length {
        return 0.0
    }
    
    let userShares = position.optionShares[Int(winningOption)]
    if userShares == 0.0 {
        return 0.0
    }
    
    // Calculate proportional share
    let totalWinningShares = market.totalShares[Int(winningOption)]
    if totalWinningShares == 0.0 {
        return 0.0  // Edge case: no one bet on winning option
    }
    
    let userProportion = userShares / totalWinningShares
    return market.totalPool * userProportion
}
```

### **Key Data Structures**

```cadence
// Market tracks total shares per option
struct MultiOptionMarket {
    access(all) let totalShares: [UFix64]  // Shares for each option
    access(all) let totalPool: UFix64      // Total FLOW in market
    // ... other fields
}

// User position tracks shares per option
struct MultiOptionPosition {
    access(all) let optionShares: [UFix64] // User's shares per option
    access(all) let totalInvested: UFix64  // Total FLOW invested
    // ... other fields
}
```

## ⚖️ Fairness & Advantages

### **✅ Advantages of Current Model**

1. **Proportional Fairness**: Reward proportional to risk and investment
2. **Transparent**: Clear mathematical formula, no hidden calculations
3. **Anti-Whale**: Large bets don't get disproportionate advantages
4. **Flexible**: Works with any number of options (2-10)
5. **Predictable**: Users can calculate potential returns before betting

### **🎯 Risk/Reward Dynamics**

- **Underdog Bets**: Higher potential returns (fewer people betting)
- **Favorite Bets**: Lower but more likely returns (more people betting)
- **Diversification**: Users can hedge across multiple options

## 🚫 Edge Cases Handled

### **1. Zero Shares Scenario**
```cadence
if userShares == 0.0 {
    return 0.0  // No reward if no shares in winning option
}
```

### **2. No Bets on Winning Option**
```cadence
if totalWinningShares == 0.0 {
    return 0.0  // Theoretical case: no one bet on winner
}
```

### **3. Invalid Option Index**
```cadence
if Int(winningOption) >= position.optionShares.length {
    return 0.0  // Invalid option returns zero
}
```

## 🔄 Alternative Reward Models

### **1. Parimutuel Model (Horse Racing)**
```
Net Pool = Total Pool - Platform Fees - Taxes
Odds = Net Pool / Winning Option Pool
Payout = User Bet × Odds
```

### **2. Fixed Odds Model**
```
Odds set at bet placement time
Payout = User Bet × Fixed Odds
Platform absorbs risk
```

### **3. AMM Model (Automated Market Maker)**
```
Dynamic pricing based on current bet distribution
Prices change in real-time as bets are placed
More complex but potentially more efficient
```

## 💡 Recommended Enhancements

### **1. Platform Fee Implementation**
```cadence
// Deduct platform fee before distribution
let platformFee = market.totalPool * PLATFORM_FEE_RATE
let netPool = market.totalPool - platformFee
return netPool * userProportion
```

### **2. Creator Incentives**
```cadence
// Share revenue with market creators
let creatorFee = market.totalPool * CREATOR_FEE_RATE
let netPool = market.totalPool - platformFee - creatorFee
return netPool * userProportion
```

### **3. Anti-Manipulation Measures**
```cadence
// Prevent late betting manipulation
let timeRemaining = market.endTime - getCurrentBlock().timestamp
let minTimeBuffer = 300.0  // 5 minutes
require(timeRemaining > minTimeBuffer, message: "Too close to market end")
```

### **4. Minimum Guaranteed Returns**
```cadence
// Ensure minimum return for winners
let calculatedReward = market.totalPool * userProportion
let minimumReturn = position.totalInvested * MIN_RETURN_MULTIPLIER
return max(calculatedReward, minimumReturn)
```

## 📈 Testing Reward Calculations

### **Test Script Usage**
```bash
# Test reward calculations
flow scripts execute ./cadence/scripts/flowupdate_test_reward_calculation.cdc --network testnet

# Test specific market scenarios
flow scripts execute ./cadence/scripts/flowupdate_calculate_winnings.cdc \
  --network testnet \
  --arg UInt64:1 \
  --arg Address:0x24225e374dfffb2b \
  --arg UInt8:0
```

### **Manual Calculation Verification**
```
Given:
- User bet: 25 FLOW on Option 2
- Total Option 2 bets: 200 FLOW
- Total market pool: 800 FLOW

Calculation:
- User proportion: 25 / 200 = 0.125 (12.5%)
- User reward: 800 × 0.125 = 100 FLOW
- ROI: (100 - 25) / 25 = 300%
```

## 🎮 Gaming Theory Considerations

### **Nash Equilibrium**
The proportional model encourages:
- **Information-based betting**: Users bet based on their knowledge
- **Risk diversification**: Users may hedge across multiple options
- **Early participation**: Earlier bets get better "prices"

### **Preventing Gaming**
Current protections:
- **Proportional rewards**: No advantage to bet size alone
- **Transparent odds**: All calculations are public
- **Time limits**: Markets have defined end times

## 🔒 Security Considerations

### **1. Overflow Protection**
```cadence
// All calculations use UFix64 with proper bounds checking
assert(userShares <= totalWinningShares, message: "Invalid share calculation")
```

### **2. Division by Zero**
```cadence
// Explicit checks for zero denominators
if totalWinningShares == 0.0 {
    return 0.0
}
```

### **3. Integer Precision**
```cadence
// Using UFix64 for precise decimal calculations
// Avoids rounding errors in reward distribution
```

## 📊 Market Efficiency Metrics

### **Measuring Model Success**
- **Participation Rate**: Higher is better
- **Bet Distribution**: More even distribution indicates healthy market
- **User Retention**: Repeat betting indicates satisfaction
- **Volume Growth**: Total FLOW wagered over time

### **KPI Tracking**
```cadence
// Contract stats for monitoring
access(all) fun getMarketMetrics(marketId: UInt64): {String: AnyStruct} {
    let market = self.markets[marketId]!
    return {
        "totalParticipants": /* count unique bettors */,
        "distributionVariance": /* measure bet spread */,
        "averageBet": market.totalPool / /* total bets */,
        "optionConcentration": /* measure favorite vs underdog */
    }
}
```

## 🎯 Best Practices for Users

### **1. Betting Strategy**
- Research market fundamentals
- Consider diversification across options
- Factor in market timing
- Understand risk/reward ratios

### **2. Risk Management**
- Never bet more than you can afford to lose
- Diversify across multiple markets
- Consider time horizon of markets
- Monitor market dynamics

### **3. Maximizing Returns**
- Look for undervalued options
- Bet early when information is scarce
- Consider contrarian positions
- Monitor betting patterns

## 🔮 Future Enhancements

### **Planned Improvements**
1. **Dynamic Pricing**: AMM-style pricing mechanisms
2. **Liquidity Pools**: Allow users to provide liquidity
3. **Cross-Market Arbitrage**: Link related markets
4. **Prediction Aggregation**: Combine multiple prediction sources
5. **Reputation System**: Track user prediction accuracy

### **Advanced Features**
1. **Conditional Markets**: Markets dependent on other outcomes
2. **Partial Payouts**: Graduated payouts for close predictions
3. **Insurance Markets**: Hedge against specific outcomes
4. **Synthetic Assets**: Create derivative betting products

---

*This document reflects the current implementation as of the latest contract deployment. For the most up-to-date information, refer to the deployed contract code and test scripts.*