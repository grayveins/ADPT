/**
 * ProgramScreen — Client's view of their assigned coaching program
 *
 * Shows:
 * - Program header with coach name + status badge
 * - Current phase card with progress bar
 * - This week's scheduled workouts as tappable cards
 * - Upcoming phases (collapsed)
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  differenceInCalendarWeeks,
  isWithinInterval,
} from "date-fns";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { layout, spacing, shadows } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoachingProgram {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "paused" | "completed";
  coach_name: string | null;
  created_at: string;
}

interface ProgramPhase {
  id: string;
  program_id: string;
  name: string;
  goal: string | null;
  order_index: number;
  duration_weeks: number;
  starts_at: string | null;
}

interface PhaseWorkout {
  id: string;
  phase_id: string;
  day_of_week: number; // 0 = Monday, 6 = Sunday
  name: string;
  exercise_count: number;
  estimated_minutes: number;
  exercises: PhaseExercise[];
}

interface PhaseExercise {
  name: string;
  sets: number;
  reps: string;
  muscle_group?: string;
}

interface CompletedSession {
  id: string;
  started_at: string;
  title: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProgramScreen() {
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [program, setProgram] = useState<CoachingProgram | null>(null);
  const [phases, setPhases] = useState<ProgramPhase[]>([]);
  const [workouts, setWorkouts] = useState<PhaseWorkout[]>([]);
  const [completedThisWeek, setCompletedThisWeek] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const now = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => startOfWeek(now, { weekStartsOn: 1 }), [now]);
  const weekEnd = useMemo(() => endOfWeek(now, { weekStartsOn: 1 }), [now]);

  // Determine current phase based on dates or order
  const currentPhase = useMemo(() => {
    if (!phases.length) return null;
    // If phases have starts_at, find the one containing today
    const withDates = phases.filter((p) => p.starts_at);
    if (withDates.length) {
      for (const phase of withDates) {
        const start = parseISO(phase.starts_at!);
        const weeksFromStart = differenceInCalendarWeeks(now, start, { weekStartsOn: 1 });
        if (weeksFromStart >= 0 && weeksFromStart < phase.duration_weeks) {
          return { phase, currentWeek: weeksFromStart + 1 };
        }
      }
    }
    // Fallback: first phase
    return { phase: phases[0], currentWeek: 1 };
  }, [phases, now]);

  const upcomingPhases = useMemo(() => {
    if (!currentPhase) return [];
    return phases.filter((p) => p.order_index > currentPhase.phase.order_index);
  }, [phases, currentPhase]);

  // --------------------------------------------------------------------------
  // Fetch
  // --------------------------------------------------------------------------

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Get active coaching program
        const { data: programRow } = await supabase
          .from("coaching_programs")
          .select("id, name, description, status, coach_name, created_at")
          .eq("client_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!programRow) {
          setProgram(null);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        setProgram(programRow as CoachingProgram);

        // 2. Get phases
        const { data: phaseRows } = await supabase
          .from("program_phases")
          .select("id, program_id, name, goal, order_index, duration_weeks, starts_at")
          .eq("program_id", programRow.id)
          .order("order_index", { ascending: true });

        const phasesData = (phaseRows ?? []) as ProgramPhase[];
        setPhases(phasesData);

        // 3. Get workouts for all phases (so upcoming phases show too)
        if (phasesData.length > 0) {
          const phaseIds = phasesData.map((p) => p.id);
          const { data: workoutRows } = await supabase
            .from("phase_workouts")
            .select("id, phase_id, day_of_week, name, exercise_count, estimated_minutes, exercises")
            .in("phase_id", phaseIds)
            .order("day_of_week", { ascending: true });

          setWorkouts((workoutRows ?? []) as PhaseWorkout[]);
        }

        // 4. Get completed sessions this week
        const { data: sessionRows } = await supabase
          .from("workout_sessions")
          .select("id, started_at, title")
          .eq("user_id", user.id)
          .gte("started_at", weekStart.toISOString())
          .lte("started_at", weekEnd.toISOString())
          .not("ended_at", "is", null);

        const completedTitles = new Set(
          (sessionRows ?? []).map((s: CompletedSession) => s.title?.toLowerCase() ?? "")
        );
        setCompletedThisWeek(completedTitles);
      } catch (err) {
        console.error("ProgramScreen fetch error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [weekStart, weekEnd]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [fetchData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // --------------------------------------------------------------------------
  // Workout cards for current phase
  // --------------------------------------------------------------------------

  const currentPhaseWorkouts = useMemo(() => {
    if (!currentPhase) return [];
    return workouts.filter((w) => w.phase_id === currentPhase.phase.id);
  }, [workouts, currentPhase]);

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const isWorkoutCompleted = (workout: PhaseWorkout): boolean => {
    return completedThisWeek.has(workout.name.toLowerCase());
  };

  const startWorkout = (workout: PhaseWorkout) => {
    hapticPress();
    router.push({
      pathname: "/(workout)/active",
      params: {
        name: workout.name,
        exercises: JSON.stringify(workout.exercises),
        sourceType: "program",
        sourceId: workout.id,
      },
    });
  };

  const togglePhaseExpand = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  // --------------------------------------------------------------------------
  // Empty state — no program assigned
  // --------------------------------------------------------------------------

  if (!loading && !program) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="clipboard-outline" size={40} color={colors.primary} />
          </View>
          <Text
            allowFontScaling={false}
            style={[styles.emptyTitle, { color: colors.text }]}
          >
            No Program Yet
          </Text>
          <Text
            allowFontScaling={false}
            style={[styles.emptySubtitle, { color: colors.textMuted }]}
          >
            Ask your coach to assign one, or browse workouts in the Workout tab.
          </Text>
          <Pressable
            onPress={() => {
              hapticPress();
              router.push("/(app)/(tabs)/workout");
            }}
            style={[styles.emptyButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="barbell-outline" size={18} color={colors.primary} />
            <Text allowFontScaling={false} style={[styles.emptyButtonText, { color: colors.text }]}>
              Browse Workouts
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // Loading
  // --------------------------------------------------------------------------

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // Main render
  // --------------------------------------------------------------------------

  const progressFraction = currentPhase
    ? currentPhase.currentWeek / currentPhase.phase.duration_weeks
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Program Header */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={styles.programHeader}>
            <View style={{ flex: 1 }}>
              <Text
                allowFontScaling={false}
                style={[styles.programName, { color: colors.text }]}
              >
                {program!.name}
              </Text>
              {program!.coach_name && (
                <Text
                  allowFontScaling={false}
                  style={[styles.coachName, { color: colors.textMuted }]}
                >
                  Coach {program!.coach_name}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    program!.status === "active"
                      ? colors.successMuted
                      : colors.warningMuted,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      program!.status === "active" ? colors.success : colors.warning,
                  },
                ]}
              />
              <Text
                allowFontScaling={false}
                style={[
                  styles.statusText,
                  {
                    color:
                      program!.status === "active" ? colors.success : colors.warning,
                  },
                ]}
              >
                {program!.status === "active" ? "Active" : "Paused"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Current Phase Card */}
        {currentPhase && (
          <Animated.View entering={FadeInDown.delay(80).duration(300)}>
            <View style={[styles.phaseCard, { backgroundColor: colors.card }]}>
              <View style={styles.phaseCardHeader}>
                <Text
                  allowFontScaling={false}
                  style={[styles.phaseLabel, { color: colors.primary }]}
                >
                  CURRENT PHASE
                </Text>
                <Text
                  allowFontScaling={false}
                  style={[styles.phaseWeek, { color: colors.textMuted }]}
                >
                  Week {currentPhase.currentWeek} of {currentPhase.phase.duration_weeks}
                </Text>
              </View>
              <Text
                allowFontScaling={false}
                style={[styles.phaseName, { color: colors.text }]}
              >
                {currentPhase.phase.name}
              </Text>
              {currentPhase.phase.goal && (
                <Text
                  allowFontScaling={false}
                  style={[styles.phaseGoal, { color: colors.textSecondary }]}
                >
                  {currentPhase.phase.goal}
                </Text>
              )}
              {/* Progress bar */}
              <View style={[styles.progressBarTrack, { backgroundColor: colors.progressBg }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.progressFill,
                      width: `${Math.min(100, progressFraction * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        )}

        {/* This Week's Workouts */}
        {currentPhaseWorkouts.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).duration(300)}>
            <Text
              allowFontScaling={false}
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              This Week
            </Text>
            {currentPhaseWorkouts.map((workout, i) => {
              const completed = isWorkoutCompleted(workout);
              return (
                <Pressable
                  key={workout.id}
                  onPress={() => !completed && startWorkout(workout)}
                  style={({ pressed }) => [
                    styles.workoutCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    pressed && !completed && { opacity: 0.85 },
                    completed && { opacity: 0.6 },
                  ]}
                >
                  <View style={styles.workoutCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text
                        allowFontScaling={false}
                        style={[styles.workoutDay, { color: colors.textMuted }]}
                      >
                        {dayNames[workout.day_of_week] ?? `Day ${workout.day_of_week + 1}`}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[styles.workoutName, { color: colors.text }]}
                      >
                        {workout.name}
                      </Text>
                    </View>
                    {completed ? (
                      <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
                        <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    )}
                  </View>
                  <View style={styles.workoutMeta}>
                    <View style={styles.workoutMetaItem}>
                      <Ionicons name="barbell-outline" size={14} color={colors.textMuted} />
                      <Text
                        allowFontScaling={false}
                        style={[styles.workoutMetaText, { color: colors.textMuted }]}
                      >
                        {workout.exercise_count} exercises
                      </Text>
                    </View>
                    <View style={styles.workoutMetaItem}>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text
                        allowFontScaling={false}
                        style={[styles.workoutMetaText, { color: colors.textMuted }]}
                      >
                        ~{workout.estimated_minutes} min
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        )}

        {/* Upcoming Phases */}
        {upcomingPhases.length > 0 && (
          <Animated.View entering={FadeInDown.delay(240).duration(300)}>
            <Text
              allowFontScaling={false}
              style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}
            >
              Upcoming Phases
            </Text>
            {upcomingPhases.map((phase) => {
              const expanded = expandedPhases.has(phase.id);
              const phaseWorkouts = workouts.filter((w) => w.phase_id === phase.id);
              return (
                <View key={phase.id}>
                  <Pressable
                    onPress={() => togglePhaseExpand(phase.id)}
                    style={[styles.upcomingPhase, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        allowFontScaling={false}
                        style={[styles.upcomingPhaseName, { color: colors.text }]}
                      >
                        {phase.name}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[styles.upcomingPhaseDetail, { color: colors.textMuted }]}
                      >
                        {phase.duration_weeks} weeks{phase.goal ? ` \u00B7 ${phase.goal}` : ""}
                      </Text>
                    </View>
                    <Ionicons
                      name={expanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.textMuted}
                    />
                  </Pressable>
                  {expanded && phaseWorkouts.length > 0 && (
                    <View style={styles.expandedWorkouts}>
                      {phaseWorkouts.map((w) => (
                        <View
                          key={w.id}
                          style={[styles.expandedWorkoutRow, { borderColor: colors.border }]}
                        >
                          <Text
                            allowFontScaling={false}
                            style={[styles.expandedWorkoutDay, { color: colors.textMuted }]}
                          >
                            {dayNames[w.day_of_week] ?? `Day ${w.day_of_week + 1}`}
                          </Text>
                          <Text
                            allowFontScaling={false}
                            style={[styles.expandedWorkoutName, { color: colors.textSecondary }]}
                          >
                            {w.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center" },
  scroll: { padding: layout.screenPaddingHorizontal, paddingBottom: 100 },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },

  // Program header
  programHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  programName: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
  },
  coachName: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  // Current phase card
  phaseCard: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  phaseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  phaseLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  phaseWeek: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  phaseName: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  phaseGoal: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.md,
  },

  // Workout cards
  workoutCard: {
    borderRadius: 14,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    ...shadows.sm,
  },
  workoutCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  workoutDay: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  workoutName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutMeta: {
    flexDirection: "row",
    gap: spacing.base,
  },
  workoutMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  workoutMetaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // Upcoming phases
  upcomingPhase: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  upcomingPhaseName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  upcomingPhaseDetail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  expandedWorkouts: {
    paddingLeft: spacing.lg,
    marginBottom: spacing.sm,
  },
  expandedWorkoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  expandedWorkoutDay: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 80,
  },
  expandedWorkoutName: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
});
