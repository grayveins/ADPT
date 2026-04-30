/**
 * Workout Generator - Main Orchestrator
 * 
 * This is the main entry point for generating workout programs.
 * It coordinates all the sub-modules to produce a complete mesocycle.
 */

import type {
  GeneratorInput,
  GeneratorOutput,
  GeneratorMetadata,
  UserEquipment,
} from '../generator/types';
import { getRecommendedSplit, mapUserPreferenceToSplit } from '../templates/splits';
import { generateProgramName, PHASES, getCurrentPhase } from '../templates/programNames';
import { SeededRandom, generateRandomSeed } from '../utils/seededRandom';
import { 
  buildMesocycle, 
  calculateVolumeSummary, 
  generateSubstitutions,
  type MesocycleConfig,
} from './mesocycleBuilder';
import { applyConstraints, getAvailableByPattern } from './constraints';

// =============================================================================
// GENERATOR CONFIGURATION
// =============================================================================

export interface GeneratorOptions {
  /** Override the auto-selected split */
  forceSplit?: string;
  /** Skip warm-up generation */
  skipWarmups?: boolean;
  /** Generate rationale text for AI coach */
  generateRationale?: boolean;
}

// =============================================================================
// MAIN GENERATOR FUNCTION
// =============================================================================

/**
 * Generate a complete workout program (4-week mesocycle).
 * 
 * This is the main entry point for the workout generation engine.
 */
export function generateProgram(
  input: GeneratorInput,
  options: GeneratorOptions = {}
): GeneratorOutput {
  const startTime = Date.now();
  
  // 1. Validate and normalize input
  const normalizedInput = normalizeInput(input);
  const warnings: string[] = [];
  
  // 2. Generate seed if not provided
  const seed = normalizedInput.seed ?? generateRandomSeed();
  const random = new SeededRandom(seed);
  
  // 3. Select appropriate split
  const split = options.forceSplit
    ? mapUserPreferenceToSplit(
        options.forceSplit as any,
        normalizedInput.daysPerWeek,
        normalizedInput.experienceLevel
      )
    : mapUserPreferenceToSplit(
        normalizedInput.splitPreference,
        normalizedInput.daysPerWeek,
        normalizedInput.experienceLevel
      );
  
  // 4. Check equipment availability
  const constraintOptions = {
    userEquipment: normalizedInput.availableEquipment,
    limitations: normalizedInput.physicalLimitations,
    experienceLevel: normalizedInput.experienceLevel,
    excludedExercises: normalizedInput.excludedExercises,
    preferredExercises: normalizedInput.preferredExercises,
  };
  
  const constraintResult = applyConstraints(constraintOptions);
  warnings.push(...constraintResult.warnings);
  
  // Check if we have enough exercises for each pattern in the split
  const patternCounts = getAvailableByPattern(constraintOptions);
  for (const day of split.days) {
    for (const pattern of day.movementPatterns) {
      if ((patternCounts[pattern] || 0) < 2) {
        warnings.push(
          `Limited ${pattern.replace('_', ' ')} exercises available. Consider adding equipment.`
        );
      }
    }
  }
  
  // 5. Build the mesocycle
  const config: MesocycleConfig = {
    input: normalizedInput,
    split,
    startDate: new Date(),
  };
  
  const mesocycle = buildMesocycle(config);
  
  // 6. Calculate volume summary
  const volumeSummary = calculateVolumeSummary(mesocycle);
  
  // 7. Generate substitution map
  const substitutions = generateSubstitutions(mesocycle, constraintOptions);
  
  // 8. Generate safety flags
  const safetyFlags = generateSafetyFlags(normalizedInput, warnings);
  
  // 9. Generate rationale if requested
  let programRationale: string | undefined;
  if (options.generateRationale) {
    programRationale = generateRationale(normalizedInput, split, volumeSummary);
  }
  
  // 10. Build metadata
  const metadata: GeneratorMetadata = {
    seed,
    generatedAt: new Date().toISOString(),
    planType: '4_week_mesocycle',
    split: split.id,
    engineVersion: '1.0.0',
  };
  
  const generationTime = Date.now() - startTime;
  console.log(`[WorkoutGenerator] Generated program in ${generationTime}ms`);
  
  return {
    metadata,
    mesocycle,
    volumeSummary,
    safetyFlags,
    substitutions,
    programRationale,
  };
}

// =============================================================================
// SINGLE WORKOUT GENERATION
// =============================================================================

/**
 * Generate a single workout (for quick start or one-off sessions).
 */
export function generateSingleWorkout(
  input: Omit<GeneratorInput, 'daysPerWeek'> & { workoutType: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full' }
): GeneratorOutput['mesocycle']['week1']['days'][0] | null {
  // Map workout type to a day template
  const dayTemplates: Record<string, any> = {
    push: {
      name: 'Push',
      movementPatterns: ['horizontal_push', 'vertical_push', 'isolation_push', 'isolation_shoulder'],
      primaryMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
      exerciseCount: { min: 5, max: 7 },
      compoundFirst: true,
    },
    pull: {
      name: 'Pull',
      movementPatterns: ['vertical_pull', 'horizontal_pull', 'isolation_pull', 'isolation_shoulder'],
      primaryMuscles: ['lats', 'upper_back', 'rear_delts', 'biceps'],
      exerciseCount: { min: 5, max: 7 },
      compoundFirst: true,
    },
    legs: {
      name: 'Legs',
      movementPatterns: ['squat', 'hinge', 'lunge', 'isolation_leg', 'core'],
      primaryMuscles: ['quads', 'glutes', 'hamstrings', 'calves', 'abs'],
      exerciseCount: { min: 5, max: 7 },
      compoundFirst: true,
    },
    upper: {
      name: 'Upper Body',
      movementPatterns: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull', 'isolation_pull'],
      primaryMuscles: ['chest', 'lats', 'front_delts', 'upper_back', 'biceps', 'triceps'],
      exerciseCount: { min: 5, max: 7 },
      compoundFirst: true,
    },
    lower: {
      name: 'Lower Body',
      movementPatterns: ['squat', 'hinge', 'lunge', 'isolation_leg', 'core'],
      primaryMuscles: ['quads', 'glutes', 'hamstrings', 'calves', 'abs'],
      exerciseCount: { min: 5, max: 7 },
      compoundFirst: true,
    },
    full: {
      name: 'Full Body',
      movementPatterns: ['squat', 'horizontal_push', 'horizontal_pull', 'hinge', 'core'],
      primaryMuscles: ['quads', 'glutes', 'chest', 'lats', 'hamstrings', 'abs'],
      exerciseCount: { min: 5, max: 7 },
      compoundFirst: true,
    },
  };
  
  const dayTemplate = dayTemplates[input.workoutType];
  if (!dayTemplate) return null;
  
  // Use the mesocycle builder to generate a single day
  const fullInput: GeneratorInput = {
    ...input,
    daysPerWeek: 3, // Doesn't matter for single workout
  };
  
  const config: MesocycleConfig = {
    input: fullInput,
    split: {
      id: 'single',
      name: 'Single Workout',
      daysPerWeek: 1,
      suitableFor: ['beginner', 'intermediate', 'advanced'],
      days: [dayTemplate],
      restDayIndices: [],
    },
    startDate: new Date(),
  };
  
  const mesocycle = buildMesocycle(config);
  
  // Return first workout day from week 1
  const workoutDay = mesocycle.week1.days.find(d => !d.isRestDay);
  return workoutDay || null;
}

// =============================================================================
// INPUT NORMALIZATION
// =============================================================================

function normalizeInput(input: GeneratorInput): GeneratorInput {
  return {
    ...input,
    // Ensure equipment array exists and has defaults
    availableEquipment: input.availableEquipment?.length > 0
      ? input.availableEquipment
      : getDefaultEquipment(),
    // Ensure valid experience level
    experienceLevel: input.experienceLevel || 'intermediate',
    // Ensure valid goal
    fitnessGoal: input.fitnessGoal || 'general_fitness',
    // Ensure valid session duration
    sessionDurationMinutes: input.sessionDurationMinutes || 60,
    // Default physical limitations to empty array
    physicalLimitations: input.physicalLimitations || [],
  };
}

function getDefaultEquipment(): UserEquipment[] {
  // Assume full gym if not specified
  return [
    'barbell',
    'dumbbells',
    'cables',
    'machines',
    'pull_up_bar',
    'bench',
    'squat_rack',
    'leg_press',
    'lat_pulldown',
  ];
}

// =============================================================================
// SAFETY FLAGS
// =============================================================================

function generateSafetyFlags(
  input: GeneratorInput,
  existingWarnings: string[]
): string[] {
  const flags = [...existingWarnings];
  
  // Check for limitations
  if (input.physicalLimitations && input.physicalLimitations.length > 0) {
    const areas = input.physicalLimitations.map(l => l.area.replace('_', ' '));
    flags.push(`Program modified for ${areas.join(', ')} limitations`);
    
    // Specific warnings for severe limitations
    const severe = input.physicalLimitations.filter(l => l.severity === 'severe');
    if (severe.length > 0) {
      flags.push('Consult a healthcare provider before starting this program');
    }
  }
  
  // Beginner warnings
  if (input.experienceLevel === 'beginner') {
    flags.push('Focus on learning proper form before increasing weight');
  }
  
  // High frequency warning
  if (input.daysPerWeek >= 6) {
    flags.push('High training frequency - ensure adequate sleep and nutrition');
  }
  
  return flags;
}

// =============================================================================
// RATIONALE GENERATION
// =============================================================================

function generateRationale(
  input: GeneratorInput,
  split: any,
  volume: any
): string {
  const parts: string[] = [];
  
  // Split selection
  parts.push(
    `Selected ${split.name} split based on ${input.daysPerWeek} training days per week ` +
    `and ${input.experienceLevel} experience level.`
  );
  
  // Goal alignment
  const goalDescriptions: Record<string, string> = {
    hypertrophy: 'muscle growth with moderate-high volume and 6-12 rep ranges',
    strength: 'maximal strength with lower reps (3-6) and longer rest periods',
    general_fitness: 'balanced training across strength, muscle, and conditioning',
    fat_loss: 'metabolic training with shorter rest periods and higher rep ranges',
    athletic: 'power and performance with varied rep ranges and movement patterns',
  };
  
  parts.push(
    `Programming optimized for ${goalDescriptions[input.fitnessGoal] || 'general fitness'}.`
  );
  
  // Volume
  parts.push(
    `Weekly volume targets approximately ${volume.totalSets} direct sets ` +
    `across ${volume.totalExercises} exercises.`
  );
  
  // Phase structure
  parts.push(
    'Program follows a 4-week mesocycle: 2 weeks accumulation (building volume), ' +
    '1 week intensification (pushing harder), 1 week deload (recovery).'
  );
  
  // Limitations
  if (input.physicalLimitations && input.physicalLimitations.length > 0) {
    const areas = input.physicalLimitations.map(l => l.area.replace('_', ' '));
    parts.push(
      `Exercise selection modified to accommodate ${areas.join(', ')} limitations.`
    );
  }
  
  return parts.join(' ');
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Quick check if generation is viable with given equipment.
 */
export function canGenerateProgram(
  userEquipment: UserEquipment[],
  daysPerWeek: number
): { viable: boolean; issues: string[] } {
  const issues: string[] = [];
  
  const constraintResult = applyConstraints({ userEquipment });
  
  if (constraintResult.available.length < 20) {
    issues.push('Very limited exercise selection with current equipment');
  }
  
  const patterns = getAvailableByPattern({ userEquipment });
  
  // Check minimum patterns for common splits
  if (daysPerWeek >= 4) {
    if ((patterns['horizontal_push'] || 0) < 2) {
      issues.push('Need more push equipment (bench, dumbbells)');
    }
    if ((patterns['horizontal_pull'] || 0) < 2) {
      issues.push('Need more pull equipment (cables, dumbbells)');
    }
  }
  
  if ((patterns['squat'] || 0) < 2 && (patterns['lunge'] || 0) < 2) {
    issues.push('Need leg training equipment');
  }
  
  return {
    viable: issues.length === 0,
    issues,
  };
}

/**
 * Get a preview of what would be generated without full generation.
 */
export function previewProgram(input: GeneratorInput): {
  splitName: string;
  daysPerWeek: number;
  exerciseCount: number;
  estimatedDuration: number;
  phases: string[];
} {
  const split = mapUserPreferenceToSplit(
    input.splitPreference,
    input.daysPerWeek,
    input.experienceLevel
  );
  
  return {
    splitName: split.name,
    daysPerWeek: split.daysPerWeek,
    exerciseCount: split.days.reduce(
      (sum, d) => sum + Math.round((d.exerciseCount.min + d.exerciseCount.max) / 2),
      0
    ),
    estimatedDuration: input.sessionDurationMinutes * split.daysPerWeek,
    phases: ['Accumulation (Week 1-2)', 'Intensification (Week 3)', 'Deload (Week 4)'],
  };
}
