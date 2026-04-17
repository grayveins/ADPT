/**
 * WorkoutShareCard
 * Instagram Stories-ready share card (9:16 aspect ratio)
 * Captures a post-workout summary as an image for sharing
 */

import React, { useRef, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  Share,
  Platform,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/context/ThemeContext";
import { theme as appTheme } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkoutShareCardProps = {
  visible: boolean;
  onClose: () => void;
  workoutName: string;
  date: string; // formatted date like "Mar 24, 2026"
  duration: string; // "45:12"
  exercises: number;
  sets: number;
  totalVolume?: number;
  prs?: { exercise: string; value: string }[];
  streakDays?: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatVolume = (vol: number): string => {
  if (vol >= 1000) {
    return `${(vol / 1000).toFixed(1).replace(/\.0$/, "")}K lbs`;
  }
  return `${vol.toLocaleString()} lbs`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WorkoutShareCard: React.FC<WorkoutShareCardProps> = ({
  visible,
  onClose,
  workoutName,
  date,
  duration,
  exercises,
  sets,
  totalVolume,
  prs,
  streakDays,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = useCallback(async () => {
    hapticPress();
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (!uri) return;

      // On iOS we can use the native Share sheet with a local file URI.
      // expo-sharing works cross-platform for file URIs.
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share your workout",
        });
      } else {
        // Fallback: plain text share
        await Share.share({
          message: `${workoutName} - ${date}\n${duration} | ${exercises} exercises | ${sets} sets${totalVolume ? ` | ${formatVolume(totalVolume)}` : ""}\n\nTrained with ADPT Fit - adptfit.com`,
        });
      }
    } catch {
      // User cancelled or share failed silently
    }
  }, [workoutName, date, duration, exercises, sets, totalVolume]);

  if (!visible) return null;

  const hasPRs = prs && prs.length > 0;
  const hasStreak = streakDays && streakDays > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Animated.View entering={FadeIn.duration(300)} style={styles.modalContainer}>
        {/* ---- Scrollable card preview ---- */}
        <View style={styles.cardPreviewWrapper}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1, result: "tmpfile" }}
            style={styles.cardOuter}
          >
            <LinearGradient
              colors={["#0A0A0A", "#141414"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.card}
            >
              {/* ---- Logo / Wordmark ---- */}
              <View style={styles.logoRow}>
                <Text allowFontScaling={false} style={styles.logoAdpt}>
                  ADPT
                </Text>
                <Text allowFontScaling={false} style={styles.logoFit}>
                  FIT
                </Text>
              </View>

              {/* ---- Date + Workout Name ---- */}
              <Text allowFontScaling={false} style={styles.dateText}>
                {date}
              </Text>
              <Text allowFontScaling={false} style={styles.workoutName}>
                {workoutName}
              </Text>

              {/* ---- Divider ---- */}
              <View style={styles.divider} />

              {/* ---- Stats Row ---- */}
              <View style={styles.statsRow}>
                <StatCell label="Duration" value={duration} colors={colors} />
                <View style={styles.statDivider} />
                <StatCell label="Exercises" value={String(exercises)} colors={colors} />
                <View style={styles.statDivider} />
                <StatCell label="Sets" value={String(sets)} colors={colors} />
                {totalVolume != null && (
                  <>
                    <View style={styles.statDivider} />
                    <StatCell
                      label="Volume"
                      value={formatVolume(totalVolume)}
                      colors={colors}
                    />
                  </>
                )}
              </View>

              {/* ---- PRs Section ---- */}
              {hasPRs && (
                <View style={styles.prSection}>
                  <View style={styles.prHeader}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                    <Text allowFontScaling={false} style={styles.prTitle}>
                      Personal Records
                    </Text>
                  </View>
                  {prs.map((pr, i) => (
                    <View key={i} style={styles.prCard}>
                      <Ionicons name="trophy" size={14} color="#FFD700" />
                      <Text
                        allowFontScaling={false}
                        style={styles.prExercise}
                        numberOfLines={1}
                      >
                        {pr.exercise}
                      </Text>
                      <Text allowFontScaling={false} style={styles.prValue}>
                        {pr.value}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* ---- Streak Badge ---- */}
              {hasStreak && (
                <View style={styles.streakBadge}>
                  <Ionicons name="flame" size={18} color="#FF6B35" />
                  <Text allowFontScaling={false} style={styles.streakText}>
                    {streakDays} Day Streak
                  </Text>
                </View>
              )}

              {/* ---- Spacer to push branding to bottom ---- */}
              <View style={styles.spacer} />

              {/* ---- Bottom branding ---- */}
              <Text allowFontScaling={false} style={styles.branding}>
                adptfit.com
              </Text>
            </LinearGradient>
          </ViewShot>
        </View>

        {/* ---- Action buttons ---- */}
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.closeButton}
            onPress={() => {
              hapticPress();
              onClose();
            }}
          >
            <Text allowFontScaling={false} style={styles.closeButtonText}>
              Close
            </Text>
          </Pressable>
          <Pressable style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#0A0A0A" />
            <Text allowFontScaling={false} style={styles.shareButtonText}>
              Share
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// StatCell sub-component
// ---------------------------------------------------------------------------

const StatCell: React.FC<{
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
}> = ({ label, value, colors }) => (
  <View style={statCellStyles.container}>
    <Text allowFontScaling={false} style={[statCellStyles.value, { color: "#F5F5F5" }]}>
      {value}
    </Text>
    <Text allowFontScaling={false} style={[statCellStyles.label, { color: "#737373" }]}>
      {label}
    </Text>
  </View>
);

const statCellStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 2,
  },
  value: {
    fontFamily: appTheme.fonts.bodySemiBold,
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

// Card dimensions: 9:16 ratio sized to fit nicely inside a phone screen
const CARD_WIDTH = 330;
const CARD_HEIGHT = Math.round(CARD_WIDTH * (16 / 9)); // 587

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: "#000000",
      paddingTop: Platform.OS === "ios" ? 60 : 40,
      paddingBottom: Platform.OS === "ios" ? 40 : 24,
      alignItems: "center",
      justifyContent: "space-between",
    },

    // Card preview area
    cardPreviewWrapper: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    cardOuter: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 20,
      overflow: "hidden",
    },
    card: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 36,
      paddingBottom: 24,
    },

    // Logo
    logoRow: {
      flexDirection: "row",
      alignItems: "baseline",
      marginBottom: 32,
    },
    logoAdpt: {
      fontFamily: appTheme.fonts.heading,
      fontSize: 28,
      fontWeight: "800",
      color: "#3B82F6",
      letterSpacing: 2,
    },
    logoFit: {
      fontFamily: appTheme.fonts.heading,
      fontSize: 14,
      fontWeight: "600",
      color: "rgba(59, 130, 246, 0.5)",
      marginLeft: 3,
      letterSpacing: 1,
    },

    // Header
    dateText: {
      fontFamily: appTheme.fonts.body,
      fontSize: 13,
      fontWeight: "500",
      color: "#737373",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
    },
    workoutName: {
      fontFamily: appTheme.fonts.heading,
      fontSize: 24,
      fontWeight: "700",
      color: "#F5F5F5",
      marginBottom: 20,
    },

    // Divider
    divider: {
      height: 1,
      backgroundColor: "#2A2A2A",
      marginBottom: 20,
    },

    // Stats row
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(28, 28, 28, 0.8)",
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 8,
      marginBottom: 20,
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: "#2A2A2A",
    },

    // PR section
    prSection: {
      marginBottom: 16,
    },
    prHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 10,
    },
    prTitle: {
      fontFamily: appTheme.fonts.bodySemiBold,
      fontSize: 14,
      fontWeight: "600",
      color: "#FFD700",
      letterSpacing: 0.3,
    },
    prCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(255, 215, 0, 0.06)",
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: "rgba(255, 215, 0, 0.15)",
    },
    prExercise: {
      flex: 1,
      fontFamily: appTheme.fonts.bodySemiBold,
      fontSize: 14,
      fontWeight: "600",
      color: "#F5F5F5",
    },
    prValue: {
      fontFamily: appTheme.fonts.bodySemiBold,
      fontSize: 14,
      fontWeight: "700",
      color: "#FFD700",
    },

    // Streak badge
    streakBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      backgroundColor: "rgba(255, 107, 53, 0.10)",
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: "rgba(255, 107, 53, 0.2)",
      marginBottom: 16,
    },
    streakText: {
      fontFamily: appTheme.fonts.bodySemiBold,
      fontSize: 14,
      fontWeight: "600",
      color: "#FF6B35",
    },

    // Spacer
    spacer: {
      flex: 1,
    },

    // Bottom branding
    branding: {
      fontFamily: appTheme.fonts.body,
      fontSize: 12,
      fontWeight: "500",
      color: "#525252",
      textAlign: "center",
      letterSpacing: 1,
    },

    // Action buttons
    buttonRow: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 24,
      width: "100%",
      marginTop: 20,
    },
    closeButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: appTheme.components.button.borderRadius,
      borderWidth: 1,
      borderColor: "#2A2A2A",
    },
    closeButtonText: {
      fontFamily: appTheme.fonts.bodySemiBold,
      fontSize: 16,
      fontWeight: "600",
      color: "#F5F5F5",
    },
    shareButton: {
      flex: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      borderRadius: appTheme.components.button.borderRadius,
      backgroundColor: "#3B82F6",
    },
    shareButtonText: {
      fontFamily: appTheme.fonts.bodySemiBold,
      fontSize: 16,
      fontWeight: "600",
      color: "#0A0A0A",
    },
  });

export default WorkoutShareCard;
