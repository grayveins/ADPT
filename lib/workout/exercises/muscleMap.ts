/**
 * Muscle Mapping - Maps granular muscle groups to display categories
 * 
 * The engine uses 19 specific muscle groups for precise targeting.
 * The UI displays simpler categories that users understand.
 * This file bridges the two for display purposes.
 */

import type { MuscleGroup, DisplayMuscleGroup } from '../generator/types';

/**
 * Maps each granular muscle to its display category.
 */
export const MUSCLE_TO_DISPLAY: Record<MuscleGroup, DisplayMuscleGroup> = {
  // Chest
  chest: 'Chest',
  
  // Shoulders (3 heads)
  front_delts: 'Shoulders',
  side_delts: 'Shoulders',
  rear_delts: 'Shoulders',
  
  // Back
  lats: 'Back',
  upper_back: 'Back',
  lower_back: 'Back',
  
  // Arms
  biceps: 'Arms',
  triceps: 'Arms',
  forearms: 'Arms',
  
  // Legs
  quads: 'Legs',
  hamstrings: 'Legs',
  glutes: 'Legs',
  adductors: 'Legs',
  abductors: 'Legs',
  calves: 'Legs',
  hip_flexors: 'Legs',
  
  // Core
  abs: 'Core',
  obliques: 'Core',
};

/**
 * Maps display categories to all granular muscles within them.
 */
export const DISPLAY_TO_MUSCLES: Record<DisplayMuscleGroup, MuscleGroup[]> = {
  Chest: ['chest'],
  Shoulders: ['front_delts', 'side_delts', 'rear_delts'],
  Back: ['lats', 'upper_back', 'lower_back'],
  Arms: ['biceps', 'triceps', 'forearms'],
  Legs: ['quads', 'hamstrings', 'glutes', 'adductors', 'abductors', 'calves', 'hip_flexors'],
  Core: ['abs', 'obliques'],
  'Full Body': [], // Special category, not tied to specific muscles
  Cardio: [], // Special category, not tied to specific muscles
};

/**
 * All granular muscle groups (for iteration).
 */
export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'front_delts',
  'side_delts',
  'rear_delts',
  'lats',
  'upper_back',
  'lower_back',
  'biceps',
  'triceps',
  'forearms',
  'quads',
  'hamstrings',
  'glutes',
  'adductors',
  'abductors',
  'calves',
  'hip_flexors',
  'abs',
  'obliques',
];

/**
 * All display muscle groups (for UI).
 */
export const ALL_DISPLAY_GROUPS: DisplayMuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
  'Full Body',
  'Cardio',
];

/**
 * Get user-friendly display name for a granular muscle.
 */
export const MUSCLE_DISPLAY_NAMES: Record<MuscleGroup, string> = {
  chest: 'Chest',
  front_delts: 'Front Delts',
  side_delts: 'Side Delts',
  rear_delts: 'Rear Delts',
  lats: 'Lats',
  upper_back: 'Upper Back',
  lower_back: 'Lower Back',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  adductors: 'Adductors',
  abductors: 'Abductors',
  calves: 'Calves',
  hip_flexors: 'Hip Flexors',
  abs: 'Abs',
  obliques: 'Obliques',
};

/**
 * Convert a list of granular muscles to their display categories (deduplicated).
 */
export function musclesToDisplayGroups(muscles: MuscleGroup[]): DisplayMuscleGroup[] {
  const displayGroups = new Set<DisplayMuscleGroup>();
  
  for (const muscle of muscles) {
    displayGroups.add(MUSCLE_TO_DISPLAY[muscle]);
  }
  
  return Array.from(displayGroups);
}

/**
 * Get all granular muscles for a display category.
 */
export function displayGroupToMuscles(displayGroup: DisplayMuscleGroup): MuscleGroup[] {
  return DISPLAY_TO_MUSCLES[displayGroup] || [];
}

/**
 * Muscle image mapping for the new muscle visualization component.
 * Maps to assets in assets/muscles/ directory.
 */
export const MUSCLE_IMAGE_MAP: Record<string, string> = {
  // Front view muscles
  chest: 'chest',
  abs: 'abs',
  quads: 'quads',
  biceps: 'biceps',
  front_delts: 'shoulders',
  side_delts: 'shoulders',
  obliques: 'obliques',
  
  // Back view muscles
  lats: 'lats',
  upper_back: 'upper-back',
  lower_back: 'lower-back',
  rear_delts: 'rear-delts',
  triceps: 'triceps',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  
  // Generic/shared
  forearms: 'forearms',
  adductors: 'adductors',
  abductors: 'glutes', // Often grouped visually
  hip_flexors: 'quads', // Often grouped visually
};

/**
 * Determine if a muscle is primarily on the front or back of the body.
 * Used for muscle visualization to show the correct body view.
 */
export const MUSCLE_BODY_SIDE: Record<MuscleGroup, 'front' | 'back' | 'both'> = {
  // Front
  chest: 'front',
  abs: 'front',
  quads: 'front',
  biceps: 'front',
  front_delts: 'front',
  hip_flexors: 'front',
  
  // Back
  lats: 'back',
  upper_back: 'back',
  lower_back: 'back',
  rear_delts: 'back',
  hamstrings: 'back',
  glutes: 'back',
  calves: 'back',
  
  // Both/Side
  side_delts: 'both',
  triceps: 'both',
  forearms: 'both',
  obliques: 'both',
  adductors: 'both',
  abductors: 'both',
};

/**
 * Get the primary body side to display for a set of muscles.
 */
export function getPrimaryBodySide(muscles: MuscleGroup[]): 'front' | 'back' {
  let frontCount = 0;
  let backCount = 0;
  
  for (const muscle of muscles) {
    const side = MUSCLE_BODY_SIDE[muscle];
    if (side === 'front') frontCount++;
    else if (side === 'back') backCount++;
    // 'both' doesn't count toward either
  }
  
  return backCount > frontCount ? 'back' : 'front';
}

/**
 * Group muscles by body region for volume tracking.
 */
export const MUSCLE_REGIONS: Record<string, MuscleGroup[]> = {
  upper_push: ['chest', 'front_delts', 'side_delts', 'triceps'],
  upper_pull: ['lats', 'upper_back', 'rear_delts', 'biceps'],
  lower: ['quads', 'hamstrings', 'glutes', 'adductors', 'abductors', 'calves', 'hip_flexors'],
  core: ['abs', 'obliques', 'lower_back'],
};

/**
 * Get which region a muscle belongs to.
 */
export function getMuscleRegion(muscle: MuscleGroup): string {
  for (const [region, muscles] of Object.entries(MUSCLE_REGIONS)) {
    if (muscles.includes(muscle)) {
      return region;
    }
  }
  return 'other';
}
