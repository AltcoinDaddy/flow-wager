/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import * as fcl from '@onflow/fcl';
import flowConfig from '@/lib/flow/config';
import { GET_USER_BALANCE } from '@/lib/flow/scripts';
import { getUserProfile, createUserAccountTransaction } from "@/lib/flow-wager-scripts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

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
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute
const BALANCE_REFRESH_INTERVAL = 30 * 1000; // Refresh balance every 30 seconds
const SESSION_STORAGE_KEY = 'flow_auth_session';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(0);
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const balanceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingUsername, setOnboardingUsername] = useState("");
  const [onboardingDisplayName, setOnboardingDisplayName] = useState("");
  const [onboardingError, setOnboardingError] = useState<string>("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);



  console.log(onboardingError)

  const fetchBalance = useCallback(async (address: string) => {
    if (!address) return;

    setIsLoadingBalance(true);
    setBalanceError(null);

    try {
      const userBalance = await fcl.query({
        cadence: GET_USER_BALANCE,
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

  const startBalanceMonitoring = useCallback((address: string) => {
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current);
    }

    fetchBalance(address);

    balanceIntervalRef.current = setInterval(() => {
      fetchBalance(address);
    }, BALANCE_REFRESH_INTERVAL);
  }, [fetchBalance]);

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
    console.log('Session expired - automatically logging out user');
    try {
      await fcl.unauthenticate();
      setUser(null);
      clearSessionData();
      clearTimers();
      stopBalanceMonitoring();
      setShowOnboarding(false);
    } catch (error) {
      console.error('Auto logout failed:', error);
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
      } else {
        clearSessionData();
        clearTimers();
        stopBalanceMonitoring();
        setSessionTimeRemaining(0);
        setShowOnboarding(false);
      }
    });

    return () => {
      unsubscribe();
      clearTimers();
    };
  }, [isSessionExpired, autoLogout, getSessionTimestamp, saveSessionTimestamp, startSessionMonitoring, startBalanceMonitoring, clearSessionData, clearTimers, stopBalanceMonitoring]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetSessionActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [resetSessionActivity]);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (user?.addr && user.loggedIn) {
        try {
          const script = await getUserProfile();
          const profile = await fcl.query({
            cadence: script,
            args: (arg, t) => [arg(user?.addr || "", t.Address)],
          });
          setShowOnboarding(!profile);
        } catch {
          setShowOnboarding(true);
        }
      } else {
        setShowOnboarding(false);
      }
    };
    checkOnboarding();
  }, [user?.addr, user?.loggedIn]);

  const handleCreateAccount = async () => {
    setOnboardingError("");
    if (!onboardingUsername.trim() || !onboardingDisplayName.trim()) {
      setOnboardingError("Username and display name are required.");
      console.error("Onboarding error: Username and display name are required.");
      toast.error("Username and display name are required.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(onboardingUsername)) {
      setOnboardingError("Username can only contain letters, numbers, and underscores.");
      console.error("Onboarding error: Username can only contain letters, numbers, and underscores.");
      toast.error("Username can only contain letters, numbers, and underscores.");
      return;
    }
    if (onboardingUsername.length < 3 || onboardingUsername.length > 20) {
      setOnboardingError("Username must be between 3 and 20 characters.");
      console.error("Onboarding error: Username must be between 3 and 20 characters.");
      toast.error("Username must be between 3 and 20 characters.");
      return;
    }
    setIsCreatingAccount(true);
    try {
      const tx = await createUserAccountTransaction();
      const authorization = fcl.currentUser.authorization;
      const txId = await fcl.mutate({
        cadence: tx,
        args: (arg, t) => [
          arg(onboardingUsername.trim(), t.String),
          arg(onboardingDisplayName.trim(), t.String),
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
            args: (arg, t) => [arg(user?.addr ?? "", t.Address)],
          });
          if (profile) break;
          await new Promise(res => setTimeout(res, 1000));
        }
        if (profile) {
          setShowOnboarding(false);
          setOnboardingUsername("");
          setOnboardingDisplayName("");
          toast.success("User account created successfully!");
        } else {
          const errorMsg = "Account created, but profile not yet available. Please try again.";
          setOnboardingError(errorMsg);
          console.error("Onboarding error:", errorMsg);
          toast.error(errorMsg);
        }
      } else {
        throw new Error(result.errorMessage || "Transaction failed");
      }
    } catch (err: any) {
      const errorMsg = typeof err.message === 'string' ? err.message : "Failed to create user account";
      setOnboardingError(errorMsg);
      console.error("Onboarding error:", errorMsg);
      toast.error(errorMsg);
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
      console.error('Login failed:', error);
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
      console.error('Logout failed:', error);
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
      console.error('Authentication failed:', error);
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
      console.error('Unauthentication failed:', error);
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
  };

  return (
    <AuthContext.Provider value={value}>
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="bg-[#0A0C14] bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14] border border-gray-800/50">
          <DialogHeader>
            <DialogTitle>Create Your FlowWager Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1">Username</label>
              <input
                type="text"
                value={onboardingUsername}
                onChange={e => setOnboardingUsername(e.target.value)}
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
                onChange={e => setOnboardingDisplayName(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[#9b87f5]"
                placeholder="Enter your display name"
                disabled={isCreatingAccount}
              />
            </div>
            <button
              onClick={handleCreateAccount}
              className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white font-bold py-2 rounded mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isCreatingAccount}
            >
              {isCreatingAccount ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
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
      <div style={{ pointerEvents: showOnboarding ? "none" : undefined, opacity: showOnboarding ? 0.5 : 1 }}>
        {children}
      </div>
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <div>Please connect your wallet to continue.</div>;
    }

    return <Component {...props} />;
  };
};

export default AuthProvider;