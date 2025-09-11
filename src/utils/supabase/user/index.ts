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
