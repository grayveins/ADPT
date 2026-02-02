/**
 * useRipple
 * Ripple effect for selection confirmation
 */

import { useCallback } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { TIMING } from "../constants";
import { hapticSelect } from "../feedback/haptics";

type UseRippleOptions = {
  duration?: number;
  maxScale?: number;
  color?: string;
  haptic?: boolean;
};

export const useRipple = (options: UseRippleOptions = {}) => {
  const {
    duration = TIMING.normal,
    maxScale = 1.5,
    haptic = true,
  } = options;

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const trigger = useCallback(() => {
    "worklet";
    
    if (haptic) {
      runOnJS(hapticSelect)();
    }
    
    // Reset and animate
    scale.value = 0;
    opacity.value = 0.6;
    
    scale.value = withTiming(maxScale, {
      duration,
      easing: Easing.out(Easing.ease),
    });
    
    opacity.value = withSequence(
      withTiming(0.6, { duration: duration * 0.2 }),
      withTiming(0, { duration: duration * 0.8 })
    );
  }, [duration, maxScale, haptic]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    trigger,
    scale,
    opacity,
  };
};
