/**
 * CalWeekRow
 * Cal AI style week row - simple MTWTFS with small circles
 * Goes at the top of the dashboard
 */

import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";

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
  const { colors } = useTheme();

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
                { color: colors.textMuted },
                isToday && { color: colors.text },
                isCompleted && { color: colors.primary },
              ]}
            >
              {DAYS[index]}
            </Text>
            <View
              style={[
                styles.dayCircle,
                { backgroundColor: colors.border },
                isToday && !isCompleted && { 
                  borderWidth: 2, 
                  borderColor: colors.primary, 
                  backgroundColor: "transparent" 
                },
                isCompleted && { backgroundColor: colors.primary },
                isPlanned && { 
                  backgroundColor: "transparent", 
                  borderWidth: 1, 
                  borderColor: colors.textMuted,
                  borderStyle: "dashed" as const,
                },
              ]}
            >
              {isCompleted && (
                <Ionicons name="checkmark" size={12} color={colors.textOnPrimary} />
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
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CalWeekRow;
