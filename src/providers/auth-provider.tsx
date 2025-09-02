/* eslint-disable @typescript-eslint/no-unused-vars */
 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  checkUserRegistered as checkUserRegistration,
  createUserAccountTransaction,
  getUserFlowBalance,
  getUserProfile,
} from "@/lib/flow-wager-scripts";
import flowConfig from "@/lib/flow/config";
import { supabase } from "@/utils/supabase/client";
import * as fcl from "@onflow/fcl";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Database, Circle as Sync, CheckCircle } from "lucide-react";

interface User {
  addr: string | null;
  cid: string | null;
  loggedIn: boolean;
  services: any[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  authenticate: () => Promise<void>;
  unauthenticate: () => Promise<void>;
  isAuthenticated: boolean;
  walletAddress: string | null;
  sessionTimeRemaining: number;
  balance: string;
  isLoadingBalance: boolean;
  balanceError: string | null;
  refreshBalance: () => Promise<void>;
  syncUserToSupabase: () => Promise<void>;
  needsSupabaseSync: boolean;
  isSyncing: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute
const BALANCE_REFRESH_INTERVAL = 30 * 1000; // Refresh balance every 30 seconds
const SESSION_STORAGE_KEY = "flow_auth_session";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(0);
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // New states for Supabase sync detection
  const [needsSupabaseSync, setNeedsSupabaseSync] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);

  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const balanceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingUsername, setOnboardingUsername] = useState("");
  const [onboardingDisplayName, setOnboardingDisplayName] = useState("");
  const [onboardingBio, setOnboardingBio] = useState("");
  const [onboardingError, setOnboardingError] = useState<string>("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const fetchBalance = useCallback(async (address: string) => {
    if (!address) return;

    setIsLoadingBalance(true);
    setBalanceError(null);

    try {
      const userBalance = await fcl.query({
        cadence: await getUserFlowBalance(),
        args: (arg, t) => [arg(address, t.Address)],
      });

      setBalance(parseFloat(userBalance.toString()).toFixed(2));
    } catch (error) {
      console.error("Error fetching user balance:", error);
      setBalanceError("Failed to fetch balance");
      setBalance("0.00");
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (user?.addr) {
      await fetchBalance(user.addr);
    }
  }, [user?.addr, fetchBalance]);

  const startBalanceMonitoring = useCallback(
    (address: string) => {
      if (balanceIntervalRef.current) {
        clearInterval(balanceIntervalRef.current);
      }

      fetchBalance(address);

      balanceIntervalRef.current = setInterval(() => {
        fetchBalance(address);
      }, BALANCE_REFRESH_INTERVAL);
    },
    [fetchBalance]
  );

  const stopBalanceMonitoring = useCallback(() => {
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current);
      balanceIntervalRef.current = null;
    }
    setBalance("0.00");
    setBalanceError(null);
  }, []);

  const clearTimers = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current);
      balanceIntervalRef.current = null;
    }
  }, []);

  const saveSessionTimestamp = useCallback(() => {
    const timestamp = Date.now();
    sessionStorage.setItem(SESSION_STORAGE_KEY, timestamp.toString());
  }, []);

  const getSessionTimestamp = useCallback(() => {
    const timestamp = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  }, []);

  const clearSessionData = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const isSessionExpired = useCallback(() => {
    const sessionStart = getSessionTimestamp();
    if (!sessionStart) return false;

    const now = Date.now();
    const elapsed = now - sessionStart;
    return elapsed > SESSION_TIMEOUT;
  }, [getSessionTimestamp]);

  const getTimeRemaining = useCallback(() => {
    const sessionStart = getSessionTimestamp();
    if (!sessionStart) return 0;

    const now = Date.now();
    const elapsed = now - sessionStart;
    const remaining = SESSION_TIMEOUT - elapsed;
    return Math.max(0, remaining);
  }, [getSessionTimestamp]);

  const autoLogout = useCallback(async () => {
    console.log("Session expired - automatically logging out user");
    try {
      await fcl.unauthenticate();
      setUser(null);
      clearSessionData();
      clearTimers();
      stopBalanceMonitoring();
      setShowOnboarding(false);
    } catch (error) {
      console.error("Auto logout failed:", error);
    }
  }, [clearSessionData, clearTimers, stopBalanceMonitoring]);

  const startSessionMonitoring = useCallback(() => {
    clearTimers();

    const timeRemaining = getTimeRemaining();

    sessionTimeoutRef.current = setTimeout(() => {
      autoLogout();
    }, timeRemaining);

    sessionCheckIntervalRef.current = setInterval(() => {
      const remaining = getTimeRemaining();
      setSessionTimeRemaining(remaining);

      if (remaining <= 0) {
        autoLogout();
      }
    }, SESSION_CHECK_INTERVAL);

    setSessionTimeRemaining(timeRemaining);
  }, [getTimeRemaining, autoLogout, clearTimers]);

  const resetSessionActivity = useCallback(() => {
    if (user?.loggedIn) {
      saveSessionTimestamp();
      startSessionMonitoring();
    }
  }, [user?.loggedIn, saveSessionTimestamp, startSessionMonitoring]);

  // Enhanced function to check if user needs Supabase sync
  const checkSupabaseSyncStatus = useCallback(async (userAddress: string) => {
    try {
      console.log(`Checking Supabase sync status for user: ${userAddress}`);

      // Check if user is registered on-chain
      const script = await checkUserRegistration();
      const registrationStatus = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(userAddress, t.Address)],
      });

      const isFullyRegistered = registrationStatus.isFullyRegistered as boolean;

      if (!isFullyRegistered) {
        console.log("User not registered on-chain");
        setNeedsSupabaseSync(false);
        setShowSyncModal(false);
        return;
      }

      // Check if user exists in Supabase
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("address, username, last_updated")
        .eq("address", userAddress)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error checking Supabase user:", checkError);
        return;
      }

      // If user is registered on-chain but not in Supabase, they need sync
      if (!existingUser) {
        console.log("User registered on-chain but not found in Supabase - needs sync");
        setNeedsSupabaseSync(true);
        setShowSyncModal(true);
        return;
      }

      // If user exists but data might be stale (older than 7 days), suggest resync
      if (existingUser.last_updated) {
        const lastUpdated = new Date(existingUser.last_updated);
        const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate > 7) {
          console.log("User data is stale - suggesting resync");
          setNeedsSupabaseSync(true);
          // Don't show modal for stale data, just mark as needing sync
        }
      }

      console.log("User is properly synced with Supabase");
      setNeedsSupabaseSync(false);
      setShowSyncModal(false);

    } catch (error) {
      console.error("Error checking Supabase sync status:", error);
    }
  }, []);

  // Enhanced sync function with better error handling and retry logic
  const syncUserToSupabase = useCallback(async (retryCount: number = 0) => {
    if (!user?.addr || !user.loggedIn) {
      console.log("No user address or not logged in, skipping Supabase sync");
      return;
    }

    setIsSyncing(true);

    try {
      console.log(`Starting Supabase sync for user: ${user.addr} (attempt ${retryCount + 1})`);

      // Check if user is registered on-chain
      const script = await checkUserRegistration();
      const registrationStatus = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(user.addr!, t.Address)],
      });
      
      const isFullyRegistered = registrationStatus.isFullyRegistered as boolean;

      if (!isFullyRegistered) {
        console.log("User not fully registered on-chain, cannot sync to Supabase");
        setNeedsSupabaseSync(false);
        setShowSyncModal(false);
        return;
      }

      // Fetch on-chain profile with retry logic
      let profile = null;
      for (let i = 0; i < 3; i++) {
        try {
          const profileScript = await getUserProfile();
          profile = await fcl.query({
            cadence: profileScript,
            args: (arg, t) => [arg(user.addr!, t.Address)],
          });
          if (profile) break;
        } catch (error) {
          console.warn(`Profile fetch attempt ${i + 1} failed:`, error);
          if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }

      if (!profile) {
        throw new Error("Unable to fetch on-chain profile after multiple attempts");
      }

      const { username, displayName, bio, profileImageUrl } = profile;
      const now = new Date().toISOString();

      // Check if user exists in Supabase
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("*")
        .eq("address", user.addr)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Error checking existing user: ${checkError.message}`);
      }

      // Prepare user data for Supabase
      const userData = {
        address: user.addr,
        username,
        display_name: displayName,
        bio: bio || null,
        profile_image_url: profileImageUrl || null,
        last_updated: now,
        // Set joined_at only for new users
        ...(existingUser ? {} : { joined_at: now })
      };

      // Upsert user data to Supabase
      const { data: upsertedUser, error: upsertError } = await supabase
        .from("users")
        .upsert(userData, { 
          onConflict: "address",
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (upsertError) {
        throw new Error(`Error syncing user to Supabase: ${upsertError.message}`);
      }

      const action = existingUser ? "updated" : "created";
      console.log(`User ${user.addr} ${action} in Supabase successfully`);
      
      // Initialize or update user_stats
      const { data: existingStats, error: statsCheckError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("address", user.addr)
        .single();

      if (statsCheckError && statsCheckError.code !== 'PGRST116') {
        console.warn("Error checking user stats:", statsCheckError);
      }

      if (!existingStats) {
        // Create initial stats for new user
        const { error: statsError } = await supabase
          .from("user_stats")
          .insert({
            address: user.addr,
            flowwager_points: 0,
            total_staked: 0,
            total_winnings: 0,
            total_losses: 0,
            total_markets_participated: 0,
            win_streak: 0,
            current_streak: 0,
            longest_win_streak: 0,
            average_bet_size: 0,
            roi: 0,
            last_updated: now
          });

        if (statsError) {
          console.error("Error creating user stats:", statsError);
        } else {
          console.log(`User stats initialized for ${user.addr}`);
        }
      } else {
        // Update last_updated for existing stats
        const { error: statsUpdateError } = await supabase
          .from("user_stats")
          .update({ last_updated: now })
          .eq("address", user.addr);

        if (statsUpdateError) {
          console.error("Error updating user stats timestamp:", statsUpdateError);
        }
      }

      // Log activity for existing users (not new registrations)
      if (existingUser) {
        const { error: activityError } = await supabase
          .from("activities")
          .insert({
            user_address: user.addr,
            activity_type: "login",
            details: {
              timestamp: now,
              user_agent: navigator.userAgent,
              sync_type: "automatic"
            },
            created_at: now
          });

        if (activityError) {
          console.error("Error logging login activity:", activityError);
        }
      }

      // Success - update state
      setNeedsSupabaseSync(false);
      setShowSyncModal(false);
      toast.success(`User data ${action} successfully!`);

    } catch (error) {
      console.error("Error syncing user to Supabase:", error);
      
      // Retry logic for transient errors
      if (retryCount < 2) {
        console.log(`Retrying sync in ${(retryCount + 1) * 2} seconds...`);
        setTimeout(() => {
          syncUserToSupabase(retryCount + 1);
        }, (retryCount + 1) * 2000);
        return;
      }
      
      toast.error("Failed to sync user data. Please try again manually.");
      setNeedsSupabaseSync(true);
    } finally {
      setIsSyncing(false);
    }
  }, [user?.addr, user?.loggedIn]);

  // Manual sync trigger for the sync modal
  const handleManualSync = useCallback(async () => {
    await syncUserToSupabase(0);
  }, [syncUserToSupabase]);

  useEffect(() => {
    flowConfig();

    const checkExistingSession = async () => {
      if (isSessionExpired()) {
        await autoLogout();
        return;
      }
    };

    checkExistingSession();

    const unsubscribe = fcl.currentUser.subscribe((currentUser: User) => {
      setUser(currentUser);
      setIsLoading(false);

      if (currentUser?.loggedIn && currentUser?.addr) {
        if (!getSessionTimestamp()) {
          saveSessionTimestamp();
        }
        startSessionMonitoring();
        startBalanceMonitoring(currentUser.addr);
        
        // Check Supabase sync status first, then sync if needed
        setTimeout(async () => {
          await checkSupabaseSyncStatus(currentUser.addr!);
          // Only sync if the user doesn't need manual intervention
          if (!needsSupabaseSync) {
            await syncUserToSupabase();
          }
        }, 2000);
      } else {
        clearSessionData();
        clearTimers();
        stopBalanceMonitoring();
        setSessionTimeRemaining(0);
        setShowOnboarding(false);
        setShowSyncModal(false);
        setNeedsSupabaseSync(false);
      }
    });

    return () => {
      unsubscribe();
      clearTimers();
    };
  }, [
    isSessionExpired,
    autoLogout,
    getSessionTimestamp,
    saveSessionTimestamp,
    startSessionMonitoring,
    startBalanceMonitoring,
    clearSessionData,
    clearTimers,
    stopBalanceMonitoring,
    syncUserToSupabase,
    checkSupabaseSyncStatus,
    needsSupabaseSync,
  ]);

  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetSessionActivity();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [resetSessionActivity]);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (user?.addr && user.loggedIn) {
        try {
          const script = await checkUserRegistration();
          const registrationStatus = await fcl.query({
            cadence: script,
            args: (arg, t) => [arg(user?.addr || "", t.Address)],
          });
          const isFullyRegistered = registrationStatus.isFullyRegistered as boolean;
          if (!isFullyRegistered) {
            console.log(
              `No full registration found for address ${user.addr}. Showing onboarding modal.`
            );
            setShowOnboarding(true);
          } else {
            console.log(
              `User fully registered for address ${user.addr}. Hiding onboarding modal.`
            );
            setShowOnboarding(false);
          }
        } catch (error) {
          console.error("Failed to check user registration:", error);
          setShowOnboarding(true);
        }
      } else {
        console.log(
          "User not logged in or address unavailable. Hiding onboarding modal."
        );
        setShowOnboarding(false);
      }
    };
    checkOnboarding();
  }, [user?.addr, user?.loggedIn]);

  const handleCreateAccount = async () => {
    setOnboardingError("");
    if (!onboardingUsername.trim() || !onboardingDisplayName.trim()) {
      setOnboardingError("Username and display name are required.");
      toast.error("Username and display name are required.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(onboardingUsername)) {
      setOnboardingError(
        "Username can only contain letters, numbers, and underscores."
      );
      toast.error(
        "Username can only contain letters, numbers, and underscores."
      );
      return;
    }
    if (onboardingUsername.length < 1 || onboardingUsername.length > 30) {
      setOnboardingError("Username must be 1-30 characters.");
      toast.error("Username must be 1-30 characters.");
      return;
    }
    if (onboardingDisplayName.length < 1 || onboardingDisplayName.length > 50) {
      setOnboardingError("Display name must be 1-50 characters.");
      toast.error("Display name must be 1-50 characters.");
      return;
    }
    if (onboardingBio.length > 200) {
      setOnboardingError("Bio must be 200 characters or less.");
      toast.error("Bio must be 200 characters or less.");
      return;
    }
    if (!user?.addr) {
      setOnboardingError("User address is not available.");
      toast.error("Please reconnect your wallet and try again.");
      return;
    }

    const profileImageUrl = `https://api.dicebear.com/9.x/pixel-art/png?seed=${user.addr}&backgroundColor=ff5733,00d4ff,9b87f5&size=256&scale=80&radius=10`;

    setIsCreatingAccount(true);
    try {
      const tx = await createUserAccountTransaction();
      const authorization = fcl.currentUser.authorization;
      const txId = await fcl.mutate({
        cadence: tx,
        args: (arg, t) => [
          arg(onboardingUsername.trim(), t.String),
          arg(onboardingDisplayName.trim(), t.String),
          arg(onboardingBio.trim(), t.String),
          arg(profileImageUrl, t.String),
        ],
        proposer: authorization,
        payer: authorization,
        authorizations: [authorization],
        limit: 999,
      });
      const result = await fcl.tx(txId).onceSealed();
      if (result.status === 4 && !result.errorMessage) {
        let profile = null;
        for (let i = 0; i < 5; i++) {
          const script = await getUserProfile();
          profile = await fcl.query({
            cadence: script,
            args: (arg, t) => [arg(user.addr ?? "", t.Address)],
          });
          if (profile) break;
          await new Promise((res) => setTimeout(res, 1000));
        }
        if (profile) {
          console.log(`Profile created successfully for address ${user.addr}.`);
          setShowOnboarding(false);
          setOnboardingUsername("");
          setOnboardingDisplayName("");
          setOnboardingBio("");
          toast.success("User account created successfully!");
          
          // Log registration activity
          const now = new Date().toISOString();
          await supabase
            .from("activities")
            .insert({
              user_address: user.addr,
              activity_type: "registration",
              details: {
                username: onboardingUsername.trim(),
                display_name: onboardingDisplayName.trim(),
                registration_timestamp: now
              },
              points_earned: 100, // Welcome bonus
              created_at: now
            });

          // Sync to Supabase after successful account creation
          await syncUserToSupabase();
        } else {
          const errorMsg =
            "Account created, but profile not yet available. Please try again.";
          setOnboardingError(errorMsg);
          toast.error(errorMsg);
        }
      } else {
        throw new Error(result.errorMessage || "Transaction failed");
      }
    } catch (err: any) {
      let errorMsg = typeof err.message === "string" ? err.message.toLowerCase() : "";
      if (errorMsg.includes("username is already taken")) {
        errorMsg = "Username has been taken.";
      } else if (errorMsg.includes("already registered")) {
        errorMsg = "User already registered.";
      } else {
        errorMsg = err.message || "Failed to create user account.";
      }
      setOnboardingError(errorMsg);
      toast.error(
        errorMsg === "Username has been taken."
          ? "Username has been taken. Please choose another."
          : errorMsg === "User already registered."
          ? "This wallet is already registered. Please log in."
          : errorMsg
      );
      setShowOnboarding(
        errorMsg !== "Username has been taken." &&
        errorMsg !== "User already registered."
      );
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const login = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await fcl.authenticate();
      saveSessionTimestamp();
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await fcl.unauthenticate();
      setUser(null);
      clearSessionData();
      clearTimers();
      stopBalanceMonitoring();
      toast.success("Logged out successfully.");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await fcl.authenticate();
      saveSessionTimestamp();
    } catch (error) {
      console.error("Authentication failed:", error);
      toast.error("Authentication failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unauthenticate = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await fcl.unauthenticate();
      clearSessionData();
      clearTimers();
      stopBalanceMonitoring();
      toast.success("Unauthenticated successfully.");
    } catch (error) {
      console.error("Unauthentication failed:", error);
      toast.error("Unauthentication failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    authenticate,
    unauthenticate,
    isAuthenticated: user?.loggedIn || false,
    walletAddress: user?.addr || null,
    sessionTimeRemaining,
    balance,
    isLoadingBalance,
    balanceError,
    refreshBalance,
    syncUserToSupabase: handleManualSync,
    needsSupabaseSync,
    isSyncing,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Existing Onboarding Modal */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="bg-[#0A0C14] bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14] border border-gray-800/50">
          <DialogHeader>
            <DialogTitle className="text-white">Create Your FlowWager Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1">Username</label>
              <input
                type="text"
                value={onboardingUsername}
                onChange={(e) => setOnboardingUsername(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[#9b87f5]"
                placeholder="Enter a username"
                disabled={isCreatingAccount}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Display Name</label>
              <input
                type="text"
                value={onboardingDisplayName}
                onChange={(e) => setOnboardingDisplayName(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[#9b87f5]"
                placeholder="Enter your display name"
                disabled={isCreatingAccount}
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Bio</label>
              <textarea
                value={onboardingBio}
                onChange={(e) => setOnboardingBio(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[#9b87f5]"
                placeholder="Enter a short bio (optional)"
                disabled={isCreatingAccount}
              />
            </div>
            {onboardingError && (
              <div className="text-red-500 text-sm">{onboardingError}</div>
            )}
            <button
              onClick={handleCreateAccount}
              className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white font-bold py-2 rounded mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isCreatingAccount}
            >
              {isCreatingAccount ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Supabase Sync Modal */}
      <Dialog open={showSyncModal} onOpenChange={setShowSyncModal}>
        <DialogContent className="bg-[#0A0C14] bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14] border border-gray-800/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-[#9b87f5]" />
              Sync Your Account Data
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-yellow-500/20 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-100">
                Your account is registered on-chain but needs to be synced with our database to access all features.
              </AlertDescription>
            </Alert>
            
            <div className="text-gray-300 space-y-2">
              <p className="text-sm">
                We&rsquo;ve detected that your FlowWager account exists on the blockchain but hasn&#39;t been synced with our database yet.
              </p>
              <p className="text-sm">
                This sync will enable:
              </p>
              <ul className="text-xs text-gray-400 ml-4 space-y-1">
                <li>• FlowWager Points & Leaderboard</li>
                <li>• Activity History</li>
                <li>• Enhanced Dashboard Features</li>
                <li>• Social Features</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSyncModal(false)}
                className="flex-1 border-gray-700 text-gray-300 hover:bg-[#1A1F2C] bg-transparent"
                disabled={isSyncing}
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex-1 bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white font-medium"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Sync className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>

            {isSyncing && (
              <div className="text-center text-sm text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing your account data...
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div
        style={{
          pointerEvents: showOnboarding || showSyncModal ? "none" : undefined,
          opacity: showOnboarding || showSyncModal ? 0.5 : 1,
        }}
      >
        {children}
      </div>
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ... (keep your existing withAuth function) ...