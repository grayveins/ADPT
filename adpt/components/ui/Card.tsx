import { useMemo } from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import type { AppColors } from "@/constants/Colors";
import { useAppTheme } from "@/hooks/useAppTheme";

export function Card({ style, ...props }: ViewProps) {
  const { colors, radius, shadows, spacing } = useAppTheme();
  const styles = useMemo(
    () => createStyles(colors, radius, shadows, spacing),
    [colors, radius, shadows, spacing]
  );
  return <View style={[styles.card, style]} {...props} />;
}

const createStyles = (
  colors: AppColors,
  radius: typeof import("@/constants/Colors").radius,
  shadows: typeof import("@/constants/Colors").shadows,
  spacing: typeof import("@/constants/Colors").spacing
) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
  });
