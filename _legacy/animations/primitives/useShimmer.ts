/**
 * useShimmer
 * Shimmer effect for loading states and edge highlights
 */

import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  interpolate,
} from "react-native-reanimated";
import { TIMING } from "../constants";

type UseShimmerOptions = {
  duration?: number;
  autoPlay?: boolean;
};

export const useShimmer = (options: UseShimmerOptions = {}) => {
  const { duration = TIMING.shimmerDuration, autoPlay = true } = options;

  const progress = useSharedValue(0);

  const start = () => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.linear,
      }),
      -1, // Infinite
      false
    );
  };

  const stop = () => {
    cancelAnimation(progress);
    progress.value = 0;
  };

  useEffect(() => {
    if (autoPlay) {
      start();
    }
    return () => stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  // Returns translateX percentage for shimmer gradient
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-100, 100]),
      },
    ],
  }));

  return {
    animatedStyle,
    progress,
    start,
    stop,
  };
};

/**
 * useEdgeShimmer
 * Subtle shimmer along card edges
 */
export const useEdgeShimmer = (options: {
  duration?: number;
  autoPlay?: boolean;
} = {}) => {
  const { duration = 8000, autoPlay = true } = options;

  const progress = useSharedValue(0);

  const start = () => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  };

  const stop = () => {
    cancelAnimation(progress);
    progress.value = 0;
  };

  useEffect(() => {
    if (autoPlay) {
      start();
    }
    return () => stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  // Returns rotation or position for border shimmer
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.25, 0.5, 0.75, 1],
      [0.3, 0.6, 0.3, 0.6, 0.3]
    ),
  }));

  return {
    animatedStyle,
    progress,
    start,
    stop,
  };
};
