import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/shared/error-bounday";
import { Header } from "@/components/shared/header";

const inter = Inter({ subsets: ["latin"] });



export const metadata: Metadata = {
  title: "FlowWager - Decentralized Prediction Markets",
  description: "Trade on the outcome of real-world events with FlowWager, the premier prediction market platform built on Flow blockchain.",
  keywords: ["prediction markets", "flow blockchain", "trading", "forecasting", "defi"],
  authors: [{ name: "FlowWager Team" }],
  creator: "FlowWager",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://flowwager.com",
    title: "FlowWager - Decentralized Prediction Markets",
    description: "Trade on the outcome of real-world events with FlowWager",
    siteName: "FlowWager",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowWager - Decentralized Prediction Markets", 
    description: "Trade on the outcome of real-world events with FlowWager",
    creator: "@flowwager",
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
      <body className={inter.className}>
        <ErrorBoundary>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}