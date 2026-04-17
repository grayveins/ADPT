/**
 * BodyScanAnimation
 * Cal AI-inspired futuristic body scanning effect for onboarding.
 * A glowing teal scan line sweeps top-to-bottom over a body silhouette,
 * revealing floating data-point labels and trailing sparkle particles.
 * Finishes with an animated checkmark.
 */

import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type BodyScanAnimationProps = {
  active: boolean;
  onComplete?: () => void;
  duration?: number; // ms, default 4000
};

// ---------------------------------------------------------------------------
// Data points that appear as the scan line passes
// ---------------------------------------------------------------------------
const DATA_POINTS = [
  { label: "Analyzing strength...", yPct: 0.15 },
  { label: "Mapping muscle balance...", yPct: 0.35 },
  { label: "Calibrating volume...", yPct: 0.55 },
  { label: "Optimizing recovery...", yPct: 0.75 },
];

// ---------------------------------------------------------------------------
// Body silhouette SVG path (simple human outline, ~300 tall)
// ---------------------------------------------------------------------------
const SILHOUETTE_HEIGHT = 300;
const SILHOUETTE_WIDTH = 120;

const BODY_PATH =
  // Head
  "M60 12 C48 12 40 22 40 32 C40 44 48 52 60 52 C72 52 80 44 80 32 C80 22 72 12 60 12 Z " +
  // Neck
  "M54 52 L54 62 L66 62 L66 52 " +
  // Shoulders & torso
  "M54 62 L20 72 L18 78 L26 80 L44 74 L44 140 L34 140 " +
  // Left leg
  "L30 200 L26 260 L22 280 L38 280 L40 260 L46 200 L52 160 " +
  // Right leg
  "L58 160 L64 200 L70 260 L72 280 L88 280 L84 260 L80 200 L76 140 L66 140 " +
  // Right arm & shoulder
  "L66 74 L84 80 L92 78 L90 72 L66 62 Z";

// ---------------------------------------------------------------------------
// Sparkle particle
// ---------------------------------------------------------------------------
type SparkleData = {
  id: number;
  x: number;
  y: number;
  delay: number;
  size: number;
};

const Sparkle: React.FC<{ data: SparkleData; color: string }> = ({
  data,
  color,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      data.delay,
      withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 400 })
      )
    );
    scale.value = withDelay(
      data.delay,
      withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0.3, { duration: 400 })
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: data.x,
          top: data.y,
          width: data.size,
          height: data.size,
          borderRadius: data.size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
};

// ---------------------------------------------------------------------------
// Floating data-point label
// ---------------------------------------------------------------------------
const DataPoint: React.FC<{
  label: string;
  yPct: number;
  scanProgress: { value: number };
  containerHeight: number;
  color: string;
  textColor: string;
  duration: number;
}> = ({ label, yPct, scanProgress, containerHeight, color, textColor, duration }) => {
  const style = useAnimatedStyle(() => {
    // Appear once the scan line passes this point
    const appear = interpolate(
      scanProgress.value,
      [yPct - 0.05, yPct, yPct + 0.05],
      [0, 0.8, 1],
      "clamp"
    );
    return {
      opacity: appear,
      transform: [
        { translateY: interpolate(appear, [0, 1], [8, 0]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.dataPoint,
        { top: containerHeight * yPct - 10 },
        style,
      ]}
    >
      <View style={[styles.dataPointDot, { backgroundColor: color }]} />
      <Animated.Text
        style={[styles.dataPointText, { color: textColor }]}
      >
        {label}
      </Animated.Text>
    </Animated.View>
  );
};

// ---------------------------------------------------------------------------
// Checkmark that appears after scan completes
// ---------------------------------------------------------------------------
const AnimatedCheck: React.FC<{
  visible: boolean;
  color: string;
}> = ({ visible, color }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSequence(
        withTiming(1.15, { duration: 250, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1, { duration: 150 })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.checkContainer, style]}>
      <Svg width={64} height={64} viewBox="0 0 64 64">
        <Path
          d="M16 34 L26 44 L48 20"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const BodyScanAnimation: React.FC<BodyScanAnimationProps> = ({
  active,
  onComplete,
  duration = 4000,
}) => {
  const { colors } = useTheme();
  const scanProgress = useSharedValue(0);
  const [showCheck, setShowCheck] = useState(false);
  const [sparkles, setSparkles] = useState<SparkleData[]>([]);

  const CONTAINER_HEIGHT = SILHOUETTE_HEIGHT + 60; // padding

  const handleScanComplete = useCallback(() => {
    setShowCheck(true);
    setTimeout(() => {
      onComplete?.();
    }, 600);
  }, [onComplete]);

  // Generate sparkle particles along the scan path
  const generateSparkles = useCallback(() => {
    const newSparkles: SparkleData[] = [];
    const totalSparkles = 24;
    for (let i = 0; i < totalSparkles; i++) {
      const timePct = i / totalSparkles;
      newSparkles.push({
        id: i,
        x: SCREEN_WIDTH * 0.5 + (Math.random() - 0.5) * SILHOUETTE_WIDTH * 1.2,
        y: CONTAINER_HEIGHT * timePct + (Math.random() - 0.5) * 12,
        delay: timePct * duration + Math.random() * 200,
        size: 3 + Math.random() * 4,
      });
    }
    setSparkles(newSparkles);
  }, [duration, CONTAINER_HEIGHT]);

  useEffect(() => {
    if (active) {
      setShowCheck(false);
      scanProgress.value = 0;
      generateSparkles();

      scanProgress.value = withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.ease),
      });

      // Trigger completion after scan finishes
      const timer = setTimeout(() => {
        runOnJS(handleScanComplete)();
      }, duration + 100);

      return () => clearTimeout(timer);
    } else {
      scanProgress.value = 0;
      setShowCheck(false);
      setSparkles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Scan line animated style
  const scanLineStyle = useAnimatedStyle(() => ({
    top: interpolate(scanProgress.value, [0, 1], [0, CONTAINER_HEIGHT]),
    opacity: interpolate(scanProgress.value, [0, 0.02, 0.95, 1], [0, 1, 1, 0]),
  }));

  // Silhouette glow that follows the scan
  const silhouetteGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scanProgress.value, [0, 0.1, 0.9, 1], [0.1, 0.4, 0.4, 0.2]),
  }));

  if (!active && !showCheck) return null;

  return (
    <View style={[styles.container, { height: CONTAINER_HEIGHT }]}>
      {/* Body silhouette */}
      <Animated.View style={[styles.silhouetteWrap, silhouetteGlowStyle]}>
        <Svg
          width={SILHOUETTE_WIDTH}
          height={SILHOUETTE_HEIGHT}
          viewBox={`0 0 ${SILHOUETTE_WIDTH} ${SILHOUETTE_HEIGHT}`}
          style={styles.silhouette}
        >
          <Path
            d={BODY_PATH}
            stroke={colors.primary}
            strokeWidth={1.5}
            fill="none"
            opacity={0.5}
          />
        </Svg>
      </Animated.View>

      {/* Scan line with glow */}
      <Animated.View style={[styles.scanLineWrap, scanLineStyle]}>
        <View
          style={[
            styles.scanLineGlow,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
          ]}
        />
        <View
          style={[styles.scanLine, { backgroundColor: colors.primary }]}
        />
      </Animated.View>

      {/* Sparkle particles */}
      {sparkles.map((s) => (
        <Sparkle key={s.id} data={s} color={colors.primary} />
      ))}

      {/* Data point labels */}
      {DATA_POINTS.map((dp) => (
        <DataPoint
          key={dp.label}
          label={dp.label}
          yPct={dp.yPct}
          scanProgress={scanProgress}
          containerHeight={CONTAINER_HEIGHT}
          color={colors.primary}
          textColor={colors.textSecondary}
          duration={duration}
        />
      ))}

      {/* Completion checkmark */}
      <AnimatedCheck visible={showCheck} color={colors.primary} />
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  silhouetteWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  silhouette: {
    alignSelf: "center",
  },
  scanLineWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    alignItems: "center",
  },
  scanLine: {
    width: "70%",
    height: 2,
    borderRadius: 1,
  },
  scanLineGlow: {
    position: "absolute",
    width: "70%",
    height: 20,
    borderRadius: 10,
    opacity: 0.3,
    top: -9,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  dataPoint: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dataPointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dataPointText: {
    fontSize: 13,
    fontWeight: "500",
  },
  checkContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default BodyScanAnimation;
