"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Home,
  TrendingUp,
  PlusCircle,
  Trophy,
  BookOpen,
  FileText,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, walletAddress } = useAuth();

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <div className="flex items-center lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
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
          className="w-[300px] sm:w-[350px]"
          style={{
            backgroundColor: "#1a1c26",
            borderColor: "#2a2d3a",
            color: "white",
          }}
        >
          <SheetHeader>
            <SheetTitle style={{ color: "white" }}>Navigation</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col space-y-4 mt-8">
            {/* Main Navigation */}
            <div className="space-y-2">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
              >
                <Home className="h-5 w-5" style={{ color: "#9b87f5" }} />
                <span className="font-medium">Home</span>
              </Link>

              <Link
                href="/markets"
                onClick={handleLinkClick}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
              >
                <TrendingUp className="h-5 w-5" style={{ color: "#9b87f5" }} />
                <span className="font-medium">Markets</span>
              </Link>

              {isAuthenticated && (
                <Link
                  href="/dashboard/create"
                  onClick={handleLinkClick}
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
                onClick={handleLinkClick}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
              >
                <Trophy className="h-5 w-5" style={{ color: "#9b87f5" }} />
                <span className="font-medium">Leaderboard</span>
              </Link>

              {isAuthenticated && walletAddress && (
                <Link
                  href={`/dashboard/${walletAddress}`}
                  onClick={handleLinkClick}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
                >
                  <Trophy className="h-5 w-5" style={{ color: "#9b87f5" }} />
                  <span className="font-medium">My Dashboard</span>
                </Link>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-[#2a2d3a] my-4"></div>

            {/* Secondary Navigation */}
            <div className="space-y-2">
              <Link
                href="/learn"
                onClick={handleLinkClick}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
              >
                <BookOpen className="h-5 w-5" style={{ color: "#9b87f5" }} />
                <span className="font-medium">Learn</span>
              </Link>

              <Link
                href="/terms"
                onClick={handleLinkClick}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
              >
                <FileText className="h-5 w-5" style={{ color: "#9b87f5" }} />
                <span className="font-medium">Terms</span>
              </Link>

              <Link
                href="/privacy-policy"
                onClick={handleLinkClick}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors hover:bg-[#2a2d3a]"
              >
                <Shield className="h-5 w-5" style={{ color: "#9b87f5" }} />
                <span className="font-medium">Privacy Policy</span>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
