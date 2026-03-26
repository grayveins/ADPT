/**
 * TemplateCard — Hevy/Gravl-inspired
 *
 * Premium card with muscle group color accent, exercise preview list,
 * and meta row (exercise count, sets, last used). Compact horizontal
 * scroll card or full-width list card via `fullWidth` prop.
 */

import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { hapticPress } from "@/src/animations/feedback/haptics";
import type { WorkoutTemplate } from "@/lib/workout/templates";

// Muscle group → accent color mapping (Fitbod style)
const MUSCLE_COLORS: Record<string, string> = {
  chest: "#FF6B6B",
  back: "#4ECDC4",
  shoulders: "#FFB347",
  arms: "#9B59B6",
  legs: "#3498DB",
  core: "#2ECC71",
};

function getPrimaryMuscle(exercises: WorkoutTemplate["exercises"]): string | null {
  if (!exercises?.length) return null;
  const counts: Record<string, number> = {};
  exercises.forEach((ex) => {
    const g = ex.muscleGroup?.toLowerCase() ?? "";
    if (g) counts[g] = (counts[g] ?? 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

function getTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never used";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

type Props = {
  template: WorkoutTemplate;
  onPress: (template: WorkoutTemplate) => void;
  onLongPress?: (template: WorkoutTemplate) => void;
  fullWidth?: boolean;
};

export function TemplateCard({ template, onPress, onLongPress, fullWidth }: Props) {
  const { colors } = useTheme();
  const exerciseCount = template.exercises?.length ?? 0;
  const totalSets = template.exercises?.reduce((s, e) => s + e.sets, 0) ?? 0;
  const primaryMuscle = useMemo(() => getPrimaryMuscle(template.exercises), [template.exercises]);
  const accent = MUSCLE_COLORS[primaryMuscle ?? ""] ?? colors.primary;
  const lastUsed = getTimeAgo(template.last_used_at);

  // Show first 3 exercise names as preview
  const exercisePreview = template.exercises?.slice(0, 3).map((e) => e.name) ?? [];

  return (
    <Pressable
      onPress={() => { hapticPress(); onPress(template); }}
      onLongPress={() => { hapticPress(); onLongPress?.(template); }}
      style={({ pressed }) => [
        fullWidth ? styles.cardFull : styles.card,
        { backgroundColor: colors.card },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Accent bar top */}
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.content}>
        {/* Name */}
        <Text allowFontScaling={false} style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {template.name}
        </Text>

        {/* Exercise preview list */}
        <View style={styles.exerciseList}>
          {exercisePreview.map((name, i) => (
            <Text
              key={i}
              allowFontScaling={false}
              style={[styles.exerciseName, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {name}
            </Text>
          ))}
          {exerciseCount > 3 && (
            <Text allowFontScaling={false} style={[styles.exerciseName, { color: colors.textMuted }]}>
              +{exerciseCount - 3} more
            </Text>
          )}
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={[styles.metaPill, { backgroundColor: accent + "18" }]}>
            <Text allowFontScaling={false} style={[styles.metaPillText, { color: accent }]}>
              {exerciseCount} exercises
            </Text>
          </View>
          <Text allowFontScaling={false} style={[styles.metaDot, { color: colors.border }]}>&middot;</Text>
          <Text allowFontScaling={false} style={[styles.metaText, { color: colors.textMuted }]}>
            {totalSets} sets
          </Text>
          {template.times_used > 0 && (
            <>
              <Text allowFontScaling={false} style={[styles.metaDot, { color: colors.border }]}>&middot;</Text>
              <Text allowFontScaling={false} style={[styles.metaText, { color: colors.textMuted }]}>
                {lastUsed}
              </Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    borderRadius: 14,
    marginRight: 10,
    overflow: "hidden",
  },
  cardFull: {
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  accentBar: {
    height: 3,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  content: {
    padding: 14,
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  exerciseList: {
    gap: 2,
  },
  exerciseName: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  metaPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  metaPillText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  metaDot: {
    fontSize: 10,
  },
  metaText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
