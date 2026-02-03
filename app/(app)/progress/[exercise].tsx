/**
 * Per-Exercise Detail Screen
 * 
 * Shows detailed analytics for a specific exercise:
 * - Current PR with trend indicator
 * - Time range selector
 * - 1RM trend line chart
 * - Collapsible "Advanced" section with estimated 1RM
 * - Full PR history (scrollable)
 * - Best sets by estimated 1RM
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { format, parseISO } from "date-fns";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useStrengthHistory, type TimeRange } from "@/src/hooks/useStrengthHistory";
import { StrengthChart } from "@/src/components/progress";
import { layout, spacing, radius, shadows } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "All", value: "ALL" },
];

export default function ExerciseDetailScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ exercise: string }>();
  const exerciseName = decodeURIComponent(params.exercise || "");

  const [userId, setUserId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("3M");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Fetch strength history
  const {
    data,
    loading,
    currentPR,
    startingMax,
    progressAbsolute,
    progressPercent,
    prHistory,
    bestSets,
    refresh,
  } = useStrengthHistory(userId, exerciseName, timeRange);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Format chart data for StrengthChart component
  const chartData = useMemo(() => {
    return data.map((point) => ({
      date: point.date,
      weight: point.weight,
    }));
  }, [data]);

  // Get current estimated 1RM from best set
  const currentEstimated1RM = useMemo(() => {
    if (bestSets.length === 0) return null;
    return bestSets[0].estimated1RM;
  }, [bestSets]);

  const isPositiveProgress = progressAbsolute >= 0;

  if (!exerciseName) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>
          Exercise not found
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: exerciseName }} />
      
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
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
          {/* Hero - Current PR */}
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[styles.heroCard, { backgroundColor: colors.card }, shadows.card]}
          >
            <Text 
              allowFontScaling={false} 
              style={[styles.heroLabel, { color: colors.textMuted }]}
            >
              CURRENT PR
            </Text>
            
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : currentPR ? (
              <>
                <View style={styles.heroValueRow}>
                  <Text 
                    allowFontScaling={false} 
                    style={[styles.heroValue, { color: colors.text }]}
                  >
                    {currentPR.weight}
                  </Text>
                  <Text 
                    allowFontScaling={false} 
                    style={[styles.heroUnit, { color: colors.textMuted }]}
                  >
                    lbs
                  </Text>
                </View>
                
                {startingMax > 0 && (
                  <View style={styles.trendRow}>
                    <Ionicons
                      name={isPositiveProgress ? "trending-up" : "trending-down"}
                      size={18}
                      color={isPositiveProgress ? colors.success : colors.error}
                    />
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.trendText,
                        { color: isPositiveProgress ? colors.success : colors.error },
                      ]}
                    >
                      {isPositiveProgress ? "+" : ""}{progressAbsolute} lbs ({progressPercent.toFixed(1)}%)
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.trendSubtext, { color: colors.textMuted }]}
                    >
                      since first recorded
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text 
                allowFontScaling={false} 
                style={[styles.noDataText, { color: colors.textMuted }]}
              >
                No data yet. Complete workouts with this exercise to track progress.
              </Text>
            )}
          </Animated.View>

          {/* Time Range Selector */}
          <Animated.View
            entering={FadeInDown.delay(50).duration(300)}
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
                    backgroundColor: timeRange === range.value 
                      ? colors.primary 
                      : colors.card,
                  },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.timeRangeText,
                    { 
                      color: timeRange === range.value 
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

          {/* Strength Chart */}
          {!loading && data.length >= 2 && (
            <Animated.View
              entering={FadeInDown.delay(100).duration(300)}
              style={[styles.chartCard, { backgroundColor: colors.card }, shadows.card]}
            >
              <StrengthChart exerciseName={exerciseName} data={chartData} />
            </Animated.View>
          )}

          {/* Advanced Section (Collapsible) */}
          {!loading && currentEstimated1RM && (
            <Animated.View
              entering={FadeInDown.delay(150).duration(300)}
              style={[styles.advancedCard, { backgroundColor: colors.card }]}
            >
              <Pressable
                onPress={() => {
                  hapticPress();
                  setShowAdvanced(!showAdvanced);
                }}
                style={styles.advancedHeader}
              >
                <Text
                  allowFontScaling={false}
                  style={[styles.advancedTitle, { color: colors.text }]}
                >
                  Advanced
                </Text>
                <Ionicons
                  name={showAdvanced ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
              
              {showAdvanced && (
                <View style={styles.advancedContent}>
                  <View style={styles.advancedRow}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.advancedLabel, { color: colors.textMuted }]}
                    >
                      Estimated 1RM
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.advancedValue, { color: colors.text }]}
                    >
                      {currentEstimated1RM} lbs
                    </Text>
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={[styles.advancedNote, { color: colors.textMuted }]}
                  >
                    Calculated using Epley formula based on your best set ({bestSets[0]?.weight} x {bestSets[0]?.reps})
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* PR History */}
          {!loading && prHistory.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(300)}
              style={[styles.sectionCard, { backgroundColor: colors.card }]}
            >
              <Text
                allowFontScaling={false}
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                PR History
              </Text>
              
              {prHistory.map((pr, index) => (
                <View
                  key={`${pr.date}-${pr.weight}`}
                  style={[
                    styles.prRow,
                    index < prHistory.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.prRowLeft}>
                    <View style={[styles.trophyBadge, { backgroundColor: colors.gold }]}>
                      <Ionicons name="trophy" size={12} color={colors.bg} />
                    </View>
                    <Text
                      allowFontScaling={false}
                      style={[styles.prDate, { color: colors.textSecondary }]}
                    >
                      {format(parseISO(pr.date), "MMM d, yyyy")}
                    </Text>
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={[styles.prValue, { color: colors.text }]}
                  >
                    {pr.weight} x {pr.reps}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Best Sets by Estimated 1RM */}
          {!loading && bestSets.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(250).duration(300)}
              style={[styles.sectionCard, { backgroundColor: colors.card }]}
            >
              <Text
                allowFontScaling={false}
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                Best Sets
              </Text>
              <Text
                allowFontScaling={false}
                style={[styles.sectionSubtitle, { color: colors.textMuted }]}
              >
                Ranked by estimated 1RM
              </Text>
              
              {bestSets.map((set, index) => (
                <View
                  key={`${set.date}-${set.weight}-${set.reps}`}
                  style={[
                    styles.bestSetRow,
                    index < bestSets.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.bestSetLeft}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.bestSetRank, { color: colors.textMuted }]}
                    >
                      #{index + 1}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.bestSetWeight, { color: colors.text }]}
                    >
                      {set.weight} x {set.reps}
                    </Text>
                  </View>
                  <View style={styles.bestSetRight}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.bestSetE1RM, { color: colors.primary }]}
                    >
                      e1RM: {set.estimated1RM} lbs
                    </Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Empty State */}
          {!loading && data.length === 0 && (
            <Animated.View
              entering={FadeInDown.delay(100).duration(300)}
              style={[styles.emptyCard, { backgroundColor: colors.card }]}
            >
              <View style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="barbell-outline" size={32} color={colors.primary} />
              </View>
              <Text
                allowFontScaling={false}
                style={[styles.emptyTitle, { color: colors.text }]}
              >
                No Data Yet
              </Text>
              <Text
                allowFontScaling={false}
                style={[styles.emptyDesc, { color: colors.textMuted }]}
              >
                Complete workouts with {exerciseName} to see your strength progress over time.
              </Text>
            </Animated.View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 40,
  },

  // Hero
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.base,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  heroValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  heroValue: {
    fontSize: 56,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -2,
  },
  heroUnit: {
    fontSize: 20,
    fontFamily: "Inter_400Regular",
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  trendText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  trendSubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  noDataText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
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

  // Chart
  chartCard: {
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
  },

  // Advanced
  advancedCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.base,
    overflow: "hidden",
  },
  advancedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
  },
  advancedTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  advancedContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  advancedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  advancedLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  advancedValue: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  advancedNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },

  // Section Cards
  sectionCard: {
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: spacing.md,
  },

  // PR History
  prRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  prRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  trophyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  prDate: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  prValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },

  // Best Sets
  bestSetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  bestSetLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bestSetRank: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    width: 24,
  },
  bestSetWeight: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  bestSetRight: {
    alignItems: "flex-end",
  },
  bestSetE1RM: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  // Empty State
  emptyCard: {
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: "center",
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
