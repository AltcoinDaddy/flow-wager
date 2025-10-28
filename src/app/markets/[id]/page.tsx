/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable  */

import * as fcl from "@onflow/fcl";
import flowConfig from "@/lib/flow/config";
import { getScript } from "@/lib/flow-wager-scripts"; // Make sure this imports V2 scripts
import { Metadata } from "next";
import MarketDetailPage from "@/components/market/market-detail-page";
// Ensure MarketCategory and Market type definitions are updated for V2
import {
  MarketCategory,
  MarketCategoryLabels,
  Market,
  MarketStatus,
} from "@/types/market";

async function initConfig() {
  try {
    flowConfig();
  } catch (error) {
    console.error("Failed to initialize Flow configuration:", error);
    throw error;
  }
}

/**
 * Fetches market data by ID and transforms it to the V2 structure.
 */
async function fetchMarketById(marketId: number): Promise<Market | null> {
  try {
    await initConfig();
    if (isNaN(marketId)) {
      throw new Error("Invalid market ID");
    }
    const safeMarketId = String(marketId); // FCL expects string for UInt64
    const script = await getScript("getMarketById"); // Use the V2 script getter
    const rawMarket = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(safeMarketId, t.UInt64)],
    });

    if (!rawMarket) return null;

    // --- TRANSFORM TO V2 Market STRUCTURE ---
    return {
      id: rawMarket.id.toString(),
      title: rawMarket.title || "Untitled Market",
      description: rawMarket.description || "No description available",
      category: parseInt(rawMarket.category?.rawValue ?? "8") as MarketCategory, // Default to Other
      options: rawMarket.options || [], // Array of option strings
      totalShares: rawMarket.totalShares?.map((s: any) => s.toString()) || [], // Array of UFix64 strings
      winningOption:
        rawMarket.winningOption !== null &&
        rawMarket.winningOption !== undefined
          ? parseInt(rawMarket.winningOption.toString())
          : undefined, // Optional index
      creator: rawMarket.creator || "Unknown",
      createdAt: rawMarket.createdAt?.toString() || "0.0",
      endTime: rawMarket.endTime?.toString() || "0.0",
      minBet: rawMarket.minBet?.toString() || "0.0",
      maxBet: rawMarket.maxBet?.toString() || "0.0",
      status: parseInt(rawMarket.status?.rawValue ?? "0") as MarketStatus, // Default to Active
      resolved: rawMarket.resolved || false,
      totalPool: rawMarket.totalPool?.toString() || "0.0",
      imageUrl: rawMarket.imageUrl || undefined, // Use undefined if empty for potential fallback logic later
      // Optional: Add fallback default image URL later if needed, e.g., in the component
      // imageUrl: rawMarket.imageUrl || 'https://res.cloudinary.com/...',
    };
  } catch (error) {
    console.error(`Failed to fetch market by ID ${marketId}:`, error);
    // Return null instead of throwing to allow generateMetadata to handle it
    return null;
    // throw error; // Re-throwing might break metadata generation
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  // Removed Promise wrapper for params
  // Directly access params.id
  const marketId = parseInt(params.id, 10);
  const market = await fetchMarketById(marketId);

  if (!market || isNaN(marketId)) {
    return {
      title: "Market Not Found - Flow Wager",
      description: "The requested prediction market could not be found.",
    };
  }

  // --- UPDATED METADATA GENERATION ---
  const ogImage = `https://www.flowwager.xyz/api/markets/og/${marketId}?v=${market.createdAt || Date.now()}`;
  const canonicalUrl = `https://www.flowwager.xyz/markets/${marketId}`;
  // Use MarketCategoryLabels for safer access
  const categoryName =
    MarketCategoryLabels[
      market.category as keyof typeof MarketCategoryLabels
    ] || "Other";

  // Include all options in keywords
  const optionKeywords = market.options || [];

  return {
    title: `${market.title} | Flow Wager`,
    description: market.description,
    keywords: [
      market.title,
      ...optionKeywords, // Add all options
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
      siteName: "Flow Wager",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${market.title} Prediction Market`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: market.title,
      description: market.description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// Page component remains the same
export default function Page({ params }: { params: { id: string } }) {
  // MarketDetailPage will likely need market data fetched client-side or passed as props
  // This component only renders the container; data fetching happens above or client-side.
  console.log(params);
  return <MarketDetailPage />; // Pass marketId as a prop
}
