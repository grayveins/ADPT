/**
 * ExperienceScreen
 * Training experience level selection - 4 options with auto-advance
 */

import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding, type OnboardingForm } from "@/src/context/OnboardingContext";
import { useAutoAdvance } from "@/src/hooks/useAutoAdvance";

type ExperienceScreenProps = {
  onNext: () => void;
};

type LevelOption = {
  value: NonNullable<OnboardingForm["experienceLevel"]>;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const levels: LevelOption[] = [
  {
    value: "none",
    label: "No Experience",
    subtitle: "Brand new to weight training",
    icon: "sparkles-outline",
  },
  {
    value: "beginner",
    label: "Beginner",
    subtitle: "Less than 1 year",
    icon: "leaf-outline",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    subtitle: "1-3 years of training",
    icon: "barbell-outline",
  },
  {
    value: "advanced",
    label: "Advanced",
    subtitle: "3+ years of consistent training",
    icon: "trophy-outline",
  },
];

export default function ExperienceScreen({ onNext }: ExperienceScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();

  const { selectedValue, isAdvancing, select } = useAutoAdvance({
    delay: 350,
    onSelect: (value) => {
      updateForm({ experienceLevel: value as OnboardingForm["experienceLevel"] });
    },
    onAdvance: onNext,
  });

  // Show form value if navigating back
  const displaySelected = selectedValue || form.experienceLevel;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          What&apos;s your training experience?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          This helps us match the complexity of your workouts.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {levels.map((level, index) => {
          const isSelected = displaySelected === level.value;
          const isAdvancingThis = isAdvancing && selectedValue === level.value;

          return (
            <Animated.View
              key={level.value}
              entering={FadeInDown.delay(80 + index * 60).duration(400)}
            >
              <Pressable
                onPress={() => select(level.value)}
                disabled={isAdvancing}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && !isAdvancing && styles.optionPressed,
                  isAdvancingThis && styles.optionAdvancing,
                ]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    isSelected && styles.optionIconSelected,
                  ]}
                >
                  <Ionicons
                    name={level.icon}
                    size={24}
                    color={isSelected ? colors.textOnPrimary : colors.primary}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {level.label}
                  </Text>
                  <Text allowFontScaling={false} style={styles.optionSubtitle}>
                    {level.subtitle}
                  </Text>
                </View>
                {isSelected && (
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
      alignItems: "flex-start",
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
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    optionIconSelected: {
      backgroundColor: colors.primary,
    },
    optionContent: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      color: colors.text,
      fontSize: 16,
      fontFamily: theme.fonts.bodySemiBold,
    },
    optionLabelSelected: {
      color: colors.primary,
    },
    optionSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: theme.fonts.body,
    },
  });
