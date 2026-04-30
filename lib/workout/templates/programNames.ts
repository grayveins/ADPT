/**
 * Program Naming System - Smart program names and phases
 * 
 * Generates meaningful program names based on:
 * - User's name (if available)
 * - Training goal
 * - Split type
 * - Current phase of mesocycle
 * 
 * Example outputs:
 * - "Troy's Strength Builder"
 * - "Foundation Phase - Week 2 of 4"
 * - "Hypertrophy Accumulation Block"
 */

import type { FitnessGoal, ExperienceLevel } from '../generator/types';

// =============================================================================
// MESOCYCLE PHASES
// =============================================================================

export type MesocyclePhase = 'accumulation' | 'intensification' | 'peak' | 'deload';

export interface PhaseInfo {
  id: MesocyclePhase;
  name: string;
  shortName: string;
  description: string;
  weekRange: [number, number]; // Which weeks in a 4-week cycle
  icon: string; // Ionicons name
  color: string; // Theme key or hex
}

export const PHASES: Record<MesocyclePhase, PhaseInfo> = {
  accumulation: {
    id: 'accumulation',
    name: 'Accumulation',
    shortName: 'Build',
    description: 'Building base volume and work capacity',
    weekRange: [1, 2],
    icon: 'layers-outline',
    color: 'primary', // teal
  },
  intensification: {
    id: 'intensification',
    name: 'Intensification',
    shortName: 'Push',
    description: 'Increasing intensity and reducing volume',
    weekRange: [3, 3],
    icon: 'trending-up-outline',
    color: 'intensity', // orange
  },
  peak: {
    id: 'peak',
    name: 'Peak',
    shortName: 'Peak',
    description: 'Testing strength and pushing limits',
    weekRange: [4, 4], // Only in longer cycles
    icon: 'trophy-outline',
    color: 'gold',
  },
  deload: {
    id: 'deload',
    name: 'Deload',
    shortName: 'Recover',
    description: 'Active recovery and adaptation',
    weekRange: [4, 4],
    icon: 'leaf-outline',
    color: 'success', // sage green
  },
};

/**
 * Get the current phase based on week number.
 */
export function getCurrentPhase(weekNumber: number, totalWeeks: number = 4): MesocyclePhase {
  // Standard 4-week mesocycle: 2 accumulation, 1 intensification, 1 deload
  // 8-week: 3 accumulation, 2 intensification, 1 peak, 2 deload
  
  if (totalWeeks <= 4) {
    if (weekNumber <= 2) return 'accumulation';
    if (weekNumber === 3) return 'intensification';
    return 'deload';
  }
  
  // Longer cycles
  const position = weekNumber / totalWeeks;
  if (position <= 0.375) return 'accumulation';      // First ~37.5%
  if (position <= 0.625) return 'intensification';   // Next ~25%
  if (position <= 0.75) return 'peak';               // Next ~12.5%
  return 'deload';                                    // Final ~25%
}

// =============================================================================
// PROGRAM NAME TEMPLATES
// =============================================================================

/**
 * Goal-based program name prefixes.
 */
export const GOAL_NAMES: Record<FitnessGoal, string[]> = {
  hypertrophy: [
    'Muscle Builder',
    'Growth Phase',
    'Size & Strength',
    'Hypertrophy Program',
    'Mass Builder',
  ],
  strength: [
    'Strength Builder',
    'Power Program',
    'Strong Foundations',
    'Strength Focus',
    'Power Phase',
  ],
  general_fitness: [
    'Fitness Foundation',
    'Balanced Training',
    'Total Fitness',
    'Well-Rounded Program',
    'Complete Training',
  ],
  fat_loss: [
    'Lean & Strong',
    'Cut Phase',
    'Shred Program',
    'Fat Burning Focus',
    'Metabolic Training',
  ],
  athletic: [
    'Athletic Performance',
    'Sport Ready',
    'Performance Program',
    'Athletic Training',
    'Peak Performance',
  ],
};

/**
 * Experience-based descriptors.
 */
export const EXPERIENCE_DESCRIPTORS: Record<ExperienceLevel, string[]> = {
  beginner: ['Foundation', 'Starter', 'Intro', 'Beginner'],
  intermediate: ['Progressive', 'Builder', 'Growth', 'Development'],
  advanced: ['Advanced', 'Elite', 'Intensive', 'Expert'],
};

/**
 * Split-based name components.
 */
export const SPLIT_DESCRIPTORS: Record<string, string> = {
  full_body_2x: 'Full Body',
  full_body_3x: 'Full Body',
  upper_lower_4x: 'Upper/Lower',
  ppl_5x: 'Push Pull Legs',
  ppl_6x: 'Push Pull Legs',
  bro_split_5x: 'Body Part Split',
};

// =============================================================================
// PROGRAM NAME GENERATORS
// =============================================================================

/**
 * Generate a personalized program name that includes the split type.
 * 
 * @param options - Configuration for name generation
 * @returns A program name like "PPL Hypertrophy" or "Upper/Lower Strength"
 */
export function generateProgramName(options: {
  firstName?: string;
  goal?: FitnessGoal;
  experience?: ExperienceLevel;
  splitId?: string;
  includePersonalName?: boolean; // Default true if firstName provided
}): string {
  const {
    firstName,
    goal = 'general_fitness',
    splitId,
    includePersonalName = !!firstName,
  } = options;
  
  // Get split name if available
  const splitName = splitId ? SPLIT_DESCRIPTORS[splitId] : null;
  
  // Get a simple goal descriptor
  const goalDescriptors: Record<FitnessGoal, string> = {
    hypertrophy: 'Hypertrophy',
    strength: 'Strength',
    general_fitness: 'Fitness',
    fat_loss: 'Fat Loss',
    athletic: 'Performance',
  };
  const goalDesc = goalDescriptors[goal] || 'Training';
  
  // Build the name
  if (includePersonalName && firstName) {
    // "Troy's PPL Hypertrophy" or "Troy's Strength Program"
    const possessive = firstName.endsWith('s') ? `${firstName}'` : `${firstName}'s`;
    if (splitName) {
      return `${possessive} ${splitName} ${goalDesc}`;
    }
    return `${possessive} ${goalDesc} Program`;
  }
  
  // Without personal name, use split + goal
  if (splitName) {
    // "PPL Hypertrophy" or "Upper/Lower Strength"
    return `${splitName} ${goalDesc}`;
  }
  
  // Fallback: just goal-based name
  const goalNames = GOAL_NAMES[goal];
  return goalNames[0]; // Use first (most common) name
}

/**
 * Generate a program name with phase information.
 * 
 * @returns Something like "Hypertrophy - Accumulation Block"
 */
export function generateProgramNameWithPhase(options: {
  firstName?: string;
  goal?: FitnessGoal;
  currentWeek: number;
  totalWeeks?: number;
}): {
  name: string;
  phaseName: string;
  phaseDescription: string;
  weekDisplay: string;
} {
  const { 
    firstName, 
    goal = 'general_fitness',
    currentWeek, 
    totalWeeks = 4 
  } = options;
  
  const phase = getCurrentPhase(currentWeek, totalWeeks);
  const phaseInfo = PHASES[phase];
  
  // Build the name
  let name: string;
  if (firstName) {
    const possessive = firstName.endsWith('s') ? `${firstName}'` : `${firstName}'s`;
    name = `${possessive} ${GOAL_NAMES[goal][0]}`;
  } else {
    name = GOAL_NAMES[goal][0];
  }
  
  return {
    name,
    phaseName: phaseInfo.name,
    phaseDescription: phaseInfo.description,
    weekDisplay: `Week ${currentWeek} of ${totalWeeks}`,
  };
}

// =============================================================================
// PHASE-BASED PROGRAM NAMES
// =============================================================================

/**
 * Phase-specific program names for display.
 */
export function getPhaseDisplayName(
  phase: MesocyclePhase,
  goal: FitnessGoal = 'general_fitness'
): string {
  const goalShortNames: Record<FitnessGoal, string> = {
    hypertrophy: 'Hypertrophy',
    strength: 'Strength',
    general_fitness: 'Fitness',
    fat_loss: 'Lean',
    athletic: 'Athletic',
  };
  
  const goalShort = goalShortNames[goal];
  const phaseInfo = PHASES[phase];
  
  return `${goalShort} ${phaseInfo.name}`;
}

/**
 * Full program subtitle for UI display.
 * Example: "Week 2 - Building Volume"
 */
export function getProgramSubtitle(
  currentWeek: number,
  totalWeeks: number = 4
): string {
  const phase = getCurrentPhase(currentWeek, totalWeeks);
  const phaseInfo = PHASES[phase];
  
  return `Week ${currentWeek} - ${phaseInfo.description}`;
}

// =============================================================================
// PROGRESSION DISPLAY
// =============================================================================

export interface ProgressionInfo {
  currentPhase: PhaseInfo;
  nextPhase: PhaseInfo | null;
  weeksUntilNextPhase: number;
  overallProgress: number; // 0-1
  phaseProgress: number; // 0-1 within current phase
}

/**
 * Get detailed progression information.
 */
export function getProgressionInfo(
  currentWeek: number,
  totalWeeks: number = 4
): ProgressionInfo {
  const currentPhase = getCurrentPhase(currentWeek, totalWeeks);
  const currentPhaseInfo = PHASES[currentPhase];
  
  // Determine next phase
  const phases: MesocyclePhase[] = ['accumulation', 'intensification', 'peak', 'deload'];
  const currentIndex = phases.indexOf(currentPhase);
  const nextPhase = currentIndex < phases.length - 1 ? phases[currentIndex + 1] : null;
  
  // Calculate weeks until next phase
  let weeksUntilNextPhase = 0;
  if (totalWeeks <= 4) {
    // Standard 4-week cycle
    if (currentPhase === 'accumulation') weeksUntilNextPhase = 3 - currentWeek;
    else if (currentPhase === 'intensification') weeksUntilNextPhase = 4 - currentWeek;
    else weeksUntilNextPhase = 0;
  } else {
    // Longer cycles - estimate
    const nextPhaseWeek = Math.ceil(totalWeeks * (currentIndex + 1) / 4);
    weeksUntilNextPhase = Math.max(0, nextPhaseWeek - currentWeek);
  }
  
  return {
    currentPhase: currentPhaseInfo,
    nextPhase: nextPhase ? PHASES[nextPhase] : null,
    weeksUntilNextPhase,
    overallProgress: currentWeek / totalWeeks,
    phaseProgress: calculatePhaseProgress(currentWeek, totalWeeks, currentPhase),
  };
}

function calculatePhaseProgress(
  week: number,
  total: number,
  phase: MesocyclePhase
): number {
  // Simplified - assumes equal phase lengths
  const phaseLengths = { accumulation: 2, intensification: 1, peak: 0, deload: 1 };
  const phaseStart: Record<MesocyclePhase, number> = {
    accumulation: 1,
    intensification: 3,
    peak: total > 4 ? 4 : total,
    deload: total > 4 ? total - 1 : 4,
  };
  
  const start = phaseStart[phase];
  const length = phaseLengths[phase] || 1;
  
  return Math.min(1, (week - start + 1) / length);
}

// =============================================================================
// EDITABLE PROGRAM NAME HELPERS
// =============================================================================

/**
 * Validate a custom program name.
 */
export function validateProgramName(name: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Program name cannot be empty' };
  }
  
  if (name.length > 50) {
    return { valid: false, error: 'Program name must be 50 characters or less' };
  }
  
  if (name.length < 3) {
    return { valid: false, error: 'Program name must be at least 3 characters' };
  }
  
  return { valid: true };
}

/**
 * Suggest program names based on user profile.
 */
export function suggestProgramNames(options: {
  firstName?: string;
  goal?: FitnessGoal;
  experience?: ExperienceLevel;
  count?: number;
}): string[] {
  const { firstName, goal = 'general_fitness', experience = 'intermediate', count = 5 } = options;
  
  const suggestions: string[] = [];
  const goalNames = GOAL_NAMES[goal];
  const expDescriptors = EXPERIENCE_DESCRIPTORS[experience];
  
  // Personal names
  if (firstName) {
    const possessive = firstName.endsWith('s') ? `${firstName}'` : `${firstName}'s`;
    suggestions.push(`${possessive} ${goalNames[0]}`);
    suggestions.push(`${possessive} Training Plan`);
    suggestions.push(`${possessive} Fitness Journey`);
  }
  
  // Goal + experience combinations
  for (const goalName of goalNames.slice(0, 3)) {
    for (const expDesc of expDescriptors.slice(0, 2)) {
      suggestions.push(`${expDesc} ${goalName}`);
    }
  }
  
  // Simple goal names
  suggestions.push(...goalNames);
  
  // Return unique suggestions
  return [...new Set(suggestions)].slice(0, count);
}

// =============================================================================
// EXPORTS FOR UI
// =============================================================================

export const PHASE_ORDER: MesocyclePhase[] = ['accumulation', 'intensification', 'peak', 'deload'];

export const PHASE_COLORS: Record<MesocyclePhase, string> = {
  accumulation: '#3B82F6',  // primary teal
  intensification: '#FF6B35', // intensity orange
  peak: '#FFD700',          // gold
  deload: '#7FA07F',        // sage green
};

export const PHASE_ICONS: Record<MesocyclePhase, string> = {
  accumulation: 'layers-outline',
  intensification: 'trending-up-outline',
  peak: 'trophy-outline',
  deload: 'leaf-outline',
};
