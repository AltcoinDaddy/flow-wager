import { useState, useEffect } from "react";
import {
  getUserByAddress,
  User,
  generateFallbackName,
} from "@/utils/supabase/user";

export function useUserData(address: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getUserByAddress(address)
      .then((userData) => {
        setUser(userData);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch user data");
        console.error("Error fetching user data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [address]);

  const displayName =
    user?.display_name ||
    user?.username ||
    (address ? generateFallbackName(address) : "Unknown");

  const shortName =
    user?.username || (address ? generateFallbackName(address) : "Unknown");

  return {
    user,
    loading,
    error,
    displayName,
    shortName,
    hasProfile: !!user,
  };
}
