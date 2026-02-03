/**
 * AnimatedCheckbox
 * Checkbox with circle → checkmark morph animation
 */

import React, { useEffect } from "react";
import { StyleSheet, Pressable, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { useTheme } from "@/src/context/ThemeContext";
import { SPRING_CONFIG, TIMING } from "../constants";
import { hapticSuccess } from "../feedback/haptics";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type AnimatedCheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  size?: number;
  disabled?: boolean;
  onComplete?: () => void;
};

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onToggle,
  size = 28,
  disabled = false,
  onComplete,
}) => {
  const { colors } = useTheme();
  const progress = useSharedValue(checked ? 1 : 0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (checked) {
      // Animate to checked state
      progress.value = withTiming(1, { duration: TIMING.fast });
      scale.value = withSequence(
        withSpring(1.15, SPRING_CONFIG.bouncy),
        withSpring(1, SPRING_CONFIG.snappy)
      );
      // Glow effect
      glowOpacity.value = withSequence(
        withTiming(0.6, { duration: TIMING.fast }),
        withTiming(0, { duration: TIMING.normal })
      );
    } else {
      progress.value = withTiming(0, { duration: TIMING.fast });
      scale.value = 1;
    }
  }, [checked]);

  const handlePress = () => {
    if (disabled) return;
    
    if (!checked) {
      // About to check - trigger haptic
      hapticSuccess();
      if (onComplete) {
        setTimeout(onComplete, TIMING.fast);
      }
    }
    
    onToggle();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1.5 }],
  }));

  // Checkmark path animation
  const checkmarkProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(progress.value, [0, 1], [24, 0]);
    return {
      strokeDashoffset,
      opacity: progress.value,
    };
  });

  // Circle fill animation
  const circleProps = useAnimatedProps(() => {
    const fillOpacity = interpolate(progress.value, [0, 1], [0, 1]);
    return {
      fillOpacity,
    };
  });

  const borderColor = checked ? colors.primary : colors.border;
  const backgroundColor = checked ? colors.primary : "transparent";

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Glow layer */}
        <Animated.View
          style={[
            styles.glow,
            { width: size * 1.5, height: size * 1.5, backgroundColor: colors.primary },
            glowStyle,
          ]}
        />
        
        {/* Main checkbox */}
        <View
          style={[
            styles.checkbox,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor,
              backgroundColor,
            },
          ]}
        >
          <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
            <AnimatedPath
              d="M4 12L10 18L20 6"
              stroke={colors.textOnPrimary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={24}
              animatedProps={checkmarkProps}
            />
          </Svg>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    borderRadius: 100,
  },
});

export default AnimatedCheckbox;
