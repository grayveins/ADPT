/**
 * CountUpText
 * Animated number that counts up with optional formatting
 */

import React, { useEffect, useState } from "react";
import { StyleSheet, TextStyle, Text } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
  useAnimatedReaction,
} from "react-native-reanimated";
import { darkColors, theme } from "@/src/theme";
import { TIMING } from "../constants";

type CountUpTextProps = {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: TextStyle;
  animated?: boolean;
};

export const CountUpText: React.FC<CountUpTextProps> = ({
  value,
  duration = TIMING.slow,
  decimals = 0,
  prefix = "",
  suffix = "",
  style,
  animated = true,
}) => {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);
  const animatedValue = useSharedValue(animated ? 0 : value);

  // Update display value when animated value changes
  useAnimatedReaction(
    () => animatedValue.value,
    (current) => {
      runOnJS(setDisplayValue)(current);
    }
  );

  useEffect(() => {
    if (animated) {
      animatedValue.value = withTiming(value, {
        duration,
        easing: Easing.out(Easing.ease),
      });
    } else {
      animatedValue.value = value;
      setDisplayValue(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, animated, duration]);

  return (
    <Text
      allowFontScaling={false}
      style={[styles.text, style]}
    >
      {`${prefix}${displayValue.toFixed(decimals)}${suffix}`}
    </Text>
  );
};

/**
 * AnimatedNumber
 * Simpler version that just animates the number display
 */
export const AnimatedNumber: React.FC<{
  value: number;
  style?: TextStyle;
}> = ({ value, style }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    // Bounce when value changes
    scale.value = withTiming(1.1, { duration: 100 }, () => {
      scale.value = withTiming(1, { duration: 150 });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const animatedStyle = {
    transform: [{ scale: scale.value }],
  };

  return (
    <Animated.Text
      allowFontScaling={false}
      style={[styles.text, style, animatedStyle]}
    >
      {value}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  text: {
    color: darkColors.text,
    fontSize: 24,
    fontFamily: theme.fonts.bodySemiBold,
  },
});

export default CountUpText;
