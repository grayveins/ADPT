/**
 * RestTimer
 * Circular countdown timer with smooth animation
 */

import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { haptic } from "@/src/animations/feedback/haptics";
import { TIMING } from "@/src/animations/constants";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RestTimerProps = {
  duration: number; // seconds
  onComplete: () => void;
  onSkip?: () => void;
};

export const RestTimer: React.FC<RestTimerProps> = ({
  duration,
  onComplete,
  onSkip,
}) => {
  const { colors, typography } = useTheme();
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);

  const progress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  const size = 160;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Start countdown
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          haptic("success");
          onComplete();
          return 0;
        }
        
        // Haptic at 10 seconds
        if (prev === 11) {
          // Start pulse animation
          pulseScale.value = withRepeat(
            withSequence(
              withTiming(1.05, { duration: 500 }),
              withTiming(1, { duration: 500 })
            ),
            -1,
            false
          );
          pulseOpacity.value = withTiming(0.3, { duration: 300 });
        }
        
        // Haptic at each second under 5
        if (prev <= 5) {
          haptic("light");
        }
        
        return prev - 1;
      });
    }, 1000);

    // Animate progress ring
    progress.value = withTiming(1, {
      duration: duration * 1000,
      easing: Easing.linear,
    });

    return () => {
      clearInterval(interval);
      cancelAnimation(progress);
      cancelAnimation(pulseScale);
    };
  }, [isRunning, duration]);

  const handleSkip = () => {
    haptic("medium");
    cancelAnimation(progress);
    setIsRunning(false);
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: 1.2 }],
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isUrgent = timeLeft <= 10;

  return (
    <View style={styles.container}>
      <Animated.View style={containerStyle}>
        {/* Pulse layer */}
        <Animated.View style={[styles.pulseLayer, { backgroundColor: colors.primary }, pulseStyle]} />

        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isUrgent ? colors.intensity : colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedCircleProps}
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>

        {/* Center content */}
        <View style={styles.centerContent}>
          <Text
            allowFontScaling={false}
            style={[
              styles.timeText, 
              { color: colors.text },
              isUrgent && { color: colors.intensity }
            ]}
          >
            {formatTime(timeLeft)}
          </Text>
          <Text allowFontScaling={false} style={[styles.label, { color: colors.muted }]}>
            {timeLeft === 0 ? "Let's go!" : "Rest"}
          </Text>
        </View>
      </Animated.View>

      {/* Skip button */}
      <Pressable style={[styles.skipButton, { backgroundColor: colors.card }]} onPress={handleSkip}>
        <Text allowFontScaling={false} style={[styles.skipText, { color: colors.muted }]}>
          Skip Rest
        </Text>
        <Ionicons name="play-forward" size={16} color={colors.muted} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 24,
  },
  pulseLayer: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  centerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontSize: 40,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "400",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default RestTimer;
