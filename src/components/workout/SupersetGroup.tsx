/**
 * SupersetGroup
 * Visual wrapper that connects grouped exercises with a teal bracket.
 * Shows "Superset" or "Triset" label.
 */

import React, { type ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

type Props = {
  exerciseCount: number;
  children: ReactNode;
};

export function SupersetGroup({ exerciseCount, children }: Props) {
  const { colors } = useTheme();
  const label = exerciseCount >= 3 ? "Triset" : "Superset";

  return (
    <View style={styles.container}>
      {/* Teal bracket bar on the left */}
      <View style={styles.bracketContainer}>
        <View style={[styles.bracket, { backgroundColor: colors.primary }]} />
      </View>

      <View style={styles.content}>
        {/* Label */}
        <View style={[styles.labelContainer, { backgroundColor: colors.primary + "15" }]}>
          <Text allowFontScaling={false} style={[styles.label, { color: colors.primary }]}>
            {label}
          </Text>
        </View>

        {/* Grouped exercises */}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 12,
  },
  bracketContainer: {
    width: 12,
    paddingVertical: 4,
    alignItems: "center",
  },
  bracket: {
    width: 3,
    flex: 1,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  labelContainer: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    marginLeft: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
