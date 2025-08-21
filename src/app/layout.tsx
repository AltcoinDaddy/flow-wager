import { ErrorBoundary } from "@/components/shared/error-bounday";
import { Header } from "@/components/shared/header";
import { AuthProvider } from "@/providers/auth-provider";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/shared/footer";

const inter = Inter({ subsets: ["latin"] });

// ✅ Global Metadata
export const metadata = {
  title: {
    default: "FlowWager – Decentralized Prediction Markets",
    template: "%s | FlowWager",
  },
  description:
    "Trade, predict, and win on FlowWager. Fully on-chain, transparent, and community-driven prediction markets on Flow blockchain.",
  metadataBase: new URL("https://www.flowwager.xyz"), // your production domain
  openGraph: {
    title: "FlowWager – Decentralized Prediction Markets",
    description:
      "Trade, predict, and win on FlowWager. Fully on-chain, transparent, and community-driven.",
    url: "https://flowwager.xyz",
    siteName: "FlowWager",
    images: [
      {
        url: "https://www.flowwager.xyz/favicon.ico",
        width: 1200,
        height: 630,
        alt: "FlowWager",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowWager – Decentralized Prediction Markets",
    description:
      "Trade, predict, and win on FlowWager. Fully on-chain, transparent, and community-driven.",
    creator: "@flowwager", // update if you have a Twitter handle
    images: ["https://www.flowwager.xyz/favicon.ico"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://www.flowwager.xyz",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14]`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <div className="min-h-screen flex flex-col bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14] text-white">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster theme="dark" position="top-right" />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
