import { ReactNode, useMemo } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { AppColors } from "@/constants/Colors";
import { useAppTheme } from "@/hooks/useAppTheme";

type ScreenProps = {
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  scroll?: boolean;
  ambient?: boolean;
};

export function Screen({ children, style, contentStyle, scroll, ambient }: ScreenProps) {
  const { colors, radius, spacing } = useAppTheme();
  const styles = useMemo(
    () => createStyles(colors, radius, spacing),
    [colors, radius, spacing]
  );
  return (
    <SafeAreaView style={[styles.safe, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (
  colors: AppColors,
  radius: typeof import("@/constants/Colors").radius,
  spacing: typeof import("@/constants/Colors").spacing
) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
  });
