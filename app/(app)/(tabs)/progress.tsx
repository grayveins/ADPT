/**
 * Progress Screen - Clean, Visual Design
 * 
 * Features:
 * - GitHub-style workout heatmap
 * - Big number PRs with visual progress
 * - Streak fire animation
 * - Muscle group balance wheel
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
  Dimensions,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { format, parseISO, subDays, subMonths, startOfWeek, addDays } from "date-fns";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";

import { useTheme } from "@/src/context/ThemeContext";
import { layout, spacing, shadows } from "@/src/theme";
import { supabase } from "@/lib/supabase";
import { useStreak } from "@/src/hooks/useStreak";
import { WeeklyHeatmap, type LiftProgress } from "@/src/components/progress";
import { defaultExercises } from "@/lib/exercises";
import { hapticPress } from "@/src/animations/feedback/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Key lifts to track
const KEY_LIFTS = ["Bench Press", "Squat", "Deadlift", "Overhead Press"];

// Map exercises to muscle groups
const exerciseToMuscle: Record<string, string> = {};
defaultExercises.forEach((ex) => {
  exerciseToMuscle[ex.name] = ex.category;
});

// Muscle group colors for the wheel
const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#00C9B7",
  Back: "#33D4C5",
  Shoulders: "#00A89A",
  Arms: "#7FA07F",
  Legs: "#6B8E6B",
  Core: "#60A5FA",
};

export default function ProgressScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data
  const [workoutDates, setWorkoutDates] = useState<Date[]>([]);
  const [liftPRs, setLiftPRs] = useState<LiftProgress[]>([]);
  const [prTrends, setPRTrends] = useState<Record<string, number>>({}); // Change vs 30 days ago
  const [muscleVolume, setMuscleVolume] = useState<Record<string, number>>({});
  const [totalVolume, setTotalVolume] = useState(0);
  
  // Streak
  const { currentStreak, longestStreak, loading: streakLoading, refreshStreak } = useStreak(userId);

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
      
      // Fetch sets data for PRs and muscle balance
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
      
      // Calculate PRs for key lifts (current and 30 days ago for trends)
      const liftMaxes = new Map<string, { current: number; reps: number }>();
      const liftMaxes30DaysAgo = new Map<string, number>();
      const thirtyDaysAgo = subMonths(new Date(), 1);
      
      // Calculate muscle volume
      const muscleVol: Record<string, number> = {};
      let total = 0;
      
      (setsData || []).forEach((set: any) => {
        const exerciseName = set.workout_exercises?.exercise_name;
        const sessionDate = set.workout_exercises?.workout_sessions?.started_at;
        const weight = set.weight_lbs || 0;
        const reps = set.reps || 0;
        
        if (!exerciseName || weight === 0) return;
        
        // Track PRs
        if (KEY_LIFTS.includes(exerciseName)) {
          const existing = liftMaxes.get(exerciseName);
          if (!existing || weight > existing.current) {
            liftMaxes.set(exerciseName, { current: weight, reps });
          }
          
          // Track max weight from 30+ days ago for trend comparison
          if (sessionDate && parseISO(sessionDate) < thirtyDaysAgo) {
            const existing30 = liftMaxes30DaysAgo.get(exerciseName);
            if (!existing30 || weight > existing30) {
              liftMaxes30DaysAgo.set(exerciseName, weight);
            }
          }
        }
        
        // Track muscle volume
        const muscle = exerciseToMuscle[exerciseName];
        if (muscle && muscle !== "Full Body" && muscle !== "Cardio") {
          const vol = weight * reps;
          muscleVol[muscle] = (muscleVol[muscle] || 0) + vol;
          total += vol;
        }
      });
      
      // Convert to array
      const prs: LiftProgress[] = KEY_LIFTS.map((lift) => {
        const data = liftMaxes.get(lift);
        return {
          name: lift,
          currentMax: data?.current || 0,
          startingMax: 0, // We'd need historical data for this
          unit: "lbs" as const,
        };
      }).filter((l) => l.currentMax > 0);
      
      // Calculate trends (current - 30 days ago)
      const trends: Record<string, number> = {};
      prs.forEach((pr) => {
        const oldMax = liftMaxes30DaysAgo.get(pr.name);
        if (oldMax && oldMax > 0) {
          trends[pr.name] = pr.currentMax - oldMax;
        }
      });
      
      setLiftPRs(prs);
      setPRTrends(trends);
      setMuscleVolume(muscleVol);
      setTotalVolume(total);
      
      refreshStreak();
      
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshStreak]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate muscle percentages for wheel
  const musclePercentages = useMemo(() => {
    if (totalVolume === 0) return [];
    return Object.entries(muscleVolume)
      .map(([muscle, vol]) => ({
        muscle,
        percent: (vol / totalVolume) * 100,
        color: MUSCLE_COLORS[muscle] || colors.primary,
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [muscleVolume, totalVolume, colors.primary]);

  if (loading || streakLoading) {
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

        {/* Workout Heatmap */}
        <Animated.View 
          entering={FadeInDown.delay(50).duration(300)}
          style={[styles.card, { backgroundColor: colors.card }]}
        >
          <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.text }]}>
            Activity
          </Text>
          <WeeklyHeatmap workoutDates={workoutDates} weeks={12} />
        </Animated.View>

        {/* Personal Records */}
        {liftPRs.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View style={styles.sectionHeader}>
              <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
                Personal Records
              </Text>
              <Pressable
                onPress={() => {
                  hapticPress();
                  router.push("/progress/analytics");
                }}
                style={styles.viewAllButton}
              >
                <Text allowFontScaling={false} style={[styles.viewAllText, { color: colors.primary }]}>
                  View All
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            </View>
            <View style={styles.prGrid}>
              {liftPRs.map((pr, i) => {
                const trend = prTrends[pr.name];
                const hasTrend = trend !== undefined && trend !== 0;
                const isPositive = trend > 0;
                
                return (
                  <Animated.View
                    key={pr.name}
                    entering={FadeInDown.delay(150 + i * 30).duration(300)}
                  >
                    <Pressable
                      onPress={() => {
                        hapticPress();
                        router.push(`/progress/${encodeURIComponent(pr.name)}`);
                      }}
                      style={({ pressed }) => [
                        styles.prCard,
                        { backgroundColor: colors.card },
                        shadows.sm,
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      <View style={[styles.prBadge, { backgroundColor: colors.gold }]}>
                        <Ionicons name="trophy" size={12} color={colors.bg} />
                      </View>
                      <Text allowFontScaling={false} style={[styles.prName, { color: colors.textMuted }]}>
                        {pr.name.replace(" Press", "")}
                      </Text>
                      <View style={styles.prValueRow}>
                        <Text allowFontScaling={false} style={[styles.prValue, { color: colors.text }]}>
                          {pr.currentMax}
                        </Text>
                        <Text allowFontScaling={false} style={[styles.prUnit, { color: colors.textMuted }]}>
                          lbs
                        </Text>
                      </View>
                      {/* Trend Arrow */}
                      {hasTrend && (
                        <View style={styles.trendContainer}>
                          <Ionicons
                            name={isPositive ? "trending-up" : "trending-down"}
                            size={12}
                            color={isPositive ? colors.success : colors.error}
                          />
                          <Text
                            allowFontScaling={false}
                            style={[
                              styles.trendText,
                              { color: isPositive ? colors.success : colors.error },
                            ]}
                          >
                            {isPositive ? "+" : ""}{trend}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Muscle Balance */}
        {musclePercentages.length > 0 && (
          <Animated.View 
            entering={FadeInDown.delay(150).duration(300)}
            style={[styles.card, { backgroundColor: colors.card }]}
          >
            <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.text }]}>
              Muscle Balance
            </Text>
            <Text allowFontScaling={false} style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              Volume distribution across muscle groups
            </Text>
            
            <View style={styles.muscleList}>
              {musclePercentages.slice(0, 6).map((item, i) => (
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

        {/* Empty State */}
        {liftPRs.length === 0 && workoutDates.length === 0 && (
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
  cardSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: spacing.base,
  },
  
  // Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  
  // PR Grid
  prGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.base,
  },
  prCard: {
    width: (SCREEN_WIDTH - 50) / 2,
    borderRadius: 16,
    padding: spacing.base,
    position: "relative",
  },
  prBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  prName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: spacing.sm,
  },
  prValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  prValue: {
    fontSize: 32,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -1,
  },
  prUnit: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: spacing.xs,
  },
  trendText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
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
