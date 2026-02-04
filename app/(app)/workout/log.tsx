/**
 * Log Workout Screen - Hevy-style Workout Builder
 * 
 * Build a workout from scratch:
 * - Add exercises from library
 * - Add sets with weight/reps
 * - Save to history
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { defaultExercises, muscleGroups } from "@/lib/exercises";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";
import { showToast, ToastContainer } from "@/src/animations/celebrations";
import { usePRs } from "@/src/hooks/usePRs";

type SetData = {
  id: string;
  weight: string;
  reps: string;
};

type WorkoutExercise = {
  id: string;
  name: string;
  category: string;
  sets: SetData[];
};

// Exercise picker config
const muscleGroupConfig: Record<string, { icon: string; color: string }> = {
  "Chest": { icon: "body-outline", color: "#FF6B6B" },
  "Back": { icon: "fitness-outline", color: "#4ECDC4" },
  "Shoulders": { icon: "triangle-outline", color: "#45B7D1" },
  "Arms": { icon: "barbell-outline", color: "#96CEB4" },
  "Legs": { icon: "walk-outline", color: "#FFEAA7" },
  "Core": { icon: "radio-button-on-outline", color: "#DDA0DD" },
  "Full Body": { icon: "body", color: "#00C9B7" },
  "Cardio": { icon: "heart-outline", color: "#FF6B35" },
};

export default function LogWorkoutScreen() {
  const { colors } = useTheme();
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // PR detection hook
  const { checkPR } = usePRs(userId);
  
  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);
  
  // Exercise picker modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerCategory, setPickerCategory] = useState<string | null>(null);

  // Filtered exercises for picker
  const filteredExercises = useMemo(() => {
    let list = defaultExercises;
    
    if (pickerCategory) {
      list = list.filter((ex) => ex.category === pickerCategory);
    }
    
    if (pickerSearch.trim()) {
      const query = pickerSearch.toLowerCase();
      list = list.filter((ex) => 
        ex.name.toLowerCase().includes(query) ||
        ex.category.toLowerCase().includes(query)
      );
    }
    
    return list;
  }, [pickerSearch, pickerCategory]);

  // Add exercise to workout
  const addExercise = useCallback((exercise: typeof defaultExercises[0]) => {
    hapticPress();
    setExercises((prev) => [
      ...prev,
      {
        id: `${exercise.id}-${Date.now()}`,
        name: exercise.name,
        category: exercise.category,
        sets: [{ id: `set-1`, weight: "", reps: "" }],
      },
    ]);
    setPickerOpen(false);
    setPickerSearch("");
    setPickerCategory(null);
  }, []);

  // Remove exercise
  const removeExercise = useCallback((exerciseId: string) => {
    hapticPress();
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  }, []);

  // Add set to exercise
  const addSet = useCallback((exerciseId: string) => {
    hapticPress();
    setExercises((prev) => prev.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      const newSetNum = ex.sets.length + 1;
      return {
        ...ex,
        sets: [...ex.sets, { id: `set-${newSetNum}`, weight: "", reps: "" }],
      };
    }));
  }, []);

  // Remove set from exercise
  const removeSet = useCallback((exerciseId: string, setId: string) => {
    hapticPress();
    setExercises((prev) => prev.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      if (ex.sets.length <= 1) return ex; // Keep at least one set
      return {
        ...ex,
        sets: ex.sets.filter((s) => s.id !== setId),
      };
    }));
  }, []);

  // Update set value
  const updateSet = useCallback((exerciseId: string, setId: string, field: "weight" | "reps", value: string) => {
    setExercises((prev) => prev.map((ex) => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s) => 
          s.id === setId ? { ...s, [field]: value } : s
        ),
      };
    }));
  }, []);

  // Save workout
  const saveWorkout = async () => {
    if (exercises.length === 0) {
      Alert.alert("Add exercises", "Add at least one exercise to your workout.");
      return;
    }

    // Check if any exercise has completed sets
    const hasCompletedSets = exercises.some((ex) => 
      ex.sets.some((s) => s.weight && s.reps)
    );

    if (!hasCompletedSets) {
      Alert.alert("Add sets", "Fill in weight and reps for at least one set.");
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "Please sign in to save workouts.");
        setSaving(false);
        return;
      }

      const now = new Date().toISOString();
      const title = workoutName.trim() || exercises.map((ex) => ex.name).slice(0, 2).join(", ");

      // 1. Create workout session
      const { data: sessionData, error: sessionError } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: user.id,
          title,
          started_at: now,
          ended_at: now,
        })
        .select("id")
        .single();

      if (sessionError) throw sessionError;
      const sessionId = sessionData.id;

      // 2. Save each exercise and its sets
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        const completedSets = exercise.sets.filter((s) => s.weight && s.reps);
        
        if (completedSets.length === 0) continue;

        // Insert exercise
        const { data: exerciseData, error: exerciseError } = await supabase
          .from("workout_exercises")
          .insert({
            session_id: sessionId,
            exercise_name: exercise.name,
            muscle_group: exercise.category,
            order_index: i,
          })
          .select("id")
          .single();

        if (exerciseError) {
          console.error("Error saving exercise:", exerciseError);
          continue;
        }

        // Insert sets with PR detection
        const setsToInsert = completedSets.map((set, setIndex) => {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps, 10) || 0;
          const { isPR } = checkPR(exercise.name, weight, reps);
          
          return {
            workout_exercise_id: exerciseData.id,
            set_number: setIndex + 1,
            weight_lbs: weight,
            reps: reps,
            rir: null,
            is_warmup: false,
            is_pr: isPR && weight > 0 && reps > 0,
          };
        });

        const { error: setsError } = await supabase
          .from("workout_sets")
          .insert(setsToInsert);

        if (setsError) {
          console.error("Error saving sets:", setsError);
        }
      }

      // 3. Update streak
      const { error: streakError } = await supabase.rpc("update_user_streak", {
        p_user_id: user.id,
      });

      if (streakError) {
        console.error("Error updating streak:", streakError);
      }

      hapticSuccess();
      showToast({ message: "Workout saved!", type: "setComplete" });
      
      setTimeout(() => {
        router.back();
      }, 500);

    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save workout. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Total stats
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const filledSets = exercises.reduce((acc, ex) => 
    acc + ex.sets.filter((s) => s.weight && s.reps).length, 0
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
          Log Workout
        </Text>
        <Pressable 
          onPress={saveWorkout} 
          disabled={saving}
          style={styles.headerButton}
        >
          <Text allowFontScaling={false} style={[
            styles.saveText, 
            { color: colors.primary },
            saving && { opacity: 0.5 }
          ]}>
            {saving ? "..." : "Save"}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Workout Name */}
          <View style={styles.nameSection}>
            <TextInput
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="Workout name (optional)"
              placeholderTextColor={colors.textMuted}
              style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.border }]}
            />
          </View>

          {/* Stats bar */}
          {exercises.length > 0 && (
            <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
              <View style={styles.stat}>
                <Text allowFontScaling={false} style={[styles.statValue, { color: colors.text }]}>
                  {exercises.length}
                </Text>
                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textMuted }]}>
                  exercises
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text allowFontScaling={false} style={[styles.statValue, { color: colors.text }]}>
                  {filledSets}/{totalSets}
                </Text>
                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textMuted }]}>
                  sets filled
                </Text>
              </View>
            </View>
          )}

          {/* Exercises */}
          {exercises.map((exercise, exerciseIndex) => (
            <Animated.View
              key={exercise.id}
              entering={FadeInDown.delay(exerciseIndex * 50).duration(300)}
              style={[styles.exerciseCard, { backgroundColor: colors.card }]}
            >
              {/* Exercise header */}
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                  <Text allowFontScaling={false} style={[styles.exerciseName, { color: colors.text }]}>
                    {exercise.name}
                  </Text>
                  <Text allowFontScaling={false} style={[styles.exerciseCategory, { color: colors.textMuted }]}>
                    {exercise.category}
                  </Text>
                </View>
                <Pressable 
                  onPress={() => removeExercise(exercise.id)}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.intensity} />
                </Pressable>
              </View>

              {/* Sets header */}
              <View style={styles.setsHeader}>
                <Text allowFontScaling={false} style={[styles.setHeaderText, { color: colors.textMuted }]}>
                  SET
                </Text>
                <Text allowFontScaling={false} style={[styles.setHeaderText, { color: colors.textMuted }]}>
                  LBS
                </Text>
                <Text allowFontScaling={false} style={[styles.setHeaderText, { color: colors.textMuted }]}>
                  REPS
                </Text>
                <View style={{ width: 24 }} />
              </View>

              {/* Sets */}
              {exercise.sets.map((set, setIndex) => (
                <View key={set.id} style={styles.setRow}>
                  <View style={[styles.setNumber, { backgroundColor: colors.border }]}>
                    <Text allowFontScaling={false} style={[styles.setNumberText, { color: colors.text }]}>
                      {setIndex + 1}
                    </Text>
                  </View>
                  <TextInput
                    value={set.weight}
                    onChangeText={(v) => updateSet(exercise.id, set.id, "weight", v)}
                    placeholder="0"
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="numeric"
                    style={[styles.setInput, { backgroundColor: colors.cardAlt, color: colors.text }]}
                  />
                  <TextInput
                    value={set.reps}
                    onChangeText={(v) => updateSet(exercise.id, set.id, "reps", v)}
                    placeholder="0"
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="numeric"
                    style={[styles.setInput, { backgroundColor: colors.cardAlt, color: colors.text }]}
                  />
                  <Pressable 
                    onPress={() => removeSet(exercise.id, set.id)}
                    hitSlop={8}
                    style={styles.removeSetButton}
                  >
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              ))}

              {/* Add set button */}
              <Pressable 
                onPress={() => addSet(exercise.id)}
                style={[styles.addSetButton, { borderColor: colors.border }]}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text allowFontScaling={false} style={[styles.addSetText, { color: colors.primary }]}>
                  Add Set
                </Text>
              </Pressable>
            </Animated.View>
          ))}

          {/* Add exercise button */}
          <Pressable
            onPress={() => {
              hapticPress();
              setPickerOpen(true);
            }}
            style={[styles.addExerciseButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.addExerciseIcon, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </View>
            <Text allowFontScaling={false} style={[styles.addExerciseText, { color: colors.text }]}>
              Add Exercise
            </Text>
          </Pressable>

          {/* Empty state */}
          {exercises.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={colors.border} />
              <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
                Start by adding exercises
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Exercise Picker Modal */}
      <Modal visible={pickerOpen} animationType="slide" transparent>
        <KeyboardAvoidingView 
          style={styles.pickerOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.pickerBackdrop} onPress={() => setPickerOpen(false)} />
          <View style={[styles.pickerSheet, { backgroundColor: colors.bg }]}>
            {/* Picker header */}
            <View style={styles.pickerHeader}>
              <Text allowFontScaling={false} style={[styles.pickerTitle, { color: colors.text }]}>
                Add Exercise
              </Text>
              <Pressable onPress={() => setPickerOpen(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Search */}
            <View style={[styles.pickerSearch, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={pickerSearch}
                onChangeText={setPickerSearch}
                placeholder="Search exercises..."
                placeholderTextColor={colors.textMuted}
                style={[styles.pickerSearchInput, { color: colors.text }]}
                autoCapitalize="none"
              />
              {pickerSearch.length > 0 && (
                <Pressable onPress={() => setPickerSearch("")}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Category chips */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              <Pressable
                onPress={() => setPickerCategory(null)}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  !pickerCategory && { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
                ]}
              >
                <Text allowFontScaling={false} style={[
                  styles.categoryChipText,
                  { color: colors.textMuted },
                  !pickerCategory && { color: colors.primary },
                ]}>
                  All
                </Text>
              </Pressable>
              {muscleGroups.map((group) => (
                <Pressable
                  key={group}
                  onPress={() => setPickerCategory(pickerCategory === group ? null : group)}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    pickerCategory === group && { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
                  ]}
                >
                  <Text allowFontScaling={false} style={[
                    styles.categoryChipText,
                    { color: colors.textMuted },
                    pickerCategory === group && { color: colors.primary },
                  ]}>
                    {group}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Exercise list */}
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
              {filteredExercises.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  onPress={() => addExercise(exercise)}
                  style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.pickerItemInfo}>
                    <Text allowFontScaling={false} style={[styles.pickerItemName, { color: colors.text }]}>
                      {exercise.name}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.pickerItemCategory, { color: colors.textMuted }]}>
                      {exercise.category}
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                </Pressable>
              ))}
              
              {filteredExercises.length === 0 && (
                <View style={styles.pickerEmpty}>
                  <Text allowFontScaling={false} style={[styles.pickerEmptyText, { color: colors.textMuted }]}>
                    No exercises found
                  </Text>
                </View>
              )}
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ToastContainer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  saveText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  
  // Name input
  nameSection: {
    marginBottom: 20,
  },
  nameInput: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  
  // Stats bar
  statsBar: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  
  // Exercise card
  exerciseCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  exerciseCategory: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  
  // Sets
  setsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
    gap: 8,
  },
  setHeaderText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    flex: 1,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  setNumber: {
    width: 32,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  setNumberText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  setInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  removeSetButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 8,
  },
  addSetText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  
  // Add exercise
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 12,
  },
  addExerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addExerciseText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  
  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  
  // Picker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  pickerSearch: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  categoryRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  pickerList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  pickerItemCategory: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  pickerEmpty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  pickerEmptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
