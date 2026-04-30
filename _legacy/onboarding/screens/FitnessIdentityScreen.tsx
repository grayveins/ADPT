/**
 * FitnessIdentityScreen
 * "Give back" moment — reveals a fitness archetype based on answers.
 * Creates identity investment before the paywall.
 * NOT auto-advance — user absorbs the reveal, then taps Continue.
 */

import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding, type OnboardingForm } from "@/src/context/OnboardingContext";
import { hapticCelebration } from "@/src/animations/feedback/haptics";
import Button from "@/src/components/Button";

type FitnessIdentityScreenProps = {
  onNext: () => void;
};

type Archetype = {
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function deriveArchetype(form: OnboardingForm): Archetype {
  const { goal, experienceLevel } = form;

  if (
    goal === "build_muscle" &&
    (experienceLevel === "intermediate" || experienceLevel === "advanced")
  ) {
    return {
      name: "The Builder",
      description: "You\u2019re driven by visible progress. You love seeing numbers go up.",
      icon: "barbell-outline",
    };
  }

  if (goal === "get_stronger") {
    return {
      name: "The Powerhouse",
      description: "Strength is your game. You chase PRs like trophies.",
      icon: "trophy-outline",
    };
  }

  if (goal === "lose_fat") {
    return {
      name: "The Sculptor",
      description: "You\u2019re refining what\u2019s already there. Precision over brute force.",
      icon: "cut-outline",
    };
  }

  if (
    goal === "general_fitness" ||
    experienceLevel === "none" ||
    experienceLevel === "beginner"
  ) {
    return {
      name: "The Explorer",
      description: "You\u2019re discovering what your body can do. Every session is a new frontier.",
      icon: "compass-outline",
    };
  }

  return {
    name: "The Athlete",
    description: "You show up, you work, you adapt.",
    icon: "fitness-outline",
  };
}

function getGoalLabel(goal: OnboardingForm["goal"]): string {
  const labels: Record<string, string> = {
    build_muscle: "Build Muscle",
    get_stronger: "Get Stronger",
    lose_fat: "Lose Fat",
    general_fitness: "General Fitness",
  };
  return labels[goal || ""] || "Get Fit";
}

function getExperienceLabel(level: OnboardingForm["experienceLevel"]): string {
  const labels: Record<string, string> = {
    none: "New lifter",
    beginner: "Beginner lifter",
    intermediate: "Intermediate lifter",
    advanced: "Advanced lifter",
  };
  return labels[level || ""] || "Lifter";
}

export default function FitnessIdentityScreen({ onNext }: FitnessIdentityScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form } = useOnboarding();

  const archetype = useMemo(() => deriveArchetype(form), [form]);

  // Animated glow ring around the icon
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Haptic celebration on mount
    hapticCelebration();

    // Subtle glow pulse
    glowOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.3,
    transform: [{ scale: 1 + glowOpacity.value * 0.15 }],
  }));

  const pills = [
    { label: `Goal: ${getGoalLabel(form.goal)}`, icon: "flag-outline" as const },
    {
      label: `${form.workoutsPerWeek || 3}x per week`,
      icon: "calendar-outline" as const,
    },
    {
      label: getExperienceLabel(form.experienceLevel),
      icon: "trending-up-outline" as const,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Archetype icon with glow */}
      <Animated.View
        entering={FadeIn.delay(200).duration(600)}
        style={styles.iconSection}
      >
        <Animated.View style={[styles.glowRing, glowStyle]} />
        <View style={styles.archetypeIcon}>
          <Ionicons name={archetype.icon} size={40} color={colors.primary} />
        </View>
      </Animated.View>

      {/* Archetype name */}
      <Animated.Text
        entering={FadeInUp.delay(500).duration(500)}
        allowFontScaling={false}
        style={styles.archetypeName}
      >
        {archetype.name}
      </Animated.Text>

      {/* Archetype description */}
      <Animated.Text
        entering={FadeInUp.delay(700).duration(500)}
        allowFontScaling={false}
        style={styles.archetypeDescription}
      >
        {archetype.description}
      </Animated.Text>

      {/* Trait pills */}
      <Animated.View
        entering={FadeInDown.delay(1000).duration(400)}
        style={styles.pillsContainer}
      >
        {pills.map((pill, index) => (
          <Animated.View
            key={pill.label}
            entering={FadeInDown.delay(1000 + index * 120).duration(400)}
            style={styles.pill}
          >
            <Ionicons name={pill.icon} size={14} color={colors.primary} />
            <Text allowFontScaling={false} style={styles.pillText}>
              {pill.label}
            </Text>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Continue button */}
      <Animated.View
        entering={FadeInDown.delay(1400).duration(400)}
        style={styles.footer}
      >
        <Button title="Continue" onPress={onNext} />
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    iconSection: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    glowRing: {
      position: "absolute",
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primary,
    },
    archetypeIcon: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.selected,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    archetypeName: {
      color: colors.primary,
      fontSize: 28,
      fontFamily: theme.fonts.heading,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 8,
    },
    archetypeDescription: {
      color: colors.textSecondary,
      fontSize: 15,
      fontFamily: theme.fonts.body,
      lineHeight: 22,
      textAlign: "center",
      paddingHorizontal: 16,
      marginBottom: 32,
    },
    pillsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
      marginBottom: 48,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.selected,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillText: {
      color: colors.text,
      fontSize: 13,
      fontFamily: theme.fonts.bodySemiBold,
    },
    footer: {
      position: "absolute",
      bottom: 16,
      left: 24,
      right: 24,
    },
  });
