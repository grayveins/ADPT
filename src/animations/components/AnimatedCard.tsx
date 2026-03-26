/**
 * AnimatedCard
 * Card with spring press animation and optional shimmer edge
 */

import React, { ReactNode } from "react";
import { StyleSheet, ViewStyle, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { darkColors, theme } from "@/src/theme";
import { SPRING_CONFIG, SCALE, OPACITY } from "../constants";
import { hapticPress } from "../feedback/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type AnimatedCardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  shimmer?: boolean;
  glow?: boolean;
  haptic?: boolean;
  highlighted?: boolean;
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  onPress,
  style,
  disabled = false,
  shimmer = false,
  glow = false,
  haptic = true,
  highlighted = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const shimmerProgress = useSharedValue(0);

  // Start shimmer animation
  React.useEffect(() => {
    if (shimmer) {
      shimmerProgress.value = withRepeat(
        withTiming(1, {
          duration: 8000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shimmer]);

  const handlePressIn = () => {
    "worklet";
    if (onPress) {
      scale.value = withSpring(SCALE.pressed, SPRING_CONFIG.snappy);
      opacity.value = withTiming(OPACITY.pressed, { duration: 100 });
      if (haptic) {
        runOnJS(hapticPress)();
      }
    }
  };

  const handlePressOut = () => {
    "worklet";
    scale.value = withSpring(1, SPRING_CONFIG.snappy);
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? OPACITY.disabled : opacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-200, 200]
    );
    return {
      transform: [{ translateX }],
    };
  });

  const cardStyles = [
    styles.card,
    highlighted && styles.highlighted,
    glow && styles.glow,
    animatedStyle,
    style,
  ];

  const content = (
    <>
      {children}
      {shimmer && (
        <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
          <LinearGradient
            colors={[
              "transparent",
              "rgba(0, 199, 190, 0.1)",
              "transparent",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      )}
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={cardStyles}
        disabled={disabled}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={cardStyles}>
      {content}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkColors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
    padding: 16,
    overflow: "hidden",
  },
  highlighted: {
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  glow: {
    shadowColor: darkColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shimmerGradient: {
    width: 100,
    height: "100%",
  },
});

export default AnimatedCard;
