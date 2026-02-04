/**
 * Exercise Library Screen
 * 
 * Browse all exercises by muscle group with search.
 * Redesigned with 2-column muscle group grid.
 * Supports multi-select to build custom workouts.
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { defaultExercises, muscleGroups } from "@/lib/exercises";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";
import { ExerciseInfo } from "@/src/components/workout";

// Type for selected exercise with workout data
type SelectedExercise = {
  name: string;
  sets: number;
  reps: string;
  rir: number;
  category: string;
};

// Muscle group icons and colors
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

export default function ExercisesScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isSelectMode = params.mode === "select";
  
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedForWorkout, setSelectedForWorkout] = useState<SelectedExercise[]>([]);

  // Toggle exercise selection for workout building
  const toggleExerciseSelection = useCallback((exercise: typeof defaultExercises[0]) => {
    hapticPress();
    setSelectedForWorkout((prev) => {
      const exists = prev.find((e) => e.name === exercise.name);
      if (exists) {
        return prev.filter((e) => e.name !== exercise.name);
      }
      return [...prev, {
        name: exercise.name,
        sets: 3,
        reps: "8-12",
        rir: 2,
        category: exercise.category,
      }];
    });
  }, []);

  // Check if exercise is selected
  const isExerciseSelected = useCallback((name: string) => {
    return selectedForWorkout.some((e) => e.name === name);
  }, [selectedForWorkout]);

  // Start workout with selected exercises
  const startWorkout = useCallback(() => {
    if (selectedForWorkout.length === 0) return;
    
    hapticSuccess();
    router.push({
      pathname: "/(app)/workout/active",
      params: {
        type: "Custom",
        name: "Custom Workout",
        exercises: JSON.stringify(selectedForWorkout),
      },
    });
  }, [selectedForWorkout]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    let exercises = defaultExercises;
    
    if (selectedGroup) {
      exercises = exercises.filter((ex) => ex.category === selectedGroup);
    }
    
    if (search.trim()) {
      const query = search.toLowerCase();
      exercises = exercises.filter((ex) => 
        ex.name.toLowerCase().includes(query) ||
        ex.category.toLowerCase().includes(query)
      );
    }
    
    return exercises;
  }, [search, selectedGroup]);

  // Group exercises by category
  const groupedExercises = useMemo(() => {
    const groups: Record<string, typeof defaultExercises> = {};
    filteredExercises.forEach((ex) => {
      if (!groups[ex.category]) {
        groups[ex.category] = [];
      }
      groups[ex.category].push(ex);
    });
    return groups;
  }, [filteredExercises]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/(tabs)/workout")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
          {selectedForWorkout.length > 0 
            ? `${selectedForWorkout.length} Selected` 
            : "Build Workout"}
        </Text>
        {selectedForWorkout.length > 0 ? (
          <Pressable 
            onPress={() => setSelectedForWorkout([])} 
            style={styles.backButton}
          >
            <Text allowFontScaling={false} style={{ color: colors.intensity, fontFamily: "Inter_500Medium" }}>
              Clear
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Muscle Group Grid - only show when no search and no filter */}
        {!search.trim() && !selectedGroup && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.textMuted }]}>
              Browse by Muscle
            </Text>
            <View style={styles.muscleGrid}>
              {muscleGroups.map((group) => {
                const config = muscleGroupConfig[group] || { icon: "ellipse-outline", color: colors.primary };
                const exerciseCount = defaultExercises.filter((ex) => ex.category === group).length;
                
                return (
                  <Pressable
                    key={group}
                    onPress={() => {
                      hapticPress();
                      setSelectedGroup(group);
                    }}
                    style={[styles.muscleCard, { backgroundColor: colors.card }]}
                  >
                    <View style={[styles.muscleIcon, { backgroundColor: config.color + "20" }]}>
                      <Ionicons name={config.icon as any} size={22} color={config.color} />
                    </View>
                    <Text allowFontScaling={false} style={[styles.muscleName, { color: colors.text }]}>
                      {group}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.muscleCount, { color: colors.textMuted }]}>
                      {exerciseCount} exercises
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Selected group header */}
        {selectedGroup && (
          <View style={styles.selectedHeader}>
            <Pressable
              onPress={() => {
                hapticPress();
                setSelectedGroup(null);
              }}
              style={[styles.backChip, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="arrow-back" size={16} color={colors.text} />
              <Text allowFontScaling={false} style={[styles.backChipText, { color: colors.text }]}>
                All
              </Text>
            </Pressable>
            <Text allowFontScaling={false} style={[styles.selectedTitle, { color: colors.text }]}>
              {selectedGroup}
            </Text>
          </View>
        )}

        {/* Exercise List - show when search or filter is active */}
        {(search.trim() || selectedGroup) && (
          <>
            {Object.entries(groupedExercises).map(([category, exercises], groupIndex) => (
              <Animated.View
                key={category}
                entering={FadeInDown.delay(groupIndex * 50).duration(300)}
                style={styles.group}
              >
                {!selectedGroup && (
                  <Text allowFontScaling={false} style={[styles.groupTitle, { color: colors.textMuted }]}>
                    {category}
                  </Text>
                )}
                <View style={[styles.groupCard, { backgroundColor: colors.card }]}>
                  {exercises.map((exercise, i) => {
                    const isSelected = isExerciseSelected(exercise.name);
                    return (
                      <Pressable
                        key={exercise.id}
                        onPress={() => toggleExerciseSelection(exercise)}
                        onLongPress={() => {
                          hapticPress();
                          setSelectedExercise(exercise.name);
                        }}
                        style={[
                          styles.exerciseRow,
                          i < exercises.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                          isSelected && { backgroundColor: colors.primaryMuted },
                        ]}
                      >
                        <View style={[
                          styles.selectionIndicator,
                          { borderColor: isSelected ? colors.primary : colors.border },
                          isSelected && { backgroundColor: colors.primary },
                        ]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
                          )}
                        </View>
                        <View style={styles.exerciseInfo}>
                          <Text allowFontScaling={false} style={[styles.exerciseName, { color: colors.text }]}>
                            {exercise.name}
                          </Text>
                          <Text allowFontScaling={false} style={[styles.exerciseHint, { color: colors.textMuted }]}>
                            Long press for details
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                            <Text allowFontScaling={false} style={[styles.selectedBadgeText, { color: colors.textOnPrimary }]}>
                              {selectedForWorkout.findIndex((e) => e.name === exercise.name) + 1}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            ))}

            {filteredExercises.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="search" size={48} color={colors.border} />
                <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
                  No exercises found
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: selectedForWorkout.length > 0 ? 100 : 40 }} />
      </ScrollView>

      {/* Start Workout Button - fixed at bottom */}
      {selectedForWorkout.length > 0 && (
        <Animated.View 
          entering={FadeInUp.duration(300)}
          style={[styles.floatingButton, { backgroundColor: colors.bg }]}
        >
          <Pressable
            onPress={startWorkout}
            style={[styles.startButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="play" size={20} color={colors.textOnPrimary} />
            <Text allowFontScaling={false} style={[styles.startButtonText, { color: colors.textOnPrimary }]}>
              Start Workout ({selectedForWorkout.length} exercises)
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Exercise Info Modal */}
      <Modal
        visible={!!selectedExercise}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedExercise(null)}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
          <ExerciseInfo
            exerciseName={selectedExercise || ""}
            onClose={() => setSelectedExercise(null)}
          />
        </View>
      </Modal>
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
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  // Section
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  // Muscle Group Grid
  muscleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  muscleCard: {
    width: "47%",
    borderRadius: 14,
    padding: 16,
  },
  muscleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  muscleName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  muscleCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  // Selected header
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  backChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  backChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  selectedTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  // Groups
  group: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  groupCard: {
    borderRadius: 14,
    overflow: "hidden",
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  exerciseHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  floatingButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  modalContent: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
});
