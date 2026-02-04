/**
 * Workout Tab
 * Hub for workout program, start workout, and exercise logging
 * Cal AI meets Trainerize/Fitbod style
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  addDays,
  differenceInCalendarWeeks,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";

import { useTheme } from "@/src/context/ThemeContext";
import { layout, spacing } from "@/src/theme";
import { supabase } from "@/lib/supabase";
import {
  generateWeeklyPlan,
  type PlannedWorkout,
  type WorkoutPlanPreferences,
} from "@/lib/workoutPlan";
import { ToastContainer } from "@/src/animations/celebrations";
import { hapticPress } from "@/src/animations/feedback/haptics";

type SessionRow = {
  id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
};

type ActiveProgram = {
  id: string;
  name: string;
  created_at: string;
  duration_weeks: number; // from program_data or default 8
};

export default function WorkoutScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [preferences, setPreferences] = useState<WorkoutPlanPreferences | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [showNewWorkoutSheet, setShowNewWorkoutSheet] = useState(false);
  const [activeProgram, setActiveProgram] = useState<ActiveProgram | null>(null);

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const todayKey = format(new Date(), "yyyy-MM-dd");

  // Fetch workout data
  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/sign-in");
        return;
      }

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

      // Fetch active program if any
      const { data: activeProgramData } = await supabase
        .from("saved_programs")
        .select("id, name, created_at, program_data")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (activeProgramData) {
        const programData = activeProgramData.program_data as Record<string, any> | null;
        setActiveProgram({
          id: activeProgramData.id,
          name: activeProgramData.name,
          created_at: activeProgramData.created_at,
          duration_weeks: programData?.duration_weeks ?? 8, // Default 8 weeks
        });
      } else {
        setActiveProgram(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  useEffect(() => {
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

  // Program info - prefer active saved program over profile training style
  const programName = activeProgram?.name 
    ?? preferences?.trainingStyle?.replace(/_/g, " ") 
    ?? "Custom Program";
  
  // Calculate current week based on active program's start date
  const { currentWeek, totalWeeks } = useMemo(() => {
    if (activeProgram) {
      const programStart = parseISO(activeProgram.created_at);
      const weeksElapsed = differenceInCalendarWeeks(new Date(), programStart, { weekStartsOn: 1 });
      const week = Math.min(Math.max(1, weeksElapsed + 1), activeProgram.duration_weeks);
      return { currentWeek: week, totalWeeks: activeProgram.duration_weeks };
    }
    // Fallback to profile-based week calculation
    return { 
      currentWeek: (preferences?.weekIndex ?? 0) + 1, 
      totalWeeks: 8 
    };
  }, [activeProgram, preferences?.weekIndex]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
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
        {/* Program Card */}
        <Animated.View 
          entering={FadeInDown.delay(0).duration(300)}
          style={styles.section}
        >
          <View style={[styles.programCard, { backgroundColor: colors.card }]}>
            <View style={styles.programHeader}>
              <View style={styles.programBadge}>
                <Ionicons name="trophy" size={16} color={colors.gold} />
              </View>
              <View style={styles.programInfo}>
                <Text allowFontScaling={false} style={[styles.programName, { color: colors.text }]}>
                  {programName}
                </Text>
                <Text allowFontScaling={false} style={[styles.programWeek, { color: colors.textMuted }]}>
                  Week {currentWeek} of {totalWeeks}
                </Text>
              </View>
              <Pressable style={styles.programSettings}>
                <Ionicons name="settings-outline" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            
            {/* Week Progress */}
            <View style={styles.weekProgress}>
              <View style={[styles.weekProgressBar, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.weekProgressFill, 
                    { width: `${(currentWeek / totalWeeks) * 100}%`, backgroundColor: colors.primary }
                  ]} 
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Today's Workout (if not rest) */}
        {todayWorkout && !todayWorkout.isRest && (
          <Animated.View 
            entering={FadeInDown.delay(50).duration(300)}
            style={styles.section}
          >
            <Text allowFontScaling={false} style={[styles.sectionLabel, { color: colors.textMuted }]}>
              Today
            </Text>
            <Pressable
              onPress={() => startWorkout(todayWorkout)}
              style={({ pressed }) => [
                styles.todayWorkoutCard,
                { backgroundColor: colors.card, borderColor: colors.primary },
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.workoutCardHeader}>
                <View style={[styles.workoutIcon, { backgroundColor: colors.selected }]}>
                  <Ionicons name="barbell" size={28} color={colors.primary} />
                </View>
                <View style={styles.workoutInfo}>
                  <Text allowFontScaling={false} style={[styles.workoutType, { color: colors.text }]}>
                    {todayWorkout.type}
                  </Text>
                  <Text allowFontScaling={false} style={[styles.workoutFocus, { color: colors.textMuted }]}>
                    {todayWorkout.focus}
                  </Text>
                </View>
                <View style={[styles.startButton, { backgroundColor: colors.primary }]}>
                  <Text allowFontScaling={false} style={[styles.startButtonText, { color: colors.textOnPrimary }]}>
                    START
                  </Text>
                  <Ionicons name="play" size={18} color={colors.textOnPrimary} />
                </View>
              </View>
              <View style={styles.workoutMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text allowFontScaling={false} style={[styles.metaText, { color: colors.textMuted }]}>
                    ~{todayWorkout.durationMinutes} min
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="fitness-outline" size={14} color={colors.textMuted} />
                  <Text allowFontScaling={false} style={[styles.metaText, { color: colors.textMuted }]}>
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
            entering={FadeInDown.delay(50).duration(300)}
            style={styles.section}
          >
            <Text allowFontScaling={false} style={[styles.sectionLabel, { color: colors.textMuted }]}>
              Today
            </Text>
            <View style={[styles.restCard, { backgroundColor: colors.card }]}>
              <View style={[styles.restIcon, { backgroundColor: colors.selected }]}>
                <Ionicons name="moon" size={24} color={colors.primary} />
              </View>
              <Text allowFontScaling={false} style={[styles.restTitle, { color: colors.text }]}>
                Rest Day
              </Text>
              <Text allowFontScaling={false} style={[styles.restSubtitle, { color: colors.textMuted }]}>
                Recovery is part of the process
              </Text>
            </View>
          </Animated.View>
        )}

        {/* This Week's Plan */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(300)}
          style={styles.section}
        >
          <Text allowFontScaling={false} style={[styles.sectionLabel, { color: colors.textMuted }]}>
            This Week
          </Text>
          <View style={[styles.weekPlan, { backgroundColor: colors.card }]}>
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
                    { borderBottomColor: colors.border },
                    isToday && { backgroundColor: colors.selected },
                    isCompleted && styles.dayRowCompleted,
                    pressed && !workout.isRest && styles.dayRowPressed,
                  ]}
                >
                  <View style={styles.dayInfo}>
                    <Text 
                      allowFontScaling={false} 
                      style={[
                        styles.dayName,
                        { color: colors.textMuted },
                        isToday && { color: colors.primary },
                        isCompleted && { color: colors.primary },
                      ]}
                    >
                      {format(new Date(workout.date), "EEE")}
                    </Text>
                    <Text 
                      allowFontScaling={false} 
                      style={[
                        styles.dayDate,
                        { color: colors.text },
                        isToday && { color: colors.primary },
                      ]}
                    >
                      {format(new Date(workout.date), "d")}
                    </Text>
                  </View>
                  
                  <View style={styles.dayContent}>
                    {workout.isRest ? (
                      <Text allowFontScaling={false} style={[styles.restLabel, { color: colors.textMuted }]}>
                        Rest
                      </Text>
                    ) : (
                      <>
                        <Text 
                          allowFontScaling={false} 
                          style={[
                            styles.workoutLabel,
                            { color: colors.text },
                            isCompleted && { textDecorationLine: "line-through", color: colors.textMuted },
                          ]}
                        >
                          {workout.type}
                        </Text>
                        <Text allowFontScaling={false} style={[styles.workoutDuration, { color: colors.textMuted }]}>
                          {workout.durationMinutes} min
                        </Text>
                      </>
                    )}
                  </View>

                  <View style={styles.dayStatus}>
                    {isCompleted ? (
                      <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
                      </View>
                    ) : isToday && !workout.isRest ? (
                      <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                    ) : isPast && !workout.isRest ? (
                      <View style={[styles.missedCircle, { backgroundColor: colors.border }]}>
                        <Ionicons name="close" size={12} color={colors.textMuted} />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* New Workout Card */}
        <Animated.View 
          entering={FadeInDown.delay(150).duration(300)}
          style={styles.section}
        >
          <Pressable
            onPress={() => {
              hapticPress();
              setShowNewWorkoutSheet(true);
            }}
            style={({ pressed }) => [
              styles.newWorkoutCard,
              { backgroundColor: colors.card },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={[styles.newWorkoutIcon, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </View>
            <View style={styles.newWorkoutInfo}>
              <Text allowFontScaling={false} style={[styles.newWorkoutTitle, { color: colors.text }]}>
                New Workout
              </Text>
              <Text allowFontScaling={false} style={[styles.newWorkoutSubtitle, { color: colors.textMuted }]}>
                Build custom or let AI generate
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>

          {/* Secondary Links */}
          <View style={styles.secondaryLinks}>
            <Pressable 
              onPress={() => {
                hapticPress();
                router.push("/(app)/workout/programs");
              }}
              hitSlop={8}
            >
              <Text allowFontScaling={false} style={[styles.secondaryLinkText, { color: colors.textMuted }]}>
                My Programs
              </Text>
            </Pressable>
            <Text allowFontScaling={false} style={[styles.linkDot, { color: colors.border }]}>
              ·
            </Text>
            <Pressable 
              onPress={() => {
                hapticPress();
                router.push("/(app)/workout/history");
              }}
              hitSlop={8}
            >
              <Text allowFontScaling={false} style={[styles.secondaryLinkText, { color: colors.textMuted }]}>
                History
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      {/* New Workout Bottom Sheet */}
      <Modal
        visible={showNewWorkoutSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewWorkoutSheet(false)}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable 
            style={styles.sheetBackdropPress} 
            onPress={() => setShowNewWorkoutSheet(false)} 
          />
          <View style={[styles.sheetContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text allowFontScaling={false} style={[styles.sheetTitle, { color: colors.text }]}>
              New Workout
            </Text>

            {/* AI Generate Option */}
            <Pressable
              onPress={() => {
                hapticPress();
                setShowNewWorkoutSheet(false);
                router.push("/(app)/workout/generate");
              }}
              style={({ pressed }) => [
                styles.sheetOption,
                { backgroundColor: colors.cardAlt },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="sparkles" size={22} color={colors.primary} />
              </View>
              <View style={styles.sheetOptionContent}>
                <Text allowFontScaling={false} style={[styles.sheetOptionTitle, { color: colors.text }]}>
                  AI Generate
                </Text>
                <Text allowFontScaling={false} style={[styles.sheetOptionDesc, { color: colors.textMuted }]}>
                  Describe what you want, AI builds it
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Build Manually Option */}
            <Pressable
              onPress={() => {
                hapticPress();
                setShowNewWorkoutSheet(false);
                router.push("/(app)/workout/exercises");
              }}
              style={({ pressed }) => [
                styles.sheetOption,
                { backgroundColor: colors.cardAlt },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: colors.selected }]}>
                <Ionicons name="list" size={22} color={colors.primary} />
              </View>
              <View style={styles.sheetOptionContent}>
                <Text allowFontScaling={false} style={[styles.sheetOptionTitle, { color: colors.text }]}>
                  Build Manually
                </Text>
                <Text allowFontScaling={false} style={[styles.sheetOptionDesc, { color: colors.textMuted }]}>
                  Pick exercises from the library
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Start Empty Option */}
            <Pressable
              onPress={() => {
                hapticPress();
                setShowNewWorkoutSheet(false);
                router.push({
                  pathname: "/(app)/workout/active",
                  params: { type: "Custom", name: "Custom Workout" }
                });
              }}
              style={({ pressed }) => [
                styles.sheetOption,
                { backgroundColor: colors.cardAlt },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: colors.selected }]}>
                <Ionicons name="flash" size={22} color={colors.primary} />
              </View>
              <View style={styles.sheetOptionContent}>
                <Text allowFontScaling={false} style={[styles.sheetOptionTitle, { color: colors.text }]}>
                  Start Empty
                </Text>
                <Text allowFontScaling={false} style={[styles.sheetOptionDesc, { color: colors.textMuted }]}>
                  Add exercises as you go
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </Modal>

      <ToastContainer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  section: {
    marginBottom: layout.sectionGap,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  // Program Card
  programCard: {
    borderRadius: 16,
    padding: spacing.base,
  },
  programHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
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
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  programWeek: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  programSettings: {
    padding: spacing.sm,
  },
  weekProgress: {
    gap: spacing.xs,
  },
  weekProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  weekProgressFill: {
    height: "100%",
  },
  // Today's Workout Card
  todayWorkoutCard: {
    borderRadius: 16,
    padding: spacing.base,
    borderWidth: 1,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  workoutCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  workoutIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  workoutFocus: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 24,
  },
  startButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  workoutMeta: {
    flexDirection: "row",
    gap: spacing.base,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  // Rest Card
  restCard: {
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: "center",
  },
  restIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  restTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  restSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  // Week Plan
  weekPlan: {
    borderRadius: 16,
    overflow: "hidden",
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderBottomWidth: 1,
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
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
  },
  dayDate: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  dayContent: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  restLabel: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  workoutLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  workoutDuration: {
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
    alignItems: "center",
    justifyContent: "center",
  },
  missedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  // New Workout Card
  newWorkoutCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: spacing.base,
    gap: spacing.md,
  },
  newWorkoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  newWorkoutInfo: {
    flex: 1,
  },
  newWorkoutTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  newWorkoutSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  // Secondary Links
  secondaryLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  secondaryLinkText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  linkDot: {
    fontSize: 14,
  },
  // Bottom Sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheetBackdropPress: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.lg,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: spacing.base,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  sheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOptionContent: {
    flex: 1,
  },
  sheetOptionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  sheetOptionDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
