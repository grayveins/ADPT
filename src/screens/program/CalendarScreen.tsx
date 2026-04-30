/**
 * CalendarScreen — Monthly calendar view of past and scheduled workouts
 *
 * Shows:
 * - Month header with navigation arrows
 * - 7-column calendar grid (Mon-Sun)
 * - Colored dots: teal = completed, outlined = scheduled
 * - Tapping a day shows workout details below the grid
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  isToday as isTodayFn,
  differenceInMinutes,
} from "date-fns";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { layout, spacing, shadows } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkoutSession {
  id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
  exercise_count: number;
  total_volume: number | null;
}

interface ScheduledWorkout {
  id: string;
  day_of_week: number; // 0=Mon, 6=Sun
  name: string;
  exercise_count: number;
  estimated_minutes: number;
  exercises: ScheduledExercise[];
}

interface ScheduledExercise {
  name: string;
  sets: number;
  reps: string;
}

interface DayData {
  date: Date;
  completed: WorkoutSession[];
  scheduled: ScheduledWorkout[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarScreen() {
  const { colors } = useTheme();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = gridStart;
    while (day <= gridEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // Map sessions to dates
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    for (const session of sessions) {
      const key = format(parseISO(session.started_at), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(session);
      map.set(key, arr);
    }
    return map;
  }, [sessions]);

  // Map scheduled workouts to day-of-week
  const scheduledByDow = useMemo(() => {
    const map = new Map<number, ScheduledWorkout[]>();
    for (const w of scheduledWorkouts) {
      const arr = map.get(w.day_of_week) ?? [];
      arr.push(w);
      map.set(w.day_of_week, arr);
    }
    return map;
  }, [scheduledWorkouts]);

  // Get DayData for selected date
  const selectedDayData = useMemo((): DayData => {
    const key = format(selectedDate, "yyyy-MM-dd");
    const completed = sessionsByDate.get(key) ?? [];
    // day_of_week: 0=Mon -> getDay() returns 0=Sun, so convert
    const jsDay = selectedDate.getDay();
    const dow = jsDay === 0 ? 6 : jsDay - 1; // convert to Mon=0
    const scheduled = scheduledByDow.get(dow) ?? [];
    return { date: selectedDate, completed, scheduled };
  }, [selectedDate, sessionsByDate, scheduledByDow]);

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

        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        // Completed sessions for this month
        const { data: sessionRows } = await supabase
          .from("workout_sessions")
          .select("id, title, started_at, ended_at")
          .eq("user_id", user.id)
          .gte("started_at", monthStart.toISOString())
          .lte("started_at", addDays(monthEnd, 1).toISOString())
          .not("ended_at", "is", null)
          .order("started_at", { ascending: true });

        // Enrich with exercise count from workout_sets
        const enrichedSessions: WorkoutSession[] = [];
        for (const s of sessionRows ?? []) {
          const { count } = await supabase
            .from("workout_sets")
            .select("exercise_name", { count: "exact", head: true })
            .eq("session_id", s.id);

          enrichedSessions.push({
            id: s.id,
            title: s.title,
            started_at: s.started_at,
            ended_at: s.ended_at,
            exercise_count: count ?? 0,
            total_volume: null,
          });
        }
        setSessions(enrichedSessions);

        // Scheduled workouts from active program
        const { data: programRow } = await supabase
          .from("coaching_programs")
          .select("id")
          .eq("client_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (programRow) {
          // Get current phase workouts
          const { data: phaseRows } = await supabase
            .from("program_phases")
            .select("id")
            .eq("program_id", programRow.id)
            .order("order_index", { ascending: true })
            .limit(1);

          if (phaseRows && phaseRows.length > 0) {
            const { data: workoutRows } = await supabase
              .from("phase_workouts")
              .select("id, day_of_week, name, exercise_count, estimated_minutes, exercises")
              .eq("phase_id", phaseRows[0].id)
              .order("day_of_week", { ascending: true });

            setScheduledWorkouts((workoutRows ?? []) as ScheduledWorkout[]);
          }
        }
      } catch (err) {
        console.error("CalendarScreen fetch error:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentMonth]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const goToPrevMonth = () => {
    hapticPress();
    setCurrentMonth((m) => subMonths(m, 1));
  };

  const goToNextMonth = () => {
    hapticPress();
    setCurrentMonth((m) => addMonths(m, 1));
  };

  const selectDay = (date: Date) => {
    hapticPress();
    setSelectedDate(date);
  };

  const startScheduledWorkout = (workout: ScheduledWorkout) => {
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

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  const getDotInfo = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const completed = sessionsByDate.get(key) ?? [];
    const jsDay = date.getDay();
    const dow = jsDay === 0 ? 6 : jsDay - 1;
    const scheduled = scheduledByDow.get(dow) ?? [];

    return {
      hasCompleted: completed.length > 0,
      hasScheduled: scheduled.length > 0,
      completedCount: completed.length,
      scheduledCount: scheduled.length,
    };
  };

  const formatDuration = (session: WorkoutSession): string => {
    if (!session.ended_at) return "";
    const mins = differenceInMinutes(parseISO(session.ended_at), parseISO(session.started_at));
    return `${mins} min`;
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  const weekDayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        {/* Month Header */}
        <View style={styles.monthHeader}>
          <Pressable onPress={goToPrevMonth} hitSlop={12} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text
            allowFontScaling={false}
            style={[styles.monthTitle, { color: colors.text }]}
          >
            {format(currentMonth, "MMMM yyyy")}
          </Text>
          <Pressable onPress={goToNextMonth} hitSlop={12} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekDayRow}>
          {weekDayHeaders.map((d) => (
            <View key={d} style={styles.weekDayCell}>
              <Text
                allowFontScaling={false}
                style={[styles.weekDayText, { color: colors.textMuted }]}
              >
                {d}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((date, index) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isTodayFn(date);
            const dots = getDotInfo(date);

            return (
              <Pressable
                key={index}
                onPress={() => selectDay(date)}
                style={[
                  styles.dayCell,
                  isSelected && { borderColor: colors.primary, borderWidth: 2 },
                  isToday && !isSelected && { borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.dayNumber,
                    { color: isCurrentMonth ? colors.text : colors.textMuted },
                    isSelected && { color: colors.primary },
                  ]}
                >
                  {format(date, "d")}
                </Text>
                <View style={styles.dotRow}>
                  {dots.hasCompleted && (
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  )}
                  {dots.hasScheduled && !dots.hasCompleted && (
                    <View
                      style={[
                        styles.dot,
                        styles.dotOutline,
                        { borderColor: colors.primary },
                      ]}
                    />
                  )}
                  {(dots.completedCount > 1 || (dots.hasCompleted && dots.hasScheduled)) && (
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Selected Day Detail */}
        <Animated.View entering={FadeIn.duration(200)} key={format(selectedDate, "yyyy-MM-dd")}>
          <View style={styles.dayDetailSection}>
            <Text
              allowFontScaling={false}
              style={[styles.dayDetailTitle, { color: colors.text }]}
            >
              {format(selectedDate, "EEEE, MMM d")}
            </Text>

            {/* Completed workouts */}
            {selectedDayData.completed.map((session) => (
              <View
                key={session.id}
                style={[styles.dayDetailCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.dayDetailCardHeader}>
                  <View style={[styles.completedBadge, { backgroundColor: colors.successMuted }]}>
                    <Ionicons name="checkmark" size={12} color={colors.success} />
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={[styles.dayDetailCardTitle, { color: colors.text }]}
                  >
                    {session.title ?? "Workout"}
                  </Text>
                </View>
                <View style={styles.dayDetailMeta}>
                  {session.ended_at && (
                    <Text
                      allowFontScaling={false}
                      style={[styles.dayDetailMetaText, { color: colors.textMuted }]}
                    >
                      {formatDuration(session)}
                    </Text>
                  )}
                  {session.exercise_count > 0 && (
                    <Text
                      allowFontScaling={false}
                      style={[styles.dayDetailMetaText, { color: colors.textMuted }]}
                    >
                      {session.exercise_count} exercises
                    </Text>
                  )}
                </View>
              </View>
            ))}

            {/* Scheduled workouts */}
            {selectedDayData.scheduled.map((workout) => {
              // Only show if not already completed that day
              const completedTitles = new Set(
                selectedDayData.completed.map((s) => s.title?.toLowerCase() ?? "")
              );
              if (completedTitles.has(workout.name.toLowerCase())) return null;

              return (
                <View
                  key={workout.id}
                  style={[styles.dayDetailCard, { backgroundColor: colors.card }]}
                >
                  <View style={styles.dayDetailCardHeader}>
                    <View style={[styles.scheduledBadge, { backgroundColor: colors.primaryMuted }]}>
                      <Ionicons name="calendar-outline" size={12} color={colors.primary} />
                    </View>
                    <Text
                      allowFontScaling={false}
                      style={[styles.dayDetailCardTitle, { color: colors.text }]}
                    >
                      {workout.name}
                    </Text>
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={[styles.exercisePreview, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {workout.exercises.map((e) => e.name).join(", ")}
                  </Text>
                  <Pressable
                    onPress={() => startScheduledWorkout(workout)}
                    style={[styles.startButton, { backgroundColor: colors.primary }]}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[styles.startButtonText, { color: colors.textOnPrimary }]}
                    >
                      Start Workout
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.textOnPrimary} />
                  </Pressable>
                </View>
              );
            })}

            {/* Empty day */}
            {selectedDayData.completed.length === 0 &&
              selectedDayData.scheduled.length === 0 && (
                <View style={[styles.emptyDay, { backgroundColor: colors.card }]}>
                  <Ionicons name="moon-outline" size={20} color={colors.textMuted} />
                  <Text
                    allowFontScaling={false}
                    style={[styles.emptyDayText, { color: colors.textMuted }]}
                  >
                    Rest day
                  </Text>
                </View>
              )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: layout.screenPaddingHorizontal, paddingBottom: 100 },

  // Month header
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  monthArrow: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },

  // Weekday headers
  weekDayRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  weekDayText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  // Calendar grid
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.lg,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 0,
    borderColor: "transparent",
    minHeight: CELL_SIZE,
  },
  dayNumber: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  dotRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 3,
    height: 6,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },

  // Day detail
  dayDetailSection: {
    marginTop: spacing.sm,
  },
  dayDetailTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.md,
  },
  dayDetailCard: {
    borderRadius: 14,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  dayDetailCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduledBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDetailCardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  dayDetailMeta: {
    flexDirection: "row",
    gap: spacing.base,
    marginLeft: 32,
  },
  dayDetailMetaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  exercisePreview: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginLeft: 32,
    marginBottom: spacing.md,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },

  // Empty day
  emptyDay: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: 14,
  },
  emptyDayText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
