/**
 * Workout Tab
 * Hub for workout program, start workout, and exercise logging
 * Cal AI meets Trainerize/Fitbod style
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  addDays,
  differenceInCalendarWeeks,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";

import { darkColors, theme } from "@/src/theme";
import { supabase } from "@/lib/supabase";
import {
  generateWeeklyPlan,
  type PlannedWorkout,
  type WorkoutPlanPreferences,
} from "@/lib/workoutPlan";
import { AnimatedCard } from "@/src/animations/components";
import { ToastContainer } from "@/src/animations/celebrations";
import { hapticPress } from "@/src/animations/feedback/haptics";

type SessionRow = {
  id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
};

export default function WorkoutScreen() {
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<WorkoutPlanPreferences | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const todayKey = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/sign-in");
          return;
        }

        setUserId(user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_data, training_style, goal, updated_at")
          .eq("id", user.id)
          .single();

        const onboarding = (profile?.onboarding_data ?? {}) as Record<string, any>;
        const anchor = profile?.updated_at ? new Date(profile.updated_at) : new Date();
        const weekIndex = Math.max(
          0,
          differenceInCalendarWeeks(new Date(), anchor, { weekStartsOn: 1 })
        );

        setPreferences({
          goal: onboarding.goal ?? profile?.goal ?? null,
          workoutsPerWeek: onboarding.workoutsPerWeek ?? 3,
          trainingStyle: onboarding.trainingStyle ?? profile?.training_style ?? null,
          splitPreference: onboarding.splitPreference ?? null,
          limitations: onboarding.limitations ?? [],
          activityLevel: onboarding.activityLevel ?? null,
          weekIndex,
        });

        const weekStartIso = weekStart.toISOString();
        const weekEndIso = addDays(weekStart, 7).toISOString();
        const { data: sessionRows } = await supabase
          .from("workout_sessions")
          .select("id, title, started_at, ended_at")
          .eq("user_id", user.id)
          .gte("started_at", weekStartIso)
          .lt("started_at", weekEndIso)
          .order("started_at", { ascending: false });

        setSessions((sessionRows ?? []) as SessionRow[]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [weekStart]);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, SessionRow>();
    sessions.forEach((session) => {
      const dateKey = format(parseISO(session.started_at), "yyyy-MM-dd");
      if (!map.has(dateKey)) map.set(dateKey, session);
    });
    return map;
  }, [sessions]);

  const plan = useMemo<PlannedWorkout[]>(() => {
    if (!preferences) return [];
    return generateWeeklyPlan(
      { ...preferences, adherenceScore: null, lastSessionDaysAgo: null },
      weekStart
    );
  }, [preferences, weekStart]);

  const planByDate = useMemo(() => new Map(plan.map((item) => [item.date, item])), [plan]);
  const todayWorkout = planByDate.get(todayKey) ?? null;

  const startWorkout = useCallback((workout: PlannedWorkout) => {
    hapticPress();
    router.push({
      pathname: "/(app)/workout/active",
      params: { type: workout.type, name: workout.type }
    });
  }, []);

  const programName = preferences?.trainingStyle?.replace(/_/g, " ") || "Custom Program";
  const currentWeek = (preferences?.weekIndex ?? 0) + 1;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={darkColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Text allowFontScaling={false} style={styles.title}>
            Workout
          </Text>
        </Animated.View>

        {/* Program Card */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.section}
        >
          <View style={styles.programCard}>
            <View style={styles.programHeader}>
              <View style={styles.programBadge}>
                <Ionicons name="trophy" size={16} color="#FFD700" />
              </View>
              <View style={styles.programInfo}>
                <Text allowFontScaling={false} style={styles.programName}>
                  {programName}
                </Text>
                <Text allowFontScaling={false} style={styles.programWeek}>
                  Week {currentWeek} of 8
                </Text>
              </View>
              <Pressable style={styles.programSettings}>
                <Ionicons name="settings-outline" size={20} color={darkColors.muted} />
              </Pressable>
            </View>
            
            {/* Week Progress */}
            <View style={styles.weekProgress}>
              <View style={styles.weekProgressBar}>
                <View 
                  style={[
                    styles.weekProgressFill, 
                    { width: `${(currentWeek / 8) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Today's Workout (if not rest) */}
        {todayWorkout && !todayWorkout.isRest && (
          <Animated.View 
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.section}
          >
            <Text allowFontScaling={false} style={styles.sectionLabel}>
              Today
            </Text>
            <Pressable
              onPress={() => startWorkout(todayWorkout)}
              style={({ pressed }) => [
                styles.todayWorkoutCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.workoutCardHeader}>
                <View style={styles.workoutIcon}>
                  <Ionicons name="barbell" size={28} color={darkColors.primary} />
                </View>
                <View style={styles.workoutInfo}>
                  <Text allowFontScaling={false} style={styles.workoutType}>
                    {todayWorkout.type}
                  </Text>
                  <Text allowFontScaling={false} style={styles.workoutFocus}>
                    {todayWorkout.focus}
                  </Text>
                </View>
                <View style={styles.startButton}>
                  <Text allowFontScaling={false} style={styles.startButtonText}>
                    START
                  </Text>
                  <Ionicons name="play" size={18} color="#000" />
                </View>
              </View>
              <View style={styles.workoutMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={darkColors.muted} />
                  <Text allowFontScaling={false} style={styles.metaText}>
                    ~{todayWorkout.durationMinutes} min
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="fitness-outline" size={14} color={darkColors.muted} />
                  <Text allowFontScaling={false} style={styles.metaText}>
                    5-6 exercises
                  </Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Rest Day Card */}
        {todayWorkout?.isRest && (
          <Animated.View 
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.section}
          >
            <Text allowFontScaling={false} style={styles.sectionLabel}>
              Today
            </Text>
            <View style={styles.restCard}>
              <View style={styles.restIcon}>
                <Ionicons name="moon" size={24} color={darkColors.primary} />
              </View>
              <Text allowFontScaling={false} style={styles.restTitle}>
                Rest Day
              </Text>
              <Text allowFontScaling={false} style={styles.restSubtitle}>
                Recovery is part of the process
              </Text>
            </View>
          </Animated.View>
        )}

        {/* This Week's Plan */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(400)}
          style={styles.section}
        >
          <Text allowFontScaling={false} style={styles.sectionLabel}>
            This Week
          </Text>
          <View style={styles.weekPlan}>
            {plan.map((workout, index) => {
              const isCompleted = sessionsByDate.has(workout.date);
              const isToday = workout.date === todayKey;
              const isPast = new Date(workout.date) < new Date(todayKey);
              
              return (
                <Pressable
                  key={workout.date}
                  onPress={() => !workout.isRest && startWorkout(workout)}
                  disabled={workout.isRest}
                  style={({ pressed }) => [
                    styles.dayRow,
                    isToday && styles.dayRowToday,
                    isCompleted && styles.dayRowCompleted,
                    pressed && !workout.isRest && styles.dayRowPressed,
                  ]}
                >
                  <View style={styles.dayInfo}>
                    <Text 
                      allowFontScaling={false} 
                      style={[
                        styles.dayName,
                        isToday && styles.dayNameToday,
                        isCompleted && styles.dayNameCompleted,
                      ]}
                    >
                      {format(new Date(workout.date), "EEE")}
                    </Text>
                    <Text 
                      allowFontScaling={false} 
                      style={[
                        styles.dayDate,
                        isToday && styles.dayDateToday,
                      ]}
                    >
                      {format(new Date(workout.date), "d")}
                    </Text>
                  </View>
                  
                  <View style={styles.dayContent}>
                    {workout.isRest ? (
                      <Text allowFontScaling={false} style={styles.restLabel}>
                        Rest
                      </Text>
                    ) : (
                      <>
                        <Text 
                          allowFontScaling={false} 
                          style={[
                            styles.workoutLabel,
                            isCompleted && styles.workoutLabelCompleted,
                          ]}
                        >
                          {workout.type}
                        </Text>
                        <Text allowFontScaling={false} style={styles.workoutDuration}>
                          {workout.durationMinutes} min
                        </Text>
                      </>
                    )}
                  </View>

                  <View style={styles.dayStatus}>
                    {isCompleted ? (
                      <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={14} color="#000" />
                      </View>
                    ) : isToday && !workout.isRest ? (
                      <Ionicons name="arrow-forward" size={18} color={darkColors.primary} />
                    ) : isPast && !workout.isRest ? (
                      <View style={styles.missedCircle}>
                        <Ionicons name="close" size={12} color={darkColors.muted} />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.section}
        >
          <View style={styles.quickActions}>
            <Pressable 
              style={styles.quickAction}
              onPress={() => console.log("Exercise Library")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="list" size={20} color={darkColors.primary} />
              </View>
              <Text allowFontScaling={false} style={styles.quickActionText}>
                Exercise Library
              </Text>
            </Pressable>
            
            <Pressable 
              style={styles.quickAction}
              onPress={() => console.log("Workout History")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="time" size={20} color={darkColors.primary} />
              </View>
              <Text allowFontScaling={false} style={styles.quickActionText}>
                History
              </Text>
            </Pressable>
            
            <Pressable 
              style={styles.quickAction}
              onPress={() => console.log("Templates")}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="copy" size={20} color={darkColors.primary} />
              </View>
              <Text allowFontScaling={false} style={styles.quickActionText}>
                Templates
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      <ToastContainer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.bg,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: darkColors.text,
    fontSize: 28,
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  // Program Card
  programCard: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
  },
  programHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  programBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  programWeek: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  programSettings: {
    padding: 8,
  },
  weekProgress: {
    gap: 4,
  },
  weekProgressBar: {
    height: 4,
    backgroundColor: darkColors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  weekProgressFill: {
    height: "100%",
    backgroundColor: darkColors.primary,
  },
  // Today's Workout Card
  todayWorkoutCard: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: darkColors.primary,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  workoutCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  workoutIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    color: darkColors.text,
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  workoutFocus: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: darkColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startButtonText: {
    color: "#000",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  workoutMeta: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  // Rest Card
  restCard: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  restIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  restTitle: {
    color: darkColors.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  restSubtitle: {
    color: darkColors.muted,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  // Week Plan
  weekPlan: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    overflow: "hidden",
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  dayRowToday: {
    backgroundColor: darkColors.selectedBg,
  },
  dayRowCompleted: {
    opacity: 0.7,
  },
  dayRowPressed: {
    opacity: 0.8,
  },
  dayInfo: {
    width: 48,
    alignItems: "center",
  },
  dayName: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
  },
  dayNameToday: {
    color: darkColors.primary,
  },
  dayNameCompleted: {
    color: darkColors.primary,
  },
  dayDate: {
    color: darkColors.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  dayDateToday: {
    color: darkColors.primary,
  },
  dayContent: {
    flex: 1,
    paddingLeft: 12,
  },
  restLabel: {
    color: darkColors.muted,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  workoutLabel: {
    color: darkColors.text,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  workoutLabelCompleted: {
    textDecorationLine: "line-through",
    color: darkColors.muted,
  },
  workoutDuration: {
    color: darkColors.muted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  dayStatus: {
    width: 32,
    alignItems: "center",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: darkColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  missedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: darkColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  // Quick Actions
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: darkColors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkColors.selectedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    color: darkColors.text,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
