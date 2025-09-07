"use client";

import { useTermsStore, checkPreviousRegionAcknowledgment } from "@/stores/terms-store";
import { getUserLocation, isRegionRestricted } from "@/lib/geolocation";
import { useEffect } from "react";
import { TermsModal } from "./terms-modal";
import { RegionRestrictionModal } from "./region-restriction-modal";

interface TermsGuardProps {
  children: React.ReactNode;
}

export function TermsGuard({ children }: TermsGuardProps) {
  const { 
    isLoadingRegion,
    setRegionRestricted, 
    setLoadingRegion, 
    setRegionError,
    acknowledgeRegion 
  } = useTermsStore();

  useEffect(() => {
    const checkRegionAndCookies = async () => {
      try {
        setLoadingRegion(true);
        
        // First, check if user has previously acknowledged their region
        const previousAcknowledgment = checkPreviousRegionAcknowledgment();
        
        if (previousAcknowledgment.acknowledged && previousAcknowledgment.countryCode) {
          // User has previously acknowledged, check if it's the same region
          const location = await getUserLocation();
          
          if (location.countryCode === previousAcknowledgment.countryCode) {
            // Same region as before, automatically acknowledge
            const restricted = isRegionRestricted(location.countryCode);
            setRegionRestricted(restricted, location.countryCode, location.country);
            acknowledgeRegion();
            setLoadingRegion(false);
            return;
          }
        }
        
        // Get fresh location data
        const location = await getUserLocation();
        
        if (location.error) {
          setRegionError(location.error);
          setRegionRestricted(false);
          return;
        }

        const restricted = isRegionRestricted(location.countryCode);
        setRegionRestricted(restricted, location.countryCode, location.country);
        
        if (restricted) {
          console.warn(`Access from restricted region: ${location.country} (${location.countryCode})`);
        }
        
        // If user has previously acknowledged this specific region, auto-acknowledge
        if (previousAcknowledgment.acknowledged && 
            previousAcknowledgment.countryCode === location.countryCode) {
          acknowledgeRegion();
        }
        
      } catch (error) {
        console.error('Region check failed:', error);
        setRegionError('Failed to verify region');
        setRegionRestricted(false);
      } finally {
        setLoadingRegion(false);
      }
    };

    checkRegionAndCookies();
  }, [setRegionRestricted, setLoadingRegion, setRegionError, acknowledgeRegion]);

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

  return (
    <>
      {children}
      <RegionRestrictionModal />
      <TermsModal />
    </>
  );
}