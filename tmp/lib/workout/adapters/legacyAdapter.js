"use strict";
/**
 * Legacy Adapter - Convert generator output to existing app formats
 *
 * The app uses several existing data structures for workouts.
 * This adapter bridges the new generator output to those formats.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.toSavedProgramFormat = toSavedProgramFormat;
exports.toActiveWorkoutFormat = toActiveWorkoutFormat;
exports.toPlannedWorkoutFormat = toPlannedWorkoutFormat;
exports.toLegacyPlannedWorkout = toLegacyPlannedWorkout;
exports.toLegacyPlannedWorkouts = toLegacyPlannedWorkouts;
exports.fromSavedProgramFormat = fromSavedProgramFormat;
exports.getExercisesForDay = getExercisesForDay;
exports.getWorkoutDays = getWorkoutDays;
exports.formatExercisesForNavigation = formatExercisesForNavigation;
exports.calculateWorkoutDuration = calculateWorkoutDuration;
exports.addWarmupSets = addWarmupSets;
var library_1 = require("../exercises/library");
// =============================================================================
// CONVERSION FUNCTIONS
// =============================================================================
/**
 * Convert generator output to saved_programs format.
 * This is what gets stored in the database.
 */
function toSavedProgramFormat(output, programName, goal) {
    // Use week 1 as the template (week 2 is similar, 3-4 are variations)
    var week = output.mesocycle.week1;
    var workouts = week.days
        .filter(function (day) { return !day.isRestDay; })
        .map(function (day, index) { return ({
        day: index + 1,
        title: day.name,
        exercises: (day.exercises || []).map(function (ex) { return ({
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
        }); }),
    }); });
    return {
        name: programName,
        goal: goal,
        duration_weeks: 4, // Standard mesocycle
        days_per_week: workouts.length,
        workouts: workouts,
    };
}
/**
 * Convert a DayPlan to the format expected by active.tsx
 */
function toActiveWorkoutFormat(day) {
    if (day.isRestDay || !day.exercises) {
        return { exercises: [] };
    }
    return {
        exercises: day.exercises.map(function (prescription, exIndex) {
            // Create empty sets for the user to fill in
            var sets = Array.from({ length: prescription.sets }, function (_, setIndex) { return ({
                id: "".concat(prescription.exerciseId, "-set-").concat(setIndex + 1),
                weight: null,
                reps: null,
                rir: prescription.rirTarget,
                isWarmup: false,
                isDone: false,
            }); });
            return {
                id: "".concat(prescription.exerciseId, "-").concat(exIndex),
                name: prescription.name,
                muscleGroup: prescription.muscleGroup,
                sets: sets,
                restTimerSeconds: prescription.restSeconds,
            };
        }),
    };
}
/**
 * Convert generator output to PlannedWorkout[] for the weekly view.
 */
function toPlannedWorkoutFormat(output, weekNumber, startDate) {
    var weekKey = "week".concat(weekNumber);
    var week = output.mesocycle[weekKey];
    return week.days.map(function (day, index) {
        var date = new Date(startDate);
        date.setDate(date.getDate() + index);
        return {
            date: date.toISOString().split('T')[0],
            type: day.name,
            focus: day.focus || '',
            isRest: day.isRestDay,
            durationMinutes: day.estimatedDurationMinutes || 60,
        };
    });
}
/**
 * Convert a single DayPlan to LegacyPlannedWorkout format.
 */
function toLegacyPlannedWorkout(day, dayNumber) {
    return {
        day: dayNumber,
        title: day.name,
        exercises: (day.exercises || []).map(function (ex) { return ({
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
        }); }),
    };
}
/**
 * Convert full mesocycle to array of LegacyPlannedWorkout.
 * Useful for backwards compatibility with existing code.
 */
function toLegacyPlannedWorkouts(output, weekNumber) {
    if (weekNumber === void 0) { weekNumber = 1; }
    var weekKey = "week".concat(weekNumber);
    var week = output.mesocycle[weekKey];
    return week.days
        .filter(function (day) { return !day.isRestDay; })
        .map(function (day, index) { return toLegacyPlannedWorkout(day, index + 1); });
}
// =============================================================================
// REVERSE ADAPTERS (App format → Generator format)
// =============================================================================
/**
 * Convert saved_programs format back to something the generator can adapt.
 * Useful for modifying existing programs.
 */
function fromSavedProgramFormat(saved) {
    return {
        workouts: saved.workouts.map(function (w) { return ({
            name: w.title,
            exercises: w.exercises.map(function (ex, i) { return ({
                exerciseId: findExerciseId(ex.name) || "custom-".concat(i),
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                sets: ex.sets,
                reps: ex.reps,
                rirTarget: 2, // Default
                restSeconds: ex.restSeconds || 90,
            }); }),
        }); }),
    };
}
/**
 * Try to find the exercise ID from the library by name.
 */
function findExerciseId(name) {
    var entries = Object.entries(library_1.EXERCISE_BY_ID);
    var match = entries.find(function (_a) {
        var _ = _a[0], ex = _a[1];
        return ex.name.toLowerCase() === name.toLowerCase();
    });
    return match ? match[0] : null;
}
// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
/**
 * Get exercises for a specific week and day from generator output.
 */
function getExercisesForDay(output, weekNumber, dayIndex) {
    var weekKey = "week".concat(weekNumber);
    var week = output.mesocycle[weekKey];
    var day = week.days[dayIndex];
    return (day === null || day === void 0 ? void 0 : day.exercises) || [];
}
/**
 * Get workout days (non-rest) from a week.
 */
function getWorkoutDays(week) {
    return week.days.filter(function (d) { return !d.isRestDay; });
}
/**
 * Format exercises as URL params for navigation to active.tsx
 */
function formatExercisesForNavigation(exercises) {
    var formatted = exercises.map(function (ex) { return ({
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets,
        reps: ex.reps,
        restSeconds: ex.restSeconds,
    }); });
    return JSON.stringify(formatted);
}
/**
 * Calculate total workout duration from exercises.
 */
function calculateWorkoutDuration(exercises) {
    return exercises.reduce(function (total, ex) {
        var setsTime = ex.sets * 1.5; // ~1.5 min per set
        var restTime = (ex.sets - 1) * (ex.restSeconds / 60);
        return total + setsTime + restTime;
    }, 0);
}
/**
 * Add warmup sets to an exercise prescription for active workout.
 */
function addWarmupSets(exercises, warmupCount) {
    if (warmupCount === void 0) { warmupCount = 2; }
    return exercises.map(function (exercise, index) {
        // Only add warmup sets to first 2-3 compound exercises
        if (index >= 3)
            return exercise;
        var warmupSets = Array.from({ length: warmupCount }, function (_, setIndex) { return ({
            id: "".concat(exercise.id, "-warmup-").concat(setIndex + 1),
            weight: null,
            reps: null,
            rir: null,
            isWarmup: true,
            isDone: false,
        }); });
        return __assign(__assign({}, exercise), { sets: __spreadArray(__spreadArray([], warmupSets, true), exercise.sets, true) });
    });
}
