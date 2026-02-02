import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import type { AppColors } from "@/constants/Colors";
import { useAppTheme } from "@/hooks/useAppTheme";

type ChipProps = {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Chip({ label, onPress, style }: ChipProps) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const styles = createStyles(colors, radius, spacing, typography);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && styles.pressed, style]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (
  colors: AppColors,
  radius: typeof import("@/constants/Colors").radius,
  spacing: typeof import("@/constants/Colors").spacing,
  typography: typeof import("@/constants/Colors").typography
) =>
  StyleSheet.create({
    base: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    pressed: {
      opacity: 0.8,
    },
    text: {
      color: colors.textSecondary,
      fontFamily: typography.family,
      fontWeight: typography.weight.medium,
      fontSize: 12,
      letterSpacing: 0.4,
    },
  });
