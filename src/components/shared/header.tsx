"use client";

import Link from "next/link";
import { WalletButton } from "./wallet-button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full p-6">
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-xl bg-[#1A1F2C]/80 rounded-3xl border border-[#9b87f5]/20 p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-[20px]">
            <div className="flex items-center space-x-2">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#9b87f5] via-[#8b5cf6] to-[#7c3aed] rounded-2xl flex items-center justify-center transform rotate-12">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#0A0C14] rounded-lg transform -rotate-12 flex items-center justify-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-br from-[#9b87f5] to-[#8b5cf6] rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-[#a78bfa] to-[#9b87f5] rounded-full animate-pulse"></div>
                </div>
                {/* Text - Hidden on mobile, visible on sm and up */}
                <div className="hidden sm:block sm:text-3xl text-xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-[#9b87f5] via-[#8b5cf6] to-[#a78bfa] bg-clip-text text-transparent">
                    Flow
                  </span>
                  <span className="text-white">Wager</span>
                </div>
              </Link>
            </div>
            {/* Wallet Button */}
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
}