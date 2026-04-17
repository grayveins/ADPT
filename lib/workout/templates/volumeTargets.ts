/**
 * Volume Targets - Sets per muscle group per week
 * 
 * Based on scientific literature for hypertrophy/strength:
 * - Minimum Effective Volume (MEV): Minimum sets to make progress
 * - Maximum Recoverable Volume (MRV): Max sets before recovery issues
 * - Optimal: Sweet spot for most people
 * 
 * References: Mike Israetel's volume landmarks, Schoenfeld meta-analyses
 */

import type { 
  VolumeTargets, 
  IntensityTargets,
  FitnessGoal, 
  ExperienceLevel, 
  MuscleGroup 
} from '../generator/types';

// =============================================================================
// VOLUME TARGETS BY GOAL AND EXPERIENCE
// =============================================================================

/**
 * Volume targets for hypertrophy (muscle building).
 * Higher volume, moderate intensity.
 */
export const HYPERTROPHY_VOLUME: Record<ExperienceLevel, VolumeTargets> = {
  beginner: {
    goal: 'hypertrophy',
    experienceLevel: 'beginner',
    minimumSets: {
      chest: 6, lats: 6, quads: 6, hamstrings: 4, glutes: 4,
      front_delts: 4, side_delts: 4, rear_delts: 4,
      biceps: 4, triceps: 4,
      abs: 4, calves: 4,
    },
    optimalSets: {
      chest: 10, lats: 10, quads: 10, hamstrings: 6, glutes: 8,
      front_delts: 6, side_delts: 8, rear_delts: 6,
      biceps: 6, triceps: 6,
      abs: 6, calves: 6,
    },
    maximumSets: {
      chest: 14, lats: 14, quads: 14, hamstrings: 10, glutes: 12,
      front_delts: 10, side_delts: 14, rear_delts: 10,
      biceps: 10, triceps: 10,
      abs: 10, calves: 10,
    },
  },
  intermediate: {
    goal: 'hypertrophy',
    experienceLevel: 'intermediate',
    minimumSets: {
      chest: 10, lats: 10, quads: 10, hamstrings: 6, glutes: 6,
      front_delts: 6, side_delts: 8, rear_delts: 6,
      biceps: 6, triceps: 6,
      abs: 6, calves: 6,
    },
    optimalSets: {
      chest: 14, lats: 14, quads: 14, hamstrings: 10, glutes: 12,
      front_delts: 8, side_delts: 14, rear_delts: 10,
      biceps: 10, triceps: 10,
      abs: 8, calves: 10,
    },
    maximumSets: {
      chest: 20, lats: 20, quads: 20, hamstrings: 16, glutes: 16,
      front_delts: 12, side_delts: 20, rear_delts: 14,
      biceps: 14, triceps: 14,
      abs: 12, calves: 14,
    },
  },
  advanced: {
    goal: 'hypertrophy',
    experienceLevel: 'advanced',
    minimumSets: {
      chest: 12, lats: 12, quads: 12, hamstrings: 8, glutes: 8,
      front_delts: 8, side_delts: 10, rear_delts: 8,
      biceps: 8, triceps: 8,
      abs: 8, calves: 8,
    },
    optimalSets: {
      chest: 18, lats: 18, quads: 18, hamstrings: 14, glutes: 14,
      front_delts: 10, side_delts: 18, rear_delts: 12,
      biceps: 14, triceps: 14,
      abs: 10, calves: 12,
    },
    maximumSets: {
      chest: 26, lats: 26, quads: 26, hamstrings: 20, glutes: 20,
      front_delts: 16, side_delts: 26, rear_delts: 18,
      biceps: 18, triceps: 18,
      abs: 14, calves: 18,
    },
  },
};

/**
 * Volume targets for strength focus.
 * Lower volume, higher intensity.
 */
export const STRENGTH_VOLUME: Record<ExperienceLevel, VolumeTargets> = {
  beginner: {
    goal: 'strength',
    experienceLevel: 'beginner',
    minimumSets: {
      chest: 4, lats: 4, quads: 4, hamstrings: 3, glutes: 3,
      front_delts: 3, side_delts: 2, rear_delts: 2,
      biceps: 2, triceps: 2,
      abs: 3, calves: 2,
    },
    optimalSets: {
      chest: 8, lats: 8, quads: 8, hamstrings: 6, glutes: 6,
      front_delts: 5, side_delts: 4, rear_delts: 4,
      biceps: 4, triceps: 4,
      abs: 4, calves: 4,
    },
    maximumSets: {
      chest: 12, lats: 12, quads: 12, hamstrings: 8, glutes: 8,
      front_delts: 8, side_delts: 6, rear_delts: 6,
      biceps: 6, triceps: 6,
      abs: 6, calves: 6,
    },
  },
  intermediate: {
    goal: 'strength',
    experienceLevel: 'intermediate',
    minimumSets: {
      chest: 6, lats: 6, quads: 6, hamstrings: 4, glutes: 4,
      front_delts: 4, side_delts: 3, rear_delts: 3,
      biceps: 3, triceps: 3,
      abs: 4, calves: 3,
    },
    optimalSets: {
      chest: 10, lats: 10, quads: 10, hamstrings: 8, glutes: 8,
      front_delts: 6, side_delts: 6, rear_delts: 6,
      biceps: 6, triceps: 6,
      abs: 6, calves: 6,
    },
    maximumSets: {
      chest: 14, lats: 14, quads: 14, hamstrings: 12, glutes: 12,
      front_delts: 10, side_delts: 10, rear_delts: 8,
      biceps: 8, triceps: 8,
      abs: 8, calves: 8,
    },
  },
  advanced: {
    goal: 'strength',
    experienceLevel: 'advanced',
    minimumSets: {
      chest: 8, lats: 8, quads: 8, hamstrings: 6, glutes: 6,
      front_delts: 5, side_delts: 4, rear_delts: 4,
      biceps: 4, triceps: 4,
      abs: 5, calves: 4,
    },
    optimalSets: {
      chest: 12, lats: 12, quads: 12, hamstrings: 10, glutes: 10,
      front_delts: 8, side_delts: 8, rear_delts: 8,
      biceps: 8, triceps: 8,
      abs: 8, calves: 8,
    },
    maximumSets: {
      chest: 18, lats: 18, quads: 18, hamstrings: 14, glutes: 14,
      front_delts: 12, side_delts: 12, rear_delts: 10,
      biceps: 10, triceps: 10,
      abs: 10, calves: 10,
    },
  },
};

/**
 * Volume targets for general fitness.
 * Balanced approach.
 */
export const GENERAL_FITNESS_VOLUME: Record<ExperienceLevel, VolumeTargets> = {
  beginner: {
    goal: 'general_fitness',
    experienceLevel: 'beginner',
    minimumSets: {
      chest: 4, lats: 4, quads: 4, hamstrings: 3, glutes: 3,
      front_delts: 3, side_delts: 3, rear_delts: 2,
      biceps: 2, triceps: 2,
      abs: 3, calves: 2,
    },
    optimalSets: {
      chest: 8, lats: 8, quads: 8, hamstrings: 5, glutes: 6,
      front_delts: 5, side_delts: 6, rear_delts: 4,
      biceps: 4, triceps: 4,
      abs: 5, calves: 4,
    },
    maximumSets: {
      chest: 12, lats: 12, quads: 12, hamstrings: 8, glutes: 10,
      front_delts: 8, side_delts: 10, rear_delts: 8,
      biceps: 8, triceps: 8,
      abs: 8, calves: 8,
    },
  },
  intermediate: {
    goal: 'general_fitness',
    experienceLevel: 'intermediate',
    minimumSets: {
      chest: 6, lats: 6, quads: 6, hamstrings: 4, glutes: 4,
      front_delts: 4, side_delts: 5, rear_delts: 4,
      biceps: 4, triceps: 4,
      abs: 4, calves: 4,
    },
    optimalSets: {
      chest: 10, lats: 10, quads: 10, hamstrings: 8, glutes: 8,
      front_delts: 6, side_delts: 10, rear_delts: 6,
      biceps: 6, triceps: 6,
      abs: 6, calves: 6,
    },
    maximumSets: {
      chest: 16, lats: 16, quads: 16, hamstrings: 12, glutes: 12,
      front_delts: 10, side_delts: 14, rear_delts: 10,
      biceps: 10, triceps: 10,
      abs: 10, calves: 10,
    },
  },
  advanced: {
    goal: 'general_fitness',
    experienceLevel: 'advanced',
    minimumSets: {
      chest: 8, lats: 8, quads: 8, hamstrings: 6, glutes: 6,
      front_delts: 5, side_delts: 6, rear_delts: 5,
      biceps: 5, triceps: 5,
      abs: 5, calves: 5,
    },
    optimalSets: {
      chest: 14, lats: 14, quads: 14, hamstrings: 10, glutes: 10,
      front_delts: 8, side_delts: 12, rear_delts: 8,
      biceps: 8, triceps: 8,
      abs: 8, calves: 8,
    },
    maximumSets: {
      chest: 20, lats: 20, quads: 20, hamstrings: 16, glutes: 16,
      front_delts: 12, side_delts: 18, rear_delts: 12,
      biceps: 12, triceps: 12,
      abs: 12, calves: 12,
    },
  },
};

/**
 * Volume targets for fat loss.
 * Higher volume for calorie burn, with muscle preservation focus.
 */
export const FAT_LOSS_VOLUME: Record<ExperienceLevel, VolumeTargets> = {
  beginner: {
    goal: 'fat_loss',
    experienceLevel: 'beginner',
    minimumSets: {
      chest: 4, lats: 4, quads: 6, hamstrings: 4, glutes: 4,
      front_delts: 3, side_delts: 3, rear_delts: 2,
      biceps: 2, triceps: 2,
      abs: 4, calves: 2,
    },
    optimalSets: {
      chest: 8, lats: 8, quads: 10, hamstrings: 6, glutes: 8,
      front_delts: 5, side_delts: 6, rear_delts: 4,
      biceps: 4, triceps: 4,
      abs: 6, calves: 4,
    },
    maximumSets: {
      chest: 12, lats: 12, quads: 14, hamstrings: 10, glutes: 12,
      front_delts: 8, side_delts: 10, rear_delts: 8,
      biceps: 8, triceps: 8,
      abs: 10, calves: 8,
    },
  },
  intermediate: {
    goal: 'fat_loss',
    experienceLevel: 'intermediate',
    minimumSets: {
      chest: 6, lats: 6, quads: 8, hamstrings: 5, glutes: 5,
      front_delts: 4, side_delts: 5, rear_delts: 4,
      biceps: 4, triceps: 4,
      abs: 5, calves: 4,
    },
    optimalSets: {
      chest: 10, lats: 10, quads: 14, hamstrings: 8, glutes: 10,
      front_delts: 6, side_delts: 10, rear_delts: 6,
      biceps: 6, triceps: 6,
      abs: 8, calves: 6,
    },
    maximumSets: {
      chest: 14, lats: 14, quads: 18, hamstrings: 12, glutes: 14,
      front_delts: 10, side_delts: 14, rear_delts: 10,
      biceps: 10, triceps: 10,
      abs: 12, calves: 10,
    },
  },
  advanced: {
    goal: 'fat_loss',
    experienceLevel: 'advanced',
    minimumSets: {
      chest: 8, lats: 8, quads: 10, hamstrings: 6, glutes: 6,
      front_delts: 5, side_delts: 6, rear_delts: 5,
      biceps: 5, triceps: 5,
      abs: 6, calves: 5,
    },
    optimalSets: {
      chest: 12, lats: 12, quads: 16, hamstrings: 10, glutes: 12,
      front_delts: 8, side_delts: 12, rear_delts: 8,
      biceps: 8, triceps: 8,
      abs: 10, calves: 8,
    },
    maximumSets: {
      chest: 18, lats: 18, quads: 22, hamstrings: 14, glutes: 16,
      front_delts: 12, side_delts: 18, rear_delts: 12,
      biceps: 12, triceps: 12,
      abs: 14, calves: 12,
    },
  },
};

// =============================================================================
// INTENSITY TARGETS BY PHASE
// =============================================================================

/**
 * Intensity targets for different mesocycle phases.
 */
export const INTENSITY_BY_PHASE: IntensityTargets[] = [
  // Accumulation - higher reps, moderate intensity
  {
    goal: 'hypertrophy',
    phase: 'accumulation',
    compoundRIR: { min: 2, max: 3 },
    isolationRIR: { min: 1, max: 3 },
  },
  // Intensification - moderate reps, higher intensity
  {
    goal: 'hypertrophy',
    phase: 'intensification',
    compoundRIR: { min: 1, max: 2 },
    isolationRIR: { min: 1, max: 2 },
  },
  // Peak - lower reps, highest intensity
  {
    goal: 'hypertrophy',
    phase: 'peak',
    compoundRIR: { min: 0, max: 1 },
    isolationRIR: { min: 0, max: 1 },
  },
  // Deload - reduced intensity and volume
  {
    goal: 'hypertrophy',
    phase: 'deload',
    compoundRIR: { min: 3, max: 4 },
    isolationRIR: { min: 3, max: 4 },
  },
  
  // Strength phases
  {
    goal: 'strength',
    phase: 'accumulation',
    compoundRIR: { min: 2, max: 3 },
    isolationRIR: { min: 2, max: 3 },
    loadPercentage: { min: 70, max: 80 },
  },
  {
    goal: 'strength',
    phase: 'intensification',
    compoundRIR: { min: 1, max: 2 },
    isolationRIR: { min: 1, max: 2 },
    loadPercentage: { min: 80, max: 87 },
  },
  {
    goal: 'strength',
    phase: 'peak',
    compoundRIR: { min: 0, max: 1 },
    isolationRIR: { min: 1, max: 2 },
    loadPercentage: { min: 87, max: 95 },
  },
  {
    goal: 'strength',
    phase: 'deload',
    compoundRIR: { min: 4, max: 5 },
    isolationRIR: { min: 3, max: 4 },
    loadPercentage: { min: 50, max: 65 },
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get volume targets for a specific goal and experience level.
 */
export function getVolumeTargets(
  goal: FitnessGoal,
  experience: ExperienceLevel
): VolumeTargets {
  switch (goal) {
    case 'hypertrophy':
      return HYPERTROPHY_VOLUME[experience];
    case 'strength':
      return STRENGTH_VOLUME[experience];
    case 'fat_loss':
      return FAT_LOSS_VOLUME[experience];
    case 'general_fitness':
    case 'athletic':
    default:
      return GENERAL_FITNESS_VOLUME[experience];
  }
}

/**
 * Get intensity targets for a phase and goal.
 */
export function getIntensityTargets(
  goal: FitnessGoal,
  phase: 'accumulation' | 'intensification' | 'peak' | 'deload'
): IntensityTargets | undefined {
  return INTENSITY_BY_PHASE.find(t => t.goal === goal && t.phase === phase);
}

/**
 * Calculate total weekly volume for a muscle group across a split.
 */
export function calculateWeeklyVolume(
  muscle: MuscleGroup,
  setsPerDay: number[],
): number {
  return setsPerDay.reduce((sum, sets) => sum + sets, 0);
}

/**
 * Adjust volume for time constraints.
 * If user has less time, reduce to minimum effective volume.
 */
export function adjustVolumeForTime(
  targets: VolumeTargets,
  sessionMinutes: number,
  daysPerWeek: number
): Partial<Record<MuscleGroup, number>> {
  const totalMinutes = sessionMinutes * daysPerWeek;
  
  // Rough estimate: 3 minutes per set (including rest)
  const maxSetsPerWeek = Math.floor(totalMinutes / 3);
  
  // Calculate current optimal total
  const optimalTotal = Object.values(targets.optimalSets)
    .reduce((sum, v) => sum + (v || 0), 0);
  
  if (maxSetsPerWeek >= optimalTotal) {
    // Can hit optimal volume
    return targets.optimalSets;
  }
  
  // Need to reduce - prioritize big muscle groups
  const scaleFactor = maxSetsPerWeek / optimalTotal;
  const adjusted: Partial<Record<MuscleGroup, number>> = {};
  
  for (const [muscle, sets] of Object.entries(targets.optimalSets)) {
    const minimum = targets.minimumSets[muscle as MuscleGroup] || 0;
    const scaled = Math.round((sets || 0) * scaleFactor);
    adjusted[muscle as MuscleGroup] = Math.max(minimum, scaled);
  }
  
  return adjusted;
}

/**
 * Apply volume multiplier for mesocycle phase.
 */
export function applyPhaseMultiplier(
  baseSets: number,
  phase: 'accumulation' | 'intensification' | 'peak' | 'deload'
): number {
  const multipliers = {
    accumulation: 1.0,
    intensification: 1.1,
    peak: 0.9,
    deload: 0.5,
  };
  
  return Math.round(baseSets * multipliers[phase]);
}
