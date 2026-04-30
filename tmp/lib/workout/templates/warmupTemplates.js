"use strict";
/**
 * Warmup Templates - Dynamic warm-up routines by body region
 *
 * Generates appropriate warm-ups based on:
 * - Target muscles for the workout
 * - User's limitations/injuries
 * - Session duration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FULL_BODY_WARMUP = exports.LOWER_BODY_WARMUP = exports.UPPER_BODY_WARMUP = exports.QUICK_WARMUP = void 0;
exports.generateWarmup = generateWarmup;
exports.getPresetWarmup = getPresetWarmup;
// General warmup exercises (full body)
var GENERAL_WARMUP = [
    {
        name: 'Light Cardio (bike/row/walk)',
        duration: '3-5 min',
        notes: 'Get heart rate up, break a light sweat',
        targetAreas: [],
        type: 'general',
    },
    {
        name: 'Jumping Jacks',
        reps: 20,
        targetAreas: [],
        type: 'general',
    },
    {
        name: 'High Knees',
        duration: '30 seconds',
        targetAreas: ['hip_flexors', 'quads'],
        type: 'general',
    },
    {
        name: 'Arm Circles',
        reps: 10,
        notes: 'Forward and backward',
        targetAreas: ['shoulder'],
        type: 'general',
    },
];
// Dynamic stretches by body region
var DYNAMIC_STRETCHES = [
    // Lower body
    {
        name: 'Leg Swings (front-back)',
        reps: 10,
        notes: 'Each leg',
        targetAreas: ['hip_flexors', 'hamstrings', 'hip'],
        type: 'dynamic',
    },
    {
        name: 'Leg Swings (side-side)',
        reps: 10,
        notes: 'Each leg',
        targetAreas: ['adductors', 'abductors', 'hip'],
        type: 'dynamic',
    },
    {
        name: 'Walking Lunges',
        reps: 8,
        notes: 'Each leg, bodyweight',
        targetAreas: ['quads', 'glutes', 'hip_flexors', 'hip'],
        type: 'dynamic',
    },
    {
        name: 'Inchworms',
        reps: 5,
        targetAreas: ['hamstrings', 'abs', 'shoulder'],
        type: 'dynamic',
    },
    {
        name: 'World\'s Greatest Stretch',
        reps: 5,
        notes: 'Each side',
        targetAreas: ['hip_flexors', 'hamstrings', 'upper_back', 'hip'],
        type: 'dynamic',
    },
    {
        name: 'Hip Circles',
        reps: 10,
        notes: 'Each direction',
        targetAreas: ['hip_flexors', 'glutes', 'hip'],
        type: 'dynamic',
    },
    {
        name: 'Bodyweight Squats',
        reps: 10,
        notes: 'Slow and controlled',
        targetAreas: ['quads', 'glutes', 'hip', 'knee'],
        type: 'dynamic',
    },
    // Upper body
    {
        name: 'Arm Circles',
        reps: 10,
        notes: 'Small to large, both directions',
        targetAreas: ['front_delts', 'side_delts', 'shoulder'],
        type: 'dynamic',
    },
    {
        name: 'Wall Slides',
        reps: 10,
        notes: 'Keep back and arms against wall',
        targetAreas: ['rear_delts', 'upper_back', 'shoulder'],
        type: 'dynamic',
    },
    {
        name: 'Band Pull-Aparts',
        reps: 15,
        notes: 'Light resistance',
        targetAreas: ['rear_delts', 'upper_back', 'shoulder'],
        type: 'dynamic',
    },
    {
        name: 'Cat-Cow Stretch',
        reps: 10,
        targetAreas: ['lower_back', 'abs', 'upper_back'],
        type: 'dynamic',
    },
    {
        name: 'Thread the Needle',
        reps: 5,
        notes: 'Each side',
        targetAreas: ['upper_back', 'shoulder'],
        type: 'dynamic',
    },
    {
        name: 'Scapular Push-ups',
        reps: 10,
        targetAreas: ['upper_back', 'chest', 'shoulder'],
        type: 'dynamic',
    },
];
// Activation exercises by muscle group
var ACTIVATION_EXERCISES = [
    // Glutes
    {
        name: 'Glute Bridges',
        reps: 15,
        notes: 'Squeeze at top',
        targetAreas: ['glutes', 'hamstrings'],
        type: 'activation',
    },
    {
        name: 'Clamshells',
        reps: 15,
        notes: 'Each side, with band if available',
        targetAreas: ['glutes', 'abductors'],
        type: 'activation',
    },
    {
        name: 'Fire Hydrants',
        reps: 10,
        notes: 'Each side',
        targetAreas: ['glutes', 'abductors', 'hip'],
        type: 'activation',
    },
    // Shoulders
    {
        name: 'Band External Rotations',
        reps: 15,
        notes: 'Each arm, light band',
        targetAreas: ['rear_delts', 'shoulder'],
        type: 'activation',
    },
    {
        name: 'Face Pulls (light)',
        reps: 15,
        notes: 'Very light weight, focus on squeeze',
        targetAreas: ['rear_delts', 'upper_back', 'shoulder'],
        type: 'activation',
    },
    {
        name: 'YTWL Raises',
        reps: 8,
        notes: 'Each position, no weight',
        targetAreas: ['rear_delts', 'upper_back', 'shoulder'],
        type: 'activation',
    },
    // Core
    {
        name: 'Dead Bugs',
        reps: 10,
        notes: 'Each side, slow',
        targetAreas: ['abs', 'hip_flexors'],
        type: 'activation',
    },
    {
        name: 'Bird Dogs',
        reps: 8,
        notes: 'Each side',
        targetAreas: ['abs', 'lower_back', 'glutes'],
        type: 'activation',
    },
    {
        name: 'Plank',
        duration: '30 seconds',
        targetAreas: ['abs', 'obliques'],
        type: 'activation',
    },
    // Lats
    {
        name: 'Straight Arm Pulldown (light)',
        reps: 15,
        notes: 'Very light, feel the lats',
        targetAreas: ['lats'],
        type: 'activation',
    },
];
// =============================================================================
// WARMUP GENERATOR
// =============================================================================
/**
 * Generate a warmup routine based on target muscles.
 */
function generateWarmup(options) {
    var targetMuscles = options.targetMuscles, sessionMinutes = options.sessionMinutes, _a = options.limitations, limitations = _a === void 0 ? [] : _a, _b = options.includeSpecificWarmup, includeSpecificWarmup = _b === void 0 ? true : _b;
    // Determine warmup duration (10-15% of session)
    var warmupMinutes = Math.min(15, Math.max(5, Math.round(sessionMinutes * 0.12)));
    var sections = [];
    // 1. General warmup (always include)
    sections.push({
        type: 'general',
        exercises: [
            {
                name: 'Light Cardio (bike/row/walk)',
                duration: '3-5 min',
                notes: 'Get heart rate up, break a light sweat',
            },
        ],
    });
    // 2. Dynamic stretches based on target areas
    var dynamicExercises = selectExercisesForMuscles(DYNAMIC_STRETCHES, targetMuscles, limitations, 3 // Max 3 dynamic stretches
    );
    if (dynamicExercises.length > 0) {
        sections.push({
            type: 'dynamic',
            exercises: dynamicExercises.map(toWarmupExercise),
        });
    }
    // 3. Activation exercises for primary movers
    var activationExercises = selectExercisesForMuscles(ACTIVATION_EXERCISES, targetMuscles, limitations, 2 // Max 2 activation exercises
    );
    if (activationExercises.length > 0) {
        sections.push({
            type: 'activation',
            exercises: activationExercises.map(toWarmupExercise),
        });
    }
    // 4. Specific warmup reminder (will be done with first exercise)
    if (includeSpecificWarmup) {
        sections.push({
            type: 'specific',
            exercises: [
                {
                    name: 'Warmup Sets',
                    sets: 2,
                    notes: '1-2 light sets of first exercise (50-70% working weight)',
                },
            ],
        });
    }
    return {
        estimatedMinutes: warmupMinutes,
        sections: sections,
    };
}
/**
 * Select exercises that target the given muscles while avoiding limitations.
 */
function selectExercisesForMuscles(exercises, targetMuscles, limitations, maxCount) {
    // Filter out exercises that stress limited joints
    var safe = exercises.filter(function (ex) {
        return !ex.targetAreas.some(function (area) { return limitations.includes(area); });
    });
    // Score exercises by how many target muscles they hit
    var scored = safe.map(function (ex) { return ({
        exercise: ex,
        score: ex.targetAreas.filter(function (area) {
            return targetMuscles.includes(area);
        }).length,
    }); });
    // Sort by score (highest first) and take top N
    scored.sort(function (a, b) { return b.score - a.score; });
    // Also include some general mobility even if not directly targeting muscles
    var selected = [];
    var selectedNames = new Set();
    for (var _i = 0, scored_1 = scored; _i < scored_1.length; _i++) {
        var _a = scored_1[_i], exercise = _a.exercise, score = _a.score;
        if (selected.length >= maxCount)
            break;
        if (selectedNames.has(exercise.name))
            continue;
        // Prioritize exercises that target our muscles
        if (score > 0 || selected.length < 1) {
            selected.push(exercise);
            selectedNames.add(exercise.name);
        }
    }
    return selected;
}
/**
 * Convert template to WarmupExercise.
 */
function toWarmupExercise(template) {
    return {
        name: template.name,
        duration: template.duration,
        reps: template.reps,
        sets: template.sets,
        notes: template.notes,
    };
}
// =============================================================================
// PRESET WARMUPS
// =============================================================================
/**
 * Quick warmup for time-constrained sessions.
 */
exports.QUICK_WARMUP = {
    estimatedMinutes: 5,
    sections: [
        {
            type: 'general',
            exercises: [
                { name: 'Jumping Jacks', reps: 30 },
                { name: 'Arm Circles', reps: 10, notes: 'Each direction' },
                { name: 'Leg Swings', reps: 10, notes: 'Each leg, front-back' },
                { name: 'Bodyweight Squats', reps: 10 },
            ],
        },
    ],
};
/**
 * Upper body focused warmup.
 */
exports.UPPER_BODY_WARMUP = {
    estimatedMinutes: 8,
    sections: [
        {
            type: 'general',
            exercises: [
                { name: 'Light Cardio', duration: '3 min' },
            ],
        },
        {
            type: 'dynamic',
            exercises: [
                { name: 'Arm Circles', reps: 10, notes: 'Small to large' },
                { name: 'Cat-Cow Stretch', reps: 10 },
                { name: 'Thread the Needle', reps: 5, notes: 'Each side' },
            ],
        },
        {
            type: 'activation',
            exercises: [
                { name: 'Band Pull-Aparts', reps: 15 },
                { name: 'Scapular Push-ups', reps: 10 },
            ],
        },
        {
            type: 'specific',
            exercises: [
                { name: 'Light warmup sets', sets: 2, notes: '50-70% of working weight' },
            ],
        },
    ],
};
/**
 * Lower body focused warmup.
 */
exports.LOWER_BODY_WARMUP = {
    estimatedMinutes: 10,
    sections: [
        {
            type: 'general',
            exercises: [
                { name: 'Light Cardio (bike preferred)', duration: '3-5 min' },
            ],
        },
        {
            type: 'dynamic',
            exercises: [
                { name: 'Leg Swings (front-back)', reps: 10, notes: 'Each leg' },
                { name: 'Leg Swings (side-side)', reps: 10, notes: 'Each leg' },
                { name: 'Walking Lunges', reps: 8, notes: 'Each leg' },
                { name: 'Bodyweight Squats', reps: 10 },
            ],
        },
        {
            type: 'activation',
            exercises: [
                { name: 'Glute Bridges', reps: 15, notes: 'Squeeze at top' },
                { name: 'Clamshells', reps: 15, notes: 'Each side' },
            ],
        },
        {
            type: 'specific',
            exercises: [
                { name: 'Empty Bar Squats/RDLs', sets: 2, reps: 10, notes: 'Just the bar' },
            ],
        },
    ],
};
/**
 * Full body warmup.
 */
exports.FULL_BODY_WARMUP = {
    estimatedMinutes: 10,
    sections: [
        {
            type: 'general',
            exercises: [
                { name: 'Light Cardio', duration: '3-5 min' },
            ],
        },
        {
            type: 'dynamic',
            exercises: [
                { name: 'World\'s Greatest Stretch', reps: 5, notes: 'Each side' },
                { name: 'Inchworms', reps: 5 },
                { name: 'Arm Circles', reps: 10, notes: 'Each direction' },
            ],
        },
        {
            type: 'activation',
            exercises: [
                { name: 'Dead Bugs', reps: 10, notes: 'Each side' },
                { name: 'Glute Bridges', reps: 15 },
            ],
        },
        {
            type: 'specific',
            exercises: [
                { name: 'Warmup sets', sets: 2, notes: 'First 2 exercises at 50-70%' },
            ],
        },
    ],
};
// =============================================================================
// WARMUP SELECTION
// =============================================================================
/**
 * Get appropriate preset warmup based on workout focus.
 */
function getPresetWarmup(workoutFocus) {
    switch (workoutFocus) {
        case 'upper':
        case 'push':
        case 'pull':
            return exports.UPPER_BODY_WARMUP;
        case 'lower':
        case 'legs':
            return exports.LOWER_BODY_WARMUP;
        case 'full':
        default:
            return exports.FULL_BODY_WARMUP;
    }
}
