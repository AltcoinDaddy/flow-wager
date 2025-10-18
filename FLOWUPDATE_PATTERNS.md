# FlowUpdate Integration Patterns & Examples

## Quick Integration Patterns

### Pattern 1: Simple Market Listing

```typescript
// src/pages/markets.tsx
import { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import { getGetActiveMarketsScript } from '@/lib/flowupdate-scripts';
import { MultiOptionMarket } from '@/types/flowupdate';

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MultiOptionMarket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMarkets = async () => {
      try {
        const script = await getGetActiveMarketsScript();
        const result = await fcl.query({
          cadence: script,
          args: (arg, t) => []
        });
        
        const marketList = Object.entries(result || {}).map(([_, market]: any) => ({
          id: market.id.toString(),
          title: market.title,
          description: market.description,
          options: market.options,
          totalPool: market.totalPool.toString(),
          endTime: market.endTime.toString(),
          // ... map other fields
        }));
        
        setMarkets(marketList);
      } catch (error) {
        console.error('Failed to load markets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMarkets();
  }, []);

  if (loading) return <div>Loading markets...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map(market => (
        <div key={market.id} className="border p-4 rounded">
          <h3>{market.title}</h3>
          <p className="text-sm text-gray-600">{market.description}</p>
          <div className="mt-4 space-y-2">
            {market.options.map((option, idx) => (
              <button 
                key={idx}
                className="w-full p-2 border rounded hover:bg-gray-50"
              >
                {option}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold">Pool: {market.totalPool} FLOW</p>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 2: Bet Placement with Validation

```typescript
// src/components/BetForm.tsx
import { useState } from 'react';
import * as fcl from '@onflow/fcl';
import { getPlaceBetTransaction } from '@/lib/flowupdate-scripts';
import { toast } from 'sonner';

interface BetFormProps {
  marketId: string;
  options: string[];
  minBet: number;
  maxBet: number;
  onSuccess?: () => void;
}

export function BetForm({ marketId, options, minBet, maxBet, onSuccess }: BetFormProps) {
  const [selectedOption, setSelectedOption] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const validateBet = () => {
    const betAmount = parseFloat(amount);
    
    if (isNaN(betAmount)) {
      toast.error('Please enter a valid amount');
      return false;
    }
    
    if (betAmount < minBet) {
      toast.error(`Minimum bet is ${minBet} FLOW`);
      return false;
    }
    
    if (betAmount > maxBet) {
      toast.error(`Maximum bet is ${maxBet} FLOW`);
      return false;
    }
    
    return true;
  };

  const handlePlaceBet = async () => {
    if (!validateBet()) return;

    setLoading(true);
    try {
      const cadence = await getPlaceBetTransaction();
      const transactionId = await fcl.mutate({
        cadence,
        args: (arg, t) => [
          arg(marketId, t.UInt64),
          arg(selectedOption.toString(), t.UInt8),
          arg(parseFloat(amount).toFixed(8), t.UFix64),
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000,
      });

      // Wait for transaction to seal
      const tx = await fcl.tx(transactionId).onceSealed();
      
      if (tx.status === 4) {
        toast.success('Bet placed successfully!');
        setAmount('');
        onSuccess?.();
      } else {
        toast.error('Transaction failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to place bet';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded">
      <div>
        <label className="block text-sm font-medium mb-2">Select Option</label>
        <select 
          value={selectedOption} 
          onChange={(e) => setSelectedOption(parseInt(e.target.value))}
          className="w-full p-2 border rounded"
        >
          {options.map((option, idx) => (
            <option key={idx} value={idx}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Bet Amount (FLOW) - Min: {minBet}, Max: {maxBet}
        </label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          min={minBet}
          max={maxBet}
          step="0.01"
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={handlePlaceBet}
        disabled={loading || !amount}
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Placing Bet...' : 'Place Bet'}
      </button>
    </div>
  );
}
```

### Pattern 3: User Positions Display

```typescript
// src/components/UserPositions.tsx
import { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import { getGetUserPositionsScript } from '@/lib/flowupdate-scripts';
import { MultiOptionPosition } from '@/types/flowupdate';

interface UserPositionsProps {
  userAddress: string;
}

export function UserPositions({ userAddress }: UserPositionsProps) {
  const [positions, setPositions] = useState<Record<string, MultiOptionPosition>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPositions = async () => {
      try {
        const script = await getGetUserPositionsScript();
        const result = await fcl.query({
          cadence: script,
          args: (arg, t) => [arg(userAddress, t.Address)]
        });
        setPositions(result || {});
      } catch (error) {
        console.error('Failed to load positions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userAddress) {
      loadPositions();
    }
  }, [userAddress]);

  if (loading) return <div>Loading positions...</div>;
  if (Object.keys(positions).length === 0) return <div>No positions yet</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your Positions</h2>
      {Object.entries(positions).map(([marketId, position]) => (
        <div key={marketId} className="p-4 border rounded">
          <p className="font-medium">Market {marketId}</p>
          <p className="text-sm text-gray-600">Invested: {position.totalInvested} FLOW</p>
          <div className="mt-2">
            <p className="text-sm font-medium">Shares per option:</p>
            <ul className="text-sm text-gray-600 mt-1">
              {position.optionShares.map((shares, idx) => (
                <li key={idx}>Option {idx}: {shares} shares</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Pattern 4: Market Details with Real-time Updates

```typescript
// src/pages/market/[id].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import { getGetMarketScript } from '@/lib/flowupdate-scripts';
import { MultiOptionMarket } from '@/types/flowupdate';
import { BetForm } from '@/components/BetForm';

export default function MarketDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [market, setMarket] = useState<MultiOptionMarket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadMarket = async () => {
      try {
        const script = await getGetMarketScript();
        const result = await fcl.query({
          cadence: script,
          args: (arg, t) => [arg(id as string, t.UInt64)]
        });
        
        if (result) {
          setMarket({
            id: result.id.toString(),
            title: result.title,
            description: result.description,
            category: result.category,
            options: result.options,
            creator: result.creator,
            createdAt: result.createdAt.toString(),
            endTime: result.endTime.toString(),
            minBet: result.minBet.toString(),
            maxBet: result.maxBet.toString(),
            status: result.status,
            resolved: result.resolved,
            winningOption: result.winningOption,
            totalShares: result.totalShares.map((s: any) => s.toString()),
            totalPool: result.totalPool.toString(),
            imageUrl: result.imageUrl,
            maxOptions: result.maxOptions,
          });
        }
      } catch (error) {
        console.error('Failed to load market:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMarket();

    // Refresh market every 30 seconds
    const interval = setInterval(loadMarket, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div>Loading market...</div>;
  if (!market) return <div>Market not found</div>;

  const timeRemaining = new Date(parseInt(market.endTime) * 1000).getTime() - Date.now();
  const isEnded = timeRemaining <= 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold mb-4">{market.title}</h1>
          <p className="text-gray-600 mb-4">{market.description}</p>

          {market.imageUrl && (
            <img 
              src={market.imageUrl} 
              alt={market.title}
              className="w-full h-64 object-cover rounded mb-4"
            />
          )}

          <div className="bg-gray-50 p-4 rounded mb-4">
            <h3 className="font-semibold mb-3">Options</h3>
            <div className="space-y-2">
              {market.options.map((option, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border">
                  <span>{option}</span>
                  <div className="text-sm text-gray-600">
                    {market.totalShares[idx]} shares / {market.totalPool} FLOW
                  </div>
                </div>
              ))}
            </div>
          </div>

          {market.resolved && (
            <div className="bg-green-50 p-4 rounded mb-4 border border-green-200">
              <p className="font-semibold text-green-800">
                ✓ Market Resolved: {market.options[market.winningOption!]} Won
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="bg-gray-50 p-4 rounded space-y-3 mb-4">
            <div>
              <p className="text-xs text-gray-600">Ends</p>
              <p className="font-semibold">
                {new Date(parseInt(market.endTime) * 1000).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Pool</p>
              <p className="font-semibold">{market.totalPool} FLOW</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Bet Range</p>
              <p className="font-semibold">{market.minBet} - {market.maxBet} FLOW</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Status</p>
              <p className="font-semibold">
                {market.resolved ? 'Resolved' : isEnded ? 'Ended' : 'Active'}
              </p>
            </div>
          </div>

          {!market.resolved && !isEnded && (
            <BetForm 
              marketId={market.id}
              options={market.options}
              minBet={parseFloat(market.minBet)}
              maxBet={parseFloat(market.maxBet)}
              onSuccess={() => window.location.reload()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

### Pattern 5: Batch Betting

```typescript
// src/components/BatchBetForm.tsx
import { useState } from 'react';
import * as fcl from '@onflow/fcl';
import { getPlaceBatchBetsTransaction } from '@/lib/flowupdate-scripts';
import { BatchBet } from '@/types/flowupdate';
import { toast } from 'sonner';

interface BatchBetFormProps {
  marketId: string;
  options: string[];
  minBet: number;
  maxBet: number;
}

export function BatchBetForm({ marketId, options, minBet, maxBet }: BatchBetFormProps) {
  const [bets, setBets] = useState<BatchBet[]>(
    options.map(() => ({ optionIndex: 0, amount: '0' }))
  );
  const [loading, setLoading] = useState(false);

  const updateBet = (idx: number, amount: string) => {
    const newBets = [...bets];
    newBets[idx] = { optionIndex: idx, amount };
    setBets(newBets);
  };

  const getTotalBet = () => {
    return bets.reduce((sum, bet) => sum + parseFloat(bet.amount || '0'), 0);
  };

  const handleSubmit = async () => {
    const totalAmount = getTotalBet();
    
    if (totalAmount === 0) {
      toast.error('Please enter at least one bet');
      return;
    }

    if (bets.some(b => parseFloat(b.amount) > 0 && parseFloat(b.amount) < minBet)) {
      toast.error(`Minimum bet is ${minBet} FLOW`);
      return;
    }

    if (bets.some(b => parseFloat(b.amount) > maxBet)) {
      toast.error(`Maximum bet is ${maxBet} FLOW`);
      return;
    }

    setLoading(true);
    try {
      const cadence = await getPlaceBatchBetsTransaction();
      const transactionId = await fcl.mutate({
        cadence,
        args: (arg, t) => [
          arg(marketId, t.UInt64),
          arg(
            bets.map(b => ({
              optionIndex: b.optionIndex,
              amount: parseFloat(b.amount || '0').toFixed(8)
            })),
            t.Array(t.Struct('BatchBet'))
          ),
          arg(totalAmount.toFixed(8), t.UFix64),
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000,
      });

      await fcl.tx(transactionId).onceSealed();
      toast.success('Batch bets placed successfully!');
      setBets(options.map(() => ({ optionIndex: 0, amount: '0' })));
    } catch (error) {
      toast.error('Failed to place batch bets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded">
      <h3 className="font-semibold">Place Bets on Multiple Options</h3>
      
      {options.map((option, idx) => (
        <div key={idx} className="space-y-1">
          <label className="text-sm font-medium">{option}</label>
          <input 
            type="number"
            value={bets[idx]?.amount || ''}
            onChange={(e) => updateBet(idx, e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full p-2 border rounded"
          />
        </div>
      ))}

      <div className="bg-gray-50 p-3 rounded">
        <p className="text-sm">Total Bet: <strong>{getTotalBet().toFixed(2)} FLOW</strong></p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || getTotalBet() === 0}
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Placing Bets...' : 'Place Batch Bets'}
      </button>
    </div>
  );
}
```

### Pattern 6: Market Resolution (Admin)

```typescript
// src/components/admin/ResolveMarket.tsx
import { useState } from 'react';
import * as fcl from '@onflow/fcl';
import { getResolveMarketTransaction } from '@/lib/flowupdate-scripts';
import { toast } from 'sonner';

interface ResolveMarketProps {
  marketId: string;
  options: string[];
}

export function ResolveMarket({ marketId, options }: ResolveMarketProps) {
  const [winningOption, setWinningOption] = useState(0);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResolve = async () => {
    if (!justification.trim()) {
      toast.error('Please provide a justification');
      return;
    }

    setLoading(true);
    try {
      const cadence = await getResolveMarketTransaction();
      const transactionId = await fcl.mutate({
        cadence,
        args: (arg, t) => [
          arg(marketId, t.UInt64),
          arg(winningOption.toString(), t.UInt8),
          arg(justification, t.String),
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000,
      });

      await fcl.tx(transactionId).onceSealed();
      toast.success('Market resolved successfully!');
    } catch (error) {
      toast.error('Failed to resolve market');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded bg-yellow-50">
      <h3 className="font-semibold">Resolve Market (Admin)</h3>
      
      <div>
        <label className="block text-sm font-medium mb-2">Winning Option</label>
        <select 
          value={winningOption}
          onChange={(e) => setWinningOption(parseInt(e.target.value))}
          className="w-full p-2 border rounded"
        >
          {options.map((option, idx) => (
            <option key={idx} value={idx}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Justification</label>
        <textarea 
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Explain why this option won..."
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>

      <button
        onClick={handleResolve}
        disabled={loading}
        className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Resolving...' : 'Resolve Market'}
      </button>
    </div>
  );
}
```

### Pattern 7: Contract Statistics Dashboard

```typescript
// src/components/admin/StatsDashboard.tsx
import { useEffect, useState } from 'react';
import * as fcl from '@onflow/fcl';
import { getGetContractStatsScript } from '@/lib/flowupdate-scripts';
import { ContractStats } from '@/types/flowupdate';

export function StatsD ashboard() {
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const script = await getGetContractStatsScript();
        const result = await fcl.query({
          cadence: script,
          args: (arg, t) => []
        });
        setStats(result as ContractStats);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Refresh every minute
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading statistics...</div>;
  if (!stats) return <div>Failed to load statistics</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="p-4 bg-blue-50 rounded">
        <p className="text-xs text-gray-600">Total Markets</p>
        <p className="text-2xl font-bold">{stats.totalMarkets}</p>
      </div>
      
      <div className="p-4 bg-green-50 rounded">
        <p className="text-xs text-gray-600">Active Markets</p>
        <p className="text-2xl font-bold">{stats.activeMarkets}</p>
      </div>
      
      <div className="p-4 bg-purple-50 rounded">
        <p className="text-xs text-gray-600">Resolved</p>
        <p className="text-2xl font-bold">{stats.resolvedMarkets}</p>
      </div>
      
      <div className="p-4 bg-orange-50 rounded">
        <p className="text-xs text-gray-600">Total Volume</p>
        <p className="text-2xl font-bold">{parseFloat(stats.totalVolume).toFixed(2)} FLOW</p>
      </div>
      
      <div className="p-4 bg-red-50 rounded">
        <p className="text-xs text-gray-600">Platform Fees</p>
        <p className="text-2xl font-bold">{parseFloat(stats.platformFees).toFixed(2)} FLOW</p>
      </div>
    </div>
  );
}
```

## State Management Pattern (Redux)

```typescript
// src/store/flowupdate-slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as fcl from '@onflow/fcl';
import { getGetActiveMarketsScript } from '@/lib/flowupdate-scripts';
import { MultiOptionMarket } from '@/types/flowupdate';

export const fetchMarkets = createAsyncThunk(
  'flowupdate/fetchMarkets',
  async () => {
    const script = await getGetActiveMarketsScript();
    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => []
    });
    return result;
  }
);

const flowupdateSlice = createSlice({
  name: 'flowupdate',
  initialState: {
    markets: [] as MultiOptionMarket[],
    loading: false,
    error: null as string | null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarkets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarkets.fulfilled, (state, action) => {
        state.loading = false;
        state.markets = Object.values(action.payload || {}).map((m: any) => ({
          id: m.id.toString(),
          title: m.title,
          // ... map fields
        }));
      })
      .addCase(fetchMarkets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch markets';
      });
  },
});

export default flowupdateSlice.reducer;
```

## Error Recovery Pattern

```typescript
// src/utils/flowupdate-retry.ts
import { toast } from 'sonner';

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < maxRetries - 1) {
        toast.loading(`Retrying... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError;
}

// Usage
const market = await withRetry(() => fetchMarket(marketId));
```

## Optimistic Updates Pattern

```typescript
// src/hooks/useOptimisticBet.ts
import { useState } from 'react';
import * as fcl from '@onflow/fcl';
import { getPlaceBetTransaction } from '@/lib/flowupdate-scripts';

export function useOptimisticBet(onFetch: () => Promise<void>) {
  const [loading, setLoading] = useState(false);

  const placeBet = async (
    marketId: string,
    optionIndex: number,
    amount: string,
    optimisticUpdate?: () => void
  ) => {
    setLoading(true);
    
    // Optimistic update
    optimisticUpdate?.();

    try {
      const cadence = await getPlaceBetTransaction();
      const txId = await fcl.mutate({
        cadence,
        args: (arg, t) => [
          arg(marketId, t.UInt64),
          arg(optionIndex.toString(), t.UInt8),
          arg(amount, t.UFix64),
        ],
        proposer: fcl.authz,
        payer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 1000,
      });

      // Wait for confirmation
      await fcl.tx(txId).onceSealed();
      
      // Refetch actual data
      await onFetch();
    } catch (error) {
      // Revert optimistic update by refetching
      await onFetch();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { placeBet, loading };
}
```

## Testing Patterns

```typescript
// src/__tests__/flowupdate.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BetForm } from '@/components/BetForm';
import * as fcl from '@onflow/fcl';

jest.mock('@onflow/fcl');

describe('BetForm', () => {
  it('should place a bet', async () => {
    const mockMutate = jest.fn().mockResolvedValue('tx-123');
    (fcl.mutate as jest.Mock).mockImplementation(mockMutate);
    (fcl.tx as jest.Mock).mockReturnValue({
      onceSealed: jest.fn().mockResolvedValue({ status: 4 })
    });

    render(
      <BetForm
        marketId="1"
        options={['Yes', 'No']}
        minBet={1}
        maxBet={1000}
      />
    );

    const amountInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(amountInput, { target: { value: '10' } });

    const submitButton = screen.getByRole('button', { name: /place bet/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('should validate minimum bet', async () => {
    render(
      <BetForm
        marketId="1"
        options={['Yes', 'No']}
        minBet={10}
        maxBet={1000}
      />
    );

    const amountInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(amountInput, { target: { value: '5' } });

    const submitButton = screen.getByRole('button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/minimum bet is 10/i)).toBeInTheDocument();
    });
  });
});
```

## Summary

These patterns cover:
- ✅ Market listing
- ✅ Bet placement with validation
- ✅ User positions tracking
- ✅ Market details with real-time updates
- ✅ Batch betting
- ✅ Market resolution (admin)
- ✅ Statistics dashboard
- ✅ State management
- ✅ Error recovery
- ✅ Optimistic updates
- ✅ Testing

Use these patterns as templates for your specific implementation!