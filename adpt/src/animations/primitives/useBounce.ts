/**
 * useBounce
 * Provides bounce-in animation for elements entering the screen
 */

import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SPRING_CONFIG, SCALE, TIMING } from "../constants";

type UseBounceOptions = {
  delay?: number;
  initialScale?: number;
  targetScale?: number;
  overshoot?: number;
  autoPlay?: boolean;
};

export const useBounce = (options: UseBounceOptions = {}) => {
  const {
    delay = 0,
    initialScale = 0,
    targetScale = 1,
    overshoot = SCALE.bounce,
    autoPlay = true,
  } = options;

  const scale = useSharedValue(initialScale);
  const opacity = useSharedValue(0);

  const bounce = () => {
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(overshoot, SPRING_CONFIG.bouncy),
        withSpring(targetScale, SPRING_CONFIG.snappy)
      )
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: TIMING.fast }));
  };

  const reset = () => {
    scale.value = initialScale;
    opacity.value = 0;
  };

  useEffect(() => {
    if (autoPlay) {
      bounce();
    }
  }, [autoPlay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    bounce,
    reset,
    scale,
    opacity,
  };
};

/**
 * useStaggeredBounce
 * For multiple elements that bounce in sequence
 */
export const useStaggeredBounce = (
  index: number,
  options: Omit<UseBounceOptions, "delay"> & { staggerDelay?: number } = {}
) => {
  const { staggerDelay = TIMING.staggerDelay, ...rest } = options;
  return useBounce({ ...rest, delay: index * staggerDelay });
};
