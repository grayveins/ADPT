import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing } from "@/src/theme";

export default function MealsScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
        Nutrition
      </Text>

      <View style={[styles.macroCard, { backgroundColor: colors.bgSecondary }]}>
        <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
          No targets set
        </Text>
        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
          Your coach hasn't set nutrition targets yet
        </Text>
      </View>

      <View style={styles.section}>
        <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
          Meal Plan
        </Text>
        <View style={[styles.macroCard, { backgroundColor: colors.bgSecondary }]}>
          <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
            No meal plan uploaded
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: spacing.base,
    marginBottom: spacing.xl,
  },
  macroCard: {
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: "center",
    gap: spacing.xs,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 15,
  },
});
