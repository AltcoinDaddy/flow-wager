import { supabase } from "@/utils/supabase/client";
import { Tables } from "@/utils/supabase/database";

export type User = Tables<"users">;

export async function getUserByAddress(address: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("address", address)
      .single();

    if (error) {
      console.error("Error fetching user by address:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching user by address:", error);
    return null;
  }
}

export async function getUserDisplayName(address: string): Promise<string> {
  const user = await getUserByAddress(address);
  return (
    user?.display_name ||
    user?.username ||
    `${address.slice(0, 6)}...${address.slice(-4)}`
  );
}

export function generateFallbackName(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export async function getUsersByAddresses(
  addresses: string[],
): Promise<Map<string, User>> {
  try {
    if (addresses.length === 0) return new Map();

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .in("address", addresses);

    if (error) {
      console.error("Error fetching users by addresses:", error);
      return new Map();
    }

    // Create a map for easy lookup
    const userMap = new Map<string, User>();
    data?.forEach((user) => {
      userMap.set(user.address, user);
    });

    return userMap;
  } catch (error) {
    console.error("Error fetching users by addresses:", error);
    return new Map();
  }
}

export function formatUserDisplayName(
  user: User | undefined,
  address: string,
): string {
  if (!user) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return (
    user.display_name ||
    user.username ||
    `${address.slice(0, 6)}...${address.slice(-4)}`
  );
}

export function formatUserShortName(
  user: User | undefined,
  address: string,
): string {
  if (!user) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return user.username || `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Checks if users exist in Supabase and returns their profile data
 * @param addresses Array of wallet addresses to check
 * @returns Promise<Map<string, User | null>> - Map where key is address and value is user data or null if not found
 */
export async function checkUsersInSupabase(
  addresses: string[],
): Promise<Map<string, User | null>> {
  try {
    if (addresses.length === 0) {
      return new Map();
    }

    console.log(`🔍 Checking ${addresses.length} users in Supabase...`);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .in("address", addresses);

    if (error) {
      console.error("Error checking users in Supabase:", error);
      // Return map with all addresses as null on error
      const errorMap = new Map<string, User | null>();
      addresses.forEach((address) => errorMap.set(address, null));
      return errorMap;
    }

    console.log(
      `✅ Found ${data?.length || 0} users in Supabase out of ${addresses.length} checked`,
    );

    // Create a map with all addresses
    const userMap = new Map<string, User | null>();

    // Initialize all addresses as null (not found)
    addresses.forEach((address) => {
      userMap.set(address, null);
    });

    // Update map with found users
    if (data) {
      data.forEach((user) => {
        userMap.set(user.address, user);
      });
    }

    return userMap;
  } catch (error) {
    console.error("Error checking users in Supabase:", error);
    // Return map with all addresses as null on error
    const errorMap = new Map<string, User | null>();
    addresses.forEach((address) => errorMap.set(address, null));
    return errorMap;
  }
}

/**
 * Gets user display information with fallback handling
 * @param supabaseUser User data from Supabase (or null if not found)
 * @param address Wallet address for fallback
 * @returns Object with display name, short name, avatar URL, and profile status
 */
export function getUserDisplayInfo(supabaseUser: User | null, address: string) {
  const hasProfile = !!supabaseUser;

  const displayName =
    supabaseUser?.display_name ||
    supabaseUser?.username ||
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  const shortName =
    supabaseUser?.username || `${address.slice(0, 6)}...${address.slice(-4)}`;

  const avatarUrl =
    supabaseUser?.profile_image_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`;

  return {
    displayName,
    shortName,
    avatarUrl,
    hasProfile,
    bio: supabaseUser?.bio || null,
    username: supabaseUser?.username || null,
    joinedAt: supabaseUser?.joined_at || null,
  };
}
