/**
 * PaywallScreen
 * Subscription options with enhanced animations
 */

import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

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
  const { updateForm } = useOnboarding();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("annual");

  const handleSelectPlan = (plan: PlanType) => {
    hapticPress();
    setSelectedPlan(plan);
  };

  const handlePro = () => {
    hapticPress();
    updateForm({ planChoice: "pro" });
    onNext();
  };

  const handleFree = () => {
    hapticPress();
    updateForm({ planChoice: "free" });
    onFree();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name="flash" size={32} color="#000" />
        </View>
        <Text allowFontScaling={false} style={styles.title}>
          Unlock your{"\n"}full potential
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Join 50,000+ members transforming their fitness
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
                color={darkColors.primary} 
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
              <Ionicons name="checkmark-circle" size={24} color={darkColors.primary} />
            )}
          </View>
          <View style={styles.priceRow}>
            <Text allowFontScaling={false} style={styles.priceMain}>$5.83</Text>
            <Text allowFontScaling={false} style={styles.pricePer}>/month</Text>
          </View>
          <Text allowFontScaling={false} style={styles.planHint}>
            $69.99/year after 7-day free trial
          </Text>
          <View style={styles.savingsTag}>
            <Ionicons name="pricetag" size={12} color="#000" />
            <Text allowFontScaling={false} style={styles.savingsText}>
              Save $50 vs monthly
            </Text>
          </View>
        </Pressable>

        {/* Monthly Plan */}
        <Pressable
          onPress={() => handleSelectPlan("monthly")}
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
              <Ionicons name="checkmark-circle" size={24} color={darkColors.primary} />
            )}
          </View>
          <View style={styles.priceRow}>
            <Text allowFontScaling={false} style={styles.priceMainAlt}>$9.99</Text>
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
        <Button 
          title="Start 7-Day Free Trial" 
          onPress={handlePro}
        />
        <View style={styles.guarantee}>
          <Ionicons name="shield-checkmark" size={16} color={darkColors.muted} />
          <Text allowFontScaling={false} style={styles.guaranteeText}>
            Cancel anytime during trial, no charge
          </Text>
        </View>
      </Animated.View>

      {/* Free Option */}
      <Animated.View 
        entering={FadeInDown.delay(400).duration(400)} 
        style={styles.freeSection}
      >
        <Pressable onPress={handleFree} style={styles.freeButton}>
          <Text allowFontScaling={false} style={styles.freeText}>
            Continue with limited features
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: darkColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: darkColors.text,
    fontFamily: theme.fonts.heading,
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
  },
  subtitle: {
    color: darkColors.muted,
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
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitIconHighlight: {
    backgroundColor: darkColors.selectedBg,
    borderWidth: 1,
    borderColor: darkColors.primary,
  },
  benefitText: {
    color: darkColors.text,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 15,
    flex: 1,
  },
  plans: {
    gap: 12,
  },
  planCard: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  planCardSelected: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
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
    color: darkColors.text,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 18,
  },
  planTitleAlt: {
    color: darkColors.text,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 16,
  },
  bestValueBadge: {
    backgroundColor: darkColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bestValueText: {
    color: "#000",
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
    color: darkColors.text,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 32,
  },
  priceMainAlt: {
    color: darkColors.text,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 22,
  },
  pricePer: {
    color: darkColors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 16,
  },
  pricePerAlt: {
    color: darkColors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
  },
  planHint: {
    color: darkColors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  planHintAlt: {
    color: darkColors.muted2,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  savingsTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: darkColors.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 4,
  },
  savingsText: {
    color: "#000",
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 12,
  },
  ctaSection: {
    gap: 12,
  },
  guarantee: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  guaranteeText: {
    color: darkColors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
  freeSection: {
    alignItems: "center",
  },
  freeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  freeText: {
    color: darkColors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
