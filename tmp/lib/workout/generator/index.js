"use strict";
/**
 * Workout Generator - Main Exports
 *
 * This is the entry point for the local workout generation engine.
 * Import from this file to access all generator functionality.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HYPERTROPHY_VOLUME = exports.SPLIT_DISPLAY_NAMES = exports.mapUserPreferenceToSplit = exports.getSplitById = exports.getSplitsForExperience = exports.getRecommendedSplit = exports.ALL_SPLITS = exports.BRO_SPLIT_5X = exports.PPL_6X = exports.PPL_5X = exports.UPPER_LOWER_4X = exports.FULL_BODY_3X = exports.FULL_BODY_2X = exports.generateRandomSeed = exports.generateWeeklySeed = exports.generateDailySeed = exports.seedFromString = exports.SeededRandom = exports.createSeededRandom = exports.getMuscleRegion = exports.MUSCLE_REGIONS = exports.getPrimaryBodySide = exports.MUSCLE_BODY_SIDE = exports.MUSCLE_IMAGE_MAP = exports.displayGroupToMuscles = exports.musclesToDisplayGroups = exports.MUSCLE_DISPLAY_NAMES = exports.ALL_DISPLAY_GROUPS = exports.ALL_MUSCLE_GROUPS = exports.DISPLAY_TO_MUSCLES = exports.MUSCLE_TO_DISPLAY = exports.EQUIPMENT_ICONS = exports.EQUIPMENT_DISPLAY_NAMES = exports.getDefaultEquipment = exports.getMissingEquipment = exports.hasAnyEquipment = exports.hasAllEquipment = exports.hasEquipment = exports.userEquipmentToEngine = exports.EQUIPMENT_BUNDLES = exports.USER_EQUIPMENT_TO_ENGINE = exports.getLibraryStats = exports.getIsolationExercises = exports.getCompoundExercises = exports.getExercisesByEquipment = exports.getExercisesByMuscle = exports.getExercisesByPattern = exports.EXERCISE_BY_NAME = exports.EXERCISE_BY_ID = exports.EXERCISE_LIBRARY = void 0;
exports.findLimitationSafeAlternative = exports.findEquipmentAlternative = exports.findHarderVariation = exports.findEasierVariation = exports.findSubstitutes = exports.calculateSimilarity = exports.hasVarietyForMuscle = exports.getExercisesForMuscle = exports.selectAndPrescribeForDay = exports.prescribeExercise = exports.selectExercisesForDay = exports.selectExerciseForPattern = exports.scoreExercise = exports.hasMinimumEquipment = exports.getAvailableByMuscle = exports.getAvailableByPattern = exports.isExerciseAvailable = exports.applyConstraints = exports.filterByExperience = exports.filterByLimitations = exports.filterByEquipment = exports.FULL_BODY_WARMUP = exports.LOWER_BODY_WARMUP = exports.UPPER_BODY_WARMUP = exports.QUICK_WARMUP = exports.getPresetWarmup = exports.generateWarmup = exports.PHASE_ICONS = exports.PHASE_COLORS = exports.PHASE_ORDER = exports.suggestProgramNames = exports.validateProgramName = exports.getProgressionInfo = exports.getProgramSubtitle = exports.getPhaseDisplayName = exports.generateProgramNameWithPhase = exports.generateProgramName = exports.SPLIT_DESCRIPTORS = exports.EXPERIENCE_DESCRIPTORS = exports.GOAL_NAMES = exports.getCurrentPhase = exports.PHASES = exports.applyPhaseMultiplier = exports.adjustVolumeForTime = exports.getIntensityTargets = exports.getVolumeTargets = exports.INTENSITY_BY_PHASE = exports.FAT_LOSS_VOLUME = exports.GENERAL_FITNESS_VOLUME = exports.STRENGTH_VOLUME = void 0;
exports.ENGINE_VERSION = exports.addWarmupSets = exports.calculateWorkoutDuration = exports.formatExercisesForNavigation = exports.getWorkoutDays = exports.getExercisesForDay = exports.fromSavedProgramFormat = exports.toLegacyPlannedWorkouts = exports.toLegacyPlannedWorkout = exports.toPlannedWorkoutFormat = exports.toActiveWorkoutFormat = exports.toSavedProgramFormat = exports.previewProgram = exports.canGenerateProgram = exports.generateSingleWorkout = exports.generateProgram = exports.shouldProgressToNextMesocycle = exports.calculateProgression = exports.generateSubstitutions = exports.calculateVolumeSummary = exports.buildMesocycle = exports.buildWeek = exports.suggestVarietySwaps = exports.getProgressionPath = exports.findBatchSubstitutes = void 0;
// =============================================================================
// Exercise Library
// =============================================================================
var library_1 = require("../exercises/library");
Object.defineProperty(exports, "EXERCISE_LIBRARY", { enumerable: true, get: function () { return library_1.EXERCISE_LIBRARY; } });
Object.defineProperty(exports, "EXERCISE_BY_ID", { enumerable: true, get: function () { return library_1.EXERCISE_BY_ID; } });
Object.defineProperty(exports, "EXERCISE_BY_NAME", { enumerable: true, get: function () { return library_1.EXERCISE_BY_NAME; } });
Object.defineProperty(exports, "getExercisesByPattern", { enumerable: true, get: function () { return library_1.getExercisesByPattern; } });
Object.defineProperty(exports, "getExercisesByMuscle", { enumerable: true, get: function () { return library_1.getExercisesByMuscle; } });
Object.defineProperty(exports, "getExercisesByEquipment", { enumerable: true, get: function () { return library_1.getExercisesByEquipment; } });
Object.defineProperty(exports, "getCompoundExercises", { enumerable: true, get: function () { return library_1.getCompoundExercises; } });
Object.defineProperty(exports, "getIsolationExercises", { enumerable: true, get: function () { return library_1.getIsolationExercises; } });
Object.defineProperty(exports, "getLibraryStats", { enumerable: true, get: function () { return library_1.getLibraryStats; } });
// =============================================================================
// Equipment Mapping
// =============================================================================
var equipmentMap_1 = require("../exercises/equipmentMap");
Object.defineProperty(exports, "USER_EQUIPMENT_TO_ENGINE", { enumerable: true, get: function () { return equipmentMap_1.USER_EQUIPMENT_TO_ENGINE; } });
Object.defineProperty(exports, "EQUIPMENT_BUNDLES", { enumerable: true, get: function () { return equipmentMap_1.EQUIPMENT_BUNDLES; } });
Object.defineProperty(exports, "userEquipmentToEngine", { enumerable: true, get: function () { return equipmentMap_1.userEquipmentToEngine; } });
Object.defineProperty(exports, "hasEquipment", { enumerable: true, get: function () { return equipmentMap_1.hasEquipment; } });
Object.defineProperty(exports, "hasAllEquipment", { enumerable: true, get: function () { return equipmentMap_1.hasAllEquipment; } });
Object.defineProperty(exports, "hasAnyEquipment", { enumerable: true, get: function () { return equipmentMap_1.hasAnyEquipment; } });
Object.defineProperty(exports, "getMissingEquipment", { enumerable: true, get: function () { return equipmentMap_1.getMissingEquipment; } });
Object.defineProperty(exports, "getDefaultEquipment", { enumerable: true, get: function () { return equipmentMap_1.getDefaultEquipment; } });
Object.defineProperty(exports, "EQUIPMENT_DISPLAY_NAMES", { enumerable: true, get: function () { return equipmentMap_1.EQUIPMENT_DISPLAY_NAMES; } });
Object.defineProperty(exports, "EQUIPMENT_ICONS", { enumerable: true, get: function () { return equipmentMap_1.EQUIPMENT_ICONS; } });
// =============================================================================
// Muscle Mapping
// =============================================================================
var muscleMap_1 = require("../exercises/muscleMap");
Object.defineProperty(exports, "MUSCLE_TO_DISPLAY", { enumerable: true, get: function () { return muscleMap_1.MUSCLE_TO_DISPLAY; } });
Object.defineProperty(exports, "DISPLAY_TO_MUSCLES", { enumerable: true, get: function () { return muscleMap_1.DISPLAY_TO_MUSCLES; } });
Object.defineProperty(exports, "ALL_MUSCLE_GROUPS", { enumerable: true, get: function () { return muscleMap_1.ALL_MUSCLE_GROUPS; } });
Object.defineProperty(exports, "ALL_DISPLAY_GROUPS", { enumerable: true, get: function () { return muscleMap_1.ALL_DISPLAY_GROUPS; } });
Object.defineProperty(exports, "MUSCLE_DISPLAY_NAMES", { enumerable: true, get: function () { return muscleMap_1.MUSCLE_DISPLAY_NAMES; } });
Object.defineProperty(exports, "musclesToDisplayGroups", { enumerable: true, get: function () { return muscleMap_1.musclesToDisplayGroups; } });
Object.defineProperty(exports, "displayGroupToMuscles", { enumerable: true, get: function () { return muscleMap_1.displayGroupToMuscles; } });
Object.defineProperty(exports, "MUSCLE_IMAGE_MAP", { enumerable: true, get: function () { return muscleMap_1.MUSCLE_IMAGE_MAP; } });
Object.defineProperty(exports, "MUSCLE_BODY_SIDE", { enumerable: true, get: function () { return muscleMap_1.MUSCLE_BODY_SIDE; } });
Object.defineProperty(exports, "getPrimaryBodySide", { enumerable: true, get: function () { return muscleMap_1.getPrimaryBodySide; } });
Object.defineProperty(exports, "MUSCLE_REGIONS", { enumerable: true, get: function () { return muscleMap_1.MUSCLE_REGIONS; } });
Object.defineProperty(exports, "getMuscleRegion", { enumerable: true, get: function () { return muscleMap_1.getMuscleRegion; } });
// =============================================================================
// Seeded Random
// =============================================================================
var seededRandom_1 = require("../utils/seededRandom");
Object.defineProperty(exports, "createSeededRandom", { enumerable: true, get: function () { return seededRandom_1.createSeededRandom; } });
Object.defineProperty(exports, "SeededRandom", { enumerable: true, get: function () { return seededRandom_1.SeededRandom; } });
Object.defineProperty(exports, "seedFromString", { enumerable: true, get: function () { return seededRandom_1.seedFromString; } });
Object.defineProperty(exports, "generateDailySeed", { enumerable: true, get: function () { return seededRandom_1.generateDailySeed; } });
Object.defineProperty(exports, "generateWeeklySeed", { enumerable: true, get: function () { return seededRandom_1.generateWeeklySeed; } });
Object.defineProperty(exports, "generateRandomSeed", { enumerable: true, get: function () { return seededRandom_1.generateRandomSeed; } });
// =============================================================================
// Split Templates
// =============================================================================
var splits_1 = require("../templates/splits");
Object.defineProperty(exports, "FULL_BODY_2X", { enumerable: true, get: function () { return splits_1.FULL_BODY_2X; } });
Object.defineProperty(exports, "FULL_BODY_3X", { enumerable: true, get: function () { return splits_1.FULL_BODY_3X; } });
Object.defineProperty(exports, "UPPER_LOWER_4X", { enumerable: true, get: function () { return splits_1.UPPER_LOWER_4X; } });
Object.defineProperty(exports, "PPL_5X", { enumerable: true, get: function () { return splits_1.PPL_5X; } });
Object.defineProperty(exports, "PPL_6X", { enumerable: true, get: function () { return splits_1.PPL_6X; } });
Object.defineProperty(exports, "BRO_SPLIT_5X", { enumerable: true, get: function () { return splits_1.BRO_SPLIT_5X; } });
Object.defineProperty(exports, "ALL_SPLITS", { enumerable: true, get: function () { return splits_1.ALL_SPLITS; } });
Object.defineProperty(exports, "getRecommendedSplit", { enumerable: true, get: function () { return splits_1.getRecommendedSplit; } });
Object.defineProperty(exports, "getSplitsForExperience", { enumerable: true, get: function () { return splits_1.getSplitsForExperience; } });
Object.defineProperty(exports, "getSplitById", { enumerable: true, get: function () { return splits_1.getSplitById; } });
Object.defineProperty(exports, "mapUserPreferenceToSplit", { enumerable: true, get: function () { return splits_1.mapUserPreferenceToSplit; } });
Object.defineProperty(exports, "SPLIT_DISPLAY_NAMES", { enumerable: true, get: function () { return splits_1.SPLIT_DISPLAY_NAMES; } });
// =============================================================================
// Volume Targets
// =============================================================================
var volumeTargets_1 = require("../templates/volumeTargets");
Object.defineProperty(exports, "HYPERTROPHY_VOLUME", { enumerable: true, get: function () { return volumeTargets_1.HYPERTROPHY_VOLUME; } });
Object.defineProperty(exports, "STRENGTH_VOLUME", { enumerable: true, get: function () { return volumeTargets_1.STRENGTH_VOLUME; } });
Object.defineProperty(exports, "GENERAL_FITNESS_VOLUME", { enumerable: true, get: function () { return volumeTargets_1.GENERAL_FITNESS_VOLUME; } });
Object.defineProperty(exports, "FAT_LOSS_VOLUME", { enumerable: true, get: function () { return volumeTargets_1.FAT_LOSS_VOLUME; } });
Object.defineProperty(exports, "INTENSITY_BY_PHASE", { enumerable: true, get: function () { return volumeTargets_1.INTENSITY_BY_PHASE; } });
Object.defineProperty(exports, "getVolumeTargets", { enumerable: true, get: function () { return volumeTargets_1.getVolumeTargets; } });
Object.defineProperty(exports, "getIntensityTargets", { enumerable: true, get: function () { return volumeTargets_1.getIntensityTargets; } });
Object.defineProperty(exports, "adjustVolumeForTime", { enumerable: true, get: function () { return volumeTargets_1.adjustVolumeForTime; } });
Object.defineProperty(exports, "applyPhaseMultiplier", { enumerable: true, get: function () { return volumeTargets_1.applyPhaseMultiplier; } });
var programNames_1 = require("../templates/programNames");
Object.defineProperty(exports, "PHASES", { enumerable: true, get: function () { return programNames_1.PHASES; } });
Object.defineProperty(exports, "getCurrentPhase", { enumerable: true, get: function () { return programNames_1.getCurrentPhase; } });
Object.defineProperty(exports, "GOAL_NAMES", { enumerable: true, get: function () { return programNames_1.GOAL_NAMES; } });
Object.defineProperty(exports, "EXPERIENCE_DESCRIPTORS", { enumerable: true, get: function () { return programNames_1.EXPERIENCE_DESCRIPTORS; } });
Object.defineProperty(exports, "SPLIT_DESCRIPTORS", { enumerable: true, get: function () { return programNames_1.SPLIT_DESCRIPTORS; } });
Object.defineProperty(exports, "generateProgramName", { enumerable: true, get: function () { return programNames_1.generateProgramName; } });
Object.defineProperty(exports, "generateProgramNameWithPhase", { enumerable: true, get: function () { return programNames_1.generateProgramNameWithPhase; } });
Object.defineProperty(exports, "getPhaseDisplayName", { enumerable: true, get: function () { return programNames_1.getPhaseDisplayName; } });
Object.defineProperty(exports, "getProgramSubtitle", { enumerable: true, get: function () { return programNames_1.getProgramSubtitle; } });
Object.defineProperty(exports, "getProgressionInfo", { enumerable: true, get: function () { return programNames_1.getProgressionInfo; } });
Object.defineProperty(exports, "validateProgramName", { enumerable: true, get: function () { return programNames_1.validateProgramName; } });
Object.defineProperty(exports, "suggestProgramNames", { enumerable: true, get: function () { return programNames_1.suggestProgramNames; } });
Object.defineProperty(exports, "PHASE_ORDER", { enumerable: true, get: function () { return programNames_1.PHASE_ORDER; } });
Object.defineProperty(exports, "PHASE_COLORS", { enumerable: true, get: function () { return programNames_1.PHASE_COLORS; } });
Object.defineProperty(exports, "PHASE_ICONS", { enumerable: true, get: function () { return programNames_1.PHASE_ICONS; } });
// =============================================================================
// Warmup Templates
// =============================================================================
var warmupTemplates_1 = require("../templates/warmupTemplates");
Object.defineProperty(exports, "generateWarmup", { enumerable: true, get: function () { return warmupTemplates_1.generateWarmup; } });
Object.defineProperty(exports, "getPresetWarmup", { enumerable: true, get: function () { return warmupTemplates_1.getPresetWarmup; } });
Object.defineProperty(exports, "QUICK_WARMUP", { enumerable: true, get: function () { return warmupTemplates_1.QUICK_WARMUP; } });
Object.defineProperty(exports, "UPPER_BODY_WARMUP", { enumerable: true, get: function () { return warmupTemplates_1.UPPER_BODY_WARMUP; } });
Object.defineProperty(exports, "LOWER_BODY_WARMUP", { enumerable: true, get: function () { return warmupTemplates_1.LOWER_BODY_WARMUP; } });
Object.defineProperty(exports, "FULL_BODY_WARMUP", { enumerable: true, get: function () { return warmupTemplates_1.FULL_BODY_WARMUP; } });
// =============================================================================
// Constraints Engine
// =============================================================================
var constraints_1 = require("../engine/constraints");
Object.defineProperty(exports, "filterByEquipment", { enumerable: true, get: function () { return constraints_1.filterByEquipment; } });
Object.defineProperty(exports, "filterByLimitations", { enumerable: true, get: function () { return constraints_1.filterByLimitations; } });
Object.defineProperty(exports, "filterByExperience", { enumerable: true, get: function () { return constraints_1.filterByExperience; } });
Object.defineProperty(exports, "applyConstraints", { enumerable: true, get: function () { return constraints_1.applyConstraints; } });
Object.defineProperty(exports, "isExerciseAvailable", { enumerable: true, get: function () { return constraints_1.isExerciseAvailable; } });
Object.defineProperty(exports, "getAvailableByPattern", { enumerable: true, get: function () { return constraints_1.getAvailableByPattern; } });
Object.defineProperty(exports, "getAvailableByMuscle", { enumerable: true, get: function () { return constraints_1.getAvailableByMuscle; } });
Object.defineProperty(exports, "hasMinimumEquipment", { enumerable: true, get: function () { return constraints_1.hasMinimumEquipment; } });
// =============================================================================
// Exercise Selector
// =============================================================================
var exerciseSelector_1 = require("../engine/exerciseSelector");
Object.defineProperty(exports, "scoreExercise", { enumerable: true, get: function () { return exerciseSelector_1.scoreExercise; } });
Object.defineProperty(exports, "selectExerciseForPattern", { enumerable: true, get: function () { return exerciseSelector_1.selectExerciseForPattern; } });
Object.defineProperty(exports, "selectExercisesForDay", { enumerable: true, get: function () { return exerciseSelector_1.selectExercisesForDay; } });
Object.defineProperty(exports, "prescribeExercise", { enumerable: true, get: function () { return exerciseSelector_1.prescribeExercise; } });
Object.defineProperty(exports, "selectAndPrescribeForDay", { enumerable: true, get: function () { return exerciseSelector_1.selectAndPrescribeForDay; } });
Object.defineProperty(exports, "getExercisesForMuscle", { enumerable: true, get: function () { return exerciseSelector_1.getExercisesForMuscle; } });
Object.defineProperty(exports, "hasVarietyForMuscle", { enumerable: true, get: function () { return exerciseSelector_1.hasVarietyForMuscle; } });
// =============================================================================
// Substitutions
// =============================================================================
var substitutions_1 = require("../engine/substitutions");
Object.defineProperty(exports, "calculateSimilarity", { enumerable: true, get: function () { return substitutions_1.calculateSimilarity; } });
Object.defineProperty(exports, "findSubstitutes", { enumerable: true, get: function () { return substitutions_1.findSubstitutes; } });
Object.defineProperty(exports, "findEasierVariation", { enumerable: true, get: function () { return substitutions_1.findEasierVariation; } });
Object.defineProperty(exports, "findHarderVariation", { enumerable: true, get: function () { return substitutions_1.findHarderVariation; } });
Object.defineProperty(exports, "findEquipmentAlternative", { enumerable: true, get: function () { return substitutions_1.findEquipmentAlternative; } });
Object.defineProperty(exports, "findLimitationSafeAlternative", { enumerable: true, get: function () { return substitutions_1.findLimitationSafeAlternative; } });
Object.defineProperty(exports, "findBatchSubstitutes", { enumerable: true, get: function () { return substitutions_1.findBatchSubstitutes; } });
Object.defineProperty(exports, "getProgressionPath", { enumerable: true, get: function () { return substitutions_1.getProgressionPath; } });
Object.defineProperty(exports, "suggestVarietySwaps", { enumerable: true, get: function () { return substitutions_1.suggestVarietySwaps; } });
// =============================================================================
// Mesocycle Builder
// =============================================================================
var mesocycleBuilder_1 = require("../engine/mesocycleBuilder");
Object.defineProperty(exports, "buildWeek", { enumerable: true, get: function () { return mesocycleBuilder_1.buildWeek; } });
Object.defineProperty(exports, "buildMesocycle", { enumerable: true, get: function () { return mesocycleBuilder_1.buildMesocycle; } });
Object.defineProperty(exports, "calculateVolumeSummary", { enumerable: true, get: function () { return mesocycleBuilder_1.calculateVolumeSummary; } });
Object.defineProperty(exports, "generateSubstitutions", { enumerable: true, get: function () { return mesocycleBuilder_1.generateSubstitutions; } });
Object.defineProperty(exports, "calculateProgression", { enumerable: true, get: function () { return mesocycleBuilder_1.calculateProgression; } });
Object.defineProperty(exports, "shouldProgressToNextMesocycle", { enumerable: true, get: function () { return mesocycleBuilder_1.shouldProgressToNextMesocycle; } });
// =============================================================================
// Main Generator
// =============================================================================
var generator_1 = require("../engine/generator");
Object.defineProperty(exports, "generateProgram", { enumerable: true, get: function () { return generator_1.generateProgram; } });
Object.defineProperty(exports, "generateSingleWorkout", { enumerable: true, get: function () { return generator_1.generateSingleWorkout; } });
Object.defineProperty(exports, "canGenerateProgram", { enumerable: true, get: function () { return generator_1.canGenerateProgram; } });
Object.defineProperty(exports, "previewProgram", { enumerable: true, get: function () { return generator_1.previewProgram; } });
// =============================================================================
// Legacy Adapters
// =============================================================================
var legacyAdapter_1 = require("../adapters/legacyAdapter");
Object.defineProperty(exports, "toSavedProgramFormat", { enumerable: true, get: function () { return legacyAdapter_1.toSavedProgramFormat; } });
Object.defineProperty(exports, "toActiveWorkoutFormat", { enumerable: true, get: function () { return legacyAdapter_1.toActiveWorkoutFormat; } });
Object.defineProperty(exports, "toPlannedWorkoutFormat", { enumerable: true, get: function () { return legacyAdapter_1.toPlannedWorkoutFormat; } });
Object.defineProperty(exports, "toLegacyPlannedWorkout", { enumerable: true, get: function () { return legacyAdapter_1.toLegacyPlannedWorkout; } });
Object.defineProperty(exports, "toLegacyPlannedWorkouts", { enumerable: true, get: function () { return legacyAdapter_1.toLegacyPlannedWorkouts; } });
Object.defineProperty(exports, "fromSavedProgramFormat", { enumerable: true, get: function () { return legacyAdapter_1.fromSavedProgramFormat; } });
Object.defineProperty(exports, "getExercisesForDay", { enumerable: true, get: function () { return legacyAdapter_1.getExercisesForDay; } });
Object.defineProperty(exports, "getWorkoutDays", { enumerable: true, get: function () { return legacyAdapter_1.getWorkoutDays; } });
Object.defineProperty(exports, "formatExercisesForNavigation", { enumerable: true, get: function () { return legacyAdapter_1.formatExercisesForNavigation; } });
Object.defineProperty(exports, "calculateWorkoutDuration", { enumerable: true, get: function () { return legacyAdapter_1.calculateWorkoutDuration; } });
Object.defineProperty(exports, "addWarmupSets", { enumerable: true, get: function () { return legacyAdapter_1.addWarmupSets; } });
// =============================================================================
// Engine Version
// =============================================================================
exports.ENGINE_VERSION = '1.0.0';
