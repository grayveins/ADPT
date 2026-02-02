import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, ViewStyle } from "react-native";

import type { AppColors } from "@/constants/Colors";
import { useAppTheme } from "@/hooks/useAppTheme";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
  textStyle,
}: ButtonProps) {
  const { colors, opacity, radius, shadows, spacing, typography } = useAppTheme();
  const styles = useMemo(
    () => createStyles(colors, opacity, radius, shadows, spacing, typography),
    [colors, opacity, radius, shadows, spacing, typography]
  );
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.buttonText : colors.accent} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "primary" && styles.primaryText,
            variant !== "primary" && styles.secondaryText,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const createStyles = (
  colors: AppColors,
  opacity: typeof import("@/constants/Colors").opacity,
  radius: typeof import("@/constants/Colors").radius,
  shadows: typeof import("@/constants/Colors").shadows,
  spacing: typeof import("@/constants/Colors").spacing,
  typography: typeof import("@/constants/Colors").typography
) =>
  StyleSheet.create({
    base: {
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      alignSelf: "stretch",
    },
    primary: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      ...shadows.subtle,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
    pressed: {
      opacity: opacity.pressed,
    },
    disabled: {
      opacity: opacity.disabled,
    },
    text: {
      fontSize: 16,
      fontFamily: typography.family,
      fontWeight: typography.weight.semibold,
    },
    primaryText: {
      color: colors.buttonText,
    },
    secondaryText: {
      color: colors.textPrimary,
    },
  });
