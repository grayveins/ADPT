/**
 * Exercise Substitutions - Find alternatives for exercises
 * 
 * This module handles:
 * 1. Finding similar exercises based on movement pattern and muscles
 * 2. Respecting equipment constraints
 * 3. Providing easier/harder variations
 */

import type { Exercise, MuscleGroup, MovementPattern } from '../generator/types';
import { EXERCISE_BY_ID, EXERCISE_LIBRARY } from '../exercises/library';

// =============================================================================
// SIMILARITY SCORING
// =============================================================================

/**
 * Calculate similarity score between two exercises.
 * Higher score = more similar.
 */
export function calculateSimilarity(exerciseA: Exercise, exerciseB: Exercise): number {
  if (exerciseA.id === exerciseB.id) return 0; // Don't suggest same exercise
  
  let score = 0;
  
  // Same movement pattern is critical
  if (exerciseA.movementPattern === exerciseB.movementPattern) {
    score += 50;
  }
  
  // Primary muscle overlap
  const primaryOverlap = exerciseA.primaryMuscles.filter(m =>
    exerciseB.primaryMuscles.includes(m)
  ).length;
  score += primaryOverlap * 20;
  
  // Secondary muscle overlap
  const secondaryOverlap = exerciseA.secondaryMuscles.filter(m =>
    exerciseB.secondaryMuscles.includes(m)
  ).length;
  score += secondaryOverlap * 5;
  
  // Same category (compound/isolation)
  if (exerciseA.category === exerciseB.category) {
    score += 15;
  }
  
  // Similar difficulty
  if (exerciseA.difficulty === exerciseB.difficulty) {
    score += 10;
  }
  
  // Similar rep ranges indicate similar training effect
  const repRangeOverlap = 
    Math.min(exerciseA.repRangeMax, exerciseB.repRangeMax) -
    Math.max(exerciseA.repRangeMin, exerciseB.repRangeMin);
  if (repRangeOverlap > 0) {
    score += Math.min(10, repRangeOverlap);
  }
  
  // Explicit similar exercises declaration
  if (exerciseA.similarExercises?.includes(exerciseB.id)) {
    score += 30;
  }
  
  // Same unilateral nature
  if (exerciseA.isUnilateral === exerciseB.isUnilateral) {
    score += 5;
  }
  
  return score;
}

// =============================================================================
// SUBSTITUTION FINDING
// =============================================================================

/**
 * Find substitute exercises for a given exercise ID.
 */
export function findSubstitutes(
  exerciseId: string,
  availableExercises: Exercise[],
  maxCount: number = 3
): Exercise[] {
  const target = EXERCISE_BY_ID[exerciseId];
  if (!target) return [];
  
  // Score all available exercises
  const scored = availableExercises
    .filter(ex => ex.id !== exerciseId)
    .map(exercise => ({
      exercise,
      score: calculateSimilarity(target, exercise),
    }))
    .filter(({ score }) => score > 30) // Minimum similarity threshold
    .sort((a, b) => b.score - a.score);
  
  return scored.slice(0, maxCount).map(s => s.exercise);
}

/**
 * Find an easier variation of an exercise.
 */
export function findEasierVariation(
  exerciseId: string,
  availableExercises: Exercise[]
): Exercise | null {
  const target = EXERCISE_BY_ID[exerciseId];
  if (!target) return null;
  
  // First check explicit easier variation
  if (target.easierVariation) {
    const explicit = availableExercises.find(ex => ex.id === target.easierVariation);
    if (explicit) return explicit;
  }
  
  // Otherwise find similar exercise with lower difficulty
  const difficultyOrder: Exercise['difficulty'][] = ['beginner', 'intermediate', 'advanced'];
  const currentDiffIndex = difficultyOrder.indexOf(target.difficulty);
  
  if (currentDiffIndex <= 0) return null; // Already at easiest
  
  const candidates = availableExercises.filter(ex =>
    ex.movementPattern === target.movementPattern &&
    ex.primaryMuscles.some(m => target.primaryMuscles.includes(m)) &&
    difficultyOrder.indexOf(ex.difficulty) < currentDiffIndex
  );
  
  if (candidates.length === 0) return null;
  
  // Return the most similar one
  const scored = candidates.map(ex => ({
    exercise: ex,
    score: calculateSimilarity(target, ex),
  }));
  scored.sort((a, b) => b.score - a.score);
  
  return scored[0].exercise;
}

/**
 * Find a harder variation of an exercise.
 */
export function findHarderVariation(
  exerciseId: string,
  availableExercises: Exercise[]
): Exercise | null {
  const target = EXERCISE_BY_ID[exerciseId];
  if (!target) return null;
  
  // First check explicit harder variation
  if (target.harderVariation) {
    const explicit = availableExercises.find(ex => ex.id === target.harderVariation);
    if (explicit) return explicit;
  }
  
  // Otherwise find similar exercise with higher difficulty
  const difficultyOrder: Exercise['difficulty'][] = ['beginner', 'intermediate', 'advanced'];
  const currentDiffIndex = difficultyOrder.indexOf(target.difficulty);
  
  if (currentDiffIndex >= difficultyOrder.length - 1) return null; // Already at hardest
  
  const candidates = availableExercises.filter(ex =>
    ex.movementPattern === target.movementPattern &&
    ex.primaryMuscles.some(m => target.primaryMuscles.includes(m)) &&
    difficultyOrder.indexOf(ex.difficulty) > currentDiffIndex
  );
  
  if (candidates.length === 0) return null;
  
  // Return the most similar one
  const scored = candidates.map(ex => ({
    exercise: ex,
    score: calculateSimilarity(target, ex),
  }));
  scored.sort((a, b) => b.score - a.score);
  
  return scored[0].exercise;
}

// =============================================================================
// SUBSTITUTION BY CONSTRAINT
// =============================================================================

/**
 * Find a substitute when user doesn't have required equipment.
 */
export function findEquipmentAlternative(
  exerciseId: string,
  availableExercises: Exercise[]
): Exercise | null {
  const target = EXERCISE_BY_ID[exerciseId];
  if (!target) return null;
  
  // Find exercises with same pattern but different equipment
  const candidates = availableExercises.filter(ex =>
    ex.id !== exerciseId &&
    ex.movementPattern === target.movementPattern &&
    ex.primaryMuscles.some(m => target.primaryMuscles.includes(m))
  );
  
  if (candidates.length === 0) return null;
  
  // Prefer same category (compound/isolation)
  const sameCategory = candidates.filter(ex => ex.category === target.category);
  const pool = sameCategory.length > 0 ? sameCategory : candidates;
  
  // Return the most similar one
  const scored = pool.map(ex => ({
    exercise: ex,
    score: calculateSimilarity(target, ex),
  }));
  scored.sort((a, b) => b.score - a.score);
  
  return scored[0].exercise;
}

/**
 * Find a substitute for someone with a joint limitation.
 */
export function findLimitationSafeAlternative(
  exerciseId: string,
  availableExercises: Exercise[],
  limitedJoint: string
): Exercise | null {
  const target = EXERCISE_BY_ID[exerciseId];
  if (!target) return null;
  
  // Find exercises that don't stress the limited joint
  const candidates = availableExercises.filter(ex => {
    if (ex.id === exerciseId) return false;
    
    // Must target similar muscles
    if (!ex.primaryMuscles.some(m => target.primaryMuscles.includes(m))) return false;
    
    // Must not stress the limited joint
    const stress = ex.jointStress[limitedJoint as keyof typeof ex.jointStress];
    if (stress === 'high' || stress === 'moderate') return false;
    
    return true;
  });
  
  if (candidates.length === 0) return null;
  
  // Return the most similar one
  const scored = candidates.map(ex => ({
    exercise: ex,
    score: calculateSimilarity(target, ex),
  }));
  scored.sort((a, b) => b.score - a.score);
  
  return scored[0].exercise;
}

// =============================================================================
// BATCH SUBSTITUTIONS
// =============================================================================

export interface SubstitutionResult {
  original: Exercise;
  substitutes: Exercise[];
  reason?: string;
}

/**
 * Find substitutions for multiple exercises at once.
 */
export function findBatchSubstitutes(
  exerciseIds: string[],
  availableExercises: Exercise[],
  maxSubstitutesEach: number = 3
): Map<string, SubstitutionResult> {
  const results = new Map<string, SubstitutionResult>();
  
  for (const id of exerciseIds) {
    const original = EXERCISE_BY_ID[id];
    if (!original) continue;
    
    const substitutes = findSubstitutes(id, availableExercises, maxSubstitutesEach);
    
    results.set(id, {
      original,
      substitutes,
    });
  }
  
  return results;
}

// =============================================================================
// VARIATION PROGRESSIONS
// =============================================================================

/**
 * Get a progression path for an exercise (easier → current → harder).
 */
export function getProgressionPath(
  exerciseId: string,
  availableExercises: Exercise[]
): {
  easier: Exercise | null;
  current: Exercise;
  harder: Exercise | null;
} | null {
  const current = EXERCISE_BY_ID[exerciseId];
  if (!current) return null;
  
  return {
    easier: findEasierVariation(exerciseId, availableExercises),
    current,
    harder: findHarderVariation(exerciseId, availableExercises),
  };
}

/**
 * Suggest exercise swaps for variety in a new mesocycle.
 * Swaps out some exercises while maintaining balance.
 */
export function suggestVarietySwaps(
  currentExerciseIds: string[],
  availableExercises: Exercise[],
  swapPercentage: number = 0.3
): Map<string, Exercise> {
  const swaps = new Map<string, Exercise>();
  const swapCount = Math.floor(currentExerciseIds.length * swapPercentage);
  
  // Group exercises by movement pattern
  const byPattern = new Map<MovementPattern, string[]>();
  for (const id of currentExerciseIds) {
    const ex = EXERCISE_BY_ID[id];
    if (!ex) continue;
    
    const existing = byPattern.get(ex.movementPattern) || [];
    existing.push(id);
    byPattern.set(ex.movementPattern, existing);
  }
  
  // For each pattern, consider swapping one exercise
  let swapped = 0;
  for (const [pattern, ids] of byPattern) {
    if (swapped >= swapCount) break;
    if (ids.length === 0) continue;
    
    // Pick one to potentially swap
    const toSwap = ids[Math.floor(Math.random() * ids.length)];
    const subs = findSubstitutes(toSwap, availableExercises, 3);
    
    // Filter out any already in the current list
    const validSubs = subs.filter(s => !currentExerciseIds.includes(s.id));
    
    if (validSubs.length > 0) {
      swaps.set(toSwap, validSubs[0]);
      swapped++;
    }
  }
  
  return swaps;
}
