"use client";

// src/components/shared/wallet-button.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  LogOut, 
  User,
  ChevronDown
} from "lucide-react";

// Mock hook - replace with actual Flow wallet hook
function useWallet() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const logIn = async () => {
    setIsLoading(true);
    // Simulate wallet connection
    setTimeout(() => {
      setUser({
        addr: "0x1234...5678",
        balance: "1,234.56",
        avatar: null,
        username: null
      });
      setIsLoading(false);
    }, 1000);
  };

  const logOut = () => {
    setUser(null);
  };

  return { user, logIn, logOut, isLoading };
}

export function WalletButton() {
  const { user, logIn, logOut, isLoading } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (user?.addr) {
      await navigator.clipboard.writeText(user.addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!user) {
    return (
      <Button 
        onClick={logIn} 
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
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-xs">
              {user.username ? user.username[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {user.username || truncateAddress(user.addr)}
            </span>
            <span className="text-xs text-muted-foreground">
              {user.balance} FLOW
            </span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end">
        {/* User Info */}
        <div className="flex items-center space-x-3 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>
              {user.username ? user.username[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {user.username || "Anonymous"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.addr}
            </p>
            <div className="flex items-center space-x-1 mt-1">
              <Badge variant="secondary" className="text-xs">
                {user.balance} FLOW
              </Badge>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Actions */}
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="h-4 w-4 mr-2" />
          <span>{copied ? "Copied!" : "Copy Address"}</span>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href={`https://flowscan.org/account/${user.addr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            <span>View on Flowscan</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a href={`/profile/${user.addr}`} className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span>View Profile</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={logOut} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}