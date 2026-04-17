/**
 * Exercise Selector - Smart exercise selection for workout generation
 * 
 * This module handles:
 * 1. Selecting exercises for specific movement patterns
 * 2. Ensuring muscle balance across the workout
 * 3. Prioritizing compound exercises
 * 4. Respecting user preferences
 * 5. Adding variety while maintaining effectiveness
 */

import type {
  Exercise,
  MuscleGroup,
  MovementPattern,
  FitnessGoal,
  ExperienceLevel,
  MusclePriority,
  ExercisePrescription,
} from '../generator/types';
import type { SplitDayTemplate } from '../generator/types';
import { EXERCISE_LIBRARY, EXERCISE_BY_ID } from '../exercises/library';
import { MUSCLE_TO_DISPLAY } from '../exercises/muscleMap';
import { getVolumeTargets } from '../templates/volumeTargets';
import { SeededRandom } from '../utils/seededRandom';
import { applyConstraints, type ConstraintOptions } from './constraints';
import { getGoalTier } from '../exercises/goalTiers';

// =============================================================================
// SELECTION CONFIGURATION
// =============================================================================

export interface SelectionConfig {
  /** Available exercises after constraint filtering */
  availableExercises: Exercise[];
  /** User's fitness goal */
  goal: FitnessGoal;
  /** Experience level */
  experience: ExperienceLevel;
  /** Muscle priorities (high/normal/low) */
  musclePriorities?: MusclePriority[];
  /** Preferred exercise IDs */
  preferredExercises?: string[];
  /** Random generator for reproducibility */
  random: SeededRandom;
}

// =============================================================================
// EXERCISE SCORING
// =============================================================================

/**
 * Score an exercise for selection. Higher score = more likely to be selected.
 */
export function scoreExercise(
  exercise: Exercise,
  config: SelectionConfig,
  context: {
    targetPattern: MovementPattern;
    targetMuscles: MuscleGroup[];
    alreadySelected: Set<string>;
    dayPosition: number; // 0 = first exercise, higher = later
    weekExerciseIds?: string[]; // exercise IDs already used in other days this week
    weekMuscleVolume?: Record<string, number>; // muscle -> sets already programmed this week
  }
): number {
  let score = 50; // Base score
  
  const { goal, experience, musclePriorities, preferredExercises, random } = config;
  const { targetPattern, targetMuscles, alreadySelected, dayPosition } = context;
  
  // 1. Movement pattern match (critical)
  if (exercise.movementPattern === targetPattern) {
    score += 30;
  }
  
  // 2. Primary muscle targeting
  const muscleHits = exercise.primaryMuscles.filter(m => targetMuscles.includes(m)).length;
  score += muscleHits * 15;
  
  // 3. Compound vs isolation placement
  if (dayPosition < 3 && exercise.category === 'compound') {
    score += 20; // Prefer compounds early
  } else if (dayPosition >= 3 && exercise.category === 'isolation') {
    score += 15; // Prefer isolation later
  }
  
  // 4. Goal alignment
  if (goal === 'strength' && exercise.category === 'compound' && exercise.repRangeMin <= 5) {
    score += 15;
  } else if (goal === 'hypertrophy' && exercise.repRangeMax >= 10) {
    score += 10;
  } else if (goal === 'fat_loss' && exercise.canBeSuperset) {
    score += 10;
  }

  // 4b. Goal-specific exercise tiers (primary/secondary/tertiary)
  const tier = getGoalTier(exercise.id, goal);
  if (tier === 'primary') {
    score += 20; // Core movements for this goal get priority
  } else if (tier === 'secondary') {
    score += 8; // Assistance work
  }
  // tertiary = no bonus (default)

  // 5. Experience appropriateness — hard filter for beginners, soft for others
  if (experience === 'beginner') {
    if (exercise.difficulty === 'advanced') return -1; // Hard exclude
    if (exercise.difficulty === 'intermediate') score -= 35; // Strong penalty — beginner alternatives preferred
    if (exercise.difficulty === 'beginner') score += 25; // Strong boost for fundamentals
  } else if (experience === 'intermediate') {
    if (exercise.difficulty === 'advanced') score -= 15;
    if (exercise.difficulty === experience) score += 10;
    if (exercise.difficulty === 'beginner') score -= 5; // Slight preference away from too-easy
  } else {
    if (exercise.difficulty === 'advanced') score += 10;
    if (exercise.difficulty === experience) score += 5;
    if (exercise.difficulty === 'beginner') score -= 15; // Advanced users should get harder exercises
  }
  
  // 6. User preferences
  if (preferredExercises?.includes(exercise.id)) {
    score += 25;
  }
  
  // 7. Muscle priorities
  if (musclePriorities) {
    for (const prio of musclePriorities) {
      const muscleMatch = exercise.primaryMuscles.some(m => 
        m === prio.muscle || MUSCLE_TO_DISPLAY[m] === prio.muscle
      );
      if (muscleMatch) {
        if (prio.priority === 'high') score += 15;
        else if (prio.priority === 'low') score -= 10;
      }
    }
  }
  
  // 8. Avoid duplicates and similar exercises
  if (alreadySelected.has(exercise.id)) {
    score -= 100; // Heavily penalize duplicates
  }
  
  // Check for similar exercises already selected
  if (exercise.similarExercises) {
    const similarSelected = exercise.similarExercises.filter(id => alreadySelected.has(id));
    score -= similarSelected.length * 15;
  }
  
  // 9. Cross-day deduplication: penalize exercises already used in other days this week
  if (context.weekExerciseIds?.includes(exercise.id)) {
    score -= 50; // heavy penalty but not -Infinity (allow if no alternatives)
  }
  if (context.weekExerciseIds && exercise.similarExercises) {
    const similarUsedThisWeek = exercise.similarExercises.filter(id =>
      context.weekExerciseIds!.includes(id)
    );
    score -= similarUsedThisWeek.length * 20;
  }

  // 10. Volume enforcement: adjust score based on weekly muscle volume vs optimal targets
  if (context.weekMuscleVolume) {
    const volumeTargets = getVolumeTargets(goal, experience);
    for (const muscle of exercise.primaryMuscles) {
      const currentSets = context.weekMuscleVolume[muscle] ?? 0;
      const optimal = volumeTargets.optimalSets[muscle] ?? 0;

      if (optimal > 0) {
        if (currentSets >= optimal * 1.2) {
          score -= 30; // well above optimal, strongly discourage more
        } else if (currentSets >= optimal) {
          score -= 15; // at optimal, mildly discourage
        } else if (currentSets < optimal * 0.5) {
          score += 10; // well below optimal, encourage
        }
      }
    }
  }

  // 11. Equipment efficiency (prefer exercises that don't require setup changes)
  if (exercise.equipment.length === 1) {
    score += 5;
  }

  // 12. Small random factor for variety
  score += random.int(-5, 5);
  
  return Math.max(0, score);
}

// =============================================================================
// EXERCISE SELECTION
// =============================================================================

/**
 * Select an exercise for a specific movement pattern.
 */
export function selectExerciseForPattern(
  pattern: MovementPattern,
  targetMuscles: MuscleGroup[],
  config: SelectionConfig,
  alreadySelected: Set<string>,
  dayPosition: number,
  weekContext?: { weekExerciseIds?: string[]; weekMuscleVolume?: Record<string, number> }
): Exercise | null {
  const candidates = config.availableExercises.filter(ex => 
    ex.movementPattern === pattern
  );
  
  if (candidates.length === 0) {
    // Fallback: find exercises that at least target the muscles
    const fallbacks = config.availableExercises.filter(ex =>
      ex.primaryMuscles.some(m => targetMuscles.includes(m))
    );
    if (fallbacks.length === 0) return null;
    return config.random.pick(fallbacks);
  }
  
  // Score all candidates, filter out hard excludes (score === -1)
  const scored = candidates.map(exercise => ({
    exercise,
    score: scoreExercise(exercise, config, {
      targetPattern: pattern,
      targetMuscles,
      alreadySelected,
      dayPosition,
      weekExerciseIds: weekContext?.weekExerciseIds,
      weekMuscleVolume: weekContext?.weekMuscleVolume,
    }),
  })).filter(s => s.score > 0);

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Pick from top candidates with some randomness
  const topCount = Math.min(3, scored.length);
  const topCandidates = scored.slice(0, topCount);
  
  // Weighted selection from top candidates
  const weights = topCandidates.map(c => Math.max(1, c.score));
  return config.random.weightedPick(
    topCandidates.map(c => c.exercise),
    weights
  );
}

/**
 * Select exercises for a complete workout day.
 */
export function selectExercisesForDay(
  dayTemplate: SplitDayTemplate,
  config: SelectionConfig,
  exerciseCount: number,
  weekContext?: { weekExerciseIds?: string[]; weekMuscleVolume?: Record<string, number> }
): Exercise[] {
  const selected: Exercise[] = [];
  const selectedIds = new Set<string>();
  
  // Determine exercise count within template bounds
  const count = Math.min(
    Math.max(exerciseCount, dayTemplate.exerciseCount.min),
    dayTemplate.exerciseCount.max
  );
  
  // First pass: select for each movement pattern
  for (let i = 0; i < dayTemplate.movementPatterns.length && selected.length < count; i++) {
    const pattern = dayTemplate.movementPatterns[i];
    
    const exercise = selectExerciseForPattern(
      pattern,
      dayTemplate.primaryMuscles,
      config,
      selectedIds,
      selected.length,
      weekContext
    );
    
    if (exercise && !selectedIds.has(exercise.id)) {
      selected.push(exercise);
      selectedIds.add(exercise.id);
    }
  }
  
  // Second pass: fill remaining slots with exercises targeting primary muscles
  while (selected.length < count) {
    // Find muscles that need more work
    const musclesCovered = new Set<MuscleGroup>();
    for (const ex of selected) {
      ex.primaryMuscles.forEach(m => musclesCovered.add(m));
    }
    
    const musclesNeeded = dayTemplate.primaryMuscles.filter(m => !musclesCovered.has(m));
    const targetMuscles = musclesNeeded.length > 0 ? musclesNeeded : dayTemplate.primaryMuscles;
    
    // Find candidates that target needed muscles
    const candidates = config.availableExercises.filter(ex =>
      !selectedIds.has(ex.id) &&
      ex.primaryMuscles.some(m => targetMuscles.includes(m))
    );
    
    if (candidates.length === 0) break;
    
    // Score and select, filter out hard excludes
    const scored = candidates.map(exercise => ({
      exercise,
      score: scoreExercise(exercise, config, {
        targetPattern: exercise.movementPattern,
        targetMuscles,
        alreadySelected: selectedIds,
        dayPosition: selected.length,
        weekExerciseIds: weekContext?.weekExerciseIds,
        weekMuscleVolume: weekContext?.weekMuscleVolume,
      }),
    })).filter(s => s.score > 0);

    scored.sort((a, b) => b.score - a.score);
    
    if (scored.length > 0) {
      const pick = scored[0].exercise;
      selected.push(pick);
      selectedIds.add(pick.id);
    } else {
      break;
    }
  }
  
  // Sort: compounds first if template requires it
  if (dayTemplate.compoundFirst) {
    selected.sort((a, b) => {
      if (a.category === 'compound' && b.category !== 'compound') return -1;
      if (a.category !== 'compound' && b.category === 'compound') return 1;
      return 0;
    });
  }
  
  return selected;
}

// =============================================================================
// EXERCISE PRESCRIPTION
// =============================================================================

/**
 * Convert an Exercise to an ExercisePrescription with sets/reps/RIR.
 */
export function prescribeExercise(
  exercise: Exercise,
  options: {
    goal: FitnessGoal;
    phase: 'accumulation' | 'intensification' | 'peak' | 'deload';
    position: number; // Position in workout
    isCompound: boolean;
  }
): ExercisePrescription {
  const { goal, phase, position, isCompound } = options;
  
  // Determine sets based on goal and phase
  let sets: number;
  if (phase === 'deload') {
    sets = 2;
  } else if (goal === 'strength') {
    sets = isCompound ? (phase === 'peak' ? 5 : 4) : 3;
  } else if (goal === 'hypertrophy') {
    sets = isCompound ? 4 : 3;
  } else {
    sets = isCompound ? 3 : 3;
  }
  
  // Adjust sets for later exercises
  if (position >= 4) sets = Math.max(2, sets - 1);
  
  // Determine rep range based on goal and exercise type
  let reps: string;
  if (goal === 'strength' && isCompound) {
    reps = phase === 'peak' ? '2-4' : phase === 'accumulation' ? '4-6' : '3-5';
  } else if (goal === 'hypertrophy') {
    if (isCompound) {
      reps = '6-10';
    } else {
      reps = phase === 'accumulation' ? '10-15' : '8-12';
    }
  } else if (goal === 'fat_loss') {
    reps = isCompound ? '8-12' : '12-15';
  } else {
    reps = isCompound ? '6-10' : '10-12';
  }
  
  // Clamp to exercise's natural rep range
  // (This is a simplified clamp - a real implementation would parse the range)
  
  // Determine RIR based on phase
  let rirTarget: number;
  switch (phase) {
    case 'accumulation':
      rirTarget = isCompound ? 3 : 2;
      break;
    case 'intensification':
      rirTarget = isCompound ? 2 : 1;
      break;
    case 'peak':
      rirTarget = isCompound ? 1 : 1;
      break;
    case 'deload':
      rirTarget = 4;
      break;
  }
  
  // Rest time
  let restSeconds = exercise.defaultRestSeconds;
  if (goal === 'strength' && isCompound) {
    restSeconds = Math.max(restSeconds, 180);
  } else if (goal === 'fat_loss') {
    restSeconds = Math.min(restSeconds, 60);
  }
  
  // Intensity modifier for phase
  let intensityModifier: number | undefined;
  if (phase === 'deload') {
    intensityModifier = 0.6;
  } else if (phase === 'peak') {
    intensityModifier = 1.05;
  }
  
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    muscleGroup: MUSCLE_TO_DISPLAY[exercise.primaryMuscles[0]] || 'Full Body',
    sets,
    reps,
    rirTarget,
    restSeconds,
    intensityModifier,
    videoId: exercise.youtubeVideoId,
  };
}

// =============================================================================
// FULL DAY PRESCRIPTION
// =============================================================================

export interface DaySelectionResult {
  exercises: ExercisePrescription[];
  warnings: string[];
  estimatedDurationMinutes: number;
}

/**
 * Select and prescribe exercises for a complete workout day.
 */
export function selectAndPrescribeForDay(
  dayTemplate: SplitDayTemplate,
  constraintOptions: ConstraintOptions,
  selectionOptions: {
    goal: FitnessGoal;
    experience: ExperienceLevel;
    phase: 'accumulation' | 'intensification' | 'peak' | 'deload';
    sessionMinutes: number;
    musclePriorities?: MusclePriority[];
    preferredExercises?: string[];
    seed: number;
    weekExerciseIds?: string[];
    weekMuscleVolume?: Record<string, number>;
  }
): DaySelectionResult {
  const random = new SeededRandom(selectionOptions.seed);
  const warnings: string[] = [];
  
  // Apply constraints
  const constraintResult = applyConstraints(constraintOptions);
  warnings.push(...constraintResult.warnings);
  
  // Calculate exercise count based on time
  // Rough estimate: 8-10 minutes per exercise (including rest)
  const baseExerciseCount = Math.floor(selectionOptions.sessionMinutes / 9);
  const exerciseCount = Math.min(
    Math.max(baseExerciseCount, dayTemplate.exerciseCount.min),
    dayTemplate.exerciseCount.max
  );
  
  // Create selection config
  const config: SelectionConfig = {
    availableExercises: constraintResult.available,
    goal: selectionOptions.goal,
    experience: selectionOptions.experience,
    musclePriorities: selectionOptions.musclePriorities,
    preferredExercises: selectionOptions.preferredExercises,
    random,
  };
  
  // Select exercises (with cross-day deduplication and volume awareness)
  const weekContext = (selectionOptions.weekExerciseIds || selectionOptions.weekMuscleVolume)
    ? {
        weekExerciseIds: selectionOptions.weekExerciseIds,
        weekMuscleVolume: selectionOptions.weekMuscleVolume,
      }
    : undefined;
  const selectedExercises = selectExercisesForDay(dayTemplate, config, exerciseCount, weekContext);
  
  if (selectedExercises.length < dayTemplate.exerciseCount.min) {
    warnings.push(
      `Only ${selectedExercises.length} exercises available for ${dayTemplate.name}. ` +
      `Consider adding equipment.`
    );
  }
  
  // Convert to prescriptions
  const prescriptions = selectedExercises.map((exercise, index) =>
    prescribeExercise(exercise, {
      goal: selectionOptions.goal,
      phase: selectionOptions.phase,
      position: index,
      isCompound: exercise.category === 'compound',
    })
  );
  
  // Estimate duration
  const estimatedDurationMinutes = prescriptions.reduce((total, p) => {
    const setsTime = p.sets * 1.5; // ~1.5 min per set including setup
    const restTime = (p.sets - 1) * (p.restSeconds / 60);
    return total + setsTime + restTime;
  }, 0);
  
  return {
    exercises: prescriptions,
    warnings,
    estimatedDurationMinutes: Math.round(estimatedDurationMinutes),
  };
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Get exercises sorted by priority for a muscle group.
 */
export function getExercisesForMuscle(
  muscle: MuscleGroup,
  availableExercises: Exercise[],
  compoundsFirst: boolean = true
): Exercise[] {
  const matching = availableExercises.filter(ex =>
    ex.primaryMuscles.includes(muscle)
  );
  
  if (compoundsFirst) {
    matching.sort((a, b) => {
      if (a.category === 'compound' && b.category !== 'compound') return -1;
      if (a.category !== 'compound' && b.category === 'compound') return 1;
      return 0;
    });
  }
  
  return matching;
}

/**
 * Check if we have enough variety for a specific muscle.
 */
export function hasVarietyForMuscle(
  muscle: MuscleGroup,
  availableExercises: Exercise[],
  minCount: number = 3
): boolean {
  const count = availableExercises.filter(ex =>
    ex.primaryMuscles.includes(muscle)
  ).length;
  
  return count >= minCount;
}
