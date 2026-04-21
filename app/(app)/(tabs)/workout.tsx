import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { hapticPress } from "@/src/animations/feedback/haptics";
import { spacing, radius } from "@/src/theme";

type PhaseWorkout = {
  id: string;
  day_number: number;
  name: string;
  exercises: any[];
};

export default function WorkoutScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [programName, setProgramName] = useState<string | null>(null);
  const [phaseName, setPhaseName] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<PhaseWorkout[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<PhaseWorkout | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const fetchProgram = useCallback(async () => {
    if (!userId) return;
    const { data: program } = await supabase
      .from("coaching_programs")
      .select("id, name, program_phases(id, name, phase_number, status, phase_workouts(id, day_number, name, exercises))")
      .eq("client_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!program) {
      setProgramName(null);
      setPhaseName(null);
      setWorkouts([]);
      setTodayWorkout(null);
      return;
    }

    setProgramName(program.name);

    const activePhase = (program as any).program_phases
      ?.sort((a: any, b: any) => a.phase_number - b.phase_number)
      ?.find((p: any) => p.status === "active");

    if (!activePhase) {
      setPhaseName(null);
      setWorkouts([]);
      setTodayWorkout(null);
      return;
    }

    setPhaseName(activePhase.name);
    const phaseWorkouts = (activePhase.phase_workouts ?? []).sort(
      (a: any, b: any) => a.day_number - b.day_number
    );
    setWorkouts(phaseWorkouts);

    const dayOfWeek = new Date().getDay() || 7;
    const todayW = phaseWorkouts.find((w: any) => w.day_number === dayOfWeek);
    setTodayWorkout(todayW || null);
  }, [userId]);

  useEffect(() => { fetchProgram(); }, [fetchProgram]);
  useFocusEffect(useCallback(() => { fetchProgram(); }, [fetchProgram]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProgram();
    setRefreshing(false);
  }, [fetchProgram]);

  const startEmptyWorkout = () => {
    hapticPress();
    router.push({ pathname: "/(workout)/active", params: { name: "Workout", sourceType: "empty" } });
  };

  const startWorkout = (workout: PhaseWorkout) => {
    hapticPress();
    router.push({
      pathname: "/(workout)/active",
      params: {
        name: workout.name,
        exercises: JSON.stringify(workout.exercises || []),
        sourceType: "program",
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text }]}>
          Workouts
        </Text>
        <Pressable onPress={startEmptyWorkout} hitSlop={8}>
          <Ionicons name="add" size={26} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {/* Today's Workout */}
        {todayWorkout ? (
          <Pressable
            onPress={() => startWorkout(todayWorkout)}
            style={[styles.todayCard, { backgroundColor: colors.text }]}
          >
            <Text allowFontScaling={false} style={[styles.todayLabel, { color: colors.bgSecondary }]}>
              TODAY
            </Text>
            <Text allowFontScaling={false} style={[styles.todayName, { color: colors.bg }]}>
              {todayWorkout.name}
            </Text>
            {todayWorkout.exercises?.length > 0 && (
              <Text allowFontScaling={false} numberOfLines={1} style={[styles.todayExercises, { color: colors.bgSecondary }]}>
                {todayWorkout.exercises.map((e: any) => e.name || e.exercise_name).join(", ")}
              </Text>
            )}
            <View style={styles.todayStart}>
              <Text allowFontScaling={false} style={[styles.todayStartText, { color: colors.bg }]}>
                Start Workout
              </Text>
              <Ionicons name="play" size={16} color={colors.bg} />
            </View>
          </Pressable>
        ) : (
          <Pressable
            onPress={startEmptyWorkout}
            style={[styles.todayCard, { backgroundColor: colors.bgSecondary }]}
          >
            <Text allowFontScaling={false} style={[styles.todayLabel, { color: colors.textMuted }]}>
              NO WORKOUT SCHEDULED
            </Text>
            <Text allowFontScaling={false} style={[styles.todayName, { color: colors.text }]}>
              Start an Empty Workout
            </Text>
          </Pressable>
        )}

        {/* Program Workouts */}
        {programName && workouts.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
                {programName}
              </Text>
              {phaseName && (
                <Text allowFontScaling={false} style={[styles.phaseLabel, { color: colors.textMuted }]}>
                  {phaseName}
                </Text>
              )}
            </View>

            {workouts.map((workout) => {
              const exerciseCount = workout.exercises?.length || 0;
              const totalSets = (workout.exercises || []).reduce((s: number, e: any) => s + (e.sets || 0), 0);
              return (
                <Pressable
                  key={workout.id}
                  onPress={() => startWorkout(workout)}
                  style={[styles.workoutCard, { backgroundColor: colors.bgSecondary }]}
                >
                  <View style={styles.workoutInfo}>
                    <View style={styles.workoutDayRow}>
                      <Text allowFontScaling={false} style={[styles.workoutDay, { color: colors.textMuted }]}>
                        Day {workout.day_number}
                      </Text>
                      <Text allowFontScaling={false} style={[styles.workoutName, { color: colors.text }]}>
                        {workout.name}
                      </Text>
                    </View>
                    {exerciseCount > 0 && (
                      <Text allowFontScaling={false} numberOfLines={1} style={[styles.workoutMeta, { color: colors.textMuted }]}>
                        {exerciseCount} exercises · {totalSets} sets
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
        )}

        {/* More */}
        <View style={styles.moreSection}>
          <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
            More
          </Text>
          <MoreRow icon="add-outline" label="Empty Workout" onPress={startEmptyWorkout} colors={colors} />
          <MoreRow icon="time-outline" label="Workout History" onPress={() => router.push("/(workout)/history")} colors={colors} />
          <MoreRow icon="barbell-outline" label="Exercise Library" onPress={() => router.push("/(workout)/exercises")} colors={colors} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MoreRow({ icon, label, onPress, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable onPress={onPress} style={styles.moreRow}>
      <Ionicons name={icon} size={18} color={colors.text} />
      <Text allowFontScaling={false} style={[styles.moreLabel, { color: colors.text }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTitle: { fontSize: 28, fontWeight: "700" },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

  todayCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  todayLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  todayName: { fontSize: 20, fontWeight: "700", marginTop: 4 },
  todayExercises: { fontSize: 13, marginTop: 6, opacity: 0.7 },
  todayStart: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  todayStartText: { fontSize: 15, fontWeight: "600" },

  sectionHeader: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  phaseLabel: { fontSize: 13, marginTop: 2 },

  workoutCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  workoutInfo: { flex: 1, gap: 2 },
  workoutDayRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  workoutDay: { fontSize: 12, fontWeight: "500" },
  workoutName: { fontSize: 15, fontWeight: "600" },
  workoutMeta: { fontSize: 12 },

  moreSection: { marginTop: spacing.xl },
  moreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: spacing.md,
  },
  moreLabel: { flex: 1, fontSize: 15 },
});
