/**
 * UpgradePrompt
 * Reusable modal that appears when a free user hits a feature limit.
 * Shows what they're missing + upgrade CTA.
 */

import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { theme } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

type UpgradePromptProps = {
  visible: boolean;
  onClose: () => void;
  feature: "workouts" | "history" | "programs" | "analytics";
  /** Optional personalized data to make the paywall stickier */
  strengthScore?: number;
  rankName?: string;
  rankColor?: string;
  workoutsCompleted?: number;
};

const FEATURE_CONFIG = {
  workouts: {
    icon: "barbell" as const,
    title: "Workout limit reached",
    subtitle: "You've used your 3 free workouts this week.",
    benefit: "Unlimited adaptive workouts that evolve with you",
    cta: "Unlock Unlimited Workouts",
  },
  history: {
    icon: "time" as const,
    title: "Full history is a Pro feature",
    subtitle: "Free accounts can view the last 7 days.",
    benefit: "Track your full training history and spot trends",
    cta: "Unlock Full History",
  },
  programs: {
    icon: "documents" as const,
    title: "Saved programs are a Pro feature",
    subtitle: "Upgrade to save and reuse your programs.",
    benefit: "Save unlimited programs and switch between them",
    cta: "Unlock Saved Programs",
  },
  analytics: {
    icon: "analytics" as const,
    title: "Advanced analytics are a Pro feature",
    subtitle: "Get deeper insights into your training.",
    benefit: "Full charts, muscle balance, volume trends & more",
    cta: "Unlock Analytics",
  },
};

export default function UpgradePrompt({
  visible,
  onClose,
  feature,
  strengthScore,
  rankName,
  rankColor,
  workoutsCompleted,
}: UpgradePromptProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const config = FEATURE_CONFIG[feature];

  const handleUpgrade = () => {
    hapticPress();
    onClose();
    router.push("/onboarding/editorial");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={SlideInDown.duration(300)}
          style={styles.sheet}
        >
          <Pressable onPress={() => {}} style={styles.sheetContent}>
            {/* Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name={config.icon} size={28} color={colors.primary} />
            </View>

            {/* Title */}
            <Text allowFontScaling={false} style={styles.title}>
              {config.title}
            </Text>
            <Text allowFontScaling={false} style={styles.subtitle}>
              {config.subtitle}
            </Text>

            {/* Personalized progress — "here's what you'd lose" */}
            {(strengthScore || rankName || workoutsCompleted) && (
              <View style={styles.progressRow}>
                {workoutsCompleted != null && workoutsCompleted > 0 && (
                  <View style={styles.progressItem}>
                    <Text allowFontScaling={false} style={styles.progressValue}>{workoutsCompleted}</Text>
                    <Text allowFontScaling={false} style={styles.progressLabel}>workouts</Text>
                  </View>
                )}
                {strengthScore != null && strengthScore > 0 && (
                  <View style={styles.progressItem}>
                    <Text allowFontScaling={false} style={styles.progressValue}>{strengthScore}</Text>
                    <Text allowFontScaling={false} style={styles.progressLabel}>strength</Text>
                  </View>
                )}
                {rankName && (
                  <View style={styles.progressItem}>
                    <Text allowFontScaling={false} style={[styles.progressValue, { color: rankColor || colors.primary }]}>{rankName}</Text>
                    <Text allowFontScaling={false} style={styles.progressLabel}>rank</Text>
                  </View>
                )}
              </View>
            )}

            {/* Benefit highlight */}
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text allowFontScaling={false} style={styles.benefitText}>
                {config.benefit}
              </Text>
            </View>

            {/* CTA */}
            <Pressable
              onPress={handleUpgrade}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text allowFontScaling={false} style={styles.ctaText}>
                {config.cta}
              </Text>
            </Pressable>

            {/* Trial note */}
            <View style={styles.trialNote}>
              <Ionicons name="shield-checkmark" size={14} color={colors.textMuted} />
              <Text allowFontScaling={false} style={styles.trialNoteText}>
                Start with a 7-day free trial
              </Text>
            </View>

            {/* Dismiss */}
            <Pressable onPress={onClose} style={styles.dismissButton}>
              <Text allowFontScaling={false} style={styles.dismissText}>
                Not now
              </Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 40,
    },
    sheetContent: {
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 32,
      gap: 12,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.selected,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    title: {
      color: colors.text,
      fontFamily: theme.fonts.heading,
      fontSize: 22,
      textAlign: "center",
    },
    subtitle: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22,
    },
    progressRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 24,
      backgroundColor: colors.card,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      width: "100%",
    },
    progressItem: {
      alignItems: "center",
    },
    progressValue: {
      color: colors.text,
      fontFamily: theme.fonts.heading,
      fontSize: 20,
    },
    progressLabel: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 11,
      marginTop: 2,
    },
    benefitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      width: "100%",
      marginTop: 4,
    },
    benefitText: {
      color: colors.text,
      fontFamily: theme.fonts.bodyMedium,
      fontSize: 14,
      flex: 1,
    },
    ctaButton: {
      width: "100%",
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    ctaText: {
      color: colors.textOnPrimary,
      fontFamily: theme.fonts.bodySemiBold,
      fontSize: 17,
    },
    trialNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    trialNoteText: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 13,
    },
    dismissButton: {
      paddingVertical: 8,
    },
    dismissText: {
      color: colors.textMuted,
      fontFamily: theme.fonts.body,
      fontSize: 14,
    },
  });
