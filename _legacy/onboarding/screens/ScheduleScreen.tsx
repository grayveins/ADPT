/**
 * ScheduleScreen
 * Day picker with M T W T F S S toggles
 * Multi-select with Continue button
 */

import React, { useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type ScheduleScreenProps = {
  onNext: () => void;
};

type DayOption = {
  value: string;
  label: string;
  short: string;
};

const days: DayOption[] = [
  { value: "monday", label: "Monday", short: "M" },
  { value: "tuesday", label: "Tuesday", short: "T" },
  { value: "wednesday", label: "Wednesday", short: "W" },
  { value: "thursday", label: "Thursday", short: "T" },
  { value: "friday", label: "Friday", short: "F" },
  { value: "saturday", label: "Saturday", short: "S" },
  { value: "sunday", label: "Sunday", short: "S" },
];

export default function ScheduleScreen({ onNext }: ScheduleScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();

  const selectedDays = form.preferredDays || [];

  const toggleDay = (day: string) => {
    hapticPress();
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    updateForm({ preferredDays: newDays });
  };

  const handleContinue = () => {
    hapticPress();
    onNext();
  };

  // Recommendation based on number of selected days
  const getRecommendation = () => {
    const count = selectedDays.length;
    if (count === 0) return null;
    if (count <= 2) return "Great for beginners! We'll make each session count.";
    if (count <= 4) return "Perfect balance for steady progress.";
    return "High frequency training for faster results!";
  };

  const recommendation = getRecommendation();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          Which days work for you?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          We&apos;ll build your program around your schedule.
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.daysContainer}
      >
        {days.map((day, index) => {
          const isSelected = selectedDays.includes(day.value);
          return (
            <Pressable
              key={day.value}
              onPress={() => toggleDay(day.value)}
              style={({ pressed }) => [
                styles.dayButton,
                isSelected && styles.dayButtonSelected,
                pressed && styles.dayButtonPressed,
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.dayShort,
                  isSelected && styles.dayShortSelected,
                ]}
              >
                {day.short}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.dayLabel,
                  isSelected && styles.dayLabelSelected,
                ]}
              >
                {day.label.slice(0, 3)}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>

      {recommendation && (
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.recommendationCard}
        >
          <Text allowFontScaling={false} style={styles.recommendationText}>
            {recommendation}
          </Text>
        </Animated.View>
      )}

      {selectedDays.length === 0 && (
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.tipContainer}
        >
          <Text allowFontScaling={false} style={styles.tipText}>
            Tap the days you can commit to training
          </Text>
        </Animated.View>
      )}

      <View style={styles.footer}>
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Button
            title={`Continue${selectedDays.length > 0 ? ` (${selectedDays.length} days)` : ""}`}
            onPress={handleContinue}
            disabled={selectedDays.length === 0}
          />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(400).duration(400)}
          allowFontScaling={false}
          style={styles.flexibleNote}
        >
          Don&apos;t worry, you can change this anytime
        </Animated.Text>
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
      marginBottom: 32,
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
    daysContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    dayButton: {
      flex: 1,
      aspectRatio: 0.8,
      backgroundColor: colors.card,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      borderWidth: 2,
      borderColor: "transparent",
    },
    dayButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dayButtonPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.96 }],
    },
    dayShort: {
      color: colors.text,
      fontSize: 20,
      fontFamily: theme.fonts.bodySemiBold,
    },
    dayShortSelected: {
      color: colors.textOnPrimary,
    },
    dayLabel: {
      color: colors.textMuted,
      fontSize: 10,
      fontFamily: theme.fonts.body,
      textTransform: "uppercase",
    },
    dayLabelSelected: {
      color: colors.textOnPrimary,
      opacity: 0.9,
    },
    recommendationCard: {
      marginTop: 24,
      backgroundColor: colors.selected,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    recommendationText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: theme.fonts.body,
      lineHeight: 20,
    },
    tipContainer: {
      marginTop: 24,
      alignItems: "center",
    },
    tipText: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: theme.fonts.body,
    },
    footer: {
      marginTop: "auto",
      gap: 16,
    },
    flexibleNote: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
      textAlign: "center",
    },
  });
