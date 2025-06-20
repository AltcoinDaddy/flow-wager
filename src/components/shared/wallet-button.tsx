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



export function WalletButton() {
  const { 

    login, 
    logout, 
    isLoading, 
    isAuthenticated,
    walletAddress,
    balance,
    isLoadingBalance,
    balanceError,
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
      >
        <Wallet className="h-4 w-4" />
        <span>{isLoading ? "Connecting..." : "Connect Wallet"}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2 h-9">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {getAvatarFallback(walletAddress)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {truncateAddress(walletAddress)}
            </span>
            <span className="text-xs text-muted-foreground">
              {isLoadingBalance ? "Loading..." : `${balance} FLOW`}
            </span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end">
        {/* User Info */}
        <div className="flex items-center space-x-3 p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {getAvatarFallback(walletAddress)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Flow Wallet</p>
            <p className="text-xs text-muted-foreground truncate">
              {walletAddress}
            </p>
            <div className="flex items-center space-x-1 mt-1">
              <Badge variant="secondary" className="text-xs">
                {isLoadingBalance ? "Loading..." : `${balance} FLOW`}
              </Badge>
              {balanceError && (
                <Badge variant="destructive" className="text-xs">
                  Error
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Session Info */}
        {sessionTimeRemaining > 0 && (
          <>
            <div className="px-3 pb-2">
              <p className="text-xs text-muted-foreground">
                Session expires in: {formatTime(sessionTimeRemaining)}
              </p>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Actions */}
        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="h-4 w-4 mr-2" />
          <span>{copied ? "Copied!" : "Copy Address"}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={refreshBalance} disabled={isLoadingBalance}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingBalance ? "animate-spin" : ""}`} />
          <span>Refresh Balance</span>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={getFlowscanUrl(walletAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            <span>View on Flowscan</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a href={`/profile/${walletAddress}`} className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span>View Profile</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={logout} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}