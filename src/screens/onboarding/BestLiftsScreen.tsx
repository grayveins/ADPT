/**
 * BestLiftsScreen
 * Optional PR entry with weight x reps format
 * De-emphasized skip - always shows "Continue" as primary
 */

import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { useOnboarding, type BestLifts, type LiftEntry } from "@/src/context/OnboardingContext";
import Button from "@/src/components/Button";
import { hapticPress } from "@/src/animations/feedback/haptics";

type BestLiftsScreenProps = {
  onNext: () => void;
};

type LiftField = {
  key: keyof BestLifts;
  label: string;
  placeholderWeight: string;
  placeholderReps: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const liftFields: LiftField[] = [
  { key: "bench", label: "Bench Press", placeholderWeight: "135", placeholderReps: "5", icon: "barbell-outline" },
  { key: "squat", label: "Squat", placeholderWeight: "185", placeholderReps: "5", icon: "fitness-outline" },
  { key: "deadlift", label: "Deadlift", placeholderWeight: "225", placeholderReps: "5", icon: "barbell-outline" },
  { key: "ohp", label: "Overhead Press", placeholderWeight: "95", placeholderReps: "5", icon: "arrow-up-outline" },
];

// Calculate estimated 1RM using Brzycki formula
const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
};

export default function BestLiftsScreen({ onNext }: BestLiftsScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { form, updateForm } = useOnboarding();

  // Initialize with form data or empty
  const [localLifts, setLocalLifts] = useState<BestLifts>(() => {
    return form.bestLifts || {};
  });

  const handleWeightChange = (key: keyof BestLifts, value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    setLocalLifts((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        weight: isNaN(numValue || 0) ? undefined : numValue,
      },
    }));
  };

  const handleRepsChange = (key: keyof BestLifts, value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    // Cap reps at 20 for reasonable 1RM calculation
    const cappedValue = numValue && numValue > 20 ? 20 : numValue;
    setLocalLifts((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        reps: isNaN(cappedValue || 0) ? undefined : cappedValue,
      },
    }));
  };

  const handleContinue = () => {
    hapticPress();
    // Only save lifts that have both weight and reps
    const validLifts: BestLifts = {};
    (Object.keys(localLifts) as (keyof BestLifts)[]).forEach(key => {
      const lift = localLifts[key];
      if (lift?.weight && lift.weight > 0) {
        validLifts[key] = {
          weight: lift.weight,
          reps: lift.reps || 1, // Default to 1RM if no reps specified
        };
      }
    });
    
    if (Object.keys(validLifts).length > 0) {
      updateForm({ bestLifts: validLifts });
    }
    onNext();
  };

  // Check if any lifts have been entered
  const hasAnyLifts = Object.values(localLifts).some(
    (lift) => lift?.weight !== undefined && lift.weight > 0
  );

  // Get unit label from form (default to lbs)
  const unitLabel = form.units?.weight === "kg" ? "kg" : "lbs";

  // Calculate total estimated strength
  const getEstimated1RM = (lift?: LiftEntry): number | null => {
    if (!lift?.weight || lift.weight <= 0) return null;
    return calculate1RM(lift.weight, lift.reps || 1);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 150 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text allowFontScaling={false} style={styles.title}>
            Know your best lifts?
          </Text>
          <Text allowFontScaling={false} style={styles.subtitle}>
            Enter your best set for each lift. We&apos;ll calculate your starting weights.
          </Text>
        </Animated.View>

        <View style={styles.liftsContainer}>
          {liftFields.map((lift, index) => {
            const liftData = localLifts[lift.key];
            const estimated1RM = getEstimated1RM(liftData);
            
            return (
              <Animated.View
                key={lift.key}
                entering={FadeInDown.delay(80 + index * 60).duration(400)}
                style={styles.liftCard}
              >
                <View style={styles.liftHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={lift.icon}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <Text allowFontScaling={false} style={styles.liftName}>
                    {lift.label}
                  </Text>
                  {estimated1RM && (
                    <Text allowFontScaling={false} style={styles.estimated1RM}>
                      ~{estimated1RM} {unitLabel} 1RM
                    </Text>
                  )}
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.input}
                      value={liftData?.weight?.toString() || ""}
                      onChangeText={(v) => handleWeightChange(lift.key, v)}
                      placeholder={lift.placeholderWeight}
                      placeholderTextColor={colors.inputPlaceholder}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                    <Text allowFontScaling={false} style={styles.inputLabel}>
                      {unitLabel}
                    </Text>
                  </View>

                  <Text allowFontScaling={false} style={styles.timesSymbol}>×</Text>

                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[styles.input, styles.inputSmall]}
                      value={liftData?.reps?.toString() || ""}
                      onChangeText={(v) => handleRepsChange(lift.key, v)}
                      placeholder={lift.placeholderReps}
                      placeholderTextColor={colors.inputPlaceholder}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text allowFontScaling={false} style={styles.inputLabel}>
                      reps
                    </Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.tipCard}
        >
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <Text allowFontScaling={false} style={styles.tipText}>
            {hasAnyLifts 
              ? "We'll use these to set appropriate training weights for your first workouts."
              : "No worries if you're not sure — we'll start conservative and adjust as you train."
            }
          </Text>
        </Animated.View>

        <View style={styles.footer}>
          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <Button
              title="Continue"
              onPress={handleContinue}
            />
          </Animated.View>

          {!hasAnyLifts && (
            <Animated.View entering={FadeInDown.delay(550).duration(400)}>
              <Text allowFontScaling={false} style={styles.skipNote}>
                You can skip this — we&apos;ll figure it out together
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    keyboardView: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
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
    liftsContainer: {
      gap: 12,
    },
    liftCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      gap: 12,
    },
    liftHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
    },
    liftName: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontFamily: theme.fonts.bodySemiBold,
    },
    estimated1RM: {
      color: colors.primary,
      fontSize: 12,
      fontFamily: theme.fonts.bodyMedium,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    inputGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    input: {
      backgroundColor: colors.bg,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      width: 80,
      textAlign: "center",
      color: colors.text,
      fontSize: 18,
      fontFamily: theme.fonts.bodySemiBold,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputSmall: {
      width: 60,
    },
    inputLabel: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: theme.fonts.body,
    },
    timesSymbol: {
      color: colors.textMuted,
      fontSize: 20,
      fontFamily: theme.fonts.body,
    },
    tipCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      backgroundColor: colors.selected,
      borderRadius: 12,
      padding: 14,
      marginTop: 20,
    },
    tipText: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      fontFamily: theme.fonts.body,
      lineHeight: 18,
    },
    footer: {
      marginTop: "auto",
      paddingTop: 20,
      gap: 12,
    },
    skipNote: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: theme.fonts.body,
      textAlign: "center",
    },
  });
