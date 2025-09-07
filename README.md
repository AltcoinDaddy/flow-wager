# FlowWager
**A Decentralized Prediction Market Platform**

*Built on Flow blockchain using Cadence smart contracts*

---

## Executive Summary

FlowWager is a comprehensive decentralized prediction market platform that enables users to create, participate in, and resolve binary prediction markets using FLOW tokens. The platform features advanced functionality including category filtering, evidence-based market resolution, referral incentive systems, comprehensive user statistics, and robust administrative controls.

---

## Platform Overview

### Core Capabilities
- **Market Creation & Resolution**: Full lifecycle management of prediction markets
- **FLOW Token Integration**: Native blockchain token-based wagering system
- **Evidence-Based Verification**: Transparent outcome verification process
- **Comprehensive Analytics**: User statistics and platform-wide metrics
- **Referral Systems**: Incentivized user acquisition and engagement
- **Administrative Controls**: Platform governance and security features

### Technical Foundation
- **Blockchain**: Flow
- **Smart Contract Language**: Cadence
- **Core Principles**: Transparency, scalability, and user engagement

---

## Architecture Overview

### Enumeration Types

#### MarketCategory
Comprehensive categorization system for organized market discovery:
- `Sports` - Athletic events and competitions
- `Entertainment` - Movies, awards, celebrity events
- `Technology` - Product launches, adoption metrics
- `Economics` - Market indicators, economic events
- `Weather` - Climate and weather predictions
- `Crypto` - Cryptocurrency and DeFi events
- `Politics` - Electoral outcomes, policy decisions
- `BreakingNews` - Current events and news developments
- `Other` - Miscellaneous prediction categories

#### MarketStatus
Market lifecycle management:
- `Active` - Open for participation
- `PendingResolution` - Awaiting outcome determination
- `Resolved` - Completed with final outcome
- `Cancelled` - Terminated without resolution

#### MarketOutcome
Resolution possibilities:
- `OptionA` - First market option wins
- `OptionB` - Second market option wins
- `Draw` - Tie or inconclusive result
- `Cancelled` - Market terminated

### Data Structures

#### Core Structures
- **ResolutionEvidence**: Documentation and proof submitted by market creators
- **Market**: Complete market object containing metadata, statistics, and state
- **UserPosition**: Individual user's shareholding and position data
- **UserStats**: Personal performance metrics including ROI, wins, and losses
- **PlatformStats**: Aggregate platform metrics and analytics
- **ClaimableWinnings**: Tracking system for unclaimed user funds
- **ResolutionDetails**: Historical record of market resolution process

#### Resource Management
- **UserProfile**: Individual account metadata and settings
- **UserPositions**: Portfolio of market positions per user
- **UserStatsResource**: Dynamic user performance statistics
- **Admin**: Platform administration and governance tools

---

## Core Functionality

### User Account Management

#### Registration Process
- **`createUserAccount()`**: Complete user registration with username and display name
- **Unique Identifier System**: Enforced username and display name uniqueness
- **Profile Management**: Comprehensive user profile creation and maintenance

#### Referral System
- **`generateReferralCode()`**: Unique referral code generation for wager point earnings
- **Incentive Structure**: Reward system for user acquisition
- **`adminUpdateUserDisplayName()`**: Administrative display name modification capability

### Market Creation and Management

#### Market Initialization
- **`createMarket(...)`**: Comprehensive market creation with full parameter specification
  - Market title and description
  - Binary option definitions
  - Category assignment
  - Timing parameters
  - Minimum and maximum bet limits
  - Associated imagery

#### Fee Structure
- **Creation Fee**: 10 FLOW tokens (waived for platform deployers)
- **Platform Limits**: Enforced constraints on market quantity and parameter lengths
- **Quality Controls**: Validation systems for market integrity

### Wagering System

#### Bet Placement
- **`placeBet(...)`**: FLOW token-based betting on Option A or Option B
- **Vault Architecture**: Isolated per-market fund management
- **Real-time Updates**: Automatic updates to UserPositions, MarketShares, and UserStats
- **Position Tracking**: Comprehensive shareholding calculations

#### Financial Architecture
- **Token Integration**: Native FLOW token utilization
- **Liquidity Management**: Automated market making and liquidity provision
- **Security**: Vaulted asset system with market isolation

### Resolution Framework

#### Evidence Submission
- **`submitResolutionEvidence(...)`**: Market creator evidence submission system
- **Documentation Standards**: Structured proof requirements
- **Verification Process**: Multi-stage evidence validation

#### Resolution Mechanisms
- **`resolveMarket(...)`**: Administrative resolution with outcome validation
- **Resolution Types**:
  - **Approved Resolution**: Evidence-based outcome determination
  - **Administrative Override**: Platform administrator decision
  - **Emergency Resolution**: Crisis management resolution

#### Fee Distribution
- **Platform Fee**: 1% of total market value
- **Creator Incentive**: 2% for approved evidence-based resolutions
- **Transparent Structure**: Clear fee allocation and distribution

### Payout System

#### Winnings Distribution
- **`claimWinnings(...)`**: Proportional payout based on winning outcome stakes
- **Calculation Method**: Stake-weighted distribution after fee deduction
- **Statistics Integration**: Automatic performance metric updates
- **Security**: Verified claim validation and fraud prevention

---

## Administrative Framework

### Platform Controls
- **`pauseContract()`** / **`unpauseContract()`**: Emergency platform management
- **`updatePlatformFee(...)`**: Dynamic fee structure adjustment
- **`withdrawPlatformFees(...)`**: Revenue collection and management

### Governance System
- **Administrative Transfer Protocol**:
  - **AdminTransferProposed**: Proposed ownership transition
  - **AdminTransferred**: Completed ownership change
- **Multi-signature Security**: Enhanced administrative security measures

---

## Query and Analytics API

### Platform Analytics
- **`getPlatformStats()`**: Comprehensive platform performance metrics
- **`getAllMarkets()`**: Complete market directory
- **`getActiveMarkets()`**: Current active market listings

### User Analytics
- **`getMarketsByCreator(...)`**: Creator-specific market portfolios
- **`getUserProfile(...)`**: Individual user account information
- **Vault Balance Queries**: Real-time balance and earnings tracking
- **Performance Metrics**: ROI calculations and historical performance

---

## Event System

### Comprehensive Event Logging
```
ContractInitialized          // Platform deployment
MarketCreated               // New market activation
SharesPurchased             // Bet placement confirmation
MarketResolved              // Outcome determination
WinningsClaimed             // Payout distribution
UserRegistered              // Account creation
ReferralCodeGenerated       // Referral system activation
EvidenceSubmitted           // Resolution evidence filing
EvidenceRejected            // Evidence validation failure
MarketStatusChanged         // Status transition tracking
CreatorIncentivePaid        // Creator reward distribution
PlatformFeesWithdrawn       // Revenue collection
AdminTransferProposed       // Governance transition initiation
AdminTransferred            // Governance transition completion
MarketCreationFeeUpdated    // Fee structure modification
ContractUpgraded            // Platform enhancement deployment
```

---

## Use Case Examples

### Sports Market Example: Super Bowl Prediction
**Market**: "Will the Kansas City Chiefs win Super Bowl 2026?"
- **Participant Bob**: 50 FLOW on "Yes"
- **Participant Charlie**: 30 FLOW on "No"
- **Resolution**: Alice submits evidence → Admin approval → Option A wins
- **Outcome**: Bob receives 77.6 FLOW (after fee deduction)

### Cryptocurrency Market Example: Bitcoin Price Prediction
**Market**: "Will Bitcoin exceed $100,000 by December 31, 2025?"
- **Participant Dave**: 100 FLOW on "Yes"
- **Participant Eve**: 50 FLOW on "No"
- **Resolution**: Initial evidence rejection → Resubmission → Administrative override to Option A
- **Outcome**: Dave receives 145.5 FLOW

### Cancelled Market Example: Weather Prediction
**Market**: "Will it snow in New York City on Christmas Day?"
- **Resolution**: Administrative cancellation due to unverifiable data sources
- **Outcome**: Full participant refunds (Alice and Charlie)

---

## Technical Specifications

### Storage Architecture
| Resource | Storage Path | Public Interface |
|----------|--------------|------------------|
| UserProfile | `/storage/FlowWagerUserProfile` | `/public/FlowWagerUserProfile` |
| UserPositions | `/storage/FlowWagerUserPositions` | `/public/FlowWagerUserPositions` |
| UserStats | `/storage/FlowWagerUserStats` | `/public/FlowWagerUserStats` |
| Admin | `/storage/FlowWagerAdmin` | *Private Access* |

### Security Framework
- **Input Validation**: Comprehensive parameter validation and sanitization
- **Role-Based Access Control**: Granular permission management
- **Contract Pause System**: Emergency platform halt capability
- **Unique Constraint Enforcement**: Username and display name uniqueness
- **Vaulted Asset Architecture**: Market-isolated fund management

---

## Development Roadmap

### Planned Enhancements
- **Smart Contract Upgrade System**: Seamless platform evolution with `UpgradePrepared` and `UpgradeExecuted` events
- **Enhanced Referral Incentives**: Expanded reward structures and engagement mechanisms
- **Multi-Option Markets**: Beyond binary prediction capabilities
- **Conditional Market Logic**: Complex interdependent market relationships
- **Performance Optimization**: Gas efficiency improvements for large-scale markets

---

## Implementation Workflow

### Standard User Journey
1. **Account Registration**: User creates platform account with unique credentials
2. **Market Creation**: User establishes new prediction market with parameters
3. **Participant Engagement**: Community members place FLOW token wagers
4. **Evidence Submission**: Market creator provides resolution documentation
5. **Administrative Resolution**: Platform validates and determines outcome
6. **Payout Distribution**: Winners claim proportional earnings

---

## Legal and Compliance

### Licensing
- **License**: MIT Open Source License
- **Accessibility**: Public blockchain deployment
- **Transparency**: Open-source codebase and auditable smart contracts

### Platform Philosophy
Built for decentralized prediction markets with emphasis on transparency, fairness, and community governance on the Flow blockchain ecosystem.

---

## Community and Contributions

### Development Participation
- **Open Source**: Public repository access and contribution opportunities
- **Issue Reporting**: Community-driven bug reporting and feature requests
- **Feature Proposals**: Collaborative enhancement and new market type development
- **Code Reviews**: Peer review system for platform improvements

### Community Engagement
Join our mission to advance decentralized prediction markets through collaborative development and innovative blockchain technology implementation.

---

*For technical support, implementation guidance, or partnership inquiries, please refer to our official documentation and community channels.*