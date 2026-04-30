/**
 * GoalVisualization
 * Animated visualization shown after the user selects their fitness goal.
 * Each goal type gets a unique, emotionally-engaging micro-animation.
 */

import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedReaction,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Circle, Rect } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type GoalType = "build_muscle" | "lose_fat" | "get_stronger" | "general_fitness";

type GoalVisualizationProps = {
  goal: GoalType;
  active: boolean;
};

// ---------------------------------------------------------------------------
// Goal configs
// ---------------------------------------------------------------------------
const GOAL_CONFIG: Record<GoalType, { label: string; fromLabel: string; toLabel: string }> = {
  build_muscle: { label: "Strength Score", fromLabel: "Now", toLabel: "8 weeks" },
  lose_fat: { label: "Body Composition", fromLabel: "Now", toLabel: "12 weeks" },
  get_stronger: { label: "Max Lifts", fromLabel: "Now", toLabel: "6 weeks" },
  general_fitness: { label: "Activity Level", fromLabel: "Now", toLabel: "4 weeks" },
};

// ---------------------------------------------------------------------------
// Hook: animated number -> string state via useAnimatedReaction
// ---------------------------------------------------------------------------
function useAnimatedText(
  sharedValue: { value: number },
  formatter: (v: number) => string
): string {
  const [text, setText] = useState(formatter(0));

  useAnimatedReaction(
    () => sharedValue.value,
    (current) => {
      runOnJS(setText)(formatter(current));
    }
  );

  return text;
}

// ---------------------------------------------------------------------------
// Build Muscle — score climbs with progress bar
// ---------------------------------------------------------------------------
const BuildMuscle: React.FC<{ active: boolean; color: string; textColor: string; mutedColor: string }> = ({
  active,
  color,
  mutedColor,
}) => {
  const score = useSharedValue(0);
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    if (active) {
      score.value = withTiming(78, { duration: 2000, easing: Easing.out(Easing.ease) });
      fillWidth.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) });
    } else {
      score.value = 0;
      fillWidth.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%` as any,
  }));

  const scoreText = useAnimatedText(score, (v) => Math.round(v).toString());

  return (
    <View style={styles.goalContent}>
      <Text style={[styles.scoreHero, { color }]}>{scoreText}</Text>
      <Text style={[styles.goalLabel, { color: mutedColor }]}>
        Projected Strength Score
      </Text>
      <View style={styles.barContainer}>
        <View style={[styles.barBg, { backgroundColor: `${color}20` }]}>
          <Animated.View style={[styles.barFill, { backgroundColor: color }, barStyle]} />
        </View>
      </View>
      <View style={styles.barLabels}>
        <Text style={[styles.barLabel, { color: mutedColor }]}>0</Text>
        <Text style={[styles.barLabel, { color: mutedColor }]}>100</Text>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Lose Fat — weight number animates down, progress ring fills
// ---------------------------------------------------------------------------
const LoseFat: React.FC<{ active: boolean; color: string; textColor: string; mutedColor: string }> = ({
  active,
  color,
  mutedColor,
}) => {
  const weight = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      weight.value = withTiming(8, { duration: 2000, easing: Easing.out(Easing.ease) });
      progress.value = withTiming(0.65, { duration: 2000, easing: Easing.out(Easing.ease) });
    } else {
      weight.value = 0;
      progress.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const RING_SIZE = 120;
  const STROKE_WIDTH = 8;
  const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const weightText = useAnimatedText(weight, (v) => `-${v.toFixed(1)} lbs`);

  return (
    <View style={styles.goalContent}>
      <View style={styles.ringContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={`${color}20`}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE}`}
            animatedProps={animatedProps}
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <Text style={[styles.ringText, { color }]}>{weightText}</Text>
      </View>
      <Text style={[styles.goalLabel, { color: mutedColor }]}>
        Projected fat loss in 12 weeks
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Get Stronger — barbell icon with animated weight plates
// ---------------------------------------------------------------------------
const GetStronger: React.FC<{ active: boolean; color: string; textColor: string; mutedColor: string }> = ({
  active,
  color,
  mutedColor,
}) => {
  const liftIncrease = useSharedValue(0);
  const plateScale = useSharedValue(0);

  useEffect(() => {
    if (active) {
      liftIncrease.value = withTiming(15, { duration: 2000, easing: Easing.out(Easing.ease) });
      plateScale.value = withDelay(
        300,
        withSequence(
          withTiming(1.1, { duration: 300, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 200 })
        )
      );
    } else {
      liftIncrease.value = 0;
      plateScale.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const plateStyle = useAnimatedStyle(() => ({
    transform: [{ scale: plateScale.value }],
  }));

  const liftText = useAnimatedText(liftIncrease, (v) => `+${Math.round(v)}%`);

  return (
    <View style={styles.goalContent}>
      <Animated.View style={plateStyle}>
        <Svg width={160} height={80} viewBox="0 0 160 80">
          {/* Barbell bar */}
          <Rect x={20} y={36} width={120} height={8} rx={4} fill={`${color}40`} />
          {/* Left plates */}
          <Rect x={10} y={20} width={16} height={40} rx={4} fill={color} />
          <Rect x={28} y={26} width={12} height={28} rx={3} fill={`${color}80`} />
          {/* Right plates */}
          <Rect x={134} y={20} width={16} height={40} rx={4} fill={color} />
          <Rect x={120} y={26} width={12} height={28} rx={3} fill={`${color}80`} />
        </Svg>
      </Animated.View>
      <Text style={[styles.scoreHero, { color }]}>{liftText}</Text>
      <Text style={[styles.goalLabel, { color: mutedColor }]}>
        Projected strength gain in 6 weeks
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// General Fitness — activity ring filling from empty to full
// ---------------------------------------------------------------------------
const GeneralFitness: React.FC<{ active: boolean; color: string; textColor: string; mutedColor: string }> = ({
  active,
  color,
  mutedColor,
}) => {
  const progress = useSharedValue(0);
  const score = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withTiming(0.85, { duration: 2000, easing: Easing.out(Easing.ease) });
      score.value = withTiming(85, { duration: 2000, easing: Easing.out(Easing.ease) });
    } else {
      progress.value = 0;
      score.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const RING_SIZE = 120;
  const STROKE_WIDTH = 10;
  const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const scoreText = useAnimatedText(score, (v) => `${Math.round(v)}%`);

  return (
    <View style={styles.goalContent}>
      <View style={styles.ringContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={`${color}20`}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE}`}
            animatedProps={animatedProps}
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <Text style={[styles.ringText, { color }]}>{scoreText}</Text>
      </View>
      <Text style={[styles.goalLabel, { color: mutedColor }]}>
        Projected fitness score in 4 weeks
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const GoalVisualization: React.FC<GoalVisualizationProps> = ({
  goal,
  active,
}) => {
  const { colors } = useTheme();
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    containerOpacity.value = active
      ? withTiming(1, { duration: 300 })
      : withTiming(0, { duration: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const sharedProps = {
    active,
    color: colors.primary,
    textColor: colors.text,
    mutedColor: colors.textSecondary,
  };

  const config = GOAL_CONFIG[goal];

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Timeline labels */}
      <View style={styles.timelineRow}>
        <View style={styles.timelineDot}>
          <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
          <Text style={[styles.timelineLabel, { color: colors.textMuted }]}>
            {config.fromLabel}
          </Text>
        </View>
        <View style={[styles.timelineLine, { backgroundColor: `${colors.primary}30` }]} />
        <View style={styles.timelineDot}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.timelineLabel, { color: colors.primary }]}>
            {config.toLabel}
          </Text>
        </View>
      </View>

      {/* Goal-specific visualization */}
      {goal === "build_muscle" && <BuildMuscle {...sharedProps} />}
      {goal === "lose_fat" && <LoseFat {...sharedProps} />}
      {goal === "get_stronger" && <GetStronger {...sharedProps} />}
      {goal === "general_fitness" && <GeneralFitness {...sharedProps} />}
    </Animated.View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 24,
  },
  goalContent: {
    alignItems: "center",
    marginTop: 20,
    gap: 12,
  },
  scoreHero: {
    fontSize: 48,
    fontWeight: "700",
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Ring
  ringContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringText: {
    position: "absolute",
    fontSize: 22,
    fontWeight: "700",
  },
  // Progress bar
  barContainer: {
    width: "80%",
    marginTop: 4,
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  barLabels: {
    width: "80%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Timeline
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "70%",
    justifyContent: "space-between",
  },
  timelineDot: {
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    borderRadius: 1,
  },
  timelineLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default GoalVisualization;
