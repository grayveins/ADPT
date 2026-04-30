/**
 * Workout Preview Screen
 * 
 * Trainerize-style preview showing all exercises before starting.
 * Users can see what's planned, review previous performance,
 * and tap "Start Workout" to begin with timer.
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { spacing, layout } from "@/src/theme";
import { hapticSuccess } from "@/src/animations/feedback/haptics";

// Types
type Exercise = {
  name: string;
  sets: number;
  reps: string;
  rir?: number;
  muscleGroup?: string;
  notes?: string;
};

type ExerciseWithHistory = Exercise & {
  lastWeight?: number;
  lastReps?: number;
  lastDate?: string;
  isNew?: boolean;
};

type PreviousSet = {
  exercise_name: string;
  weight_lbs: number;
  reps: number;
  created_at: string;
};

// Muscle group icons mapping
const MUSCLE_ICONS: Record<string, { icon: string; color: string }> = {
  chest: { icon: "fitness", color: "#9CA3AF" },
  back: { icon: "body", color: "#9CA3AF" },
  shoulders: { icon: "barbell", color: "#9CA3AF" },
  arms: { icon: "hand-left", color: "#9CA3AF" },
  biceps: { icon: "hand-left", color: "#9CA3AF" },
  triceps: { icon: "hand-right", color: "#9CA3AF" },
  legs: { icon: "walk", color: "#9CA3AF" },
  quads: { icon: "walk", color: "#9CA3AF" },
  hamstrings: { icon: "walk", color: "#9CA3AF" },
  glutes: { icon: "walk", color: "#9CA3AF" },
  core: { icon: "body", color: "#9CA3AF" },
  abs: { icon: "body", color: "#9CA3AF" },
};

const getMuscleIcon = (muscleGroup?: string) => {
  const key = muscleGroup?.toLowerCase() || "chest";
  return MUSCLE_ICONS[key] || MUSCLE_ICONS.chest;
};

export default function WorkoutPreviewScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    type: string;
    name: string;
    exercises?: string;
    programId?: string;
  }>();
  

  const [loading, setLoading] = useState(true);
  const [exercisesWithHistory, setExercisesWithHistory] = useState<ExerciseWithHistory[]>([]);
  const [tips, setTips] = useState<string[]>([]);

  // Parse exercises from params
  const exercises: Exercise[] = useMemo(() => {
    if (params.exercises) {
      try {
        return JSON.parse(params.exercises);
      } catch {
        return [];
      }
    }
    return [];
  }, [params.exercises]);

  // Calculate estimated duration (from displayed exercises)
  const estimatedDuration = useMemo(() => {
    if (exercisesWithHistory.length === 0) return 45;
    // Rough estimate: 3 min per set (including rest)
    const totalSets = exercisesWithHistory.reduce((sum, ex) => sum + (ex.sets || 3), 0);
    return Math.round(totalSets * 3);
  }, [exercisesWithHistory]);

  // Get unique muscle groups (from displayed exercises)
  const muscleGroups = useMemo(() => {
    const groups = new Set<string>();
    exercisesWithHistory.forEach((ex) => {
      if (ex.muscleGroup) {
        groups.add(ex.muscleGroup);
      }
    });
    return Array.from(groups);
  }, [exercisesWithHistory]);

  // Fetch exercises from program and previous performance
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Parse exercises directly from params to avoid race conditions
      let workoutExercises: Exercise[] = [];
      if (params.exercises) {
        try {
          workoutExercises = JSON.parse(params.exercises);
        } catch {
          // Failed to parse exercises from params
        }
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setExercisesWithHistory([]);
          setLoading(false);
          return;
        }
        let programTips: string[] = [];

        // If no exercises passed, try to fetch from program
        if (workoutExercises.length === 0 && params.programId) {
          const { data: program } = await supabase
            .from("saved_programs")
            .select("program_data")
            .eq("id", params.programId)
            .single();

          if (program?.program_data) {
            const programData = program.program_data as any;
            
            // Find workout matching the type/name
            const workouts = programData.workouts || [];
            const matchingWorkout = workouts.find((w: any) => 
              w.name?.toLowerCase() === params.name?.toLowerCase() ||
              w.type?.toLowerCase() === params.type?.toLowerCase() ||
              w.name?.toLowerCase().includes(params.type?.toLowerCase())
            );

            if (matchingWorkout?.exercises) {
              workoutExercises = matchingWorkout.exercises;
            }

            if (programData.tips) {
              programTips = programData.tips.slice(0, 3);
            }
          }
        }

        // If still no exercises, try to fetch from active program
        if (workoutExercises.length === 0) {
          const { data: activeProgram } = await supabase
            .from("saved_programs")
            .select("program_data")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .single();

          if (activeProgram?.program_data) {
            const programData = activeProgram.program_data as any;
            const workouts = programData.workouts || [];
            
            // Find workout matching the type/name
            const matchingWorkout = workouts.find((w: any) => 
              w.name?.toLowerCase() === params.name?.toLowerCase() ||
              w.type?.toLowerCase() === params.type?.toLowerCase() ||
              w.name?.toLowerCase().includes(params.type?.toLowerCase())
            );

            if (matchingWorkout?.exercises) {
              workoutExercises = matchingWorkout.exercises;
            }

            if (programData.tips && programTips.length === 0) {
              programTips = programData.tips.slice(0, 3);
            }
          }
        }

        // Set tips
        if (programTips.length > 0) {
          setTips(programTips);
        }

        // If still no exercises, show empty state
        if (workoutExercises.length === 0) {
          setExercisesWithHistory([]);
          setLoading(false);
          return;
        }
        
        // Get exercise names
        const exerciseNames = workoutExercises.map((ex: Exercise) => ex.name);

        // Fetch last performance for each exercise
        const { data: previousSets } = await supabase
          .from("workout_sets")
          .select(`
            weight_lbs,
            reps,
            created_at,
            workout_exercises!inner(
              exercise_name,
              workout_sessions!inner(user_id)
            )
          `)
          .eq("workout_exercises.workout_sessions.user_id", user.id)
          .in("workout_exercises.exercise_name", exerciseNames)
          .order("created_at", { ascending: false });

        // Group by exercise and get most recent
        const lastPerformance = new Map<string, PreviousSet>();
        (previousSets || []).forEach((set: any) => {
          const name = set.workout_exercises?.exercise_name;
          if (name && !lastPerformance.has(name)) {
            lastPerformance.set(name, {
              exercise_name: name,
              weight_lbs: set.weight_lbs,
              reps: set.reps,
              created_at: set.created_at,
            });
          }
        });

        // Merge with exercises
        const merged = workoutExercises.map((ex: Exercise) => {
          const prev = lastPerformance.get(ex.name);
          return {
            ...ex,
            lastWeight: prev?.weight_lbs,
            lastReps: prev?.reps,
            lastDate: prev?.created_at,
            isNew: !prev,
          };
        });

        setExercisesWithHistory(merged);
      } catch (error) {
        console.error("Error fetching exercise data:", error);
        setExercisesWithHistory(exercises.map(ex => ({ ...ex, isNew: true })));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.exercises, params.programId, params.name, params.type, exercises]);

  // Start workout - navigate to active screen
  const handleStartWorkout = () => {
    hapticSuccess();
    
    // Use fetched exercises if original params didn't have them
    const exercisesToPass = params.exercises || 
      (exercisesWithHistory.length > 0 ? JSON.stringify(exercisesWithHistory.map(ex => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rir: ex.rir,
        muscleGroup: ex.muscleGroup,
        notes: ex.notes,
      }))) : undefined);
    
    router.replace({
      pathname: "/(workout)/active",
      params: {
        type: params.type,
        name: params.name,
        exercises: exercisesToPass,
        programId: params.programId,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {params.name || params.type || "Workout"}
          </Text>
        </View>
        <View style={[styles.durationBadge, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name="time-outline" size={14} color={colors.primary} />
          <Text allowFontScaling={false} style={[styles.durationText, { color: colors.primary }]}>
            {estimatedDuration} min
          </Text>
        </View>
      </View>

      {/* Muscle Groups */}
      {muscleGroups.length > 0 && (
        <View style={[styles.muscleGroupsBar, { borderBottomColor: colors.border }]}>
          <Text allowFontScaling={false} style={[styles.muscleGroupsText, { color: colors.textMuted }]}>
            {muscleGroups.join(" · ")}
          </Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise List */}
          <View style={styles.exerciseList}>
            {exercisesWithHistory.map((exercise, index) => {
              const muscleIcon = getMuscleIcon(exercise.muscleGroup);
              
              return (
                <Animated.View
                  key={`${exercise.name}-${index}`}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                  style={[styles.exerciseCard, { backgroundColor: colors.card }]}
                >
                  {/* Exercise Info */}
                  <View style={styles.exerciseInfo}>
                    <Text 
                      allowFontScaling={false} 
                      style={[styles.exerciseName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {exercise.name}
                    </Text>
                    
                    <View style={styles.exerciseMeta}>
                      <Text allowFontScaling={false} style={[styles.exerciseSets, { color: colors.textSecondary }]}>
                        {exercise.sets} sets × {exercise.reps}
                      </Text>
                      {exercise.rir !== undefined && (
                        <View style={[styles.rirBadge, { backgroundColor: colors.primaryMuted }]}>
                          <Text allowFontScaling={false} style={[styles.rirText, { color: colors.primary }]}>
                            RIR {exercise.rir}
                          </Text>
                        </View>
                      )}
                    </View>


                    {/* Notes */}
                    {exercise.notes && (
                      <Text 
                        allowFontScaling={false} 
                        style={[styles.exerciseNotes, { color: colors.textMuted }]}
                        numberOfLines={2}
                      >
                        {exercise.notes}
                      </Text>
                    )}
                  </View>

                  {/* Chevron */}
                  <Ionicons name="chevron-forward" size={18} color={colors.border} />
                </Animated.View>
              );
            })}
          </View>

          {/* Tips Section */}
          {tips.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(exercisesWithHistory.length * 50 + 100).duration(300)}
              style={[styles.tipsCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb-outline" size={18} color={colors.gold} />
                <Text allowFontScaling={false} style={[styles.tipsTitle, { color: colors.text }]}>
                  Coach Tips
                </Text>
              </View>
              {tips.map((tip, index) => (
                <View key={index} style={styles.tipRow}>
                  <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
                  <Text allowFontScaling={false} style={[styles.tipText, { color: colors.textSecondary }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Empty State */}
          {exercisesWithHistory.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={colors.textMuted} />
              <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
                No exercises planned
              </Text>
              <Text allowFontScaling={false} style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                You can add exercises after starting the workout
              </Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* Fixed Bottom Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <Pressable
          onPress={handleStartWorkout}
          style={({ pressed }) => [
            styles.startButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Ionicons name="play" size={22} color={colors.textOnPrimary} />
          <Text allowFontScaling={false} style={[styles.startButtonText, { color: colors.textOnPrimary }]}>
            Start Workout
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  // Muscle Groups Bar
  muscleGroupsBar: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  muscleGroupsText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    textTransform: "capitalize",
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
  },
  // Exercise List
  exerciseList: {
    gap: spacing.sm,
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.md,
  },
  exerciseThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseInfo: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  exerciseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  exerciseSets: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  rirBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rirText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  previousPerformance: {
    minHeight: 18,
  },
  previousText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  exerciseNotes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginTop: 2,
  },
  // Tips
  tipsCard: {
    borderRadius: 14,
    padding: spacing.base,
    marginTop: spacing.lg,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tipsTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: 14,
  },
  startButtonText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
});
