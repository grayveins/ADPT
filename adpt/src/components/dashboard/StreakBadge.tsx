/**
 * StreakBadge
 * Streak counter with flickering flame icon
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { darkColors, theme } from "@/src/theme";
import { FlickeringIcon } from "@/src/animations/components";

type StreakBadgeProps = {
  count: number;
};

export const StreakBadge: React.FC<StreakBadgeProps> = ({ count }) => {
  return (
    <View style={styles.container}>
      <FlickeringIcon
        name="flame"
        size={20}
        color="#FF6B35"
        enabled={count > 0}
      />
      <Text allowFontScaling={false} style={styles.count}>
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
    backgroundColor: darkColors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  count: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
  },
});

export default StreakBadge;
