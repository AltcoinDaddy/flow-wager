# 🔗 FlowUpdate Contract Integration Guide

## Overview

This guide covers how to integrate the **FlowUpdate contract** with your Flow Wager app. FlowUpdate is your multi-option prediction market contract that supports 2-10 options per market.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Available Transactions](#available-transactions)
3. [Available Scripts](#available-scripts)
4. [Integration Steps](#integration-steps)
5. [Component Implementation](#component-implementation)
6. [Hook Examples](#hook-examples)
7. [TypeScript Types](#typescript-types)
8. [Error Handling](#error-handling)
9. [Testing Guide](#testing-guide)
10. [Deployment Checklist](#deployment-checklist)

---

## Architecture Overview

### Contract Structure

```
FlowUpdate Contract
├── Enums
│   ├── MultiMarketCategory (Sports, Politics, Entertainment, etc.)
│   └── MultiMarketStatus (Active, Paused, Resolved, Cancelled)
├── Structs
│   ├── MultiOptionMarket (market data)
│   ├── MultiOptionPosition (user positions)
│   └── BatchBet (for batch betting)
├── Resources
│   ├── Admin (contract management)
│   └── MultiOptionPositions (user positions holder)
└── Public Functions
    ├── createMultiOptionMarket()
    ├── placeBet()
    ├── placeBatchBets()
    ├── resolveMarket()
    ├── claimWinnings()
    ├── getMarket()
    ├── getActiveMarkets()
    └── getContractStats()
```

### Data Flow

```
User → Form → Transaction → FlowUpdate Contract → Flow Blockchain
  ↓       ↓        ↓              ↓                    ↓
Input  Validate  Execute    Update State        Emit Events
  ↓       ↓        ↓              ↓                    ↓
Query ← Script ← Return ← Contract Storage ← Indexed
```

---

## Available Transactions

### 1. Setup Account (`flowupdate_setup_account.cdc`)

**Purpose**: Initialize user account for FlowUpdate participation

**Usage**:
```typescript
import { setupFlowUpdateAccount } from '@/lib/flowupdate-scripts';

const transactionId = await fcl.mutate({
  cadence: await setupFlowUpdateAccount(),
  args: (arg, t) => [],
  proposer: fcl.authz,
  payer: fcl.authz,
  authorizations: [fcl.authz],
  limit: 1000,
});
```

**What it does**:
- Creates MultiOptionPositions resource in user's account
- Sets up storage and public capabilities
- Initializes user for betting

### 2. Create Market (`flowupdate_create_market.cdc`)

**Purpose**: Create a new multi-option market

**Parameters**:
```typescript
{
  title: String,                    // Market question
  description: String,              // Detailed description
  category: UInt8,                  // 0-5 (Sports, Politics, etc.)
  options: [String],                // 2-10 option texts
  endTime: UFix64,                  // Unix timestamp
  minBet: UFix64,                   // Minimum bet amount
  maxBet: UFix64,                   // Maximum bet amount
  imageUrl: String,                 // Market image URL
  creationFeeAmount: UFix64?        // Optional creation fee
}
```

**Usage** (already integrated in your form):
```typescript
const transactionId = await fcl.mutate({
  cadence: transactionScript,
  args: (arg, t) => [
    arg(marketData.question, t.String),
    arg(marketData.description, t.String),
    arg(marketData.category.toString(), t.UInt8),
    arg(marketData.options, t.Array(t.String)),
    arg(marketData.endTime.toFixed(1), t.UFix64),
    arg(marketData.minBet.toFixed(8), t.UFix64),
    arg(marketData.maxBet.toFixed(8), t.UFix64),
    arg(marketData.imageURI || "", t.String),
    arg(null, t.Optional(t.UFix64)),
  ],
  proposer: authorization,
  payer: authorization,
  authorizations: [authorization],
  limit: 1000,
});
```

### 3. Place Bet (`flowupdate_place_bet.cdc`)

**Purpose**: Place a single bet on a market option

**Parameters**:
```typescript
{
  marketId: UInt64,           // Market ID
  optionIndex: UInt8,         // Option to bet on (0-9)
  amount: UFix64              // Bet amount
}
```

**Usage**:
```typescript
const transactionId = await fcl.mutate({
  cadence: await getPlaceBetTransaction(),
  args: (arg, t) => [
    arg(marketId.toString(), t.UInt64),
    arg(optionIndex.toString(), t.UInt8),
    arg(betAmount.toFixed(8), t.UFix64),
  ],
  proposer: fcl.authz,
  payer: fcl.authz,
  authorizations: [fcl.authz],
  limit: 1000,
});
```

### 4. Place Batch Bets (`flowupdate_place_batch_bets.cdc`)

**Purpose**: Place multiple bets in one transaction

**Parameters**:
```typescript
{
  marketId: UInt64,
  bets: [
    {
      optionIndex: UInt8,
      amount: UFix64
    }
  ]
}
```

**Usage**:
```typescript
const betsArray = [
  { optionIndex: 0, amount: 10.0 },
  { optionIndex: 1, amount: 5.0 },
  { optionIndex: 2, amount: 15.0 }
];

const transactionId = await fcl.mutate({
  cadence: await getPlaceBatchBetsTransaction(),
  args: (arg, t) => [
    arg(marketId.toString(), t.UInt64),
    arg(
      betsArray.map(bet => ({
        optionIndex: parseInt(bet.optionIndex),
        amount: parseFloat(bet.amount)
      })),
      t.Array(t.Struct('BatchBet', [
        { key: 'optionIndex', type: t.UInt8 },
        { key: 'amount', type: t.UFix64 }
      ]))
    ),
  ],
  proposer: fcl.authz,
  payer: fcl.authz,
  authorizations: [fcl.authz],
  limit: 1000,
});
```

### 5. Resolve Market (`flowupdate_admin_resolve_market.cdc`)

**Purpose**: Resolve a market (admin only)

**Parameters**:
```typescript
{
  marketId: UInt64,
  winningOption: UInt8,
  justification: String
}
```

**Usage** (Admin only):
```typescript
const transactionId = await fcl.mutate({
  cadence: await getResolveMarketTransaction(),
  args: (arg, t) => [
    arg(marketId.toString(), t.UInt64),
    arg(winningOption.toString(), t.UInt8),
    arg(justification, t.String),
  ],
  proposer: fcl.authz,
  payer: fcl.authz,
  authorizations: [fcl.authz],
  limit: 1000,
});
```

### 6. Pause Contract (`flowupdate_admin_pause_contract.cdc`)

**Purpose**: Pause contract (admin only)

**Usage**:
```typescript
const transactionId = await fcl.mutate({
  cadence: await getPauseContractTransaction(),
  args: (arg, t) => [],
  proposer: fcl.authz,
  payer: fcl.authz,
  authorizations: [fcl.authz],
  limit: 1000,
});
```

---

## Available Scripts

### 1. Get Market (`flowupdate_get_market.cdc`)

**Purpose**: Fetch single market details

**Returns**:
```typescript
{
  id: UInt64,
  title: String,
  description: String,
  category: UInt8,
  options: [String],
  creator: Address,
  createdAt: UFix64,
  endTime: UFix64,
  minBet: UFix64,
  maxBet: UFix64,
  status: UInt8,
  resolved: Bool,
  winningOption: UInt8?,
  totalShares: [UFix64],
  totalPool: UFix64,
  imageUrl: String,
  maxOptions: UInt8
}
```

**Usage**:
```typescript
const market = await fcl.query({
  cadence: await getGetMarketScript(),
  args: (arg, t) => [arg(marketId.toString(), t.UInt64)]
});
```

### 2. Get Active Markets (`flowupdate_get_active_markets.cdc`)

**Purpose**: Fetch all active markets

**Returns**: Dictionary of markets by ID

**Usage**:
```typescript
const markets = await fcl.query({
  cadence: await getGetActiveMarketsScript(),
  args: (arg, t) => []
});
```

### 3. Get User Positions (`flowupdate_get_user_positions.cdc`)

**Purpose**: Fetch user's positions in markets

**Returns**:
```typescript
{
  [marketId: UInt64]: {
    marketId: UInt64,
    optionShares: [UFix64],
    totalInvested: UFix64,
    claimed: Bool,
    createdAt: UFix64
  }
}
```

**Usage**:
```typescript
const positions = await fcl.query({
  cadence: await getGetUserPositionsScript(),
  args: (arg, t) => [arg(userAddress, t.Address)]
});
```

### 4. Calculate Winnings (`flowupdate_calculate_winnings.cdc`)

**Purpose**: Calculate potential winnings for a position

**Returns**: UFix64 (winning amount)

**Usage**:
```typescript
const winnings = await fcl.query({
  cadence: await getCalculateWinningsScript(),
  args: (arg, t) => [
    arg(marketId.toString(), t.UInt64),
    arg(userAddress, t.Address),
    arg(winningOption.toString(), t.UInt8)
  ]
});
```

### 5. Get Contract Stats (`flowupdate_get_contract_stats.cdc`)

**Purpose**: Fetch overall contract statistics

**Returns**:
```typescript
{
  totalMarkets: UInt64,
  activeMarkets: UInt64,
  resolvedMarkets: UInt64,
  totalVolume: UFix64,
  platformFees: UFix64
}
```

**Usage**:
```typescript
const stats = await fcl.query({
  cadence: await getGetContractStatsScript(),
  args: (arg, t) => []
});
```

---

## Integration Steps

### Step 1: Create FlowUpdate Scripts Manager

**File**: `src/lib/flowupdate-scripts.ts`

```typescript
import * as fcl from "@onflow/fcl";

export const getFlowUpdateAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOWUPDATE_ADDRESS || "0x24225e374dfffb2b"
    : process.env.NEXT_PUBLIC_FLOWUPDATE_ADDRESS || "0x24225e374dfffb2b";
};

export const getFlowTokenAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOW_MAINNET_TOKEN || "0x1654653399040a61"
    : process.env.NEXT_PUBLIC_FLOW_TESTNET_TOKEN || "0x7e60df042a9c0868";
};

export const getFungibleTokenAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_MAINNET_TOKEN || "0xf233dcee88fe0abe"
    : process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_TESTNET_TOKEN || "0x9a0766d93b6608b7";
};

// Transaction Scripts
export const setupFlowUpdateAccount = async () => `
  import FlowUpdate from ${getFlowUpdateAddress()}
  
  transaction {
    prepare(signer: auth(Storage, Capabilities) &Account) {
      let positions <- FlowUpdate.createMultiOptionPositions()
      signer.storage.save(<-positions, to: /storage/flowUpdatePositions)
      
      let cap = signer.capabilities.storage.issue<&FlowUpdate.MultiOptionPositions>(
        /storage/flowUpdatePositions
      )
      signer.capabilities.publish(cap, at: /public/flowUpdatePositions)
    }
  }
`;

export const getPlaceBetTransaction = async () => `
  import FlowUpdate from ${getFlowUpdateAddress()}
  import FlowToken from ${getFlowTokenAddress()}
  import FungibleToken from ${getFungibleTokenAddress()}
  
  transaction(marketId: UInt64, optionIndex: UInt8, amount: UFix64) {
    let vault: @FlowToken.Vault
    
    prepare(signer: auth(Storage) &Account) {
      let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
        from: /storage/flowTokenVault
      ) ?? panic("Could not borrow vault")
      
      self.vault <- vaultRef.withdraw(amount: amount) as! @FlowToken.Vault
    }
    
    execute {
      FlowUpdate.placeBet(
        marketId: marketId,
        optionIndex: optionIndex,
        vault: <-self.vault,
        address: signer.address
      )
    }
  }
`;

export const getPlaceBatchBetsTransaction = async () => `
  import FlowUpdate from ${getFlowUpdateAddress()}
  import FlowToken from ${getFlowTokenAddress()}
  import FungibleToken from ${getFungibleTokenAddress()}
  
  transaction(marketId: UInt64, bets: [FlowUpdate.BatchBet], totalAmount: UFix64) {
    let vault: @FlowToken.Vault
    
    prepare(signer: auth(Storage) &Account) {
      let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
        from: /storage/flowTokenVault
      ) ?? panic("Could not borrow vault")
      
      self.vault <- vaultRef.withdraw(amount: totalAmount) as! @FlowToken.Vault
    }
    
    execute {
      FlowUpdate.placeBatchBets(
        marketId: marketId,
        bets: bets,
        vault: <-self.vault,
        address: signer.address
      )
    }
  }
`;

export const getResolveMarketTransaction = async () => `
  import FlowUpdate from ${getFlowUpdateAddress()}
  
  transaction(marketId: UInt64, winningOption: UInt8, justification: String) {
    prepare(signer: auth(Storage) &Account) {
      let adminRef = signer.storage.borrow<&FlowUpdate.Admin>(
        from: /storage/flowUpdateAdmin
      ) ?? panic("Could not borrow admin")
      
      adminRef.resolveMarket(marketId: marketId, winningOption: winningOption, justification: justification)
    }
  }
`;

// Query Scripts
export const getGetMarketScript = async () => `
  import FlowUpdate from ${getFlowUpdateAddress()}
  
  access(all) fun main(marketId: UInt64): FlowUpdate.MultiOptionMarket? {
    return FlowUpdate.getMarket(marketId: marketId)
  }
`;

export const getGetActiveMarketsScript = async () => `
  import FlowUpdate from ${getFlowUpdateAddress()}
  
  access(all) fun main(): {UInt64: FlowUpdate.MultiOptionMarket} {
    return FlowUpdate.getActiveMarkets()
  }
`;

export const getGetUserPositionsScript = async () => `
  import FlowUpdate from ${getFlowUpdateAddress()}
  
  access(all) fun main(userAddress: Address): {UInt64: FlowUpdate.MultiOptionPosition}? {
    let account = getAccount(userAddress)
    let posRef = account.capabilities.borrow<&FlowUpdate.MultiOptionPositions>(
      /public/flowUpdatePositions
    ) ?? return nil
    
    return posRef.getAllPositions()
  }
`;

export const getCalculateWinningsScript = async () => `
  import FlowUpdate from ${getFlowUpdateAddress()}
  
  access(all) fun main(marketId: UInt64, userAddress: Address, winningOption: UInt8): UFix64 {
    return FlowUpdate.calculatePotentialWinnings(
      marketId: marketId,
      userAddress: userAddress,
      winningOption: winningOption
    )
  }
`;

export const getGetContractStatsScript = async () => `
  import FlowUpdate from ${getFlowUpdateAddress()}
  
  access(all) fun main(): {String: AnyStruct} {
    return FlowUpdate.getContractStats()
  }
`;
```

### Step 2: Create TypeScript Types

**File**: `src/types/flowupdate.ts`

```typescript
export enum MultiMarketCategory {
  Sports = 0,
  Politics = 1,
  Entertainment = 2,
  Crypto = 3,
  Finance = 4,
  Other = 5,
}

export enum MultiMarketStatus {
  Active = 0,
  Paused = 1,
  Resolved = 2,
  Cancelled = 3,
}

export interface MultiOptionMarket {
  id: string;
  title: string;
  description: string;
  category: MultiMarketCategory;
  options: string[];
  creator: string;
  createdAt: string;
  endTime: string;
  minBet: string;
  maxBet: string;
  status: MultiMarketStatus;
  resolved: boolean;
  winningOption: number | null;
  totalShares: string[];
  totalPool: string;
  imageUrl: string;
  maxOptions: number;
}

export interface MultiOptionPosition {
  marketId: string;
  optionShares: string[];
  totalInvested: string;
  claimed: boolean;
  createdAt: string;
}

export interface BatchBet {
  optionIndex: number;
  amount: string;
}

export interface ContractStats {
  totalMarkets: string;
  activeMarkets: string;
  resolvedMarkets: string;
  totalVolume: string;
  platformFees: string;
}
```

### Step 3: Create Custom Hooks

**File**: `src/hooks/useFlowUpdate.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import { toast } from 'sonner';
import {
  getGetMarketScript,
  getGetActiveMarketsScript,
  getGetUserPositionsScript,
  getCalculateWinningsScript,
  getGetContractStatsScript,
  getPlaceBetTransaction,
  getPlaceBatchBetsTransaction,
  getResolveMarketTransaction,
} from '@/lib/flowupdate-scripts';
import {
  MultiOptionMarket,
  MultiOptionPosition,
  ContractStats,
  BatchBet,
} from '@/types/flowupdate';

export const useFlowUpdate = (userAddress?: string) => {
  const [market, setMarket] = useState<MultiOptionMarket | null>(null);
  const [markets, setMarkets] = useState<MultiOptionMarket[]>([]);
  const [positions, setPositions] = useState<Record<string, MultiOptionPosition>>({});
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch single market
  const fetchMarket = useCallback(async (marketId: string) => {
    try {
      setLoading(true);
      const script = await getGetMarketScript();
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(marketId, t.UInt64)],
      });
      setMarket(transformMarket(result));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch market';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all active markets
  const fetchActiveMarkets = useCallback(async () => {
    try {
      setLoading(true);
      const script = await getGetActiveMarketsScript();
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [],
      });
      const marketList = Object.values(result || {}).map(transformMarket);
      setMarkets(marketList);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch markets';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user positions
  const fetchUserPositions = useCallback(async (address: string) => {
    try {
      setLoading(true);
      const script = await getGetUserPositionsScript();
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(address, t.Address)],
      });
      setPositions(result || {});
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch positions';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch contract stats
  const fetchContractStats = useCallback(async () => {
    try {
      const script = await getGetContractStatsScript();
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [],
      });
      setStats(result as ContractStats);
    } catch (err) {
      console.error('Failed to fetch contract stats:', err);
    }
  }, []);

  // Place bet
  const placeBet = useCallback(
    async (marketId: string, optionIndex: number, amount: string) => {
      try {
        setLoading(true);
        const cadence = await getPlaceBetTransaction();
        const transactionId = await fcl.mutate({
          cadence,
          args: (arg, t) => [
            arg(marketId, t.UInt64),
            arg(optionIndex.toString(), t.UInt8),
            arg(parseFloat(amount).toFixed(8), t.UFix64),
          ],
          proposer: fcl.authz,
          payer: fcl.authz,
          authorizations: [fcl.authz],
          limit: 1000,
        });

        await fcl.tx(transactionId).onceSealed();
        toast.success('Bet placed successfully!');
        
        if (userAddress) {
          await fetchUserPositions(userAddress);
        }
        
        return transactionId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to place bet';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userAddress, fetchUserPositions]
  );

  // Place batch bets
  const placeBatchBets = useCallback(
    async (marketId: string, bets: BatchBet[]) => {
      try {
        setLoading(true);
        const totalAmount = bets
          .reduce((sum, bet) => sum + parseFloat(bet.amount), 0)
          .toFixed(8);

        const cadence = await getPlaceBatchBetsTransaction();
        const transactionId = await fcl.mutate({
          cadence,
          args: (arg, t) => [
            arg(marketId, t.UInt64),
            arg(
              bets.map(b => ({
                optionIndex: b.optionIndex,
                amount: parseFloat(b.amount).toFixed(8),
              })),
              t.Array(t.Struct('BatchBet'))
            ),
            arg(totalAmount, t.UFix64),
          ],
          proposer: fcl.authz,
          payer: fcl.authz,
          authorizations: [fcl.authz],
          limit: 1000,
        });

        await fcl.tx(transactionId).onceSealed();
        toast.success('Batch bets placed successfully!');
        
        if (userAddress) {
          await fetchUserPositions(userAddress);
        }
        
        return transactionId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to place batch bets';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userAddress, fetchUserPositions]
  );

  return {
    market,
    markets,
    positions,
    stats,
    loading,
    error,
    fetchMarket,
    fetchActiveMarkets,
    fetchUserPositions,
    fetchContractStats,
    placeBet,
    placeBatchBets,
  };
};

// Helper functions
function transformMarket(raw: any): MultiOptionMarket {
  return {
    id: raw.id.toString(),
    title: raw.title,
    description: raw.description,
    category: raw.category,
    options: raw.options,
    creator: raw.creator,
    createdAt: raw.createdAt.toString(),
    endTime: raw.endTime.toString(),
    minBet: raw.minBet.toString(),
    maxBet: raw.maxBet.toString(),
    status: raw.status,
    resolved: raw.resolved,
    winningOption: raw.winningOption,
    totalShares: raw.totalShares.map((s: any) => s.toString()),
    totalPool: raw.totalPool.toString(),
    imageUrl: raw.imageUrl,
    maxOptions: raw.maxOptions,
  };
}
```

---

## Component Implementation

### Betting Component

```typescript
// src/components/markets/place-bet.tsx

import { useState } from 'react';
import { useFlowUpdate } from '@/hooks/useFlowUpdate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PlaceBetProps {
  marketId: string;
  options: string[];
  minBet: string;
  maxBet: string;
}

export function PlaceBet({ marketId, options, minBet, maxBet }: PlaceBetProps) {
  const { placeBet, loading } = useFlowUpdate();
  const [selectedOption, setSelectedOption] = useState<string>('0');
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    if (!amount) return;
    
    await placeBet(marketId, parseInt(selectedOption), amount);
    setAmount('');
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Select Option</Label>
        <Select value={selectedOption} onValueChange={setSelectedOption}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option, idx) => (
              <SelectItem key={idx} value={idx.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Bet Amount (FLOW)</Label>
        <Input
          type="number"
          min={parseFloat(minBet)}
          max={parseFloat(maxBet)}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`${minBet} - ${maxBet}`}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !amount}
        className="w-full"
      >
        {loading ? 'Placing Bet...' : 'Place Bet'}
      </Button>
    </div>
  );
}
```

### Markets List Component

```typescript
// src/components/markets/markets-list.tsx

import { useEffect } from 'react';
import { useFlowUpdate } from '@/hooks/useFlowUpdate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function MarketsList() {
  const { markets, loading, fetchActiveMarkets } = useFlowUpdate();

  useEffect(() => {
    fetchActiveMarkets();
  }, [fetchActiveMarkets]);

  return (
    <div className="space-y-4">
      {loading && <p>Loading markets...</p>}
      
      {markets.map((market) => (
        <Card key={market.id}>
          <CardHeader>
            <CardTitle>{market.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{market.description}</p>
            
            <div className="space-y-2">
              <p className="font-medium">Options:</p>
              <div className="flex flex-wrap gap-2">
                {market.options.map((option, idx) => (
                  <Badge key={idx} variant="outline">
                    {option}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Bet Range</p>
                <p className="font-semibold">{market.minBet} - {market.maxBet} FLOW</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Pool</p>
                <p className="font-semibold">{market.totalPool} FLOW</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

## Hook Examples

### useMarketDetail Hook

```typescript
import { useState, useCallback, useEffect } from 'react';
import { useFlowUpdate } from '@/hooks/useFlowUpdate';
import { MultiOptionMarket, MultiOptionPosition } from '@/types/flowupdate';

export const useMarketDetail = (marketId: string, userAddress?: string) => {
  const { fetchMarket, fetchUserPositions, market, positions } = useFlowUpdate(userAddress);
  const [userPosition, setUserPosition] = useState<MultiOptionPosition | null>(null);

  useEffect(() => {
    if (marketId) {
      fetchMarket(marketId);
    }
  }, [marketId, fetchMarket]);

  useEffect(() => {
    if (userAddress) {
      fetchUserPositions(userAddress);
    }
  }, [userAddress, fetchUserPositions]);

  useEffect(() => {
    if (positions && marketId in positions) {
      setUserPosition(positions[marketId]);
    }
  }, [positions, marketId]);

  return {
    market,
    userPosition,
    loading: !market,
  };
};
```

---

## TypeScript Types

See `src/types/flowupdate.ts` above for complete type definitions.

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Could not borrow vault" | User hasn't set up FLOW vault | Run setup transaction |
| "Market does not exist" | Invalid market ID | Verify market ID |
| "Insufficient funds" | Bet amount exceeds balance | Reduce bet amount |
| "Market is paused" | Contract paused by admin | Wait for unpause |
| "Market already resolved" | Market concluded | Market no longer active |

### Error Handling Pattern

```typescript
try {
  await placeBet(marketId, optionIndex, amount);
  toast.success('Bet placed!');
} catch (error) {
  if (error.message.includes('insufficient')) {
    toast.error('Insufficient FLOW balance');
  } else if (error.message.includes('paused')) {
    toast.error('Contract is currently paused');
  } else {
    toast.error('Transaction failed. Please try again.');
  }
}
```

---

## Testing Guide

### Unit Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import { useFlowUpdate } from '@/hooks/useFlowUpdate';

describe('useFlowUpdate', () => {
  it('should fetch markets', async () => {
    const { result } = renderHook(() => useFlowUpdate());

    await act(async () => {
      await result.current.fetchActiveMarkets();
    });

    expect(result.current.markets.length).toBeGreaterThan(0);
  });

  it('should place a bet', async () => {
    const { result } = renderHook(() => useFlowUpdate());

    const txId = await act(async () => {
      return await result.current.placeBet('1', 0, '10');
    });

    expect(txId).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// Test full flow: fetch market → place bet → check position

test('full betting flow', async () => {
  // 1. Fetch market
  const market = await fetchMarket('1');
  expect(market).toBeDefined();

  // 2. Place bet
  const txId = await placeBet('1', 0, '10');
  expect(txId).toBeDefined();

  // 3. Check position
  const positions = await fetchUserPositions(userAddress);
  expect(positions['1']).toBeDefined();
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Contract deployed to Flow network
- [ ] Contract address updated in environment variables
- [ ] All transactions tested locally
- [ ] All queries tested locally
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Toast notifications configured

### Environment Variables

```
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOWUPDATE_ADDRESS=0x24225e374dfffb2b
NEXT_PUBLIC_FLOW_TESTNET_TOKEN=0x7e60df042a9c0868
NEXT_PUBLIC_FLOW_FUNGIBLE_TESTNET_TOKEN=0x9a0766d93b6608b7
```

### Testing on Testnet

- [ ] Create test market
- [ ] Place single bet
- [ ] Place batch bets
- [ ] Resolve market
- [ ] Claim winnings
- [ ] Check user positions
- [ ] Check contract stats

### Production Deployment

- [ ] Code review complete
- [ ] All tests passing
- [ ] Gas limits optimized
- [ ] Error messages user-friendly
- [ ] Monitoring set up
- [ ] Rollback plan ready

---

## Transaction Event Monitoring

### Listen to Market Created Events

```typescript
import * as fcl from '@onflow/fcl';

fcl.events()
  .subscribe(event => {
    if (event.type.includes('MultiOptionMarketCreated')) {
      console.log('New market:', event.data);
      // Refresh markets list
    }
  });
```

### Listen to Bet Placed Events

```typescript
fcl.events()
  .subscribe(event => {
    if (event.type.includes('MultiOptionBetPlaced')) {
      console.log('Bet placed:', event.data);
      // Update UI
    }
  });
```

---

## Performance Optimization

### Caching Markets

```typescript
const cache = new Map<string, MultiOptionMarket>();

export const fetchMarketCached = async (marketId: string) => {
  if (cache.has(marketId)) {
    return cache.get(marketId);
  }

  const market = await fetchMarket(marketId);
  cache.set(marketId, market);
  return market;
};
```

### Batch Queries

```typescript
// Instead of fetching each market individually
const marketIds = ['1', '2', '3'];

// Fetch all at once
const markets = await Promise.all(
  marketIds.map(id => fetchMarket(id))
);
```

---

## Next Steps

1. **Create Scripts Manager** → Implement `flowupdate-scripts.ts`
2. **Define Types** → Add types to `flowupdate.ts`
3. **Create Hooks** → Implement `useFlowUpdate.ts`
4. **Build Components** → Create betting and market components
5. **Add Tests** → Write unit and integration tests
6. **Deploy** → Follow deployment checklist
7. **Monitor** → Set up event listeners and analytics

---

## Resources

- [Flow Documentation](https://docs.onflow.org)
- [FCL Documentation](https://github.com/onflow/flow-js-sdk)
- [Cadence Guide](https://cadence-lang.org)
- [FlowUpdate Contract](./flow-wager/cadence/contracts/FlowUpdate.cdc)

---

**Version**: 1.0  
**Status**: Ready for Integration  
**Last Updated**: October 2024