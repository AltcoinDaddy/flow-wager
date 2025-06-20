/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"


import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import * as fcl from '@onflow/fcl';
import flowConfig from '@/lib/flow/config'; // Import your existing config
import { GET_USER_BALANCE } from '@/lib/flow/scripts';


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
      {children}
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