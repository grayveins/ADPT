/**
 * AnimatedButton
 * Button with spring press animation, haptic feedback, and optional glow
 */

import React, { useMemo } from "react";
import { StyleSheet, Text, ViewStyle, TextStyle, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";
import { SPRING_CONFIG, SCALE, OPACITY } from "../constants";
import { hapticPress } from "../feedback/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type AnimatedButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  glow?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
};

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "large",
  disabled = false,
  loading = false,
  glow = false,
  style,
  textStyle,
  haptic = true,
}) => {
  const { colors, radius } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const dynamicStyles = useMemo(() => ({
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    glow: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    primaryText: {
      color: colors.textOnPrimary,
    },
    secondaryText: {
      color: colors.text,
    },
    ghostText: {
      color: colors.muted,
    },
  }), [colors]);

  const handlePressIn = () => {
    "worklet";
    scale.value = withSpring(SCALE.pressed, SPRING_CONFIG.snappy);
    opacity.value = withTiming(OPACITY.pressed, { duration: 100 });
    if (haptic) {
      runOnJS(hapticPress)();
    }
  };

  const handlePressOut = () => {
    "worklet";
    scale.value = withSpring(1, SPRING_CONFIG.snappy);
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? OPACITY.disabled : opacity.value,
  }));

  const buttonStyles = [
    styles.base,
    { borderRadius: radius.pill },
    styles[size],
    dynamicStyles[variant],
    glow && dynamicStyles.glow,
    animatedStyle,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${size}Text`],
    dynamicStyles[`${variant}Text`],
    textStyle,
  ];

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={buttonStyles}
      disabled={disabled || loading}
    >
      <Text allowFontScaling={false} style={textStyles}>
        {loading ? "..." : title}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Sizes
  small: {
    height: 40,
    paddingHorizontal: 16,
  },
  medium: {
    height: 48,
    paddingHorizontal: 24,
  },
  large: {
    height: 56,
    paddingHorizontal: 32,
    width: "100%",
  },
  
  // Text sizes
  text: {
    fontWeight: "600",
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});

export default AnimatedButton;
