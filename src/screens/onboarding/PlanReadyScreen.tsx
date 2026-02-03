/**
 * PlanReadyScreen
 * Shows summary of personalized plan after building
 * Creates excitement before paywall
 */

import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  FadeInDown,
  ZoomIn,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import { hapticPress, hapticCelebration } from "@/src/animations/feedback/haptics";

type PlanReadyScreenProps = {
  onNext: () => void;
};

// Goal label mapping
const goalLabels: Record<string, string> = {
  build_muscle: "Build Muscle",
  lose_weight: "Lose Weight",
  get_toned: "Get Toned",
  endurance: "Build Endurance",
};

// Equipment label mapping
const equipmentLabels: Record<string, string> = {
  full_gym: "Full Gym",
  home_gym: "Home Gym",
  dumbbells: "Dumbbells Only",
  bodyweight: "Bodyweight",
};

// Experience label mapping
const experienceLabels: Record<string, string> = {
  beginner: "Beginner",
  novice: "Novice",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function PlanReadyScreen({ onNext }: PlanReadyScreenProps) {
  const { colors } = useTheme();
  const { form } = useOnboarding();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Animation values
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const ringProgress = useSharedValue(0);

  useEffect(() => {
    // Celebration animation on mount
    hapticCelebration();
    
    checkScale.value = withDelay(
      300,
      withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 15 })
      )
    );
    checkOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));
    ringProgress.value = withDelay(200, withTiming(1, { duration: 800 }));
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const handleNext = () => {
    hapticPress();
    onNext();
  };

  // Build plan summary based on form data
  const planFeatures = [
    {
      icon: "calendar",
      label: "Training Days",
      value: `${form.workoutsPerWeek || 4} days/week`,
    },
    {
      icon: "time",
      label: "Session Length",
      value: `${form.workoutDuration || 45} minutes`,
    },
    {
      icon: "barbell",
      label: "Equipment",
      value: equipmentLabels[form.equipment || "full_gym"],
    },
    {
      icon: "trending-up",
      label: "Experience Level",
      value: experienceLabels[form.experienceLevel || "intermediate"],
    },
  ];

  return (
    <ScrollView 
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Success animation */}
      <View style={styles.successContainer}>
        <Animated.View style={[styles.checkContainer, checkStyle]}>
          <View style={styles.checkGradient}>
            <Ionicons name="checkmark" size={48} color={colors.textOnPrimary} />
          </View>
        </Animated.View>
      </View>

      {/* Header */}
      <Animated.View 
        entering={FadeInDown.delay(400).duration(400)}
        style={styles.header}
      >
        <Text allowFontScaling={false} style={styles.title}>
          Your plan is ready!
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          We&apos;ve created a personalized {goalLabels[form.goal || "build_muscle"].toLowerCase()} program just for you
        </Text>
      </Animated.View>

      {/* Plan summary card */}
      <Animated.View 
        entering={FadeInDown.delay(500).duration(400)}
        style={styles.planCard}
      >
        <View style={styles.planHeader}>
          <View style={styles.planIcon}>
            <Ionicons name="fitness" size={24} color={colors.primary} />
          </View>
          <View>
            <Text allowFontScaling={false} style={styles.planTitle}>
              {goalLabels[form.goal || "build_muscle"]} Program
            </Text>
            <Text allowFontScaling={false} style={styles.planSubtitle}>
              Personalized for your goals
            </Text>
          </View>
        </View>

        <View style={styles.planDivider} />

        <View style={styles.planFeatures}>
          {planFeatures.map((feature, index) => (
            <Animated.View
              key={feature.label}
              entering={FadeInDown.delay(600 + index * 80).duration(400)}
              style={styles.planFeature}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={20} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text allowFontScaling={false} style={styles.featureLabel}>
                  {feature.label}
                </Text>
                <Text allowFontScaling={false} style={styles.featureValue}>
                  {feature.value}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* What&apos;s included */}
      <Animated.View 
        entering={FadeInDown.delay(900).duration(400)}
        style={styles.includesSection}
      >
        <Text allowFontScaling={false} style={styles.includesTitle}>
          What&apos;s included
        </Text>
        <View style={styles.includesList}>
          <IncludeItem text="Progressive overload built-in" colors={colors} />
          <IncludeItem text="Rest day recommendations" colors={colors} />
          <IncludeItem text="AI coach for any questions" colors={colors} />
          <IncludeItem text="Automatic plan adjustments" colors={colors} />
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View 
        entering={FadeInDown.delay(1000).duration(400)}
        style={styles.ctaContainer}
      >
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
        >
          <View style={styles.ctaGradient}>
            <Text allowFontScaling={false} style={styles.ctaText}>
              Continue
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
          </View>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

function IncludeItem({ text, colors }: { text: string; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
      <Text allowFontScaling={false} style={{ color: colors.textMuted, fontSize: 15, fontFamily: theme.fonts.body }}>{text}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      paddingVertical: 16,
      paddingBottom: 24,
    },
    successContainer: {
      alignItems: "center",
      marginBottom: 24,
    },
    checkContainer: {
      borderRadius: 48,
      overflow: "hidden",
    },
    checkGradient: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    header: {
      alignItems: "center",
      gap: 8,
      marginBottom: 24,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontFamily: theme.fonts.heading,
      textAlign: "center",
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 16,
      fontFamily: theme.fonts.body,
      textAlign: "center",
      lineHeight: 24,
    },
    planCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
    },
    planHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    planIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
    },
    planTitle: {
      color: colors.text,
      fontSize: 18,
      fontFamily: theme.fonts.bodySemiBold,
    },
    planSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: theme.fonts.body,
    },
    planDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    planFeatures: {
      gap: 12,
    },
    planFeature: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    featureText: {
      flex: 1,
      gap: 2,
    },
    featureLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
    },
    featureValue: {
      color: colors.text,
      fontSize: 15,
      fontFamily: theme.fonts.bodySemiBold,
    },
    includesSection: {
      gap: 12,
      marginBottom: 24,
    },
    includesTitle: {
      color: colors.text,
      fontSize: 16,
      fontFamily: theme.fonts.bodySemiBold,
    },
    includesList: {
      gap: 10,
    },
    ctaContainer: {
      marginTop: "auto",
    },
    ctaButton: {
      borderRadius: 28,
      overflow: "hidden",
    },
    ctaButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    ctaGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 18,
      paddingHorizontal: 32,
      backgroundColor: colors.primary,
    },
    ctaText: {
      color: colors.textOnPrimary,
      fontSize: 17,
      fontFamily: theme.fonts.bodySemiBold,
    },
  });
