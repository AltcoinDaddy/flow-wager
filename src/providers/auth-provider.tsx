/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"


import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import * as fcl from '@onflow/fcl';
import flowConfig from '@/lib/flow/config'; // Import your existing config
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

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout constants
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

  // Fetch user balance
  const fetchBalance = useCallback(async (address: string) => {
    if (!address) return;

    setIsLoadingBalance(true);
    setBalanceError(null);

    try {
      const userBalance = await fcl.query({
        cadence: GET_USER_BALANCE,
        args: (arg, t) => [
          arg(address, t.Address)
        ]
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

  // Refresh balance function for manual refresh
  const refreshBalance = useCallback(async () => {
    if (user?.addr) {
      await fetchBalance(user.addr);
    }
  }, [user?.addr, fetchBalance]);

  // Start balance monitoring
  const startBalanceMonitoring = useCallback((address: string) => {
    // Clear existing interval
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current);
    }

    // Fetch balance immediately
    fetchBalance(address);

    // Set up interval to refresh balance
    balanceIntervalRef.current = setInterval(() => {
      fetchBalance(address);
    }, BALANCE_REFRESH_INTERVAL);
  }, [fetchBalance]);

  // Stop balance monitoring
  const stopBalanceMonitoring = useCallback(() => {
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current);
      balanceIntervalRef.current = null;
    }
    setBalance("0.00");
    setBalanceError(null);
  }, []);

  // Clear all timers
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

  // Save session timestamp
  const saveSessionTimestamp = useCallback(() => {
    const timestamp = Date.now();
    localStorage.setItem(SESSION_STORAGE_KEY, timestamp.toString());
  }, []);

  // Get session timestamp
  const getSessionTimestamp = useCallback(() => {
    const timestamp = localStorage.getItem(SESSION_STORAGE_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  }, []);

  // Clear session data
  const clearSessionData = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  // Check if session is expired
  const isSessionExpired = useCallback(() => {
    const sessionStart = getSessionTimestamp();
    if (!sessionStart) return false;
    
    const now = Date.now();
    const elapsed = now - sessionStart;
    return elapsed > SESSION_TIMEOUT;
  }, [getSessionTimestamp]);

  // Get time remaining in session
  const getTimeRemaining = useCallback(() => {
    const sessionStart = getSessionTimestamp();
    if (!sessionStart) return 0;
    
    const now = Date.now();
    const elapsed = now - sessionStart;
    const remaining = SESSION_TIMEOUT - elapsed;
    return Math.max(0, remaining);
  }, [getSessionTimestamp]);

  // Auto logout function
  const autoLogout = useCallback(async () => {
    console.log('Session expired - automatically logging out user');
    try {
      await fcl.unauthenticate();
      setUser(null);
      clearSessionData();
      clearTimers();
      stopBalanceMonitoring();
    } catch (error) {
      console.error('Auto logout failed:', error);
    }
  }, [clearSessionData, clearTimers, stopBalanceMonitoring]);

  // Start session monitoring
  const startSessionMonitoring = useCallback(() => {
    clearTimers();
    
    const timeRemaining = getTimeRemaining();
    
    // Set timeout for auto logout
    sessionTimeoutRef.current = setTimeout(() => {
      autoLogout();
    }, timeRemaining);

    // Update session time remaining every minute
    sessionCheckIntervalRef.current = setInterval(() => {
      const remaining = getTimeRemaining();
      setSessionTimeRemaining(remaining);
      
      if (remaining <= 0) {
        autoLogout();
      }
    }, SESSION_CHECK_INTERVAL);

    // Set initial time remaining
    setSessionTimeRemaining(timeRemaining);
  }, [getTimeRemaining, autoLogout, clearTimers]);

  // Reset session activity
  const resetSessionActivity = useCallback(() => {
    if (user?.loggedIn) {
      saveSessionTimestamp();
      startSessionMonitoring();
    }
  }, [user?.loggedIn, saveSessionTimestamp, startSessionMonitoring]);

  useEffect(() => {
    // Configure FCL using your existing config
    flowConfig();

    // Check for existing session on mount
    const checkExistingSession = async () => {
      if (isSessionExpired()) {
        await autoLogout();
        return;
      }
    };

    checkExistingSession();

    // Subscribe to user authentication state changes
    const unsubscribe = fcl.currentUser.subscribe((currentUser: User) => {
      setUser(currentUser);
      setIsLoading(false);
      
      if (currentUser?.loggedIn && currentUser?.addr) {
        // User is logged in, start session and balance monitoring
        if (!getSessionTimestamp()) {
          saveSessionTimestamp();
        }
        startSessionMonitoring();
        startBalanceMonitoring(currentUser.addr);
      } else {
        // User is logged out, clear session data and timers
        clearSessionData();
        clearTimers();
        stopBalanceMonitoring();
        setSessionTimeRemaining(0);
      }
    });

    return () => {
      unsubscribe();
      clearTimers();
    };
  }, [isSessionExpired, autoLogout, getSessionTimestamp, saveSessionTimestamp, startSessionMonitoring, startBalanceMonitoring, clearSessionData, clearTimers, stopBalanceMonitoring]);

  // Add activity listeners to reset session
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
    // Auto-create user account/position on wallet connect
    const autoCreateUserAccount = async () => {
      if (user?.addr) {
        try {
          // 1. Check if user profile exists
          const script = await getUserProfile();
          const profile = await fcl.query({
            cadence: script,
            args: (arg, t) => [arg(user.addr ?? "", t.Address)],
          });
          // 2. If not, create it
          if (!profile) {
            const tx = await createUserAccountTransaction();
            await fcl.mutate({
              cadence: tx,
              args: () => [],
              proposer: fcl.authz,
              payer: fcl.authz,
              authorizations: [fcl.authz],
              limit: 100,
            });
          }
        } catch (err) {
          console.error("Error auto-creating user account:", err);
        }
      }
    };
    autoCreateUserAccount();
  }, [user?.addr]);

  // Check if user needs onboarding after login/connect
  useEffect(() => {
    const checkOnboarding = async () => {
      if (user?.addr && user.loggedIn) {
        try {
          const script = await getUserProfile();
          const profile = await fcl.query({
            cadence: script,
            args: (arg, t) => [arg(user.addr, t.Address)],
          });
          if (!profile) {
            setShowOnboarding(true);
          } else {
            setShowOnboarding(false);
          }
        } catch {
          setShowOnboarding(true);
        }
      } else {
        setShowOnboarding(false);
      }
    };
    checkOnboarding();
  }, [user?.addr, user?.loggedIn]);

  // Onboarding account creation handler
  const handleCreateAccount = async () => {
    setOnboardingError("");
    if (!onboardingUsername.trim() || !onboardingDisplayName.trim()) {
      setOnboardingError(String("Username and display name are required."));
      toast.error("Username and display name are required.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(onboardingUsername)) {
      setOnboardingError(String("Username can only contain letters, numbers, and underscores."));
      toast.error("Username can only contain letters, numbers, and underscores.");
      return;
    }
    if (onboardingUsername.length < 3 || onboardingUsername.length > 20) {
      setOnboardingError(String("Username must be between 3 and 20 characters."));
      toast.error("Username must be between 3 and 20 characters.");
      return;
    }
    setIsCreatingAccount(true);
    try {
      const tx = await createUserAccountTransaction();
      const authorization = fcl.currentUser().authorization;
      const txId = await fcl.mutate({
        cadence: tx,
        args: (arg, t) => [
          arg(onboardingUsername.trim(), t.String),
          arg(onboardingDisplayName.trim(), t.String)
        ],
        proposer: authorization,
        payer: authorization,
        authorizations: [authorization],
        limit: 100,
      });
      await fcl.tx(txId).onceSealed();
      // Re-check profile up to 5 times
      let profile = null;
      for (let i = 0; i < 5; i++) {
        const script = await getUserProfile();
        profile = await fcl.query({
          cadence: script,
          args: (arg, t) => [arg(String(user?.addr ?? ""), t.Address)],
        });
        if (profile) break;
        await new Promise(res => setTimeout(res, 1000)); // Wait 1s
      }
      if (profile) {
        setShowOnboarding(false);
        setOnboardingUsername("");
        setOnboardingDisplayName("");
        setOnboardingError(String(""));
        toast.success("User account created successfully!");
      } else {
        setOnboardingError(String("Account created, but not yet available. Please wait a moment and try again."));
        toast.error("Account created, but not yet available. Please wait a moment and try again.");
      }
    } catch (err: any) {
      const errorMsg = (err && typeof err.message === 'string') ? err.message : "Failed to create user account";
      setOnboardingError(String(errorMsg ?? ""));
      toast.error(String(errorMsg ?? "An error occurred"));
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
    } catch (error) {
      console.error('Logout failed:', error);
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
    } catch (error) {
      console.error('Unauthentication failed:', error);
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
      {/* Onboarding Modal */}
      <Dialog open={showOnboarding} onOpenChange={() => {}}>
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
            {onboardingError && <div className="text-red-400 text-sm">{String(onboardingError)}</div>}
            <button
              onClick={handleCreateAccount}
              className="w-full bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] text-white font-bold py-2 rounded mt-2 disabled:opacity-50"
              disabled={isCreatingAccount}
            >
              {isCreatingAccount ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Block app actions until onboarding is complete */}
      <div style={{ pointerEvents: showOnboarding ? "none" : undefined, opacity: showOnboarding ? 0.5 : 1 }}>
        {children}
      </div>
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
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