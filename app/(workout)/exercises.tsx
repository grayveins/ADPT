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
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";
import { useExercises, type DBExercise } from "@/src/hooks/useExercises";
import { spacing, radius } from "@/src/theme";

export const ADD_EXERCISE_EVENT = "workout:addExercise";

const MUSCLE_GROUPS: { id: string; label: string; muscles: string[] }[] = [
  { id: "chest", label: "Chest", muscles: ["chest"] },
  { id: "back", label: "Back", muscles: ["lats", "middle back", "lower back", "traps"] },
  { id: "shoulders", label: "Shoulders", muscles: ["shoulders"] },
  { id: "arms", label: "Arms", muscles: ["biceps", "triceps", "forearms"] },
  { id: "core", label: "Core", muscles: ["abdominals"] },
  { id: "legs", label: "Legs", muscles: ["quadriceps", "hamstrings", "glutes", "calves"] },
];

type RowProps = {
  ex: DBExercise;
  isSelected: boolean;
  isExpanded: boolean;
  isAddMode: boolean;
  onPress: (ex: DBExercise) => void;
  onToggleExpand: (id: string) => void;
};

const ExerciseRow = React.memo(function ExerciseRow({ ex, isSelected, isExpanded, isAddMode, onPress, onToggleExpand }: RowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onPress(ex)}
      onLongPress={() => onToggleExpand(ex.id)}
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
});

export default function ExercisesScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isAddMode = params.mode === "add";

  const { exercises, loading, search, setSearch, muscleFilter, setMuscleFilter } = useExercises();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExercise = useCallback((ex: DBExercise) => {
    hapticPress();
    if (isAddMode) {
      // The active-workout provider is mounted in active.tsx, not above this
      // sibling stack screen, so we can't dispatch directly. Emit an event;
      // active.tsx subscribes and dispatches addExercise.
      DeviceEventEmitter.emit(ADD_EXERCISE_EVENT, {
        name: ex.name,
        muscles: ex.primary_muscles || [],
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
  }, [isAddMode]);

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

  const onToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const renderExercise = useCallback(({ item: ex }: { item: DBExercise }) => (
    <ExerciseRow
      ex={ex}
      isSelected={selected.has(ex.name)}
      isExpanded={expandedId === ex.id}
      isAddMode={isAddMode}
      onPress={toggleExercise}
      onToggleExpand={onToggleExpand}
    />
  ), [selected, expandedId, isAddMode, toggleExercise, onToggleExpand]);

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <Pressable
          onPress={() => setMuscleFilter(null)}
          style={[styles.filterChip, !muscleFilter && { backgroundColor: colors.text, borderColor: colors.text }]}
        >
          <Text allowFontScaling={false} style={[styles.filterText, { color: muscleFilter ? colors.textMuted : colors.bg }]}>
            All
          </Text>
        </Pressable>
        {MUSCLE_GROUPS.map((g) => {
          const isActive = muscleFilter?.[0] === g.muscles[0] && muscleFilter?.length === g.muscles.length;
          return (
            <Pressable
              key={g.id}
              onPress={() => setMuscleFilter(isActive ? null : g.muscles)}
              style={[styles.filterChip, isActive && { backgroundColor: colors.text, borderColor: colors.text }]}
            >
              <Text
                allowFontScaling={false}
                style={[styles.filterText, { color: isActive ? colors.bg : colors.textMuted }]}
              >
                {g.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Exercise list */}
      <FlatList
        data={exercises}
        keyExtractor={(e) => e.id}
        renderItem={renderExercise}
        style={styles.listFlex}
        contentContainerStyle={styles.list}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
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
  filterScroll: { marginTop: spacing.md, marginBottom: spacing.sm, flexGrow: 0 },
  filterContent: { paddingHorizontal: spacing.lg, paddingVertical: 10, gap: 6 },
  filterChip: {
    height: 36,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterText: { fontSize: 13, lineHeight: 16, fontWeight: "500", textTransform: "capitalize" },
  listFlex: { flex: 1 },
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
