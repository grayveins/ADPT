/**
 * HeroRings
 * Dual progress rings for compliance and intensity
 */

import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { darkColors, theme } from "@/src/theme";
import { AnimatedProgressRing } from "@/src/animations/components";

type HeroRingsProps = {
  compliance: number; // 0 to 1
  intensity: number;  // 0 to 1
};

export const HeroRings: React.FC<HeroRingsProps> = ({
  compliance,
  intensity,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.ringContainer}>
        <AnimatedProgressRing
          progress={compliance}
          size={130}
          strokeWidth={12}
          color={darkColors.primary}
          showPercentage={true}
          breathe={true}
          glow={compliance > 0.9}
        />
        <Text allowFontScaling={false} style={styles.ringLabel}>
          Compliance
        </Text>
      </View>

      <View style={styles.ringContainer}>
        <AnimatedProgressRing
          progress={intensity}
          size={130}
          strokeWidth={12}
          color="#FF6B35"
          backgroundColor={darkColors.border}
          showPercentage={true}
          breathe={true}
          glow={intensity > 0.9}
        />
        <Text allowFontScaling={false} style={styles.ringLabel}>
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
    paddingVertical: 16,
  },
  ringContainer: {
    alignItems: "center",
    gap: 8,
  },
  ringLabel: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: theme.fonts.bodyMedium,
  },
});

export default HeroRings;
