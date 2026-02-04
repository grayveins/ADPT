/**
 * Saved Programs Screen
 * 
 * View, manage, and start saved workout programs
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";
import { ErrorState } from "@/src/components/ErrorState";

// Types
type SavedProgram = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  experience: string | null;
  workouts_per_week: number;
  program_data: {
    workouts: Array<{
      day: number;
      name: string;
      type: string;
      focus: string;
      exercises: Array<{
        name: string;
        sets: number;
        reps: string;
        rir: number;
        notes?: string;
      }>;
      estimatedDuration: number;
    }>;
    tips?: string[];
  };
  is_ai_generated: boolean;
  is_active: boolean;
  times_used: number;
  last_used_at: string | null;
  created_at: string;
};

export default function SavedProgramsScreen() {
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [programs, setPrograms] = useState<SavedProgram[]>([]);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  const fetchPrograms = useCallback(async () => {
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/sign-in");
        return;
      }

      const { data, error } = await supabase
        .from("saved_programs")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Fetch programs error:", error.message, error.code, error.details);
        // Show specific error if table doesn't exist (not yet migrated)
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setError("Programs feature is being set up. Please try again later.");
        } else {
          setError("Failed to load programs. Please try again.");
        }
        return;
      }

      setPrograms(data || []);
    } catch (e) {
      console.error("Unexpected error:", e);
      setError("Failed to load programs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPrograms();
  }, [fetchPrograms]);

  const setActiveProgram = useCallback(async (programId: string, programName: string) => {
    hapticPress();
    
    try {
      const { error } = await supabase.rpc("set_active_program", {
        p_program_id: programId,
      });

      if (error) {
        console.error("Set active program error:", error);
        Alert.alert("Error", "Failed to activate program. Please try again.");
        return;
      }

      hapticSuccess();
      Alert.alert(
        "Program Activated!",
        `"${programName}" is now your active program.`,
        [{ text: "OK" }]
      );
      
      // Refresh the list
      fetchPrograms();
    } catch (e) {
      console.error("Unexpected error:", e);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  }, [fetchPrograms]);

  const deleteProgram = useCallback(async (programId: string, programName: string) => {
    Alert.alert(
      "Delete Program?",
      `Are you sure you want to delete "${programName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            hapticPress();
            
            try {
              const { error } = await supabase
                .from("saved_programs")
                .delete()
                .eq("id", programId);

              if (error) {
                console.error("Delete program error:", error);
                Alert.alert("Error", "Failed to delete program. Please try again.");
                return;
              }

              setPrograms((prev) => prev.filter((p) => p.id !== programId));
            } catch (e) {
              console.error("Unexpected error:", e);
              Alert.alert("Error", "Something went wrong. Please try again.");
            }
          },
        },
      ]
    );
  }, []);

  const startWorkoutFromProgram = useCallback(async (
    program: SavedProgram,
    workout: SavedProgram["program_data"]["workouts"][0]
  ) => {
    hapticPress();
    
    // Update times_used and last_used_at
    try {
      await supabase
        .from("saved_programs")
        .update({
          times_used: program.times_used + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", program.id);
      
      // Update local state optimistically
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === program.id
            ? { ...p, times_used: p.times_used + 1, last_used_at: new Date().toISOString() }
            : p
        )
      );
    } catch (e) {
      console.error("Failed to update times_used:", e);
      // Don't block navigation on this error
    }
    
    // Navigate with full exercise data
    router.push({
      pathname: "/(app)/workout/active",
      params: { 
        type: workout.type, 
        name: workout.name,
        programId: program.id,
        exercises: JSON.stringify(workout.exercises),
      },
    });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  const getGoalLabel = (goal: string | null) => {
    const labels: Record<string, string> = {
      build_muscle: "Build Muscle",
      lose_fat: "Lose Fat",
      get_stronger: "Get Stronger",
      improve_fitness: "General Fitness",
    };
    return goal ? labels[goal] || goal : "Custom";
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(tabs)/workout");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
            My Programs
          </Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
            My Programs
          </Text>
          <View style={styles.headerButton} />
        </View>
        <ErrorState 
          message={error}
          detail="Please check your connection and try again."
          onRetry={fetchPrograms}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
          My Programs
        </Text>
        <Pressable 
          onPress={() => {
            hapticPress();
            router.push("/(app)/workout/generate");
          }} 
          style={styles.headerButton}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {programs.length === 0 ? (
          // Empty state
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={[styles.emptyState, { backgroundColor: colors.card }]}
          >
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="document-text-outline" size={32} color={colors.primary} />
            </View>
            <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
              No Saved Programs
            </Text>
            <Text allowFontScaling={false} style={[styles.emptyDesc, { color: colors.textMuted }]}>
              Generate a personalized workout program with AI and save it here for quick access.
            </Text>
            <Pressable
              onPress={() => {
                hapticPress();
                router.push("/(app)/workout/generate");
              }}
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="sparkles" size={18} color={colors.textOnPrimary} />
              <Text allowFontScaling={false} style={[styles.emptyButtonText, { color: colors.textOnPrimary }]}>
                Generate Program
              </Text>
            </Pressable>
          </Animated.View>
        ) : (
          // Programs list
          <>
            {programs.map((program, index) => (
              <Animated.View
                key={program.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
              >
                <View style={[styles.programCard, { backgroundColor: colors.card }]}>
                  {/* Program Header */}
                  <Pressable
                    onPress={() => {
                      hapticPress();
                      setExpandedProgram(
                        expandedProgram === program.id ? null : program.id
                      );
                    }}
                    style={styles.programHeader}
                  >
                    <View style={styles.programInfo}>
                      <View style={styles.programNameRow}>
                        <Text 
                          allowFontScaling={false} 
                          style={[styles.programName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {program.name}
                        </Text>
                        {program.is_active && (
                          <View style={[styles.activeBadge, { backgroundColor: colors.primaryMuted }]}>
                            <Text allowFontScaling={false} style={[styles.activeBadgeText, { color: colors.primary }]}>
                              Active
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.programMeta}>
                        <Text allowFontScaling={false} style={[styles.programMetaText, { color: colors.textMuted }]}>
                          {program.workouts_per_week} days/week
                        </Text>
                        <Text allowFontScaling={false} style={[styles.programMetaDot, { color: colors.textMuted }]}>
                          •
                        </Text>
                        <Text allowFontScaling={false} style={[styles.programMetaText, { color: colors.textMuted }]}>
                          {getGoalLabel(program.goal)}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name={expandedProgram === program.id ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>

                  {/* Expanded Content */}
                  {expandedProgram === program.id && (
                    <Animated.View entering={FadeIn.duration(200)}>
                      {/* Description */}
                      {program.description && (
                        <Text 
                          allowFontScaling={false} 
                          style={[styles.programDesc, { color: colors.textMuted }]}
                        >
                          {program.description}
                        </Text>
                      )}

                      {/* Workouts List */}
                      <View style={styles.workoutsList}>
                        {program.program_data.workouts.map((workout) => (
                          <Pressable
                            key={workout.day}
                            onPress={() => startWorkoutFromProgram(program, workout)}
                            style={({ pressed }) => [
                              styles.workoutItem,
                              { backgroundColor: colors.cardAlt },
                              pressed && styles.workoutItemPressed,
                            ]}
                          >
                            <View style={[styles.workoutDayBadge, { backgroundColor: colors.primaryMuted }]}>
                              <Text allowFontScaling={false} style={[styles.workoutDayText, { color: colors.primary }]}>
                                {workout.day}
                              </Text>
                            </View>
                            <View style={styles.workoutInfo}>
                              <Text allowFontScaling={false} style={[styles.workoutName, { color: colors.text }]}>
                                {workout.name}
                              </Text>
                              <Text allowFontScaling={false} style={[styles.workoutDetails, { color: colors.textMuted }]}>
                                {workout.exercises.length} exercises • ~{workout.estimatedDuration} min
                              </Text>
                            </View>
                            <Ionicons name="play-circle" size={24} color={colors.primary} />
                          </Pressable>
                        ))}
                      </View>

                      {/* Program Stats */}
                      <View style={[styles.programStats, { borderTopColor: colors.border }]}>
                        <View style={styles.statItem}>
                          <Ionicons name="repeat" size={14} color={colors.textMuted} />
                          <Text allowFontScaling={false} style={[styles.statText, { color: colors.textMuted }]}>
                            Used {program.times_used} {program.times_used === 1 ? "time" : "times"}
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                          <Text allowFontScaling={false} style={[styles.statText, { color: colors.textMuted }]}>
                            Created {formatDate(program.created_at)}
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.actionButtons}>
                        {!program.is_active && (
                          <Pressable
                            onPress={() => setActiveProgram(program.id, program.name)}
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                          >
                            <Ionicons name="checkmark-circle" size={16} color={colors.textOnPrimary} />
                            <Text allowFontScaling={false} style={[styles.actionButtonText, { color: colors.textOnPrimary }]}>
                              Set Active
                            </Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={() => deleteProgram(program.id, program.name)}
                          style={[styles.actionButton, styles.deleteButton, { borderColor: colors.error }]}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                          <Text allowFontScaling={false} style={[styles.actionButtonText, { color: colors.error }]}>
                            Delete
                          </Text>
                        </Pressable>
                      </View>
                    </Animated.View>
                  )}
                </View>
              </Animated.View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Empty State
  emptyState: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  
  // Program Card
  programCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  programHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  programInfo: {
    flex: 1,
  },
  programNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  programName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  programMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  programMetaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  programMetaDot: {
    fontSize: 13,
    marginHorizontal: 6,
  },
  programDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  
  // Workouts List
  workoutsList: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  workoutItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  workoutItemPressed: {
    opacity: 0.8,
  },
  workoutDayBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutDayText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  workoutDetails: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  
  // Program Stats
  programStats: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  deleteButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
