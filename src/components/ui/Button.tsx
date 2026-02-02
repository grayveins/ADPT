/**
 * Button Component
 * Primary, secondary, and ghost variants with proper touch targets and animations
 */

import React, { useCallback } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
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

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "small" | "medium" | "large";

interface ButtonProps {
  /** Button text */
  children: string;
  
  /** Press handler */
  onPress?: () => void;
  
  /** Visual variant */
  variant?: ButtonVariant;
  
  /** Size preset */
  size?: ButtonSize;
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Icon component to show before text */
  icon?: React.ReactNode;
  
  /** Icon component to show after text */
  iconRight?: React.ReactNode;
  
  /** Enable haptic feedback */
  haptic?: boolean;
  
  /** Additional style */
  style?: StyleProp<ViewStyle>;
  
  /** Text style override */
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconRight,
  haptic = true,
  style,
  textStyle,
}: ButtonProps) {
  const { colors, components, radius, typography, animation } = useTheme();
  const scale = useSharedValue(1);
  
  const isDisabled = disabled || loading;
  
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(animation.pressScale, animation.spring.snappy);
  }, [scale, animation]);
  
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, animation.spring.snappy);
  }, [scale, animation]);
  
  const handlePress = useCallback(() => {
    if (isDisabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [isDisabled, haptic, onPress]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  // Size configurations
  const sizes = {
    small: {
      height: components.button.heightSmall,
      paddingHorizontal: 16,
      fontSize: typography.sizes.subhead,
    },
    medium: {
      height: components.button.height,
      paddingHorizontal: components.button.paddingHorizontal,
      fontSize: typography.sizes.body,
    },
    large: {
      height: components.button.heightLarge,
      paddingHorizontal: 32,
      fontSize: typography.sizes.body,
    },
  };
  
  const sizeConfig = sizes[size];
  
  // Variant styles
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    if (isDisabled) {
      return {
        container: {
          backgroundColor: colors.disabled,
          borderWidth: 0,
        },
        text: {
          color: colors.disabledText,
        },
      };
    }
    
    switch (variant) {
      case "primary":
        return {
          container: {
            backgroundColor: colors.primary,
            borderWidth: 0,
          },
          text: {
            color: colors.textOnPrimary,
          },
        };
      case "secondary":
        return {
          container: {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: {
            color: colors.text,
          },
        };
      case "ghost":
        return {
          container: {
            backgroundColor: "transparent",
            borderWidth: 0,
          },
          text: {
            color: colors.primary,
          },
        };
      case "danger":
        return {
          container: {
            backgroundColor: colors.error,
            borderWidth: 0,
          },
          text: {
            color: "#FFFFFF",
          },
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  const containerStyles: ViewStyle[] = [
    styles.container,
    {
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      borderRadius: radius.md,
    },
    variantStyles.container,
    fullWidth ? styles.fullWidth : {},
    style as ViewStyle,
  ].filter(Boolean);
  
  const textStyles: TextStyle[] = [
    styles.text,
    {
      fontSize: sizeConfig.fontSize,
      fontWeight: typography.weights.semibold,
    },
    variantStyles.text,
    textStyle as TextStyle,
  ];
  
  const loaderColor = variant === "primary" || variant === "danger" 
    ? colors.textOnPrimary 
    : colors.primary;
  
  return (
    <AnimatedPressable
      style={[containerStyles, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={loaderColor} />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{children}</Text>
          {iconRight}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    textAlign: "center",
  },
});
