/**
 * GoalsScreen
 * Simplified goal selection - 4 options, auto-advance on select
 * Replaces MainGoalScreen with cleaner UX
 */

import React, { useMemo, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding, type OnboardingForm } from "@/src/context/OnboardingContext";
import { useAutoAdvance } from "@/src/hooks/useAutoAdvance";

type GoalsScreenProps = {
  onNext: () => void;
};

type GoalOption = {
  value: NonNullable<OnboardingForm["goal"]>;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  popular?: boolean;
};

const goals: GoalOption[] = [
  {
    value: "build_muscle",
    label: "Build Muscle",
    description: "Get stronger and more defined",
    icon: "barbell-outline",
    popular: true,
  },
  {
    value: "general_fitness",
    label: "General Fitness",
    description: "Feel healthier and more energetic",
    icon: "heart-outline",
  },
  {
    value: "get_stronger",
    label: "Get Stronger",
    description: "Increase strength and power",
    icon: "fitness-outline",
  },
  {
    value: "lose_fat",
    label: "Lose Fat",
    description: "Lean out while maintaining muscle",
    icon: "flame-outline",
  },
];

export default function GoalsScreen({ onNext }: GoalsScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();

  const { selectedValue, isAdvancing, select, isSelected } = useAutoAdvance({
    delay: 350,
    onSelect: (value) => {
      updateForm({ goal: value as OnboardingForm["goal"] });
    },
    onAdvance: onNext,
  });

  // If form already has a goal, show it selected (for back navigation)
  const displaySelected = selectedValue || form.goal;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          What's your main goal?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          We'll personalize your workouts based on this.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {goals.map((goal, index) => {
          const selected = displaySelected === goal.value;
          const advancing = isAdvancing && selectedValue === goal.value;

          return (
            <Animated.View
              key={goal.value}
              entering={FadeInDown.delay(80 + index * 60).duration(400)}
            >
              <Pressable
                onPress={() => select(goal.value)}
                disabled={isAdvancing}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  pressed && !isAdvancing && styles.optionPressed,
                  advancing && styles.optionAdvancing,
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    selected && styles.iconContainerSelected,
                  ]}
                >
                  <Ionicons
                    name={goal.icon}
                    size={24}
                    color={selected ? colors.textOnPrimary : colors.primary}
                  />
                </View>

                <View style={styles.textContainer}>
                  <View style={styles.labelRow}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.label, selected && styles.labelSelected]}
                    >
                      {goal.label}
                    </Text>
                    {goal.popular && (
                      <View style={styles.popularBadge}>
                        <Text allowFontScaling={false} style={styles.popularText}>
                          Popular
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text allowFontScaling={false} style={styles.description}>
                    {goal.description}
                  </Text>
                </View>

                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingVertical: 16,
      gap: 24,
    },
    header: {
      gap: 8,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontFamily: theme.fonts.heading,
      lineHeight: 36,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      fontFamily: theme.fonts.body,
      lineHeight: 22,
    },
    options: {
      gap: 12,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      gap: 14,
      borderWidth: 2,
      borderColor: "transparent",
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.selected,
    },
    optionPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },
    optionAdvancing: {
      opacity: 0.8,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
    },
    iconContainerSelected: {
      backgroundColor: colors.primary,
    },
    textContainer: {
      flex: 1,
      gap: 2,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    label: {
      color: colors.text,
      fontSize: 16,
      fontFamily: theme.fonts.bodySemiBold,
    },
    labelSelected: {
      color: colors.primary,
    },
    description: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: theme.fonts.body,
    },
    popularBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    popularText: {
      color: colors.textOnPrimary,
      fontSize: 10,
      fontFamily: theme.fonts.bodySemiBold,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });
