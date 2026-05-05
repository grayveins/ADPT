/**
 * HabitRow — animated row for a coach-assigned habit.
 *
 * Cal-AI restrained celebration: no confetti, no avatars, no XP.
 *  - Checkbox spring-scales when tapped (0.8 → 1.15 → 1).
 *  - Row background flashes success-green (0 → 0.18 alpha → 0) on completion.
 *  - hapticSuccess on completion, hapticPress on uncheck.
 *  - "X of 7 this week" number counts up smoothly when it changes.
 *  - Streak milestone (7/14/30/60/100/365) bumps the streak text once,
 *    flagged by the parent passing `celebrateStreak` for that render.
 */

import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing } from "@/src/theme";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";

type Props = {
  name: string;
  /** Number of completions in the trailing 7 days. */
  weeklyDone: number;
  /** Current consecutive-days streak. */
  streak: number;
  /** Whether today is checked off. */
  completed: boolean;
  /** True only on the press tick when a streak milestone fires. */
  celebrateStreak?: boolean;
  /** Whether the daily checkbox is interactive (false on past/future days). */
  enabled: boolean;
  isLast: boolean;
  /** "daily" or "weekly" — drives the subtitle phrasing. */
  frequency: "daily" | "weekly";
  onToggle: () => void;
};

const STREAK_MILESTONES = new Set([7, 14, 30, 60, 100, 365]);

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

  const dotScale = useSharedValue(1);
  const flash = useSharedValue(0);
  const streakScale = useSharedValue(1);

  // Animate the count when weeklyDone changes (just a tiny pulse on the
  // number — keeps the change visible without a heavy count-up).
  const lastWeeklyDone = useRef(weeklyDone);
  useEffect(() => {
    if (lastWeeklyDone.current !== weeklyDone) {
      streakScale.value = withSequence(
        withTiming(1.18, { duration: 140, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 14, stiffness: 220 })
      );
      lastWeeklyDone.current = weeklyDone;
    }
  }, [weeklyDone, streakScale]);

  const handlePress = () => {
    if (!enabled) return;

    const goingToCompleted = !completed;

    // Checkbox spring on every tap.
    dotScale.value = withSequence(
      withTiming(0.8, { duration: 80 }),
      withSpring(goingToCompleted ? 1.15 : 1, {
        damping: 10,
        stiffness: 240,
      }),
      withSpring(1, { damping: 14, stiffness: 220 })
    );

    if (goingToCompleted) {
      // Row flash on completion only.
      flash.value = withSequence(
        withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 480, easing: Easing.in(Easing.quad) })
      );

      // Streak milestone pulse — runs after the checkbox settles.
      const nextStreak = streak + 1;
      if (STREAK_MILESTONES.has(nextStreak)) {
        streakScale.value = withSequence(
          withTiming(1.35, { duration: 220 }),
          withSpring(1, { damping: 9, stiffness: 180 })
        );
      }

      hapticSuccess();
    } else {
      hapticPress();
    }

    onToggle();
  };

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value * 0.18,
  }));
  const streakStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

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
      {/* Background flash on completion */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: colors.success },
          flashStyle,
        ]}
      />

      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: completed ? colors.success : "transparent",
            borderColor: completed ? colors.success : colors.textMuted,
          },
          dotStyle,
        ]}
      >
        {completed && <Ionicons name="checkmark" size={12} color="#fff" />}
      </Animated.View>

      <View style={styles.info}>
        <Text
          allowFontScaling={false}
          style={[styles.title, { color: colors.text }]}
        >
          {name}
        </Text>
        <Animated.Text
          allowFontScaling={false}
          style={[styles.sub, { color: colors.textMuted }, streakStyle]}
        >
          {subtitle}
        </Animated.Text>
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
    overflow: "hidden",
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
