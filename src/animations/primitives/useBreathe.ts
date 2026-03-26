/**
 * useBreathe
 * Provides continuous breathing animation for "alive" elements
 */

import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { SCALE, TIMING } from "../constants";

type UseBreatheOptions = {
  minScale?: number;
  maxScale?: number;
  duration?: number;
  autoPlay?: boolean;
};

export const useBreathe = (options: UseBreatheOptions = {}) => {
  const {
    minScale = SCALE.breatheMin,
    maxScale = SCALE.breatheMax,
    duration = TIMING.breatheDuration,
    autoPlay = true,
  } = options;

  const scale = useSharedValue(minScale);

  const start = () => {
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(minScale, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1, // Infinite repeat
      false // Don't reverse
    );
  };

  const stop = () => {
    cancelAnimation(scale);
    scale.value = minScale;
  };

  useEffect(() => {
    if (autoPlay) {
      start();
    }
    return () => stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
    start,
    stop,
    scale,
  };
};

/**
 * usePulseGlow
 * Pulsing glow effect for attention states
 */
export const usePulseGlow = (options: { 
  duration?: number; 
  minOpacity?: number;
  maxOpacity?: number;
  autoPlay?: boolean;
} = {}) => {
  const {
    duration = TIMING.pulseDuration,
    minOpacity = 0.3,
    maxOpacity = 0.8,
    autoPlay = true,
  } = options;

  const opacity = useSharedValue(minOpacity);

  const start = () => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(maxOpacity, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(minOpacity, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  };

  const stop = () => {
    cancelAnimation(opacity);
    opacity.value = minOpacity;
  };

  useEffect(() => {
    if (autoPlay) {
      start();
    }
    return () => stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    start,
    stop,
    opacity,
  };
};

/**
 * useFlicker
 * Subtle flicker animation for flame icons
 */
export const useFlicker = (options: { autoPlay?: boolean } = {}) => {
  const { autoPlay = true } = options;
  
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const start = () => {
    // Random-ish flicker using repeated sequences
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: TIMING.flickerDuration }),
        withTiming(0.98, { duration: TIMING.flickerDuration }),
        withTiming(1.02, { duration: TIMING.flickerDuration }),
        withTiming(1, { duration: TIMING.flickerDuration })
      ),
      -1,
      false
    );
    
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: TIMING.flickerDuration }),
        withTiming(1, { duration: TIMING.flickerDuration }),
        withTiming(0.95, { duration: TIMING.flickerDuration }),
        withTiming(1, { duration: TIMING.flickerDuration })
      ),
      -1,
      false
    );
  };

  const stop = () => {
    cancelAnimation(scale);
    cancelAnimation(opacity);
    scale.value = 1;
    opacity.value = 1;
  };

  useEffect(() => {
    if (autoPlay) {
      start();
    }
    return () => stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    start,
    stop,
  };
};
