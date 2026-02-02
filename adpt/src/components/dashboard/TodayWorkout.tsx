/**
 * TodayWorkout
 * Primary CTA card with shimmer edge effect
 */

import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { AnimatedCard } from "@/src/animations/components";

type TodayWorkoutProps = {
  name: string;
  muscles: string;
  exercises: number;
  duration: string;
  onPress: () => void;
};

export const TodayWorkout: React.FC<TodayWorkoutProps> = ({
  name,
  muscles,
  exercises,
  duration,
  onPress,
}) => {
  return (
    <AnimatedCard
      onPress={onPress}
      shimmer={true}
      glow={true}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="barbell" size={24} color={darkColors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text allowFontScaling={false} style={styles.label}>
            Today&apos;s Workout
          </Text>
          <Text allowFontScaling={false} style={styles.name}>
            {name}
          </Text>
        </View>
        <View style={styles.startButton}>
          <Text allowFontScaling={false} style={styles.startText}>
            START
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#000" />
        </View>
      </View>

      <View style={styles.meta}>
        <Text allowFontScaling={false} style={styles.metaText}>
          {muscles}
        </Text>
        <View style={styles.metaDot} />
        <Text allowFontScaling={false} style={styles.metaText}>
          {exercises} exercises
        </Text>
        <View style={styles.metaDot} />
        <Text allowFontScaling={false} style={styles.metaText}>
          ~{duration}
        </Text>
      </View>
    </AnimatedCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderColor: darkColors.primary,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  label: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: theme.fonts.body,
  },
  name: {
    color: darkColors.text,
    fontSize: 20,
    fontFamily: theme.fonts.bodySemiBold,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: darkColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startText: {
    color: "#000",
    fontSize: 14,
    fontFamily: theme.fonts.bodySemiBold,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: theme.fonts.body,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: darkColors.muted2,
  },
});

export default TodayWorkout;
