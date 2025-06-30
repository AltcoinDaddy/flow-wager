"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WalletButton } from "./wallet-button";
import { SearchBar } from "./search-bar";
import { BarChart3, Trophy, Menu, X, TrendingUp } from "lucide-react";

const navigation = [
  { name: "Markets", href: "/markets", icon: TrendingUp },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full p-6">
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-xl bg-[#1A1F2C]/80 rounded-3xl border border-[#9b87f5]/20 p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            {/* Logo and Search Section */}
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#9b87f5] via-[#8b5cf6] to-[#7c3aed] rounded-2xl flex items-center justify-center transform rotate-12">
                    <div className="w-8 h-8 bg-[#0A0C14] rounded-lg transform -rotate-12 flex items-center justify-center">
                      <div className="w-3 h-3 bg-gradient-to-br from-[#9b87f5] to-[#8b5cf6] rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#a78bfa] to-[#9b87f5] rounded-full animate-pulse"></div>
                </div>
                <div className="text-3xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-[#9b87f5] via-[#8b5cf6] to-[#a78bfa] bg-clip-text text-transparent">
                    Flow
                  </span>
                  <span className="text-white">Wager</span>
                </div>
              </Link>

              
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile Search Toggle */}
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-[#9b87f5]/20"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "white" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </Button>
              </div>

              {/* Wallet Button */}
              <WalletButton />

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-300 hover:text-white hover:bg-[#9b87f5]/20 p-2"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" style={{ color: "white" }} />
                  ) : (
                    <Menu className="h-6 w-6" style={{ color: "white" }} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 mx-6">
          <div className="backdrop-blur-xl bg-[#1A1F2C]/80 rounded-3xl border border-[#9b87f5]/20 p-6 shadow-2xl">
            <div className="space-y-2">
              {/* Mobile Search */}
              <div className="lg:hidden px-3 py-2 mb-4">
                <SearchBar />
              </div>

              {/* Mobile Navigation */}
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#9b87f5]/20 text-white"
                        : "text-gray-300 hover:bg-[#9b87f5]/10 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" style={{ color: "white" }} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
