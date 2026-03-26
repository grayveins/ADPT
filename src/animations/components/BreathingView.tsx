/**
 * BreathingView
 * Container with subtle breathing animation
 */

import React, { ReactNode, useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { SCALE, TIMING } from "../constants";

type BreathingViewProps = {
  children: ReactNode;
  style?: ViewStyle;
  enabled?: boolean;
  minScale?: number;
  maxScale?: number;
  duration?: number;
};

export const BreathingView: React.FC<BreathingViewProps> = ({
  children,
  style,
  enabled = true,
  minScale = SCALE.breatheMin,
  maxScale = SCALE.breatheMax,
  duration = TIMING.breatheDuration,
}) => {
  const scale = useSharedValue(minScale);

  useEffect(() => {
    if (enabled) {
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
        -1,
        false
      );
    } else {
      cancelAnimation(scale);
      scale.value = minScale;
    }

    return () => {
      cancelAnimation(scale);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, minScale, maxScale, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default BreathingView;
