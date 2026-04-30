/**
 * MotivationScreen
 * Why does this goal matter? (CLOSER framework - emotional connection)
 * Deeper motivation helps personalization and increases commitment
 */

import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type MotivationScreenProps = {
  onNext: () => void;
};

const motivations = [
  {
    value: "confidence",
    label: "Feel confident",
    description: "Love how I look and feel",
    icon: "heart",
    emoji: "💪",
  },
  {
    value: "health",
    label: "Improve my health",
    description: "Live longer, feel better",
    icon: "fitness",
    emoji: "❤️",
  },
  {
    value: "energy",
    label: "Have more energy",
    description: "Keep up with daily life",
    icon: "flash",
    emoji: "⚡",
  },
  {
    value: "mental",
    label: "Mental wellbeing",
    description: "Reduce stress and anxiety",
    icon: "happy",
    emoji: "🧠",
  },
  {
    value: "strength",
    label: "Get stronger",
    description: "Build real functional strength",
    icon: "barbell",
    emoji: "🏋️",
  },
  {
    value: "event",
    label: "Upcoming event",
    description: "Wedding, vacation, reunion",
    icon: "calendar",
    emoji: "📅",
  },
] as const;

export default function MotivationScreen({ onNext }: MotivationScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();
  const selected = form.goalWhy;

  const handleSelect = (value: string) => {
    hapticPress();
    updateForm({ goalWhy: value });
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.eyebrow}>
          Let&apos;s go deeper
        </Text>
        <Text allowFontScaling={false} style={styles.title}>
          What&apos;s driving{"\n"}this goal?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Understanding your &quot;why&quot; helps us keep you motivated on tough days.
        </Text>
      </Animated.View>

      <View style={styles.options}>
        {motivations.map((motivation, index) => {
          const isSelected = selected === motivation.value;
          return (
            <Animated.View
              key={motivation.value}
              entering={FadeInDown.delay(100 + index * 60).duration(400)}
            >
              <Pressable
                onPress={() => handleSelect(motivation.value)}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <View style={styles.optionLeft}>
                  <Text allowFontScaling={false} style={styles.emoji}>{motivation.emoji}</Text>
                  <View style={styles.optionText}>
                    <Text allowFontScaling={false} style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}>
                      {motivation.label}
                    </Text>
                    <Text allowFontScaling={false} style={styles.optionDescription}>
                      {motivation.description}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <Animated.View 
        entering={FadeInDown.delay(600).duration(400)} 
        style={styles.footer}
      >
        <Button 
          title="Continue" 
          onPress={onNext} 
          disabled={!selected}
        />
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
    eyebrow: {
      color: colors.primary,
      fontSize: 14,
      fontFamily: theme.fonts.bodySemiBold,
      textTransform: "uppercase",
      letterSpacing: 1,
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
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
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
    optionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      flex: 1,
    },
    emoji: {
      fontSize: 28,
    },
    optionText: {
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
    optionDescription: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
    },
    footer: {
      marginTop: "auto",
      paddingTop: 16,
    },
  });
