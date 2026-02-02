/**
 * ProgramSection
 * Collapsible program overview with workout list
 */

import React, { useState } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { SPRING_CONFIG } from "@/src/animations/constants";
import { hapticPress } from "@/src/animations/feedback/haptics";

type WorkoutItem = {
  name: string;
  exercises: number;
  duration: string;
  muscles: string;
  isNext?: boolean;
};

type ProgramSectionProps = {
  programName: string;
  currentWeek: number;
  totalWeeks: number;
  workouts: WorkoutItem[];
};

export const ProgramSection: React.FC<ProgramSectionProps> = ({
  programName,
  currentWeek,
  totalWeeks,
  workouts,
}) => {
  const [expanded, setExpanded] = useState(true);
  const rotation = useSharedValue(0);
  const contentHeight = useSharedValue(1);

  const toggleExpand = () => {
    hapticPress();
    setExpanded(!expanded);
    rotation.value = withSpring(expanded ? 180 : 0, SPRING_CONFIG.snappy);
    contentHeight.value = withTiming(expanded ? 0 : 1, { duration: 200 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentHeight.value,
    maxHeight: contentHeight.value === 0 ? 0 : 500,
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable onPress={toggleExpand} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text allowFontScaling={false} style={styles.programName}>
            {programName}
          </Text>
          <Text allowFontScaling={false} style={styles.weekInfo}>
            Week {currentWeek} of {totalWeeks}
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={24} color={darkColors.muted} />
        </Animated.View>
      </Pressable>

      {/* Workout List */}
      <Animated.View style={[styles.content, contentStyle]}>
        {workouts.map((workout, index) => (
          <View
            key={index}
            style={[
              styles.workoutItem,
              workout.isNext && styles.workoutItemNext,
            ]}
          >
            <View style={styles.workoutInfo}>
              <Text
                allowFontScaling={false}
                style={[
                  styles.workoutName,
                  workout.isNext && styles.workoutNameNext,
                ]}
              >
                {workout.name}
              </Text>
              <Text allowFontScaling={false} style={styles.workoutMeta}>
                {workout.exercises} exercises • {workout.duration} • {workout.muscles}
              </Text>
            </View>
            {workout.isNext && (
              <View style={styles.nextBadge}>
                <Text allowFontScaling={false} style={styles.nextBadgeText}>
                  NEXT
                </Text>
              </View>
            )}
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerLeft: {
    flex: 1,
  },
  programName: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
  },
  weekInfo: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: theme.fonts.body,
    marginTop: 2,
  },
  content: {
    overflow: "hidden",
  },
  workoutItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
  },
  workoutItemNext: {
    backgroundColor: darkColors.selectedBg,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    color: darkColors.text,
    fontSize: 15,
    fontFamily: theme.fonts.bodyMedium,
  },
  workoutNameNext: {
    color: darkColors.primary,
  },
  workoutMeta: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: theme.fonts.body,
    marginTop: 2,
  },
  nextBadge: {
    backgroundColor: darkColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  nextBadgeText: {
    color: "#000",
    fontSize: 10,
    fontFamily: theme.fonts.bodySemiBold,
  },
});

export default ProgramSection;
