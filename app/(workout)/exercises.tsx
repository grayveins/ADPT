/**
 * Exercise Library — Database-driven
 * Browse, search, and select exercises from the Supabase exercises table.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";
import { useActiveWorkoutSafe } from "@/src/context/ActiveWorkoutContext";
import { useExercises, type DBExercise } from "@/src/hooks/useExercises";
import { spacing, radius } from "@/src/theme";

const MUSCLE_GROUPS = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "quadriceps", "hamstrings", "glutes", "calves",
  "abdominals", "lats", "traps", "forearms",
];

export default function ExercisesScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isAddMode = params.mode === "add";
  const workoutCtx = useActiveWorkoutSafe();
  const workoutActions = isAddMode ? workoutCtx?.actions ?? null : null;

  const { exercises, loading, search, setSearch, muscleFilter, setMuscleFilter } = useExercises();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExercise = useCallback((ex: DBExercise) => {
    hapticPress();
    if (isAddMode && workoutActions) {
      workoutActions.addExercise({
        name: ex.name,
        muscles: ex.primary_muscles || [],
        sets: [
          { id: `set-add-0`, weight: "", reps: "", completed: false, isWarmup: false, isPR: false },
          { id: `set-add-1`, weight: "", reps: "", completed: false, isWarmup: false, isPR: false },
          { id: `set-add-2`, weight: "", reps: "", completed: false, isWarmup: false, isPR: false },
        ],
        targetReps: "8-12",
        targetRIR: 2,
        notes: "",
        groupId: null,
        restTimerSeconds: 90,
      });
      hapticSuccess();
      router.back();
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(ex.name) ? next.delete(ex.name) : next.add(ex.name);
      return next;
    });
  }, [isAddMode, workoutActions]);

  const startWorkout = useCallback(() => {
    if (selected.size === 0) return;
    hapticSuccess();
    const exList = exercises
      .filter((e) => selected.has(e.name))
      .map((e) => ({ name: e.name, sets: 3, reps: "8-12", rir: 2, muscleGroup: e.primary_muscles?.[0] }));
    router.push({
      pathname: "/(workout)/preview",
      params: { type: "Custom", name: "Custom Workout", exercises: JSON.stringify(exList) },
    });
  }, [selected, exercises]);

  const renderExercise = useCallback(({ item: ex }: { item: DBExercise }) => {
    const isSelected = selected.has(ex.name);
    const isExpanded = expandedId === ex.id;
    return (
      <Pressable
        onPress={() => toggleExercise(ex)}
        onLongPress={() => setExpandedId(isExpanded ? null : ex.id)}
        style={[styles.exerciseRow, { borderBottomColor: colors.border }, isSelected && { backgroundColor: colors.primaryMuted }]}
      >
        <View style={styles.exerciseMain}>
          <Text allowFontScaling={false} style={[styles.exerciseName, { color: colors.text }]}>
            {ex.name}
          </Text>
          <View style={styles.tagRow}>
            {ex.equipment && (
              <Text allowFontScaling={false} style={[styles.tag, { color: colors.textMuted }]}>
                {ex.equipment}
              </Text>
            )}
            {ex.primary_muscles?.map((m) => (
              <Text key={m} allowFontScaling={false} style={[styles.tag, { color: colors.textSecondary }]}>
                {m}
              </Text>
            ))}
          </View>
          {isExpanded && ex.coaching_cues && ex.coaching_cues.length > 0 && (
            <View style={styles.cuesSection}>
              {ex.coaching_cues.map((cue, i) => (
                <Text key={i} allowFontScaling={false} style={[styles.cueText, { color: colors.textSecondary }]}>
                  • {cue}
                </Text>
              ))}
            </View>
          )}
        </View>
        {!isAddMode && (
          <View style={[styles.checkbox, isSelected && { backgroundColor: colors.text }]}>
            {isSelected && <Ionicons name="checkmark" size={14} color={colors.bg} />}
          </View>
        )}
        {isAddMode && <Ionicons name="add-circle-outline" size={22} color={colors.textMuted} />}
      </Pressable>
    );
  }, [selected, expandedId, isAddMode, colors, toggleExercise]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
          Exercises
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Muscle group filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        <Pressable
          onPress={() => setMuscleFilter(null)}
          style={[styles.filterChip, !muscleFilter && { backgroundColor: colors.text, borderColor: colors.text }]}
        >
          <Text allowFontScaling={false} style={[styles.filterText, { color: muscleFilter ? colors.textMuted : colors.bg }]}>
            All
          </Text>
        </Pressable>
        {MUSCLE_GROUPS.map((m) => (
          <Pressable
            key={m}
            onPress={() => setMuscleFilter(muscleFilter === m ? null : m)}
            style={[styles.filterChip, muscleFilter === m && { backgroundColor: colors.text, borderColor: colors.text }]}
          >
            <Text
              allowFontScaling={false}
              style={[styles.filterText, { color: muscleFilter === m ? colors.bg : colors.textMuted }]}
            >
              {m}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Exercise list */}
      <FlatList
        data={exercises}
        keyExtractor={(e) => e.id}
        renderItem={renderExercise}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
            {loading ? "Loading exercises..." : "No exercises found"}
          </Text>
        }
      />

      {/* Start workout bar */}
      {!isAddMode && selected.size > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
          <Pressable onPress={startWorkout} style={[styles.startButton, { backgroundColor: colors.text }]}>
            <Text allowFontScaling={false} style={[styles.startText, { color: colors.bg }]}>
              Start Workout ({selected.size})
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
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { fontSize: 18, fontWeight: "600" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filterScroll: { marginTop: spacing.sm, marginBottom: spacing.sm },
  filterContent: { paddingHorizontal: spacing.lg, gap: 6, alignItems: "center" },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterText: { fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  list: { paddingBottom: 100 },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  exerciseMain: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "500" },
  tagRow: { flexDirection: "row", gap: 8, marginTop: 2, flexWrap: "wrap" },
  tag: { fontSize: 11, textTransform: "capitalize" },
  cuesSection: { marginTop: spacing.sm, gap: 2 },
  cueText: { fontSize: 12, lineHeight: 17 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
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
    alignItems: "center",
    justifyContent: "center",
  },
  startText: { fontSize: 16, fontWeight: "600" },
});
