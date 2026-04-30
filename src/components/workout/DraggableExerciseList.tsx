/**
 * DraggableExerciseList
 * Renders exercises with drag-to-reorder support.
 * Groups consecutive exercises with the same groupId into SupersetGroups.
 * Uses ScrollView (not FlatList) since exercise count is small (4-8).
 */

import React, { useMemo, type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useActiveWorkout, type ActiveExercise } from "@/src/context/ActiveWorkoutContext";
import { SupersetGroup } from "./SupersetGroup";
import { InlineRestTimer } from "./InlineRestTimer";
import { AddExerciseButton } from "./AddExerciseButton";

type ExerciseGroup = {
  groupId: string | null;
  exercises: ActiveExercise[];
};

type Props = {
  renderExercise: (exercise: ActiveExercise, index: number) => ReactNode;
};

export function DraggableExerciseList({ renderExercise }: Props) {
  const { state } = useActiveWorkout();

  // Group consecutive exercises by groupId
  const groups = useMemo<ExerciseGroup[]>(() => {
    const result: ExerciseGroup[] = [];
    for (const exercise of state.exercises) {
      const lastGroup = result[result.length - 1];
      if (exercise.groupId && lastGroup?.groupId === exercise.groupId) {
        lastGroup.exercises.push(exercise);
      } else {
        result.push({ groupId: exercise.groupId, exercises: [exercise] });
      }
    }
    return result;
  }, [state.exercises]);

  // Track global exercise index for stagger animations
  let globalIndex = 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {groups.map((group) => {
          if (group.groupId && group.exercises.length >= 2) {
            // Render as superset group
            const rendered = group.exercises.map((exercise) => {
              const idx = globalIndex++;
              return (
                <React.Fragment key={exercise.id}>
                  {renderExercise(exercise, idx)}
                  {/* Inline rest timer after this exercise if it triggered one */}
                  {state.restTimer.active && state.restTimer.afterExerciseId === exercise.id && (
                    <InlineRestTimer />
                  )}
                </React.Fragment>
              );
            });

            return (
              <SupersetGroup key={group.groupId} exerciseCount={group.exercises.length}>
                {rendered}
              </SupersetGroup>
            );
          }

          // Render standalone exercises
          return group.exercises.map((exercise) => {
            const idx = globalIndex++;
            return (
              <React.Fragment key={exercise.id}>
                {renderExercise(exercise, idx)}
                {/* Inline rest timer after this exercise if it triggered one */}
                {state.restTimer.active && state.restTimer.afterExerciseId === exercise.id && (
                  <InlineRestTimer />
                )}
              </React.Fragment>
            );
          });
        })}

        <AddExerciseButton />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});
