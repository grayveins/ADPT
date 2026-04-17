/**
 * WeightInput Component
 * Premium weight input with large display, +/- buttons,
 * mini sparkline of last 4 weeks, and weekly average.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius, shadows } from "@/src/theme";

type WeightInputProps = {
  value: number;
  onChange: (value: number) => void;
  unit?: "lbs" | "kg";
  /** Last 4 weekly averages for sparkline, oldest first */
  history?: number[];
  /** Weekly average if multiple entries this week */
  weeklyAvg?: number | null;
};

/** Simple sparkline drawn with Views */
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const barHeight = 32;

  return (
    <View style={sparkStyles.container}>
      {data.map((val, i) => {
        const normalized = ((val - min) / range) * barHeight;
        const isLast = i === data.length - 1;
        return (
          <View key={i} style={sparkStyles.barWrapper}>
            <View
              style={[
                sparkStyles.bar,
                {
                  height: Math.max(4, normalized),
                  backgroundColor: isLast ? color : `${color}55`,
                  borderRadius: 2,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const sparkStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 36,
  },
  barWrapper: {
    justifyContent: "flex-end",
    height: 36,
  },
  bar: {
    width: 6,
  },
});

export function WeightInput({
  value,
  onChange,
  unit = "lbs",
  history = [],
  weeklyAvg,
}: WeightInputProps) {
  const { colors } = useTheme();

  const adjust = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.round((value + delta) * 10) / 10;
    if (next > 0) onChange(next);
  };

  // Determine trend
  const trend = history.length >= 2
    ? history[history.length - 1] > history[history.length - 2]
      ? "up"
      : history[history.length - 1] < history[history.length - 2]
      ? "down"
      : "same"
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Main weight display */}
      <View style={styles.displayRow}>
        <Pressable
          onPress={() => adjust(-0.1)}
          onLongPress={() => adjust(-1)}
          style={({ pressed }) => [
            styles.adjustButton,
            { backgroundColor: colors.bgTertiary },
            pressed && { backgroundColor: colors.pressed },
          ]}
          accessibilityLabel="Decrease weight"
        >
          <Ionicons name="remove" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.valueContainer}>
          <Text
            allowFontScaling={false}
            style={[styles.valueText, { color: colors.text }]}
          >
            {value.toFixed(1)}
          </Text>
          <Text
            allowFontScaling={false}
            style={[styles.unitText, { color: colors.textMuted }]}
          >
            {unit}
          </Text>
        </View>

        <Pressable
          onPress={() => adjust(0.1)}
          onLongPress={() => adjust(1)}
          style={({ pressed }) => [
            styles.adjustButton,
            { backgroundColor: colors.bgTertiary },
            pressed && { backgroundColor: colors.pressed },
          ]}
          accessibilityLabel="Increase weight"
        >
          <Ionicons name="add" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Sparkline + stats row */}
      {(history.length >= 2 || weeklyAvg) && (
        <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
          {history.length >= 2 && (
            <View style={styles.sparklineSection}>
              <MiniSparkline data={history} color={colors.primary} />
              <View style={styles.trendRow}>
                {trend === "down" && (
                  <Ionicons name="trending-down" size={14} color={colors.success} />
                )}
                {trend === "up" && (
                  <Ionicons name="trending-up" size={14} color={colors.intensity} />
                )}
                <Text
                  allowFontScaling={false}
                  style={[styles.trendText, { color: colors.textMuted }]}
                >
                  Last 4 weeks
                </Text>
              </View>
            </View>
          )}

          {weeklyAvg && (
            <View style={styles.avgSection}>
              <Text
                allowFontScaling={false}
                style={[styles.avgLabel, { color: colors.textMuted }]}
              >
                Weekly avg
              </Text>
              <Text
                allowFontScaling={false}
                style={[styles.avgValue, { color: colors.textSecondary }]}
              >
                {weeklyAvg.toFixed(1)} {unit}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: spacing.lg,
    ...shadows.card,
  },
  displayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  adjustButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  valueContainer: {
    alignItems: "center",
    minWidth: 140,
  },
  valueText: {
    fontSize: 48,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -1,
  },
  unitText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sparklineSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "500",
  },
  avgSection: {
    alignItems: "flex-end",
  },
  avgLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  avgValue: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
});
