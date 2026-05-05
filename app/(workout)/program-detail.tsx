import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

type Exercise = {
  name: string;
  exercise_name?: string;
  sets: number;
  reps: string;
  rir?: number;
  rest_seconds?: number;
  notes?: string;
  muscleGroup?: string;
  primary_muscles?: string[];
};

export default function ProgramDetailScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    name?: string;
    exercises?: string;
    phaseName?: string;
    dayNumber?: string;
    sessionDate?: string;
  }>();

  const workoutName = params.name || "Workout";
  const phaseName = params.phaseName || "";
  const dayNumber = params.dayNumber || "";

  const exercises: Exercise[] = useMemo(() => {
    if (!params.exercises) return [];
    try { return JSON.parse(params.exercises); }
    catch { return []; }
  }, [params.exercises]);

  const totalSets = exercises.reduce((s, e) => s + (e.sets || 0), 0);
  const estMinutes = Math.round(totalSets * 2.5);

  const startWorkout = () => {
    hapticPress();
    router.push({
      pathname: "/(workout)/active",
      params: {
        name: workoutName,
        exercises: params.exercises || "[]",
        sourceType: "program",
        ...(params.sessionDate ? { sessionDate: params.sessionDate } : {}),
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text }]}>
            {workoutName}
          </Text>
          <Text allowFontScaling={false} style={[styles.headerSub, { color: colors.textMuted }]}>
            {exercises.length} exercises · ~{estMinutes} min
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {phaseName ? (
        <Text allowFontScaling={false} style={[styles.phaseLabel, { color: colors.textMuted }]}>
          {phaseName}{dayNumber ? ` · Day ${dayNumber}` : ""}
        </Text>
      ) : null}

      {/* Exercise list */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {exercises.map((ex, i) => (
          <View key={i} style={[styles.exerciseRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.exerciseNumber, { backgroundColor: colors.bgSecondary }]}>
              <Text allowFontScaling={false} style={[styles.numberText, { color: colors.text }]}>
                {i + 1}
              </Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text allowFontScaling={false} style={[styles.exerciseName, { color: colors.text }]}>
                {ex.name || ex.exercise_name}
              </Text>
              <Text allowFontScaling={false} style={[styles.exerciseMeta, { color: colors.textMuted }]}>
                {ex.sets} sets × {ex.reps} reps{ex.rir != null ? ` · RIR ${ex.rir}` : ""}
              </Text>
              {ex.rest_seconds ? (
                <Text allowFontScaling={false} style={[styles.exerciseRest, { color: colors.textMuted }]}>
                  Rest: {ex.rest_seconds}s
                </Text>
              ) : null}
              {(ex.muscleGroup || ex.primary_muscles?.length) ? (
                <Text allowFontScaling={false} style={[styles.exerciseMuscle, { color: colors.textSecondary }]}>
                  {ex.muscleGroup || ex.primary_muscles?.join(", ")}
                </Text>
              ) : null}
              {ex.notes ? (
                <Text allowFontScaling={false} style={[styles.exerciseNotes, { color: colors.textSecondary }]}>
                  {ex.notes}
                </Text>
              ) : null}
            </View>
          </View>
        ))}

        {exercises.length === 0 && (
          <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
            No exercises in this workout
          </Text>
        )}
      </ScrollView>

      {/* Start button */}
      {exercises.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
          <Pressable onPress={startWorkout} style={[styles.startButton, { backgroundColor: colors.text }]}>
            <Ionicons name="play" size={18} color={colors.bg} />
            <Text allowFontScaling={false} style={[styles.startText, { color: colors.bg }]}>
              START WORKOUT
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  headerSub: { fontSize: 13, marginTop: 2 },
  phaseLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  exerciseRow: {
    flexDirection: "row",
    paddingVertical: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  numberText: { fontSize: 14, fontWeight: "600" },
  exerciseInfo: { flex: 1, gap: 2 },
  exerciseName: { fontSize: 16, fontWeight: "600" },
  exerciseMeta: { fontSize: 13 },
  exerciseRest: { fontSize: 12 },
  exerciseMuscle: { fontSize: 12, textTransform: "capitalize", marginTop: 2 },
  exerciseNotes: { fontSize: 12, fontStyle: "italic", marginTop: 4 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 14 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: 34,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  startButton: {
    height: 52,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  startText: { fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});
