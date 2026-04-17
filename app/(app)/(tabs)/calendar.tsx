import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing } from "@/src/theme";

export default function CalendarScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
        Calendar
      </Text>
      <View style={[styles.emptyCard, { backgroundColor: colors.bgSecondary }]}>
        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
          No sessions scheduled
        </Text>
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
  emptyCard: {
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
  },
});
