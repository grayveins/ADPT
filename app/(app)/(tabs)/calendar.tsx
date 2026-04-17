import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";
import { supabase } from "@/lib/supabase";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";

type SessionEvent = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  notes: string | null;
  status: string;
};

type WorkoutEvent = {
  id: string;
  started_at: string;
  title: string | null;
};

export default function CalendarScreen() {
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState<SessionEvent[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const monthStart = startOfMonth(currentMonth).toISOString();
    const monthEnd = endOfMonth(currentMonth).toISOString();

    const [sessionRes, workoutRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, scheduled_at, duration_minutes, location, notes, status")
        .eq("client_id", user.id)
        .gte("scheduled_at", monthStart)
        .lte("scheduled_at", monthEnd)
        .order("scheduled_at"),
      supabase
        .from("workout_sessions")
        .select("id, started_at, title")
        .eq("user_id", user.id)
        .gte("started_at", monthStart)
        .lte("started_at", monthEnd)
        .order("started_at"),
    ]);

    if (sessionRes.data) setSessions(sessionRes.data);
    if (workoutRes.data) setWorkouts(workoutRes.data);
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const sessionDates = useMemo(
    () => new Set(sessions.map((s) => format(new Date(s.scheduled_at), "yyyy-MM-dd"))),
    [sessions]
  );
  const workoutDates = useMemo(
    () => new Set(workouts.map((w) => format(new Date(w.started_at), "yyyy-MM-dd"))),
    [workouts]
  );

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const dayEvents = useMemo(() => {
    const daySessions = sessions.filter(
      (s) => format(new Date(s.scheduled_at), "yyyy-MM-dd") === selectedDateStr
    );
    const dayWorkouts = workouts.filter(
      (w) => format(new Date(w.started_at), "yyyy-MM-dd") === selectedDateStr
    );
    return { sessions: daySessions, workouts: dayWorkouts };
  }, [sessions, workouts, selectedDateStr]);

  const today = new Date();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Month header */}
      <View style={styles.monthHeader}>
        <Pressable onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text allowFontScaling={false} style={[styles.monthTitle, { color: colors.text }]}>
          {format(currentMonth, "MMMM yyyy")}
        </Text>
        <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} hitSlop={12}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.weekHeader}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <Text key={i} allowFontScaling={false} style={[styles.weekDay, { color: colors.textMuted }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, i) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const inMonth = isSameMonth(day, currentMonth);
          const hasSession = sessionDates.has(dateStr);
          const hasWorkout = workoutDates.has(dateStr);

          return (
            <Pressable
              key={i}
              onPress={() => setSelectedDate(day)}
              style={[
                styles.dayCell,
                isSelected && { backgroundColor: colors.text },
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.dayText,
                  { color: inMonth ? colors.text : colors.textMuted },
                  isToday && !isSelected && { fontWeight: "700" },
                  isSelected && { color: colors.bg, fontWeight: "700" },
                ]}
              >
                {format(day, "d")}
              </Text>
              {(hasSession || hasWorkout) && (
                <View style={styles.dotRow}>
                  {hasSession && (
                    <View style={[styles.dot, { backgroundColor: isSelected ? colors.bg : colors.text }]} />
                  )}
                  {hasWorkout && (
                    <View style={[styles.dot, { backgroundColor: isSelected ? colors.bg : colors.textMuted }]} />
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Selected day events */}
      <ScrollView
        style={styles.eventList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        <Text allowFontScaling={false} style={[styles.dateLabel, { color: colors.textSecondary }]}>
          {format(selectedDate, "EEEE, MMM d")}
        </Text>

        {dayEvents.sessions.map((s) => (
          <View key={s.id} style={[styles.eventCard, { backgroundColor: colors.bgSecondary }]}>
            <Ionicons name="person-outline" size={18} color={colors.text} />
            <View style={styles.eventInfo}>
              <Text allowFontScaling={false} style={[styles.eventTitle, { color: colors.text }]}>
                Session — {s.duration_minutes} min
              </Text>
              {s.location && (
                <Text allowFontScaling={false} style={[styles.eventMeta, { color: colors.textMuted }]}>
                  {s.location}
                </Text>
              )}
              <Text allowFontScaling={false} style={[styles.eventMeta, { color: colors.textMuted }]}>
                {format(new Date(s.scheduled_at), "h:mm a")}
              </Text>
            </View>
          </View>
        ))}

        {dayEvents.workouts.map((w) => (
          <View key={w.id} style={[styles.eventCard, { backgroundColor: colors.bgSecondary }]}>
            <Ionicons name="barbell-outline" size={18} color={colors.text} />
            <View style={styles.eventInfo}>
              <Text allowFontScaling={false} style={[styles.eventTitle, { color: colors.text }]}>
                {w.title || "Workout"}
              </Text>
              <Text allowFontScaling={false} style={[styles.eventMeta, { color: colors.textMuted }]}>
                {format(new Date(w.started_at), "h:mm a")}
              </Text>
            </View>
          </View>
        ))}

        {dayEvents.sessions.length === 0 && dayEvents.workouts.length === 0 && !loading && (
          <Text allowFontScaling={false} style={[styles.noEvents, { color: colors.textMuted }]}>
            Nothing scheduled
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.base,
  },
  monthTitle: { fontSize: 20, fontWeight: "600" },
  weekHeader: { flexDirection: "row", marginBottom: spacing.xs },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
  },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  dayText: { fontSize: 15 },
  dotRow: { flexDirection: "row", gap: 3, marginTop: 2, position: "absolute", bottom: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  eventList: { flex: 1, marginTop: spacing.base },
  dateLabel: { fontSize: 14, fontWeight: "500", marginBottom: spacing.md },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: radius.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: "500" },
  eventMeta: { fontSize: 13, marginTop: 2 },
  noEvents: { fontSize: 14, textAlign: "center", marginTop: spacing.xl },
});
