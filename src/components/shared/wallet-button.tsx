"use client";

import { useState } from "react";
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

  const [copied, setCopied] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
                    <Avatar className="h-10 w-10">
                      <AvatarFallback
                        style={{ backgroundColor: "#a78bfa", color: "white" }}
                      >
                        {getAvatarFallback(walletAddress)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium"
                        style={{ color: "white" }}
                      >
                        Flow Wallet
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: "#e9d5ff" }}
                      >
                        {walletAddress}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: "#a78bfa", color: "white" }}
                        >
                          {isLoadingBalance ? "Loading..." : `${balance} FLOW`}
                        </Badge>
                      </div>
                    </div>
                  </div>

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
                  <AvatarFallback
                    className="text-xs"
                    style={{ backgroundColor: "#a78bfa", color: "white" }}
                  >
                    {getAvatarFallback(walletAddress)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "white" }}
                  >
                    {truncateAddress(walletAddress)}
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
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    style={{ backgroundColor: "#a78bfa", color: "white" }}
                  >
                    {getAvatarFallback(walletAddress)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "white" }}>
                    Flow Wallet
                  </p>
                  <p className="text-xs truncate" style={{ color: "#e9d5ff" }}>
                    {walletAddress}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{ backgroundColor: "#a78bfa", color: "white" }}
                    >
                      {isLoadingBalance ? "Loading..." : `${balance} FLOW`}
                    </Badge>
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
                  <User className="h-4 w-4 mr-2" style={{ color: "white" }} />
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
