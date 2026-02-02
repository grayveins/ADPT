/**
 * SummaryScreen
 * Final onboarding screen with personalized plan summary
 */

import React, { useState, useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticCelebration } from "@/src/animations/feedback/haptics";
import { defaultUnits } from "@/lib/units";
import { supabase } from "@/lib/supabase";

const goalLabels: Record<string, string> = {
  build_muscle: "Build Muscle",
  lose_weight: "Lose Weight",
  get_toned: "Get Toned",
  endurance: "Build Endurance",
};

const splitLabels: Record<string, string> = {
  full_body: "Full Body",
  upper_lower: "Upper/Lower",
  ppl: "Push/Pull/Legs",
  custom: "AI Optimized",
};

const experienceLabels: Record<string, string> = {
  beginner: "Beginner",
  novice: "Novice",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function SummaryScreen() {
  const { form, resetForm } = useOnboarding();
  const [saving, setSaving] = useState(false);

  // Generate personalized summary
  const planSummary = useMemo(() => {
    const goal = goalLabels[form.goal ?? ""] ?? "Fitness";
    const split = splitLabels[form.trainingStyle ?? ""] ?? "Custom";
    const experience = experienceLabels[form.experienceLevel ?? ""] ?? "Any Level";
    const workouts = form.workoutsPerWeek ?? 3;

    return {
      goal,
      split,
      experience,
      workouts,
      estimatedTime: `${form.workoutDuration ?? 45} min`,
    };
  }, [form]);

  const onFinish = async () => {
    if (saving) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.replace("/sign-in");
      return;
    }

    const onboardingData = {
      planSummary: form.planSummary ?? "",
      attribution: form.attribution ?? "",
      appleHealthConnected: form.appleHealthConnected ?? false,
      planChoice: form.planChoice ?? "free",
      goal: form.goal ?? null,
      workoutsPerWeek: form.workoutsPerWeek ?? null,
      splitPreference: form.splitPreference ?? null,
      goalWhy: form.goalWhy ?? null,
      limitations: form.limitations ?? [],
      limitationsOtherText: form.limitationsOtherText ?? "",
      trainingStyle: form.trainingStyle ?? null,
      experienceLevel: form.experienceLevel ?? null,
      equipment: form.equipment ?? null,
      activityLevel: form.activityLevel ?? null,
      workoutDuration: form.workoutDuration ?? null,
      goalTimeline: form.goalTimeline ?? null,
      sex: form.sex ?? null,
      ageRange: form.ageRange ?? null,
    };

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: form.firstName ?? null,
      sex: form.sex ?? null,
      birth_year: form.birthYear ?? null,
      height_cm: form.heightCm ?? null,
      weight_kg: form.weightKg ?? null,
      goal: form.goal ?? null,
      activity_level: form.activityLevel ?? null,
      training_style: form.trainingStyle ?? null,
      units: form.units ?? defaultUnits,
      onboarding_data: onboardingData,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      Alert.alert("Error", "We couldn't save your profile. Please try again.");
      setSaving(false);
      return;
    }

    await hapticCelebration();
    resetForm();
    setSaving(false);
    router.replace("/(app)/(tabs)" as any);
  };

  return (
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
          <Ionicons name="checkmark" size={40} color="#000" />
        </View>
      </Animated.View>

      {/* Header */}
      <Animated.View 
        entering={FadeInDown.delay(150).duration(400)} 
        style={styles.header}
      >
        <Text allowFontScaling={false} style={styles.title}>
          You&apos;re all set!
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          Your personalized plan is ready. Let&apos;s build something amazing together.
        </Text>
      </Animated.View>

      {/* Plan Summary Card */}
      <Animated.View 
        entering={FadeInDown.delay(250).duration(400)} 
        style={styles.summaryCard}
      >
        <Text allowFontScaling={false} style={styles.summaryTitle}>
          Your Plan
        </Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Ionicons name="flame" size={20} color={darkColors.primary} />
            <View style={styles.summaryItemContent}>
              <Text allowFontScaling={false} style={styles.summaryLabel}>Goal</Text>
              <Text allowFontScaling={false} style={styles.summaryValue}>
                {planSummary.goal}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="calendar" size={20} color={darkColors.primary} />
            <View style={styles.summaryItemContent}>
              <Text allowFontScaling={false} style={styles.summaryLabel}>Frequency</Text>
              <Text allowFontScaling={false} style={styles.summaryValue}>
                {planSummary.workouts}x / week
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="barbell" size={20} color={darkColors.primary} />
            <View style={styles.summaryItemContent}>
              <Text allowFontScaling={false} style={styles.summaryLabel}>Style</Text>
              <Text allowFontScaling={false} style={styles.summaryValue}>
                {planSummary.split}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryItem}>
            <Ionicons name="time" size={20} color={darkColors.primary} />
            <View style={styles.summaryItemContent}>
              <Text allowFontScaling={false} style={styles.summaryLabel}>Duration</Text>
              <Text allowFontScaling={false} style={styles.summaryValue}>
                {planSummary.estimatedTime}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Motivation Card */}
      <Animated.View 
        entering={FadeInDown.delay(350).duration(400)} 
        style={styles.motivationCard}
      >
        <View style={styles.motivationIcon}>
          <Ionicons name="flash" size={20} color={darkColors.primary} />
        </View>
        <View style={styles.motivationContent}>
          <Text allowFontScaling={false} style={styles.motivationTitle}>
            Ready to transform
          </Text>
          <Text allowFontScaling={false} style={styles.motivationText}>
            Small steps today lead to big results tomorrow. Your first workout awaits!
          </Text>
        </View>
      </Animated.View>

      {/* What's Next */}
      <Animated.View 
        entering={FadeInDown.delay(400).duration(400)} 
        style={styles.nextSteps}
      >
        <Text allowFontScaling={false} style={styles.nextStepsTitle}>
          What&apos;s next
        </Text>
        <View style={styles.nextStep}>
          <View style={styles.nextStepNumber}>
            <Text allowFontScaling={false} style={styles.nextStepNumberText}>1</Text>
          </View>
          <Text allowFontScaling={false} style={styles.nextStepText}>
            Complete your first workout
          </Text>
        </View>
        <View style={styles.nextStep}>
          <View style={styles.nextStepNumber}>
            <Text allowFontScaling={false} style={styles.nextStepNumberText}>2</Text>
          </View>
          <Text allowFontScaling={false} style={styles.nextStepText}>
            Track your progress weekly
          </Text>
        </View>
        <View style={styles.nextStep}>
          <View style={styles.nextStepNumber}>
            <Text allowFontScaling={false} style={styles.nextStepNumberText}>3</Text>
          </View>
          <Text allowFontScaling={false} style={styles.nextStepText}>
            Chat with AI for guidance
          </Text>
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View 
        entering={FadeInDown.delay(450).duration(400)} 
        style={styles.footer}
      >
        <Button
          title={saving ? "Setting up..." : "Start Training"}
          onPress={onFinish}
          disabled={saving}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingVertical: 16,
    gap: 20,
    paddingBottom: 24,
  },
  successIcon: {
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: darkColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    gap: 8,
    alignItems: "center",
  },
  title: {
    color: darkColors.text,
    fontFamily: theme.fonts.heading,
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
  },
  subtitle: {
    color: darkColors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: darkColors.border,
  },
  summaryTitle: {
    color: darkColors.text,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
    marginBottom: 4,
  },
  summaryGrid: {
    gap: 12,
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
    color: darkColors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
  },
  summaryValue: {
    color: darkColors.text,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 14,
  },
  motivationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: darkColors.selectedBg,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: darkColors.primary,
  },
  motivationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  motivationContent: {
    flex: 1,
    gap: 4,
  },
  motivationTitle: {
    color: darkColors.primary,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 15,
  },
  motivationText: {
    color: darkColors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  nextSteps: {
    gap: 12,
  },
  nextStepsTitle: {
    color: darkColors.muted,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nextStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nextStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: darkColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  nextStepNumberText: {
    color: darkColors.primary,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
  },
  nextStepText: {
    color: darkColors.text,
    fontFamily: theme.fonts.body,
    fontSize: 15,
  } as const,
  footer: {
    marginTop: "auto",
    paddingTop: 8,
  },
});
