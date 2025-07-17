import flowConfig from "@/lib/flow/config";
import { getActiveMarkets as getActiveMarketsScript, getAllMarkets as getAllMarketsScript } from "@/lib/flow-wager-scripts";
import { Market } from '@/types/market';
import * as fcl from "@onflow/fcl";
import { transformMarketData } from './market-data';

// Enhanced getActiveMarkets function using FlowWagerScripts
export const getActiveMarkets = async (): Promise<Market[]> => {
  try {
    flowConfig();
    console.log("🎯 Fetching active markets using flow-wager-scripts...");

    // Get the script from FlowWagerScripts
    const script = await getActiveMarketsScript();

    const rawMarkets = await fcl.query({
      cadence: script,
      args: () => [],
    });

    console.log("📊 Raw markets returned from getActiveMarkets():", rawMarkets);

    if (!rawMarkets || !Array.isArray(rawMarkets)) {
      console.warn("⚠️ No active markets returned from contract");
      return [];
    }

    if (rawMarkets.length === 0) {
      console.log("📭 Contract returned empty array - no active markets");
      return [];
    }

    // Transform all returned markets
    const transformedMarkets = rawMarkets.map(transformMarketData);

    console.log("🔄 Transformed markets:", transformedMarkets);

    // Basic validation to catch obvious issues
    const validActiveMarkets = transformedMarkets.filter(market => {
      const hasBasicData = market.id && market.title && market.optionA && market.optionB;
      const isNotResolved = !market.resolved;
      
      if (!hasBasicData) {
        console.warn(`❌ Market ${market.id} missing basic data:`, market);
        return false;
      }
      
      if (isNotResolved) {
        console.log(`✅ Market ${market.id} (${market.title}) is valid and active`);
        return true;
      } else {
        console.log(`⚠️ Market ${market.id} (${market.title}) is resolved, skipping`);
        return false;
      }
    });
    
    console.log(`📈 Smart contract returned ${rawMarkets.length} markets`);
    console.log(`✅ Final active markets count: ${validActiveMarkets.length}`);

    return validActiveMarkets;
  } catch (error) {
    console.error("❌ Error fetching active markets:", error);
    throw error;
  }
};

// Function to fetch all markets using FlowWagerScripts
export const getAllMarkets = async (): Promise<Market[]> => {
  try {
    flowConfig();
    console.log("🎯 Fetching all markets using flow-wager-scripts...");

    // Get the script from FlowWagerScripts
    const script = await getAllMarketsScript();

    const rawMarkets = await fcl.query({
      cadence: script,
      args: () => [],
    });

    console.log("📊 All markets from contract:", rawMarkets);

    if (!rawMarkets || !Array.isArray(rawMarkets)) {
      console.warn("⚠️ No markets returned from getAllMarkets");
      return [];
    }

    // Transform all markets
    const transformedMarkets = rawMarkets.map(transformMarketData);
    console.log("✅ All markets transformed:", transformedMarkets);

    return transformedMarkets;
  } catch (error) {
    console.error("❌ Error fetching all markets:", error);
    return [];
  }
};

// Fetch markets data
export const fetchMarketsData = async () => {
  console.log("🚀 Starting to fetch markets data using flow-wager-scripts...");
  
  // Fetch both active markets and all markets
  const [activeMarketsData, allMarketsData] = await Promise.all([
    getActiveMarkets(),
    getAllMarkets()
  ]);
  
  console.log("📈 Markets fetched:", {
    active: activeMarketsData.length,
    total: allMarketsData.length
  });
  
  return { activeMarketsData, allMarketsData };
};