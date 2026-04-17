/**
 * Legacy Adapter - Convert generator output to existing app formats
 * 
 * The app uses several existing data structures for workouts.
 * This adapter bridges the new generator output to those formats.
 */

import type {
  GeneratorOutput,
  DayPlan,
  ExercisePrescription,
  WeekPlan,
  LegacyPlannedExercise,
  LegacyPlannedWorkout,
  ActiveWorkoutExercise,
} from '../generator/types';
import { EXERCISE_BY_ID } from '../exercises/library';

// =============================================================================
// TYPES FOR EXISTING APP STRUCTURES
// =============================================================================

/**
 * Format used by PlannedWorkout in lib/workoutPlan.ts
 */
export interface PlannedWorkoutFormat {
  date: string;
  type: string;
  focus: string;
  isRest: boolean;
  durationMinutes: number;
}

/**
 * Format used by saved_programs table (program_data JSONB)
 */
export interface SavedProgramFormat {
  name: string;
  goal: string;
  duration_weeks: number;
  days_per_week: number;
  workouts: Array<{
    day: number;
    title: string;
    exercises: Array<{
      name: string;
      muscleGroup: string;
      sets: number;
      reps: string;
      restSeconds?: number;
    }>;
  }>;
}

/**
 * Format expected by active.tsx for starting a workout
 */
export interface ActiveWorkoutFormat {
  exercises: Array<{
    id: string;
    name: string;
    muscleGroup: string | null;
    sets: Array<{
      id: string;
      weight: number | null;
      reps: number | null;
      rir?: number | null;
      isWarmup?: boolean;
      isDone?: boolean;
    }>;
    restTimerSeconds?: number;
  }>;
}

// =============================================================================
// CONVERSION FUNCTIONS
// =============================================================================

/**
 * Convert generator output to saved_programs format.
 * This is what gets stored in the database.
 */
export function toSavedProgramFormat(
  output: GeneratorOutput,
  programName: string,
  goal: string
): SavedProgramFormat {
  // Use week 1 as the template (week 2 is similar, 3-4 are variations)
  const week = output.mesocycle.week1;
  
  const workouts = week.days
    .filter(day => !day.isRestDay)
    .map((day, index) => ({
      day: index + 1,
      title: day.name,
      exercises: (day.exercises || []).map(ex => ({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets,
        reps: ex.reps,
        restSeconds: ex.restSeconds,
      })),
    }));
  
  return {
    name: programName,
    goal,
    duration_weeks: 4, // Standard mesocycle
    days_per_week: workouts.length,
    workouts,
  };
}

/**
 * Convert a DayPlan to the format expected by active.tsx
 */
export function toActiveWorkoutFormat(day: DayPlan): ActiveWorkoutFormat {
  if (day.isRestDay || !day.exercises) {
    return { exercises: [] };
  }
  
  return {
    exercises: day.exercises.map((prescription, exIndex) => {
      // Create empty sets for the user to fill in
      const sets = Array.from({ length: prescription.sets }, (_, setIndex) => ({
        id: `${prescription.exerciseId}-set-${setIndex + 1}`,
        weight: null,
        reps: null,
        rir: prescription.rirTarget,
        isWarmup: false,
        isDone: false,
      }));
      
      return {
        id: `${prescription.exerciseId}-${exIndex}`,
        name: prescription.name,
        muscleGroup: prescription.muscleGroup,
        sets,
        restTimerSeconds: prescription.restSeconds,
      };
    }),
  };
}

/**
 * Convert generator output to PlannedWorkout[] for the weekly view.
 */
export function toPlannedWorkoutFormat(
  output: GeneratorOutput,
  weekNumber: 1 | 2 | 3 | 4,
  startDate: Date
): PlannedWorkoutFormat[] {
  const weekKey = `week${weekNumber}` as keyof typeof output.mesocycle;
  const week = output.mesocycle[weekKey];
  
  return week.days.map((day, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);
    
    return {
      date: date.toISOString().split('T')[0],
      type: day.name,
      focus: day.focus || '',
      isRest: day.isRestDay,
      durationMinutes: day.estimatedDurationMinutes || 60,
    };
  });
}

/**
 * Convert a single DayPlan to LegacyPlannedWorkout format.
 */
export function toLegacyPlannedWorkout(
  day: DayPlan,
  dayNumber: number
): LegacyPlannedWorkout {
  return {
    day: dayNumber,
    title: day.name,
    exercises: (day.exercises || []).map(ex => ({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: ex.sets,
      reps: ex.reps,
      restSeconds: ex.restSeconds,
      rirTarget: ex.rirTarget,
    })),
  };
}

/**
 * Convert full mesocycle to array of LegacyPlannedWorkout.
 * Useful for backwards compatibility with existing code.
 * 
 * Note: `day` now represents the actual day of week (1=Mon, 7=Sun)
 * rather than a sequential workout number.
 */
export function toLegacyPlannedWorkouts(
  output: GeneratorOutput,
  weekNumber: 1 | 2 | 3 | 4 = 1
): LegacyPlannedWorkout[] {
  const weekKey = `week${weekNumber}` as keyof typeof output.mesocycle;
  const week = output.mesocycle[weekKey];
  
  return week.days
    .filter(day => !day.isRestDay)
    .map((day) => toLegacyPlannedWorkout(day, day.dayNumber)); // Use actual day of week
}

// =============================================================================
// REVERSE ADAPTERS (App format → Generator format)
// =============================================================================

/**
 * Convert saved_programs format back to something the generator can adapt.
 * Useful for modifying existing programs.
 */
export function fromSavedProgramFormat(saved: SavedProgramFormat): {
  workouts: Array<{
    name: string;
    exercises: ExercisePrescription[];
  }>;
} {
  return {
    workouts: saved.workouts.map(w => ({
      name: w.title,
      exercises: w.exercises.map((ex, i) => ({
        exerciseId: findExerciseId(ex.name) || `custom-${i}`,
        name: ex.name,
        muscleGroup: ex.muscleGroup as any,
        sets: ex.sets,
        reps: ex.reps,
        rirTarget: 2, // Default
        restSeconds: ex.restSeconds || 90,
      })),
    })),
  };
}

/**
 * Try to find the exercise ID from the library by name.
 */
function findExerciseId(name: string): string | null {
  const entries = Object.entries(EXERCISE_BY_ID);
  const match = entries.find(([_, ex]) => 
    ex.name.toLowerCase() === name.toLowerCase()
  );
  return match ? match[0] : null;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get exercises for a specific week and day from generator output.
 */
export function getExercisesForDay(
  output: GeneratorOutput,
  weekNumber: 1 | 2 | 3 | 4,
  dayIndex: number
): ExercisePrescription[] {
  const weekKey = `week${weekNumber}` as keyof typeof output.mesocycle;
  const week = output.mesocycle[weekKey];
  const day = week.days[dayIndex];
  
  return day?.exercises || [];
}

/**
 * Get workout days (non-rest) from a week.
 */
export function getWorkoutDays(week: WeekPlan): DayPlan[] {
  return week.days.filter(d => !d.isRestDay);
}

/**
 * Format exercises as URL params for navigation to active.tsx
 */
export function formatExercisesForNavigation(exercises: ExercisePrescription[]): string {
  const formatted = exercises.map(ex => ({
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    sets: ex.sets,
    reps: ex.reps,
    restSeconds: ex.restSeconds,
  }));
  
  return JSON.stringify(formatted);
}

/**
 * Calculate total workout duration from exercises.
 */
export function calculateWorkoutDuration(exercises: ExercisePrescription[]): number {
  return exercises.reduce((total, ex) => {
    const setsTime = ex.sets * 1.5; // ~1.5 min per set
    const restTime = (ex.sets - 1) * (ex.restSeconds / 60);
    return total + setsTime + restTime;
  }, 0);
}

/**
 * Add warmup sets to an exercise prescription for active workout.
 */
export function addWarmupSets(
  exercises: ActiveWorkoutFormat['exercises'],
  warmupCount: number = 2
): ActiveWorkoutFormat['exercises'] {
  return exercises.map((exercise, index) => {
    // Only add warmup sets to first 2-3 compound exercises
    if (index >= 3) return exercise;
    
    const warmupSets = Array.from({ length: warmupCount }, (_, setIndex) => ({
      id: `${exercise.id}-warmup-${setIndex + 1}`,
      weight: null,
      reps: null,
      rir: null,
      isWarmup: true,
      isDone: false,
    }));
    
    return {
      ...exercise,
      sets: [...warmupSets, ...exercise.sets],
    };
  });
}
