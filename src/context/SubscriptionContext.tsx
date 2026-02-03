/**
 * SubscriptionContext
 * 
 * Global subscription state management using RevenueCat.
 * Provides subscription status, purchase functions, and offering data.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { Platform, Alert } from "react-native";
import Constants from "expo-constants";
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";
import { supabase } from "@/lib/supabase";

// RevenueCat API Key from environment
const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || "";

// Check if running in Expo Go (can't use native RevenueCat)
const isExpoGo = Constants.appOwnership === "expo";

// Entitlement identifier (matches RevenueCat dashboard)
const PRO_ENTITLEMENT = "pro";

// Types
type SubscriptionPlan = "monthly" | "annual";

type SubscriptionState = {
  // Status
  isInitialized: boolean;
  isLoading: boolean;
  isPro: boolean;
  
  // Customer info
  customerInfo: CustomerInfo | null;
  activeSubscription: string | null;
  expirationDate: Date | null;
  
  // Offerings
  offering: PurchasesOffering | null;
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
  
  // Actions
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  purchasePlan: (plan: SubscriptionPlan) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
};

const defaultState: SubscriptionState = {
  isInitialized: false,
  isLoading: true,
  isPro: false,
  customerInfo: null,
  activeSubscription: null,
  expirationDate: null,
  offering: null,
  monthlyPackage: null,
  annualPackage: null,
  purchasePackage: async () => false,
  purchasePlan: async () => false,
  restorePurchases: async () => false,
  refreshStatus: async () => {},
};

const SubscriptionContext = createContext<SubscriptionState>(defaultState);

export const useSubscriptionContext = () => useContext(SubscriptionContext);

type SubscriptionProviderProps = {
  children: ReactNode;
};

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  // Derived state
  const isPro = useMemo(() => {
    if (!customerInfo) return false;
    return typeof customerInfo.entitlements.active[PRO_ENTITLEMENT] !== "undefined";
  }, [customerInfo]);

  const activeSubscription = useMemo(() => {
    if (!customerInfo) return null;
    const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT];
    return entitlement?.productIdentifier || null;
  }, [customerInfo]);

  const expirationDate = useMemo(() => {
    if (!customerInfo) return null;
    const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT];
    if (!entitlement?.expirationDate) return null;
    return new Date(entitlement.expirationDate);
  }, [customerInfo]);

  const monthlyPackage = useMemo(() => {
    return offering?.monthly || null;
  }, [offering]);

  const annualPackage = useMemo(() => {
    return offering?.annual || null;
  }, [offering]);

  // Initialize RevenueCat
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        // Skip RevenueCat in Expo Go - native modules not available
        if (isExpoGo) {
          console.log("📱 Running in Expo Go - subscriptions disabled. Use a development build for full functionality.");
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        if (!REVENUECAT_API_KEY) {
          console.warn("RevenueCat API key not found");
          setIsLoading(false);
          return;
        }

        // Set log level for debugging (remove in production)
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        // Configure RevenueCat
        if (Platform.OS === "ios") {
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        } else if (Platform.OS === "android") {
          // For Android, you'd use the Google API key
          // await Purchases.configure({ apiKey: GOOGLE_API_KEY });
          console.log("Android purchases not yet configured");
          setIsLoading(false);
          return;
        } else {
          // Web - no RevenueCat support
          setIsLoading(false);
          return;
        }

        // Identify user if logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await Purchases.logIn(user.id);
        }

        // Get initial customer info
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        // Get offerings
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          setOffering(offerings.current);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize RevenueCat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initRevenueCat();

    // Listen for customer info updates (only if not Expo Go)
    if (!isExpoGo) {
      Purchases.addCustomerInfoUpdateListener((info) => {
        setCustomerInfo(info);
      });
    }
  }, []);

  // Sync RevenueCat user with Supabase auth changes (skip in Expo Go)
  useEffect(() => {
    if (isExpoGo) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isInitialized) return;

      if (event === "SIGNED_IN" && session?.user) {
        try {
          await Purchases.logIn(session.user.id);
          const info = await Purchases.getCustomerInfo();
          setCustomerInfo(info);
        } catch (error) {
          console.error("Failed to sync RevenueCat user:", error);
        }
      } else if (event === "SIGNED_OUT") {
        try {
          await Purchases.logOut();
          const info = await Purchases.getCustomerInfo();
          setCustomerInfo(info);
        } catch (error) {
          console.error("Failed to log out of RevenueCat:", error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [isInitialized]);

  // Purchase a specific package
  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    // Show message in Expo Go
    if (isExpoGo) {
      Alert.alert(
        "Development Mode",
        "Purchases are not available in Expo Go. Please use a development build to test subscriptions.",
        [{ text: "OK" }]
      );
      return false;
    }

    try {
      setIsLoading(true);
      const { customerInfo: newInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(newInfo);
      
      const purchased = typeof newInfo.entitlements.active[PRO_ENTITLEMENT] !== "undefined";
      return purchased;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error("Purchase failed:", error);
        Alert.alert(
          "Purchase Failed",
          error.message || "Something went wrong. Please try again."
        );
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Purchase by plan type
  const purchasePlan = useCallback(async (plan: SubscriptionPlan): Promise<boolean> => {
    // Show message in Expo Go
    if (isExpoGo) {
      Alert.alert(
        "Development Mode",
        "Purchases are not available in Expo Go. Please use a development build to test subscriptions.",
        [{ text: "OK" }]
      );
      return false;
    }

    const pkg = plan === "monthly" ? monthlyPackage : annualPackage;
    if (!pkg) {
      Alert.alert("Error", "Subscription package not available. Please try again later.");
      return false;
    }
    return purchasePackage(pkg);
  }, [monthlyPackage, annualPackage, purchasePackage]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    // Show message in Expo Go
    if (isExpoGo) {
      Alert.alert(
        "Development Mode",
        "Restore purchases is not available in Expo Go. Please use a development build.",
        [{ text: "OK" }]
      );
      return false;
    }

    try {
      setIsLoading(true);
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      
      const restored = typeof info.entitlements.active[PRO_ENTITLEMENT] !== "undefined";
      
      if (restored) {
        Alert.alert("Success", "Your purchases have been restored!");
      } else {
        Alert.alert("No Purchases Found", "We couldn't find any previous purchases to restore.");
      }
      
      return restored;
    } catch (error: any) {
      console.error("Restore failed:", error);
      Alert.alert(
        "Restore Failed",
        error.message || "Something went wrong. Please try again."
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh subscription status
  const refreshStatus = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (error) {
      console.error("Failed to refresh subscription status:", error);
    }
  }, []);

  const value: SubscriptionState = {
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
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export default SubscriptionContext;
