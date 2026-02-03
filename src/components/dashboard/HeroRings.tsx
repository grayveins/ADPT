/**
 * HeroRings
 * Dual progress rings for compliance and intensity
 */

import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { AnimatedProgressRing } from "@/src/animations/components";

type HeroRingsProps = {
  compliance: number; // 0 to 1
  intensity: number;  // 0 to 1
};

export const HeroRings: React.FC<HeroRingsProps> = ({
  compliance,
  intensity,
}) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.ringContainer}>
        <AnimatedProgressRing
          progress={compliance}
          size={130}
          strokeWidth={12}
          color={colors.primary}
          showPercentage={true}
          breathe={true}
          glow={compliance > 0.9}
        />
        <Text allowFontScaling={false} style={[styles.ringLabel, { color: colors.textMuted }]}>
          Compliance
        </Text>
      </View>

      <View style={styles.ringContainer}>
        <AnimatedProgressRing
          progress={intensity}
          size={130}
          strokeWidth={12}
          color={colors.intensity}
          backgroundColor={colors.border}
          showPercentage={true}
          breathe={true}
          glow={intensity > 0.9}
        />
        <Text allowFontScaling={false} style={[styles.ringLabel, { color: colors.textMuted }]}>
          Intensity
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
  },
  ringContainer: {
    alignItems: "center",
    gap: 8,
  },
  ringLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
});

export default HeroRings;
