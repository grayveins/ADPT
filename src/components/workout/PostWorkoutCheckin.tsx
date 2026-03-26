/**
 * PostWorkoutCheckin
 * 
 * Modal that appears after finishing a workout.
 * Collects: How did that feel? + Pain location (if pain selected)
 * 
 * Flow:
 * 1. "How did that feel?" - [Easy] [Good] [Hard] [Pain]
 * 2. If Pain selected → "Where?" - [Shoulder] [Back] [Knee] [Elbow] [Other]
 * 3. Confirmation screen (auto-dismisses after 2s)
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native";
import Animated, { FadeInDown, FadeIn, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import type ViewShotType from "react-native-view-shot";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius, components } from "@/src/theme";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";
import { CelebrationConfetti } from "@/src/animations/components/Confetti";
import { WorkoutShareCard } from "@/src/components/share/WorkoutShareCard";
import { captureAndShare } from "@/src/utils/shareCard";

// Feeling options
type PostWorkoutFeeling = "easy" | "good" | "hard" | "pain";

// Pain location options (minimal set per design spec)
type PainLocation = "shoulder" | "back" | "knee" | "elbow" | "other";

type WorkoutShareData = {
  totalVolumeLbs?: number;
  exerciseCount?: number;
  setCount?: number;
  prsHit?: number;
  strengthScore?: number;
};

type PostWorkoutCheckinProps = {
  visible: boolean;
  onComplete: (data: PostWorkoutData) => void;
  onSkip?: () => void;
  workoutTitle?: string;
  duration?: number;
  /** Pass workout stats to enable the "Share Workout" button on the confirmation screen. */
  shareData?: WorkoutShareData;
};

export type PostWorkoutData = {
  feeling: PostWorkoutFeeling;
  painLocation: PainLocation | null;
};

const FEELINGS: { key: PostWorkoutFeeling; label: string; icon: string }[] = [
  { key: "easy", label: "Easy", icon: "flash-outline" },
  { key: "good", label: "Good", icon: "thumbs-up-outline" },
  { key: "hard", label: "Hard", icon: "barbell-outline" },
  { key: "pain", label: "Pain", icon: "alert-circle-outline" },
];

const PAIN_LOCATIONS: { key: PainLocation; label: string }[] = [
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
  shareData,
}) => {
  const { colors } = useTheme();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [feeling, setFeeling] = useState<PostWorkoutFeeling | null>(null);
  const [painLocation, setPainLocation] = useState<PainLocation | null>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareCardRef = useRef<ViewShotType>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    // Cancel auto-dismiss while sharing
    if (autoDismissRef.current) {
      clearTimeout(autoDismissRef.current);
      autoDismissRef.current = null;
    }
    try {
      await captureAndShare(shareCardRef, "adpt-workout");
    } finally {
      setIsSharing(false);
    }
  }, []);

  // Auto-dismiss after confirmation screen
  useEffect(() => {
    if (step === 3) {
      autoDismissRef.current = setTimeout(() => {
        // Reset and close
        setStep(1);
        setFeeling(null);
        setPainLocation(null);
        setShowConfetti(false);
        // Notify parent to finish the workout flow
        if (onSkip) onSkip();
      }, shareData ? 5000 : 2000);
    }

    return () => {
      if (autoDismissRef.current) {
        clearTimeout(autoDismissRef.current);
      }
    };
  }, [step, onSkip, shareData]);

  const [showConfetti, setShowConfetti] = useState(false);

  const showConfirmation = useCallback((data: PostWorkoutData) => {
    // Save data first
    onComplete(data);
    // Then show confirmation with celebration
    setStep(3);
    if (data.feeling !== "pain") {
      hapticSuccess();
      setShowConfetti(true);
    }
  }, [onComplete]);

  const handleFeelingSelect = useCallback((selected: PostWorkoutFeeling) => {
    hapticPress();
    setFeeling(selected);
    
    if (selected === "pain") {
      // Show pain location picker
      setStep(2);
    } else {
      // Show confirmation screen
      showConfirmation({ feeling: selected, painLocation: null });
    }
  }, [showConfirmation]);

  const handlePainLocationSelect = useCallback((location: PainLocation) => {
    hapticPress();
    setPainLocation(location);
  }, []);

  const handleSubmitPain = useCallback(() => {
    if (!painLocation) return;
    
    hapticPress();
    // Show confirmation screen
    showConfirmation({ feeling: "pain", painLocation });
  }, [painLocation, showConfirmation]);

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
          {step === 1 && (
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
          )}

          {step === 2 && (
            /* Step 2: Pain Location */
            <Animated.View entering={FadeIn.duration(200)}>
              {/* Header */}
              <View style={styles.header}>
                <Text 
                  allowFontScaling={false} 
                  style={[styles.title, { color: colors.text }]}
                >
                  Where&apos;s the pain?
                </Text>
                <Text 
                  allowFontScaling={false} 
                  style={[styles.subtitle, { color: colors.textMuted }]}
                >
                  We&apos;ll check in next session
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

          {step === 3 && (
            /* Step 3: Confirmation (auto-dismisses) */
            <Animated.View entering={FadeIn.duration(200)} style={styles.confirmationContainer}>
              {/* Confetti for non-pain feedback */}
              <CelebrationConfetti
                active={showConfetti}
                onComplete={() => setShowConfetti(false)}
              />
              <Animated.View
                entering={FadeInUp.delay(100).duration(300)}
                style={[styles.confirmationIcon, { backgroundColor: feeling === "pain" ? colors.errorMuted : colors.successMuted }]}
              >
                <Ionicons
                  name={feeling === "pain" ? "alert-circle" : "checkmark-circle"}
                  size={48}
                  color={feeling === "pain" ? colors.intensity : colors.success}
                />
              </Animated.View>

              <Animated.Text
                entering={FadeInUp.delay(200).duration(300)}
                allowFontScaling={false}
                style={[styles.confirmationTitle, { color: colors.text }]}
              >
                {feeling === "pain" ? "Noted" : "Saved!"}
              </Animated.Text>

              <Animated.Text
                entering={FadeInUp.delay(300).duration(300)}
                allowFontScaling={false}
                style={[styles.confirmationSubtitle, { color: colors.textMuted }]}
              >
                {feeling === "pain" && painLocation
                  ? `We'll modify exercises to protect your ${painLocation}`
                  : "We're adjusting your next workouts based on your feedback"}
              </Animated.Text>

              {/* Share Workout button */}
              {shareData && feeling !== "pain" && (
                <Animated.View entering={FadeInUp.delay(400).duration(300)} style={styles.shareButtonRow}>
                  <Pressable
                    onPress={handleShare}
                    disabled={isSharing}
                    style={({ pressed }) => [
                      styles.shareButton,
                      { borderColor: colors.primary },
                      pressed && { backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Ionicons
                      name="share-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      allowFontScaling={false}
                      style={[styles.shareButtonText, { color: colors.primary }]}
                    >
                      {isSharing ? "Preparing..." : "Share Workout"}
                    </Text>
                  </Pressable>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* Off-screen share card for capture (absolutely positioned, outside visible area) */}
          {shareData && step === 3 && (
            <View style={styles.offScreen}>
              <WorkoutShareCard
                ref={shareCardRef}
                workoutName={workoutTitle}
                date={new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                durationMinutes={duration ? Math.floor(duration / 60) : 0}
                totalVolumeLbs={shareData.totalVolumeLbs ?? 0}
                exerciseCount={shareData.exerciseCount ?? 0}
                setCount={shareData.setCount ?? 0}
                prsHit={shareData.prsHit}
                strengthScore={shareData.strengthScore}
                format="story"
              />
            </View>
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
  // Confirmation screen (step 3)
  confirmationContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  confirmationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  confirmationTitle: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.sm,
  },
  confirmationSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  // Share button
  shareButtonRow: {
    marginTop: spacing.xl,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  shareButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  // Off-screen container for share card capture
  offScreen: {
    position: "absolute",
    left: -9999,
    top: -9999,
  },
});

export default PostWorkoutCheckin;
