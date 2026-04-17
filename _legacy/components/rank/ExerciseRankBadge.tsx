/**
 * ExerciseRankBadge
 *
 * Inline pill badge showing the exercise rank (Beginner → Legend).
 * Compact mode: icon + rank name.
 * Full mode: adds "X lbs to <NextRank>" below.
 */

import React, { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/context/ThemeContext";
import { typography, spacing, radius } from "@/src/theme";
import type { Sex } from "@/lib/exerciseRanks";
import { getExerciseRank, getNextExerciseRank } from "@/lib/exerciseRanks";

type ExerciseRankBadgeProps = {
  exerciseName: string;
  weightLbs: number;
  bodyweightLbs: number;
  sex: Sex;
  compact?: boolean;
};

export function ExerciseRankBadge({
  exerciseName,
  weightLbs,
  bodyweightLbs,
  sex,
  compact = false,
}: ExerciseRankBadgeProps) {
  const { colors } = useTheme();

  const rank = useMemo(
    () => getExerciseRank(exerciseName, weightLbs, bodyweightLbs, sex),
    [exerciseName, weightLbs, bodyweightLbs, sex],
  );

  const next = useMemo(
    () => (compact ? null : getNextExerciseRank(exerciseName, weightLbs, bodyweightLbs, sex)),
    [compact, exerciseName, weightLbs, bodyweightLbs, sex],
  );

  const badgeBg = useMemo(
    () => hexToRGBA(rank.color, 0.12),
    [rank.color],
  );

  return (
    <View style={compact ? styles.wrapperCompact : styles.wrapperFull}>
      {/* Pill badge */}
      <View style={[styles.pill, { backgroundColor: badgeBg }]}>
        <Image
          source={rank.image}
          style={{ width: compact ? 14 : 18, height: compact ? 14 : 18 }}
          resizeMode="contain"
        />
        <Text
          allowFontScaling={false}
          style={[
            styles.rankName,
            { color: rank.color },
            compact && styles.rankNameCompact,
          ]}
        >
          {rank.name}
        </Text>
      </View>

      {/* "X lbs to Next" — full mode only */}
      {!compact && next && (
        <Text
          allowFontScaling={false}
          style={[styles.nextText, { color: colors.textMuted }]}
        >
          {next.weightNeeded} lbs to {next.rank.name}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRGBA(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapperCompact: {
    flexDirection: "row",
    alignItems: "center",
  },
  wrapperFull: {
    alignItems: "flex-start",
    gap: 2,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    height: 24,
  },
  rankName: {
    fontFamily: typography.fonts.bodyMedium,
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.caption1,
    letterSpacing: 0.3,
  },
  rankNameCompact: {
    fontSize: typography.sizes.caption2,
  },
  nextText: {
    fontFamily: typography.fonts.body,
    fontWeight: typography.weights.regular,
    fontSize: typography.sizes.caption2,
    marginLeft: spacing.sm,
  },
});

export default ExerciseRankBadge;
