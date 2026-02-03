/**
 * VolumeChart
 * Bar chart showing weekly workout volume over time
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { useTheme } from "@/src/context/ThemeContext";

const screenWidth = Dimensions.get("window").width;

type VolumeChartProps = {
  data: { week: string; volume: number }[];
};

export const VolumeChart: React.FC<VolumeChartProps> = ({ data }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Format data for chart-kit
  const chartData = useMemo(() => {
    // Take last 6 weeks
    const recentData = data.slice(-6);
    
    return {
      labels: recentData.map((d) => d.week),
      datasets: [
        {
          data: recentData.map((d) => d.volume / 1000), // Convert to thousands
        },
      ],
    };
  }, [data]);

  // Handle empty data
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Complete workouts to see your volume progress
        </Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => colors.primary,
    labelColor: () => colors.textMuted,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.6,
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Volume</Text>
        <Text style={styles.unit}>thousands of lbs</Text>
      </View>
      <BarChart
        data={chartData}
        width={screenWidth - 72}
        height={180}
        chartConfig={chartConfig}
        style={styles.chart}
        showValuesOnTopOfBars
        fromZero
        withInnerLines={true}
        yAxisSuffix="k"
        yAxisLabel=""
      />
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      marginTop: 8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 12,
    },
    title: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.text,
    },
    unit: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
    },
    chart: {
      borderRadius: 12,
      marginLeft: -16,
    },
    emptyContainer: {
      height: 120,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
      textAlign: "center",
    },
  });

export default VolumeChart;
