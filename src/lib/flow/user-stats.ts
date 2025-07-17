/* eslint-disable @typescript-eslint/no-explicit-any */
import flowConfig from "@/lib/flow/config";
import { UserStats } from "@/types/user";
import * as fcl from "@onflow/fcl";
import { safeToNumber, safeToString, safeToUInt64 } from "../utils";

const contractAddress =
  process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT || "0xfb16e84ea1882f67"; // Default to Flow Wager contract address
  
// Create fallback user stats matching your UserStats interface
export const createFallbackUserStats = (userAddress: string): UserStats => {
  return {
    address: userAddress,
    totalWinnings: 0,
    totalBets: 0,
    winCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalFeesPaid: 0,
    totalInvested: 0,
    winRate: 0,
    roi: 0,
    rank: undefined,
    // Optional backward compatibility fields
    totalMarketsParticipated: 0,
    totalLosses: 0,
    winStreak: 0,
  };
};

// Transform raw user stats from contract to match your UserStats interface
const transformUserStats = (rawStats: any, userAddress: string): UserStats => {
  if (!rawStats) {
    console.warn("⚠️ No raw stats data, using fallback");
    return createFallbackUserStats(userAddress);
  }

  console.log("🔄 Transforming raw user stats:", rawStats);

  // Extract values from contract's UserStats struct
  const totalMarketsParticipated = safeToUInt64(
    rawStats.totalMarketsParticipated,
    0
  );
  const totalWinnings = safeToNumber(rawStats.totalWinnings, 0);
  const totalLosses = safeToNumber(rawStats.totalLosses, 0);
  const winStreak = safeToUInt64(rawStats.winStreak, 0);
  const currentStreak = safeToUInt64(rawStats.currentStreak, 0);
  const longestWinStreak = safeToUInt64(rawStats.longestWinStreak, 0);
  const totalStaked = safeToNumber(rawStats.totalStaked, 0);
  // const averageBetSize = safeToNumber(rawStats.averageBetSize, 0);
  const contractRoi = safeToNumber(rawStats.roi, 0);

  // Calculate derived stats for your interface
  const totalBets = totalMarketsParticipated; // Total markets = total bets
  const winCount = winStreak; // winStreak in contract represents total wins
  const totalInvested = totalStaked; // totalStaked = totalInvested
  const winRate = totalBets > 0 ? (winCount / totalBets) * 100 : 0;
  const roi = contractRoi; // Use ROI from contract

  // Estimate total fees paid (3% platform fee)
  const platformFeePercentage = 3.0;
  const totalFeesPaid = (totalInvested * platformFeePercentage) / 100;

  const transformedStats: UserStats = {
    address: userAddress,
    totalWinnings,
    totalBets,
    winCount,
    currentStreak,
    longestStreak: longestWinStreak,
    totalFeesPaid,
    totalInvested,
    winRate,
    roi,
    rank: undefined, // You might calculate this elsewhere
    // Optional backward compatibility fields
    totalMarketsParticipated,
    totalLosses,
    winStreak,
  };

  console.log("✅ Transformed user stats:", transformedStats);
  return transformedStats;
};

// Fetch user stats using direct contract call
export const fetchUserStats = async (
  userAddress: string
): Promise<UserStats> => {
  try {
    flowConfig();
    console.log("🔍 Fetching user stats for:", userAddress);

    // Use direct contract call to get user stats
    const script = `
      import FlowWager from ${contractAddress}

      access(all) fun main(address: Address): FlowWager.UserStats? {
          return FlowWager.getUserStats(address: address)
      }
    `;

    const rawUserStats = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(userAddress, t.Address)],
    });

    console.log("📊 Raw user stats from contract:", rawUserStats);

    if (!rawUserStats) {
      console.warn("⚠️ No user stats returned from contract, using fallback");
      return createFallbackUserStats(userAddress);
    }

    // Transform the raw data to match your UserStats interface
    const userStats = transformUserStats(rawUserStats, userAddress);
    console.log("✅ Final user stats:", userStats);

    return userStats;
  } catch (error) {
    console.error("❌ Error fetching user stats:", error);
    // Return fallback stats on error
    return createFallbackUserStats(userAddress);
  }
};

// Fetch user profile data separately
export const fetchUserProfile = async (userAddress: string) => {
  try {
    flowConfig();
    console.log("🔍 Fetching user profile for:", userAddress);

    const script = `
      import FlowWager from 0xb17b2ac32498a3f9

      access(all) fun main(address: Address): FlowWager.UserProfile? {
          return FlowWager.getUserProfile(address: address)
      }
    `;

    const rawProfile = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(userAddress, t.Address)],
    });

    console.log("📊 Raw user profile from contract:", rawProfile);

    if (!rawProfile) {
      console.warn("⚠️ No user profile found for address:", userAddress);
      return null;
    }

    // Transform profile data
    const transformedProfile = {
      address: userAddress,
      username: safeToString(rawProfile.username),
      displayName: safeToString(rawProfile.displayName),
      bio: safeToString(rawProfile.bio),
      profileImageUrl: safeToString(rawProfile.profileImageUrl),
      joinedAt: safeToNumber(rawProfile.joinedAt, 0),
    };

    console.log("✅ Transformed user profile:", transformedProfile);
    return transformedProfile;
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    return null;
  }
};

// Fetch user positions
export const fetchUserPositions = async (userAddress: string) => {
  try {
    flowConfig();
    console.log("🔍 Fetching user positions for:", userAddress);

    const script = `
      import FlowWager from 0xb17b2ac32498a3f9

      access(all) fun main(address: Address): {UInt64: FlowWager.UserPosition} {
          return FlowWager.getUserPositions(address: address)
      }
    `;

    const rawPositions = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(userAddress, t.Address)],
    });

    console.log("📊 Raw user positions from contract:", rawPositions);
    return rawPositions || {};
  } catch (error) {
    console.error("❌ Error fetching user positions:", error);
    return {};
  }
};

// Fetch claimable winnings
export const fetchClaimableWinnings = async (userAddress: string) => {
  try {
    flowConfig();
    console.log("🔍 Fetching claimable winnings for:", userAddress);

    const script = `
      import FlowWager from 0xb17b2ac32498a3f9

      access(all) fun main(address: Address): [FlowWager.ClaimableWinnings] {
          return FlowWager.getClaimableWinnings(address: address)
      }
    `;

    const rawWinnings = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(userAddress, t.Address)],
    });

    console.log("📊 Raw claimable winnings from contract:", rawWinnings);
    return rawWinnings || [];
  } catch (error) {
    console.error("❌ Error fetching claimable winnings:", error);
    return [];
  }
};
