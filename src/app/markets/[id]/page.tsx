/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/markets/[id]/page.tsx
import * as fcl from "@onflow/fcl";
import flowConfig from "@/lib/flow/config";
import { getScript } from "@/lib/flow-wager-scripts"; // Import from your scripts
import { getOptimizedImageUrl, isValidImageUrl } from "@/lib/flow/market";
import { Metadata } from "next";
import MarketDetailPage from "@/components/market/mark-detail-page"; // Your client-side component
import { MarketCategory } from "@/types/market";

// Initialize Flow configuration
async function initConfig() {
  try {
    flowConfig();
  } catch (error) {
    console.error("Failed to initialize Flow configuration:", error);
    throw error;
  }
}

// Fetch market data by ID (reusing logic from useMarketDetail)
async function fetchMarketById(marketId: number): Promise<any | null> {
  try {
    await initConfig();
    if (isNaN(marketId)) {
      throw new Error("Invalid market ID");
    }
    const safeMarketId = String(marketId);
    const script = await getScript("getMarketById");
    const rawMarket = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(safeMarketId, t.UInt64)],
    });

    if (!rawMarket) return null;

    // Transform contract data to Market interface
    return {
      id: rawMarket.id.toString(),
      title: rawMarket.title,
      description: rawMarket.description,
      category: parseInt(rawMarket.category.rawValue),
      optionA: rawMarket.optionA,
      optionB: rawMarket.optionB,
      creator: rawMarket.creator,
      createdAt: rawMarket.createdAt.toString(),
      endTime: rawMarket.endTime.toString(),
      minBet: rawMarket.minBet.toString(),
      maxBet: rawMarket.maxBet.toString(),
      status: parseInt(rawMarket.status.rawValue),
      outcome: rawMarket.outcome ? parseInt(rawMarket.outcome.rawValue) : null,
      resolved: rawMarket.resolved,
      totalOptionAShares: rawMarket.totalOptionAShares.toString(),
      totalOptionBShares: rawMarket.totalOptionBShares.toString(),
      totalPool: rawMarket.totalPool.toString(),
      imageUrl: rawMarket.imageUrl || "",
    };
  } catch (error) {
    console.error("Failed to fetch market by ID:", error);
    throw error;
  }
}

// Generate dynamic metadata
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const marketId = parseInt(params.id, 10);
    const market = await fetchMarketById(marketId);

    if (!market) {
      return {
        title: "Market Not Found - Flow Wager",
        description: "The requested prediction market could not be found.",
      };
    }

    ;

    // Construct canonical URL
    const canonicalUrl = `https://your-site.com/markets/${marketId}`; // Replace with your domain

    // Get category name
    const categoryName =
      Object.values(MarketCategory)[market.category] || "Other";

    return {
      title: `${market.title} | Flow Wager`,
      description: market.description,
      keywords: [
        market.title,
        market.optionA,
        market.optionB,
        categoryName,
        "prediction market",
        "Flow blockchain",
        "betting",
        "Flow Wager",
      ],
      openGraph: {
        title: market.title,
        description: market.description,
        url: canonicalUrl,
        type: "website",
        images: [
          {
            url: `${market.imageUrl}`,
            width: 1200,
            height: 630,
            alt: market.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: market.title,
        description: market.description,
        images: [`${market.imageUrl}`],
      },
    };
  } catch (error) {
    console.error("Failed to generate metadata:", error);
    return {
      title: "Error Loading Market - Flow Wager",
      description: "An error occurred while loading the market details.",
    };
  }
}

// Render client-side component
export default function Page({ params }: { params: { id: string } }) {
  return <MarketDetailPage />;
}
