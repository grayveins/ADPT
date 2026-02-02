/**
 * WeeklyTargets
 * Three mini progress rings for muscles, sets, exercises
 */

import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { darkColors, theme } from "@/src/theme";
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

const MiniTarget: React.FC<TargetData & { color: string }> = ({
  current,
  target,
  label,
  color,
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
        <Text allowFontScaling={false} style={styles.targetValue}>
          {current}
        </Text>
        <Text allowFontScaling={false} style={styles.targetRemaining}>
          {isComplete ? "done" : `${remaining} left`}
        </Text>
      </View>
      <Text allowFontScaling={false} style={styles.targetLabel}>
        {label}
      </Text>
      <Text allowFontScaling={false} style={styles.targetTotal}>
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
  return (
    <View style={styles.container}>
      <Text allowFontScaling={false} style={styles.sectionTitle}>
        Weekly Targets
      </Text>
      <View style={styles.targetsRow}>
        <MiniTarget {...muscles} color={darkColors.primary} />
        <MiniTarget {...sets} color="#FF6B35" />
        <MiniTarget {...exercises} color="#4ECDC4" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
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
    color: darkColors.text,
    fontSize: 18,
    fontFamily: theme.fonts.bodySemiBold,
  },
  targetRemaining: {
    color: darkColors.muted,
    fontSize: 9,
    fontFamily: theme.fonts.body,
  },
  targetLabel: {
    color: darkColors.text,
    fontSize: 13,
    fontFamily: theme.fonts.bodyMedium,
    marginTop: 8,
  },
  targetTotal: {
    color: darkColors.muted,
    fontSize: 11,
    fontFamily: theme.fonts.body,
  },
});

export default WeeklyTargets;
