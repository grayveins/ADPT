"use strict";
/**
 * Exercise Selector - Smart exercise selection for workout generation
 *
 * This module handles:
 * 1. Selecting exercises for specific movement patterns
 * 2. Ensuring muscle balance across the workout
 * 3. Prioritizing compound exercises
 * 4. Respecting user preferences
 * 5. Adding variety while maintaining effectiveness
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreExercise = scoreExercise;
exports.selectExerciseForPattern = selectExerciseForPattern;
exports.selectExercisesForDay = selectExercisesForDay;
exports.prescribeExercise = prescribeExercise;
exports.selectAndPrescribeForDay = selectAndPrescribeForDay;
exports.getExercisesForMuscle = getExercisesForMuscle;
exports.hasVarietyForMuscle = hasVarietyForMuscle;
var muscleMap_1 = require("../exercises/muscleMap");
var seededRandom_1 = require("../utils/seededRandom");
var constraints_1 = require("./constraints");
// =============================================================================
// EXERCISE SCORING
// =============================================================================
/**
 * Score an exercise for selection. Higher score = more likely to be selected.
 */
function scoreExercise(exercise, config, context) {
    var score = 50; // Base score
    var goal = config.goal, experience = config.experience, musclePriorities = config.musclePriorities, preferredExercises = config.preferredExercises, random = config.random;
    var targetPattern = context.targetPattern, targetMuscles = context.targetMuscles, alreadySelected = context.alreadySelected, dayPosition = context.dayPosition;
    // 1. Movement pattern match (critical)
    if (exercise.movementPattern === targetPattern) {
        score += 30;
    }
    // 2. Primary muscle targeting
    var muscleHits = exercise.primaryMuscles.filter(function (m) { return targetMuscles.includes(m); }).length;
    score += muscleHits * 15;
    // 3. Compound vs isolation placement
    if (dayPosition < 3 && exercise.category === 'compound') {
        score += 20; // Prefer compounds early
    }
    else if (dayPosition >= 3 && exercise.category === 'isolation') {
        score += 15; // Prefer isolation later
    }
    // 4. Goal alignment
    if (goal === 'strength' && exercise.category === 'compound' && exercise.repRangeMin <= 5) {
        score += 15;
    }
    else if (goal === 'hypertrophy' && exercise.repRangeMax >= 10) {
        score += 10;
    }
    else if (goal === 'fat_loss' && exercise.canBeSuperset) {
        score += 10;
    }
    // 5. Experience appropriateness
    if (exercise.difficulty === experience) {
        score += 10;
    }
    else if (experience === 'beginner' && exercise.difficulty === 'beginner') {
        score += 15; // Extra bonus for beginners sticking to basics
    }
    // 6. User preferences
    if (preferredExercises === null || preferredExercises === void 0 ? void 0 : preferredExercises.includes(exercise.id)) {
        score += 25;
    }
    // 7. Muscle priorities
    if (musclePriorities) {
        var _loop_1 = function (prio) {
            var muscleMatch = exercise.primaryMuscles.some(function (m) {
                return m === prio.muscle || muscleMap_1.MUSCLE_TO_DISPLAY[m] === prio.muscle;
            });
            if (muscleMatch) {
                if (prio.priority === 'high')
                    score += 15;
                else if (prio.priority === 'low')
                    score -= 10;
            }
        };
        for (var _i = 0, musclePriorities_1 = musclePriorities; _i < musclePriorities_1.length; _i++) {
            var prio = musclePriorities_1[_i];
            _loop_1(prio);
        }
    }
    // 8. Avoid duplicates and similar exercises
    if (alreadySelected.has(exercise.id)) {
        score -= 100; // Heavily penalize duplicates
    }
    // Check for similar exercises already selected
    if (exercise.similarExercises) {
        var similarSelected = exercise.similarExercises.filter(function (id) { return alreadySelected.has(id); });
        score -= similarSelected.length * 15;
    }
    // 9. Equipment efficiency (prefer exercises that don't require setup changes)
    if (exercise.equipment.length === 1) {
        score += 5;
    }
    // 10. Small random factor for variety
    score += random.int(-5, 5);
    return Math.max(0, score);
}
// =============================================================================
// EXERCISE SELECTION
// =============================================================================
/**
 * Select an exercise for a specific movement pattern.
 */
function selectExerciseForPattern(pattern, targetMuscles, config, alreadySelected, dayPosition) {
    var candidates = config.availableExercises.filter(function (ex) {
        return ex.movementPattern === pattern;
    });
    if (candidates.length === 0) {
        // Fallback: find exercises that at least target the muscles
        var fallbacks = config.availableExercises.filter(function (ex) {
            return ex.primaryMuscles.some(function (m) { return targetMuscles.includes(m); });
        });
        if (fallbacks.length === 0)
            return null;
        return config.random.pick(fallbacks);
    }
    // Score all candidates
    var scored = candidates.map(function (exercise) { return ({
        exercise: exercise,
        score: scoreExercise(exercise, config, {
            targetPattern: pattern,
            targetMuscles: targetMuscles,
            alreadySelected: alreadySelected,
            dayPosition: dayPosition,
        }),
    }); });
    // Sort by score descending
    scored.sort(function (a, b) { return b.score - a.score; });
    // Pick from top candidates with some randomness
    var topCount = Math.min(3, scored.length);
    var topCandidates = scored.slice(0, topCount);
    // Weighted selection from top candidates
    var weights = topCandidates.map(function (c) { return Math.max(1, c.score); });
    return config.random.weightedPick(topCandidates.map(function (c) { return c.exercise; }), weights);
}
/**
 * Select exercises for a complete workout day.
 */
function selectExercisesForDay(dayTemplate, config, exerciseCount) {
    var selected = [];
    var selectedIds = new Set();
    // Determine exercise count within template bounds
    var count = Math.min(Math.max(exerciseCount, dayTemplate.exerciseCount.min), dayTemplate.exerciseCount.max);
    // First pass: select for each movement pattern
    for (var i = 0; i < dayTemplate.movementPatterns.length && selected.length < count; i++) {
        var pattern = dayTemplate.movementPatterns[i];
        var exercise = selectExerciseForPattern(pattern, dayTemplate.primaryMuscles, config, selectedIds, selected.length);
        if (exercise && !selectedIds.has(exercise.id)) {
            selected.push(exercise);
            selectedIds.add(exercise.id);
        }
    }
    var _loop_2 = function () {
        // Find muscles that need more work
        var musclesCovered = new Set();
        for (var _i = 0, selected_1 = selected; _i < selected_1.length; _i++) {
            var ex = selected_1[_i];
            ex.primaryMuscles.forEach(function (m) { return musclesCovered.add(m); });
        }
        var musclesNeeded = dayTemplate.primaryMuscles.filter(function (m) { return !musclesCovered.has(m); });
        var targetMuscles = musclesNeeded.length > 0 ? musclesNeeded : dayTemplate.primaryMuscles;
        // Find candidates that target needed muscles
        var candidates = config.availableExercises.filter(function (ex) {
            return !selectedIds.has(ex.id) &&
                ex.primaryMuscles.some(function (m) { return targetMuscles.includes(m); });
        });
        if (candidates.length === 0)
            return "break";
        // Score and select
        var scored = candidates.map(function (exercise) { return ({
            exercise: exercise,
            score: scoreExercise(exercise, config, {
                targetPattern: exercise.movementPattern,
                targetMuscles: targetMuscles,
                alreadySelected: selectedIds,
                dayPosition: selected.length,
            }),
        }); });
        scored.sort(function (a, b) { return b.score - a.score; });
        if (scored.length > 0) {
            var pick = scored[0].exercise;
            selected.push(pick);
            selectedIds.add(pick.id);
        }
        else {
            return "break";
        }
    };
    // Second pass: fill remaining slots with exercises targeting primary muscles
    while (selected.length < count) {
        var state_1 = _loop_2();
        if (state_1 === "break")
            break;
    }
    // Sort: compounds first if template requires it
    if (dayTemplate.compoundFirst) {
        selected.sort(function (a, b) {
            if (a.category === 'compound' && b.category !== 'compound')
                return -1;
            if (a.category !== 'compound' && b.category === 'compound')
                return 1;
            return 0;
        });
    }
    return selected;
}
// =============================================================================
// EXERCISE PRESCRIPTION
// =============================================================================
/**
 * Convert an Exercise to an ExercisePrescription with sets/reps/RIR.
 */
function prescribeExercise(exercise, options) {
    var goal = options.goal, phase = options.phase, position = options.position, isCompound = options.isCompound;
    // Determine sets based on goal and phase
    var sets;
    if (phase === 'deload') {
        sets = 2;
    }
    else if (goal === 'strength') {
        sets = isCompound ? (phase === 'peak' ? 5 : 4) : 3;
    }
    else if (goal === 'hypertrophy') {
        sets = isCompound ? 4 : 3;
    }
    else {
        sets = isCompound ? 3 : 3;
    }
    // Adjust sets for later exercises
    if (position >= 4)
        sets = Math.max(2, sets - 1);
    // Determine rep range based on goal and exercise type
    var reps;
    if (goal === 'strength' && isCompound) {
        reps = phase === 'peak' ? '2-4' : phase === 'accumulation' ? '4-6' : '3-5';
    }
    else if (goal === 'hypertrophy') {
        if (isCompound) {
            reps = '6-10';
        }
        else {
            reps = phase === 'accumulation' ? '10-15' : '8-12';
        }
    }
    else if (goal === 'fat_loss') {
        reps = isCompound ? '8-12' : '12-15';
    }
    else {
        reps = isCompound ? '6-10' : '10-12';
    }
    // Clamp to exercise's natural rep range
    // (This is a simplified clamp - a real implementation would parse the range)
    // Determine RIR based on phase
    var rirTarget;
    switch (phase) {
        case 'accumulation':
            rirTarget = isCompound ? 3 : 2;
            break;
        case 'intensification':
            rirTarget = isCompound ? 2 : 1;
            break;
        case 'peak':
            rirTarget = isCompound ? 1 : 1;
            break;
        case 'deload':
            rirTarget = 4;
            break;
    }
    // Rest time
    var restSeconds = exercise.defaultRestSeconds;
    if (goal === 'strength' && isCompound) {
        restSeconds = Math.max(restSeconds, 180);
    }
    else if (goal === 'fat_loss') {
        restSeconds = Math.min(restSeconds, 60);
    }
    // Intensity modifier for phase
    var intensityModifier;
    if (phase === 'deload') {
        intensityModifier = 0.6;
    }
    else if (phase === 'peak') {
        intensityModifier = 1.05;
    }
    return {
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: muscleMap_1.MUSCLE_TO_DISPLAY[exercise.primaryMuscles[0]] || 'Full Body',
        sets: sets,
        reps: reps,
        rirTarget: rirTarget,
        restSeconds: restSeconds,
        intensityModifier: intensityModifier,
        videoId: exercise.youtubeVideoId,
    };
}
/**
 * Select and prescribe exercises for a complete workout day.
 */
function selectAndPrescribeForDay(dayTemplate, constraintOptions, selectionOptions) {
    var random = new seededRandom_1.SeededRandom(selectionOptions.seed);
    var warnings = [];
    // Apply constraints
    var constraintResult = (0, constraints_1.applyConstraints)(constraintOptions);
    warnings.push.apply(warnings, constraintResult.warnings);
    // Calculate exercise count based on time
    // Rough estimate: 8-10 minutes per exercise (including rest)
    var baseExerciseCount = Math.floor(selectionOptions.sessionMinutes / 9);
    var exerciseCount = Math.min(Math.max(baseExerciseCount, dayTemplate.exerciseCount.min), dayTemplate.exerciseCount.max);
    // Create selection config
    var config = {
        availableExercises: constraintResult.available,
        goal: selectionOptions.goal,
        experience: selectionOptions.experience,
        musclePriorities: selectionOptions.musclePriorities,
        preferredExercises: selectionOptions.preferredExercises,
        random: random,
    };
    // Select exercises
    var selectedExercises = selectExercisesForDay(dayTemplate, config, exerciseCount);
    if (selectedExercises.length < dayTemplate.exerciseCount.min) {
        warnings.push("Only ".concat(selectedExercises.length, " exercises available for ").concat(dayTemplate.name, ". ") +
            "Consider adding equipment.");
    }
    // Convert to prescriptions
    var prescriptions = selectedExercises.map(function (exercise, index) {
        return prescribeExercise(exercise, {
            goal: selectionOptions.goal,
            phase: selectionOptions.phase,
            position: index,
            isCompound: exercise.category === 'compound',
        });
    });
    // Estimate duration
    var estimatedDurationMinutes = prescriptions.reduce(function (total, p) {
        var setsTime = p.sets * 1.5; // ~1.5 min per set including setup
        var restTime = (p.sets - 1) * (p.restSeconds / 60);
        return total + setsTime + restTime;
    }, 0);
    return {
        exercises: prescriptions,
        warnings: warnings,
        estimatedDurationMinutes: Math.round(estimatedDurationMinutes),
    };
}
// =============================================================================
// UTILITIES
// =============================================================================
/**
 * Get exercises sorted by priority for a muscle group.
 */
function getExercisesForMuscle(muscle, availableExercises, compoundsFirst) {
    if (compoundsFirst === void 0) { compoundsFirst = true; }
    var matching = availableExercises.filter(function (ex) {
        return ex.primaryMuscles.includes(muscle);
    });
    if (compoundsFirst) {
        matching.sort(function (a, b) {
            if (a.category === 'compound' && b.category !== 'compound')
                return -1;
            if (a.category !== 'compound' && b.category === 'compound')
                return 1;
            return 0;
        });
    }
    return matching;
}
/**
 * Check if we have enough variety for a specific muscle.
 */
function hasVarietyForMuscle(muscle, availableExercises, minCount) {
    if (minCount === void 0) { minCount = 3; }
    var count = availableExercises.filter(function (ex) {
        return ex.primaryMuscles.includes(muscle);
    }).length;
    return count >= minCount;
}
