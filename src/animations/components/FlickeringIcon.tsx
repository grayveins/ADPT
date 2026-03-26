/**
 * FlickeringIcon
 * Icon with subtle flicker animation (for flame/fire icons)
 */

import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { TIMING } from "../constants";

type FlickeringIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  style?: ViewStyle;
  enabled?: boolean;
};

export const FlickeringIcon: React.FC<FlickeringIconProps> = ({
  name,
  size = 24,
  color = "#FF6B35",
  style,
  enabled = true,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (enabled) {
      // Random-ish flicker pattern
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: TIMING.flickerDuration }),
          withTiming(0.95, { duration: TIMING.flickerDuration }),
          withTiming(1.03, { duration: TIMING.flickerDuration }),
          withTiming(1, { duration: TIMING.flickerDuration })
        ),
        -1,
        false
      );

      opacity.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: TIMING.flickerDuration }),
          withTiming(1, { duration: TIMING.flickerDuration }),
          withTiming(0.9, { duration: TIMING.flickerDuration }),
          withTiming(1, { duration: TIMING.flickerDuration })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = 1;
      opacity.value = 1;
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
};

export default FlickeringIcon;
