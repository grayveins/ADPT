/**
 * WorkoutsPerWeekScreen
 * Select workout frequency with clickable day picker + duration
 * Combines scheduling into one screen
 */

import React, { useState, useMemo, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress, hapticSelect } from "@/src/animations/feedback/haptics";

type WorkoutsPerWeekScreenProps = {
  onNext: () => void;
};

type DayInfo = {
  key: string;
  short: string;
  full: string;
};

const DAYS: DayInfo[] = [
  { key: "monday", short: "M", full: "Mon" },
  { key: "tuesday", short: "T", full: "Tue" },
  { key: "wednesday", short: "W", full: "Wed" },
  { key: "thursday", short: "T", full: "Thu" },
  { key: "friday", short: "F", full: "Fri" },
  { key: "saturday", short: "S", full: "Sat" },
  { key: "sunday", short: "S", full: "Sun" },
];

const durations = [
  { value: 30, label: "30 min", subtitle: "Quick", popular: false },
  { value: 45, label: "45 min", subtitle: "Balanced", popular: true },
  { value: 60, label: "60 min", subtitle: "Thorough", popular: false },
  { value: 75, label: "75+ min", subtitle: "Extended", popular: false },
] as const;

const getRecommendation = (count: number): string => {
  switch (count) {
    case 1:
      return "Every workout counts!";
    case 2:
      return "Great for beginners or busy schedules";
    case 3:
      return "Perfect balance for most goals";
    case 4:
      return "Ideal for building strength";
    case 5:
      return "Optimal for muscle building";
    case 6:
    case 7:
      return "For dedicated athletes";
    default:
      return "Select your training days";
  }
};

// Smart recommendation based on goal and experience
const getSmartRecommendation = (
  goal?: string,
  experience?: string
): { days: string[]; reason: string } => {
  // Beginners should start with less
  if (experience === "none" || experience === "beginner") {
    return { 
      days: ["monday", "wednesday", "friday"], 
      reason: "Recommended for your experience level" 
    };
  }
  
  // Goal-based recommendations for intermediate+
  switch (goal) {
    case "build_muscle":
      return { 
        days: ["monday", "tuesday", "thursday", "friday"], 
        reason: "Optimal for muscle growth" 
      };
    case "get_stronger":
      return { 
        days: ["monday", "wednesday", "friday", "saturday"], 
        reason: "Ideal for strength gains" 
      };
    case "lose_fat":
      return { 
        days: ["monday", "tuesday", "thursday", "friday"], 
        reason: "Great for fat loss" 
      };
    case "general_fitness":
      return { 
        days: ["monday", "wednesday", "friday"], 
        reason: "Perfect for overall fitness" 
      };
    default:
      return { 
        days: ["monday", "wednesday", "friday"], 
        reason: "A solid starting point" 
      };
  }
};

export default function WorkoutsPerWeekScreen({ onNext }: WorkoutsPerWeekScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();
  
  // Get smart recommendation based on user's goal and experience
  const smartRec = useMemo(
    () => getSmartRecommendation(form.goal, form.experienceLevel),
    [form.goal, form.experienceLevel]
  );
  
  // Initialize selected days from form or smart recommendation
  const [selectedDays, setSelectedDays] = useState<string[]>(() => {
    if (form.preferredDays && form.preferredDays.length > 0) {
      return form.preferredDays;
    }
    return smartRec.days;
  });
  
  const [selectedDuration, setSelectedDuration] = useState(form.workoutDuration ?? 45);

  // Update workoutsPerWeek when days change
  useEffect(() => {
    updateForm({ 
      workoutsPerWeek: selectedDays.length,
      preferredDays: selectedDays,
    });
  }, [selectedDays]);

  const toggleDay = (dayKey: string) => {
    hapticSelect();
    setSelectedDays(prev => {
      if (prev.includes(dayKey)) {
        // Don't allow deselecting all days
        if (prev.length === 1) return prev;
        return prev.filter(d => d !== dayKey);
      }
      return [...prev, dayKey];
    });
  };

  const handleSelectDuration = (value: number) => {
    hapticSelect();
    setSelectedDuration(value as 30 | 45 | 60 | 75);
    updateForm({ workoutDuration: value as 30 | 45 | 60 | 75 });
  };

  const handleNext = () => {
    hapticPress();
    updateForm({ 
      workoutsPerWeek: selectedDays.length, 
      workoutDuration: selectedDuration as 30 | 45 | 60 | 75,
      preferredDays: selectedDays,
    });
    onNext();
  };

  const dayCount = selectedDays.length;

  return (
    <ScrollView 
      contentContainerStyle={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text allowFontScaling={false} style={styles.title}>
          When can you train?
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Tap the days that work for your schedule.
        </Text>
      </Animated.View>

      {/* Interactive Day Picker */}
      <Animated.View 
        entering={FadeInDown.delay(100).duration(400)} 
        style={styles.weekContainer}
      >
        <View style={styles.weekDays}>
          {DAYS.map((day, index) => {
            const isSelected = selectedDays.includes(day.key);
            return (
              <Pressable
                key={day.key}
                onPress={() => toggleDay(day.key)}
                style={({ pressed }) => [
                  styles.dayButton,
                  isSelected && styles.dayButtonSelected,
                  pressed && styles.dayButtonPressed,
                ]}
              >
                <Text allowFontScaling={false} style={[
                  styles.dayShort,
                  isSelected && styles.dayShortSelected,
                ]}>
                  {day.short}
                </Text>
                <Text allowFontScaling={false} style={[
                  styles.dayFull,
                  isSelected && styles.dayFullSelected,
                ]}>
                  {day.full}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Summary Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBadge}>
            <Text allowFontScaling={false} style={styles.summaryNumber}>
              {dayCount}
            </Text>
            <Text allowFontScaling={false} style={styles.summaryLabel}>
              {dayCount === 1 ? "day" : "days"} / week
            </Text>
          </View>
          <View style={styles.recommendationPill}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text allowFontScaling={false} style={styles.recommendationText}>
              {getRecommendation(dayCount)}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Duration section */}
      <Animated.View 
        entering={FadeInDown.delay(200).duration(400)} 
        style={styles.durationSection}
      >
        <Text allowFontScaling={false} style={styles.sectionTitle}>
          How long per workout?
        </Text>
        <View style={styles.durationGrid}>
          {durations.map((duration) => {
            const isSelected = selectedDuration === duration.value;
            return (
              <Pressable
                key={duration.value}
                onPress={() => handleSelectDuration(duration.value)}
                style={({ pressed }) => [
                  styles.durationButton,
                  isSelected && styles.durationButtonSelected,
                  pressed && styles.durationButtonPressed,
                ]}
              >
                <Text allowFontScaling={false} style={[
                  styles.durationLabel,
                  isSelected && styles.durationLabelSelected,
                ]}>
                  {duration.label}
                </Text>
                <Text allowFontScaling={false} style={styles.durationSubtitle}>
                  {duration.subtitle}
                </Text>
                {duration.popular && (
                  <View style={styles.popularBadge}>
                    <Text allowFontScaling={false} style={styles.popularText}>Popular</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Total Time Summary */}
      <Animated.View 
        entering={FadeInDown.delay(300).duration(400)} 
        style={styles.totalCard}
      >
        <Ionicons name="time-outline" size={20} color={colors.primary} />
        <Text allowFontScaling={false} style={styles.totalText}>
          <Text style={styles.totalHighlight}>{dayCount * selectedDuration} minutes</Text> of training per week
        </Text>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(350).duration(400)} 
        style={styles.footer}
      >
        <Button 
          title="Continue" 
          onPress={handleNext}
          disabled={dayCount === 0}
        />
        <Text allowFontScaling={false} style={styles.footerNote}>
          You can adjust your schedule anytime in settings
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
    weekContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      gap: 16,
    },
    weekDays: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dayButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      marginHorizontal: 2,
      borderRadius: 12,
      backgroundColor: colors.bg,
      gap: 4,
    },
    dayButtonSelected: {
      backgroundColor: colors.primary,
    },
    dayButtonPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.95 }],
    },
    dayShort: {
      color: colors.text,
      fontSize: 18,
      fontFamily: theme.fonts.bodySemiBold,
    },
    dayShortSelected: {
      color: colors.textOnPrimary,
    },
    dayFull: {
      color: colors.textMuted,
      fontSize: 10,
      fontFamily: theme.fonts.body,
    },
    dayFullSelected: {
      color: colors.textOnPrimary,
      opacity: 0.9,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    summaryBadge: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
    },
    summaryNumber: {
      color: colors.primary,
      fontSize: 32,
      fontFamily: theme.fonts.bodySemiBold,
    },
    summaryLabel: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: theme.fonts.body,
    },
    recommendationPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.selected,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
    },
    recommendationText: {
      color: colors.text,
      fontSize: 12,
      fontFamily: theme.fonts.body,
    },
    durationSection: {
      gap: 12,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontFamily: theme.fonts.bodySemiBold,
    },
    durationGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    durationButton: {
      width: "48%",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 2,
      borderColor: "transparent",
      position: "relative",
    },
    durationButtonSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.selected,
    },
    durationButtonPressed: {
      opacity: 0.9,
    },
    durationLabel: {
      color: colors.text,
      fontSize: 17,
      fontFamily: theme.fonts.bodySemiBold,
    },
    durationLabelSelected: {
      color: colors.primary,
    },
    durationSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
      marginTop: 2,
    },
    popularBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    popularText: {
      color: colors.textOnPrimary,
      fontSize: 9,
      fontFamily: theme.fonts.bodySemiBold,
      textTransform: "uppercase",
    },
    totalCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.selected,
      borderRadius: 12,
      padding: 14,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    totalText: {
      color: colors.text,
      fontSize: 14,
      fontFamily: theme.fonts.body,
    },
    totalHighlight: {
      color: colors.primary,
      fontFamily: theme.fonts.bodySemiBold,
    },
    footer: {
      marginTop: "auto",
      gap: 12,
    },
    footerNote: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: theme.fonts.body,
      textAlign: "center",
    },
  });
