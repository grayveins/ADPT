/**
 * PaywallScreen
 * Subscription options with RevenueCat integration
 */

import React, { useState, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import { useSubscription } from "@/src/hooks/useSubscription";
import Button from "@/src/components/Button";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";

type PaywallScreenProps = {
  onNext: () => void;
  onFree: () => void;
};

const benefits = [
  { icon: "fitness", text: "Unlimited AI workout plans", highlight: true },
  { icon: "analytics", text: "Progress tracking & insights", highlight: false },
  { icon: "chatbubble", text: "24/7 AI coaching support", highlight: true },
  { icon: "refresh", text: "Adaptive programming", highlight: false },
] as const;

type PlanType = "annual" | "monthly";

export default function PaywallScreen({ onNext, onFree }: PaywallScreenProps) {
  const { colors } = useTheme();
  const { updateForm } = useOnboarding();
  const { 
    isLoading: subscriptionLoading,
    monthlyPackage,
    annualPackage,
    monthlyPrice,
    annualPrice,
    annualMonthlyEquivalent,
    savingsPercent,
    purchasePlan,
    restorePurchases,
    isPro,
  } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("annual");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Calculate savings amount (monthly x 12 - annual)
  const savingsAmount = useMemo(() => {
    if (!monthlyPackage?.product.price || !annualPackage?.product.price) {
      return "$76"; // $12.99 * 12 - $79.99 = $75.89, round to $76
    }
    const yearlyIfMonthly = monthlyPackage.product.price * 12;
    const savings = yearlyIfMonthly - annualPackage.product.price;
    return `$${Math.round(savings)}`;
  }, [monthlyPackage, annualPackage]);

  const handleSelectPlan = (plan: PlanType) => {
    hapticPress();
    setSelectedPlan(plan);
  };

  const handlePurchase = async () => {
    hapticPress();
    setIsPurchasing(true);
    
    try {
      const success = await purchasePlan(selectedPlan);
      
      if (success) {
        hapticSuccess();
        updateForm({ planChoice: "pro" });
        onNext();
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    hapticPress();
    setIsRestoring(true);
    
    try {
      const restored = await restorePurchases();
      
      if (restored) {
        hapticSuccess();
        updateForm({ planChoice: "pro" });
        onNext();
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFree = () => {
    hapticPress();
    updateForm({ planChoice: "free" });
    onFree();
  };

  // If already pro (edge case), skip paywall
  if (isPro) {
    updateForm({ planChoice: "pro" });
    onNext();
    return null;
  }

  const isButtonDisabled = isPurchasing || isRestoring || subscriptionLoading;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name="flash" size={32} color={colors.textOnPrimary} />
        </View>
        <Text allowFontScaling={false} style={styles.title}>
          Unlock your{"\n"}full potential
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Join thousands transforming their fitness
        </Text>
      </Animated.View>

      {/* Benefits */}
      <Animated.View 
        entering={FadeInDown.delay(150).duration(400)} 
        style={styles.benefits}
      >
        {benefits.map((benefit, i) => (
          <View key={i} style={styles.benefitRow}>
            <View style={[
              styles.benefitIcon,
              benefit.highlight && styles.benefitIconHighlight,
            ]}>
              <Ionicons 
                name={benefit.icon as any} 
                size={18} 
                color={colors.primary} 
              />
            </View>
            <Text allowFontScaling={false} style={styles.benefitText}>
              {benefit.text}
            </Text>
          </View>
        ))}
      </Animated.View>

      {/* Plan Selection */}
      <Animated.View 
        entering={FadeInDown.delay(250).duration(400)} 
        style={styles.plans}
      >
        {/* Annual Plan */}
        <Pressable
          onPress={() => handleSelectPlan("annual")}
          disabled={isButtonDisabled}
          style={({ pressed }) => [
            styles.planCard,
            selectedPlan === "annual" && styles.planCardSelected,
            pressed && styles.planCardPressed,
          ]}
        >
          <View style={styles.planHeader}>
            <View style={styles.planTitleRow}>
              <Text allowFontScaling={false} style={styles.planTitle}>
                Annual
              </Text>
              <View style={styles.bestValueBadge}>
                <Text allowFontScaling={false} style={styles.bestValueText}>
                  BEST VALUE
                </Text>
              </View>
            </View>
            {selectedPlan === "annual" && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </View>
          <View style={styles.priceRow}>
            <Text allowFontScaling={false} style={styles.priceMain}>
              {annualMonthlyEquivalent}
            </Text>
            <Text allowFontScaling={false} style={styles.pricePer}>/month</Text>
          </View>
          <Text allowFontScaling={false} style={styles.planHint}>
            {annualPrice}/year after 7-day free trial
          </Text>
          <View style={styles.savingsTag}>
            <Ionicons name="pricetag" size={12} color={colors.textOnPrimary} />
            <Text allowFontScaling={false} style={styles.savingsText}>
              Save {savingsAmount} vs monthly
            </Text>
          </View>
        </Pressable>

        {/* Monthly Plan */}
        <Pressable
          onPress={() => handleSelectPlan("monthly")}
          disabled={isButtonDisabled}
          style={({ pressed }) => [
            styles.planCard,
            styles.planCardSmall,
            selectedPlan === "monthly" && styles.planCardSelected,
            pressed && styles.planCardPressed,
          ]}
        >
          <View style={styles.planHeader}>
            <Text allowFontScaling={false} style={styles.planTitleAlt}>
              Monthly
            </Text>
            {selectedPlan === "monthly" && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </View>
          <View style={styles.priceRow}>
            <Text allowFontScaling={false} style={styles.priceMainAlt}>
              {monthlyPrice}
            </Text>
            <Text allowFontScaling={false} style={styles.pricePerAlt}>/month</Text>
          </View>
          <Text allowFontScaling={false} style={styles.planHintAlt}>
            Cancel anytime
          </Text>
        </Pressable>
      </Animated.View>

      {/* CTA */}
      <Animated.View 
        entering={FadeInDown.delay(350).duration(400)} 
        style={styles.ctaSection}
      >
        <Pressable
          onPress={handlePurchase}
          disabled={isButtonDisabled}
          style={[
            styles.purchaseButton,
            { backgroundColor: colors.primary },
            isButtonDisabled && { opacity: 0.7 },
          ]}
        >
          {isPurchasing ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text allowFontScaling={false} style={[styles.purchaseButtonText, { color: colors.textOnPrimary }]}>
              Start 7-Day Free Trial
            </Text>
          )}
        </Pressable>
        <View style={styles.guarantee}>
          <Ionicons name="shield-checkmark" size={16} color={colors.textMuted} />
          <Text allowFontScaling={false} style={styles.guaranteeText}>
            Cancel anytime during trial, no charge
          </Text>
        </View>
      </Animated.View>

      {/* Restore & Free Options */}
      <Animated.View 
        entering={FadeInDown.delay(400).duration(400)} 
        style={styles.bottomSection}
      >
        <Pressable 
          onPress={handleRestore} 
          disabled={isButtonDisabled}
          style={styles.restoreButton}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (
            <Text allowFontScaling={false} style={styles.restoreText}>
              Restore Purchases
            </Text>
          )}
        </Pressable>
        
        <Pressable onPress={handleFree} style={styles.freeButton}>
          <Text allowFontScaling={false} style={styles.freeText}>
            Continue with limited features
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingVertical: 8,
      gap: 20,
    },
    hero: {
      alignItems: "center",
      gap: 12,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: colors.text,
      fontFamily: theme.fonts.heading,
      fontSize: 28,
      lineHeight: 34,
      textAlign: "center",
    },
    subtitle: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 15,
      textAlign: "center",
    },
    benefits: {
      gap: 12,
      paddingHorizontal: 8,
    },
    benefitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    benefitIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
    },
    benefitIconHighlight: {
      backgroundColor: colors.selected,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    benefitText: {
      color: colors.text,
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 15,
      flex: 1,
    },
    plans: {
      gap: 12,
    },
    planCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      gap: 8,
      borderWidth: 2,
      borderColor: "transparent",
    },
    planCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.selected,
    },
    planCardSmall: {
      paddingVertical: 14,
    },
    planCardPressed: {
      opacity: 0.9,
    },
    planHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    planTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    planTitle: {
      color: colors.text,
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 18,
    },
    planTitleAlt: {
      color: colors.text,
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 16,
    },
    bestValueBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    bestValueText: {
      color: colors.textOnPrimary,
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 10,
      letterSpacing: 0.5,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 4,
    },
    priceMain: {
      color: colors.text,
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 32,
    },
    priceMainAlt: {
      color: colors.text,
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 22,
    },
    pricePer: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 16,
    },
    pricePerAlt: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 14,
    },
    planHint: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 13,
    },
    planHintAlt: {
      color: colors.inputPlaceholder,
      fontFamily: theme.fonts.body,
      fontSize: 13,
    },
    savingsTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary,
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      marginTop: 4,
    },
    savingsText: {
      color: colors.textOnPrimary,
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 12,
    },
    ctaSection: {
      gap: 12,
    },
    purchaseButton: {
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    purchaseButtonText: {
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 17,
    },
    guarantee: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    guaranteeText: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 13,
    },
    bottomSection: {
      alignItems: "center",
      gap: 8,
    },
    restoreButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    restoreText: {
      color: colors.primary,
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 14,
    },
    freeButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    freeText: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 14,
      textDecorationLine: "underline",
    },
  });
