/**
 * useCountUp
 * Animated number counting for stats and progress
 */

import { useEffect, useCallback } from "react";
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { TIMING } from "../constants";

type UseCountUpOptions = {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
  autoPlay?: boolean;
};

export const useCountUp = (options: UseCountUpOptions) => {
  const {
    from = 0,
    to,
    duration = TIMING.slow,
    decimals = 0,
    autoPlay = true,
  } = options;

  const value = useSharedValue(from);

  const displayValue = useDerivedValue(() => {
    return value.value.toFixed(decimals);
  });

  const animate = useCallback((newTo?: number) => {
    value.value = withTiming(newTo ?? to, {
      duration,
      easing: Easing.out(Easing.ease),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, duration]);

  const reset = useCallback(() => {
    value.value = from;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from]);

  useEffect(() => {
    if (autoPlay) {
      animate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, to]);

  return {
    value,
    displayValue,
    animate,
    reset,
  };
};

/**
 * useRollingNumber
 * Slot machine style number roll animation
 */
export const useRollingNumber = (options: {
  value: number;
  duration?: number;
}) => {
  const { value: targetValue, duration = TIMING.normal } = options;
  
  const currentValue = useSharedValue(targetValue);
  const offset = useSharedValue(0);

  useEffect(() => {
    // Animate offset for rolling effect
    offset.value = withTiming(0, { duration });
    currentValue.value = targetValue;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue]);

  return {
    currentValue,
    offset,
  };
};
