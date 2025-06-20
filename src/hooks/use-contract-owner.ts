import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";

export const useContractOwner = () => {
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkOwnership = () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!user?.addr || !user?.loggedIn) {
          setIsOwner(false);
          setIsLoading(false);
          return;
        }

        const contractAddress = process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT;

        if (!contractAddress) {
          setError("Contract address not configured");
          setIsOwner(false);
          setIsLoading(false);
          return;
        }

        const userWalletAddress = user.addr;
        const isContractOwner =
          userWalletAddress.toLowerCase() === contractAddress.toLowerCase();

        setIsOwner(isContractOwner);
      } catch (err) {
        console.error("Error checking contract ownership:", err);
        setError(
          err instanceof Error ? err.message : "Failed to check ownership"
        );
        setIsOwner(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOwnership();
  }, [user?.addr, user?.loggedIn]);

  return {
    isOwner,
    isLoading,
    error,
    contractAddress: process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT || "",
    userAddress: user?.addr || "",
  };
};
