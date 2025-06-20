/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as fcl from "@onflow/fcl";
import flowConfig from "@/lib/flow/config"; // Use your existing config

const GET_ALL_MARKETS = `
import FlowWager from ${process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT || ""}

access(all) fun main(): [FlowWager.Market] {
    return FlowWager.getAllMarkets()
}
`;

export interface RawMarketData {
  id: string;
  title: string;
  description: string;
  category: number;
  optionA: string;
  optionB: string;
  creator: string;
  createdAt: string;
  endTime: string;
  minBet: string;
  maxBet: string;
  status: number;
  outcome: number | null;
  resolved: boolean;
  totalOptionAShares: string;
  totalOptionBShares: string;
  totalPool: string;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: number;
  optionA: string;
  optionB: string;
  creator: string;
  createdAt: string;
  endTime: string;
  minBet: string;
  maxBet: string;
  status: number;
  outcome: number | null;
  resolved: boolean;
  totalOptionAShares: string;
  totalOptionBShares: string;
  totalPool: string;
}

const transformMarketData = (rawMarket: any): Market => {
  // Handle the contract data structure and ensure all fields are properly formatted
  return {
    id: rawMarket.id?.toString() || "0",
    title: rawMarket.title || "",
    description: rawMarket.description || "",
    category: parseInt(rawMarket.category?.toString() || "0"),
    optionA: rawMarket.optionA || "",
    optionB: rawMarket.optionB || "",
    creator: rawMarket.creator || "",
    createdAt: rawMarket.createdAt?.toString() || "0",
    endTime: rawMarket.endTime?.toString() || "0",
    minBet: rawMarket.minBet?.toString() || "0",
    maxBet: rawMarket.maxBet?.toString() || "0",
    status: parseInt(rawMarket.status?.toString() || "0"),
    outcome:
      rawMarket.outcome !== null && rawMarket.outcome !== undefined
        ? parseInt(rawMarket.outcome.toString())
        : null,
    resolved: Boolean(rawMarket.resolved),
    totalOptionAShares: rawMarket.totalOptionAShares?.toString() || "0",
    totalOptionBShares: rawMarket.totalOptionBShares?.toString() || "0",
    totalPool: rawMarket.totalPool?.toString() || "0",
  };
};

export const getAllMarkets = async (): Promise<Market[]> => {
  try {
    // Initialize your FCL config
    flowConfig();

    console.log("Fetching markets from contract...");

    const rawMarkets = await fcl.query({
      cadence: GET_ALL_MARKETS,
      args: () => [],
    });

    console.log("Raw markets data:", rawMarkets);

    if (!rawMarkets || !Array.isArray(rawMarkets)) {
      console.warn("No markets returned or invalid format");
      return [];
    }

    // Transform the raw data to match our interface
    const transformedMarkets = rawMarkets.map(transformMarketData);

    console.log("Transformed markets:", transformedMarkets);

    return transformedMarkets;
  } catch (error) {
    console.error("Error fetching all markets:", error);

    // More detailed error handling
    if (error instanceof Error) {
      if (error.message.includes("accessNode.api")) {
        throw new Error(
          "FCL configuration error. Please check your Flow network settings."
        );
      }
      if (error.message.includes("contract")) {
        throw new Error(
          "Contract not found or invalid. Please check your contract address."
        );
      }
      if (error.message.includes("script")) {
        throw new Error(
          "Script execution failed. The contract may not be deployed."
        );
      }
    }

    throw new Error("Failed to fetch markets from the blockchain");
  }
};

export default getAllMarkets;
