/**
 * MuscleBalance
 * 
 * Horizontal bar chart showing volume distribution across muscle groups.
 * Helps users see if they're neglecting certain muscle groups.
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";

export type MuscleVolumeData = {
  muscle: string;
  volume: number;      // Total volume (weight * reps)
  sets: number;        // Number of sets
  sessions: number;    // Number of sessions that hit this muscle
};

type MuscleBalanceProps = {
  data: MuscleVolumeData[];
  timeframe?: string;   // e.g., "This Week", "Last 30 Days"
};

// Muscle group colors - distinctive but cohesive
const muscleColors: Record<string, string> = {
  Chest: "#000000",
  Back: "#1A1A1A",
  Shoulders: "#333333",
  Arms: "#4B5563",
  Legs: "#6B7280",
  Core: "#9CA3AF",
};

export const MuscleBalance: React.FC<MuscleBalanceProps> = ({ 
  data, 
  timeframe = "This Week" 
}) => {
  const { colors } = useTheme();

  // Sort by volume and calculate percentages
  const sortedData = useMemo(() => {
    const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);
    if (totalVolume === 0) return [];
    
    return [...data]
      .sort((a, b) => b.volume - a.volume)
      .map((d) => ({
        ...d,
        percent: (d.volume / totalVolume) * 100,
        color: muscleColors[d.muscle] || colors.primary,
      }));
  }, [data, colors]);

  // Format volume for display
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toString();
  };

  if (sortedData.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.bgSecondary }]}>
        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
          Complete workouts to see muscle balance
        </Text>
      </View>
    );
  }

  // Find max percentage for scaling bars
  const maxPercent = Math.max(...sortedData.map((d) => d.percent));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text allowFontScaling={false} style={[styles.timeframe, { color: colors.textMuted }]}>
          {timeframe}
        </Text>
      </View>

      <View style={styles.chartContainer}>
        {sortedData.map((item, index) => (
          <Animated.View
            key={item.muscle}
            entering={FadeInRight.delay(index * 50).duration(300)}
            style={styles.barRow}
          >
            <View style={styles.labelContainer}>
              <Text
                allowFontScaling={false}
                style={[styles.muscleLabel, { color: colors.text }]}
              >
                {item.muscle}
              </Text>
            </View>
            
            <View style={styles.barContainer}>
              <View style={[styles.barBackground, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(item.percent / maxPercent) * 100}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
            
            <View style={styles.statsContainer}>
              <Text
                allowFontScaling={false}
                style={[styles.volumeText, { color: colors.text }]}
              >
                {formatVolume(item.volume)}
              </Text>
              <Text
                allowFontScaling={false}
                style={[styles.percentText, { color: colors.textMuted }]}
              >
                {item.percent.toFixed(0)}%
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Legend showing sets/sessions */}
      <View style={[styles.legend, { borderTopColor: colors.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text allowFontScaling={false} style={[styles.legendText, { color: colors.textMuted }]}>
            Total sets: {data.reduce((sum, d) => sum + d.sets, 0)}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text allowFontScaling={false} style={[styles.legendText, { color: colors.textMuted }]}>
            Sessions: {Math.max(...data.map((d) => d.sessions))}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeframe: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chartContainer: {
    gap: 12,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  labelContainer: {
    width: 75,
  },
  muscleLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  barContainer: {
    flex: 1,
  },
  barBackground: {
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 10,
    minWidth: 4,
  },
  statsContainer: {
    width: 55,
    alignItems: "flex-end",
  },
  volumeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  percentText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});

export default MuscleBalance;
