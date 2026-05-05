import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  addDays,
  format,
  isSameDay,
  startOfWeek,
  subDays,
} from "date-fns";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { spacing } from "@/src/theme";
import { useStreak } from "@/src/hooks/useStreak";
import { useBodyStats } from "@/src/hooks/useBodyStats";
import { useClientMacros } from "@/src/hooks/useClientMacros";
import { MetricCard } from "@/src/components/progress/MetricCard";
import { hapticPress } from "@/src/animations/feedback/haptics";
import {
  fetchTasksForDate,
  setCustomTaskCompleted,
  type CoachTask,
} from "@/src/lib/coachTasks";

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// Generate 14 days: 7 past + today + 6 future
const generateDays = () => {
  const today = new Date();
  return Array.from({ length: 21 }, (_, i) => addDays(today, i - 10));
};

export default function HomeScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("there");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allWorkouts, setAllWorkouts] = useState<any[]>([]);
  const [programName, setProgramName] = useState<string | null>(null);
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [coachTasks, setCoachTasks] = useState<CoachTask[]>([]);

  const { data: bodyStats, refresh: refreshStats } = useBodyStats(userId);
  const { data: macros } = useClientMacros(userId);
  const { currentStreak } = useStreak(userId);

  const days = useMemo(generateDays, []);
  const today = new Date();
  const isToday = isSameDay(selectedDate, today);
  const selectedDayOfWeek = selectedDate.getDay() || 7;

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/sign-in"); return; }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .single();
    if (profile?.first_name) setProfileName(profile.first_name);

    // Fetch active program with all workouts
    const { data: program } = await supabase
      .from("coaching_programs")
      .select("id, name, program_phases(id, name, status, phase_number, phase_workouts(id, day_number, name, exercises))")
      .eq("client_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (program) {
      setProgramName(program.name);
      const sortedPhases = ((program as any).program_phases ?? [])
        .sort((a: any, b: any) => (a.phase_number ?? 0) - (b.phase_number ?? 0));
      const activePhase = sortedPhases.find((p: any) => p.status === "active") || sortedPhases[0];
      setAllWorkouts(activePhase?.phase_workouts ?? []);
    }

    // Fetch completed workout sessions (last 21 days)
    const cutoff = subDays(new Date(), 21).toISOString();
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("id, title, started_at, ended_at")
      .eq("user_id", user.id)
      .gte("started_at", cutoff)
      .order("started_at", { ascending: false });

    setCompletedSessions(sessions ?? []);
  }, []);

  const lastFetchedAt = useRef(0);
  useFocusEffect(useCallback(() => {
    if (Date.now() - lastFetchedAt.current > 30_000) {
      fetchData();
      lastFetchedAt.current = Date.now();
    }
  }, [fetchData]));

  // Day-strip ref + auto-scroll on selection change so the selected day
  // becomes the leftmost fully-visible chip (Trainerize-like behavior).
  const dayStripRef = useRef<ScrollView | null>(null);
  const dayStripMounted = useRef(false);
  useEffect(() => {
    const idx = days.findIndex((d) => isSameDay(d, selectedDate));
    if (idx < 0) return;
    // 52px = chip min width (see styles.dayChip). Subtract a small offset
    // so the previous day peeks in for context.
    const x = Math.max(0, idx * 52 - 4);
    dayStripRef.current?.scrollTo({ x, animated: dayStripMounted.current });
    dayStripMounted.current = true;
  }, [selectedDate, days]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    await refreshStats();
    setRefreshing(false);
  }, [fetchData, refreshStats]);

  // Fetch coach-scheduled tasks for the currently selected date.
  useEffect(() => {
    if (!userId) return;
    const date = format(selectedDate, "yyyy-MM-dd");
    let cancelled = false;
    fetchTasksForDate({ clientId: userId, date })
      .then((tasks) => { if (!cancelled) setCoachTasks(tasks); })
      .catch(() => { if (!cancelled) setCoachTasks([]); });
    return () => { cancelled = true; };
  }, [userId, selectedDate]);

  const toggleCustomTask = useCallback(async (task: CoachTask) => {
    const wasCompleted = !!task.manually_completed_at;
    setCoachTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, manually_completed_at: wasCompleted ? null : new Date().toISOString() }
          : t
      )
    );
    try {
      await setCustomTaskCompleted(task.id, !wasCompleted);
    } catch {
      // Roll back optimistic update on failure
      setCoachTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, manually_completed_at: wasCompleted ? new Date().toISOString() : null }
            : t
        )
      );
    }
  }, []);

  // Get workout assigned for selected day
  const selectedDayWorkout = useMemo(() => {
    return allWorkouts.find((w: any) => w.day_number === selectedDayOfWeek) || null;
  }, [allWorkouts, selectedDayOfWeek]);

  // Check if selected day has a completed session
  const selectedDayCompleted = useMemo(() => {
    return completedSessions.find((s: any) =>
      isSameDay(new Date(s.started_at), selectedDate)
    ) || null;
  }, [completedSessions, selectedDate]);

  // Check which days have completions (for dots)
  const completedDates = useMemo(() => {
    const set = new Set<string>();
    completedSessions.forEach((s: any) => set.add(format(new Date(s.started_at), "yyyy-MM-dd")));
    return set;
  }, [completedSessions]);

  const greeting = `${getGreeting()}, ${profileName}`;
  const weightLbs = bodyStats?.weight_kg ? (bodyStats.weight_kg * 2.205).toFixed(1) : "—";

  const workoutsThisWeek = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return completedSessions.filter((s: any) => new Date(s.started_at) >= start).length;
  }, [completedSessions]);

  const startWorkout = () => {
    hapticPress();
    if (selectedDayWorkout) {
      router.push({
        pathname: "/(workout)/program-detail",
        params: {
          name: selectedDayWorkout.name,
          exercises: JSON.stringify(selectedDayWorkout.exercises || []),
          phaseName: programName || "",
          dayNumber: String(selectedDayWorkout.day_number),
        },
      });
    } else {
      router.push("/(app)/(tabs)/workout");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text allowFontScaling={false} style={[styles.greeting, { color: colors.text }]}>
          {greeting}
        </Text>
        <AvatarButton name={profileName} colors={colors} />
      </View>

      {/* Date label */}
      <View style={styles.dateRow}>
        <Text allowFontScaling={false} style={[styles.dateLabel, { color: colors.text }]}>
          {format(selectedDate, "MMMM d")}
          {isToday ? "" : ` · ${format(selectedDate, "EEEE")}`}
        </Text>
        {!isToday && (
          <Pressable onPress={() => setSelectedDate(new Date())}>
            <Text allowFontScaling={false} style={[styles.todayLink, { color: colors.text }]}>
              Today
            </Text>
          </Pressable>
        )}
      </View>

      {/* Main content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {/* Day selector inside scroll — no gap. Scroll behavior lives in
            the dayStripRef effect above so taps re-snap the selection. */}
        <ScrollView
          ref={dayStripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayStrip}
        >
          {days.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isDayToday = isSameDay(day, today);
            const dateStr = format(day, "yyyy-MM-dd");
            const hasCompletion = completedDates.has(dateStr);

            return (
              <Pressable
                key={i}
                onPress={() => { hapticPress(); setSelectedDate(day); }}
                style={[
                  styles.dayChip,
                  isSelected && { backgroundColor: colors.text },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.dayNum,
                    { color: isSelected ? colors.bg : colors.text },
                    isDayToday && !isSelected && { fontWeight: "700" },
                  ]}
                >
                  {format(day, "d")}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={[styles.dayLabel, { color: isSelected ? colors.bg : colors.textMuted }]}
                >
                  {format(day, "EEE")}
                </Text>
                {hasCompletion && (
                  <View style={[styles.dot, { backgroundColor: isSelected ? colors.bg : colors.text }]} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
        {/* Daily tasks */}
        <View style={styles.taskList}>
          {/* Assigned workout — only show if one exists */}
          {selectedDayWorkout && (
            <Pressable onPress={startWorkout} style={[styles.taskRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.taskDot, {
                backgroundColor: selectedDayCompleted ? colors.success : "transparent",
                borderColor: selectedDayCompleted ? colors.success : colors.textMuted,
              }]}>
                {selectedDayCompleted && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <View style={styles.taskInfo}>
                <Text allowFontScaling={false} style={[styles.taskTitle, { color: colors.text }]}>
                  {selectedDayWorkout.name}
                </Text>
                <Text allowFontScaling={false} style={[styles.taskSub, { color: colors.textMuted }]}>
                  {selectedDayCompleted ? "Completed" : `${(selectedDayWorkout.exercises || []).length} exercises`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          )}

          {/* Completed workout (if no assigned but has a logged session) */}
          {!selectedDayWorkout && selectedDayCompleted && (
            <View style={[styles.taskRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.taskDot, { backgroundColor: colors.success, borderColor: colors.success }]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
              <View style={styles.taskInfo}>
                <Text allowFontScaling={false} style={[styles.taskTitle, { color: colors.text }]}>
                  {selectedDayCompleted.title || "Workout"}
                </Text>
                <Text allowFontScaling={false} style={[styles.taskSub, { color: colors.textMuted }]}>Completed</Text>
              </View>
            </View>
          )}

          {/* Nutrition task (shown only if no coach-scheduled macros task today) */}
          {macros && !coachTasks.some((t) => t.task_type === "macros") && (
            <Pressable onPress={() => router.push("/(app)/(tabs)/meals" as any)} style={[styles.taskRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.taskDot, { borderColor: colors.textMuted }]} />
              <View style={styles.taskInfo}>
                <Text allowFontScaling={false} style={[styles.taskTitle, { color: colors.text }]}>
                  Hit your daily nutrition goal
                </Text>
                <Text allowFontScaling={false} style={[styles.taskSub, { color: colors.textMuted }]}>
                  {macros.calories} cal · {macros.protein_g}g P · {macros.carbs_g}g C · {macros.fat_g}g F
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          )}

          {/* Coach-scheduled tasks */}
          {coachTasks.map((task, idx) => {
            const isLast = idx === coachTasks.length - 1;
            const completed = !!task.manually_completed_at;
            const handlePress = () => {
              hapticPress();
              if (task.task_type === "custom") {
                toggleCustomTask(task);
                return;
              }
              if (task.task_type === "photos") {
                router.push("/(app)/progress-photos" as any);
              } else if (task.task_type === "body_stats") {
                router.push({
                  pathname: "/(app)/log-progress",
                  params: { date: format(selectedDate, "yyyy-MM-dd") },
                } as any);
              } else if (task.task_type === "macros") {
                router.push("/(app)/(tabs)/meals" as any);
              }
            };
            return (
              <Pressable
                key={task.id}
                onPress={handlePress}
                style={[
                  styles.taskRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View
                  style={[
                    styles.taskDot,
                    {
                      backgroundColor: completed ? colors.success : "transparent",
                      borderColor: completed ? colors.success : colors.textMuted,
                    },
                  ]}
                >
                  {completed && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <View style={styles.taskInfo}>
                  <Text allowFontScaling={false} style={[styles.taskTitle, { color: colors.text }]}>
                    {task.title}
                  </Text>
                  {task.description ? (
                    <Text allowFontScaling={false} style={[styles.taskSub, { color: colors.textMuted }]}>
                      {task.description}
                    </Text>
                  ) : null}
                </View>
                {task.task_type !== "custom" && (
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* My Progress section */}
        <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
          My Progress
        </Text>
        <View style={styles.cardRow}>
          <MetricCard
            title="Scale Weight"
            subtitle={bodyStats?.date ? format(new Date(bodyStats.date), "d MMM yyyy") : "No data"}
            value={weightLbs}
            unit="lbs"
            onAdd={() => router.push({ pathname: "/(app)/log-progress", params: { date: format(selectedDate, "yyyy-MM-dd") } } as any)}
          />
          <MetricCard
            title="Body Fat"
            subtitle={bodyStats?.date ? format(new Date(bodyStats.date), "d MMM yyyy") : "No data"}
            value={bodyStats?.body_fat_pct != null ? `${bodyStats.body_fat_pct}` : "—"}
            unit="%"
            onAdd={() => router.push({ pathname: "/(app)/log-progress", params: { date: format(selectedDate, "yyyy-MM-dd") } } as any)}
          />
        </View>
        <View style={styles.cardRow}>
          <MetricCard
            title="Streak"
            subtitle={currentStreak > 0 ? "Keep it going" : "Start today"}
            value={`${currentStreak}`}
            unit={currentStreak === 1 ? "day" : "days"}
          />
          <MetricCard
            title="Workouts"
            subtitle="This week"
            value={`${workoutsThisWeek}`}
            unit={workoutsThisWeek === 1 ? "session" : "sessions"}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AvatarButton({ name, colors }: { name: string; colors: any }) {
  const navigation = useNavigation<any>();
  const initial = (name || "?").charAt(0).toUpperCase();

  const openDrawer = () => {
    try { navigation.openDrawer?.(); return; } catch {}
    try { navigation.getParent()?.openDrawer?.(); return; } catch {}
    try { navigation.getParent()?.getParent()?.openDrawer?.(); return; } catch {}
    router.push("/settings");
  };

  return (
    <Pressable onPress={openDrawer} style={[styles.avatar, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
      <Text allowFontScaling={false} style={[styles.avatarText, { color: colors.text }]}>{initial}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  greeting: { fontSize: 22, fontWeight: "600" },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontWeight: "600" },

  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  dateLabel: { fontSize: 16, fontWeight: "600" },
  todayLink: { fontSize: 14, fontWeight: "600" },

  dayStrip: { paddingHorizontal: spacing.sm, gap: 0, paddingBottom: spacing.sm },
  dayChip: {
    flex: 1,
    minWidth: 52,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: { fontSize: 16, fontWeight: "600" },
  dayLabel: { fontSize: 11, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2, position: "absolute", bottom: 4 },

  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

  taskList: { marginBottom: spacing.lg },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  taskDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  taskInfo: { flex: 1, gap: 1 },
  taskTitle: { fontSize: 15, fontWeight: "500" },
  taskSub: { fontSize: 13 },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: spacing.md },
  cardRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
});
