/**
 * PostWorkoutCheckin
 * 
 * Modal that appears after finishing a workout.
 * Collects: How did that feel? + Pain location (if pain selected)
 * 
 * Flow:
 * 1. "How did that feel?" - [Easy] [Good] [Hard] [Pain]
 * 2. If Pain selected → "Where?" - [Shoulder] [Back] [Knee] [Elbow] [Other]
 * 3. Saves to workout_session and creates coach event if pain
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius, components } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

// Feeling options
type PostWorkoutFeeling = "easy" | "good" | "hard" | "pain";

// Pain location options (minimal set per design spec)
type PainLocation = "shoulder" | "back" | "knee" | "elbow" | "other";

type PostWorkoutCheckinProps = {
  visible: boolean;
  onComplete: (data: PostWorkoutData) => void;
  onSkip?: () => void;
  workoutTitle?: string;
  duration?: number;
};

export type PostWorkoutData = {
  feeling: PostWorkoutFeeling;
  painLocation: PainLocation | null;
};

const FEELINGS: Array<{ key: PostWorkoutFeeling; label: string; icon: string }> = [
  { key: "easy", label: "Easy", icon: "flash-outline" },
  { key: "good", label: "Good", icon: "thumbs-up-outline" },
  { key: "hard", label: "Hard", icon: "barbell-outline" },
  { key: "pain", label: "Pain", icon: "alert-circle-outline" },
];

const PAIN_LOCATIONS: Array<{ key: PainLocation; label: string }> = [
  { key: "shoulder", label: "Shoulder" },
  { key: "back", label: "Back" },
  { key: "knee", label: "Knee" },
  { key: "elbow", label: "Elbow" },
  { key: "other", label: "Other" },
];

export const PostWorkoutCheckin: React.FC<PostWorkoutCheckinProps> = ({
  visible,
  onComplete,
  onSkip,
  workoutTitle = "Workout",
  duration,
}) => {
  const { colors } = useTheme();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [feeling, setFeeling] = useState<PostWorkoutFeeling | null>(null);
  const [painLocation, setPainLocation] = useState<PainLocation | null>(null);

  const handleFeelingSelect = useCallback((selected: PostWorkoutFeeling) => {
    hapticPress();
    setFeeling(selected);
    
    if (selected === "pain") {
      // Show pain location picker
      setStep(2);
    } else {
      // Complete immediately
      onComplete({ feeling: selected, painLocation: null });
      // Reset state
      setStep(1);
      setFeeling(null);
      setPainLocation(null);
    }
  }, [onComplete]);

  const handlePainLocationSelect = useCallback((location: PainLocation) => {
    hapticPress();
    setPainLocation(location);
  }, []);

  const handleSubmitPain = useCallback(() => {
    if (!painLocation) return;
    
    hapticPress();
    onComplete({ feeling: "pain", painLocation });
    
    // Reset state
    setStep(1);
    setFeeling(null);
    setPainLocation(null);
  }, [painLocation, onComplete]);

  const handleBack = useCallback(() => {
    hapticPress();
    setStep(1);
    setFeeling(null);
    setPainLocation(null);
  }, []);

  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    } else {
      // Default: complete with "good" feeling
      onComplete({ feeling: "good", painLocation: null });
    }
    // Reset state
    setStep(1);
    setFeeling(null);
    setPainLocation(null);
  }, [onSkip, onComplete]);

  const durationText = duration 
    ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleSkip} />
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.sheet, { backgroundColor: colors.card }]}
        >
          {step === 1 ? (
            /* Step 1: How did that feel? */
            <Animated.View entering={FadeIn.duration(200)}>
              {/* Header */}
              <View style={styles.header}>
                <Text 
                  allowFontScaling={false} 
                  style={[styles.title, { color: colors.text }]}
                >
                  How did that feel?
                </Text>
                {durationText && (
                  <Text 
                    allowFontScaling={false} 
                    style={[styles.subtitle, { color: colors.textMuted }]}
                  >
                    {workoutTitle} • {durationText}
                  </Text>
                )}
              </View>

              {/* Feeling Options */}
              <View style={styles.feelingsGrid}>
                {FEELINGS.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => handleFeelingSelect(item.key)}
                    style={({ pressed }) => [
                      styles.feelingCard,
                      { 
                        backgroundColor: colors.bgSecondary,
                        borderColor: colors.border,
                      },
                      pressed && { backgroundColor: colors.pressed },
                      item.key === "pain" && { borderColor: colors.errorMuted },
                    ]}
                  >
                    <View
                      style={[
                        styles.feelingIcon,
                        { 
                          backgroundColor: item.key === "pain" 
                            ? colors.errorMuted 
                            : colors.primaryMuted,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={24}
                        color={item.key === "pain" ? colors.error : colors.primary}
                      />
                    </View>
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.feelingLabel,
                        { color: item.key === "pain" ? colors.error : colors.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Skip button */}
              <Pressable onPress={handleSkip} style={styles.skipButton}>
                <Text 
                  allowFontScaling={false} 
                  style={[styles.skipText, { color: colors.textMuted }]}
                >
                  Skip
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            /* Step 2: Pain Location */
            <Animated.View entering={FadeIn.duration(200)}>
              {/* Header */}
              <View style={styles.header}>
                <Text 
                  allowFontScaling={false} 
                  style={[styles.title, { color: colors.text }]}
                >
                  Where's the pain?
                </Text>
                <Text 
                  allowFontScaling={false} 
                  style={[styles.subtitle, { color: colors.textMuted }]}
                >
                  We'll check in next session
                </Text>
              </View>

              {/* Pain Location Options */}
              <View style={styles.painGrid}>
                {PAIN_LOCATIONS.map((item) => {
                  const isSelected = painLocation === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => handlePainLocationSelect(item.key)}
                      style={[
                        styles.painChip,
                        { 
                          backgroundColor: colors.bgSecondary,
                          borderColor: colors.border,
                        },
                        isSelected && { 
                          borderColor: colors.intensity,
                          backgroundColor: colors.errorMuted,
                        },
                      ]}
                    >
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.painChipText,
                          { color: isSelected ? colors.intensity : colors.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmitPain}
                disabled={!painLocation}
                style={({ pressed }) => [
                  styles.submitButton,
                  { 
                    backgroundColor: painLocation ? colors.primary : colors.disabled,
                  },
                  pressed && painLocation && { opacity: 0.9 },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.submitButtonText,
                    { color: painLocation ? colors.textOnPrimary : colors.disabledText },
                  ]}
                >
                  Done
                </Text>
              </Pressable>

              {/* Back button */}
              <Pressable onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={16} color={colors.textMuted} />
                <Text 
                  allowFontScaling={false} 
                  style={[styles.backText, { color: colors.textMuted }]}
                >
                  Back
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  feelingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  feelingCard: {
    width: "47%",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  feelingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  feelingLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  painGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  painChip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  painChipText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  submitButton: {
    height: components.button.height,
    borderRadius: components.button.height / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  backText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});

export default PostWorkoutCheckin;
