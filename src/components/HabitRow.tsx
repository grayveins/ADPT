/**
 * HabitRow — Trainerize-style toggle for a coach-assigned habit.
 * Monochrome, no flash, no pulse. Single haptic on tap.
 */

import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing } from "@/src/theme";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";

type Props = {
  name: string;
  weeklyDone: number;
  streak: number;
  completed: boolean;
  celebrateStreak?: boolean;
  enabled: boolean;
  isLast: boolean;
  frequency: "daily" | "weekly";
  onToggle: () => void;
};

export function HabitRow({
  name,
  weeklyDone,
  streak,
  completed,
  enabled,
  isLast,
  frequency,
  onToggle,
}: Props) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (!enabled) return;
    if (completed) hapticPress();
    else hapticSuccess();
    onToggle();
  };

  const subtitle = useMemo(() => {
    const base =
      frequency === "daily"
        ? `${weeklyDone} of 7 this week`
        : `${weeklyDone} this week`;
    if (streak >= 2) return `${base} · ${streak}🔥`;
    return base;
  }, [frequency, weeklyDone, streak]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={!enabled}
      style={[
        styles.row,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed, disabled: !enabled }}
      accessibilityLabel={`${name}, ${
        completed ? "completed" : "not completed"
      } today`}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: completed ? colors.success : "transparent",
            borderColor: completed ? colors.success : colors.textMuted,
          },
        ]}
      >
        {completed && <Ionicons name="checkmark" size={12} color="#fff" />}
      </View>

      <View style={styles.info}>
        <Text
          allowFontScaling={false}
          style={[styles.title, { color: colors.text }]}
        >
          {name}
        </Text>
        <Text
          allowFontScaling={false}
          style={[styles.sub, { color: colors.textMuted }]}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: spacing.md,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 1 },
  title: { fontSize: 15, fontWeight: "500" },
  sub: { fontSize: 13 },
});

export default HabitRow;
