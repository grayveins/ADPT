/**
 * ExerciseCardNew - Premium exercise card with gradient top bar
 * 
 * Features:
 * - Top gradient bar colored by muscle group (Fitbod style)
 * - Collapsible sets section
 * - Swap exercise button
 * - Exercise info button
 * - Uses SetRowNew for individual sets
 * - Card shadow for depth
 * 
 * Design: Clean, professional, gym-readable
 */

import React, { useCallback } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius, shadows, gradients, animation } from "@/src/theme";
import { SetRowNew } from "./SetRowNew";
import { hapticPress } from "@/src/animations/feedback/haptics";

// Muscle group to gradient mapping
const muscleGradients: Record<string, readonly [string, string]> = {
  chest: gradients.chest,
  back: gradients.back,
  shoulders: gradients.shoulders,
  arms: gradients.arms,
  biceps: gradients.arms,
  triceps: gradients.arms,
  legs: gradients.legs,
  quads: gradients.legs,
  hamstrings: gradients.legs,
  glutes: gradients.legs,
  calves: gradients.legs,
  core: gradients.core,
  abs: gradients.core,
  fullBody: gradients.fullBody,
  "full body": gradients.fullBody,
};

const getGradientForMuscle = (muscle: string): readonly [string, string] => {
  const lowerMuscle = muscle.toLowerCase();
  return muscleGradients[lowerMuscle] || gradients.primary;
};

export type SetData = {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
};

type ExerciseCardNewProps = {
  id: string;
  name: string;
  muscles: string[];
  sets: SetData[];
  targetReps: string;
  targetRIR: number;
  // Previous workout data per set
  previousSets?: ({ weight: string; reps: string } | null)[];
  // PR data for close-to-PR callout
  currentPRWeight?: number;
  // Callbacks
  onSetComplete: (setId: string) => void;
  onSetChange: (setId: string, field: "weight" | "reps", value: string) => void;
  onSwapExercise?: () => void;
  onShowInfo?: () => void;
  // State
  isExpanded?: boolean;
  onToggleExpand?: () => void;
};

export const ExerciseCardNew: React.FC<ExerciseCardNewProps> = ({
  id,
  name,
  muscles,
  sets,
  targetReps,
  targetRIR,
  previousSets = [],
  currentPRWeight,
  onSetComplete,
  onSetChange,
  onSwapExercise,
  onShowInfo,
  isExpanded = true,
  onToggleExpand,
}) => {
  const { colors } = useTheme();
  
  // Calculate progress
  const completedSets = sets.filter(s => s.completed).length;
  const totalSets = sets.length;
  const isComplete = completedSets === totalSets;
  const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  // Get gradient colors for the top bar
  const primaryMuscle = muscles[0] || "fullBody";
  const gradientColors = getGradientForMuscle(primaryMuscle);

  // Animation for chevron rotation
  const rotation = useSharedValue(isExpanded ? 180 : 0);

  const handleToggle = useCallback(() => {
    hapticPress();
    rotation.value = withSpring(isExpanded ? 0 : 180, animation.spring.snappy);
    onToggleExpand?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, onToggleExpand]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Update rotation when isExpanded prop changes
  React.useEffect(() => {
    rotation.value = withSpring(isExpanded ? 180 : 0, animation.spring.snappy);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  return (
    <Animated.View 
      entering={FadeInDown.duration(300)}
      style={[
        styles.card,
        { backgroundColor: colors.card },
        shadows.card,
        isComplete && styles.cardComplete,
        isComplete && { borderColor: colors.success },
      ]}
    >
      {/* Top Gradient Bar */}
      <LinearGradient
        colors={[...gradientColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBar}
      />

      {/* Header */}
      <Pressable onPress={handleToggle} style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Exercise Name & Completion Badge */}
          <View style={styles.nameRow}>
            <Text 
              allowFontScaling={false} 
              style={[styles.exerciseName, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {name}
            </Text>
            {isComplete && (
              <View style={[styles.completeBadge, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" size={10} color={colors.textOnPrimary} />
              </View>
            )}
          </View>
          
          {/* Meta info: muscles, target reps, RIR */}
          <Text
            allowFontScaling={false}
            style={[styles.metaText, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {muscles.join(" · ")} · {targetReps} reps · RIR {targetRIR}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Progress indicator */}
          <View style={styles.progressBadge}>
            <Text 
              allowFontScaling={false} 
              style={[styles.progressText, { color: colors.text }]}
            >
              {completedSets}/{totalSets}
            </Text>
          </View>
          
          {/* Chevron */}
          <Animated.View style={chevronStyle}>
            <Ionicons 
              name="chevron-up" 
              size={20} 
              color={colors.textMuted} 
            />
          </Animated.View>
        </View>
      </Pressable>

      {/* Progress bar mini */}
      <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
        <View 
          style={[
            styles.progressBarFill, 
            { 
              width: `${progressPercent}%`,
              backgroundColor: isComplete ? colors.success : colors.primary,
            }
          ]} 
        />
      </View>

      {/* Action buttons row */}
      {isExpanded && (
        <View style={styles.actionsRow}>
          {onSwapExercise && (
            <Pressable 
              onPress={() => {
                hapticPress();
                onSwapExercise();
              }}
              style={[styles.actionButton, { backgroundColor: colors.primaryMuted }]}
            >
              <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
              <Text 
                allowFontScaling={false} 
                style={[styles.actionButtonText, { color: colors.primary }]}
              >
                Swap
              </Text>
            </Pressable>
          )}
          
          {onShowInfo && (
            <Pressable 
              onPress={() => {
                hapticPress();
                onShowInfo();
              }}
              style={[styles.actionButton, { backgroundColor: colors.bgSecondary }]}
            >
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text 
                allowFontScaling={false} 
                style={[styles.actionButtonText, { color: colors.textSecondary }]}
              >
                Info
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Sets */}
      {isExpanded && (
        <Animated.View 
          entering={FadeIn.duration(200)}
          style={styles.setsContainer}
        >
          {/* Column headers */}
          <View style={styles.setsHeader}>
            <Text 
              allowFontScaling={false} 
              style={[styles.setsHeaderText, { color: colors.textMuted }, styles.setCol]}
            >
              SET
            </Text>
            <Text 
              allowFontScaling={false} 
              style={[styles.setsHeaderText, { color: colors.textMuted }, styles.prevCol]}
            >
              PREV
            </Text>
            <Text 
              allowFontScaling={false} 
              style={[styles.setsHeaderText, { color: colors.textMuted }, styles.weightCol]}
            >
              WEIGHT
            </Text>
            <Text 
              allowFontScaling={false} 
              style={[styles.setsHeaderText, { color: colors.textMuted }, styles.repsCol]}
            >
              REPS
            </Text>
            <View style={styles.doneCol} />
          </View>

          {/* Set rows */}
          {sets.map((set, index) => {
            const prevSet = previousSets[index];
            // Show "PR?" if weight is within 10% of current PR
            const weightNum = set.weight ? parseFloat(set.weight) : 0;
            const isCloseToPR = !!(
              currentPRWeight &&
              weightNum > 0 &&
              weightNum >= currentPRWeight * 0.9 &&
              weightNum <= currentPRWeight
            );
            return (
              <SetRowNew
                key={set.id}
                setNumber={index + 1}
                weight={set.weight}
                reps={set.reps}
                completed={set.completed}
                previousWeight={prevSet?.weight}
                previousReps={prevSet?.reps}
                closeToPR={isCloseToPR}
                onComplete={() => onSetComplete(set.id)}
                onWeightChange={(value) => onSetChange(set.id, "weight", value)}
                onRepsChange={(value) => onSetChange(set.id, "reps", value)}
              />
            );
          })}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  cardComplete: {
    borderWidth: 1,
  },
  gradientBar: {
    height: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    paddingBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },
  completeBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  progressBarContainer: {
    height: 2,
    marginHorizontal: spacing.base,
  },
  progressBarFill: {
    height: "100%",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderRadius: radius.sm,
    minHeight: 44,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  setsContainer: {
    padding: spacing.base,
    paddingTop: spacing.md,
  },
  setsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  setsHeaderText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  setCol: {
    width: 28,
    marginRight: spacing.sm,
  },
  prevCol: {
    width: 56,
    textAlign: "center",
    marginRight: spacing.sm,
  },
  weightCol: {
    flex: 1,
    textAlign: "center",
  },
  repsCol: {
    flex: 1,
    textAlign: "center",
  },
  doneCol: {
    width: 28,
  },
});

export default ExerciseCardNew;
