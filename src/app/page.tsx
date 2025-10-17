"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, TrendingUp, Users, Shield } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14]">
      {/* Hero Section */}
      <section className="w-full h-screen relative overflow-hidden bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14] flex items-center justify-center">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%239b87f5' fillOpacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
            }}
          ></div>
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#9b87f5]/10 border border-[#9b87f5]/30 mb-8 animate-pulse">
            <Zap className="h-4 w-4 text-[#9b87f5] mr-2" />
            <span className="text-[#9b87f5] font-medium text-sm">
              Coming Soon
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
            FlowWager
            <span className="block text-[#9b87f5] text-4xl md:text-6xl lg:text-7xl mt-2">
              v2.0
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
            The next generation of decentralized prediction markets
          </p>

          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Enhanced with real-time analytics, improved UX, and powerful new
            features powered by Flow EVM
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              asChild
              size="lg"
              className="bg-[#9b87f5] hover:bg-[#8b5cf6] text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg shadow-[#9b87f5]/25"
            >
              <Link href="/learn">
                Learn More
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white px-8 py-4 text-lg font-semibold rounded-lg"
              onClick={() => {
                window.open("https://github.com/your-repo", "_blank");
              }}
            >
              View on GitHub
            </Button>
          </div>

          {/* Coming Soon Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-[#1A1F2C]/50 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-[#9b87f5]/30 transition-all duration-300">
              <div className="bg-[#9b87f5]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="h-6 w-6 text-[#9b87f5]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Real-time Analytics
              </h3>
              <p className="text-gray-400 text-sm">
                Powered by Dune Analytics with live market insights, user
                performance tracking, and comprehensive dashboards
              </p>
            </div>

            <div className="bg-[#1A1F2C]/50 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-[#9b87f5]/30 transition-all duration-300">
              <div className="bg-[#9b87f5]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Users className="h-6 w-6 text-[#9b87f5]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Enhanced UX
              </h3>
              <p className="text-gray-400 text-sm">
                Redesigned interface with improved market discovery, better
                mobile experience, and streamlined trading flows
              </p>
            </div>

            <div className="bg-[#1A1F2C]/50 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-[#9b87f5]/30 transition-all duration-300">
              <div className="bg-[#9b87f5]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Shield className="h-6 w-6 text-[#9b87f5]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Flow EVM Ready
              </h3>
              <p className="text-gray-400 text-sm">
                Built for Flow EVM with improved scalability, lower costs, and
                seamless integration with Ethereum tooling
              </p>
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-[#9b87f5]/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-[#7c3aed]/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-[#9b87f5]/5 rounded-full blur-lg animate-bounce delay-500"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-[#8b5cf6]/5 rounded-full blur-lg animate-bounce delay-700"></div>
      </section>

      {/* What's Coming Section */}
      <section className="py-20 px-4 bg-[#0A0C14]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              What's Coming in v2
            </h2>
            <p className="text-xl text-gray-400">
              We're building the most advanced prediction market platform on
              Flow
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start space-x-4 p-6 bg-[#1A1F2C] rounded-xl border border-gray-800">
              <div className="bg-[#9b87f5] w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Advanced Analytics Dashboard
                </h3>
                <p className="text-gray-400">
                  Deep market insights, user performance tracking, trending
                  analysis, and comprehensive reporting powered by Dune
                  Analytics integration.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-[#1A1F2C] rounded-xl border border-gray-800">
              <div className="bg-[#9b87f5] w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Flow EVM Integration
                </h3>
                <p className="text-gray-400">
                  Leveraging Flow EVM for better performance, Ethereum tooling
                  compatibility, and seamless cross-chain functionality.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-[#1A1F2C] rounded-xl border border-gray-800">
              <div className="bg-[#9b87f5] w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Enhanced Market Creation
                </h3>
                <p className="text-gray-400">
                  More market types, better resolution mechanisms, automated
                  market makers, and improved liquidity management.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-[#1A1F2C] rounded-xl border border-gray-800">
              <div className="bg-[#9b87f5] w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-bold">4</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Mobile-First Experience
                </h3>
                <p className="text-gray-400">
                  Redesigned responsive interface with mobile trading
                  optimization, push notifications, and progressive web app
                  features.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#9b87f5]/10 via-[#8b5cf6]/5 to-[#7c3aed]/10">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Stay Updated</h2>
          <p className="text-xl text-gray-300 mb-8">
            Be the first to know when FlowWager v2 launches. Follow our
            development progress and get early access.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="bg-[#9b87f5] hover:bg-[#8b5cf6] text-white px-8 py-4 text-lg font-semibold rounded-lg"
            >
              <a
                href="https://twitter.com/flowwager"
                target="_blank"
                rel="noopener noreferrer"
              >
                Follow on Twitter
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-[#9b87f5] text-[#9b87f5] hover:bg-[#9b87f5] hover:text-white px-8 py-4 text-lg font-semibold rounded-lg"
            >
              <a
                href="https://discord.gg/flowwager"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join Discord
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
