/**
 * Mesocycle Builder - Build 4-week training blocks with progression
 * 
 * This module handles:
 * 1. Building complete 4-week mesocycles
 * 2. Progressive overload across weeks
 * 3. Phase-appropriate volume and intensity adjustments
 * 4. Deload week integration
 */

import type {
  GeneratorInput,
  GeneratorOutput,
  WeekPlan,
  DayPlan,
  MuscleGroup,
  FitnessGoal,
  ExperienceLevel,
  VolumeSummary,
  SubstitutionMap,
  GeneratorMetadata,
} from '../generator/types';
import type { SplitTemplate } from '../generator/types';
import { getCurrentPhase, PHASES } from '../templates/programNames';
import { getVolumeTargets, applyPhaseMultiplier } from '../templates/volumeTargets';
import { generateWarmup } from '../templates/warmupTemplates';
import { SeededRandom, generateWeeklySeed } from '../utils/seededRandom';
import {
  selectAndPrescribeForDay,
  type DaySelectionResult
} from './exerciseSelector';
import { EXERCISE_BY_ID } from '../exercises/library';
import { applyConstraints, type ConstraintOptions } from './constraints';
import { findSubstitutes } from './substitutions';

// =============================================================================
// MESOCYCLE CONFIGURATION
// =============================================================================

export interface MesocycleConfig {
  input: GeneratorInput;
  split: SplitTemplate;
  startDate: Date;
}

// =============================================================================
// WEEK BUILDER
// =============================================================================

/**
 * Build a single week of the mesocycle.
 */
export function buildWeek(
  weekNumber: number,
  totalWeeks: number,
  config: MesocycleConfig
): WeekPlan {
  const { input, split } = config;
  const phase = getCurrentPhase(weekNumber, totalWeeks);
  const phaseInfo = PHASES[phase];
  
  // Get volume and intensity multipliers for this phase
  const volumeMultiplier = getVolumeMultiplier(phase);
  const intensityMultiplier = getIntensityMultiplier(phase);
  
  // Generate seed for this week
  const weekSeed = generateWeeklySeed(input.userId, config.startDate, weekNumber);
  const random = new SeededRandom(weekSeed);
  
  // Build constraint options
  const constraintOptions: ConstraintOptions = {
    userEquipment: input.availableEquipment,
    limitations: input.physicalLimitations,
    experienceLevel: input.experienceLevel,
    excludedExercises: input.excludedExercises,
    preferredExercises: input.preferredExercises,
  };
  
  // Build each day, tracking exercises and muscle volume across the week
  const days: DayPlan[] = [];
  let dayOfWeek = 0;
  let workoutDayIndex = 0;
  const weekExerciseIds: string[] = [];
  const weekMuscleVolume: Record<string, number> = {};

  for (let i = 0; i < 7; i++) {
    const isRestDay = split.restDayIndices.includes(i);

    if (isRestDay) {
      days.push({
        dayNumber: i + 1,
        name: 'Rest',
        isRestDay: true,
        coachNotes: getRestDayNote(phase, random),
      });
    } else {
      // Get the template for this workout day
      const dayTemplate = split.days[workoutDayIndex % split.days.length];

      // Select exercises for this day (with cross-day deduplication and volume awareness)
      const dayResult = selectAndPrescribeForDay(
        dayTemplate,
        constraintOptions,
        {
          goal: mapGoalToFitnessGoal(input.fitnessGoal),
          experience: input.experienceLevel,
          phase,
          sessionMinutes: input.sessionDurationMinutes,
          musclePriorities: input.musclePriorities,
          preferredExercises: input.preferredExercises,
          seed: weekSeed + i,
          weekExerciseIds,
          weekMuscleVolume,
        }
      );

      // After selection, track this day's exercises for cross-day deduplication
      for (const ex of dayResult.exercises) {
        weekExerciseIds.push(ex.exerciseId);

        // Track muscle volume from this day's exercises
        const exerciseDef = EXERCISE_BY_ID[ex.exerciseId];
        if (exerciseDef) {
          for (const muscle of exerciseDef.primaryMuscles) {
            weekMuscleVolume[muscle] = (weekMuscleVolume[muscle] ?? 0) + ex.sets;
          }
        }
      }

      // Generate warmup based on target muscles
      const warmup = generateWarmup({
        targetMuscles: dayTemplate.primaryMuscles,
        sessionMinutes: input.sessionDurationMinutes,
        limitations: input.physicalLimitations?.map(l => l.area),
      });

      days.push({
        dayNumber: i + 1,
        name: dayTemplate.name,
        isRestDay: false,
        focus: getFocusDescription(dayTemplate.primaryMuscles),
        targetMuscles: dayTemplate.primaryMuscles,
        warmup,
        exercises: dayResult.exercises,
        estimatedDurationMinutes: dayResult.estimatedDurationMinutes + warmup.estimatedMinutes,
        coachNotes: getWorkoutNote(phase, weekNumber, dayTemplate.name, random),
      });

      workoutDayIndex++;
    }

    dayOfWeek++;
  }
  
  return {
    weekNumber,
    phase,
    days,
    volumeMultiplier,
    intensityMultiplier,
  };
}

// =============================================================================
// FULL MESOCYCLE BUILDER
// =============================================================================

/**
 * Build a complete 4-week mesocycle.
 */
export function buildMesocycle(config: MesocycleConfig): {
  week1: WeekPlan;
  week2: WeekPlan;
  week3: WeekPlan;
  week4: WeekPlan;
} {
  return {
    week1: buildWeek(1, 4, config),
    week2: buildWeek(2, 4, config),
    week3: buildWeek(3, 4, config),
    week4: buildWeek(4, 4, config),
  };
}

/**
 * Calculate volume summary for the mesocycle.
 */
export function calculateVolumeSummary(
  mesocycle: { week1: WeekPlan; week2: WeekPlan; week3: WeekPlan; week4: WeekPlan }
): VolumeSummary {
  const byMuscle: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;
  let totalSets = 0;
  const exerciseIds = new Set<string>();
  
  // Calculate average weekly volume (use week 1-2 as representative)
  for (const week of [mesocycle.week1, mesocycle.week2]) {
    for (const day of week.days) {
      if (day.exercises) {
        for (const exercise of day.exercises) {
          totalSets += exercise.sets;
          exerciseIds.add(exercise.exerciseId);
          
          // Track by primary muscle (simplified - would need exercise lookup for accuracy)
          // For now, use the muscleGroup field
          const muscle = mapDisplayToMuscle(exercise.muscleGroup);
          if (muscle) {
            byMuscle[muscle] = (byMuscle[muscle] || 0) + exercise.sets;
          }
        }
      }
    }
  }
  
  // Average across the 2 main training weeks
  for (const muscle of Object.keys(byMuscle) as MuscleGroup[]) {
    byMuscle[muscle] = Math.round(byMuscle[muscle] / 2);
  }
  
  return {
    byMuscle,
    totalSets: Math.round(totalSets / 2), // Average weekly sets
    totalExercises: exerciseIds.size,
  };
}

/**
 * Generate substitution map for all exercises in the mesocycle.
 */
export function generateSubstitutions(
  mesocycle: { week1: WeekPlan; week2: WeekPlan; week3: WeekPlan; week4: WeekPlan },
  constraintOptions: ConstraintOptions
): SubstitutionMap {
  const substitutions: SubstitutionMap = {};
  const exerciseIds = new Set<string>();
  
  // Collect all exercise IDs
  for (const week of [mesocycle.week1, mesocycle.week2, mesocycle.week3, mesocycle.week4]) {
    for (const day of week.days) {
      if (day.exercises) {
        for (const exercise of day.exercises) {
          exerciseIds.add(exercise.exerciseId);
        }
      }
    }
  }
  
  // Find substitutes for each
  const available = applyConstraints(constraintOptions).available;
  
  for (const exerciseId of exerciseIds) {
    const subs = findSubstitutes(exerciseId, available, 3);
    if (subs.length > 0) {
      substitutions[exerciseId] = subs.map(s => s.id);
    }
  }
  
  return substitutions;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getVolumeMultiplier(phase: ReturnType<typeof getCurrentPhase>): number {
  switch (phase) {
    case 'accumulation': return 1.0;
    case 'intensification': return 1.1;
    case 'peak': return 0.9;
    case 'deload': return 0.5;
  }
}

function getIntensityMultiplier(phase: ReturnType<typeof getCurrentPhase>): number {
  switch (phase) {
    case 'accumulation': return 1.0;
    case 'intensification': return 1.05;
    case 'peak': return 1.1;
    case 'deload': return 0.7;
  }
}

function mapGoalToFitnessGoal(goal: GeneratorInput['fitnessGoal']): FitnessGoal {
  // Direct mapping since types should align
  return goal;
}

function getFocusDescription(muscles: MuscleGroup[]): string {
  if (muscles.length === 0) return 'Full Body';
  
  const displayNames: Record<string, string> = {
    chest: 'Chest',
    lats: 'Back',
    upper_back: 'Back',
    front_delts: 'Shoulders',
    side_delts: 'Shoulders',
    rear_delts: 'Shoulders',
    quads: 'Quads',
    hamstrings: 'Hamstrings',
    glutes: 'Glutes',
    biceps: 'Biceps',
    triceps: 'Triceps',
    abs: 'Core',
    calves: 'Calves',
  };
  
  const unique = [...new Set(muscles.map(m => displayNames[m] || m))];
  return unique.slice(0, 3).join(' & ');
}

function mapDisplayToMuscle(displayGroup: string): MuscleGroup | null {
  const mapping: Record<string, MuscleGroup> = {
    'Chest': 'chest',
    'Back': 'lats',
    'Shoulders': 'front_delts',
    'Arms': 'biceps',
    'Legs': 'quads',
    'Core': 'abs',
  };
  return mapping[displayGroup] || null;
}

function getRestDayNote(
  phase: ReturnType<typeof getCurrentPhase>,
  random: SeededRandom
): string {
  const notes = {
    accumulation: [
      'Focus on recovery. Light stretching or a walk recommended.',
      'Rest day - perfect time for mobility work.',
      'Let your muscles recover. Stay hydrated!',
    ],
    intensification: [
      'Important recovery day before pushing harder.',
      'Rest well - intensity is increasing.',
      'Active recovery: light cardio or yoga.',
    ],
    peak: [
      'Critical rest before peak performance.',
      'Prioritize sleep and nutrition today.',
      'Full recovery day - you\'ve earned it.',
    ],
    deload: [
      'Extra rest during deload week.',
      'Enjoy the lighter week - recovery is training.',
      'Light activity only if desired.',
    ],
  };
  
  return random.pick(notes[phase]);
}

function getWorkoutNote(
  phase: ReturnType<typeof getCurrentPhase>,
  weekNumber: number,
  dayName: string,
  random: SeededRandom
): string {
  const notes = {
    accumulation: [
      'Focus on quality reps with good form.',
      'Building your base this week - consistency is key.',
      'Leave 2-3 reps in the tank on compound lifts.',
    ],
    intensification: [
      'Push a bit harder today - you\'re ready.',
      'Increase weight slightly from last week if form is solid.',
      'Challenge yourself - controlled aggression.',
    ],
    peak: [
      'Test your limits today - you\'ve prepared for this.',
      'Time to see what you\'re capable of.',
      'Push to your edge, but stay safe.',
    ],
    deload: [
      'Light and easy today - focus on movement quality.',
      'Reduced intensity this week - enjoy it.',
      'Recovery week: 60% effort, 100% form.',
    ],
  };
  
  return random.pick(notes[phase]);
}

// =============================================================================
// PROGRESSION UTILITIES
// =============================================================================

/**
 * Calculate recommended weight increase for next mesocycle.
 */
export function calculateProgression(
  exerciseId: string,
  previousBestWeight: number,
  previousReps: number,
  goal: FitnessGoal
): { recommendedWeight: number; note: string } {
  // Simple linear progression
  let increase: number;
  let note: string;
  
  if (goal === 'strength') {
    // Strength: ~2.5-5% increase if hitting rep targets
    if (previousReps >= 5) {
      increase = previousBestWeight * 0.025;
      note = 'Great progress! Adding ~2.5% for next block.';
    } else {
      increase = 0;
      note = 'Keep working at this weight until you hit your rep target.';
    }
  } else {
    // Hypertrophy: ~2.5% increase if hitting top of rep range
    if (previousReps >= 10) {
      increase = previousBestWeight * 0.025;
      note = 'Ready to progress! Adding ~2.5% for next block.';
    } else {
      increase = 0;
      note = 'Stay at this weight and aim for the top of the rep range.';
    }
  }
  
  // Round to nearest 2.5 (standard plate increment)
  const rounded = Math.round(increase / 2.5) * 2.5;
  
  return {
    recommendedWeight: previousBestWeight + rounded,
    note,
  };
}

/**
 * Determine if user should proceed to next mesocycle or repeat.
 */
export function shouldProgressToNextMesocycle(
  completionRate: number,
  averageRIR: number,
  injuryReported: boolean
): { shouldProgress: boolean; reason: string } {
  if (injuryReported) {
    return {
      shouldProgress: false,
      reason: 'Injury reported - consider a modified or recovery program.',
    };
  }
  
  if (completionRate < 0.7) {
    return {
      shouldProgress: false,
      reason: 'Completion rate below 70% - consider repeating this block or reducing volume.',
    };
  }
  
  if (averageRIR > 4) {
    return {
      shouldProgress: true,
      reason: 'Program may be too easy - consider increasing intensity next block.',
    };
  }
  
  if (averageRIR < 1) {
    return {
      shouldProgress: false,
      reason: 'Training too hard - consider a deload or reducing intensity.',
    };
  }
  
  return {
    shouldProgress: true,
    reason: 'Good progress! Ready for next mesocycle with progressive overload.',
  };
}
