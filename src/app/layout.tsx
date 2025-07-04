import { ErrorBoundary } from "@/components/shared/error-bounday";
import { Header } from "@/components/shared/header";
import { AuthProvider } from "@/providers/auth-provider";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0A0C14]`}>
        <ErrorBoundary>
          <AuthProvider>
            <div className="min-h-screen flex flex-col bg-[#0A0C14] text-white">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
            <Toaster theme="dark" position="top-right"/>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
