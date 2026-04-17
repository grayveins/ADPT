/**
 * WorkoutShareCard
 *
 * Strava-style post-workout share card designed for Instagram stories (1080x1920)
 * or square format. Rendered off-screen and captured via react-native-view-shot.
 *
 * Props come from workout_sessions / workout_exercises / workout_sets.
 */

import React, { forwardRef } from "react";
import { Image, View, Text, StyleSheet } from "react-native";
import ViewShot from "react-native-view-shot";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";
import { getRankByLevel } from "@/lib/ranks";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkoutShareCardProps = {
  workoutName: string;
  date: string; // formatted, e.g. "Mar 25, 2026"
  durationMinutes: number;
  totalVolumeLbs: number;
  exerciseCount: number;
  setCount: number;
  prsHit?: number;
  strengthScore?: number;
  level?: number;
  /** "story" = 9:16 tall, "square" = 1:1 */
  format?: "story" | "square";
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatVolume(lbs: number): string {
  if (lbs >= 10_000) return `${(lbs / 1000).toFixed(1)}k`;
  return lbs.toLocaleString();
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WorkoutShareCard = forwardRef<ViewShot, WorkoutShareCardProps>(
  (
    {
      workoutName,
      date,
      durationMinutes,
      totalVolumeLbs,
      exerciseCount,
      setCount,
      prsHit = 0,
      strengthScore,
      level = 1,
      format = "story",
    },
    ref
  ) => {
    const { colors } = useTheme();
    const rank = strengthScore != null ? getRankByLevel(level) : null;
    const isStory = format === "story";

    return (
      <ViewShot
        ref={ref}
        options={{ format: "png", quality: 1 }}
        style={[
          styles.shotContainer,
          isStory ? styles.storySize : styles.squareSize,
        ]}
      >
        <LinearGradient
          colors={["#0F0F0F", "#0A0A0A", "#111111"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle accent gradient overlay */}
        <LinearGradient
          colors={["rgba(0,201,183,0.06)", "transparent", "rgba(0,201,183,0.03)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          {/* ---- Brand header ---- */}
          <View style={styles.brandRow}>
            <Text allowFontScaling={false} style={styles.brandMark}>
              ADPT
            </Text>
            <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
          </View>

          {/* ---- Spacer (story mode) ---- */}
          {isStory && <View style={{ flex: 0.15 }} />}

          {/* ---- Workout title & date ---- */}
          <View style={styles.titleBlock}>
            <Text
              allowFontScaling={false}
              style={styles.workoutName}
              numberOfLines={2}
            >
              {workoutName}
            </Text>
            <Text allowFontScaling={false} style={styles.date}>
              {date}
            </Text>
          </View>

          {/* ---- Spacer ---- */}
          <View style={{ flex: isStory ? 0.08 : 0.05 }} />

          {/* ---- Stats grid ---- */}
          <View style={styles.statsGrid}>
            <StatItem label="Duration" value={formatDuration(durationMinutes)} />
            <StatItem label="Volume" value={`${formatVolume(totalVolumeLbs)} lbs`} />
            <StatItem label="Exercises" value={String(exerciseCount)} />
            <StatItem label="Sets" value={String(setCount)} />
          </View>

          {/* ---- PRs badge ---- */}
          {prsHit > 0 && (
            <View style={styles.prBadge}>
              <Ionicons name="trophy" size={18} color="#FFD700" />
              <Text allowFontScaling={false} style={styles.prText}>
                {prsHit} {prsHit === 1 ? "PR" : "PRs"} Hit
              </Text>
            </View>
          )}

          {/* ---- Spacer ---- */}
          <View style={{ flex: isStory ? 0.15 : 0.08 }} />

          {/* ---- SS rank pill (if available) ---- */}
          {rank && strengthScore != null && (
            <View style={styles.rankRow}>
              <View style={[styles.rankPill, { borderColor: `${rank.color}40` }]}>
                <Image source={rank.image} style={{ width: 18, height: 18 }} resizeMode="contain" />
                <Text
                  allowFontScaling={false}
                  style={[styles.rankScore, { color: rank.color }]}
                >
                  {strengthScore}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={[styles.rankLabel, { color: `${rank.color}99` }]}
                >
                  SS
                </Text>
              </View>
            </View>
          )}

          {/* ---- Spacer pushes watermark to bottom ---- */}
          <View style={{ flex: 1 }} />

          {/* ---- Watermark ---- */}
          <Text allowFontScaling={false} style={styles.watermark}>
            adpt.fit
          </Text>
        </View>
      </ViewShot>
    );
  }
);

WorkoutShareCard.displayName = "WorkoutShareCard";
export { WorkoutShareCard };

// ---------------------------------------------------------------------------
// Stat item sub-component
// ---------------------------------------------------------------------------

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text allowFontScaling={false} style={styles.statValue}>
        {value}
      </Text>
      <Text allowFontScaling={false} style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  shotContainer: {
    overflow: "hidden",
  },
  storySize: {
    width: 360,
    height: 640,
  },
  squareSize: {
    width: 400,
    height: 400,
  },
  content: {
    flex: 1,
    padding: 32,
  },

  // Brand
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandMark: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#F5F5F5",
    letterSpacing: 3,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Title
  titleBlock: {
    gap: 6,
  },
  workoutName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    color: "#F5F5F5",
    lineHeight: 34,
  },
  date: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#737373",
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  statItem: {
    width: "48%",
    paddingVertical: 14,
  },
  statValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    color: "#F5F5F5",
    lineHeight: 28,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#737373",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },

  // PR badge
  prBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: "rgba(255,215,0,0.10)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  prText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFD700",
  },

  // Rank pill
  rankRow: {
    alignItems: "flex-start",
  },
  rankPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  rankScore: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  rankLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Watermark
  watermark: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#3D3D3D",
    textAlign: "center",
    letterSpacing: 1.5,
  },
});
