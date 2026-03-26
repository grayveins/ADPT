/**
 * IconButton Component
 * Icon-only button with 44pt minimum touch target
 */

import React, { useCallback } from "react";
import {
  Pressable,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type IconName = keyof typeof Ionicons.glyphMap;

interface IconButtonProps {
  /** Ionicons icon name */
  icon: IconName;
  
  /** Press handler */
  onPress?: () => void;
  
  /** Icon size (default: 24) */
  size?: number;
  
  /** Icon color (default: colors.text) */
  color?: string;
  
  /** Background variant */
  variant?: "transparent" | "subtle" | "filled";
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Enable haptic feedback */
  haptic?: boolean;
  
  /** Additional style */
  style?: StyleProp<ViewStyle>;
  
  /** Accessibility label */
  accessibilityLabel?: string;
}

export function IconButton({
  icon,
  onPress,
  size = 24,
  color,
  variant = "transparent",
  disabled = false,
  haptic = true,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const { colors, components, radius, animation } = useTheme();
  const scale = useSharedValue(1);
  
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, animation.spring.snappy);
  }, [scale, animation]);
  
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, animation.spring.snappy);
  }, [scale, animation]);
  
  const handlePress = useCallback(() => {
    if (disabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [disabled, haptic, onPress]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const getBackgroundColor = () => {
    if (disabled) return "transparent";
    switch (variant) {
      case "subtle":
        return colors.pressed;
      case "filled":
        return colors.primary;
      default:
        return "transparent";
    }
  };
  
  const getIconColor = () => {
    if (disabled) return colors.disabledText;
    if (color) return color;
    if (variant === "filled") return colors.textOnPrimary;
    return colors.text;
  };
  
  const containerStyle: ViewStyle = {
    width: components.touchTarget.minimum,
    height: components.touchTarget.minimum,
    borderRadius: radius.pill,
    backgroundColor: getBackgroundColor(),
    alignItems: "center",
    justifyContent: "center",
  };
  
  return (
    <AnimatedPressable
      style={[containerStyle, animatedStyle, style]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Ionicons
        name={icon}
        size={size}
        color={getIconColor()}
      />
    </AnimatedPressable>
  );
}
