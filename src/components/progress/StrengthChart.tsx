/**
 * StrengthChart
 * Line chart showing strength progress over time for key lifts
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "@/src/context/ThemeContext";

const screenWidth = Dimensions.get("window").width;

type StrengthDataPoint = {
  date: string;
  weight: number;
};

type StrengthChartProps = {
  exerciseName: string;
  data: StrengthDataPoint[];
};

export const StrengthChart: React.FC<StrengthChartProps> = ({
  exerciseName,
  data,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Format data for chart-kit
  const chartData = useMemo(() => {
    // Take last 8 data points
    const recentData = data.slice(-8);
    
    if (recentData.length === 0) {
      return null;
    }

    return {
      labels: recentData.map((d) => {
        // Format date as M/D
        const date = new Date(d.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: recentData.map((d) => d.weight),
          color: () => colors.primary,
          strokeWidth: 2,
        },
      ],
    };
  }, [data, colors.primary]);

  // Handle empty data
  if (!chartData || data.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>{exerciseName}</Text>
        <Text style={styles.emptyText}>
          Log more workouts to see progress
        </Text>
      </View>
    );
  }

  // Calculate progress
  const firstWeight = data[0]?.weight || 0;
  const lastWeight = data[data.length - 1]?.weight || 0;
  const progress = lastWeight - firstWeight;
  const progressPercent = firstWeight > 0 
    ? ((progress / firstWeight) * 100).toFixed(1) 
    : "0";

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary,
    labelColor: () => colors.textMuted,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.primary,
      fill: colors.card,
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          <Text style={styles.currentWeight}>{lastWeight} lbs</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={[
            styles.progressText,
            { color: progress >= 0 ? colors.success : colors.error }
          ]}>
            {progress >= 0 ? "+" : ""}{progress} lbs ({progressPercent}%)
          </Text>
        </View>
      </View>
      <LineChart
        data={chartData}
        width={screenWidth - 72}
        height={160}
        chartConfig={chartConfig}
        style={styles.chart}
        bezier
        withInnerLines={true}
        withOuterLines={false}
        yAxisSuffix=" lbs"
        yAxisInterval={1}
      />
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    exerciseName: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    currentWeight: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
      marginTop: 2,
    },
    progressBadge: {
      backgroundColor: colors.cardAlt,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    progressText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
    },
    chart: {
      borderRadius: 12,
      marginLeft: -16,
    },
    emptyContainer: {
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      padding: 20,
      alignItems: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.text,
      marginBottom: 4,
    },
    emptyText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
    },
  });

export default StrengthChart;
