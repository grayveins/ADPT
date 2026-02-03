/**
 * PainFollowUpModal
 * 
 * Modal that appears after a workout when the user reported pain areas
 * in the pre-workout check-in. Asks how those specific areas felt.
 * 
 * Professional coach tone - focused on adaptation and recovery.
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
import { spacing, radius, bodyRegions, type BodyRegion } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

export type PainFeedback = "better" | "same" | "worse";

type PainFollowUpModalProps = {
  visible: boolean;
  painAreas: BodyRegion[];
  onComplete: (feedback: Record<BodyRegion, PainFeedback>) => void;
  onSkip: () => void;
};

const FEEDBACK_OPTIONS: Array<{
  key: PainFeedback;
  label: string;
  description: string;
  icon: string;
  color: "success" | "text" | "intensity";
}> = [
  {
    key: "better",
    label: "Better",
    description: "Felt better than expected",
    icon: "trending-up",
    color: "success",
  },
  {
    key: "same",
    label: "About the same",
    description: "No significant change",
    icon: "remove",
    color: "text",
  },
  {
    key: "worse",
    label: "Worse",
    description: "Need more modifications",
    icon: "trending-down",
    color: "intensity",
  },
];

export const PainFollowUpModal: React.FC<PainFollowUpModalProps> = ({
  visible,
  painAreas,
  onComplete,
  onSkip,
}) => {
  const { colors } = useTheme();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, PainFeedback>>({});

  const currentArea = painAreas[currentIndex];
  const isLastArea = currentIndex === painAreas.length - 1;

  const handleFeedbackSelect = useCallback((selected: PainFeedback) => {
    hapticPress();
    
    const newFeedback = { ...feedback, [currentArea]: selected };
    setFeedback(newFeedback);

    if (isLastArea) {
      // Complete - send all feedback
      onComplete(newFeedback as Record<BodyRegion, PainFeedback>);
      // Reset state
      setCurrentIndex(0);
      setFeedback({});
    } else {
      // Move to next area
      setCurrentIndex(currentIndex + 1);
    }
  }, [feedback, currentArea, isLastArea, currentIndex, onComplete]);

  const handleSkip = useCallback(() => {
    hapticPress();
    onSkip();
    // Reset state
    setCurrentIndex(0);
    setFeedback({});
  }, [onSkip]);

  if (painAreas.length === 0) return null;

  const areaLabel = bodyRegions[currentArea]?.label || currentArea;
  const progressText = painAreas.length > 1 
    ? `${currentIndex + 1} of ${painAreas.length}` 
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleSkip} />
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.sheet, { backgroundColor: colors.card }]}
        >
          <Animated.View entering={FadeIn.duration(200)}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.headerIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              </View>
              <View style={styles.headerText}>
                <Text 
                  allowFontScaling={false} 
                  style={[styles.title, { color: colors.text }]}
                >
                  How did your {areaLabel.toLowerCase()} feel?
                </Text>
                <Text 
                  allowFontScaling={false} 
                  style={[styles.subtitle, { color: colors.textMuted }]}
                >
                  Your feedback helps us personalize future workouts
                </Text>
              </View>
            </View>

            {/* Progress indicator */}
            {progressText && (
              <View style={styles.progressContainer}>
                <Text 
                  allowFontScaling={false} 
                  style={[styles.progressText, { color: colors.textMuted }]}
                >
                  {progressText}
                </Text>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${((currentIndex + 1) / painAreas.length) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Feedback Options */}
            <View style={styles.optionsContainer}>
              {FEEDBACK_OPTIONS.map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => handleFeedbackSelect(option.key)}
                  style={({ pressed }) => [
                    styles.optionCard,
                    { 
                      backgroundColor: colors.bgSecondary,
                      borderColor: colors.border,
                    },
                    pressed && { backgroundColor: colors.pressed },
                  ]}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      { 
                        backgroundColor: 
                          option.color === "success" ? colors.successMuted :
                          option.color === "intensity" ? colors.errorMuted :
                          colors.bgSecondary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={22}
                      color={
                        option.color === "success" ? colors.success :
                        option.color === "intensity" ? colors.intensity :
                        colors.textMuted
                      }
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.optionLabel, { color: colors.text }]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.optionDescription, { color: colors.textMuted }]}
                    >
                      {option.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>

            {/* Reassurance note */}
            <View style={[styles.note, { backgroundColor: colors.bgSecondary }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
              <Text 
                allowFontScaling={false} 
                style={[styles.noteText, { color: colors.textMuted }]}
              >
                {feedback[currentArea] === "worse" 
                  ? "We'll increase modifications for your next session. Consider consulting a healthcare professional if pain persists."
                  : "We track this over time to optimize your training around any limitations."}
              </Text>
            </View>

            {/* Skip button */}
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text 
                allowFontScaling={false} 
                style={[styles.skipText, { color: colors.textMuted }]}
              >
                Skip for now
              </Text>
            </Pressable>
          </Animated.View>
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
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  optionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});

export default PainFollowUpModal;
