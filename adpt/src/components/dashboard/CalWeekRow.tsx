/**
 * CalWeekRow
 * Cal AI style week row - simple MTWTFS with small circles
 * Goes at the top of the dashboard
 */

import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

type DayData = {
  completed: boolean;
  isToday: boolean;
  isPlanned?: boolean;
};

type CalWeekRowProps = {
  days: DayData[];
  onDayPress?: (index: number) => void;
};

export const CalWeekRow: React.FC<CalWeekRowProps> = ({ days, onDayPress }) => {
  return (
    <View style={styles.container}>
      {days.map((day, index) => {
        const isToday = day.isToday;
        const isCompleted = day.completed;
        const isPlanned = day.isPlanned && !isCompleted;

        return (
          <Pressable
            key={index}
            onPress={onDayPress ? () => onDayPress(index) : undefined}
            style={styles.dayColumn}
          >
            <Text
              allowFontScaling={false}
              style={[
                styles.dayLabel,
                isToday && styles.dayLabelToday,
                isCompleted && styles.dayLabelCompleted,
              ]}
            >
              {DAYS[index]}
            </Text>
            <View
              style={[
                styles.dayCircle,
                isToday && !isCompleted && styles.dayCircleToday,
                isCompleted && styles.dayCircleCompleted,
                isPlanned && styles.dayCirclePlanned,
              ]}
            >
              {isCompleted && (
                <Ionicons name="checkmark" size={12} color="#000" />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  dayColumn: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  dayLabel: {
    color: darkColors.muted2,
    fontSize: 12,
    fontFamily: theme.fonts.bodyMedium,
    textTransform: "uppercase",
  },
  dayLabelToday: {
    color: darkColors.text,
  },
  dayLabelCompleted: {
    color: darkColors.primary,
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: darkColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: darkColors.primary,
    backgroundColor: "transparent",
  },
  dayCircleCompleted: {
    backgroundColor: darkColors.primary,
  },
  dayCirclePlanned: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: darkColors.muted2,
    borderStyle: "dashed",
  },
});

export default CalWeekRow;
