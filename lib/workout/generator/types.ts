/**
 * Comprehensive types for the Local Workout Generation Engine
 * 
 * This file defines all TypeScript types used by the workout generator,
 * including exercise schemas, generator inputs/outputs, and mesocycle structures.
 */

// =============================================================================
// MUSCLE GROUPS - 19 specific muscles for precise targeting
// =============================================================================

export type MuscleGroup =
  | 'chest'
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'lats'
  | 'upper_back'    // traps, rhomboids
  | 'lower_back'    // erectors
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'adductors'
  | 'abductors'
  | 'calves'
  | 'abs'
  | 'obliques'
  | 'hip_flexors';

// Display categories for UI (maps from granular muscles)
export type DisplayMuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Arms'
  | 'Legs'
  | 'Core'
  | 'Full Body'
  | 'Cardio';

// =============================================================================
// MOVEMENT PATTERNS - 14 patterns for balanced programming
// =============================================================================

export type MovementPattern =
  | 'horizontal_push'   // bench, push-up
  | 'vertical_push'     // overhead press
  | 'horizontal_pull'   // rows
  | 'vertical_pull'     // pull-up, pulldown
  | 'squat'             // squat patterns
  | 'hinge'             // deadlift, RDL
  | 'lunge'             // unilateral leg
  | 'carry'             // loaded carries
  | 'rotation'          // anti-rotation, rotation
  | 'isolation_push'    // tricep isolation
  | 'isolation_pull'    // bicep isolation
  | 'isolation_shoulder'// lateral raise, rear delt
  | 'isolation_leg'     // leg curl, extension
  | 'core';             // planks, crunches

// =============================================================================
// EQUIPMENT - 18 equipment types
// =============================================================================

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'cable'
  | 'machine'
  | 'smith_machine'
  | 'bodyweight'
  | 'pull_up_bar'
  | 'dip_station'
  | 'bench'
  | 'incline_bench'
  | 'decline_bench'
  | 'squat_rack'
  | 'leg_press'
  | 'lat_pulldown'
  | 'resistance_band'
  | 'ez_bar'
  | 'trap_bar';

// User-facing equipment options (from onboarding)
export type UserEquipment =
  | 'barbell'
  | 'dumbbells'
  | 'cables'
  | 'machines'
  | 'pull_up_bar'
  | 'kettlebells'
  | 'resistance_bands'
  | 'bench'
  | 'squat_rack'
  | 'leg_press'
  | 'lat_pulldown'
  | 'smith_machine'
  | 'dip_station'
  | 'ez_bar'
  | 'trap_bar'
  | 'bodyweight_only';

// =============================================================================
// JOINT STRESS - For injury prevention and limitation handling
// =============================================================================

export type JointArea =
  | 'shoulder'
  | 'elbow'
  | 'wrist'
  | 'lower_back'
  | 'hip'
  | 'knee'
  | 'ankle';

export type StressLevel = 'none' | 'low' | 'moderate' | 'high';

export type JointStress = Partial<Record<JointArea, StressLevel>>;

// =============================================================================
// EXERCISE DEFINITION - Full schema for each exercise
// =============================================================================

export type ExerciseCategory = 'compound' | 'isolation' | 'cardio' | 'mobility';

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  // Identification
  id: string;                          // e.g., "barbell-bench-press"
  name: string;                        // e.g., "Bench Press" - MUST match lib/exercises.ts
  
  // Classification
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  
  // Muscle targeting
  primaryMuscles: MuscleGroup[];       // Main muscles worked
  secondaryMuscles: MuscleGroup[];     // Supporting muscles
  
  // Equipment & setup
  equipment: Equipment[];              // Required equipment
  optionalEquipment?: Equipment[];     // Can enhance but not required
  
  // Constraints
  difficulty: ExerciseDifficulty;
  jointStress: JointStress;
  
  // Programming hints
  defaultRestSeconds: number;          // Typical rest period
  repRangeMin: number;                 // Minimum effective reps
  repRangeMax: number;                 // Maximum effective reps
  canBeSuperset: boolean;              // Safe to superset
  isUnilateral: boolean;               // One side at a time
  
  // Video reference (from lib/exercises.ts)
  youtubeVideoId?: string;
  videoStartTime?: number;
  videoEndTime?: number;
  
  // Substitution hints
  similarExercises?: string[];         // IDs of similar exercises
  easierVariation?: string;            // ID of easier version
  harderVariation?: string;            // ID of harder version
  
  // Special flags
  requiresSpotter?: boolean;
  highFatigueImpact?: boolean;         // CNS demanding
  goodForDropSets?: boolean;
  goodForPauseReps?: boolean;
}

// =============================================================================
// GENERATOR INPUT - What the user provides / what we know about them
// =============================================================================

export type FitnessGoal = 
  | 'hypertrophy'      // Muscle building
  | 'strength'         // Maximal strength
  | 'general_fitness'  // Balanced
  | 'fat_loss'         // Higher volume, shorter rest
  | 'athletic';        // Power + conditioning

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type SplitPreference =
  | 'full_body'        // 2-3 days/week
  | 'upper_lower'      // 4 days/week
  | 'push_pull_legs'   // 5-6 days/week
  | 'bro_split'        // 5-6 days/week, one muscle/day
  | 'auto';            // Let engine decide based on frequency

export interface PhysicalLimitation {
  area: JointArea;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface MusclePriority {
  muscle: MuscleGroup | DisplayMuscleGroup;
  priority: 'high' | 'normal' | 'low';
}

export interface GeneratorInput {
  // User profile
  userId: string;
  experienceLevel: ExperienceLevel;
  fitnessGoal: FitnessGoal;
  
  // Schedule
  daysPerWeek: 2 | 3 | 4 | 5 | 6;
  sessionDurationMinutes: 30 | 45 | 60 | 75 | 90;
  
  // Equipment available
  availableEquipment: UserEquipment[];
  
  // Customization
  splitPreference?: SplitPreference;
  musclePriorities?: MusclePriority[];
  physicalLimitations?: PhysicalLimitation[];
  
  // Exercise preferences
  excludedExercises?: string[];        // Exercise IDs to never include
  preferredExercises?: string[];       // Exercise IDs to prioritize
  
  // Optional: for reproducibility
  seed?: number;
  
  // Optional: existing program to adapt
  previousProgramId?: string;
  weekNumber?: number;                 // Which week of mesocycle
}

// =============================================================================
// GENERATOR OUTPUT - The complete workout plan
// =============================================================================

export interface WarmupExercise {
  name: string;
  duration?: string;                   // e.g., "30 seconds"
  reps?: number;
  sets?: number;
  notes?: string;
}

export interface WarmupSection {
  type: 'general' | 'dynamic' | 'activation' | 'specific';
  exercises: WarmupExercise[];
}

export interface WarmupRoutine {
  estimatedMinutes: number;
  sections: WarmupSection[];
}

export interface ExercisePrescription {
  exerciseId: string;
  name: string;                        // Display name
  muscleGroup: DisplayMuscleGroup;     // For UI categorization
  
  // Programming
  sets: number;
  reps: string;                        // e.g., "8-10" or "5" or "AMRAP"
  rirTarget: number;                   // Reps in reserve (0-4)
  restSeconds: number;
  
  // Progression hints
  intensityModifier?: number;          // e.g., 0.9 for deload, 1.05 for intensification
  tempoNotes?: string;                 // e.g., "3-1-2-0"
  techniqueNotes?: string;             // e.g., "Pause at bottom"
  
  // Superset info
  supersetGroup?: string;              // e.g., "A" means pair with other "A"
  
  // For UI
  videoId?: string;
}

export interface DayPlan {
  dayNumber: number;                   // 1-7 within the week
  name: string;                        // e.g., "Push Day", "Full Body A", "Rest"
  isRestDay: boolean;
  
  // Only if not rest day
  focus?: string;                      // e.g., "Chest & Shoulders"
  targetMuscles?: MuscleGroup[];
  warmup?: WarmupRoutine;
  exercises?: ExercisePrescription[];
  estimatedDurationMinutes?: number;
  
  // Notes
  coachNotes?: string;
}

export interface WeekPlan {
  weekNumber: number;                  // 1-4 in mesocycle
  phase: 'accumulation' | 'intensification' | 'peak' | 'deload';
  days: DayPlan[];
  
  // Week-level adjustments
  volumeMultiplier: number;            // e.g., 1.0, 1.1, 0.6 for deload
  intensityMultiplier: number;         // e.g., 1.0, 1.05
}

export interface VolumeSummary {
  byMuscle: Record<MuscleGroup, number>;  // Sets per week
  totalSets: number;
  totalExercises: number;
}

export interface SubstitutionMap {
  [exerciseId: string]: string[];      // Alternative exercise IDs
}

export interface GeneratorMetadata {
  seed: number;
  generatedAt: string;                 // ISO timestamp
  planType: '4_week_mesocycle' | 'single_week' | 'single_day';
  split: string;                       // e.g., "full_body_3x", "upper_lower_4x"
  engineVersion: string;
}

export interface GeneratorOutput {
  metadata: GeneratorMetadata;
  
  // The actual plan
  mesocycle: {
    week1: WeekPlan;
    week2: WeekPlan;
    week3: WeekPlan;
    week4: WeekPlan;
  };
  
  // Summary data
  volumeSummary: VolumeSummary;
  
  // Safety & adaptation
  safetyFlags: string[];               // Warnings about limitations
  substitutions: SubstitutionMap;      // Pre-computed alternatives
  
  // For AI coach context
  programRationale?: string;           // Why these choices were made
}

// =============================================================================
// SPLIT TEMPLATES - Pre-defined workout structures
// =============================================================================

export interface SplitDayTemplate {
  name: string;
  movementPatterns: MovementPattern[];
  primaryMuscles: MuscleGroup[];
  exerciseCount: { min: number; max: number };
  compoundFirst: boolean;
}

export interface SplitTemplate {
  id: string;
  name: string;
  daysPerWeek: number;
  suitableFor: ExperienceLevel[];
  days: SplitDayTemplate[];
  restDayIndices: number[];            // 0-indexed, which days are rest
}

// =============================================================================
// VOLUME TARGETS - Sets per muscle per week by goal and experience
// =============================================================================

export interface VolumeTargets {
  goal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  minimumSets: Partial<Record<MuscleGroup, number>>;
  optimalSets: Partial<Record<MuscleGroup, number>>;
  maximumSets: Partial<Record<MuscleGroup, number>>;
}

// =============================================================================
// INTENSITY TARGETS - RIR and load percentages by goal and phase
// =============================================================================

export interface IntensityTargets {
  goal: FitnessGoal;
  phase: 'accumulation' | 'intensification' | 'peak' | 'deload';
  compoundRIR: { min: number; max: number };
  isolationRIR: { min: number; max: number };
  loadPercentage?: { min: number; max: number };  // Of 1RM, if known
}

// =============================================================================
// PERFORMANCE FEEDBACK - For weekly adaptation
// =============================================================================

export interface ExerciseFeedback {
  exerciseId: string;
  sessionDate: string;
  completedSets: number;
  averageRIR: number;
  feltDifficulty: 'too_easy' | 'appropriate' | 'too_hard';
  hadPain?: boolean;
  painLocation?: JointArea;
}

export interface WeeklyFeedback {
  weekNumber: number;
  overallFatigue: 1 | 2 | 3 | 4 | 5;   // 1=fresh, 5=exhausted
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  exerciseFeedback: ExerciseFeedback[];
  musclesSore?: MuscleGroup[];
  injuryNotes?: string;
}

export interface AdaptationRecommendation {
  type: 'increase_volume' | 'decrease_volume' | 'increase_intensity' | 'decrease_intensity' | 'substitute' | 'deload';
  target: string;                      // Muscle group or exercise ID
  reason: string;
  confidence: number;                  // 0-1
}

// =============================================================================
// LEGACY ADAPTER TYPES - For backward compatibility
// =============================================================================

// Type that matches existing PlannedWorkout format used in the app
export interface LegacyPlannedExercise {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  rirTarget?: number;  // Reps In Reserve target (e.g., 2 = stop 2 reps before failure)
}

export interface LegacyPlannedWorkout {
  day: number;
  title: string;
  exercises: LegacyPlannedExercise[];
}

// Type that matches what active.tsx expects
export interface ActiveWorkoutExercise {
  id: string;
  name: string;
  muscleGroup?: string | null;
  sets: Array<{
    id: string;
    weight: number | null;
    reps: number | null;
    rir?: number | null;
    isWarmup?: boolean;
    isDone?: boolean;
  }>;
  restTimerSeconds?: number;
}
