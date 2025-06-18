import { NextRequest, NextResponse } from 'next/server';

interface Position {
  marketId: number;
  userAddress: string;
  isOptionA: boolean;
  shares: number;
  amountInvested: number;
  timestamp: number;
  claimed: boolean;
}

// Mock positions storage
const userPositions: { [address: string]: Position[] } = {
  "0x123456789": [
    {
      marketId: 1,
      userAddress: "0x123456789",
      isOptionA: true,
      shares: 100,
      amountInvested: 100,
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      claimed: false
    }
  ]
};

interface PositionParams {
  params: { address: string };
}

export async function GET(req: NextRequest, { params }: PositionParams) {
  const { address } = params;
  const positions = userPositions[address] || [];
  
  return NextResponse.json(positions);
}

export async function POST(req: NextRequest, { params }: PositionParams) {
  try {
    const { address } = params;
    const body = await req.json();
    const { marketId, isOptionA, shares, amountInvested } = body;
    
    if (!userPositions[address]) {
      userPositions[address] = [];
    }
    
    const newPosition: Position = {
      marketId,
      userAddress: address,
      isOptionA,
      shares,
      amountInvested,
      timestamp: Date.now(),
      claimed: false
    };
    
    userPositions[address].push(newPosition);
    
    return NextResponse.json(newPosition, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create position" },
      { status: 500 }
    );
  }
}
