/**
 * RotatingTagline
 * Auto-rotating motivational text with crossfade and subtle translateY.
 * Cycles through an array of lines on a fixed interval.
 */

import React, { useEffect, useCallback, useRef } from "react";
import { StyleSheet, View, type TextStyle, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type RotatingTaglineProps = {
  lines: string[];
  interval?: number; // ms, default 3000
  style?: ViewStyle;
  textStyle?: TextStyle;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const RotatingTagline: React.FC<RotatingTaglineProps> = ({
  lines,
  interval = 3000,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const indexRef = useRef(0);
  const [currentText, setCurrentText] = React.useState(lines[0] ?? "");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advanceText = useCallback(() => {
    indexRef.current = (indexRef.current + 1) % lines.length;
    setCurrentText(lines[indexRef.current]);
  }, [lines]);

  const cycle = useCallback(() => {
    // Fade out current text (200ms) with upward drift
    opacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) });
    translateY.value = withTiming(-5, { duration: 200, easing: Easing.in(Easing.ease) });

    // After fade-out, swap text on JS thread, then fade in from below
    const swapDelay = 220; // slightly after fade-out completes
    setTimeout(() => {
      runOnJS(advanceText)();
      // Reset position below, then animate in
      translateY.value = 5;
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    }, swapDelay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanceText]);

  useEffect(() => {
    if (lines.length <= 1) return;

    timerRef.current = setInterval(cycle, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cycle, interval, lines.length]);

  // Reset when lines change
  useEffect(() => {
    indexRef.current = 0;
    if (lines.length > 0) {
      setCurrentText(lines[0]);
      opacity.value = 1;
      translateY.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={[styles.container, style]}>
      <Animated.Text
        style={[
          styles.text,
          { color: colors.textSecondary },
          textStyle,
          animatedStyle,
        ]}
        numberOfLines={2}
      >
        {currentText}
      </Animated.Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    height: 48, // fixed height prevents layout shift
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default RotatingTagline;
