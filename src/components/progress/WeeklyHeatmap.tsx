/**
 * WeeklyHeatmap
 * 
 * GitHub-style contribution heatmap showing workout frequency over weeks.
 * More visual impact than simple dots.
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { format, subWeeks, startOfWeek, addDays, isSameDay } from "date-fns";

import { useTheme } from "@/src/context/ThemeContext";

type WeeklyHeatmapProps = {
  workoutDates: Date[];
  weeks?: number;
};

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export const WeeklyHeatmap: React.FC<WeeklyHeatmapProps> = ({ 
  workoutDates, 
  weeks = 12 
}) => {
  const { colors } = useTheme();

  // Generate grid data for last N weeks
  const gridData = useMemo(() => {
    const today = new Date();
    const data: { date: Date; hasWorkout: boolean; isToday: boolean }[][] = [];

    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = startOfWeek(subWeeks(today, w), { weekStartsOn: 1 });
      const week: { date: Date; hasWorkout: boolean; isToday: boolean }[] = [];

      for (let d = 0; d < 7; d++) {
        const date = addDays(weekStart, d);
        const hasWorkout = workoutDates.some((wd) => isSameDay(wd, date));
        const isToday = isSameDay(date, today);
        week.push({ date, hasWorkout, isToday });
      }

      data.push(week);
    }

    return data;
  }, [workoutDates, weeks]);

  // Calculate total workouts
  const totalWorkouts = workoutDates.length;
  const avgPerWeek = weeks > 0 ? (totalWorkouts / weeks).toFixed(1) : 0;

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text allowFontScaling={false} style={[styles.statValue, { color: colors.text }]}>
            {totalWorkouts}
          </Text>
          <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textMuted }]}>
            workouts
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text allowFontScaling={false} style={[styles.statValue, { color: colors.text }]}>
            {avgPerWeek}
          </Text>
          <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textMuted }]}>
            avg/week
          </Text>
        </View>
      </View>

      {/* Heatmap Grid */}
      <View style={styles.gridContainer}>
        {/* Day labels */}
        <View style={styles.dayLabels}>
          {DAYS.map((day, i) => (
            <Text 
              key={i} 
              allowFontScaling={false} 
              style={[styles.dayLabel, { color: colors.textMuted }]}
            >
              {i % 2 === 0 ? day : ""}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {gridData.map((week, wi) => (
            <View key={wi} style={styles.weekColumn}>
              {week.map((day, di) => (
                <View
                  key={di}
                  style={[
                    styles.cell,
                    { backgroundColor: colors.border },
                    day.hasWorkout && { backgroundColor: colors.primary },
                    day.isToday && styles.cellToday,
                    day.isToday && { borderColor: colors.text },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text allowFontScaling={false} style={[styles.legendText, { color: colors.textMuted }]}>
          Less
        </Text>
        <View style={[styles.legendCell, { backgroundColor: colors.border }]} />
        <View style={[styles.legendCell, { backgroundColor: colors.primaryMuted }]} />
        <View style={[styles.legendCell, { backgroundColor: colors.primary, opacity: 0.7 }]} />
        <View style={[styles.legendCell, { backgroundColor: colors.primary }]} />
        <Text allowFontScaling={false} style={[styles.legendText, { color: colors.textMuted }]}>
          More
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  gridContainer: {
    flexDirection: "row",
    gap: 4,
  },
  dayLabels: {
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  dayLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    width: 12,
    height: 12,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    gap: 3,
    flex: 1,
  },
  weekColumn: {
    gap: 3,
    flex: 1,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 3,
    maxHeight: 14,
  },
  cellToday: {
    borderWidth: 1,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});

export default WeeklyHeatmap;
