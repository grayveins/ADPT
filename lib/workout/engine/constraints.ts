/**
 * Constraints Engine - Filter exercises based on equipment and limitations
 * 
 * This module handles:
 * 1. Equipment availability filtering
 * 2. Physical limitation/injury filtering
 * 3. Exercise difficulty filtering by experience level
 */

import type { 
  Exercise, 
  Equipment, 
  UserEquipment,
  JointArea,
  PhysicalLimitation,
  ExperienceLevel,
} from '../generator/types';
import { EXERCISE_LIBRARY } from '../exercises/library';
import { userEquipmentToEngine, hasAllEquipment } from '../exercises/equipmentMap';

// =============================================================================
// EQUIPMENT CONSTRAINTS
// =============================================================================

/**
 * Filter exercises to only those the user can perform with their equipment.
 */
export function filterByEquipment(
  exercises: Exercise[],
  userEquipment: UserEquipment[]
): Exercise[] {
  const availableEquipment = userEquipmentToEngine(userEquipment);
  
  return exercises.filter(exercise => {
    // Check if user has ALL required equipment
    const hasRequired = exercise.equipment.every(eq => availableEquipment.includes(eq));
    return hasRequired;
  });
}

/**
 * Get exercises that could be done with additional equipment.
 * Useful for showing "unlock with X equipment" suggestions.
 */
export function getExercisesNeedingEquipment(
  exercises: Exercise[],
  userEquipment: UserEquipment[],
  additionalEquipment: Equipment
): Exercise[] {
  const currentAvailable = userEquipmentToEngine(userEquipment);
  const withAdditional = [...currentAvailable, additionalEquipment];
  
  return exercises.filter(exercise => {
    // Not currently available
    const notCurrentlyAvailable = !exercise.equipment.every(eq => currentAvailable.includes(eq));
    // But would be available with additional equipment
    const wouldBeAvailable = exercise.equipment.every(eq => withAdditional.includes(eq));
    
    return notCurrentlyAvailable && wouldBeAvailable;
  });
}

// =============================================================================
// LIMITATION CONSTRAINTS
// =============================================================================

/**
 * Joint stress threshold by limitation severity.
 * Maps severity to maximum acceptable stress level.
 */
const SEVERITY_THRESHOLDS: Record<PhysicalLimitation['severity'], number> = {
  mild: 2,      // Allow up to moderate stress
  moderate: 1,  // Allow only low stress
  severe: 0,    // No stress allowed
};

const STRESS_LEVELS: Record<string, number> = {
  none: 0,
  low: 1,
  moderate: 2,
  high: 3,
};

/**
 * Filter exercises based on physical limitations.
 */
export function filterByLimitations(
  exercises: Exercise[],
  limitations: PhysicalLimitation[]
): Exercise[] {
  if (limitations.length === 0) return exercises;
  
  return exercises.filter(exercise => {
    // Check each limitation
    for (const limitation of limitations) {
      const exerciseStress = exercise.jointStress[limitation.area];
      
      if (exerciseStress) {
        const stressLevel = STRESS_LEVELS[exerciseStress] || 0;
        const maxAllowed = SEVERITY_THRESHOLDS[limitation.severity];
        
        if (stressLevel > maxAllowed) {
          return false; // Exercise puts too much stress on limited area
        }
      }
    }
    
    return true;
  });
}

/**
 * Get safety warnings for exercises that stress limited areas.
 * Returns exercises that are allowed but should be approached with caution.
 */
export function getExercisesWithCaution(
  exercises: Exercise[],
  limitations: PhysicalLimitation[]
): Array<{ exercise: Exercise; warnings: string[] }> {
  const results: Array<{ exercise: Exercise; warnings: string[] }> = [];
  
  for (const exercise of exercises) {
    const warnings: string[] = [];
    
    for (const limitation of limitations) {
      const stress = exercise.jointStress[limitation.area];
      if (stress && stress !== 'none') {
        warnings.push(
          `${exercise.name} puts ${stress} stress on ${limitation.area.replace('_', ' ')}`
        );
      }
    }
    
    if (warnings.length > 0) {
      results.push({ exercise, warnings });
    }
  }
  
  return results;
}

// =============================================================================
// EXPERIENCE LEVEL CONSTRAINTS
// =============================================================================

/**
 * Filter exercises by difficulty appropriate for experience level.
 */
export function filterByExperience(
  exercises: Exercise[],
  experience: ExperienceLevel
): Exercise[] {
  const allowedDifficulties: Record<ExperienceLevel, Exercise['difficulty'][]> = {
    beginner: ['beginner'],
    intermediate: ['beginner', 'intermediate'],
    advanced: ['beginner', 'intermediate', 'advanced'],
  };
  
  const allowed = allowedDifficulties[experience];
  return exercises.filter(ex => allowed.includes(ex.difficulty));
}

/**
 * Get exercises that are "aspirational" - slightly above current level.
 * Useful for progression suggestions.
 */
export function getAspirationalExercises(
  exercises: Exercise[],
  experience: ExperienceLevel
): Exercise[] {
  const nextLevel: Record<ExperienceLevel, Exercise['difficulty'] | null> = {
    beginner: 'intermediate',
    intermediate: 'advanced',
    advanced: null,
  };
  
  const target = nextLevel[experience];
  if (!target) return [];
  
  return exercises.filter(ex => ex.difficulty === target);
}

// =============================================================================
// COMBINED CONSTRAINT PIPELINE
// =============================================================================

export interface ConstraintOptions {
  userEquipment: UserEquipment[];
  limitations?: PhysicalLimitation[];
  experienceLevel?: ExperienceLevel;
  excludedExercises?: string[];  // Exercise IDs to exclude
  preferredExercises?: string[]; // Exercise IDs to prioritize
}

export interface ConstraintResult {
  available: Exercise[];
  excluded: {
    byEquipment: Exercise[];
    byLimitation: Exercise[];
    byExperience: Exercise[];
    byUserPreference: Exercise[];
  };
  warnings: string[];
}

/**
 * Apply all constraints to the exercise library and return available exercises.
 */
export function applyConstraints(options: ConstraintOptions): ConstraintResult {
  const {
    userEquipment,
    limitations = [],
    experienceLevel = 'intermediate',
    excludedExercises = [],
  } = options;
  
  let exercises = [...EXERCISE_LIBRARY];
  const warnings: string[] = [];
  
  // Track what gets excluded at each stage
  const excluded = {
    byEquipment: [] as Exercise[],
    byLimitation: [] as Exercise[],
    byExperience: [] as Exercise[],
    byUserPreference: [] as Exercise[],
  };
  
  // 1. Filter by equipment
  const afterEquipment = filterByEquipment(exercises, userEquipment);
  excluded.byEquipment = exercises.filter(ex => !afterEquipment.includes(ex));
  exercises = afterEquipment;
  
  if (excluded.byEquipment.length > 20) {
    warnings.push(`${excluded.byEquipment.length} exercises unavailable due to equipment`);
  }
  
  // 2. Filter by limitations
  const afterLimitations = filterByLimitations(exercises, limitations);
  excluded.byLimitation = exercises.filter(ex => !afterLimitations.includes(ex));
  exercises = afterLimitations;
  
  if (excluded.byLimitation.length > 0) {
    const areas = [...new Set(limitations.map(l => l.area))];
    warnings.push(`${excluded.byLimitation.length} exercises excluded for ${areas.join(', ')} safety`);
  }
  
  // 3. Filter by experience (but keep some advanced options for variety)
  const afterExperience = filterByExperience(exercises, experienceLevel);
  excluded.byExperience = exercises.filter(ex => !afterExperience.includes(ex));
  exercises = afterExperience;
  
  // 4. Remove user-excluded exercises
  if (excludedExercises.length > 0) {
    const excludedSet = new Set(excludedExercises);
    const afterUserExclusion = exercises.filter(ex => !excludedSet.has(ex.id));
    excluded.byUserPreference = exercises.filter(ex => excludedSet.has(ex.id));
    exercises = afterUserExclusion;
  }
  
  // Check if we have enough exercises
  if (exercises.length < 20) {
    warnings.push('Limited exercise variety available. Consider adding equipment or adjusting limitations.');
  }
  
  return {
    available: exercises,
    excluded,
    warnings,
  };
}

// =============================================================================
// EXERCISE AVAILABILITY QUERIES
// =============================================================================

/**
 * Check if a specific exercise is available given constraints.
 */
export function isExerciseAvailable(
  exerciseId: string,
  options: ConstraintOptions
): boolean {
  const result = applyConstraints(options);
  return result.available.some(ex => ex.id === exerciseId);
}

/**
 * Get count of available exercises by movement pattern.
 */
export function getAvailableByPattern(
  options: ConstraintOptions
): Record<string, number> {
  const result = applyConstraints(options);
  const counts: Record<string, number> = {};
  
  for (const exercise of result.available) {
    counts[exercise.movementPattern] = (counts[exercise.movementPattern] || 0) + 1;
  }
  
  return counts;
}

/**
 * Get count of available exercises by primary muscle.
 */
export function getAvailableByMuscle(
  options: ConstraintOptions
): Record<string, number> {
  const result = applyConstraints(options);
  const counts: Record<string, number> = {};
  
  for (const exercise of result.available) {
    for (const muscle of exercise.primaryMuscles) {
      counts[muscle] = (counts[muscle] || 0) + 1;
    }
  }
  
  return counts;
}

/**
 * Check if user has minimum viable equipment for a workout type.
 */
export function hasMinimumEquipment(
  userEquipment: UserEquipment[],
  workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full'
): { viable: boolean; missingPatterns: string[] } {
  const options: ConstraintOptions = { userEquipment };
  const byPattern = getAvailableByPattern(options);
  
  const requirements: Record<string, string[]> = {
    push: ['horizontal_push', 'vertical_push', 'isolation_push'],
    pull: ['horizontal_pull', 'vertical_pull', 'isolation_pull'],
    legs: ['squat', 'hinge', 'isolation_leg'],
    upper: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull'],
    lower: ['squat', 'hinge', 'lunge'],
    full: ['horizontal_push', 'horizontal_pull', 'squat', 'hinge'],
  };
  
  const required = requirements[workoutType] || [];
  const missingPatterns = required.filter(pattern => (byPattern[pattern] || 0) < 2);
  
  return {
    viable: missingPatterns.length === 0,
    missingPatterns,
  };
}
