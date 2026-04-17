/**
 * AttributionScreen
 * How did you hear about us? - 4 options with skip
 * Auto-advance on select
 */

import React, { useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding, type OnboardingForm } from "@/src/context/OnboardingContext";
import { useAutoAdvance } from "@/src/hooks/useAutoAdvance";
import { hapticPress } from "@/src/animations/feedback/haptics";

type AttributionScreenProps = {
  onNext: () => void;
};

type AttributionOption = {
  value: NonNullable<OnboardingForm["attribution"]>;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const attributionOptions: AttributionOption[] = [
  { value: "friend", label: "A friend told me", icon: "people-outline" },
  { value: "social_media", label: "Social media", icon: "logo-instagram" },
  { value: "app_store", label: "App Store", icon: "phone-portrait-outline" },
  { value: "other", label: "Somewhere else", icon: "globe-outline" },
];

export default function AttributionScreen({ onNext }: AttributionScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();

  const { selectedValue, isAdvancing, select } = useAutoAdvance({
    delay: 350,
    onSelect: (value) => {
      updateForm({ attribution: value as OnboardingForm["attribution"] });
    },
    onAdvance: onNext,
  });

  const handleSkip = () => {
    hapticPress();
    onNext();
  };

  // If form already has attribution, show it selected (for back navigation)
  const displaySelected = selectedValue || form.attribution;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          How did you find us?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          This helps us know where to reach more people like you.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {attributionOptions.map((option, index) => {
          const selected = displaySelected === option.value;
          const advancing = isAdvancing && selectedValue === option.value;

          return (
            <Animated.View
              key={option.value}
              entering={FadeInDown.delay(80 + index * 60).duration(400)}
            >
              <Pressable
                onPress={() => select(option.value)}
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
                    name={option.icon}
                    size={22}
                    color={selected ? colors.textOnPrimary : colors.primary}
                  />
                </View>

                <Text
                  allowFontScaling={false}
                  style={[styles.label, selected && styles.labelSelected]}
                >
                  {option.label}
                </Text>

                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.primary}
                    style={styles.checkIcon}
                  />
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text allowFontScaling={false} style={styles.skipText}>
              Skip this question
            </Text>
          </Pressable>
        </Animated.View>
      </View>
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
      gap: 10,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      gap: 12,
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
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
    },
    iconContainerSelected: {
      backgroundColor: colors.primary,
    },
    label: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontFamily: theme.fonts.bodySemiBold,
    },
    labelSelected: {
      color: colors.primary,
    },
    checkIcon: {
      marginLeft: "auto",
    },
    footer: {
      marginTop: "auto",
    },
    skipButton: {
      alignItems: "center",
      paddingVertical: 16,
    },
    skipText: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: theme.fonts.body,
    },
  });
