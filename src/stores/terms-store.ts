import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TermsStore {
  hasAcceptedTerms: boolean;
  showTermsModal: boolean;
  acceptedAt: string | null;
  acceptTerms: () => void;
  declineTerms: () => void;
  showTermsDialog: () => void;
  hideTermsDialog: () => void;
  resetTermsAcceptance: () => void;
}

export const useTermsStore = create<TermsStore>()(
  persist(
    (set) => ({
      hasAcceptedTerms: false,
      showTermsModal: true, // Show modal by default on first load
      acceptedAt: null,

      acceptTerms: () => {
        set({
          hasAcceptedTerms: true,
          showTermsModal: false,
          acceptedAt: new Date().toISOString(),
        });
      },

      declineTerms: () => {
        set({
          hasAcceptedTerms: false,
          showTermsModal: true,
        });
        // Optional: Close the tab/window or redirect
        if (typeof window !== "undefined") {
          window.close();
          // If window.close() doesn't work (popup blockers), show a message
          setTimeout(() => {
            alert("Please close this tab to exit the site.");
          }, 100);
        }
      },

      showTermsDialog: () => {
        set({ showTermsModal: true });
      },

      hideTermsDialog: () => {
        set({ showTermsModal: false });
      },

      resetTermsAcceptance: () => {
        set({
          hasAcceptedTerms: false,
          showTermsModal: true,
          acceptedAt: null,
        });
      },
    }),
    {
      name: "flow-wager-terms-storage",
      partialize: (state) => ({
        hasAcceptedTerms: state.hasAcceptedTerms,
        acceptedAt: state.acceptedAt,
        // Don't persist showTermsModal - always check on load
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.hasAcceptedTerms) {
          state.showTermsModal = true;
        }
      },
    },
  ),
);