/**
 * Progress Screen - Simplified, Clean Design
 * 
 * Minimal view for beginners with:
 * - Streak hero
 * - Coach insights
 * - GitHub-style activity heatmap
 * - PR teaser (top 2 recently improved)
 * - Active modifications (conditional - only if has limitations)
 * - Link to detailed analytics for nerds
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { parseISO, subDays, subMonths } from "date-fns";

import { useTheme } from "@/src/context/ThemeContext";
import { layout, spacing, bodyRegions } from "@/src/theme";
import { supabase } from "@/lib/supabase";
import { useStreak } from "@/src/hooks/useStreak";
import { useWeeklySummary } from "@/src/hooks/useWeeklySummary";
import { useActiveLimitations } from "@/src/hooks/useActiveLimitations";
import { WeeklyHeatmap } from "@/src/components/progress";
import { hapticPress } from "@/src/animations/feedback/haptics";

// Key lifts to track for PR teaser
const KEY_LIFTS = ["Bench Press", "Squat", "Deadlift", "Overhead Press"];

type RecentPR = {
  name: string;
  weight: number;
  improvement: number | null; // null = no badge shown (no old data to compare)
};

export default function ProgressScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data
  const [workoutDates, setWorkoutDates] = useState<Date[]>([]);
  const [recentPRs, setRecentPRs] = useState<RecentPR[]>([]);
  
  // Streak
  const { currentStreak, longestStreak, loading: streakLoading, refreshStreak } = useStreak(userId);
  
  // Weekly Summary (for insights)
  const { data: weeklySummary, loading: summaryLoading, refresh: refreshSummary } = useWeeklySummary(userId);
  
  // Active Limitations (for pain/injury tracking)
  const { 
    limitations, 
    loading: limitationsLoading, 
    resolveLimitation,
    refresh: refreshLimitations 
  } = useActiveLimitations(userId);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      
      // Fetch all workout dates for heatmap (last 12 weeks)
      const twelveWeeksAgo = subDays(new Date(), 84);
      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("started_at")
        .eq("user_id", user.id)
        .gte("started_at", twelveWeeksAgo.toISOString());
      
      const dates = (sessions || []).map((s) => parseISO(s.started_at));
      setWorkoutDates(dates);
      
      // Fetch sets data for PR teaser (most recently improved)
      const { data: setsData } = await supabase
        .from("workout_sets")
        .select(`
          weight_lbs,
          reps,
          workout_exercises!inner(
            exercise_name,
            workout_sessions!inner(user_id, started_at)
          )
        `)
        .eq("workout_exercises.workout_sessions.user_id", user.id)
        .eq("is_warmup", false);
      
      // Calculate PRs and find most recently improved
      const thirtyDaysAgo = subMonths(new Date(), 1);
      const liftData = new Map<string, { 
        currentMax: number; 
        oldMax: number; 
        lastImprovedAt: Date | null;
      }>();
      
      // Initialize lift data
      KEY_LIFTS.forEach((lift) => {
        liftData.set(lift, { currentMax: 0, oldMax: 0, lastImprovedAt: null });
      });
      
      // First pass: find max weights for each lift (current and 30+ days ago)
      (setsData || []).forEach((set: any) => {
        const exerciseName = set.workout_exercises?.exercise_name;
        const sessionDate = set.workout_exercises?.workout_sessions?.started_at;
        const weight = set.weight_lbs || 0;
        
        if (!exerciseName || weight === 0 || !KEY_LIFTS.includes(exerciseName)) return;
        
        const data = liftData.get(exerciseName)!;
        const setDate = parseISO(sessionDate);
        
        // Track current max
        if (weight > data.currentMax) {
          data.currentMax = weight;
          data.lastImprovedAt = setDate;
        }
        
        // Track max from 30+ days ago for trend comparison
        if (setDate < thirtyDaysAgo && weight > data.oldMax) {
          data.oldMax = weight;
        }
      });
      
      // Build PRs list - show all PRs, with optional improvement badge
      const allPRs: RecentPR[] = [];
      
      liftData.forEach((data, name) => {
        if (data.currentMax > 0) {
          // Only show improvement if we have old data AND there's actual improvement
          const hasImprovement = data.oldMax > 0 && data.currentMax > data.oldMax;
          allPRs.push({
            name,
            weight: data.currentMax,
            improvement: hasImprovement ? data.currentMax - data.oldMax : null,
          });
        }
      });
      
      // Sort by highest weight and take top 2
      allPRs.sort((a, b) => b.weight - a.weight);
      setRecentPRs(allPRs.slice(0, 2));
      
      refreshStreak();
      refreshSummary();
      refreshLimitations();
      
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshStreak, refreshSummary, refreshLimitations]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate coach insights from data
  const coachInsights = useMemo(() => {
    const insights: string[] = [];
    
    if (weeklySummary) {
      // Volume trend insight
      if (weeklySummary.volumeTrend > 15) {
        insights.push(`Volume up ${weeklySummary.volumeTrend}% this week. Great progress - monitor recovery.`);
      } else if (weeklySummary.volumeTrend < -15) {
        insights.push(`Volume down ${Math.abs(weeklySummary.volumeTrend)}% this week. Consider if recovery was needed or time to push harder.`);
      }
      
      // Workout frequency insight
      if (weeklySummary.workoutsCompleted < weeklySummary.workoutsTarget && weeklySummary.workoutsTarget > 0) {
        const remaining = weeklySummary.workoutsTarget - weeklySummary.workoutsCompleted;
        insights.push(`${remaining} workout${remaining > 1 ? "s" : ""} remaining this week to hit your target.`);
      } else if (weeklySummary.workoutsCompleted >= weeklySummary.workoutsTarget && weeklySummary.workoutsTarget > 0) {
        insights.push("On track with your weekly workout goal.");
      }
      
      // Muscle imbalance insight
      const muscleVolumes = Object.entries(weeklySummary.muscleWeeklyVolume);
      if (muscleVolumes.length > 0) {
        const sorted = muscleVolumes.sort((a, b) => b[1] - a[1]);
        const highest = sorted[0];
        const lowest = sorted[sorted.length - 1];
        
        if (highest[1] > lowest[1] * 3 && sorted.length > 2) {
          insights.push(`Consider adding more ${lowest[0].toLowerCase()} work for balanced development.`);
        }
      }
    }
    
    // Streak insight
    if (currentStreak >= 7) {
      insights.push(`${currentStreak} day streak - consistency is key to progress.`);
    }
    
    return insights.slice(0, 3); // Max 3 insights
  }, [weeklySummary, currentStreak]);

  if (loading || streakLoading || summaryLoading || limitationsLoading) {
    return (
      <View style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Streak Hero */}
        <Animated.View 
          entering={FadeInDown.delay(0).duration(300)}
          style={[styles.streakHero, { backgroundColor: colors.card }]}
        >
          <View style={styles.streakIconContainer}>
            <View style={[styles.streakIconBg, { backgroundColor: `${colors.intensity}20` }]}>
              <Ionicons name="flame" size={32} color={colors.intensity} />
            </View>
          </View>
          <View style={styles.streakInfo}>
            <Text allowFontScaling={false} style={[styles.streakValue, { color: colors.text }]}>
              {currentStreak}
            </Text>
            <Text allowFontScaling={false} style={[styles.streakLabel, { color: colors.textMuted }]}>
              day streak
            </Text>
          </View>
          {longestStreak > currentStreak && (
            <View style={[styles.streakBest, { backgroundColor: colors.gold + "20" }]}>
              <Ionicons name="trophy" size={14} color={colors.gold} />
              <Text allowFontScaling={false} style={[styles.streakBestText, { color: colors.gold }]}>
                Best: {longestStreak}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Coach Insights Card */}
        {coachInsights.length > 0 && (
          <Animated.View 
            entering={FadeInDown.delay(50).duration(300)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <View style={styles.insightsHeader}>
              <View style={[styles.insightsIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="bulb-outline" size={18} color={colors.primary} />
              </View>
              <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
                Insights
              </Text>
            </View>
            <View style={styles.insightsList}>
              {coachInsights.map((insight, index) => (
                <View key={index} style={styles.insightRow}>
                  <View style={[styles.insightDot, { backgroundColor: colors.primary }]} />
                  <Text allowFontScaling={false} style={[styles.insightText, { color: colors.textSecondary }]}>
                    {insight}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Workout Heatmap */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(300)}
          style={[styles.card, { backgroundColor: colors.card }]}
        >
          <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.text }]}>
            Activity
          </Text>
          <WeeklyHeatmap workoutDates={workoutDates} weeks={12} />
        </Animated.View>

        {/* PR Teaser Card */}
        {recentPRs.length > 0 && (
          <Animated.View 
            entering={FadeInDown.delay(150).duration(300)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <Pressable
              onPress={() => {
                hapticPress();
                router.push("/progress/analytics");
              }}
            >
              <View style={styles.prTeaserHeader}>
                <View style={styles.prTeaserTitleRow}>
                  <View style={[styles.prTeaserIcon, { backgroundColor: colors.gold + "20" }]}>
                    <Ionicons name="trophy" size={18} color={colors.gold} />
                  </View>
                  <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
                    Personal Records
                  </Text>
                </View>
                <View style={styles.viewAllLink}>
                  <Text allowFontScaling={false} style={[styles.viewAllText, { color: colors.primary }]}>
                    View All
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </View>
              </View>
            </Pressable>
            
            <View style={styles.prTeaserList}>
              {recentPRs.map((pr, index) => (
                <Pressable
                  key={pr.name}
                  onPress={() => {
                    hapticPress();
                    router.push(`/progress/${encodeURIComponent(pr.name)}`);
                  }}
                  style={({ pressed }) => [
                    styles.prTeaserItem,
                    index < recentPRs.length - 1 && [styles.prTeaserItemBorder, { borderColor: colors.border }],
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text allowFontScaling={false} style={[styles.prTeaserName, { color: colors.text }]}>
                    {pr.name}
                  </Text>
                  <View style={styles.prTeaserRight}>
                    <Text allowFontScaling={false} style={[styles.prTeaserWeight, { color: colors.text }]}>
                      {pr.weight}
                      <Text style={[styles.prTeaserUnit, { color: colors.textMuted }]}> lbs</Text>
                    </Text>
                    {pr.improvement !== null && (
                      <View style={[styles.prTeaserTrend, { backgroundColor: colors.success + "15" }]}>
                        <Ionicons name="trending-up" size={12} color={colors.success} />
                        <Text allowFontScaling={false} style={[styles.prTeaserImprovement, { color: colors.success }]}>
                          +{pr.improvement}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Active Modifications Card - Pain/Injury Tracking (Conditional) */}
        {limitations.length > 0 && (
          <Animated.View 
            entering={FadeInDown.delay(200).duration(300)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <View style={styles.limitationsHeader}>
              <View style={[styles.limitationsIcon, { backgroundColor: colors.gold + "20" }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.gold} />
              </View>
              <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
                Active Modifications
              </Text>
            </View>
            <Text allowFontScaling={false} style={[styles.limitationsSubtitle, { color: colors.textMuted }]}>
              Your workouts are being adapted for these areas
            </Text>
            
            <View style={styles.limitationsList}>
              {limitations.map((limitation) => {
                const daysSince = Math.floor(
                  (new Date().getTime() - limitation.reportedAt.getTime()) / (1000 * 60 * 60 * 24)
                );
                const areaLabel = bodyRegions[limitation.area]?.label || limitation.area;
                
                return (
                  <View 
                    key={limitation.id} 
                    style={[styles.limitationItem, { borderColor: colors.border }]}
                  >
                    <View style={styles.limitationInfo}>
                      <Text allowFontScaling={false} style={[styles.limitationArea, { color: colors.text }]}>
                        {areaLabel}
                      </Text>
                      <View style={styles.limitationMeta}>
                        <Text allowFontScaling={false} style={[styles.limitationMetaText, { color: colors.textMuted }]}>
                          {daysSince === 0 ? "Today" : daysSince === 1 ? "1 day" : `${daysSince} days`}
                        </Text>
                        <View style={[styles.limitationDot, { backgroundColor: colors.textMuted }]} />
                        <Text allowFontScaling={false} style={[styles.limitationMetaText, { color: colors.textMuted }]}>
                          {limitation.workoutsModified} workout{limitation.workoutsModified !== 1 ? "s" : ""} modified
                        </Text>
                      </View>
                      {limitation.status === "monitoring" && (
                        <View style={[styles.monitoringBadge, { backgroundColor: colors.success + "20" }]}>
                          <Text allowFontScaling={false} style={[styles.monitoringText, { color: colors.success }]}>
                            Improving
                          </Text>
                        </View>
                      )}
                    </View>
                    <Pressable
                      onPress={() => {
                        hapticPress();
                        resolveLimitation(limitation.id);
                      }}
                      style={({ pressed }) => [
                        styles.resolveButton,
                        { backgroundColor: colors.success + "15" },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                      <Text allowFontScaling={false} style={[styles.resolveText, { color: colors.success }]}>
                        Resolved
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            
            {/* Medical Disclaimer */}
            <View style={[styles.disclaimer, { backgroundColor: colors.bg }]}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
              <Text allowFontScaling={false} style={[styles.disclaimerText, { color: colors.textMuted }]}>
                If pain persists beyond 2 weeks, consult a healthcare professional
              </Text>
            </View>
          </Animated.View>
        )}

        {/* View Detailed Analytics Button */}
        <Animated.View 
          entering={FadeInDown.delay(250).duration(300)}
          style={styles.analyticsButtonContainer}
        >
          <Pressable
            onPress={() => {
              hapticPress();
              router.push("/progress/analytics");
            }}
            style={({ pressed }) => [
              styles.analyticsButton, 
              { backgroundColor: colors.card },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Ionicons name="analytics-outline" size={20} color={colors.primary} />
            <Text allowFontScaling={false} style={[styles.analyticsButtonText, { color: colors.text }]}>
              View Detailed Analytics
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </Animated.View>

        {/* Empty State */}
        {workoutDates.length === 0 && (
          <Animated.View 
            entering={FadeInDown.delay(150).duration(300)}
            style={[styles.emptyCard, { backgroundColor: colors.card }]}
          >
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="barbell-outline" size={32} color={colors.primary} />
            </View>
            <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
              Start Your Journey
            </Text>
            <Text allowFontScaling={false} style={[styles.emptyDesc, { color: colors.textMuted }]}>
              Complete workouts to track your progress and see your gains visualized here.
            </Text>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  
  // Streak Hero
  streakHero: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.base,
    gap: spacing.base,
  },
  streakIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  streakIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: 40,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 44,
  },
  streakLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  streakBest: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakBestText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  
  // Cards
  card: {
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.base,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.xs,
  },
  
  // Coach Insights
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  insightsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  insightsList: {
    gap: spacing.md,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  
  // PR Teaser
  prTeaserHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  prTeaserTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  prTeaserIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  prTeaserList: {
    gap: 0,
  },
  prTeaserItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  prTeaserItemBorder: {
    borderBottomWidth: 1,
  },
  prTeaserName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  prTeaserRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  prTeaserWeight: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  prTeaserUnit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  prTeaserTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prTeaserImprovement: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  
  // Analytics Button
  analyticsButtonContainer: {
    marginBottom: spacing.base,
  },
  analyticsButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: 16,
    gap: spacing.md,
  },
  analyticsButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  
  // Active Modifications / Limitations
  limitationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  limitationsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  limitationsSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: spacing.base,
  },
  limitationsList: {
    gap: spacing.md,
  },
  limitationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  limitationInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  limitationArea: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  limitationMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  limitationMetaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  limitationDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  monitoringBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  monitoringText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  resolveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  resolveText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.base,
    padding: spacing.md,
    borderRadius: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  
  // Empty State
  emptyCard: {
    borderRadius: 20,
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
