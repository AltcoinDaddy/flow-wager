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

// Mock database (in production, use proper database)
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  
  let filteredMarkets = [...markets];
  
  // Apply filters
  if (category && category !== 'ALL') {
    filteredMarkets = filteredMarkets.filter(m => m.category === category);
  }
  
  if (status) {
    filteredMarkets = filteredMarkets.filter(m => m.status === status);
  }
  
  if (search) {
    filteredMarkets = filteredMarkets.filter(m => 
      m.question.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Sort by creation time (newest first)
  filteredMarkets.sort((a, b) => b.createdAt - a.createdAt);
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedMarkets = filteredMarkets.slice(startIndex, endIndex);
  
  return NextResponse.json({
    markets: paginatedMarkets,
    pagination: {
      page,
      limit,
      total: filteredMarkets.length,
      pages: Math.ceil(filteredMarkets.length / limit)
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      creator,
      question,
      optionA,
      optionB,
      category,
      imageURI,
      duration,
      isBreakingNews
    } = body;
    
    // Validation
    if (!creator || !question || !optionA || !optionB || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const newMarket: Market = {
      id: Math.max(...markets.map(m => m.id)) + 1,
      creator,
      question,
      optionA,
      optionB,
      category,
      imageURI: imageURI || "https://via.placeholder.com/400x200",
      endTime: Date.now() + (duration * 60 * 60 * 1000), // duration in hours
      outcome: "UNRESOLVED",
      totalOptionAShares: 0,
      totalOptionBShares: 0,
      resolved: false,
      status: "ACTIVE",
      totalPool: 0,
      isBreakingNews: isBreakingNews || false,
      createdAt: Date.now()
    };
    
    markets.push(newMarket);
    
    return NextResponse.json(newMarket, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create market" },
      { status: 500 }
    );
  }
}