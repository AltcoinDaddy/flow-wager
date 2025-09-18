"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Copy,
  ExternalLink,
  LogOut,
  User,
  ChevronDown,
  RefreshCw,
  Menu,
  Home,
  TrendingUp,
  PlusCircle,
  Trophy,
  BookOpen,
  FileText,
  Shield,
  Star,
  Award,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import {
  truncateAddress,
  formatTime,
  copyToClipboard,
  getFlowscanUrl,
  getAvatarFallback,
} from "@/utils/wallet";
import { toast } from "sonner";
import Link from "next/link";
import { useUserData } from "@/hooks/use-user-data";
import { PointsManager } from "@/lib/points-system";
import { Tables } from "@/utils/supabase/database";

type UserStats = Tables<"user_stats">;

export function WalletButton() {
  const {
    login,
    logout,
    isLoading,
    isAuthenticated,
    walletAddress,
    balance,
    isLoadingBalance,
    refreshBalance,
    sessionTimeRemaining,
  } = useAuth();

  const {
    user: supabaseUser,
    loading: userDataLoading,
    displayName,
    hasProfile,
  } = useUserData(walletAddress);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Fetch user stats from Supabase
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!walletAddress) {
        setUserStats(null);
        return;
      }

      try {
        setStatsLoading(true);
        const stats = await PointsManager.getUserStats(walletAddress);
        setUserStats(stats);
      } catch (error) {
        setUserStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchUserStats();
  }, [walletAddress]);

  const handleCopyAddress = async () => {
    if (walletAddress) {
      await copyToClipboard(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return toast.success("Address copied to clipboard");
    }
  };

  const handleMobileNavLinkClick = () => {
    setMobileNavOpen(false);
  };

  const handleMobileLogout = () => {
    logout();
    setMobileNavOpen(false);
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Mobile Navigation - Only shows on mobile */}
      <div className="lg:hidden">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              style={{ color: "white" }}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="w-[300px] sm:w-[350px] flex flex-col h-full"
            style={{
              backgroundColor: "#1a1c26",
              borderColor: "#2a2d3a",
              color: "white",
            }}
          >
            <SheetHeader className="flex-shrink-0">
              <SheetTitle style={{ color: "white" }}>Menu</SheetTitle>
            </SheetHeader>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-6 mt-4 pr-2">
              {/* Wallet Section */}
              {isAuthenticated && walletAddress ? (
                <div className="bg-[#2a2d3a] rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="h-12 w-12">
                      {supabaseUser?.profile_image_url ? (
                        <img
                          src={supabaseUser.profile_image_url}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <AvatarFallback
                          style={{ backgroundColor: "#a78bfa", color: "white" }}
                        >
                          {getAvatarFallback(walletAddress)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium"
                        style={{ color: "white" }}
                      >
                        {userDataLoading ? "Loading..." : displayName}
                      </p>
                      {supabaseUser?.username && (
                        <p className="text-xs" style={{ color: "#e9d5ff" }}>
                          @{supabaseUser.username}
                        </p>
                      )}
                      <p
                        className="text-xs truncate"
                        style={{ color: "#9b87f5" }}
                      >
                        {walletAddress}
                      </p>
                      <div className="flex items-center space-x-2 mt-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: "#a78bfa", color: "white" }}
                        >
                          {isLoadingBalance ? "Loading..." : `${balance} FLOW`}
                        </Badge>
                        {userStats && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: "#f59e0b",
                              color: "white",
                            }}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {statsLoading
                              ? "..."
                              : `${userStats.flowwager_points || 0} pts`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* User Stats Row */}
                  {userStats && !statsLoading && (
                    <div className="bg-[#1a1c26] rounded-lg p-3 mb-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-xs text-gray-400">Win Rate</p>
                          <p className="text-sm font-medium text-green-400">
                            {userStats.total_markets_participated
                              ? Math.round(
                                  ((userStats.total_winnings || 0) /
                                    (userStats.total_staked || 1)) *
                                    100,
                                )
                              : 0}
                            %
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Markets</p>
                          <p className="text-sm font-medium text-blue-400">
                            {userStats.total_markets_participated || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Streak</p>
                          <p className="text-sm font-medium text-yellow-400">
                            {userStats.current_streak || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wallet Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={handleCopyAddress}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#3a3d4a] w-full text-left"
                    >
                      <Copy className="h-4 w-4" style={{ color: "#9b87f5" }} />
                      <span className="text-sm">
                        {copied ? "Copied!" : "Copy Address"}
                      </span>
                    </button>

                    <button
                      onClick={refreshBalance}
                      disabled={isLoadingBalance}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#3a3d4a] w-full text-left disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${isLoadingBalance ? "animate-spin" : ""}`}
                        style={{ color: "#9b87f5" }}
                      />
                      <span className="text-sm">Refresh Balance</span>
                    </button>

                    <a
                      href={getFlowscanUrl(walletAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#3a3d4a] w-full"
                    >
                      <ExternalLink
                        className="h-4 w-4"
                        style={{ color: "#9b87f5" }}
                      />
                      <span className="text-sm">View on Flowscan</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-[#2a2d3a] rounded-lg p-4">
                  <Button
                    onClick={login}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2"
                    style={{
                      backgroundColor: "#9b87f5",
                      color: "white",
                      borderColor: "#9b87f5",
                    }}
                  >
                    <Wallet className="h-4 w-4" />
                    <span>
                      {isLoading ? "Connecting..." : "Connect Wallet"}
                    </span>
                  </Button>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-400 px-3">
                  Navigation
                </h3>

                <Link
                  href="/"
                  onClick={handleMobileNavLinkClick}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
                >
                  <Home className="h-5 w-5" style={{ color: "#9b87f5" }} />
                  <span className="font-medium">Home</span>
                </Link>

                <Link
                  href="/markets"
                  onClick={handleMobileNavLinkClick}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
                >
                  <TrendingUp
                    className="h-5 w-5"
                    style={{ color: "#9b87f5" }}
                  />
                  <span className="font-medium">Markets</span>
                </Link>

                {isAuthenticated && (
                  <Link
                    href="/dashboard/create"
                    onClick={handleMobileNavLinkClick}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
                  >
                    <PlusCircle
                      className="h-5 w-5"
                      style={{ color: "#9b87f5" }}
                    />
                    <span className="font-medium">Create Market</span>
                  </Link>
                )}

                <Link
                  href="/leaderboard"
                  onClick={handleMobileNavLinkClick}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
                >
                  <Trophy className="h-5 w-5" style={{ color: "#9b87f5" }} />
                  <span className="font-medium">Leaderboard</span>
                </Link>

                {isAuthenticated && walletAddress && (
                  <Link
                    href={`/dashboard/${walletAddress}`}
                    onClick={handleMobileNavLinkClick}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
                  >
                    <User className="h-5 w-5" style={{ color: "#9b87f5" }} />
                    <span className="font-medium">My Dashboard</span>
                  </Link>
                )}
              </div>

              {/* Secondary Navigation */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-400 px-3">
                  Resources
                </h3>

                <Link
                  href="/learn"
                  onClick={handleMobileNavLinkClick}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
                >
                  <BookOpen className="h-5 w-5" style={{ color: "#9b87f5" }} />
                  <span className="font-medium">Learn</span>
                </Link>

                <Link
                  href="/terms"
                  onClick={handleMobileNavLinkClick}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
                >
                  <FileText className="h-5 w-5" style={{ color: "#9b87f5" }} />
                  <span className="font-medium">Terms</span>
                </Link>

                <Link
                  href="/privacy-policy"
                  onClick={handleMobileNavLinkClick}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
                >
                  <Shield className="h-5 w-5" style={{ color: "#9b87f5" }} />
                  <span className="font-medium">Privacy Policy</span>
                </Link>
              </div>
            </div>

            {/* Fixed Footer - Logout Button */}
            {isAuthenticated && (
              <div className="flex-shrink-0 pt-4 mt-4 border-t border-[#2a2d3a]">
                <button
                  onClick={handleMobileLogout}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-red-600/20 w-full text-left text-red-400"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Disconnect Wallet</span>
                </button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Wallet Button - Hidden on mobile */}
      <div className="hidden lg:block">
        {!isAuthenticated || !walletAddress ? (
          <Button
            onClick={login}
            disabled={isLoading}
            className="flex items-center space-x-2 text-sm"
            style={{
              backgroundColor: "#9b87f5",
              color: "white",
              borderColor: "#9b87f5",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#8b5cf6";
              e.currentTarget.style.borderColor = "#8b5cf6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#9b87f5";
              e.currentTarget.style.borderColor = "#9b87f5";
            }}
          >
            <Wallet className="h-4 w-4" style={{ color: "white" }} />
            <span>{isLoading ? "Connecting..." : "Connect Wallet"}</span>
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center space-x-2 h-9 text-sm"
                style={{
                  backgroundColor: "#9b87f5",
                  color: "white",
                  borderColor: "#9b87f5",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#8b5cf6";
                  e.currentTarget.style.borderColor = "#8b5cf6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#9b87f5";
                  e.currentTarget.style.borderColor = "#9b87f5";
                }}
              >
                <Avatar className="h-6 w-6">
                  {supabaseUser?.profile_image_url ? (
                    <img
                      src={supabaseUser.profile_image_url}
                      alt={displayName}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback
                      className="text-xs"
                      style={{ backgroundColor: "#a78bfa", color: "white" }}
                    >
                      {getAvatarFallback(walletAddress)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col items-start">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "white" }}
                  >
                    {userDataLoading
                      ? "Loading..."
                      : supabaseUser?.username ||
                        truncateAddress(walletAddress)}
                  </span>
                  <span className="text-xs" style={{ color: "#e9d5ff" }}>
                    {isLoadingBalance ? "Loading..." : `${balance} FLOW`}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4" style={{ color: "white" }} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-64 sm:w-72"
              align="end"
              style={{ backgroundColor: "#9b87f5", borderColor: "#8b5cf6" }}
            >
              {/* User Info */}
              <div className="flex items-center space-x-3 p-3">
                <Avatar className="h-12 w-12">
                  {supabaseUser?.profile_image_url ? (
                    <img
                      src={supabaseUser.profile_image_url}
                      alt={displayName}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback
                      style={{ backgroundColor: "#a78bfa", color: "white" }}
                    >
                      {getAvatarFallback(walletAddress)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "white" }}>
                    {userDataLoading ? "Loading..." : displayName}
                  </p>
                  {supabaseUser?.username && (
                    <p className="text-xs" style={{ color: "#e9d5ff" }}>
                      @{supabaseUser.username}
                    </p>
                  )}
                  <p className="text-xs truncate" style={{ color: "#e9d5ff" }}>
                    {walletAddress}
                  </p>
                  <div className="flex items-center space-x-2 mt-1 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{ backgroundColor: "#f59e0b", color: "white" }}
                    >
                      {isLoadingBalance ? "Loading..." : `${balance} FLOW`}
                    </Badge>
                    {userStats && (
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{ backgroundColor: "#f59e0b", color: "white" }}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        {statsLoading
                          ? "..."
                          : `${userStats.flowwager_points || 0} pts`}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <DropdownMenuItem
                onClick={handleCopyAddress}
                className="cursor-pointer"
                style={{ color: "white" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#8b5cf6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Copy className="h-4 w-4 mr-2" style={{ color: "white" }} />
                <span>{copied ? "Copied!" : "Copy Address"}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={refreshBalance}
                disabled={isLoadingBalance}
                className="cursor-pointer"
                style={{
                  color: isLoadingBalance ? "#e9d5ff" : "white",
                }}
                onMouseEnter={(e) => {
                  if (!isLoadingBalance) {
                    e.currentTarget.style.backgroundColor = "#8b5cf6";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoadingBalance ? "animate-spin" : ""}`}
                  style={{ color: "white" }}
                />
                <span>Refresh Balance</span>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <a
                  href={getFlowscanUrl(walletAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center cursor-pointer"
                  style={{ color: "white" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#8b5cf6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <ExternalLink
                    className="h-4 w-4 mr-2"
                    style={{ color: "white" }}
                  />
                  <span>View on Flowscan</span>
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/${walletAddress}`}
                  className="flex items-center cursor-pointer"
                  style={{ color: "white" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#8b5cf6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <User className="h-4 w-4 mr-2" style={{ color: "white" }} />
                  <span>View Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href={`/leaderboard`}
                  className="flex items-center cursor-pointer"
                  style={{ color: "white" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#8b5cf6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Award className="h-4 w-4 mr-2" style={{ color: "white" }} />
                  <span>View Leaderboard</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator style={{ backgroundColor: "#8b5cf6" }} />

              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer"
                style={{ color: "#fecaca" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#ef4444";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#fecaca";
                }}
              >
                <LogOut className="h-4 w-4 mr-2" style={{ color: "white" }} />
                <span>Disconnect</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
