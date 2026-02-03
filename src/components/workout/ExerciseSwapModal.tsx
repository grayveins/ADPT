/**
 * ExerciseSwapModal - Exercise substitution modal
 * 
 * Features:
 * - Filter by muscle group (pre-selected based on current exercise)
 * - Filter by equipment available
 * - Search exercises
 * - Shows exercise alternatives with same muscle targets
 * 
 * Medium complexity: muscle group + equipment filter
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius, shadows, layout } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";

// Equipment types
const EQUIPMENT_OPTIONS = [
  { id: "barbell", label: "Barbell", icon: "barbell-outline" },
  { id: "dumbbell", label: "Dumbbells", icon: "barbell-outline" },
  { id: "cable", label: "Cable", icon: "git-network-outline" },
  { id: "machine", label: "Machine", icon: "cog-outline" },
  { id: "bodyweight", label: "Bodyweight", icon: "body-outline" },
  { id: "kettlebell", label: "Kettlebell", icon: "fitness-outline" },
] as const;

// Muscle groups
const MUSCLE_GROUPS = [
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "glutes", label: "Glutes" },
  { id: "calves", label: "Calves" },
  { id: "core", label: "Core" },
] as const;

// Exercise database (simplified - in production this would come from API/DB)
const EXERCISE_DATABASE: Exercise[] = [
  // Chest
  { name: "Bench Press", muscles: ["chest", "triceps"], equipment: "barbell" },
  { name: "Incline Bench Press", muscles: ["chest", "shoulders"], equipment: "barbell" },
  { name: "Dumbbell Bench Press", muscles: ["chest", "triceps"], equipment: "dumbbell" },
  { name: "Incline DB Press", muscles: ["chest", "shoulders"], equipment: "dumbbell" },
  { name: "Cable Flyes", muscles: ["chest"], equipment: "cable" },
  { name: "Chest Press Machine", muscles: ["chest", "triceps"], equipment: "machine" },
  { name: "Push-ups", muscles: ["chest", "triceps"], equipment: "bodyweight" },
  { name: "Dips", muscles: ["chest", "triceps"], equipment: "bodyweight" },
  
  // Back
  { name: "Barbell Rows", muscles: ["back", "biceps"], equipment: "barbell" },
  { name: "Deadlift", muscles: ["back", "hamstrings", "glutes"], equipment: "barbell" },
  { name: "Dumbbell Rows", muscles: ["back", "biceps"], equipment: "dumbbell" },
  { name: "Pull-ups", muscles: ["back", "biceps"], equipment: "bodyweight" },
  { name: "Lat Pulldown", muscles: ["back", "biceps"], equipment: "cable" },
  { name: "Seated Cable Row", muscles: ["back"], equipment: "cable" },
  { name: "T-Bar Row", muscles: ["back"], equipment: "barbell" },
  
  // Shoulders
  { name: "Overhead Press", muscles: ["shoulders", "triceps"], equipment: "barbell" },
  { name: "Dumbbell Shoulder Press", muscles: ["shoulders", "triceps"], equipment: "dumbbell" },
  { name: "Lateral Raises", muscles: ["shoulders"], equipment: "dumbbell" },
  { name: "Face Pulls", muscles: ["shoulders", "back"], equipment: "cable" },
  { name: "Front Raises", muscles: ["shoulders"], equipment: "dumbbell" },
  { name: "Arnold Press", muscles: ["shoulders"], equipment: "dumbbell" },
  
  // Arms
  { name: "Bicep Curls", muscles: ["biceps"], equipment: "dumbbell" },
  { name: "Barbell Curls", muscles: ["biceps"], equipment: "barbell" },
  { name: "Hammer Curls", muscles: ["biceps"], equipment: "dumbbell" },
  { name: "Cable Curls", muscles: ["biceps"], equipment: "cable" },
  { name: "Tricep Pushdowns", muscles: ["triceps"], equipment: "cable" },
  { name: "Skull Crushers", muscles: ["triceps"], equipment: "barbell" },
  { name: "Overhead Tricep Extension", muscles: ["triceps"], equipment: "dumbbell" },
  
  // Legs
  { name: "Squats", muscles: ["quads", "glutes"], equipment: "barbell" },
  { name: "Front Squats", muscles: ["quads", "core"], equipment: "barbell" },
  { name: "Goblet Squats", muscles: ["quads", "glutes"], equipment: "dumbbell" },
  { name: "Leg Press", muscles: ["quads", "glutes"], equipment: "machine" },
  { name: "Leg Extension", muscles: ["quads"], equipment: "machine" },
  { name: "Romanian Deadlift", muscles: ["hamstrings", "glutes"], equipment: "barbell" },
  { name: "Leg Curls", muscles: ["hamstrings"], equipment: "machine" },
  { name: "Bulgarian Split Squat", muscles: ["quads", "glutes"], equipment: "dumbbell" },
  { name: "Lunges", muscles: ["quads", "glutes"], equipment: "bodyweight" },
  { name: "Hip Thrusts", muscles: ["glutes", "hamstrings"], equipment: "barbell" },
  { name: "Calf Raises", muscles: ["calves"], equipment: "machine" },
  { name: "Standing Calf Raises", muscles: ["calves"], equipment: "bodyweight" },
  
  // Core
  { name: "Planks", muscles: ["core"], equipment: "bodyweight" },
  { name: "Crunches", muscles: ["core"], equipment: "bodyweight" },
  { name: "Leg Raises", muscles: ["core"], equipment: "bodyweight" },
  { name: "Cable Woodchops", muscles: ["core"], equipment: "cable" },
  { name: "Ab Rollouts", muscles: ["core"], equipment: "bodyweight" },
];

type Exercise = {
  name: string;
  muscles: string[];
  equipment: string;
};

type ExerciseSwapModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  currentExercise: string;
  currentMuscles: string[];
};

export const ExerciseSwapModal: React.FC<ExerciseSwapModalProps> = ({
  visible,
  onClose,
  onSelectExercise,
  currentExercise,
  currentMuscles,
}) => {
  const { colors } = useTheme();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(
    currentMuscles.map(m => m.toLowerCase())
  );
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  // Filter exercises based on search, muscles, and equipment
  const filteredExercises = useMemo(() => {
    return EXERCISE_DATABASE.filter(exercise => {
      // Don't show current exercise
      if (exercise.name.toLowerCase() === currentExercise.toLowerCase()) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!exercise.name.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Muscle filter (match any selected muscle)
      if (selectedMuscles.length > 0) {
        const hasMatchingMuscle = exercise.muscles.some(
          m => selectedMuscles.includes(m.toLowerCase())
        );
        if (!hasMatchingMuscle) return false;
      }
      
      // Equipment filter
      if (selectedEquipment.length > 0) {
        if (!selectedEquipment.includes(exercise.equipment)) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by number of matching muscles (most relevant first)
      const aMatches = a.muscles.filter(m => 
        selectedMuscles.includes(m.toLowerCase())
      ).length;
      const bMatches = b.muscles.filter(m => 
        selectedMuscles.includes(m.toLowerCase())
      ).length;
      return bMatches - aMatches;
    });
  }, [searchQuery, selectedMuscles, selectedEquipment, currentExercise]);

  // Toggle muscle selection
  const toggleMuscle = useCallback((muscleId: string) => {
    hapticPress();
    setSelectedMuscles(prev => 
      prev.includes(muscleId)
        ? prev.filter(m => m !== muscleId)
        : [...prev, muscleId]
    );
  }, []);

  // Toggle equipment selection
  const toggleEquipment = useCallback((equipmentId: string) => {
    hapticPress();
    setSelectedEquipment(prev =>
      prev.includes(equipmentId)
        ? prev.filter(e => e !== equipmentId)
        : [...prev, equipmentId]
    );
  }, []);

  // Handle exercise selection
  const handleSelect = useCallback((exercise: Exercise) => {
    hapticPress();
    onSelectExercise(exercise);
    onClose();
  }, [onSelectExercise, onClose]);

  // Reset filters
  const resetFilters = useCallback(() => {
    hapticPress();
    setSearchQuery("");
    setSelectedMuscles(currentMuscles.map(m => m.toLowerCase()));
    setSelectedEquipment([]);
  }, [currentMuscles]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
            Swap Exercise
          </Text>
          <Pressable onPress={resetFilters} style={styles.resetButton}>
            <Text allowFontScaling={false} style={[styles.resetText, { color: colors.primary }]}>
              Reset
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
              placeholderTextColor={colors.inputPlaceholder}
              style={[styles.searchInput, { color: colors.text }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Current exercise indicator */}
        <View style={[styles.currentExercise, { backgroundColor: colors.bgSecondary }]}>
          <Text allowFontScaling={false} style={[styles.currentLabel, { color: colors.textMuted }]}>
            REPLACING
          </Text>
          <Text allowFontScaling={false} style={[styles.currentName, { color: colors.text }]}>
            {currentExercise}
          </Text>
        </View>

        {/* Muscle filter chips */}
        <View style={styles.filterSection}>
          <Text allowFontScaling={false} style={[styles.filterLabel, { color: colors.textMuted }]}>
            Target Muscles
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {MUSCLE_GROUPS.map(muscle => (
              <Pressable
                key={muscle.id}
                onPress={() => toggleMuscle(muscle.id)}
                style={[
                  styles.chip,
                  { 
                    backgroundColor: selectedMuscles.includes(muscle.id) 
                      ? colors.primaryMuted 
                      : colors.bgSecondary,
                    borderColor: selectedMuscles.includes(muscle.id)
                      ? colors.primary
                      : colors.border,
                  }
                ]}
              >
                <Text 
                  allowFontScaling={false} 
                  style={[
                    styles.chipText,
                    { color: selectedMuscles.includes(muscle.id) ? colors.primary : colors.textSecondary }
                  ]}
                >
                  {muscle.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Equipment filter chips */}
        <View style={styles.filterSection}>
          <Text allowFontScaling={false} style={[styles.filterLabel, { color: colors.textMuted }]}>
            Equipment
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {EQUIPMENT_OPTIONS.map(equip => (
              <Pressable
                key={equip.id}
                onPress={() => toggleEquipment(equip.id)}
                style={[
                  styles.chip,
                  { 
                    backgroundColor: selectedEquipment.includes(equip.id) 
                      ? colors.primaryMuted 
                      : colors.bgSecondary,
                    borderColor: selectedEquipment.includes(equip.id)
                      ? colors.primary
                      : colors.border,
                  }
                ]}
              >
                <Ionicons 
                  name={equip.icon as any} 
                  size={14} 
                  color={selectedEquipment.includes(equip.id) ? colors.primary : colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text 
                  allowFontScaling={false} 
                  style={[
                    styles.chipText,
                    { color: selectedEquipment.includes(equip.id) ? colors.primary : colors.textSecondary }
                  ]}
                >
                  {equip.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Results */}
        <View style={styles.resultsHeader}>
          <Text allowFontScaling={false} style={[styles.resultsCount, { color: colors.textMuted }]}>
            {filteredExercises.length} alternatives found
          </Text>
        </View>

        <ScrollView 
          style={styles.resultsList}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredExercises.map((exercise, index) => (
            <Animated.View
              key={exercise.name}
              entering={FadeInDown.delay(index * 30).duration(200)}
            >
              <Pressable
                onPress={() => handleSelect(exercise)}
                style={({ pressed }) => [
                  styles.exerciseRow,
                  { backgroundColor: colors.card },
                  shadows.sm,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.exerciseInfo}>
                  <Text 
                    allowFontScaling={false} 
                    style={[styles.exerciseName, { color: colors.text }]}
                  >
                    {exercise.name}
                  </Text>
                  <View style={styles.exerciseMeta}>
                    <Text 
                      allowFontScaling={false} 
                      style={[styles.exerciseMuscles, { color: colors.textMuted }]}
                    >
                      {exercise.muscles.join(" · ")}
                    </Text>
                    <View style={[styles.equipmentBadge, { backgroundColor: colors.bgSecondary }]}>
                      <Text 
                        allowFontScaling={false} 
                        style={[styles.equipmentText, { color: colors.textSecondary }]}
                      >
                        {exercise.equipment}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </Pressable>
            </Animated.View>
          ))}

          {filteredExercises.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={colors.textMuted} />
              <Text 
                allowFontScaling={false} 
                style={[styles.emptyText, { color: colors.textMuted }]}
              >
                No exercises found.{"\n"}Try adjusting filters.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  resetButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  currentExercise: {
    marginHorizontal: spacing.base,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  currentLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  currentName: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  chipsContainer: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  resultsHeader: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  resultsCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: spacing.base,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  exerciseInfo: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  exerciseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  exerciseMuscles: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  equipmentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  equipmentText: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    textTransform: "capitalize",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default ExerciseSwapModal;
