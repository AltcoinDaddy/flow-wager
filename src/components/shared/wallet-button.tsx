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
import { Avatar, AvatarFallback, } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  LogOut, 
  User,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { 
  truncateAddress, 
  formatTime, 
  copyToClipboard, 
  getFlowscanUrl, 
  getAvatarFallback 
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
    sessionTimeRemaining
  } = useAuth();

  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (walletAddress) {
      await copyToClipboard(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return toast.success("Address copied to clipboard");
    }
  };

  if (!isAuthenticated || !walletAddress) {
    return (
      <Button 
        onClick={login} 
        disabled={isLoading}
        className="flex items-center space-x-2"
        style={{ 
          backgroundColor: "#9b87f5", 
          color: "white",
          borderColor: "#9b87f5"
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
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center space-x-2 h-9"
          style={{ 
            backgroundColor: "#9b87f5", 
            color: "white",
            borderColor: "#9b87f5"
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
            <span className="text-sm font-medium" style={{ color: "white" }}>
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
        className="w-64" 
        align="end"
        style={{ backgroundColor: "#9b87f5", borderColor: "#8b5cf6" }}
      >
        {/* User Info */}
        <div className="flex items-center space-x-3 p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback style={{ backgroundColor: "#a78bfa", color: "white" }}>
              {getAvatarFallback(walletAddress)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: "white" }}>Flow Wallet</p>
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

        {/* Session Info */}
        {sessionTimeRemaining > 0 && (
          <>
            <div className="px-3 pb-2">
              <p className="text-xs" style={{ color: "#e9d5ff" }}>
                Session expires in: {formatTime(sessionTimeRemaining)}
              </p>
            </div>
            <DropdownMenuSeparator style={{ backgroundColor: "#8b5cf6" }} />
          </>
        )}

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
            color: isLoadingBalance ? "#e9d5ff" : "white"
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
            <ExternalLink className="h-4 w-4 mr-2" style={{ color: "white" }} />
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
  );
}