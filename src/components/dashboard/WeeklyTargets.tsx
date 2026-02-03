/**
 * WeeklyTargets
 * Three mini progress rings for muscles, sets, exercises
 */

import React, { useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { AnimatedProgressRing } from "@/src/animations/components";

type TargetData = {
  current: number;
  target: number;
  label: string;
};

type WeeklyTargetsProps = {
  muscles: TargetData;
  sets: TargetData;
  exercises: TargetData;
};

type MiniTargetProps = TargetData & { 
  color: string;
  colors: ReturnType<typeof useTheme>["colors"];
};

const MiniTarget: React.FC<MiniTargetProps> = ({
  current,
  target,
  label,
  color,
  colors,
}) => {
  const progress = Math.min(current / target, 1);
  const remaining = Math.max(target - current, 0);
  const isComplete = current >= target;

  return (
    <View style={styles.targetContainer}>
      <AnimatedProgressRing
        progress={progress}
        size={70}
        strokeWidth={6}
        color={color}
        showPercentage={false}
        breathe={false}
        glow={isComplete}
      />
      <View style={styles.targetContent}>
        <Text allowFontScaling={false} style={[styles.targetValue, { color: colors.text }]}>
          {current}
        </Text>
        <Text allowFontScaling={false} style={[styles.targetRemaining, { color: colors.muted }]}>
          {isComplete ? "done" : `${remaining} left`}
        </Text>
      </View>
      <Text allowFontScaling={false} style={[styles.targetLabel, { color: colors.text }]}>
        {label}
      </Text>
      <Text allowFontScaling={false} style={[styles.targetTotal, { color: colors.muted }]}>
        {target} target
      </Text>
    </View>
  );
};

export const WeeklyTargets: React.FC<WeeklyTargetsProps> = ({
  muscles,
  sets,
  exercises,
}) => {
  const { colors, radius } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderRadius: radius.lg }]}>
      <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
        Weekly Targets
      </Text>
      <View style={styles.targetsRow}>
        <MiniTarget {...muscles} color={colors.primary} colors={colors} />
        <MiniTarget {...sets} color={colors.intensity} colors={colors} />
        <MiniTarget {...exercises} color={colors.info} colors={colors} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  targetsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  targetContainer: {
    alignItems: "center",
    position: "relative",
  },
  targetContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    height: 70,
  },
  targetValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  targetRemaining: {
    fontSize: 9,
    fontWeight: "400",
  },
  targetLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 8,
  },
  targetTotal: {
    fontSize: 11,
    fontWeight: "400",
  },
});

export default WeeklyTargets;
