/**
 * TrainingPreferenceScreen
 * Training split / style preference selection
 */

import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding, type OnboardingForm } from "@/src/context/OnboardingContext";
import { useAutoAdvance } from "@/src/hooks/useAutoAdvance";

type TrainingPreferenceScreenProps = {
  onNext: () => void;
};

type SplitOption = {
  value: NonNullable<OnboardingForm["splitPreference"]>;
  label: string;
  description: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  recommended?: boolean;
};

const splits: SplitOption[] = [
  {
    value: "auto",
    label: "Let AI Decide",
    description: "We'll optimize based on your goals",
    detail: "Recommended for most",
    icon: "sparkles-outline",
    recommended: true,
  },
  {
    value: "full_body",
    label: "Full Body",
    description: "Train all muscle groups each session",
    detail: "Best for 2-3 days/week",
    icon: "body-outline",
  },
  {
    value: "upper_lower",
    label: "Upper / Lower",
    description: "Alternate upper and lower body days",
    detail: "Best for 3-4 days/week",
    icon: "fitness-outline",
  },
  {
    value: "ppl",
    label: "Push / Pull / Legs",
    description: "Split by movement patterns",
    detail: "Best for 4-6 days/week",
    icon: "barbell-outline",
  },
];

export default function TrainingPreferenceScreen({ onNext }: TrainingPreferenceScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();

  const { selectedValue, isAdvancing, select } = useAutoAdvance({
    delay: 350,
    onSelect: (value) => {
      updateForm({ splitPreference: value as OnboardingForm["splitPreference"] });
    },
    onAdvance: onNext,
  });

  // If form already has splitPreference, show it selected (for back navigation)
  const displaySelected = selectedValue || form.splitPreference;

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          How do you like{"\n"}to train?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Choose a training split or let us optimize for you.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {splits.map((split, index) => {
          const isSelected = displaySelected === split.value;
          const advancing = isAdvancing && selectedValue === split.value;
          
          return (
            <Animated.View
              key={split.value}
              entering={FadeInDown.delay(80 + index * 60).duration(400)}
            >
              <Pressable
                onPress={() => select(split.value)}
                disabled={isAdvancing}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && !isAdvancing && styles.optionPressed,
                  advancing && styles.optionAdvancing,
                ]}
              >
                <View style={[
                  styles.optionIcon,
                  isSelected && styles.optionIconSelected,
                ]}>
                  <Ionicons 
                    name={split.icon} 
                    size={24} 
                    color={isSelected ? colors.textOnPrimary : colors.primary} 
                  />
                </View>
                <View style={styles.optionContent}>
                  <View style={styles.optionTitleRow}>
                    <Text allowFontScaling={false} style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}>
                      {split.label}
                    </Text>
                    {split.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text allowFontScaling={false} style={styles.recommendedText}>
                          Recommended
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text allowFontScaling={false} style={styles.optionDescription}>
                    {split.description}
                  </Text>
                  <Text allowFontScaling={false} style={[
                    styles.optionDetail,
                    isSelected && styles.optionDetailSelected,
                  ]}>
                    {split.detail}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Helper text */}
      <Animated.View 
        entering={FadeInDown.delay(350).duration(400)} 
        style={styles.helper}
      >
        <Ionicons name="information-circle" size={16} color={colors.textMuted} />
        <Text allowFontScaling={false} style={styles.helperText}>
          Not sure? &ldquo;Let AI Decide&rdquo; adapts to your schedule and goals.
        </Text>
      </Animated.View>
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
      gap: 4,
    },
    optionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    optionLabel: {
      color: colors.text,
      fontSize: 17,
      fontFamily: theme.fonts.bodySemiBold,
    },
    optionLabelSelected: {
      color: colors.primary,
    },
    recommendedBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    recommendedText: {
      color: colors.textOnPrimary,
      fontSize: 10,
      fontFamily: theme.fonts.bodySemiBold,
    },
    optionDescription: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
    },
    optionDetail: {
      color: colors.inputPlaceholder,
      fontSize: 12,
      fontFamily: theme.fonts.body,
      marginTop: 2,
    },
    optionDetailSelected: {
      color: colors.primary,
    },
    helper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 16,
    },
    helperText: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
      flex: 1,
    },
  });
