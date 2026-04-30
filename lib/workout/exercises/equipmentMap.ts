/**
 * Equipment Mapping - Maps user's onboarding equipment to engine equipment types
 * 
 * Users select equipment during onboarding using user-friendly names.
 * The engine uses more granular equipment types for exercise filtering.
 * This file bridges the two.
 */

import type { Equipment, UserEquipment } from '../generator/types';

/**
 * Maps a single user equipment selection to all engine equipment types it provides.
 * Some user equipment implies access to multiple engine equipment types.
 */
export const USER_EQUIPMENT_TO_ENGINE: Record<UserEquipment, Equipment[]> = {
  // Barbell typically comes with standard and olympic plates
  barbell: ['barbell'],

  // Dumbbells - standard dumbbell work
  dumbbells: ['dumbbell'],

  // Cables - implies access to various cable attachments
  cables: ['cable'],

  // Generic machines (chest press, row machine, etc.)
  machines: ['machine'],

  // Pull-up bar - may be standalone or part of rack
  pull_up_bar: ['pull_up_bar'],

  // Kettlebells
  kettlebells: ['kettlebell'],

  // Resistance bands - versatile for many exercises
  resistance_bands: ['resistance_band'],

  // Bench - implies flat bench, may have incline/decline
  bench: ['bench', 'incline_bench', 'decline_bench'],

  // Squat rack - includes barbell work and J-hooks
  squat_rack: ['squat_rack', 'barbell'],

  // Leg press machine
  leg_press: ['leg_press'],

  // Lat pulldown machine/station
  lat_pulldown: ['lat_pulldown'],

  // Smith machine - guided barbell path
  smith_machine: ['smith_machine'],

  // Dip station / parallel bars
  dip_station: ['dip_station'],

  // EZ curl bar - angled grip for curls and skull crushers
  ez_bar: ['ez_bar'],

  // Trap/hex bar - deadlifts, shrugs
  trap_bar: ['trap_bar'],

  // Bodyweight only - no equipment needed
  bodyweight_only: ['bodyweight'],
};

/**
 * Common equipment bundles that users might have.
 * Useful for "gym type" presets.
 */
export const EQUIPMENT_BUNDLES: Record<string, UserEquipment[]> = {
  // Home gym basics
  home_minimal: ['bodyweight_only', 'resistance_bands'],

  // Home gym with dumbbells
  home_dumbbells: ['bodyweight_only', 'dumbbells', 'bench'],

  // Home gym with barbell
  home_barbell: ['bodyweight_only', 'barbell', 'squat_rack', 'bench', 'dumbbells'],

  // Standard commercial gym
  full_gym: [
    'barbell',
    'dumbbells',
    'cables',
    'machines',
    'pull_up_bar',
    'kettlebells',
    'bench',
    'squat_rack',
    'leg_press',
    'lat_pulldown',
    'smith_machine',
    'dip_station',
    'ez_bar',
    'trap_bar',
  ],

  // Hotel gym / apartment gym
  hotel_gym: ['dumbbells', 'machines', 'cables'],

  // Outdoor / park
  outdoor: ['bodyweight_only', 'pull_up_bar'],
};

/**
 * Convert user equipment selections to engine equipment list.
 * Deduplicates and sorts the result.
 */
export function userEquipmentToEngine(userEquipment: UserEquipment[]): Equipment[] {
  const engineEquipment = new Set<Equipment>();
  
  // Always include bodyweight - everyone has their body
  engineEquipment.add('bodyweight');
  
  for (const item of userEquipment) {
    const mapped = USER_EQUIPMENT_TO_ENGINE[item];
    if (mapped) {
      mapped.forEach((e) => engineEquipment.add(e));
    }
  }
  
  return Array.from(engineEquipment).sort();
}

/**
 * Check if a specific engine equipment type is available given user selections.
 */
export function hasEquipment(
  userEquipment: UserEquipment[],
  required: Equipment
): boolean {
  const available = userEquipmentToEngine(userEquipment);
  return available.includes(required);
}

/**
 * Check if ALL required equipment is available.
 */
export function hasAllEquipment(
  userEquipment: UserEquipment[],
  required: Equipment[]
): boolean {
  const available = userEquipmentToEngine(userEquipment);
  return required.every((eq) => available.includes(eq));
}

/**
 * Check if ANY of the required equipment is available.
 */
export function hasAnyEquipment(
  userEquipment: UserEquipment[],
  required: Equipment[]
): boolean {
  const available = userEquipmentToEngine(userEquipment);
  return required.some((eq) => available.includes(eq));
}

/**
 * Get equipment that the user is missing for a specific exercise.
 */
export function getMissingEquipment(
  userEquipment: UserEquipment[],
  required: Equipment[]
): Equipment[] {
  const available = userEquipmentToEngine(userEquipment);
  return required.filter((eq) => !available.includes(eq));
}

/**
 * Infer a reasonable default equipment set when user hasn't specified.
 * Assumes a standard commercial gym setup.
 */
export function getDefaultEquipment(): UserEquipment[] {
  return EQUIPMENT_BUNDLES.full_gym;
}

/**
 * Get user-friendly display name for equipment.
 */
export const EQUIPMENT_DISPLAY_NAMES: Record<UserEquipment, string> = {
  barbell: 'Barbell',
  dumbbells: 'Dumbbells',
  cables: 'Cables',
  machines: 'Machines',
  pull_up_bar: 'Pull-up Bar',
  kettlebells: 'Kettlebells',
  resistance_bands: 'Resistance Bands',
  bench: 'Bench',
  squat_rack: 'Squat Rack',
  leg_press: 'Leg Press',
  lat_pulldown: 'Lat Pulldown',
  smith_machine: 'Smith Machine',
  dip_station: 'Dip Station',
  ez_bar: 'EZ Curl Bar',
  trap_bar: 'Trap/Hex Bar',
  bodyweight_only: 'Bodyweight Only',
};

/**
 * Get equipment icon name (for UI display with Ionicons or similar).
 */
export const EQUIPMENT_ICONS: Record<UserEquipment, string> = {
  barbell: 'barbell-outline',
  dumbbells: 'fitness-outline',
  cables: 'git-pull-request-outline',
  machines: 'hardware-chip-outline',
  pull_up_bar: 'remove-outline',
  kettlebells: 'flask-outline',
  resistance_bands: 'infinite-outline',
  bench: 'bed-outline',
  squat_rack: 'grid-outline',
  leg_press: 'footsteps-outline',
  lat_pulldown: 'arrow-down-outline',
  smith_machine: 'apps-outline',
  dip_station: 'arrow-down-circle-outline',
  ez_bar: 'remove-outline',
  trap_bar: 'diamond-outline',
  bodyweight_only: 'body-outline',
};
