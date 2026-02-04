/**
 * Analytics Overview Screen
 * 
 * Detailed analytics for power users:
 * - Strength progress with sparklines
 * - Weekly volume chart
 * - Recovery status by muscle group
 * - Muscle balance distribution
 * 
 * Accessible via "View Detailed Analytics" from Progress tab.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { differenceInDays } from "date-fns";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useStrengthHistory, type TimeRange } from "@/src/hooks/useStrengthHistory";
import { useVolumeHistory } from "@/src/hooks/useVolumeHistory";
import { useWeeklySummary } from "@/src/hooks/useWeeklySummary";
import { VolumeChart } from "@/src/components/progress";
import { layout, spacing, radius } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Key lifts to track
const KEY_LIFTS = ["Bench Press", "Squat", "Deadlift", "Overhead Press"];

// Muscle group colors for the balance chart
const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#00C9B7",
  Back: "#33D4C5",
  Shoulders: "#00A89A",
  Arms: "#7FA07F",
  Legs: "#6B8E6B",
  Core: "#60A5FA",
};

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "All", value: "ALL" },
];

// Mini sparkline component
const MiniSparkline: React.FC<{ data: number[]; color: string; width: number }> = ({
  data,
  color,
  width,
}) => {
  if (data.length < 2) return null;

  const height = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  return (
    <View style={{ width, height }}>
      <Animated.View
        style={{
          width,
          height,
          borderBottomWidth: 1,
          borderBottomColor: color,
        }}
      >
        {/* Simple line representation using View borders */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: ((data[data.length - 1] - min) / range) * height,
            backgroundColor: `${color}20`,
          }}
        />
      </Animated.View>
    </View>
  );
};

// Lift summary card component
const LiftSummaryCard: React.FC<{
  exerciseName: string;
  userId: string | null;
  timeRange: TimeRange;
  colors: ReturnType<typeof useTheme>["colors"];
}> = ({ exerciseName, userId, timeRange, colors }) => {
  const { data, currentPR, progressPercent, loading } = useStrengthHistory(
    userId,
    exerciseName,
    timeRange
  );

  const sparklineData = useMemo(() => {
    return data.slice(-8).map((d) => d.weight);
  }, [data]);

  const isPositive = progressPercent >= 0;

  const handlePress = () => {
    hapticPress();
    router.push(`/progress/${encodeURIComponent(exerciseName)}`);
  };

  if (loading) {
    return (
      <View style={[styles.liftCard, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!currentPR) {
    return (
      <Pressable
        onPress={handlePress}
        style={[styles.liftCard, { backgroundColor: colors.card }]}
      >
        <Text
          allowFontScaling={false}
          style={[styles.liftName, { color: colors.text }]}
        >
          {exerciseName}
        </Text>
        <Text
          allowFontScaling={false}
          style={[styles.noDataText, { color: colors.textMuted }]}
        >
          No data
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.liftCard,
        { backgroundColor: colors.card },
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={styles.liftHeader}>
        <Text
          allowFontScaling={false}
          style={[styles.liftName, { color: colors.text }]}
          numberOfLines={1}
        >
          {exerciseName}
        </Text>
        <View style={styles.liftStats}>
          <Text
            allowFontScaling={false}
            style={[styles.liftWeight, { color: colors.text }]}
          >
            {currentPR.weight}
          </Text>
          <Text
            allowFontScaling={false}
            style={[styles.liftUnit, { color: colors.textMuted }]}
          >
            lbs
          </Text>
        </View>
      </View>

      <View style={styles.liftBottom}>
        <MiniSparkline
          data={sparklineData}
          color={colors.primary}
          width={SCREEN_WIDTH * 0.35}
        />
        
        {progressPercent !== 0 && (
          <View style={styles.trendBadge}>
            <Ionicons
              name={isPositive ? "trending-up" : "trending-down"}
              size={14}
              color={isPositive ? colors.success : colors.error}
            />
            <Text
              allowFontScaling={false}
              style={[
                styles.trendText,
                { color: isPositive ? colors.success : colors.error },
              ]}
            >
              {isPositive ? "+" : ""}{progressPercent.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("3M");
  const [refreshing, setRefreshing] = useState(false);

  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Volume history
  const {
    data: volumeData,
    loading: volumeLoading,
    thisWeekVolume,
    averageVolume,
    trend,
    trendPercent,
    refresh: refreshVolume,
  } = useVolumeHistory(userId, timeRange);

  // Weekly Summary (for recovery status and muscle balance)
  const { 
    data: weeklySummary, 
    loading: summaryLoading, 
    refresh: refreshSummary 
  } = useWeeklySummary(userId);

  // Format volume data for chart
  const volumeChartData = useMemo(() => {
    return volumeData.map((d) => ({
      week: d.week,
      volume: d.volume,
    }));
  }, [volumeData]);

  // Calculate recovery status for each muscle group
  const recoveryStatus = useMemo(() => {
    if (!weeklySummary?.muscleLastTrained) return { ready: [], moderate: [], rest: [] };
    
    const now = new Date();
    const ready: string[] = [];
    const moderate: string[] = [];
    const rest: string[] = [];
    
    Object.entries(weeklySummary.muscleLastTrained).forEach(([muscle, lastDate]) => {
      if (!lastDate) {
        ready.push(muscle);
        return;
      }
      
      const daysSince = differenceInDays(now, lastDate);
      const weeklyVolume = weeklySummary.muscleWeeklyVolume[muscle] || 0;
      
      // High volume muscles need more recovery
      const isHighVolume = weeklyVolume > 10000;
      
      if (daysSince >= 3 || (!isHighVolume && daysSince >= 2)) {
        ready.push(muscle);
      } else if (daysSince >= 1) {
        moderate.push(muscle);
      } else {
        rest.push(muscle);
      }
    });
    
    return { ready, moderate, rest };
  }, [weeklySummary]);

  // Calculate muscle balance percentages
  const musclePercentages = useMemo(() => {
    if (!weeklySummary?.muscleWeeklyVolume) return [];
    
    const totalVolume = Object.values(weeklySummary.muscleWeeklyVolume).reduce((a, b) => a + b, 0);
    if (totalVolume === 0) return [];
    
    return Object.entries(weeklySummary.muscleWeeklyVolume)
      .map(([muscle, vol]) => ({
        muscle,
        percent: (vol / totalVolume) * 100,
        color: MUSCLE_COLORS[muscle] || colors.primary,
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [weeklySummary, colors.primary]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshVolume(), refreshSummary()]);
    setRefreshing(false);
  }, [refreshVolume, refreshSummary]);

  // Format large numbers
  const formatVolume = (vol: number): string => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(0)}k`;
    return vol.toLocaleString();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Hide the default header, we're using our own */}
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text }]}>
          Analytics
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Time Range Selector */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={styles.timeRangeContainer}
        >
          {TIME_RANGES.map((range) => (
            <Pressable
              key={range.value}
              onPress={() => {
                hapticPress();
                setTimeRange(range.value);
              }}
              style={[
                styles.timeRangePill,
                {
                  backgroundColor:
                    timeRange === range.value ? colors.primary : colors.card,
                },
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.timeRangeText,
                  {
                    color:
                      timeRange === range.value
                        ? colors.textOnPrimary
                        : colors.textSecondary,
                  },
                ]}
              >
                {range.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Strength Progress Section */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)}>
          <Text
            allowFontScaling={false}
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Strength Progress
          </Text>

          <View style={styles.liftsGrid}>
            {KEY_LIFTS.map((lift, index) => (
              <Animated.View
                key={lift}
                entering={FadeInDown.delay(100 + index * 30).duration(300)}
                style={styles.liftCardWrapper}
              >
                <LiftSummaryCard
                  exerciseName={lift}
                  userId={userId}
                  timeRange={timeRange}
                  colors={colors}
                />
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Weekly Volume Section */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(300)}
          style={[styles.volumeCard, { backgroundColor: colors.card }]}
        >
          <View style={styles.volumeHeader}>
            <Text
              allowFontScaling={false}
              style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}
            >
              Weekly Volume
            </Text>
            {!volumeLoading && thisWeekVolume > 0 && (
              <View style={styles.volumeStats}>
                <Text
                  allowFontScaling={false}
                  style={[styles.volumeValue, { color: colors.text }]}
                >
                  {formatVolume(thisWeekVolume)} lbs
                </Text>
                {trendPercent !== 0 && (
                  <View style={styles.volumeTrend}>
                    <Ionicons
                      name={trend === "up" ? "trending-up" : trend === "down" ? "trending-down" : "remove"}
                      size={14}
                      color={trend === "up" ? colors.success : trend === "down" ? colors.error : colors.textMuted}
                    />
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.volumeTrendText,
                        {
                          color:
                            trend === "up"
                              ? colors.success
                              : trend === "down"
                              ? colors.error
                              : colors.textMuted,
                        },
                      ]}
                    >
                      {trendPercent > 0 ? "+" : ""}{trendPercent.toFixed(0)}%
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {volumeLoading ? (
            <View style={styles.volumeLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : volumeChartData.length > 0 ? (
            <VolumeChart data={volumeChartData} />
          ) : (
            <View style={styles.volumeEmpty}>
              <Text
                allowFontScaling={false}
                style={[styles.volumeEmptyText, { color: colors.textMuted }]}
              >
                Complete workouts to see volume trends
              </Text>
            </View>
          )}

          {!volumeLoading && averageVolume > 0 && (
            <View style={[styles.volumeFooter, { borderTopColor: colors.border }]}>
              <Text
                allowFontScaling={false}
                style={[styles.volumeAvgLabel, { color: colors.textMuted }]}
              >
                Weekly Average
              </Text>
              <Text
                allowFontScaling={false}
                style={[styles.volumeAvgValue, { color: colors.textSecondary }]}
              >
                {formatVolume(averageVolume)} lbs
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Recovery Status Section */}
        {!summaryLoading && (recoveryStatus.ready.length > 0 || recoveryStatus.moderate.length > 0 || recoveryStatus.rest.length > 0) && (
          <Animated.View 
            entering={FadeInDown.delay(250).duration(300)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>
              Recovery Status
            </Text>
            <Text allowFontScaling={false} style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              Based on recent training volume and frequency
            </Text>
            <View style={styles.recoveryList}>
              {recoveryStatus.ready.length > 0 && (
                <View style={styles.recoveryRow}>
                  <View style={[styles.recoveryBadge, { backgroundColor: colors.success + "20" }]}>
                    <Text allowFontScaling={false} style={[styles.recoveryLabel, { color: colors.success }]}>
                      Ready
                    </Text>
                  </View>
                  <Text allowFontScaling={false} style={[styles.recoveryMuscles, { color: colors.text }]}>
                    {recoveryStatus.ready.join(", ")}
                  </Text>
                </View>
              )}
              {recoveryStatus.moderate.length > 0 && (
                <View style={styles.recoveryRow}>
                  <View style={[styles.recoveryBadge, { backgroundColor: colors.gold + "20" }]}>
                    <Text allowFontScaling={false} style={[styles.recoveryLabel, { color: colors.gold }]}>
                      Moderate
                    </Text>
                  </View>
                  <Text allowFontScaling={false} style={[styles.recoveryMuscles, { color: colors.text }]}>
                    {recoveryStatus.moderate.join(", ")}
                  </Text>
                </View>
              )}
              {recoveryStatus.rest.length > 0 && (
                <View style={styles.recoveryRow}>
                  <View style={[styles.recoveryBadge, { backgroundColor: colors.intensity + "20" }]}>
                    <Text allowFontScaling={false} style={[styles.recoveryLabel, { color: colors.intensity }]}>
                      Rest
                    </Text>
                  </View>
                  <Text allowFontScaling={false} style={[styles.recoveryMuscles, { color: colors.text }]}>
                    {recoveryStatus.rest.join(", ")}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Muscle Balance Section */}
        {!summaryLoading && musclePercentages.length > 0 && (
          <Animated.View 
            entering={FadeInDown.delay(300).duration(300)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>
              Muscle Balance
            </Text>
            <Text allowFontScaling={false} style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              Volume distribution this week
            </Text>
            
            <View style={styles.muscleList}>
              {musclePercentages.slice(0, 6).map((item) => (
                <View key={item.muscle} style={styles.muscleRow}>
                  <View style={styles.muscleLabel}>
                    <View style={[styles.muscleDot, { backgroundColor: item.color }]} />
                    <Text allowFontScaling={false} style={[styles.muscleName, { color: colors.text }]}>
                      {item.muscle}
                    </Text>
                  </View>
                  <View style={styles.muscleBarContainer}>
                    <View style={[styles.muscleBarBg, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.muscleBarFill, 
                          { 
                            width: `${item.percent}%`, 
                            backgroundColor: item.color 
                          }
                        ]} 
                      />
                    </View>
                    <Text allowFontScaling={false} style={[styles.musclePercent, { color: colors.textMuted }]}>
                      {item.percent.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
  },

  // Time Range
  timeRangeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  timeRangePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  timeRangeText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  // Section
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.md,
  },

  // Lifts Grid
  liftsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  liftCardWrapper: {
    width: (SCREEN_WIDTH - layout.screenPaddingHorizontal * 2 - spacing.sm) / 2,
  },
  liftCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 90,
  },
  liftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  liftName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  liftStats: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  liftWeight: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  liftUnit: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  liftBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trendText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  noDataText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // Volume
  volumeCard: {
    borderRadius: radius.xl,
    padding: spacing.base,
  },
  volumeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  volumeStats: {
    alignItems: "flex-end",
  },
  volumeValue: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  volumeTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  volumeTrendText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  volumeLoading: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  volumeEmpty: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  volumeEmptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  volumeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  volumeAvgLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  volumeAvgValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  // Card (generic)
  card: {
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: spacing.base,
  },

  // Recovery Status
  recoveryList: {
    gap: spacing.md,
  },
  recoveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  recoveryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 72,
  },
  recoveryLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  recoveryMuscles: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  // Muscle Balance
  muscleList: {
    gap: spacing.md,
  },
  muscleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  muscleLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    width: 90,
  },
  muscleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  muscleName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  muscleBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  muscleBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  muscleBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  musclePercent: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 32,
    textAlign: "right",
  },
});
