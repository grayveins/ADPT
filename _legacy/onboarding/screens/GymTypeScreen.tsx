/**
 * GymTypeScreen
 * Where do you work out? - 3 options with auto-advance
 * Used to pre-fill equipment selection on next screen
 */

import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding, type OnboardingForm } from "@/src/context/OnboardingContext";
import { useAutoAdvance } from "@/src/hooks/useAutoAdvance";

type GymTypeScreenProps = {
  onNext: () => void;
};

type GymTypeOption = {
  value: NonNullable<OnboardingForm["gymType"]>;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const gymTypes: GymTypeOption[] = [
  {
    value: "large_gym",
    label: "Full Gym",
    description: "Commercial gym with all equipment",
    icon: "business-outline",
  },
  {
    value: "small_gym",
    label: "Basic Gym",
    description: "Smaller gym or apartment fitness center",
    icon: "home-outline",
  },
  {
    value: "home_gym",
    label: "Home Setup",
    description: "Working out at home with limited gear",
    icon: "fitness-outline",
  },
];

export default function GymTypeScreen({ onNext }: GymTypeScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();

  const { selectedValue, isAdvancing, select } = useAutoAdvance({
    delay: 350,
    onSelect: (value) => {
      updateForm({ gymType: value as OnboardingForm["gymType"] });
    },
    onAdvance: onNext,
  });

  // If form already has a gymType, show it selected (for back navigation)
  const displaySelected = selectedValue || form.gymType;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          Where do you work out?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          This helps us recommend the right exercises for you.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {gymTypes.map((gymType, index) => {
          const selected = displaySelected === gymType.value;
          const advancing = isAdvancing && selectedValue === gymType.value;

          return (
            <Animated.View
              key={gymType.value}
              entering={FadeInDown.delay(80 + index * 60).duration(400)}
            >
              <Pressable
                onPress={() => select(gymType.value)}
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
                    name={gymType.icon}
                    size={24}
                    color={selected ? colors.textOnPrimary : colors.primary}
                  />
                </View>

                <View style={styles.textContainer}>
                  <Text
                    allowFontScaling={false}
                    style={[styles.label, selected && styles.labelSelected]}
                  >
                    {gymType.label}
                  </Text>
                  <Text allowFontScaling={false} style={styles.description}>
                    {gymType.description}
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
  });
