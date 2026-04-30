"use strict";
/**
 * Muscle Mapping - Maps granular muscle groups to display categories
 *
 * The engine uses 19 specific muscle groups for precise targeting.
 * The UI displays simpler categories that users understand.
 * This file bridges the two for display purposes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MUSCLE_REGIONS = exports.MUSCLE_BODY_SIDE = exports.MUSCLE_IMAGE_MAP = exports.MUSCLE_DISPLAY_NAMES = exports.ALL_DISPLAY_GROUPS = exports.ALL_MUSCLE_GROUPS = exports.DISPLAY_TO_MUSCLES = exports.MUSCLE_TO_DISPLAY = void 0;
exports.musclesToDisplayGroups = musclesToDisplayGroups;
exports.displayGroupToMuscles = displayGroupToMuscles;
exports.getPrimaryBodySide = getPrimaryBodySide;
exports.getMuscleRegion = getMuscleRegion;
/**
 * Maps each granular muscle to its display category.
 */
exports.MUSCLE_TO_DISPLAY = {
    // Chest
    chest: 'Chest',
    // Shoulders (3 heads)
    front_delts: 'Shoulders',
    side_delts: 'Shoulders',
    rear_delts: 'Shoulders',
    // Back
    lats: 'Back',
    upper_back: 'Back',
    lower_back: 'Back',
    // Arms
    biceps: 'Arms',
    triceps: 'Arms',
    forearms: 'Arms',
    // Legs
    quads: 'Legs',
    hamstrings: 'Legs',
    glutes: 'Legs',
    adductors: 'Legs',
    abductors: 'Legs',
    calves: 'Legs',
    hip_flexors: 'Legs',
    // Core
    abs: 'Core',
    obliques: 'Core',
};
/**
 * Maps display categories to all granular muscles within them.
 */
exports.DISPLAY_TO_MUSCLES = {
    Chest: ['chest'],
    Shoulders: ['front_delts', 'side_delts', 'rear_delts'],
    Back: ['lats', 'upper_back', 'lower_back'],
    Arms: ['biceps', 'triceps', 'forearms'],
    Legs: ['quads', 'hamstrings', 'glutes', 'adductors', 'abductors', 'calves', 'hip_flexors'],
    Core: ['abs', 'obliques'],
    'Full Body': [], // Special category, not tied to specific muscles
    Cardio: [], // Special category, not tied to specific muscles
};
/**
 * All granular muscle groups (for iteration).
 */
exports.ALL_MUSCLE_GROUPS = [
    'chest',
    'front_delts',
    'side_delts',
    'rear_delts',
    'lats',
    'upper_back',
    'lower_back',
    'biceps',
    'triceps',
    'forearms',
    'quads',
    'hamstrings',
    'glutes',
    'adductors',
    'abductors',
    'calves',
    'hip_flexors',
    'abs',
    'obliques',
];
/**
 * All display muscle groups (for UI).
 */
exports.ALL_DISPLAY_GROUPS = [
    'Chest',
    'Back',
    'Shoulders',
    'Arms',
    'Legs',
    'Core',
    'Full Body',
    'Cardio',
];
/**
 * Get user-friendly display name for a granular muscle.
 */
exports.MUSCLE_DISPLAY_NAMES = {
    chest: 'Chest',
    front_delts: 'Front Delts',
    side_delts: 'Side Delts',
    rear_delts: 'Rear Delts',
    lats: 'Lats',
    upper_back: 'Upper Back',
    lower_back: 'Lower Back',
    biceps: 'Biceps',
    triceps: 'Triceps',
    forearms: 'Forearms',
    quads: 'Quads',
    hamstrings: 'Hamstrings',
    glutes: 'Glutes',
    adductors: 'Adductors',
    abductors: 'Abductors',
    calves: 'Calves',
    hip_flexors: 'Hip Flexors',
    abs: 'Abs',
    obliques: 'Obliques',
};
/**
 * Convert a list of granular muscles to their display categories (deduplicated).
 */
function musclesToDisplayGroups(muscles) {
    var displayGroups = new Set();
    for (var _i = 0, muscles_1 = muscles; _i < muscles_1.length; _i++) {
        var muscle = muscles_1[_i];
        displayGroups.add(exports.MUSCLE_TO_DISPLAY[muscle]);
    }
    return Array.from(displayGroups);
}
/**
 * Get all granular muscles for a display category.
 */
function displayGroupToMuscles(displayGroup) {
    return exports.DISPLAY_TO_MUSCLES[displayGroup] || [];
}
/**
 * Muscle image mapping for the new muscle visualization component.
 * Maps to assets in assets/muscles/ directory.
 */
exports.MUSCLE_IMAGE_MAP = {
    // Front view muscles
    chest: 'chest',
    abs: 'abs',
    quads: 'quads',
    biceps: 'biceps',
    front_delts: 'shoulders',
    side_delts: 'shoulders',
    obliques: 'obliques',
    // Back view muscles
    lats: 'lats',
    upper_back: 'upper-back',
    lower_back: 'lower-back',
    rear_delts: 'rear-delts',
    triceps: 'triceps',
    hamstrings: 'hamstrings',
    glutes: 'glutes',
    calves: 'calves',
    // Generic/shared
    forearms: 'forearms',
    adductors: 'adductors',
    abductors: 'glutes', // Often grouped visually
    hip_flexors: 'quads', // Often grouped visually
};
/**
 * Determine if a muscle is primarily on the front or back of the body.
 * Used for muscle visualization to show the correct body view.
 */
exports.MUSCLE_BODY_SIDE = {
    // Front
    chest: 'front',
    abs: 'front',
    quads: 'front',
    biceps: 'front',
    front_delts: 'front',
    hip_flexors: 'front',
    // Back
    lats: 'back',
    upper_back: 'back',
    lower_back: 'back',
    rear_delts: 'back',
    hamstrings: 'back',
    glutes: 'back',
    calves: 'back',
    // Both/Side
    side_delts: 'both',
    triceps: 'both',
    forearms: 'both',
    obliques: 'both',
    adductors: 'both',
    abductors: 'both',
};
/**
 * Get the primary body side to display for a set of muscles.
 */
function getPrimaryBodySide(muscles) {
    var frontCount = 0;
    var backCount = 0;
    for (var _i = 0, muscles_2 = muscles; _i < muscles_2.length; _i++) {
        var muscle = muscles_2[_i];
        var side = exports.MUSCLE_BODY_SIDE[muscle];
        if (side === 'front')
            frontCount++;
        else if (side === 'back')
            backCount++;
        // 'both' doesn't count toward either
    }
    return backCount > frontCount ? 'back' : 'front';
}
/**
 * Group muscles by body region for volume tracking.
 */
exports.MUSCLE_REGIONS = {
    upper_push: ['chest', 'front_delts', 'side_delts', 'triceps'],
    upper_pull: ['lats', 'upper_back', 'rear_delts', 'biceps'],
    lower: ['quads', 'hamstrings', 'glutes', 'adductors', 'abductors', 'calves', 'hip_flexors'],
    core: ['abs', 'obliques', 'lower_back'],
};
/**
 * Get which region a muscle belongs to.
 */
function getMuscleRegion(muscle) {
    for (var _i = 0, _a = Object.entries(exports.MUSCLE_REGIONS); _i < _a.length; _i++) {
        var _b = _a[_i], region = _b[0], muscles = _b[1];
        if (muscles.includes(muscle)) {
            return region;
        }
    }
    return 'other';
}
