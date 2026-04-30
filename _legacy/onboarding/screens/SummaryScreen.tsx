/**
 * SummaryScreen
 * Final onboarding screen with personalized plan summary
 * Features: workout preview, weekly schedule, social proof
 */

import React, { useMemo, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticCelebration } from "@/src/animations/feedback/haptics";

const goalLabels: Record<string, string> = {
  build_muscle: "Build Muscle",
  lose_fat: "Lose Fat",
  general_fitness: "General Fitness",
  get_stronger: "Get Stronger",
};

const goalIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  build_muscle: "barbell",
  lose_fat: "flame",
  general_fitness: "fitness",
  get_stronger: "trophy",
};

const splitLabels: Record<string, string> = {
  full_body: "Full Body",
  upper_lower: "Upper/Lower",
  ppl: "Push/Pull/Legs",
  auto: "AI Optimized",
};

const experienceLabels: Record<string, string> = {
  none: "Complete Beginner",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// Sample exercises based on goal and split
const getSampleExercises = (
  goal: string | undefined,
  split: string | undefined
): { name: string; sets: number; reps: string }[] => {
  if (goal === "build_muscle" || goal === "get_stronger") {
    if (split === "ppl") {
      return [
        { name: "Bench Press", sets: 4, reps: "6-8" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "8-10" },
        { name: "Cable Fly", sets: 3, reps: "10-12" },
        { name: "Tricep Pushdown", sets: 3, reps: "10-12" },
      ];
    }
    return [
      { name: "Squat", sets: 4, reps: "5" },
      { name: "Bench Press", sets: 4, reps: "5" },
      { name: "Barbell Row", sets: 4, reps: "6-8" },
      { name: "Overhead Press", sets: 3, reps: "8" },
    ];
  }
  if (goal === "lose_fat") {
    return [
      { name: "Goblet Squat", sets: 3, reps: "12" },
      { name: "Push-ups", sets: 3, reps: "15" },
      { name: "Dumbbell Row", sets: 3, reps: "12" },
      { name: "Mountain Climbers", sets: 3, reps: "20" },
    ];
  }
  // general_fitness
  return [
    { name: "Squat", sets: 3, reps: "10" },
    { name: "Push-ups", sets: 3, reps: "12" },
    { name: "Lat Pulldown", sets: 3, reps: "10" },
    { name: "Plank", sets: 3, reps: "45s" },
  ];
};

// Day abbreviations
const DAYS = [
  { key: "monday", label: "M" },
  { key: "tuesday", label: "T" },
  { key: "wednesday", label: "W" },
  { key: "thursday", label: "T" },
  { key: "friday", label: "F" },
  { key: "saturday", label: "S" },
  { key: "sunday", label: "S" },
];

type SummaryScreenProps = {
  onNext: () => void;
};

export default function SummaryScreen({ onNext }: SummaryScreenProps) {
  const { colors } = useTheme();
  const { form } = useOnboarding();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Trigger haptic on mount (confetti removed for cleaner experience)
  useEffect(() => {
    const timer = setTimeout(() => {
      hapticCelebration();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Generate personalized summary
  const planSummary = useMemo(() => {
    const goal = goalLabels[form.goal ?? ""] ?? "Fitness";
    const goalIcon = goalIcons[form.goal ?? ""] ?? "fitness";
    const split = splitLabels[form.splitPreference ?? ""] ?? "Custom";
    const experience = experienceLabels[form.experienceLevel ?? ""] ?? "Any Level";
    const workouts = form.workoutsPerWeek ?? 3;
    const preferredDays = form.preferredDays ?? [];

    return {
      goal,
      goalIcon,
      split,
      experience,
      workouts,
      preferredDays,
      estimatedTime: `${form.workoutDuration ?? 45} min`,
      firstName: form.firstName ?? "there",
    };
  }, [form]);

  const sampleExercises = useMemo(
    () => getSampleExercises(form.goal, form.splitPreference),
    [form.goal, form.splitPreference]
  );

  const handleContinue = () => {
    hapticCelebration();
    onNext();
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <Animated.View 
          entering={FadeInDown.duration(400)} 
          style={styles.successIcon}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={40} color={colors.textOnPrimary} />
          </View>
        </Animated.View>

        {/* Personalized Header */}
        <Animated.View 
          entering={FadeInDown.delay(150).duration(400)} 
          style={styles.header}
        >
          <Text allowFontScaling={false} style={styles.title}>
            You&apos;re all set, {planSummary.firstName}!
          </Text>
          <Text allowFontScaling={false} style={styles.subtitle}>
            Your personalized {planSummary.goal.toLowerCase()} plan is ready.
          </Text>
        </Animated.View>

        {/* Weekly Schedule */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(400)} 
          style={styles.scheduleCard}
        >
          <Text allowFontScaling={false} style={styles.cardTitle}>
            Your Week
          </Text>
          <View style={styles.daysRow}>
            {DAYS.map((day) => {
              const isSelected = planSummary.preferredDays.includes(day.key);
              return (
                <View
                  key={day.key}
                  style={[
                    styles.dayCircle,
                    isSelected && styles.dayCircleActive,
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.dayLabel,
                      isSelected && styles.dayLabelActive,
                    ]}
                  >
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text allowFontScaling={false} style={styles.scheduleNote}>
            {planSummary.workouts} workouts/week  •  {planSummary.estimatedTime} each
          </Text>
        </Animated.View>

        {/* Workout Preview Card */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(400)} 
          style={styles.previewCard}
        >
          <View style={styles.previewHeader}>
            <View style={styles.previewTitleRow}>
              <Ionicons name={planSummary.goalIcon as any} size={18} color={colors.primary} />
              <Text allowFontScaling={false} style={styles.cardTitle}>
                First Workout Preview
              </Text>
            </View>
            <Text allowFontScaling={false} style={styles.previewBadge}>
              {planSummary.split}
            </Text>
          </View>
          
          <View style={styles.exerciseList}>
            {sampleExercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseRow}>
                <Text allowFontScaling={false} style={styles.exerciseName}>
                  {exercise.name}
                </Text>
                <Text allowFontScaling={false} style={styles.exerciseSets}>
                  {exercise.sets} × {exercise.reps}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={styles.previewFooter}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text allowFontScaling={false} style={styles.previewFooterText}>
              AI will adjust based on your performance
            </Text>
          </View>
        </Animated.View>

        {/* Plan Summary */}
        <Animated.View 
          entering={FadeInDown.delay(350).duration(400)} 
          style={styles.summaryCard}
        >
          <Text allowFontScaling={false} style={styles.cardTitle}>
            Your Plan
          </Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Ionicons name="flame" size={20} color={colors.primary} />
              <View style={styles.summaryItemContent}>
                <Text allowFontScaling={false} style={styles.summaryLabel}>Goal</Text>
                <Text allowFontScaling={false} style={styles.summaryValue}>
                  {planSummary.goal}
                </Text>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="trending-up" size={20} color={colors.primary} />
              <View style={styles.summaryItemContent}>
                <Text allowFontScaling={false} style={styles.summaryLabel}>Level</Text>
                <Text allowFontScaling={false} style={styles.summaryValue}>
                  {planSummary.experience}
                </Text>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="barbell" size={20} color={colors.primary} />
              <View style={styles.summaryItemContent}>
                <Text allowFontScaling={false} style={styles.summaryLabel}>Style</Text>
                <Text allowFontScaling={false} style={styles.summaryValue}>
                  {planSummary.split}
                </Text>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <View style={styles.summaryItemContent}>
                <Text allowFontScaling={false} style={styles.summaryLabel}>Duration</Text>
                <Text allowFontScaling={false} style={styles.summaryValue}>
                  {planSummary.estimatedTime}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Social Proof */}
        <Animated.View 
          entering={FadeIn.delay(450).duration(400)} 
          style={styles.socialProof}
        >
          <View style={styles.avatarStack}>
            {[colors.primary, colors.success, colors.primaryMuted].map((color, i) => (
              <View
                key={i}
                style={[
                  styles.avatar,
                  { backgroundColor: color, marginLeft: i > 0 ? -10 : 0 },
                ]}
              >
                <Ionicons name="person" size={12} color={colors.textOnPrimary} />
              </View>
            ))}
          </View>
          <Text allowFontScaling={false} style={styles.socialText}>
            Join 50,000+ people building better habits
          </Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View 
          entering={FadeInDown.delay(500).duration(400)} 
          style={styles.footer}
        >
          <Button
            title="Continue"
            onPress={handleContinue}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      paddingVertical: 16,
      gap: 16,
      paddingBottom: 24,
    },
    successIcon: {
      alignItems: "center",
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    header: {
      gap: 6,
      alignItems: "center",
    },
    title: {
      color: colors.text,
      fontFamily: theme.fonts.heading,
      fontSize: 26,
      lineHeight: 34,
      textAlign: "center",
    },
    subtitle: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },
    cardTitle: {
      color: colors.text,
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 15,
    },
    // Schedule Card
    scheduleCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    daysRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dayCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayCircleActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dayLabel: {
      color: colors.textMuted,
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 13,
    },
    dayLabelActive: {
      color: colors.textOnPrimary,
    },
    scheduleNote: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 13,
      textAlign: "center",
    },
    // Preview Card
    previewCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    previewTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    previewBadge: {
      color: colors.primary,
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 11,
      backgroundColor: colors.selected,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      overflow: "hidden",
    },
    exerciseList: {
      gap: 8,
    },
    exerciseRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    exerciseName: {
      color: colors.text,
      fontFamily: theme.fonts.body,
      fontSize: 14,
    },
    exerciseSets: {
      color: colors.textMuted,
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 13,
    },
    previewFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingTop: 4,
    },
    previewFooterText: {
      color: colors.primary,
      fontFamily: theme.fonts.body,
      fontSize: 12,
    },
    // Summary Card
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      gap: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryGrid: {
      gap: 10,
    },
    summaryItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    summaryItemContent: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    summaryLabel: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 14,
    },
    summaryValue: {
      color: colors.text,
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 14,
    },
    // Social Proof
    socialProof: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 8,
    },
    avatarStack: {
      flexDirection: "row",
    },
    avatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.bg,
    },
    socialText: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 13,
    },
    // Footer
    footer: {
      marginTop: "auto",
      paddingTop: 8,
    },
  });
