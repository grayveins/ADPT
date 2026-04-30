/**
 * Warmup Templates - Dynamic warm-up routines by body region
 * 
 * Generates appropriate warm-ups based on:
 * - Target muscles for the workout
 * - User's limitations/injuries
 * - Session duration
 */

import type { 
  WarmupRoutine, 
  WarmupSection, 
  WarmupExercise,
  MuscleGroup,
  JointArea 
} from '../generator/types';

// =============================================================================
// WARMUP EXERCISE DEFINITIONS
// =============================================================================

export interface WarmupExerciseTemplate {
  name: string;
  duration?: string;
  reps?: number;
  sets?: number;
  notes?: string;
  targetAreas: (MuscleGroup | JointArea)[];
  type: 'general' | 'dynamic' | 'activation' | 'specific';
}

// General warmup exercises (full body)
const GENERAL_WARMUP: WarmupExerciseTemplate[] = [
  {
    name: 'Light Cardio (bike/row/walk)',
    duration: '3-5 min',
    notes: 'Get heart rate up, break a light sweat',
    targetAreas: [],
    type: 'general',
  },
  {
    name: 'Jumping Jacks',
    reps: 20,
    targetAreas: [],
    type: 'general',
  },
  {
    name: 'High Knees',
    duration: '30 seconds',
    targetAreas: ['hip_flexors', 'quads'],
    type: 'general',
  },
  {
    name: 'Arm Circles',
    reps: 10,
    notes: 'Forward and backward',
    targetAreas: ['shoulder'],
    type: 'general',
  },
];

// Dynamic stretches by body region
const DYNAMIC_STRETCHES: WarmupExerciseTemplate[] = [
  // Lower body
  {
    name: 'Leg Swings (front-back)',
    reps: 10,
    notes: 'Each leg',
    targetAreas: ['hip_flexors', 'hamstrings', 'hip'],
    type: 'dynamic',
  },
  {
    name: 'Leg Swings (side-side)',
    reps: 10,
    notes: 'Each leg',
    targetAreas: ['adductors', 'abductors', 'hip'],
    type: 'dynamic',
  },
  {
    name: 'Walking Lunges',
    reps: 8,
    notes: 'Each leg, bodyweight',
    targetAreas: ['quads', 'glutes', 'hip_flexors', 'hip'],
    type: 'dynamic',
  },
  {
    name: 'Inchworms',
    reps: 5,
    targetAreas: ['hamstrings', 'abs', 'shoulder'],
    type: 'dynamic',
  },
  {
    name: 'World\'s Greatest Stretch',
    reps: 5,
    notes: 'Each side',
    targetAreas: ['hip_flexors', 'hamstrings', 'upper_back', 'hip'],
    type: 'dynamic',
  },
  {
    name: 'Hip Circles',
    reps: 10,
    notes: 'Each direction',
    targetAreas: ['hip_flexors', 'glutes', 'hip'],
    type: 'dynamic',
  },
  {
    name: 'Bodyweight Squats',
    reps: 10,
    notes: 'Slow and controlled',
    targetAreas: ['quads', 'glutes', 'hip', 'knee'],
    type: 'dynamic',
  },
  
  // Upper body
  {
    name: 'Arm Circles',
    reps: 10,
    notes: 'Small to large, both directions',
    targetAreas: ['front_delts', 'side_delts', 'shoulder'],
    type: 'dynamic',
  },
  {
    name: 'Wall Slides',
    reps: 10,
    notes: 'Keep back and arms against wall',
    targetAreas: ['rear_delts', 'upper_back', 'shoulder'],
    type: 'dynamic',
  },
  {
    name: 'Band Pull-Aparts',
    reps: 15,
    notes: 'Light resistance',
    targetAreas: ['rear_delts', 'upper_back', 'shoulder'],
    type: 'dynamic',
  },
  {
    name: 'Cat-Cow Stretch',
    reps: 10,
    targetAreas: ['lower_back', 'abs', 'upper_back'],
    type: 'dynamic',
  },
  {
    name: 'Thread the Needle',
    reps: 5,
    notes: 'Each side',
    targetAreas: ['upper_back', 'shoulder'],
    type: 'dynamic',
  },
  {
    name: 'Scapular Push-ups',
    reps: 10,
    targetAreas: ['upper_back', 'chest', 'shoulder'],
    type: 'dynamic',
  },
];

// Activation exercises by muscle group
const ACTIVATION_EXERCISES: WarmupExerciseTemplate[] = [
  // Glutes
  {
    name: 'Glute Bridges',
    reps: 15,
    notes: 'Squeeze at top',
    targetAreas: ['glutes', 'hamstrings'],
    type: 'activation',
  },
  {
    name: 'Clamshells',
    reps: 15,
    notes: 'Each side, with band if available',
    targetAreas: ['glutes', 'abductors'],
    type: 'activation',
  },
  {
    name: 'Fire Hydrants',
    reps: 10,
    notes: 'Each side',
    targetAreas: ['glutes', 'abductors', 'hip'],
    type: 'activation',
  },
  
  // Shoulders
  {
    name: 'Band External Rotations',
    reps: 15,
    notes: 'Each arm, light band',
    targetAreas: ['rear_delts', 'shoulder'],
    type: 'activation',
  },
  {
    name: 'Face Pulls (light)',
    reps: 15,
    notes: 'Very light weight, focus on squeeze',
    targetAreas: ['rear_delts', 'upper_back', 'shoulder'],
    type: 'activation',
  },
  {
    name: 'YTWL Raises',
    reps: 8,
    notes: 'Each position, no weight',
    targetAreas: ['rear_delts', 'upper_back', 'shoulder'],
    type: 'activation',
  },
  
  // Core
  {
    name: 'Dead Bugs',
    reps: 10,
    notes: 'Each side, slow',
    targetAreas: ['abs', 'hip_flexors'],
    type: 'activation',
  },
  {
    name: 'Bird Dogs',
    reps: 8,
    notes: 'Each side',
    targetAreas: ['abs', 'lower_back', 'glutes'],
    type: 'activation',
  },
  {
    name: 'Plank',
    duration: '30 seconds',
    targetAreas: ['abs', 'obliques'],
    type: 'activation',
  },
  
  // Lats
  {
    name: 'Straight Arm Pulldown (light)',
    reps: 15,
    notes: 'Very light, feel the lats',
    targetAreas: ['lats'],
    type: 'activation',
  },
];

// =============================================================================
// WARMUP GENERATOR
// =============================================================================

/**
 * Generate a warmup routine based on target muscles.
 */
export function generateWarmup(options: {
  targetMuscles: MuscleGroup[];
  sessionMinutes: number;
  limitations?: JointArea[];
  includeSpecificWarmup?: boolean;
}): WarmupRoutine {
  const { 
    targetMuscles, 
    sessionMinutes, 
    limitations = [],
    includeSpecificWarmup = true,
  } = options;
  
  // Determine warmup duration (10-15% of session)
  const warmupMinutes = Math.min(15, Math.max(5, Math.round(sessionMinutes * 0.12)));
  
  const sections: WarmupSection[] = [];
  
  // 1. General warmup (always include)
  sections.push({
    type: 'general',
    exercises: [
      {
        name: 'Light Cardio (bike/row/walk)',
        duration: '3-5 min',
        notes: 'Get heart rate up, break a light sweat',
      },
    ],
  });
  
  // 2. Dynamic stretches based on target areas
  const dynamicExercises = selectExercisesForMuscles(
    DYNAMIC_STRETCHES,
    targetMuscles,
    limitations,
    3 // Max 3 dynamic stretches
  );
  
  if (dynamicExercises.length > 0) {
    sections.push({
      type: 'dynamic',
      exercises: dynamicExercises.map(toWarmupExercise),
    });
  }
  
  // 3. Activation exercises for primary movers
  const activationExercises = selectExercisesForMuscles(
    ACTIVATION_EXERCISES,
    targetMuscles,
    limitations,
    2 // Max 2 activation exercises
  );
  
  if (activationExercises.length > 0) {
    sections.push({
      type: 'activation',
      exercises: activationExercises.map(toWarmupExercise),
    });
  }
  
  // 4. Specific warmup reminder (will be done with first exercise)
  if (includeSpecificWarmup) {
    sections.push({
      type: 'specific',
      exercises: [
        {
          name: 'Warmup Sets',
          sets: 2,
          notes: '1-2 light sets of first exercise (50-70% working weight)',
        },
      ],
    });
  }
  
  return {
    estimatedMinutes: warmupMinutes,
    sections,
  };
}

/**
 * Select exercises that target the given muscles while avoiding limitations.
 */
function selectExercisesForMuscles(
  exercises: WarmupExerciseTemplate[],
  targetMuscles: MuscleGroup[],
  limitations: JointArea[],
  maxCount: number
): WarmupExerciseTemplate[] {
  // Filter out exercises that stress limited joints
  const safe = exercises.filter(ex => 
    !ex.targetAreas.some(area => limitations.includes(area as JointArea))
  );
  
  // Score exercises by how many target muscles they hit
  const scored = safe.map(ex => ({
    exercise: ex,
    score: ex.targetAreas.filter(area => 
      targetMuscles.includes(area as MuscleGroup)
    ).length,
  }));
  
  // Sort by score (highest first) and take top N
  scored.sort((a, b) => b.score - a.score);
  
  // Also include some general mobility even if not directly targeting muscles
  const selected: WarmupExerciseTemplate[] = [];
  const selectedNames = new Set<string>();
  
  for (const { exercise, score } of scored) {
    if (selected.length >= maxCount) break;
    if (selectedNames.has(exercise.name)) continue;
    
    // Prioritize exercises that target our muscles
    if (score > 0 || selected.length < 1) {
      selected.push(exercise);
      selectedNames.add(exercise.name);
    }
  }
  
  return selected;
}

/**
 * Convert template to WarmupExercise.
 */
function toWarmupExercise(template: WarmupExerciseTemplate): WarmupExercise {
  return {
    name: template.name,
    duration: template.duration,
    reps: template.reps,
    sets: template.sets,
    notes: template.notes,
  };
}

// =============================================================================
// PRESET WARMUPS
// =============================================================================

/**
 * Quick warmup for time-constrained sessions.
 */
export const QUICK_WARMUP: WarmupRoutine = {
  estimatedMinutes: 5,
  sections: [
    {
      type: 'general',
      exercises: [
        { name: 'Jumping Jacks', reps: 30 },
        { name: 'Arm Circles', reps: 10, notes: 'Each direction' },
        { name: 'Leg Swings', reps: 10, notes: 'Each leg, front-back' },
        { name: 'Bodyweight Squats', reps: 10 },
      ],
    },
  ],
};

/**
 * Upper body focused warmup.
 */
export const UPPER_BODY_WARMUP: WarmupRoutine = {
  estimatedMinutes: 8,
  sections: [
    {
      type: 'general',
      exercises: [
        { name: 'Light Cardio', duration: '3 min' },
      ],
    },
    {
      type: 'dynamic',
      exercises: [
        { name: 'Arm Circles', reps: 10, notes: 'Small to large' },
        { name: 'Cat-Cow Stretch', reps: 10 },
        { name: 'Thread the Needle', reps: 5, notes: 'Each side' },
      ],
    },
    {
      type: 'activation',
      exercises: [
        { name: 'Band Pull-Aparts', reps: 15 },
        { name: 'Scapular Push-ups', reps: 10 },
      ],
    },
    {
      type: 'specific',
      exercises: [
        { name: 'Light warmup sets', sets: 2, notes: '50-70% of working weight' },
      ],
    },
  ],
};

/**
 * Lower body focused warmup.
 */
export const LOWER_BODY_WARMUP: WarmupRoutine = {
  estimatedMinutes: 10,
  sections: [
    {
      type: 'general',
      exercises: [
        { name: 'Light Cardio (bike preferred)', duration: '3-5 min' },
      ],
    },
    {
      type: 'dynamic',
      exercises: [
        { name: 'Leg Swings (front-back)', reps: 10, notes: 'Each leg' },
        { name: 'Leg Swings (side-side)', reps: 10, notes: 'Each leg' },
        { name: 'Walking Lunges', reps: 8, notes: 'Each leg' },
        { name: 'Bodyweight Squats', reps: 10 },
      ],
    },
    {
      type: 'activation',
      exercises: [
        { name: 'Glute Bridges', reps: 15, notes: 'Squeeze at top' },
        { name: 'Clamshells', reps: 15, notes: 'Each side' },
      ],
    },
    {
      type: 'specific',
      exercises: [
        { name: 'Empty Bar Squats/RDLs', sets: 2, reps: 10, notes: 'Just the bar' },
      ],
    },
  ],
};

/**
 * Full body warmup.
 */
export const FULL_BODY_WARMUP: WarmupRoutine = {
  estimatedMinutes: 10,
  sections: [
    {
      type: 'general',
      exercises: [
        { name: 'Light Cardio', duration: '3-5 min' },
      ],
    },
    {
      type: 'dynamic',
      exercises: [
        { name: 'World\'s Greatest Stretch', reps: 5, notes: 'Each side' },
        { name: 'Inchworms', reps: 5 },
        { name: 'Arm Circles', reps: 10, notes: 'Each direction' },
      ],
    },
    {
      type: 'activation',
      exercises: [
        { name: 'Dead Bugs', reps: 10, notes: 'Each side' },
        { name: 'Glute Bridges', reps: 15 },
      ],
    },
    {
      type: 'specific',
      exercises: [
        { name: 'Warmup sets', sets: 2, notes: 'First 2 exercises at 50-70%' },
      ],
    },
  ],
};

// =============================================================================
// WARMUP SELECTION
// =============================================================================

/**
 * Get appropriate preset warmup based on workout focus.
 */
export function getPresetWarmup(
  workoutFocus: 'upper' | 'lower' | 'full' | 'push' | 'pull' | 'legs'
): WarmupRoutine {
  switch (workoutFocus) {
    case 'upper':
    case 'push':
    case 'pull':
      return UPPER_BODY_WARMUP;
    case 'lower':
    case 'legs':
      return LOWER_BODY_WARMUP;
    case 'full':
    default:
      return FULL_BODY_WARMUP;
  }
}
