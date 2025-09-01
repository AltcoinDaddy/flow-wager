"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTermsStore } from "@/stores/terms-store";
import { AlertTriangle, FileText, Shield, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function TermsModal() {
  const { showTermsModal, hasAcceptedTerms, acceptTerms, declineTerms } =
    useTermsStore();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything on server side or if already accepted
  if (!isClient) return null;

  // Show modal if user hasn't accepted terms yet
  const shouldShowModal = showTermsModal && !hasAcceptedTerms;

  return (
    <Dialog open={shouldShowModal} onOpenChange={() => {}}>
      <DialogContent
        className="w-[95vw] sm:w-[90vw] max-w-2xl bg-[#1A1F2C] border-gray-700 text-white flex flex-col p-0 gap-0 max-h-[90vh] sm:max-h-[85vh] z-[100] fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header - Fixed at top */}
        <div className="p-4 sm:p-6 border-b border-gray-700/50 flex-shrink-0">
          <DialogHeader className="space-y-2 sm:space-y-3">
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 sm:gap-3">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-[#9b87f5] flex-shrink-0" />
              <span>Terms & Conditions</span>
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-sm sm:text-base">
              Please review and accept to continue using FlowWager.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 text-gray-200 leading-relaxed">
              {/* Risk Warning */}
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-semibold text-red-300 mb-2 sm:mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  High Risk Warning
                </h3>
                <p className="text-red-200 text-xs sm:text-sm leading-relaxed">
                  Prediction markets involve significant financial risk. You may
                  lose all invested funds. Only invest what you can afford to
                  lose completely.
                </p>
              </div>

              {/* Key Terms */}
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3">
                  Key Terms
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <li>• You must be 18+ and comply with local laws</li>
                  <li>• All transactions use FLOW tokens on Flow blockchain</li>
                  <li>• Platform charges 3% fee on total market pool</li>
                  <li>• Smart contracts are experimental and may have bugs</li>
                  <li>• Blockchain transactions are irreversible</li>
                  <li>• Market resolutions are final and binding</li>
                </ul>
              </div>

              {/* Additional Terms */}
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3">
                  Platform Rules
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <li>• Markets are resolved based on objective criteria</li>
                  <li>• Dispute resolution follows predetermined procedures</li>
                  <li>• Users are responsible for their own tax obligations</li>
                  <li>• Platform reserves right to pause markets if necessary</li>
                  <li>• No refunds once transactions are confirmed on blockchain</li>
                </ul>
              </div>

              {/* Prohibited */}
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3">
                  Prohibited Activities
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <li>• Market manipulation or insider trading</li>
                  <li>• False evidence submission</li>
                  <li>• Exploiting smart contract vulnerabilities</li>
                  <li>• Money laundering or illegal activities</li>
                  <li>• Creating multiple accounts to circumvent limits</li>
                  <li>• Automated trading without prior approval</li>
                </ul>
              </div>

              {/* User Responsibilities */}
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3">
                  User Responsibilities
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <li>• Maintain security of your wallet and private keys</li>
                  <li>• Verify all transaction details before confirming</li>
                  <li>• Report bugs or vulnerabilities responsibly</li>
                  <li>• Stay informed about platform updates and changes</li>
                  <li>• Comply with all applicable laws and regulations</li>
                </ul>
              </div>

              {/* Legal */}
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3">
                  Legal Disclaimer
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed mb-3">
                  FlowWager is provided as is without warranties. We disclaim
                  all liability for losses or damages. This is an experimental
                  platform - use at your own risk.
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  By using this platform, you acknowledge that you understand
                  the risks involved and agree to hold harmless the platform
                  developers and operators.
                </p>
              </div>

              {/* Privacy */}
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3">
                  Privacy & Data
                </h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                  <li>• All transactions are public on the blockchain</li>
                  <li>• We dont collect personal information beyond wallet addresses</li>
                  <li>• Your trading activity is pseudonymous but traceable</li>
                  <li>• We may use analytics to improve platform performance</li>
                </ul>
              </div>

              <div className="bg-[#9b87f5]/5 border border-[#9b87f5]/20 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  By using FlowWager, you agree to these terms. Full terms
                  available at{" "}
                  <Link
                    href="/terms"
                    className="text-[#9b87f5] hover:text-[#8b5cf6] hover:underline font-medium transition-colors"
                  >
                    /terms
                  </Link>
                </p>
              </div>

              {/* Add extra padding at bottom for mobile scrolling */}
              <div className="h-4 sm:h-6"></div>
            </div>
          </ScrollArea>
        </div>

        {/* Floating Action Buttons - Fixed at bottom */}
        <div className="relative flex-shrink-0">
          {/* Background overlay to create separation */}
          <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-t from-[#0A0C14] via-[#0A0C14]/80 to-transparent pointer-events-none z-10"></div>

          {/* Button container with external styling */}
          <div className="bg-[#0A0C14] border-t border-gray-700/50 p-4 sm:p-6 relative z-20">
            {/* Shadow effect to make it appear floating */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-600/30 to-transparent"></div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
              <Button
                variant="outline"
                onClick={declineTerms}
                className="flex-1 h-11 sm:h-12 border-red-500/50 bg-red-900/10 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 text-sm sm:text-base font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25"
              >
                <X className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Decline
              </Button>
              <Button
                onClick={acceptTerms}
                className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-sm sm:text-base font-medium transition-all duration-200 shadow-lg shadow-[#9b87f5]/25 hover:shadow-[#9b87f5]/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Shield className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Accept & Continue
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}