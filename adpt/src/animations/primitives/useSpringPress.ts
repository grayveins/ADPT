/**
 * useSpringPress
 * Provides spring-based press animation for interactive elements
 */

import { useCallback } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { SPRING_CONFIG, SCALE, OPACITY } from "../constants";
import { hapticPress } from "../feedback/haptics";

type UseSpringPressOptions = {
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  haptic?: boolean;
  scale?: number;
};

export const useSpringPress = (options: UseSpringPressOptions = {}) => {
  const {
    onPress,
    onPressIn,
    onPressOut,
    disabled = false,
    haptic = true,
    scale = SCALE.pressed,
  } = options;

  const pressed = useSharedValue(false);
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    "worklet";
    pressed.value = true;
    scaleValue.value = withSpring(scale, SPRING_CONFIG.snappy);
    opacityValue.value = withTiming(OPACITY.pressed, { duration: 100 });
    
    if (haptic) {
      runOnJS(hapticPress)();
    }
    
    if (onPressIn) {
      runOnJS(onPressIn)();
    }
  }, [scale, haptic, onPressIn]);

  const handlePressOut = useCallback(() => {
    "worklet";
    pressed.value = false;
    scaleValue.value = withSpring(1, SPRING_CONFIG.snappy);
    opacityValue.value = withTiming(1, { duration: 100 });
    
    if (onPressOut) {
      runOnJS(onPressOut)();
    }
  }, [onPressOut]);

  const handlePress = useCallback(() => {
    if (!disabled && onPress) {
      onPress();
    }
  }, [disabled, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: disabled ? OPACITY.disabled : opacityValue.value,
  }));

  return {
    animatedStyle,
    pressHandlers: {
      onPressIn: handlePressIn,
      onPressOut: handlePressOut,
      onPress: handlePress,
    },
    pressed,
  };
};
