/**
 * WeekView
 * Day ovals showing workout completion for the week
 */

import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { darkColors, theme } from "@/src/theme";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

type DayData = {
  date: number;
  completed: boolean;
  isToday: boolean;
};

type WeekViewProps = {
  days: DayData[];
  onDayPress?: (index: number) => void;
};

const DayOval: React.FC<DayData & { 
  label: string; 
  onPress?: () => void;
}> = ({
  date,
  completed,
  isToday,
  label,
  onPress,
}) => {
  // Pulse animation for completed days
  const pulseStyle = useAnimatedStyle(() => {
    if (!completed) return {};
    
    return {
      opacity: withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      ),
    };
  });

  return (
    <Pressable onPress={onPress} style={styles.dayContainer}>
      <Text allowFontScaling={false} style={styles.dayLabel}>
        {label}
      </Text>
      <View style={[
        styles.dayOval,
        completed && styles.dayOvalCompleted,
        isToday && styles.dayOvalToday,
      ]}>
        {completed && (
          <Animated.View style={[styles.dayPulse, pulseStyle]} />
        )}
        <Text
          allowFontScaling={false}
          style={[
            styles.dayDate,
            completed && styles.dayDateCompleted,
            isToday && styles.dayDateToday,
          ]}
        >
          {date}
        </Text>
      </View>
      {completed && (
        <View style={styles.completedDot} />
      )}
    </Pressable>
  );
};

export const WeekView: React.FC<WeekViewProps> = ({ days, onDayPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.weekRow}>
        {days.map((day, index) => (
          <DayOval
            key={index}
            {...day}
            label={DAYS[index]}
            onPress={onDayPress ? () => onDayPress(index) : undefined}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayContainer: {
    alignItems: "center",
    gap: 6,
  },
  dayLabel: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: theme.fonts.bodyMedium,
  },
  dayOval: {
    width: 36,
    height: 44,
    borderRadius: 18,
    backgroundColor: darkColors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  dayOvalCompleted: {
    backgroundColor: darkColors.primary,
  },
  dayOvalToday: {
    borderWidth: 2,
    borderColor: darkColors.primary,
    backgroundColor: darkColors.selectedBg,
  },
  dayPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: darkColors.primary,
  },
  dayDate: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: theme.fonts.bodySemiBold,
  },
  dayDateCompleted: {
    color: "#000",
  },
  dayDateToday: {
    color: darkColors.primary,
  },
  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: darkColors.primary,
  },
});

export default WeekView;
