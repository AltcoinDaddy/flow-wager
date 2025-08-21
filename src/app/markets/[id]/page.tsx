/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/markets/[id]/page.tsx
import * as fcl from '@onflow/fcl';
import flowConfig from '@/lib/flow/config';
import { getScript } from '@/lib/flow-wager-scripts';
import { Metadata } from 'next';
import MarketDetailPage from '@/components/market/mark-detail-page';
import { MarketCategory } from '@/types/market';

async function initConfig() {
  try {
    flowConfig();
  } catch (error) {
    console.error('Failed to initialize Flow configuration:', error);
    throw error;
  }
}

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
      description: rawMarket.description || 'No description available',
      category: parseInt(rawMarket.category.rawValue) || 0,
      optionA: rawMarket.optionA || '',
      optionB: rawMarket.optionB || '',
      creator: rawMarket.creator || 'Unknown',
      createdAt: rawMarket.createdAt.toString(),
      endTime: rawMarket.endTime.toString(),
      minBet: rawMarket.minBet.toString(),
      maxBet: rawMarket.maxBet.toString(),
      status: parseInt(rawMarket.status.rawValue) || 0,
      outcome: rawMarket.outcome ? parseInt(rawMarket.outcome.rawValue) : null,
      resolved: rawMarket.resolved,
      totalOptionAShares: rawMarket.totalOptionAShares.toString(),
      totalOptionBShares: rawMarket.totalOptionBShares.toString(),
      totalPool: rawMarket.totalPool.toString(),
      imageUrl: rawMarket.imageUrl || 'https://res.cloudinary.com/dymrvo8sq/image/upload/v1754935053/yvgbr97vkm66vimxsnma.svg',
    };
  } catch (error) {
    console.error('Failed to fetch market by ID:', error);
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const marketId = parseInt(resolvedParams.id, 10);
  const market = await fetchMarketById(marketId);

  if (!market) {
    return {
      title: 'Market Not Found - Flow Wager',
      description: 'The requested prediction market could not be found.',
    };
  }

  const ogImage = `https://www.flowwager.xyz/api/markets/og/${marketId}?v=${market.createdAt || Date.now()}`;
  const canonicalUrl = `https://www.flowwager.xyz/markets/${marketId}`;
  const categoryName = Object.values(MarketCategory)[market.category] || 'Other';

  return {
    title: `${market.title} | Flow Wager`,
    description: market.description,
    keywords: [market.title, market.optionA, market.optionB, categoryName, 'prediction market', 'Flow blockchain', 'betting', 'Flow Wager'],
    openGraph: {
      title: market.title,
      description: market.description,
      url: canonicalUrl,
      siteName: 'Flow Wager',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${market.title} Prediction Market`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: market.title,
      description: market.description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function Page({ params }: { params: { id: string } }) {
  return <MarketDetailPage />;
}