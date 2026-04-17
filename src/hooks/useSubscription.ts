/**
 * Subscription stub — paywall removed for v1 coaching prototype.
 * All users treated as pro.
 */

export function useSubscription() {
  return {
    isPro: true,
    isTrialing: false,
    trialDaysLeft: 0,
    loading: false,
    offerings: null,
    purchasePackage: async () => {},
    restorePurchases: async () => {},
  };
}

export function useFeatureAccess() {
  return { canAccess: true, reason: null };
}
