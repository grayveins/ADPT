"use strict";
/**
 * Equipment Mapping - Maps user's onboarding equipment to engine equipment types
 *
 * Users select equipment during onboarding using user-friendly names.
 * The engine uses more granular equipment types for exercise filtering.
 * This file bridges the two.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EQUIPMENT_ICONS = exports.EQUIPMENT_DISPLAY_NAMES = exports.EQUIPMENT_BUNDLES = exports.USER_EQUIPMENT_TO_ENGINE = void 0;
exports.userEquipmentToEngine = userEquipmentToEngine;
exports.hasEquipment = hasEquipment;
exports.hasAllEquipment = hasAllEquipment;
exports.hasAnyEquipment = hasAnyEquipment;
exports.getMissingEquipment = getMissingEquipment;
exports.getDefaultEquipment = getDefaultEquipment;
/**
 * Maps a single user equipment selection to all engine equipment types it provides.
 * Some user equipment implies access to multiple engine equipment types.
 */
exports.USER_EQUIPMENT_TO_ENGINE = {
    // Barbell typically comes with standard and olympic plates
    barbell: ['barbell'],
    // Dumbbells - standard dumbbell work
    dumbbells: ['dumbbell'],
    // Cables - implies access to various cable attachments
    cables: ['cable'],
    // Generic machines (chest press, row machine, etc.)
    machines: ['machine'],
    // Pull-up bar - may be standalone or part of rack
    pull_up_bar: ['pull_up_bar'],
    // Kettlebells
    kettlebells: ['kettlebell'],
    // Resistance bands - versatile for many exercises
    resistance_bands: ['resistance_band'],
    // Bench - implies flat bench, may have incline/decline
    bench: ['bench', 'incline_bench', 'decline_bench'],
    // Squat rack - includes barbell work and J-hooks
    squat_rack: ['squat_rack', 'barbell'],
    // Leg press machine
    leg_press: ['leg_press'],
    // Lat pulldown machine/station
    lat_pulldown: ['lat_pulldown'],
    // Bodyweight only - no equipment needed
    bodyweight_only: ['bodyweight'],
};
/**
 * Common equipment bundles that users might have.
 * Useful for "gym type" presets.
 */
exports.EQUIPMENT_BUNDLES = {
    // Home gym basics
    home_minimal: ['bodyweight_only', 'resistance_bands'],
    // Home gym with dumbbells
    home_dumbbells: ['bodyweight_only', 'dumbbells', 'bench'],
    // Home gym with barbell
    home_barbell: ['bodyweight_only', 'barbell', 'squat_rack', 'bench', 'dumbbells'],
    // Standard commercial gym
    full_gym: [
        'barbell',
        'dumbbells',
        'cables',
        'machines',
        'pull_up_bar',
        'kettlebells',
        'bench',
        'squat_rack',
        'leg_press',
        'lat_pulldown',
    ],
    // Hotel gym / apartment gym
    hotel_gym: ['dumbbells', 'machines', 'cables'],
    // Outdoor / park
    outdoor: ['bodyweight_only', 'pull_up_bar'],
};
/**
 * Convert user equipment selections to engine equipment list.
 * Deduplicates and sorts the result.
 */
function userEquipmentToEngine(userEquipment) {
    var engineEquipment = new Set();
    // Always include bodyweight - everyone has their body
    engineEquipment.add('bodyweight');
    for (var _i = 0, userEquipment_1 = userEquipment; _i < userEquipment_1.length; _i++) {
        var item = userEquipment_1[_i];
        var mapped = exports.USER_EQUIPMENT_TO_ENGINE[item];
        if (mapped) {
            mapped.forEach(function (e) { return engineEquipment.add(e); });
        }
    }
    return Array.from(engineEquipment).sort();
}
/**
 * Check if a specific engine equipment type is available given user selections.
 */
function hasEquipment(userEquipment, required) {
    var available = userEquipmentToEngine(userEquipment);
    return available.includes(required);
}
/**
 * Check if ALL required equipment is available.
 */
function hasAllEquipment(userEquipment, required) {
    var available = userEquipmentToEngine(userEquipment);
    return required.every(function (eq) { return available.includes(eq); });
}
/**
 * Check if ANY of the required equipment is available.
 */
function hasAnyEquipment(userEquipment, required) {
    var available = userEquipmentToEngine(userEquipment);
    return required.some(function (eq) { return available.includes(eq); });
}
/**
 * Get equipment that the user is missing for a specific exercise.
 */
function getMissingEquipment(userEquipment, required) {
    var available = userEquipmentToEngine(userEquipment);
    return required.filter(function (eq) { return !available.includes(eq); });
}
/**
 * Infer a reasonable default equipment set when user hasn't specified.
 * Assumes a standard commercial gym setup.
 */
function getDefaultEquipment() {
    return exports.EQUIPMENT_BUNDLES.full_gym;
}
/**
 * Get user-friendly display name for equipment.
 */
exports.EQUIPMENT_DISPLAY_NAMES = {
    barbell: 'Barbell',
    dumbbells: 'Dumbbells',
    cables: 'Cables',
    machines: 'Machines',
    pull_up_bar: 'Pull-up Bar',
    kettlebells: 'Kettlebells',
    resistance_bands: 'Resistance Bands',
    bench: 'Bench',
    squat_rack: 'Squat Rack',
    leg_press: 'Leg Press',
    lat_pulldown: 'Lat Pulldown',
    bodyweight_only: 'Bodyweight Only',
};
/**
 * Get equipment icon name (for UI display with Ionicons or similar).
 */
exports.EQUIPMENT_ICONS = {
    barbell: 'barbell-outline',
    dumbbells: 'fitness-outline',
    cables: 'git-pull-request-outline',
    machines: 'hardware-chip-outline',
    pull_up_bar: 'remove-outline',
    kettlebells: 'flask-outline',
    resistance_bands: 'infinite-outline',
    bench: 'bed-outline',
    squat_rack: 'grid-outline',
    leg_press: 'footsteps-outline',
    lat_pulldown: 'arrow-down-outline',
    bodyweight_only: 'body-outline',
};
