# 🧠 FlowWager

> A decentralized prediction market platform built on the Flow blockchain using Cadence smart contracts.

FlowWager enables users to **create**, **participate in**, and **resolve** binary prediction markets using FLOW tokens. The platform includes category filtering, evidence-based resolutions, referral incentives, wager points, and robust administrative controls.

---

## 🚀 Overview

FlowWager is a smart contract suite enabling:

- Market creation & resolution.
- FLOW-based betting.
- Evidence-backed outcome verification.
- User stats tracking.
- Platform-level analytics.
- Referral systems & wager incentives.

Built on **Flow** blockchain with **Cadence**, FlowWager emphasizes transparency, scalability, and user engagement.

---

## 🧩 Core Components

### 🔢 Enums

- `MarketCategory`: `Sports`, `Entertainment`, `Technology`, `Economics`, `Weather`, `Crypto`, `Politics`, `BreakingNews`, `Other`
- `MarketStatus`: `Active`, `PendingResolution`, `Resolved`, `Cancelled`
- `MarketOutcome`: `OptionA`, `OptionB`, `Draw`, `Cancelled`

### 🧱 Structs

<details>
<summary><strong>Click to view structs</strong></summary>

- `ResolutionEvidence`: Evidence from creators for market resolution.
- `Market`: A prediction market object with metadata, stats, and state.
- `UserPosition`: A user's shares and position in a specific market.
- `UserStats`: Tracks individual stats like ROI, wins, losses.
- `PlatformStats`: Aggregate metrics across all users & markets.
- `ClaimableWinnings`: Tracks user's unclaimed funds.
- `ResolutionDetails`: Stores how a market was resolved.

</details>

### 🧾 Resources

- `UserProfile`: User’s account metadata.
- `UserPositions`: Market positions for each user.
- `UserStatsResource`: Updatable user statistics.
- `Admin`: Platform management operations (pause, fees, etc.)

---

## 🛠️ Functional Overview

### 👤 User Management

- `createUserAccount()`: Register with username/display name.
- `generateReferralCode()`: Get a unique code to earn wager points.
- `adminUpdateUserDisplayName()`: Admin-only display name update.

---

### 🧮 Market Creation

- `createMarket(...)`: Supply title, options, category, time, min/max bets, and image.
- Fee: 10 FLOW (for non-deployers).
- Max limits enforced (e.g., total markets, string lengths).

---

### 💰 Betting

- `placeBet(...)`: Bet on Option A or B using FLOW tokens.
- Vaulted per-market.
- Updates: `UserPositions`, `MarketShares`, and `UserStats`.

---

### 🧾 Resolution

- `submitResolutionEvidence(...)`: Market creator submits proof.
- `resolveMarket(...)`: Admin validates and resolves outcome.
- Resolution types:
  - Approved (evidence-based)
  - Override (admin decision)
  - Emergency (admin-only)
- Fee structure:
  - 1% → Platform
  - 2% → Creator (for approved evidence)

---

### 🏆 Winnings

- `claimWinnings(...)`: Based on user's stake in winning outcome.
- Payout is proportional and net of fees.
- Stats updated post-claim.

---

### 🛡️ Admin Functions

- `pauseContract()` / `unpauseContract()`
- `updatePlatformFee(...)`
- `withdrawPlatformFees(...)`
- Admin role transfer system:
  - `AdminTransferProposed`
  - `AdminTransferred`

---

### 📊 Query Functions

- `getPlatformStats()`, `getAllMarkets()`, `getActiveMarkets()`
- `getMarketsByCreator(...)`, `getUserProfile(...)`, etc.
- Vault balances and claimable earnings.

---

## 📢 Events

```
ContractInitialized
MarketCreated
SharesPurchased
MarketResolved
WinningsClaimed
UserRegistered
ReferralCodeGenerated
EvidenceSubmitted
EvidenceRejected
MarketStatusChanged
CreatorIncentivePaid
PlatformFeesWithdrawn
AdminTransferProposed
AdminTransferred
MarketCreationFeeUpdated
ContractUpgraded
```

---

## 🎯 Real-World Examples

### ✅ Sports Market — Super Bowl

```
Market: Will the Kansas City Chiefs win Super Bowl 2026?
- Bob bets 50 FLOW on "Yes"
- Charlie bets 30 FLOW on "No"
- Alice submits evidence → Admin approves → Option A wins
- Bob wins 77.6 FLOW (after fees)
```

### ✅ Crypto Market — BTC Price

```
Market: Will BTC exceed $100k by Dec 31, 2025?
- Dave bets 100 FLOW on "Yes"
- Eve bets 50 FLOW on "No"
- Evidence initially rejected → Eve resubmits → Admin overrides to Option A
- Dave wins 145.5 FLOW
```

### ❌ Cancelled Market — Weather

```
Market: Will it snow in NYC on Christmas?
- Admin cancels due to unverifiable data
- Alice and Charlie refunded their bets
```

---

## 📂 Storage Paths

| Resource | Storage Path | Public Interface |
|----------|--------------|------------------|
| `UserProfile` | `/storage/FlowWagerUserProfile` | `/public/FlowWagerUserProfile` |
| `UserPositions` | `/storage/FlowWagerUserPositions` | `/public/FlowWagerUserPositions` |
| `UserStats` | `/storage/FlowWagerUserStats` | `/public/FlowWagerUserStats` |
| `Admin` | `/storage/FlowWagerAdmin` | _N/A_ |

---

## 🔒 Security & Constraints

- Validations for user inputs, IDs, and roles.
- Contract-wide pause system.
- Unique usernames/display names.
- Vaulted asset system (isolated per market).

---

## 🔭 Future Roadmap

- Contract upgrade mechanism with `UpgradePrepared`, `UpgradeExecuted`
- More incentives for referrals.
- Multi-option and conditional markets.
- Gas optimization for larger markets.

---

## 🧠 TL;DR Usage Flow

```
1. User registers account.
2. User creates a market.
3. Participants place FLOW token bets.
4. Creator submits resolution evidence.
5. Admin resolves market.
6. Users claim winnings.
```

---

## 📜 License

MIT — open source. Built for decentralized betting on the Flow blockchain.

---

## 🤝 Contributions

Pull requests welcome. Open issues to propose new market types or features. Let’s make decentralized predictions better together.
