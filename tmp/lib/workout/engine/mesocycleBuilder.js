"use strict";
/**
 * Mesocycle Builder - Build 4-week training blocks with progression
 *
 * This module handles:
 * 1. Building complete 4-week mesocycles
 * 2. Progressive overload across weeks
 * 3. Phase-appropriate volume and intensity adjustments
 * 4. Deload week integration
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
exports.buildWeek = buildWeek;
exports.buildMesocycle = buildMesocycle;
exports.calculateVolumeSummary = calculateVolumeSummary;
exports.generateSubstitutions = generateSubstitutions;
exports.calculateProgression = calculateProgression;
exports.shouldProgressToNextMesocycle = shouldProgressToNextMesocycle;
var programNames_1 = require("../templates/programNames");
var warmupTemplates_1 = require("../templates/warmupTemplates");
var seededRandom_1 = require("../utils/seededRandom");
var exerciseSelector_1 = require("./exerciseSelector");
var constraints_1 = require("./constraints");
var substitutions_1 = require("./substitutions");
// =============================================================================
// WEEK BUILDER
// =============================================================================
/**
 * Build a single week of the mesocycle.
 */
function buildWeek(weekNumber, totalWeeks, config) {
    var _a;
    var input = config.input, split = config.split;
    var phase = (0, programNames_1.getCurrentPhase)(weekNumber, totalWeeks);
    var phaseInfo = programNames_1.PHASES[phase];
    // Get volume and intensity multipliers for this phase
    var volumeMultiplier = getVolumeMultiplier(phase);
    var intensityMultiplier = getIntensityMultiplier(phase);
    // Generate seed for this week
    var weekSeed = (0, seededRandom_1.generateWeeklySeed)(input.userId, config.startDate, weekNumber);
    var random = new seededRandom_1.SeededRandom(weekSeed);
    // Build constraint options
    var constraintOptions = {
        userEquipment: input.availableEquipment,
        limitations: input.physicalLimitations,
        experienceLevel: input.experienceLevel,
        excludedExercises: input.excludedExercises,
        preferredExercises: input.preferredExercises,
    };
    // Build each day
    var days = [];
    var dayOfWeek = 0;
    var workoutDayIndex = 0;
    for (var i = 0; i < 7; i++) {
        var isRestDay = split.restDayIndices.includes(i);
        if (isRestDay) {
            days.push({
                dayNumber: i + 1,
                name: 'Rest',
                isRestDay: true,
                coachNotes: getRestDayNote(phase, random),
            });
        }
        else {
            // Get the template for this workout day
            var dayTemplate = split.days[workoutDayIndex % split.days.length];
            // Select exercises for this day
            var dayResult = (0, exerciseSelector_1.selectAndPrescribeForDay)(dayTemplate, constraintOptions, {
                goal: mapGoalToFitnessGoal(input.fitnessGoal),
                experience: input.experienceLevel,
                phase: phase,
                sessionMinutes: input.sessionDurationMinutes,
                musclePriorities: input.musclePriorities,
                preferredExercises: input.preferredExercises,
                seed: weekSeed + i,
            });
            // Generate warmup based on target muscles
            var warmup = (0, warmupTemplates_1.generateWarmup)({
                targetMuscles: dayTemplate.primaryMuscles,
                sessionMinutes: input.sessionDurationMinutes,
                limitations: (_a = input.physicalLimitations) === null || _a === void 0 ? void 0 : _a.map(function (l) { return l.area; }),
            });
            days.push({
                dayNumber: i + 1,
                name: dayTemplate.name,
                isRestDay: false,
                focus: getFocusDescription(dayTemplate.primaryMuscles),
                targetMuscles: dayTemplate.primaryMuscles,
                warmup: warmup,
                exercises: dayResult.exercises,
                estimatedDurationMinutes: dayResult.estimatedDurationMinutes + warmup.estimatedMinutes,
                coachNotes: getWorkoutNote(phase, weekNumber, dayTemplate.name, random),
            });
            workoutDayIndex++;
        }
        dayOfWeek++;
    }
    return {
        weekNumber: weekNumber,
        phase: phase,
        days: days,
        volumeMultiplier: volumeMultiplier,
        intensityMultiplier: intensityMultiplier,
    };
}
// =============================================================================
// FULL MESOCYCLE BUILDER
// =============================================================================
/**
 * Build a complete 4-week mesocycle.
 */
function buildMesocycle(config) {
    return {
        week1: buildWeek(1, 4, config),
        week2: buildWeek(2, 4, config),
        week3: buildWeek(3, 4, config),
        week4: buildWeek(4, 4, config),
    };
}
/**
 * Calculate volume summary for the mesocycle.
 */
function calculateVolumeSummary(mesocycle) {
    var byMuscle = {};
    var totalSets = 0;
    var exerciseIds = new Set();
    // Calculate average weekly volume (use week 1-2 as representative)
    for (var _i = 0, _a = [mesocycle.week1, mesocycle.week2]; _i < _a.length; _i++) {
        var week = _a[_i];
        for (var _b = 0, _c = week.days; _b < _c.length; _b++) {
            var day = _c[_b];
            if (day.exercises) {
                for (var _d = 0, _e = day.exercises; _d < _e.length; _d++) {
                    var exercise = _e[_d];
                    totalSets += exercise.sets;
                    exerciseIds.add(exercise.exerciseId);
                    // Track by primary muscle (simplified - would need exercise lookup for accuracy)
                    // For now, use the muscleGroup field
                    var muscle = mapDisplayToMuscle(exercise.muscleGroup);
                    if (muscle) {
                        byMuscle[muscle] = (byMuscle[muscle] || 0) + exercise.sets;
                    }
                }
            }
        }
    }
    // Average across the 2 main training weeks
    for (var _f = 0, _g = Object.keys(byMuscle); _f < _g.length; _f++) {
        var muscle = _g[_f];
        byMuscle[muscle] = Math.round(byMuscle[muscle] / 2);
    }
    return {
        byMuscle: byMuscle,
        totalSets: Math.round(totalSets / 2), // Average weekly sets
        totalExercises: exerciseIds.size,
    };
}
/**
 * Generate substitution map for all exercises in the mesocycle.
 */
function generateSubstitutions(mesocycle, constraintOptions) {
    var substitutions = {};
    var exerciseIds = new Set();
    // Collect all exercise IDs
    for (var _i = 0, _a = [mesocycle.week1, mesocycle.week2, mesocycle.week3, mesocycle.week4]; _i < _a.length; _i++) {
        var week = _a[_i];
        for (var _b = 0, _c = week.days; _b < _c.length; _b++) {
            var day = _c[_b];
            if (day.exercises) {
                for (var _d = 0, _e = day.exercises; _d < _e.length; _d++) {
                    var exercise = _e[_d];
                    exerciseIds.add(exercise.exerciseId);
                }
            }
        }
    }
    // Find substitutes for each
    var available = (0, constraints_1.applyConstraints)(constraintOptions).available;
    for (var _f = 0, exerciseIds_1 = exerciseIds; _f < exerciseIds_1.length; _f++) {
        var exerciseId = exerciseIds_1[_f];
        var subs = (0, substitutions_1.findSubstitutes)(exerciseId, available, 3);
        if (subs.length > 0) {
            substitutions[exerciseId] = subs.map(function (s) { return s.id; });
        }
    }
    return substitutions;
}
// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function getVolumeMultiplier(phase) {
    switch (phase) {
        case 'accumulation': return 1.0;
        case 'intensification': return 1.1;
        case 'peak': return 0.9;
        case 'deload': return 0.5;
    }
}
function getIntensityMultiplier(phase) {
    switch (phase) {
        case 'accumulation': return 1.0;
        case 'intensification': return 1.05;
        case 'peak': return 1.1;
        case 'deload': return 0.7;
    }
}
function mapGoalToFitnessGoal(goal) {
    // Direct mapping since types should align
    return goal;
}
function getFocusDescription(muscles) {
    if (muscles.length === 0)
        return 'Full Body';
    var displayNames = {
        chest: 'Chest',
        lats: 'Back',
        upper_back: 'Back',
        front_delts: 'Shoulders',
        side_delts: 'Shoulders',
        rear_delts: 'Shoulders',
        quads: 'Quads',
        hamstrings: 'Hamstrings',
        glutes: 'Glutes',
        biceps: 'Biceps',
        triceps: 'Triceps',
        abs: 'Core',
        calves: 'Calves',
    };
    var unique = __spreadArray([], new Set(muscles.map(function (m) { return displayNames[m] || m; })), true);
    return unique.slice(0, 3).join(' & ');
}
function mapDisplayToMuscle(displayGroup) {
    var mapping = {
        'Chest': 'chest',
        'Back': 'lats',
        'Shoulders': 'front_delts',
        'Arms': 'biceps',
        'Legs': 'quads',
        'Core': 'abs',
    };
    return mapping[displayGroup] || null;
}
function getRestDayNote(phase, random) {
    var notes = {
        accumulation: [
            'Focus on recovery. Light stretching or a walk recommended.',
            'Rest day - perfect time for mobility work.',
            'Let your muscles recover. Stay hydrated!',
        ],
        intensification: [
            'Important recovery day before pushing harder.',
            'Rest well - intensity is increasing.',
            'Active recovery: light cardio or yoga.',
        ],
        peak: [
            'Critical rest before peak performance.',
            'Prioritize sleep and nutrition today.',
            'Full recovery day - you\'ve earned it.',
        ],
        deload: [
            'Extra rest during deload week.',
            'Enjoy the lighter week - recovery is training.',
            'Light activity only if desired.',
        ],
    };
    return random.pick(notes[phase]);
}
function getWorkoutNote(phase, weekNumber, dayName, random) {
    var notes = {
        accumulation: [
            'Focus on quality reps with good form.',
            'Building your base this week - consistency is key.',
            'Leave 2-3 reps in the tank on compound lifts.',
        ],
        intensification: [
            'Push a bit harder today - you\'re ready.',
            'Increase weight slightly from last week if form is solid.',
            'Challenge yourself - controlled aggression.',
        ],
        peak: [
            'Test your limits today - you\'ve prepared for this.',
            'Time to see what you\'re capable of.',
            'Push to your edge, but stay safe.',
        ],
        deload: [
            'Light and easy today - focus on movement quality.',
            'Reduced intensity this week - enjoy it.',
            'Recovery week: 60% effort, 100% form.',
        ],
    };
    return random.pick(notes[phase]);
}
// =============================================================================
// PROGRESSION UTILITIES
// =============================================================================
/**
 * Calculate recommended weight increase for next mesocycle.
 */
function calculateProgression(exerciseId, previousBestWeight, previousReps, goal) {
    // Simple linear progression
    var increase;
    var note;
    if (goal === 'strength') {
        // Strength: ~2.5-5% increase if hitting rep targets
        if (previousReps >= 5) {
            increase = previousBestWeight * 0.025;
            note = 'Great progress! Adding ~2.5% for next block.';
        }
        else {
            increase = 0;
            note = 'Keep working at this weight until you hit your rep target.';
        }
    }
    else {
        // Hypertrophy: ~2.5% increase if hitting top of rep range
        if (previousReps >= 10) {
            increase = previousBestWeight * 0.025;
            note = 'Ready to progress! Adding ~2.5% for next block.';
        }
        else {
            increase = 0;
            note = 'Stay at this weight and aim for the top of the rep range.';
        }
    }
    // Round to nearest 2.5 (standard plate increment)
    var rounded = Math.round(increase / 2.5) * 2.5;
    return {
        recommendedWeight: previousBestWeight + rounded,
        note: note,
    };
}
/**
 * Determine if user should proceed to next mesocycle or repeat.
 */
function shouldProgressToNextMesocycle(completionRate, averageRIR, injuryReported) {
    if (injuryReported) {
        return {
            shouldProgress: false,
            reason: 'Injury reported - consider a modified or recovery program.',
        };
    }
    if (completionRate < 0.7) {
        return {
            shouldProgress: false,
            reason: 'Completion rate below 70% - consider repeating this block or reducing volume.',
        };
    }
    if (averageRIR > 4) {
        return {
            shouldProgress: true,
            reason: 'Program may be too easy - consider increasing intensity next block.',
        };
    }
    if (averageRIR < 1) {
        return {
            shouldProgress: false,
            reason: 'Training too hard - consider a deload or reducing intensity.',
        };
    }
    return {
        shouldProgress: true,
        reason: 'Good progress! Ready for next mesocycle with progressive overload.',
    };
}
