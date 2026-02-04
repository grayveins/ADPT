/**
 * Workout History Screen
 * View past workouts with full details
 */

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { format, parseISO, differenceInMinutes, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { hapticPress } from "@/src/animations/feedback/haptics";
import { ErrorState } from "@/src/components/ErrorState";

// Types
type WorkoutSet = {
  id: string;
  set_number: number;
  weight_lbs: number | null;
  reps: number | null;
  rir: number | null;
  is_pr: boolean;
};

type WorkoutExercise = {
  id: string;
  exercise_name: string;
  muscle_group: string | null;
  order_index: number;
  sets: WorkoutSet[];
};

type WorkoutSession = {
  id: string;
  title: string | null;
  started_at: string;
  ended_at: string | null;
  exercises: WorkoutExercise[];
};

type GroupedWorkouts = {
  label: string;
  workouts: WorkoutSession[];
};

export default function WorkoutHistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  // Fetch workouts
  const fetchWorkouts = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/sign-in");
        return;
      }

      // Fetch sessions with exercises and sets
      const { data: sessions, error: sessionsError } = await supabase
        .from("workout_sessions")
        .select("id, title, started_at, ended_at")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(50);

      if (sessionsError) throw sessionsError;

      // Fetch exercises for these sessions
      const sessionIds = sessions?.map((s) => s.id) || [];
      
      if (sessionIds.length === 0) {
        setWorkouts([]);
        return;
      }

      const { data: exercises, error: exercisesError } = await supabase
        .from("workout_exercises")
        .select("id, session_id, exercise_name, muscle_group, order_index")
        .in("session_id", sessionIds)
        .order("order_index", { ascending: true });

      if (exercisesError) throw exercisesError;

      // Fetch sets for these exercises
      const exerciseIds = exercises?.map((e) => e.id) || [];
      
      let sets: any[] = [];
      if (exerciseIds.length > 0) {
        const { data: setsData, error: setsError } = await supabase
          .from("workout_sets")
          .select("id, workout_exercise_id, set_number, weight_lbs, reps, rir, is_pr")
          .in("workout_exercise_id", exerciseIds)
          .order("set_number", { ascending: true });

        if (setsError) throw setsError;
        sets = setsData || [];
      }

      // Group sets by exercise
      const setsByExercise = new Map<string, WorkoutSet[]>();
      sets.forEach((set) => {
        const existing = setsByExercise.get(set.workout_exercise_id) || [];
        existing.push(set);
        setsByExercise.set(set.workout_exercise_id, existing);
      });

      // Group exercises by session
      const exercisesBySession = new Map<string, WorkoutExercise[]>();
      exercises?.forEach((ex) => {
        const existing = exercisesBySession.get(ex.session_id) || [];
        existing.push({
          ...ex,
          sets: setsByExercise.get(ex.id) || [],
        });
        exercisesBySession.set(ex.session_id, existing);
      });

      // Combine into final structure
      const fullWorkouts: WorkoutSession[] = (sessions || []).map((session) => ({
        ...session,
        exercises: exercisesBySession.get(session.id) || [],
      }));

      setWorkouts(fullWorkouts);
    } catch (err) {
      console.error("Error fetching workout history:", err);
      setError("Failed to load workout history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  // Group workouts by time period
  const groupedWorkouts = useMemo((): GroupedWorkouts[] => {
    const groups: { [key: string]: WorkoutSession[] } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      earlier: [],
    };

    workouts.forEach((workout) => {
      const date = parseISO(workout.started_at);
      if (isToday(date)) {
        groups.today.push(workout);
      } else if (isYesterday(date)) {
        groups.yesterday.push(workout);
      } else if (isThisWeek(date, { weekStartsOn: 1 })) {
        groups.thisWeek.push(workout);
      } else if (isThisMonth(date)) {
        groups.thisMonth.push(workout);
      } else {
        groups.earlier.push(workout);
      }
    });

    const result: GroupedWorkouts[] = [];
    if (groups.today.length > 0) result.push({ label: "Today", workouts: groups.today });
    if (groups.yesterday.length > 0) result.push({ label: "Yesterday", workouts: groups.yesterday });
    if (groups.thisWeek.length > 0) result.push({ label: "This Week", workouts: groups.thisWeek });
    if (groups.thisMonth.length > 0) result.push({ label: "This Month", workouts: groups.thisMonth });
    if (groups.earlier.length > 0) result.push({ label: "Earlier", workouts: groups.earlier });

    return result;
  }, [workouts]);

  // Calculate workout stats
  const getWorkoutStats = (workout: WorkoutSession) => {
    const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const totalVolume = workout.exercises.reduce((acc, ex) => {
      return acc + ex.sets.reduce((setAcc, set) => {
        const weight = set.weight_lbs || 0;
        const reps = set.reps || 0;
        return setAcc + (weight * reps);
      }, 0);
    }, 0);
    const duration = workout.ended_at 
      ? differenceInMinutes(parseISO(workout.ended_at), parseISO(workout.started_at))
      : 0;
    const prCount = workout.exercises.reduce((acc, ex) => {
      return acc + ex.sets.filter((s) => s.is_pr).length;
    }, 0);

    return { totalSets, totalVolume, duration, prCount };
  };

  // Toggle workout expansion
  const toggleWorkout = (workoutId: string) => {
    hapticPress();
    setExpandedWorkout((prev) => (prev === workoutId ? null : workoutId));
  };

  // Render workout card
  const renderWorkoutCard = (workout: WorkoutSession, index: number) => {
    const stats = getWorkoutStats(workout);
    const isExpanded = expandedWorkout === workout.id;
    const date = parseISO(workout.started_at);

    return (
      <Animated.View
        key={workout.id}
        entering={FadeInDown.delay(index * 50).duration(300)}
      >
        <Pressable
          onPress={() => toggleWorkout(workout.id)}
          style={[styles.workoutCard, isExpanded && styles.workoutCardExpanded]}
        >
          {/* Header */}
          <View style={styles.workoutHeader}>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutTitle}>
                {workout.title || "Workout"}
              </Text>
              <Text style={styles.workoutDate}>
                {format(date, "EEEE, MMM d")} at {format(date, "h:mm a")}
              </Text>
            </View>
            <View style={styles.workoutMeta}>
              {stats.prCount > 0 && (
                <View style={styles.prBadge}>
                  <Ionicons name="trophy" size={12} color={colors.gold} />
                  <Text style={styles.prBadgeText}>{stats.prCount}</Text>
                </View>
              )}
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textMuted}
              />
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.duration}</Text>
              <Text style={styles.statLabel}>min</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{workout.exercises.length}</Text>
              <Text style={styles.statLabel}>exercises</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.totalSets}</Text>
              <Text style={styles.statLabel}>sets</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {stats.totalVolume >= 1000 
                  ? `${(stats.totalVolume / 1000).toFixed(1)}k` 
                  : stats.totalVolume}
              </Text>
              <Text style={styles.statLabel}>lbs</Text>
            </View>
          </View>

          {/* Expanded Exercise Details */}
          {isExpanded && workout.exercises.length > 0 && (
            <View style={styles.exerciseList}>
              {workout.exercises.map((exercise) => (
                <View key={exercise.id} style={styles.exerciseItem}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                    {exercise.muscle_group && (
                      <Text style={styles.muscleGroup}>{exercise.muscle_group}</Text>
                    )}
                  </View>
                  <View style={styles.setsList}>
                    {exercise.sets.map((set) => (
                      <View key={set.id} style={styles.setItem}>
                        <Text style={[styles.setText, set.is_pr && styles.setTextPR]}>
                          {set.weight_lbs || 0} lbs x {set.reps || 0}
                          {set.is_pr && " PR"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State for workouts with no details */}
          {isExpanded && workout.exercises.length === 0 && (
            <View style={styles.emptyExercises}>
              <Text style={styles.emptyText}>No exercise details recorded</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/(tabs)/workout")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Workout History</Text>
        <View style={styles.headerRight}>
          <Text style={styles.workoutCount}>{workouts.length} workouts</Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <ErrorState 
          message={error}
          detail="Please check your connection and try again."
          onRetry={() => fetchWorkouts()}
        />
      ) : workouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete your first workout to see it here
          </Text>
          <Pressable
            onPress={() => router.push("/(app)/(tabs)/workout")}
            style={styles.startButton}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchWorkouts(true)}
              tintColor={colors.primary}
            />
          }
        >
          {groupedWorkouts.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.workouts.map((workout, index) => renderWorkoutCard(workout, index))}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
      textAlign: "center",
    },
    headerRight: {
      minWidth: 80,
      alignItems: "flex-end",
    },
    workoutCount: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
    },
    // Loading & Empty
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
      marginTop: 8,
      textAlign: "center",
    },
    startButton: {
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.primary,
      borderRadius: 24,
    },
    startButtonText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.textOnPrimary,
    },
    // Content
    scrollContent: {
      padding: 16,
    },
    group: {
      marginBottom: 24,
    },
    groupLabel: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    // Workout Card
    workoutCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    workoutCardExpanded: {
      borderColor: colors.primary,
      borderWidth: 1,
    },
    workoutHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    workoutInfo: {
      flex: 1,
    },
    workoutTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    workoutDate: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
      marginTop: 2,
    },
    workoutMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    prBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(255, 215, 0, 0.15)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    prBadgeText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.gold,
    },
    // Quick Stats
    quickStats: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    stat: {
      flex: 1,
      alignItems: "center",
    },
    statValue: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
    },
    // Exercise List
    exerciseList: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    exerciseItem: {
      marginBottom: 16,
    },
    exerciseHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    exerciseName: {
      fontSize: 15,
      fontFamily: "Inter_500Medium",
      color: colors.text,
    },
    muscleGroup: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
    },
    setsList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    setItem: {
      backgroundColor: colors.cardAlt,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    setText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },
    setTextPR: {
      color: colors.gold,
      fontFamily: "Inter_600SemiBold",
    },
    emptyExercises: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.textMuted,
    },
  });
