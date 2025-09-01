"use client";

import { useTermsStore } from "@/stores/terms-store";
import { getUserLocation, isRegionRestricted } from "@/lib/geolocation";
import { useEffect, useState } from "react";
import { TermsModal } from "./terms-modal";
import { RegionRestrictionModal } from "./region-restriction-modal";

interface TermsGuardProps {
  children: React.ReactNode;
}

export function TermsGuard({ children }: TermsGuardProps) {
  const {
    hasAcceptedTerms,
    isLoadingRegion,
    setRegionRestricted,
    setLoadingRegion,
    setRegionError,
  } = useTermsStore();
  const [isClient, setIsClient] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkRegion = async () => {
      try {
        setLoadingRegion(true);
        const location = await getUserLocation();

        if (location.error) {
          setRegionError(location.error);
          // If we can't determine location, allow access but log the issue
          setRegionRestricted(false);
          return;
        }

        const restricted = isRegionRestricted(location.countryCode);
        setRegionRestricted(restricted, location.countryCode, location.country);

        if (restricted) {
          console.warn(
            `Access from restricted region: ${location.country} (${location.countryCode})`
          );
        }
      } catch (error) {
        console.error("Region check failed:", error);
        setRegionError("Failed to verify region");
        // On error, allow access but log the issue
        setRegionRestricted(false);
      } finally {
        setLoadingRegion(false);
      }
    };

    checkRegion();
  }, [setRegionRestricted, setLoadingRegion, setRegionError]);

  // Show loading state while checking region
  if (isLoadingRegion) {
    return (
      <div className="min-h-screen bg-[#0A0C14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#9b87f5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying location...</p>
        </div>
      </div>
    );
  }

  // Don't render anything on server side or before hydration
  if (!isClient || !isHydrated) {
    return (
      <div className="fixed inset-0 w-full h-full bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#9b87f5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading FlowWager...</p>
        </div>
      </div>
    );
  }

  // If terms haven't been accepted, show blocked state with modal
  if (!hasAcceptedTerms) {
    return (
      <div className="fixed inset-0 w-full h-full bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14] flex items-center justify-center relative overflow-hidden">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        {/* Blocked content message */}
        <div className="relative z-10 text-center max-w-sm sm:max-w-md mx-auto px-4">
          <div className="bg-[#1A1F2C] rounded-lg p-6 sm:p-8 border border-gray-700 shadow-2xl">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#9b87f5]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-[#9b87f5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              Access Restricted
            </h2>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              You must accept our Terms & Conditions to access FlowWager and
              participate in prediction markets.
            </p>
            <p className="text-xs sm:text-sm text-gray-400">
              Please review and accept the terms in the modal to continue.
            </p>
          </div>
        </div>

        {/* Terms Modal */}
        <TermsModal />
      </div>
    );
  }

  // If terms are accepted, render the app normally
  return (
    <>
      {children}
      <RegionRestrictionModal />
      <TermsModal />
    </>
  );
}
