import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "api.dicebear.com",
      "flowscan.org",
      "avatars.githubusercontent.com",
    ],
  },
  env: {
    NEXT_PUBLIC_FLOW_NETWORK: process.env.NEXT_PUBLIC_FLOW_NETWORK || "mainnet",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  webpack: (config) => {
    // Fix for Flow FCL in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: true, // Allow build to succeed even with TypeScript errors

  },
  eslint: {
    ignoreDuringBuilds: true, // Allow build to succeed even with ESLint errors
  }
};

export default nextConfig;
