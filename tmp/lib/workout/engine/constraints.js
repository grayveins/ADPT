"use strict";
/**
 * Constraints Engine - Filter exercises based on equipment and limitations
 *
 * This module handles:
 * 1. Equipment availability filtering
 * 2. Physical limitation/injury filtering
 * 3. Exercise difficulty filtering by experience level
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterByEquipment = filterByEquipment;
exports.getExercisesNeedingEquipment = getExercisesNeedingEquipment;
exports.filterByLimitations = filterByLimitations;
exports.getExercisesWithCaution = getExercisesWithCaution;
exports.filterByExperience = filterByExperience;
exports.getAspirationalExercises = getAspirationalExercises;
exports.applyConstraints = applyConstraints;
exports.isExerciseAvailable = isExerciseAvailable;
exports.getAvailableByPattern = getAvailableByPattern;
exports.getAvailableByMuscle = getAvailableByMuscle;
exports.hasMinimumEquipment = hasMinimumEquipment;
var library_1 = require("../exercises/library");
var equipmentMap_1 = require("../exercises/equipmentMap");
// =============================================================================
// EQUIPMENT CONSTRAINTS
// =============================================================================
/**
 * Filter exercises to only those the user can perform with their equipment.
 */
function filterByEquipment(exercises, userEquipment) {
    var availableEquipment = (0, equipmentMap_1.userEquipmentToEngine)(userEquipment);
    return exercises.filter(function (exercise) {
        // Check if user has ALL required equipment
        var hasRequired = exercise.equipment.every(function (eq) { return availableEquipment.includes(eq); });
        return hasRequired;
    });
}
/**
 * Get exercises that could be done with additional equipment.
 * Useful for showing "unlock with X equipment" suggestions.
 */
function getExercisesNeedingEquipment(exercises, userEquipment, additionalEquipment) {
    var currentAvailable = (0, equipmentMap_1.userEquipmentToEngine)(userEquipment);
    var withAdditional = __spreadArray(__spreadArray([], currentAvailable, true), [additionalEquipment], false);
    return exercises.filter(function (exercise) {
        // Not currently available
        var notCurrentlyAvailable = !exercise.equipment.every(function (eq) { return currentAvailable.includes(eq); });
        // But would be available with additional equipment
        var wouldBeAvailable = exercise.equipment.every(function (eq) { return withAdditional.includes(eq); });
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
var SEVERITY_THRESHOLDS = {
    mild: 2, // Allow up to moderate stress
    moderate: 1, // Allow only low stress
    severe: 0, // No stress allowed
};
var STRESS_LEVELS = {
    none: 0,
    low: 1,
    moderate: 2,
    high: 3,
};
/**
 * Filter exercises based on physical limitations.
 */
function filterByLimitations(exercises, limitations) {
    if (limitations.length === 0)
        return exercises;
    return exercises.filter(function (exercise) {
        // Check each limitation
        for (var _i = 0, limitations_1 = limitations; _i < limitations_1.length; _i++) {
            var limitation = limitations_1[_i];
            var exerciseStress = exercise.jointStress[limitation.area];
            if (exerciseStress) {
                var stressLevel = STRESS_LEVELS[exerciseStress] || 0;
                var maxAllowed = SEVERITY_THRESHOLDS[limitation.severity];
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
function getExercisesWithCaution(exercises, limitations) {
    var results = [];
    for (var _i = 0, exercises_1 = exercises; _i < exercises_1.length; _i++) {
        var exercise = exercises_1[_i];
        var warnings = [];
        for (var _a = 0, limitations_2 = limitations; _a < limitations_2.length; _a++) {
            var limitation = limitations_2[_a];
            var stress = exercise.jointStress[limitation.area];
            if (stress && stress !== 'none') {
                warnings.push("".concat(exercise.name, " puts ").concat(stress, " stress on ").concat(limitation.area.replace('_', ' ')));
            }
        }
        if (warnings.length > 0) {
            results.push({ exercise: exercise, warnings: warnings });
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
function filterByExperience(exercises, experience) {
    var allowedDifficulties = {
        beginner: ['beginner'],
        intermediate: ['beginner', 'intermediate'],
        advanced: ['beginner', 'intermediate', 'advanced'],
    };
    var allowed = allowedDifficulties[experience];
    return exercises.filter(function (ex) { return allowed.includes(ex.difficulty); });
}
/**
 * Get exercises that are "aspirational" - slightly above current level.
 * Useful for progression suggestions.
 */
function getAspirationalExercises(exercises, experience) {
    var nextLevel = {
        beginner: 'intermediate',
        intermediate: 'advanced',
        advanced: null,
    };
    var target = nextLevel[experience];
    if (!target)
        return [];
    return exercises.filter(function (ex) { return ex.difficulty === target; });
}
/**
 * Apply all constraints to the exercise library and return available exercises.
 */
function applyConstraints(options) {
    var userEquipment = options.userEquipment, _a = options.limitations, limitations = _a === void 0 ? [] : _a, _b = options.experienceLevel, experienceLevel = _b === void 0 ? 'intermediate' : _b, _c = options.excludedExercises, excludedExercises = _c === void 0 ? [] : _c;
    var exercises = __spreadArray([], library_1.EXERCISE_LIBRARY, true);
    var warnings = [];
    // Track what gets excluded at each stage
    var excluded = {
        byEquipment: [],
        byLimitation: [],
        byExperience: [],
        byUserPreference: [],
    };
    // 1. Filter by equipment
    var afterEquipment = filterByEquipment(exercises, userEquipment);
    excluded.byEquipment = exercises.filter(function (ex) { return !afterEquipment.includes(ex); });
    exercises = afterEquipment;
    if (excluded.byEquipment.length > 20) {
        warnings.push("".concat(excluded.byEquipment.length, " exercises unavailable due to equipment"));
    }
    // 2. Filter by limitations
    var afterLimitations = filterByLimitations(exercises, limitations);
    excluded.byLimitation = exercises.filter(function (ex) { return !afterLimitations.includes(ex); });
    exercises = afterLimitations;
    if (excluded.byLimitation.length > 0) {
        var areas = __spreadArray([], new Set(limitations.map(function (l) { return l.area; })), true);
        warnings.push("".concat(excluded.byLimitation.length, " exercises excluded for ").concat(areas.join(', '), " safety"));
    }
    // 3. Filter by experience (but keep some advanced options for variety)
    var afterExperience = filterByExperience(exercises, experienceLevel);
    excluded.byExperience = exercises.filter(function (ex) { return !afterExperience.includes(ex); });
    exercises = afterExperience;
    // 4. Remove user-excluded exercises
    if (excludedExercises.length > 0) {
        var excludedSet_1 = new Set(excludedExercises);
        var afterUserExclusion = exercises.filter(function (ex) { return !excludedSet_1.has(ex.id); });
        excluded.byUserPreference = exercises.filter(function (ex) { return excludedSet_1.has(ex.id); });
        exercises = afterUserExclusion;
    }
    // Check if we have enough exercises
    if (exercises.length < 20) {
        warnings.push('Limited exercise variety available. Consider adding equipment or adjusting limitations.');
    }
    return {
        available: exercises,
        excluded: excluded,
        warnings: warnings,
    };
}
// =============================================================================
// EXERCISE AVAILABILITY QUERIES
// =============================================================================
/**
 * Check if a specific exercise is available given constraints.
 */
function isExerciseAvailable(exerciseId, options) {
    var result = applyConstraints(options);
    return result.available.some(function (ex) { return ex.id === exerciseId; });
}
/**
 * Get count of available exercises by movement pattern.
 */
function getAvailableByPattern(options) {
    var result = applyConstraints(options);
    var counts = {};
    for (var _i = 0, _a = result.available; _i < _a.length; _i++) {
        var exercise = _a[_i];
        counts[exercise.movementPattern] = (counts[exercise.movementPattern] || 0) + 1;
    }
    return counts;
}
/**
 * Get count of available exercises by primary muscle.
 */
function getAvailableByMuscle(options) {
    var result = applyConstraints(options);
    var counts = {};
    for (var _i = 0, _a = result.available; _i < _a.length; _i++) {
        var exercise = _a[_i];
        for (var _b = 0, _c = exercise.primaryMuscles; _b < _c.length; _b++) {
            var muscle = _c[_b];
            counts[muscle] = (counts[muscle] || 0) + 1;
        }
    }
    return counts;
}
/**
 * Check if user has minimum viable equipment for a workout type.
 */
function hasMinimumEquipment(userEquipment, workoutType) {
    var options = { userEquipment: userEquipment };
    var byPattern = getAvailableByPattern(options);
    var requirements = {
        push: ['horizontal_push', 'vertical_push', 'isolation_push'],
        pull: ['horizontal_pull', 'vertical_pull', 'isolation_pull'],
        legs: ['squat', 'hinge', 'isolation_leg'],
        upper: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull'],
        lower: ['squat', 'hinge', 'lunge'],
        full: ['horizontal_push', 'horizontal_pull', 'squat', 'hinge'],
    };
    var required = requirements[workoutType] || [];
    var missingPatterns = required.filter(function (pattern) { return (byPattern[pattern] || 0) < 2; });
    return {
        viable: missingPatterns.length === 0,
        missingPatterns: missingPatterns,
    };
}
