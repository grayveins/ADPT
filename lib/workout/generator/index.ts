/**
 * Workout Generator - Main Exports
 * 
 * This is the entry point for the local workout generation engine.
 * Import from this file to access all generator functionality.
 */

// =============================================================================
// Types
// =============================================================================
export type {
  // Muscle groups
  MuscleGroup,
  DisplayMuscleGroup,
  
  // Movement patterns
  MovementPattern,
  
  // Equipment
  Equipment,
  UserEquipment,
  
  // Joint stress
  JointArea,
  StressLevel,
  JointStress,
  
  // Exercise definition
  ExerciseCategory,
  ExerciseDifficulty,
  Exercise,
  
  // Generator input
  FitnessGoal,
  ExperienceLevel,
  SplitPreference,
  PhysicalLimitation,
  MusclePriority,
  GeneratorInput,
  
  // Generator output
  WarmupExercise,
  WarmupSection,
  WarmupRoutine,
  ExercisePrescription,
  DayPlan,
  WeekPlan,
  VolumeSummary,
  SubstitutionMap,
  GeneratorMetadata,
  GeneratorOutput,
  
  // Split templates
  SplitDayTemplate,
  SplitTemplate,
  
  // Volume and intensity
  VolumeTargets,
  IntensityTargets,
  
  // Performance feedback
  ExerciseFeedback,
  WeeklyFeedback,
  AdaptationRecommendation,
  
  // Legacy adapters
  LegacyPlannedExercise,
  LegacyPlannedWorkout,
  ActiveWorkoutExercise,
} from './types';

// =============================================================================
// Exercise Library
// =============================================================================
export {
  EXERCISE_LIBRARY,
  EXERCISE_BY_ID,
  EXERCISE_BY_NAME,
  getExercisesByPattern,
  getExercisesByMuscle,
  getExercisesByEquipment,
  getCompoundExercises,
  getIsolationExercises,
  getLibraryStats,
} from '../exercises/library';

// =============================================================================
// Equipment Mapping
// =============================================================================
export {
  USER_EQUIPMENT_TO_ENGINE,
  EQUIPMENT_BUNDLES,
  userEquipmentToEngine,
  hasEquipment,
  hasAllEquipment,
  hasAnyEquipment,
  getMissingEquipment,
  getDefaultEquipment,
  EQUIPMENT_DISPLAY_NAMES,
  EQUIPMENT_ICONS,
} from '../exercises/equipmentMap';

// =============================================================================
// Muscle Mapping
// =============================================================================
export {
  MUSCLE_TO_DISPLAY,
  DISPLAY_TO_MUSCLES,
  ALL_MUSCLE_GROUPS,
  ALL_DISPLAY_GROUPS,
  MUSCLE_DISPLAY_NAMES,
  musclesToDisplayGroups,
  displayGroupToMuscles,
  MUSCLE_IMAGE_MAP,
  MUSCLE_BODY_SIDE,
  getPrimaryBodySide,
  MUSCLE_REGIONS,
  getMuscleRegion,
} from '../exercises/muscleMap';

// =============================================================================
// Seeded Random
// =============================================================================
export {
  createSeededRandom,
  SeededRandom,
  seedFromString,
  generateDailySeed,
  generateWeeklySeed,
  generateRandomSeed,
} from '../utils/seededRandom';

// =============================================================================
// Split Templates
// =============================================================================
export {
  FULL_BODY_2X,
  FULL_BODY_3X,
  UPPER_LOWER_4X,
  PPL_5X,
  PPL_6X,
  BRO_SPLIT_5X,
  ALL_SPLITS,
  getRecommendedSplit,
  getSplitsForExperience,
  getSplitById,
  mapUserPreferenceToSplit,
  SPLIT_DISPLAY_NAMES,
} from '../templates/splits';

// =============================================================================
// Volume Targets
// =============================================================================
export {
  HYPERTROPHY_VOLUME,
  STRENGTH_VOLUME,
  GENERAL_FITNESS_VOLUME,
  FAT_LOSS_VOLUME,
  INTENSITY_BY_PHASE,
  getVolumeTargets,
  getIntensityTargets,
  adjustVolumeForTime,
  applyPhaseMultiplier,
} from '../templates/volumeTargets';

// =============================================================================
// Program Naming & Phases
// =============================================================================
export type { MesocyclePhase, PhaseInfo, ProgressionInfo } from '../templates/programNames';
export {
  PHASES,
  getCurrentPhase,
  GOAL_NAMES,
  EXPERIENCE_DESCRIPTORS,
  SPLIT_DESCRIPTORS,
  generateProgramName,
  generateProgramNameWithPhase,
  getPhaseDisplayName,
  getProgramSubtitle,
  getProgressionInfo,
  validateProgramName,
  suggestProgramNames,
  PHASE_ORDER,
  PHASE_COLORS,
  PHASE_ICONS,
} from '../templates/programNames';

// =============================================================================
// Warmup Templates
// =============================================================================
export {
  generateWarmup,
  getPresetWarmup,
  QUICK_WARMUP,
  UPPER_BODY_WARMUP,
  LOWER_BODY_WARMUP,
  FULL_BODY_WARMUP,
} from '../templates/warmupTemplates';

// =============================================================================
// Constraints Engine
// =============================================================================
export {
  filterByEquipment,
  filterByLimitations,
  filterByExperience,
  applyConstraints,
  isExerciseAvailable,
  getAvailableByPattern,
  getAvailableByMuscle,
  hasMinimumEquipment,
} from '../engine/constraints';
export type { ConstraintOptions, ConstraintResult } from '../engine/constraints';

// =============================================================================
// Exercise Selector
// =============================================================================
export {
  scoreExercise,
  selectExerciseForPattern,
  selectExercisesForDay,
  prescribeExercise,
  selectAndPrescribeForDay,
  getExercisesForMuscle,
  hasVarietyForMuscle,
} from '../engine/exerciseSelector';
export type { SelectionConfig, DaySelectionResult } from '../engine/exerciseSelector';

// =============================================================================
// Substitutions
// =============================================================================
export {
  calculateSimilarity,
  findSubstitutes,
  findEasierVariation,
  findHarderVariation,
  findEquipmentAlternative,
  findLimitationSafeAlternative,
  findBatchSubstitutes,
  getProgressionPath,
  suggestVarietySwaps,
} from '../engine/substitutions';

// =============================================================================
// Mesocycle Builder
// =============================================================================
export {
  buildWeek,
  buildMesocycle,
  calculateVolumeSummary,
  generateSubstitutions,
  calculateProgression,
  shouldProgressToNextMesocycle,
} from '../engine/mesocycleBuilder';
export type { MesocycleConfig } from '../engine/mesocycleBuilder';

// =============================================================================
// Main Generator
// =============================================================================
export {
  generateProgram,
  generateSingleWorkout,
  canGenerateProgram,
  previewProgram,
} from '../engine/generator';
export type { GeneratorOptions } from '../engine/generator';

// =============================================================================
// Legacy Adapters
// =============================================================================
export {
  toSavedProgramFormat,
  toActiveWorkoutFormat,
  toPlannedWorkoutFormat,
  toLegacyPlannedWorkout,
  toLegacyPlannedWorkouts,
  fromSavedProgramFormat,
  getExercisesForDay,
  getWorkoutDays,
  formatExercisesForNavigation,
  calculateWorkoutDuration,
  addWarmupSets,
} from '../adapters/legacyAdapter';
export type {
  PlannedWorkoutFormat,
  SavedProgramFormat,
  ActiveWorkoutFormat,
} from '../adapters/legacyAdapter';

// =============================================================================
// Engine Version
// =============================================================================
export const ENGINE_VERSION = '1.0.0';
