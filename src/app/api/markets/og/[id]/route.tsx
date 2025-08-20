/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/markets/og/[id]/route.ts
import { ImageResponse } from '@vercel/og';
import * as fcl from '@onflow/fcl';
import flowConfig from '@/lib/flow/config';
import { getScript } from '@/lib/flow-wager-scripts';
import React from 'react'; // Import React for JSX

// Initialize Flow configuration
async function initConfig() {
  try {
    flowConfig();
  } catch (error) {
    console.error('Failed to initialize Flow configuration:', error);
    throw error;
  }
}

// Fetch market data by ID
async function fetchMarketById(marketId: number): Promise<any | null> {
  try {
    await initConfig();
    if (isNaN(marketId)) {
      throw new Error('Invalid market ID');
    }
    const safeMarketId = String(marketId);
    const script = await getScript('getMarketById');
    const rawMarket = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(safeMarketId, t.UInt64)],
    });

    if (!rawMarket) return null;

    return {
      id: rawMarket.id.toString(),
      title: rawMarket.title || 'Untitled Market',
      optionA: rawMarket.optionA || '',
      optionB: rawMarket.optionB || '',
      totalOptionAShares: rawMarket.totalOptionAShares.toString(),
      totalOptionBShares: rawMarket.totalOptionBShares.toString(),
      totalPool: rawMarket.totalPool.toString(),
    };
  } catch (error) {
    console.error('Failed to fetch market by ID:', error);
    throw error;
  }
}

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const marketId = parseInt(params.id, 10);
  const market = await fetchMarketById(marketId);

  if (!market) {
    return new Response('Market not found', { status: 404 });
  }

  // Calculate probabilities
  const totalShares = parseFloat(market.totalOptionAShares) + parseFloat(market.totalOptionBShares);
  const probA = totalShares > 0 ? (parseFloat(market.totalOptionAShares) / totalShares * 100).toFixed(1) : '0.0';
  const probB = totalShares > 0 ? (parseFloat(market.totalOptionBShares) / totalShares * 100).toFixed(1) : '0.0';

  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div>
        <h1 style={{ fontSize: '32px', margin: 0 }}>{market.title}</h1>
        <p style={{ fontSize: '16px', color: '#666' }}>Total Volume: {market.totalPool} FLOW</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
            }}
          >
            {market.optionA}
          </button>
          <p>{probA}%</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
            }}
          >
            {market.optionB}
          </button>
          <p>{probB}%</p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <img src="https://www.flowwager.xyz/logo.png" alt="FlowWager Logo" width="100" height="50" />
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}