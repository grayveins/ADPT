/**
 * useSubscription Hook
 * 
 * Convenient hook for accessing subscription status and actions.
 * Wrapper around SubscriptionContext for easier component usage.
 */

import { useCallback, useMemo } from "react";
import { useSubscriptionContext } from "@/src/context/SubscriptionContext";

type SubscriptionPlan = "monthly" | "annual";

/**
 * Hook for accessing subscription state and actions
 */
export function useSubscription() {
  const context = useSubscriptionContext();

  const {
    isInitialized,
    isLoading,
    isPro,
    customerInfo,
    activeSubscription,
    expirationDate,
    offering,
    monthlyPackage,
    annualPackage,
    purchasePackage,
    purchasePlan,
    restorePurchases,
    refreshStatus,
  } = context;

  // Formatted price strings
  const monthlyPrice = useMemo(() => {
    return monthlyPackage?.product.priceString || "$12.99";
  }, [monthlyPackage]);

  const annualPrice = useMemo(() => {
    return annualPackage?.product.priceString || "$79.99";
  }, [annualPackage]);

  // Monthly equivalent for annual (for savings display)
  const annualMonthlyEquivalent = useMemo(() => {
    if (!annualPackage?.product.price) return "$6.67";
    const monthlyEquiv = annualPackage.product.price / 12;
    return `$${monthlyEquiv.toFixed(2)}`;
  }, [annualPackage]);

  // Calculate savings percentage
  const savingsPercent = useMemo(() => {
    if (!monthlyPackage?.product.price || !annualPackage?.product.price) return 49;
    const yearlyIfMonthly = monthlyPackage.product.price * 12;
    const savings = ((yearlyIfMonthly - annualPackage.product.price) / yearlyIfMonthly) * 100;
    return Math.round(savings);
  }, [monthlyPackage, annualPackage]);

  // Human-readable subscription status
  const subscriptionStatus = useMemo(() => {
    if (!isInitialized) return "Loading...";
    if (isPro) {
      if (activeSubscription?.includes("annual")) return "Pro (Annual)";
      if (activeSubscription?.includes("monthly")) return "Pro (Monthly)";
      return "Pro";
    }
    return "Free";
  }, [isInitialized, isPro, activeSubscription]);

  // Formatted expiration date
  const formattedExpirationDate = useMemo(() => {
    if (!expirationDate) return null;
    return expirationDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [expirationDate]);

  // Check if user is in trial period
  const isTrialActive = useMemo(() => {
    if (!customerInfo) return false;
    const entitlement = customerInfo.entitlements.active["pro"];
    return entitlement?.periodType === "TRIAL";
  }, [customerInfo]);

  // Subscribe helper (shows paywall behavior)
  const subscribe = useCallback(async (plan: SubscriptionPlan = "annual"): Promise<boolean> => {
    return purchasePlan(plan);
  }, [purchasePlan]);

  return {
    // State
    isInitialized,
    isLoading,
    isPro,
    isTrialActive,
    
    // Subscription details
    activeSubscription,
    subscriptionStatus,
    expirationDate,
    formattedExpirationDate,
    
    // Packages & pricing
    offering,
    monthlyPackage,
    annualPackage,
    monthlyPrice,
    annualPrice,
    annualMonthlyEquivalent,
    savingsPercent,
    
    // Actions
    subscribe,
    purchasePackage,
    purchasePlan,
    restorePurchases,
    refreshStatus,
  };
}

/**
 * Hook for checking if a feature requires pro
 * Returns true if feature should be accessible
 */
export function useFeatureAccess(feature: "savedPrograms" | "aiCoach" | "fullHistory" | "unlimitedWorkouts") {
  const { isPro } = useSubscription();
  
  // Define free tier limits
  const FREE_LIMITS = {
    savedPrograms: 0,      // No saved programs on free
    aiCoach: 3,            // 3 AI coach messages per day
    fullHistory: 7,        // 7 days of history
    unlimitedWorkouts: 3,  // 3 workouts per week
  };

  const hasAccess = useMemo(() => {
    // Pro users have access to everything
    if (isPro) return true;
    
    // Free tier - only basic features
    return false;
  }, [isPro]);

  const limit = FREE_LIMITS[feature];

  return {
    hasAccess,
    isPro,
    limit,
  };
}

export default useSubscription;
