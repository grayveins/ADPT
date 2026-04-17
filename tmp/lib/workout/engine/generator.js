"use strict";
/**
 * Workout Generator - Main Orchestrator
 *
 * This is the main entry point for generating workout programs.
 * It coordinates all the sub-modules to produce a complete mesocycle.
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
exports.generateProgram = generateProgram;
exports.generateSingleWorkout = generateSingleWorkout;
exports.canGenerateProgram = canGenerateProgram;
exports.previewProgram = previewProgram;
var splits_1 = require("../templates/splits");
var seededRandom_1 = require("../utils/seededRandom");
var mesocycleBuilder_1 = require("./mesocycleBuilder");
var constraints_1 = require("./constraints");
// =============================================================================
// MAIN GENERATOR FUNCTION
// =============================================================================
/**
 * Generate a complete workout program (4-week mesocycle).
 *
 * This is the main entry point for the workout generation engine.
 */
function generateProgram(input, options) {
    var _a;
    if (options === void 0) { options = {}; }
    var startTime = Date.now();
    // 1. Validate and normalize input
    var normalizedInput = normalizeInput(input);
    var warnings = [];
    // 2. Generate seed if not provided
    var seed = (_a = normalizedInput.seed) !== null && _a !== void 0 ? _a : (0, seededRandom_1.generateRandomSeed)();
    var random = new seededRandom_1.SeededRandom(seed);
    // 3. Select appropriate split
    var split = options.forceSplit
        ? (0, splits_1.mapUserPreferenceToSplit)(options.forceSplit, normalizedInput.daysPerWeek, normalizedInput.experienceLevel)
        : (0, splits_1.mapUserPreferenceToSplit)(normalizedInput.splitPreference, normalizedInput.daysPerWeek, normalizedInput.experienceLevel);
    // 4. Check equipment availability
    var constraintOptions = {
        userEquipment: normalizedInput.availableEquipment,
        limitations: normalizedInput.physicalLimitations,
        experienceLevel: normalizedInput.experienceLevel,
        excludedExercises: normalizedInput.excludedExercises,
        preferredExercises: normalizedInput.preferredExercises,
    };
    var constraintResult = (0, constraints_1.applyConstraints)(constraintOptions);
    warnings.push.apply(warnings, constraintResult.warnings);
    // Check if we have enough exercises for each pattern in the split
    var patternCounts = (0, constraints_1.getAvailableByPattern)(constraintOptions);
    for (var _i = 0, _b = split.days; _i < _b.length; _i++) {
        var day = _b[_i];
        for (var _c = 0, _d = day.movementPatterns; _c < _d.length; _c++) {
            var pattern = _d[_c];
            if ((patternCounts[pattern] || 0) < 2) {
                warnings.push("Limited ".concat(pattern.replace('_', ' '), " exercises available. Consider adding equipment."));
            }
        }
    }
    // 5. Build the mesocycle
    var config = {
        input: normalizedInput,
        split: split,
        startDate: new Date(),
    };
    var mesocycle = (0, mesocycleBuilder_1.buildMesocycle)(config);
    // 6. Calculate volume summary
    var volumeSummary = (0, mesocycleBuilder_1.calculateVolumeSummary)(mesocycle);
    // 7. Generate substitution map
    var substitutions = (0, mesocycleBuilder_1.generateSubstitutions)(mesocycle, constraintOptions);
    // 8. Generate safety flags
    var safetyFlags = generateSafetyFlags(normalizedInput, warnings);
    // 9. Generate rationale if requested
    var programRationale;
    if (options.generateRationale) {
        programRationale = generateRationale(normalizedInput, split, volumeSummary);
    }
    // 10. Build metadata
    var metadata = {
        seed: seed,
        generatedAt: new Date().toISOString(),
        planType: '4_week_mesocycle',
        split: split.id,
        engineVersion: '1.0.0',
    };
    var generationTime = Date.now() - startTime;
    console.log("[WorkoutGenerator] Generated program in ".concat(generationTime, "ms"));
    return {
        metadata: metadata,
        mesocycle: mesocycle,
        volumeSummary: volumeSummary,
        safetyFlags: safetyFlags,
        substitutions: substitutions,
        programRationale: programRationale,
    };
}
// =============================================================================
// SINGLE WORKOUT GENERATION
// =============================================================================
/**
 * Generate a single workout (for quick start or one-off sessions).
 */
function generateSingleWorkout(input) {
    // Map workout type to a day template
    var dayTemplates = {
        push: {
            name: 'Push',
            movementPatterns: ['horizontal_push', 'vertical_push', 'isolation_push', 'isolation_shoulder'],
            primaryMuscles: ['chest', 'front_delts', 'side_delts', 'triceps'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        pull: {
            name: 'Pull',
            movementPatterns: ['vertical_pull', 'horizontal_pull', 'isolation_pull', 'isolation_shoulder'],
            primaryMuscles: ['lats', 'upper_back', 'rear_delts', 'biceps'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        legs: {
            name: 'Legs',
            movementPatterns: ['squat', 'hinge', 'lunge', 'isolation_leg', 'core'],
            primaryMuscles: ['quads', 'glutes', 'hamstrings', 'calves', 'abs'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        upper: {
            name: 'Upper Body',
            movementPatterns: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull', 'isolation_pull'],
            primaryMuscles: ['chest', 'lats', 'front_delts', 'upper_back', 'biceps', 'triceps'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        lower: {
            name: 'Lower Body',
            movementPatterns: ['squat', 'hinge', 'lunge', 'isolation_leg', 'core'],
            primaryMuscles: ['quads', 'glutes', 'hamstrings', 'calves', 'abs'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
        full: {
            name: 'Full Body',
            movementPatterns: ['squat', 'horizontal_push', 'horizontal_pull', 'hinge', 'core'],
            primaryMuscles: ['quads', 'glutes', 'chest', 'lats', 'hamstrings', 'abs'],
            exerciseCount: { min: 5, max: 7 },
            compoundFirst: true,
        },
    };
    var dayTemplate = dayTemplates[input.workoutType];
    if (!dayTemplate)
        return null;
    // Use the mesocycle builder to generate a single day
    var fullInput = __assign(__assign({}, input), { daysPerWeek: 3 });
    var config = {
        input: fullInput,
        split: {
            id: 'single',
            name: 'Single Workout',
            daysPerWeek: 1,
            suitableFor: ['beginner', 'intermediate', 'advanced'],
            days: [dayTemplate],
            restDayIndices: [],
        },
        startDate: new Date(),
    };
    var mesocycle = (0, mesocycleBuilder_1.buildMesocycle)(config);
    // Return first workout day from week 1
    var workoutDay = mesocycle.week1.days.find(function (d) { return !d.isRestDay; });
    return workoutDay || null;
}
// =============================================================================
// INPUT NORMALIZATION
// =============================================================================
function normalizeInput(input) {
    var _a;
    return __assign(__assign({}, input), { 
        // Ensure equipment array exists and has defaults
        availableEquipment: ((_a = input.availableEquipment) === null || _a === void 0 ? void 0 : _a.length) > 0
            ? input.availableEquipment
            : getDefaultEquipment(), 
        // Ensure valid experience level
        experienceLevel: input.experienceLevel || 'intermediate', 
        // Ensure valid goal
        fitnessGoal: input.fitnessGoal || 'general_fitness', 
        // Ensure valid session duration
        sessionDurationMinutes: input.sessionDurationMinutes || 60, 
        // Default physical limitations to empty array
        physicalLimitations: input.physicalLimitations || [] });
}
function getDefaultEquipment() {
    // Assume full gym if not specified
    return [
        'barbell',
        'dumbbells',
        'cables',
        'machines',
        'pull_up_bar',
        'bench',
        'squat_rack',
        'leg_press',
        'lat_pulldown',
    ];
}
// =============================================================================
// SAFETY FLAGS
// =============================================================================
function generateSafetyFlags(input, existingWarnings) {
    var flags = __spreadArray([], existingWarnings, true);
    // Check for limitations
    if (input.physicalLimitations && input.physicalLimitations.length > 0) {
        var areas = input.physicalLimitations.map(function (l) { return l.area.replace('_', ' '); });
        flags.push("Program modified for ".concat(areas.join(', '), " limitations"));
        // Specific warnings for severe limitations
        var severe = input.physicalLimitations.filter(function (l) { return l.severity === 'severe'; });
        if (severe.length > 0) {
            flags.push('Consult a healthcare provider before starting this program');
        }
    }
    // Beginner warnings
    if (input.experienceLevel === 'beginner') {
        flags.push('Focus on learning proper form before increasing weight');
    }
    // High frequency warning
    if (input.daysPerWeek >= 6) {
        flags.push('High training frequency - ensure adequate sleep and nutrition');
    }
    return flags;
}
// =============================================================================
// RATIONALE GENERATION
// =============================================================================
function generateRationale(input, split, volume) {
    var parts = [];
    // Split selection
    parts.push("Selected ".concat(split.name, " split based on ").concat(input.daysPerWeek, " training days per week ") +
        "and ".concat(input.experienceLevel, " experience level."));
    // Goal alignment
    var goalDescriptions = {
        hypertrophy: 'muscle growth with moderate-high volume and 6-12 rep ranges',
        strength: 'maximal strength with lower reps (3-6) and longer rest periods',
        general_fitness: 'balanced training across strength, muscle, and conditioning',
        fat_loss: 'metabolic training with shorter rest periods and higher rep ranges',
        athletic: 'power and performance with varied rep ranges and movement patterns',
    };
    parts.push("Programming optimized for ".concat(goalDescriptions[input.fitnessGoal] || 'general fitness', "."));
    // Volume
    parts.push("Weekly volume targets approximately ".concat(volume.totalSets, " direct sets ") +
        "across ".concat(volume.totalExercises, " exercises."));
    // Phase structure
    parts.push('Program follows a 4-week mesocycle: 2 weeks accumulation (building volume), ' +
        '1 week intensification (pushing harder), 1 week deload (recovery).');
    // Limitations
    if (input.physicalLimitations && input.physicalLimitations.length > 0) {
        var areas = input.physicalLimitations.map(function (l) { return l.area.replace('_', ' '); });
        parts.push("Exercise selection modified to accommodate ".concat(areas.join(', '), " limitations."));
    }
    return parts.join(' ');
}
// =============================================================================
// UTILITY EXPORTS
// =============================================================================
/**
 * Quick check if generation is viable with given equipment.
 */
function canGenerateProgram(userEquipment, daysPerWeek) {
    var issues = [];
    var constraintResult = (0, constraints_1.applyConstraints)({ userEquipment: userEquipment });
    if (constraintResult.available.length < 20) {
        issues.push('Very limited exercise selection with current equipment');
    }
    var patterns = (0, constraints_1.getAvailableByPattern)({ userEquipment: userEquipment });
    // Check minimum patterns for common splits
    if (daysPerWeek >= 4) {
        if ((patterns['horizontal_push'] || 0) < 2) {
            issues.push('Need more push equipment (bench, dumbbells)');
        }
        if ((patterns['horizontal_pull'] || 0) < 2) {
            issues.push('Need more pull equipment (cables, dumbbells)');
        }
    }
    if ((patterns['squat'] || 0) < 2 && (patterns['lunge'] || 0) < 2) {
        issues.push('Need leg training equipment');
    }
    return {
        viable: issues.length === 0,
        issues: issues,
    };
}
/**
 * Get a preview of what would be generated without full generation.
 */
function previewProgram(input) {
    var split = (0, splits_1.mapUserPreferenceToSplit)(input.splitPreference, input.daysPerWeek, input.experienceLevel);
    return {
        splitName: split.name,
        daysPerWeek: split.daysPerWeek,
        exerciseCount: split.days.reduce(function (sum, d) { return sum + Math.round((d.exerciseCount.min + d.exerciseCount.max) / 2); }, 0),
        estimatedDuration: input.sessionDurationMinutes * split.daysPerWeek,
        phases: ['Accumulation (Week 1-2)', 'Intensification (Week 3)', 'Deload (Week 4)'],
    };
}
