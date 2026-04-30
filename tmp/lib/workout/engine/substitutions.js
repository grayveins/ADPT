"use strict";
/**
 * Exercise Substitutions - Find alternatives for exercises
 *
 * This module handles:
 * 1. Finding similar exercises based on movement pattern and muscles
 * 2. Respecting equipment constraints
 * 3. Providing easier/harder variations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSimilarity = calculateSimilarity;
exports.findSubstitutes = findSubstitutes;
exports.findEasierVariation = findEasierVariation;
exports.findHarderVariation = findHarderVariation;
exports.findEquipmentAlternative = findEquipmentAlternative;
exports.findLimitationSafeAlternative = findLimitationSafeAlternative;
exports.findBatchSubstitutes = findBatchSubstitutes;
exports.getProgressionPath = getProgressionPath;
exports.suggestVarietySwaps = suggestVarietySwaps;
var library_1 = require("../exercises/library");
// =============================================================================
// SIMILARITY SCORING
// =============================================================================
/**
 * Calculate similarity score between two exercises.
 * Higher score = more similar.
 */
function calculateSimilarity(exerciseA, exerciseB) {
    var _a;
    if (exerciseA.id === exerciseB.id)
        return 0; // Don't suggest same exercise
    var score = 0;
    // Same movement pattern is critical
    if (exerciseA.movementPattern === exerciseB.movementPattern) {
        score += 50;
    }
    // Primary muscle overlap
    var primaryOverlap = exerciseA.primaryMuscles.filter(function (m) {
        return exerciseB.primaryMuscles.includes(m);
    }).length;
    score += primaryOverlap * 20;
    // Secondary muscle overlap
    var secondaryOverlap = exerciseA.secondaryMuscles.filter(function (m) {
        return exerciseB.secondaryMuscles.includes(m);
    }).length;
    score += secondaryOverlap * 5;
    // Same category (compound/isolation)
    if (exerciseA.category === exerciseB.category) {
        score += 15;
    }
    // Similar difficulty
    if (exerciseA.difficulty === exerciseB.difficulty) {
        score += 10;
    }
    // Similar rep ranges indicate similar training effect
    var repRangeOverlap = Math.min(exerciseA.repRangeMax, exerciseB.repRangeMax) -
        Math.max(exerciseA.repRangeMin, exerciseB.repRangeMin);
    if (repRangeOverlap > 0) {
        score += Math.min(10, repRangeOverlap);
    }
    // Explicit similar exercises declaration
    if ((_a = exerciseA.similarExercises) === null || _a === void 0 ? void 0 : _a.includes(exerciseB.id)) {
        score += 30;
    }
    // Same unilateral nature
    if (exerciseA.isUnilateral === exerciseB.isUnilateral) {
        score += 5;
    }
    return score;
}
// =============================================================================
// SUBSTITUTION FINDING
// =============================================================================
/**
 * Find substitute exercises for a given exercise ID.
 */
function findSubstitutes(exerciseId, availableExercises, maxCount) {
    if (maxCount === void 0) { maxCount = 3; }
    var target = library_1.EXERCISE_BY_ID[exerciseId];
    if (!target)
        return [];
    // Score all available exercises
    var scored = availableExercises
        .filter(function (ex) { return ex.id !== exerciseId; })
        .map(function (exercise) { return ({
        exercise: exercise,
        score: calculateSimilarity(target, exercise),
    }); })
        .filter(function (_a) {
        var score = _a.score;
        return score > 30;
    }) // Minimum similarity threshold
        .sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, maxCount).map(function (s) { return s.exercise; });
}
/**
 * Find an easier variation of an exercise.
 */
function findEasierVariation(exerciseId, availableExercises) {
    var target = library_1.EXERCISE_BY_ID[exerciseId];
    if (!target)
        return null;
    // First check explicit easier variation
    if (target.easierVariation) {
        var explicit = availableExercises.find(function (ex) { return ex.id === target.easierVariation; });
        if (explicit)
            return explicit;
    }
    // Otherwise find similar exercise with lower difficulty
    var difficultyOrder = ['beginner', 'intermediate', 'advanced'];
    var currentDiffIndex = difficultyOrder.indexOf(target.difficulty);
    if (currentDiffIndex <= 0)
        return null; // Already at easiest
    var candidates = availableExercises.filter(function (ex) {
        return ex.movementPattern === target.movementPattern &&
            ex.primaryMuscles.some(function (m) { return target.primaryMuscles.includes(m); }) &&
            difficultyOrder.indexOf(ex.difficulty) < currentDiffIndex;
    });
    if (candidates.length === 0)
        return null;
    // Return the most similar one
    var scored = candidates.map(function (ex) { return ({
        exercise: ex,
        score: calculateSimilarity(target, ex),
    }); });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored[0].exercise;
}
/**
 * Find a harder variation of an exercise.
 */
function findHarderVariation(exerciseId, availableExercises) {
    var target = library_1.EXERCISE_BY_ID[exerciseId];
    if (!target)
        return null;
    // First check explicit harder variation
    if (target.harderVariation) {
        var explicit = availableExercises.find(function (ex) { return ex.id === target.harderVariation; });
        if (explicit)
            return explicit;
    }
    // Otherwise find similar exercise with higher difficulty
    var difficultyOrder = ['beginner', 'intermediate', 'advanced'];
    var currentDiffIndex = difficultyOrder.indexOf(target.difficulty);
    if (currentDiffIndex >= difficultyOrder.length - 1)
        return null; // Already at hardest
    var candidates = availableExercises.filter(function (ex) {
        return ex.movementPattern === target.movementPattern &&
            ex.primaryMuscles.some(function (m) { return target.primaryMuscles.includes(m); }) &&
            difficultyOrder.indexOf(ex.difficulty) > currentDiffIndex;
    });
    if (candidates.length === 0)
        return null;
    // Return the most similar one
    var scored = candidates.map(function (ex) { return ({
        exercise: ex,
        score: calculateSimilarity(target, ex),
    }); });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored[0].exercise;
}
// =============================================================================
// SUBSTITUTION BY CONSTRAINT
// =============================================================================
/**
 * Find a substitute when user doesn't have required equipment.
 */
function findEquipmentAlternative(exerciseId, availableExercises) {
    var target = library_1.EXERCISE_BY_ID[exerciseId];
    if (!target)
        return null;
    // Find exercises with same pattern but different equipment
    var candidates = availableExercises.filter(function (ex) {
        return ex.id !== exerciseId &&
            ex.movementPattern === target.movementPattern &&
            ex.primaryMuscles.some(function (m) { return target.primaryMuscles.includes(m); });
    });
    if (candidates.length === 0)
        return null;
    // Prefer same category (compound/isolation)
    var sameCategory = candidates.filter(function (ex) { return ex.category === target.category; });
    var pool = sameCategory.length > 0 ? sameCategory : candidates;
    // Return the most similar one
    var scored = pool.map(function (ex) { return ({
        exercise: ex,
        score: calculateSimilarity(target, ex),
    }); });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored[0].exercise;
}
/**
 * Find a substitute for someone with a joint limitation.
 */
function findLimitationSafeAlternative(exerciseId, availableExercises, limitedJoint) {
    var target = library_1.EXERCISE_BY_ID[exerciseId];
    if (!target)
        return null;
    // Find exercises that don't stress the limited joint
    var candidates = availableExercises.filter(function (ex) {
        if (ex.id === exerciseId)
            return false;
        // Must target similar muscles
        if (!ex.primaryMuscles.some(function (m) { return target.primaryMuscles.includes(m); }))
            return false;
        // Must not stress the limited joint
        var stress = ex.jointStress[limitedJoint];
        if (stress === 'high' || stress === 'moderate')
            return false;
        return true;
    });
    if (candidates.length === 0)
        return null;
    // Return the most similar one
    var scored = candidates.map(function (ex) { return ({
        exercise: ex,
        score: calculateSimilarity(target, ex),
    }); });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored[0].exercise;
}
/**
 * Find substitutions for multiple exercises at once.
 */
function findBatchSubstitutes(exerciseIds, availableExercises, maxSubstitutesEach) {
    if (maxSubstitutesEach === void 0) { maxSubstitutesEach = 3; }
    var results = new Map();
    for (var _i = 0, exerciseIds_1 = exerciseIds; _i < exerciseIds_1.length; _i++) {
        var id = exerciseIds_1[_i];
        var original = library_1.EXERCISE_BY_ID[id];
        if (!original)
            continue;
        var substitutes = findSubstitutes(id, availableExercises, maxSubstitutesEach);
        results.set(id, {
            original: original,
            substitutes: substitutes,
        });
    }
    return results;
}
// =============================================================================
// VARIATION PROGRESSIONS
// =============================================================================
/**
 * Get a progression path for an exercise (easier → current → harder).
 */
function getProgressionPath(exerciseId, availableExercises) {
    var current = library_1.EXERCISE_BY_ID[exerciseId];
    if (!current)
        return null;
    return {
        easier: findEasierVariation(exerciseId, availableExercises),
        current: current,
        harder: findHarderVariation(exerciseId, availableExercises),
    };
}
/**
 * Suggest exercise swaps for variety in a new mesocycle.
 * Swaps out some exercises while maintaining balance.
 */
function suggestVarietySwaps(currentExerciseIds, availableExercises, swapPercentage) {
    if (swapPercentage === void 0) { swapPercentage = 0.3; }
    var swaps = new Map();
    var swapCount = Math.floor(currentExerciseIds.length * swapPercentage);
    // Group exercises by movement pattern
    var byPattern = new Map();
    for (var _i = 0, currentExerciseIds_1 = currentExerciseIds; _i < currentExerciseIds_1.length; _i++) {
        var id = currentExerciseIds_1[_i];
        var ex = library_1.EXERCISE_BY_ID[id];
        if (!ex)
            continue;
        var existing = byPattern.get(ex.movementPattern) || [];
        existing.push(id);
        byPattern.set(ex.movementPattern, existing);
    }
    // For each pattern, consider swapping one exercise
    var swapped = 0;
    for (var _a = 0, byPattern_1 = byPattern; _a < byPattern_1.length; _a++) {
        var _b = byPattern_1[_a], pattern = _b[0], ids = _b[1];
        if (swapped >= swapCount)
            break;
        if (ids.length === 0)
            continue;
        // Pick one to potentially swap
        var toSwap = ids[Math.floor(Math.random() * ids.length)];
        var subs = findSubstitutes(toSwap, availableExercises, 3);
        // Filter out any already in the current list
        var validSubs = subs.filter(function (s) { return !currentExerciseIds.includes(s.id); });
        if (validSubs.length > 0) {
            swaps.set(toSwap, validSubs[0]);
            swapped++;
        }
    }
    return swaps;
}
