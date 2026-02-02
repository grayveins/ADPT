import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import type { AppColors } from "@/constants/Colors";
import { useAppTheme } from "@/hooks/useAppTheme";

type InputProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, style, ...props }: InputProps) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const styles = useMemo(
    () => createStyles(colors, radius, spacing, typography),
    [colors, radius, spacing, typography]
  );
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accent}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const createStyles = (
  colors: AppColors,
  radius: typeof import("@/constants/Colors").radius,
  spacing: typeof import("@/constants/Colors").spacing,
  typography: typeof import("@/constants/Colors").typography
) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: spacing.md,
    },
    label: {
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      fontSize: 13,
      fontFamily: typography.family,
      fontWeight: typography.weight.medium,
    },
    input: {
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      fontFamily: typography.family,
      fontWeight: typography.weight.medium,
      fontSize: 16,
    },
    inputFocused: {
      borderColor: colors.accent,
    },
    hint: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: spacing.xs,
      fontFamily: typography.family,
      fontWeight: typography.weight.regular,
    },
    error: {
      color: colors.error,
      fontSize: 12,
      marginTop: spacing.xs,
      fontFamily: typography.family,
      fontWeight: typography.weight.medium,
    },
  });
