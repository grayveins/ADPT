/**
 * ActivityLevelScreen
 * Daily activity level selection with auto-advance
 * Separated from BodyStatsScreen for cleaner flow
 */

import React, { useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding, type OnboardingForm } from "@/src/context/OnboardingContext";
import { useAutoAdvance } from "@/src/hooks/useAutoAdvance";

type ActivityLevelScreenProps = {
  onNext: () => void;
};

type ActivityOption = {
  value: NonNullable<OnboardingForm["activityLevel"]>;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  example: string;
};

const activityLevels: ActivityOption[] = [
  {
    value: "sedentary",
    label: "Sedentary",
    description: "Little to no daily movement",
    icon: "desktop-outline",
    example: "Desk job, mostly sitting",
  },
  {
    value: "light",
    label: "Lightly Active",
    description: "Some walking or light activity",
    icon: "walk-outline",
    example: "Light errands, short walks",
  },
  {
    value: "moderate",
    label: "Moderately Active",
    description: "Regular movement throughout day",
    icon: "bicycle-outline",
    example: "Active job, regular walking",
  },
  {
    value: "very_active",
    label: "Very Active",
    description: "Constant movement or physical work",
    icon: "flash-outline",
    example: "Physical labor, always moving",
  },
];

export default function ActivityLevelScreen({ onNext }: ActivityLevelScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();

  const { selectedValue, isAdvancing, select } = useAutoAdvance({
    delay: 350,
    onSelect: (value) => {
      updateForm({ activityLevel: value as OnboardingForm["activityLevel"] });
    },
    onAdvance: onNext,
  });

  const displaySelected = selectedValue || form.activityLevel;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          How active are you{"\n"}day-to-day?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Outside of planned workouts
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {activityLevels.map((level, index) => {
          const isSelected = displaySelected === level.value;
          const advancing = isAdvancing && selectedValue === level.value;

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
                  advancing && styles.optionAdvancing,
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    isSelected && styles.iconContainerSelected,
                  ]}
                >
                  <Ionicons
                    name={level.icon}
                    size={24}
                    color={isSelected ? colors.textOnPrimary : colors.primary}
                  />
                </View>

                <View style={styles.textContainer}>
                  <Text
                    allowFontScaling={false}
                    style={[styles.label, isSelected && styles.labelSelected]}
                  >
                    {level.label}
                  </Text>
                  <Text allowFontScaling={false} style={styles.description}>
                    {level.description}
                  </Text>
                  <Text allowFontScaling={false} style={styles.example}>
                    {level.example}
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

      <Animated.View
        entering={FadeInDown.delay(400).duration(400)}
        style={styles.infoCard}
      >
        <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
        <Text allowFontScaling={false} style={styles.infoText}>
          This helps us calculate your daily calorie needs and recovery capacity.
        </Text>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: 16,
    },
    header: {
      gap: 8,
      marginBottom: 24,
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
      fontSize: 13,
      fontFamily: theme.fonts.body,
    },
    example: {
      color: colors.inputPlaceholder,
      fontSize: 12,
      fontFamily: theme.fonts.body,
      fontStyle: "italic",
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: "auto",
      paddingTop: 16,
    },
    infoText: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
    },
  });
