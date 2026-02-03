/**
 * Card Component
 * Consistent card styling with shadows
 */

import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps {
  children: React.ReactNode;
  
  /** Make the card pressable */
  onPress?: () => void;
  
  /** Custom padding */
  padding?: number;
  
  /** No padding */
  noPadding?: boolean;
  
  /** Alternative card color */
  variant?: "default" | "alt" | "transparent";
  
  /** Enable shadow (default: true) */
  shadow?: boolean;
  
  /** Additional style */
  style?: StyleProp<ViewStyle>;
  
  /** Enable haptic on press */
  haptic?: boolean;
}

export function Card({
  children,
  onPress,
  padding,
  noPadding = false,
  variant = "default",
  shadow = true,
  style,
  haptic = true,
}: CardProps) {
  const { colors, radius, shadows, components, animation } = useTheme();
  const scale = useSharedValue(1);
  
  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, animation.spring.snappy);
    }
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, animation.spring.snappy);
  };
  
  const handlePress = () => {
    if (haptic && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const getBackgroundColor = () => {
    switch (variant) {
      case "alt":
        return colors.cardAlt;
      case "transparent":
        return "transparent";
      default:
        return colors.card;
    }
  };
  
  const cardStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: radius.lg,
    padding: noPadding ? 0 : (padding ?? components.card.padding),
    ...(shadow && variant !== "transparent" ? shadows.card : {}),
  };
  
  if (onPress) {
    return (
      <AnimatedPressable
        style={[cardStyle, animatedStyle, style]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </AnimatedPressable>
    );
  }
  
  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({});
