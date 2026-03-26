/**
 * useFadeSlide
 * Provides fade + slide animations for content entrance
 */

import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { SPRING_CONFIG, TIMING } from "../constants";

type Direction = "up" | "down" | "left" | "right";

type UseFadeSlideOptions = {
  direction?: Direction;
  distance?: number;
  delay?: number;
  duration?: number;
  useSpring?: boolean;
  autoPlay?: boolean;
};

const getTransform = (direction: Direction, distance: number) => {
  switch (direction) {
    case "up":
      return { translateY: distance };
    case "down":
      return { translateY: -distance };
    case "left":
      return { translateX: distance };
    case "right":
      return { translateX: -distance };
  }
};

export const useFadeSlide = (options: UseFadeSlideOptions = {}) => {
  const {
    direction = "up",
    distance = 20,
    delay = 0,
    duration = TIMING.normal,
    useSpring: shouldUseSpring = false,
    autoPlay = true,
  } = options;

  const opacity = useSharedValue(0);
  const translateX = useSharedValue(direction === "left" ? distance : direction === "right" ? -distance : 0);
  const translateY = useSharedValue(direction === "up" ? distance : direction === "down" ? -distance : 0);

  const animate = () => {
    const animation = shouldUseSpring
      ? withSpring(0, SPRING_CONFIG.gentle)
      : withTiming(0, { duration, easing: Easing.out(Easing.ease) });

    opacity.value = withDelay(delay, withTiming(1, { duration }));
    translateX.value = withDelay(delay, animation);
    translateY.value = withDelay(delay, animation);
  };

  const reset = () => {
    opacity.value = 0;
    const initial = getTransform(direction, distance);
    translateX.value = initial.translateX ?? 0;
    translateY.value = initial.translateY ?? 0;
  };

  useEffect(() => {
    if (autoPlay) {
      animate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return {
    animatedStyle,
    animate,
    reset,
    opacity,
  };
};

/**
 * useStaggeredFadeSlide
 * For multiple elements that fade in sequence
 */
export const useStaggeredFadeSlide = (
  index: number,
  options: Omit<UseFadeSlideOptions, "delay"> & { staggerDelay?: number } = {}
) => {
  const { staggerDelay = TIMING.staggerDelay, ...rest } = options;
  return useFadeSlide({ ...rest, delay: index * staggerDelay });
};
