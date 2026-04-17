"use strict";
/**
 * Split Templates - Pre-defined workout structures
 *
 * Defines common workout splits with their structure, target muscles per day,
 * and suitable experience levels.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPLIT_DISPLAY_NAMES = exports.ALL_SPLITS = exports.BRO_SPLIT_5X = exports.PPL_6X = exports.PPL_5X = exports.UPPER_LOWER_4X = exports.FULL_BODY_3X = exports.FULL_BODY_2X = void 0;
exports.getRecommendedSplit = getRecommendedSplit;
exports.getSplitsForExperience = getSplitsForExperience;
exports.getSplitById = getSplitById;
exports.mapUserPreferenceToSplit = mapUserPreferenceToSplit;
// =============================================================================
// FULL BODY SPLITS (2-3 days/week)
// =============================================================================
exports.FULL_BODY_2X = {
    id: 'full_body_2x',
    name: 'Full Body 2x',
    daysPerWeek: 2,
    suitableFor: ['beginner', 'intermediate'],
    days: [
        {
            name: 'Full Body A',
            movementPatterns: ['squat', 'horizontal_push', 'horizontal_pull', 'hinge', 'core'],
            primaryMuscles: ['quads', 'glutes', 'chest', 'lats', 'hamstrings', 'abs'],
            exerciseCount: { min: 5, max: 6 },
            compoundFirst: true,
        },
        {
            name: 'Full Body B',
            movementPatterns: ['hinge', 'vertical_push', 'vertical_pull', 'lunge', 'core'],
            primaryMuscles: ['hamstrings', 'glutes', 'front_delts', 'lats', 'quads', 'abs'],
            exerciseCount: { min: 5, max: 6 },
            compoundFirst: true,
        },
    ],
    restDayIndices: [1, 2, 4, 5, 6], // Mon, Wed workout; rest other days
};
exports.FULL_BODY_3X = {
    id: 'full_body_3x',
    name: 'Full Body 3x',
    daysPerWeek: 3,
    suitableFor: ['beginner', 'intermediate'],
    days: [
        {
            name: 'Full Body A',
            movementPatterns: ['squat', 'horizontal_push', 'horizontal_pull', 'isolation_pull', 'core'],
            primaryMuscles: ['quads', 'glutes', 'chest', 'lats', 'biceps', 'abs'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Full Body B',
            movementPatterns: ['hinge', 'vertical_push', 'vertical_pull', 'isolation_push', 'core'],
            primaryMuscles: ['hamstrings', 'glutes', 'front_delts', 'lats', 'triceps', 'abs'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Full Body C',
            movementPatterns: ['lunge', 'horizontal_push', 'horizontal_pull', 'isolation_shoulder', 'core'],
            primaryMuscles: ['quads', 'glutes', 'chest', 'upper_back', 'side_delts', 'abs'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
    ],
    restDayIndices: [1, 3, 5, 6], // Mon, Wed, Fri workout
};
// =============================================================================
// UPPER/LOWER SPLITS (4 days/week)
// =============================================================================
exports.UPPER_LOWER_4X = {
    id: 'upper_lower_4x',
    name: 'Upper/Lower 4x',
    daysPerWeek: 4,
    suitableFor: ['beginner', 'intermediate', 'advanced'],
    days: [
        {
            name: 'Upper A',
            movementPatterns: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'isolation_pull', 'isolation_push'],
            primaryMuscles: ['chest', 'lats', 'front_delts', 'biceps', 'triceps'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Lower A',
            movementPatterns: ['squat', 'hinge', 'lunge', 'isolation_leg', 'core'],
            primaryMuscles: ['quads', 'glutes', 'hamstrings', 'calves', 'abs'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Upper B',
            movementPatterns: ['vertical_pull', 'horizontal_push', 'horizontal_pull', 'isolation_shoulder', 'isolation_pull'],
            primaryMuscles: ['lats', 'chest', 'upper_back', 'side_delts', 'biceps'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Lower B',
            movementPatterns: ['hinge', 'squat', 'lunge', 'isolation_leg', 'core'],
            primaryMuscles: ['hamstrings', 'glutes', 'quads', 'calves', 'abs'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
    ],
    restDayIndices: [2, 5, 6], // Mon, Tue, Thu, Fri workout
};
// =============================================================================
// PUSH/PULL/LEGS SPLITS (5-6 days/week)
// =============================================================================
exports.PPL_5X = {
    id: 'ppl_5x',
    name: 'Push/Pull/Legs 5x',
    daysPerWeek: 5,
    suitableFor: ['intermediate', 'advanced'],
    days: [
        {
            name: 'Push',
            movementPatterns: ['horizontal_push', 'vertical_push', 'isolation_push', 'isolation_shoulder'],
            primaryMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Pull',
            movementPatterns: ['vertical_pull', 'horizontal_pull', 'isolation_pull', 'isolation_shoulder'],
            primaryMuscles: ['lats', 'upper_back', 'rear_delts', 'biceps'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Legs',
            movementPatterns: ['squat', 'hinge', 'lunge', 'isolation_leg', 'core'],
            primaryMuscles: ['quads', 'glutes', 'hamstrings', 'calves', 'abs'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Upper',
            movementPatterns: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull', 'isolation_pull'],
            primaryMuscles: ['chest', 'lats', 'front_delts', 'upper_back', 'biceps', 'triceps'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Lower',
            movementPatterns: ['hinge', 'squat', 'lunge', 'isolation_leg', 'core'],
            primaryMuscles: ['hamstrings', 'glutes', 'quads', 'calves', 'abs'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
    ],
    restDayIndices: [3, 6], // Rest on Wed and Sun
};
exports.PPL_6X = {
    id: 'ppl_6x',
    name: 'Push/Pull/Legs 6x',
    daysPerWeek: 6,
    suitableFor: ['intermediate', 'advanced'],
    days: [
        {
            name: 'Push A',
            movementPatterns: ['horizontal_push', 'vertical_push', 'isolation_push', 'isolation_shoulder'],
            primaryMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Pull A',
            movementPatterns: ['vertical_pull', 'horizontal_pull', 'isolation_pull', 'isolation_shoulder'],
            primaryMuscles: ['lats', 'upper_back', 'rear_delts', 'biceps'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Legs A',
            movementPatterns: ['squat', 'hinge', 'lunge', 'isolation_leg', 'core'],
            primaryMuscles: ['quads', 'glutes', 'hamstrings', 'calves', 'abs'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Push B',
            movementPatterns: ['vertical_push', 'horizontal_push', 'isolation_shoulder', 'isolation_push'],
            primaryMuscles: ['front_delts', 'chest', 'side_delts', 'triceps'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Pull B',
            movementPatterns: ['horizontal_pull', 'vertical_pull', 'isolation_shoulder', 'isolation_pull'],
            primaryMuscles: ['upper_back', 'lats', 'rear_delts', 'biceps'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Legs B',
            movementPatterns: ['hinge', 'squat', 'lunge', 'isolation_leg', 'core'],
            primaryMuscles: ['hamstrings', 'glutes', 'quads', 'calves', 'abs'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
    ],
    restDayIndices: [6], // Rest on Sunday only
};
// =============================================================================
// BRO SPLIT (5-6 days/week, single muscle focus)
// =============================================================================
exports.BRO_SPLIT_5X = {
    id: 'bro_split_5x',
    name: 'Bro Split 5x',
    daysPerWeek: 5,
    suitableFor: ['intermediate', 'advanced'],
    days: [
        {
            name: 'Chest',
            movementPatterns: ['horizontal_push', 'horizontal_push', 'horizontal_push'],
            primaryMuscles: ['chest'],
            exerciseCount: { min: 4, max: 6 },
            compoundFirst: true,
        },
        {
            name: 'Back',
            movementPatterns: ['vertical_pull', 'horizontal_pull', 'horizontal_pull'],
            primaryMuscles: ['lats', 'upper_back'],
            exerciseCount: { min: 4, max: 6 },
            compoundFirst: true,
        },
        {
            name: 'Shoulders',
            movementPatterns: ['vertical_push', 'isolation_shoulder', 'isolation_shoulder', 'isolation_shoulder'],
            primaryMuscles: ['front_delts', 'side_delts', 'rear_delts'],
            exerciseCount: { min: 4, max: 6 },
            compoundFirst: true,
        },
        {
            name: 'Legs',
            movementPatterns: ['squat', 'hinge', 'lunge', 'isolation_leg', 'isolation_leg'],
            primaryMuscles: ['quads', 'glutes', 'hamstrings', 'calves'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        {
            name: 'Arms',
            movementPatterns: ['isolation_pull', 'isolation_pull', 'isolation_push', 'isolation_push'],
            primaryMuscles: ['biceps', 'triceps', 'forearms'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: false,
        },
    ],
    restDayIndices: [3, 6], // Rest Wed and Sun
};
// =============================================================================
// ALL SPLITS
// =============================================================================
exports.ALL_SPLITS = [
    exports.FULL_BODY_2X,
    exports.FULL_BODY_3X,
    exports.UPPER_LOWER_4X,
    exports.PPL_5X,
    exports.PPL_6X,
    exports.BRO_SPLIT_5X,
];
// =============================================================================
// SPLIT SELECTION HELPERS
// =============================================================================
/**
 * Get recommended split based on days per week and experience.
 */
function getRecommendedSplit(daysPerWeek, experience) {
    // Filter by days
    var byDays = exports.ALL_SPLITS.filter(function (s) { return s.daysPerWeek === daysPerWeek; });
    if (byDays.length > 0) {
        // Prefer splits suitable for experience level
        var suitable = byDays.filter(function (s) { return s.suitableFor.includes(experience); });
        return suitable.length > 0 ? suitable[0] : byDays[0];
    }
    // Fallback: find closest match
    if (daysPerWeek <= 2)
        return exports.FULL_BODY_2X;
    if (daysPerWeek === 3)
        return exports.FULL_BODY_3X;
    if (daysPerWeek === 4)
        return exports.UPPER_LOWER_4X;
    if (daysPerWeek === 5)
        return experience === 'beginner' ? exports.PPL_5X : exports.BRO_SPLIT_5X;
    return exports.PPL_6X;
}
/**
 * Get all splits suitable for an experience level.
 */
function getSplitsForExperience(experience) {
    return exports.ALL_SPLITS.filter(function (s) { return s.suitableFor.includes(experience); });
}
/**
 * Get split by ID.
 */
function getSplitById(id) {
    return exports.ALL_SPLITS.find(function (s) { return s.id === id; });
}
/**
 * Map user split preference to a split template.
 * Accepts both generator types (push_pull_legs) and UI types (ppl).
 */
function mapUserPreferenceToSplit(preference, daysPerWeek, experience) {
    switch (preference) {
        case 'ppl':
        case 'push_pull_legs':
            return daysPerWeek >= 6 ? exports.PPL_6X : exports.PPL_5X;
        case 'upper_lower':
            return exports.UPPER_LOWER_4X;
        case 'full_body':
            return daysPerWeek >= 3 ? exports.FULL_BODY_3X : exports.FULL_BODY_2X;
        case 'bro_split':
            return exports.BRO_SPLIT_5X;
        case 'auto':
        default:
            return getRecommendedSplit(daysPerWeek, experience);
    }
}
/**
 * Get display name for split.
 */
exports.SPLIT_DISPLAY_NAMES = {
    full_body_2x: 'Full Body (2x/week)',
    full_body_3x: 'Full Body (3x/week)',
    upper_lower_4x: 'Upper/Lower (4x/week)',
    ppl_5x: 'Push/Pull/Legs (5x/week)',
    ppl_6x: 'Push/Pull/Legs (6x/week)',
    bro_split_5x: 'Bro Split (5x/week)',
};
