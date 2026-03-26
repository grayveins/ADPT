/**
 * AnimatedProgressRing
 * Circular progress ring with smooth fill animation and optional glow
 */

import React, { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme } from "@/src/context/ThemeContext";
import { SPRING_CONFIG, TIMING } from "../constants";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type AnimatedProgressRingProps = {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  textColor?: string;
  showPercentage?: boolean;
  label?: string;
  sublabel?: string;
  breathe?: boolean;
  glow?: boolean;
  animated?: boolean;
};

export const AnimatedProgressRing: React.FC<AnimatedProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 10,
  color,
  backgroundColor,
  textColor,
  showPercentage = true,
  label,
  sublabel,
  breathe = true,
  glow = false,
  animated = true,
}) => {
  const { colors } = useTheme();
  
  // Use provided colors or fall back to theme colors
  const ringColor = color ?? colors.primary;
  const ringBgColor = backgroundColor ?? colors.border;
  const ringTextColor = textColor ?? colors.text;
  const ringMutedColor = colors.textMuted;

  const animatedProgress = useSharedValue(0);
  const breatheScale = useSharedValue(1);
  const glowOpacity = useSharedValue(glow ? 0.3 : 0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withSpring(progress, {
        ...SPRING_CONFIG.gentle,
        overshootClamping: true,
      });
    } else {
      animatedProgress.value = progress;
    }

    // Intensify glow when near completion
    if (glow && progress > 0.9) {
      glowOpacity.value = withTiming(0.6, { duration: TIMING.normal });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, animated, glow]);

  // Breathing animation
  useEffect(() => {
    if (breathe) {
      breatheScale.value = withRepeat(
        withSequence(
          withTiming(1.02, {
            duration: TIMING.breatheDuration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, {
            duration: TIMING.breatheDuration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breathe]);

  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const percentage = Math.round(progress * 100);

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Glow layer */}
      {glow && (
        <Animated.View
          style={[
            styles.glowLayer,
            { 
              width: size + 20, 
              height: size + 20, 
              borderRadius: (size + 20) / 2,
              backgroundColor: ringColor,
            },
            glowStyle,
          ]}
        />
      )}

      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={ringColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={ringColor} stopOpacity="0.7" />
          </LinearGradient>
        </Defs>

        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={ringBgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* Center content */}
      <View style={[styles.centerContent, { width: size, height: size }]}>
        {showPercentage && (
          <Text allowFontScaling={false} style={[styles.percentage, { color: ringTextColor }]}>
            {percentage}%
          </Text>
        )}
        {label && (
          <Text allowFontScaling={false} style={[styles.label, { color: ringTextColor }]}>
            {label}
          </Text>
        )}
        {sublabel && (
          <Text allowFontScaling={false} style={[styles.sublabel, { color: ringMutedColor }]}>
            {sublabel}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowLayer: {
    position: "absolute",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  percentage: {
    fontSize: 28,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  sublabel: {
    fontSize: 12,
    fontWeight: "400",
  },
});

export default AnimatedProgressRing;
