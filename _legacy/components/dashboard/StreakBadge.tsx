/**
 * StreakBadge
 * Streak counter with flickering flame icon
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { FlickeringIcon } from "@/src/animations/components";

type StreakBadgeProps = {
  count: number;
};

export const StreakBadge: React.FC<StreakBadgeProps> = ({ count }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <FlickeringIcon
        name="flame"
        size={20}
        color={colors.intensity}
        enabled={count > 0}
      />
      <Text allowFontScaling={false} style={[styles.count, { color: colors.text }]}>
        {count}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  count: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default StreakBadge;
