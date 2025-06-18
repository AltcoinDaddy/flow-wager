import { NextRequest, NextResponse } from 'next/server';

interface Market {
  id: number;
  creator: string;
  question: string;
  optionA: string;
  optionB: string;
  category: string;
  imageURI: string;
  endTime: number;
  outcome: string;
  totalOptionAShares: number;
  totalOptionBShares: number;
  resolved: boolean;
  status: string;
  totalPool: number;
  isBreakingNews: boolean;
  createdAt: number;
}


let markets: Market[] = [
  {
    id: 1,
    creator: "0x123456789",
    question: "Will Bitcoin reach $100,000 by December 2024?",
    optionA: "Yes",
    optionB: "No", 
    category: "CRYPTO",
    imageURI: "https://via.placeholder.com/400x200/1f2937/ffffff?text=Bitcoin+Market",
    endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
    outcome: "UNRESOLVED",
    totalOptionAShares: 1250.5,
    totalOptionBShares: 890.3,
    resolved: false,
    status: "ACTIVE",
    totalPool: 2140.8,
    isBreakingNews: false,
    createdAt: Date.now() - 24 * 60 * 60 * 1000
  }
];

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const marketId = parseInt(params.id);
  const market = markets.find(m => m.id === marketId);
  
  if (!market) {
    return NextResponse.json(
      { error: "Market not found" },
      { status: 404 }
    );
  }
  
  return NextResponse.json(market);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const marketId = parseInt(params.id);
    const body = await req.json();
    const marketIndex = markets.findIndex(m => m.id === marketId);
    
    if (marketIndex === -1) {
      return NextResponse.json(
        { error: "Market not found" },
        { status: 404 }
      );
    }
    
    markets[marketIndex] = { ...markets[marketIndex], ...body };
    
    return NextResponse.json(markets[marketIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update market" },
      { status: 500 }
    );
  }
}