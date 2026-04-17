"use strict";
/**
 * Program Naming System - Smart program names and phases
 *
 * Generates meaningful program names based on:
 * - User's name (if available)
 * - Training goal
 * - Split type
 * - Current phase of mesocycle
 *
 * Example outputs:
 * - "Troy's Strength Builder"
 * - "Foundation Phase - Week 2 of 4"
 * - "Hypertrophy Accumulation Block"
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
exports.PHASE_ICONS = exports.PHASE_COLORS = exports.PHASE_ORDER = exports.SPLIT_DESCRIPTORS = exports.EXPERIENCE_DESCRIPTORS = exports.GOAL_NAMES = exports.PHASES = void 0;
exports.getCurrentPhase = getCurrentPhase;
exports.generateProgramName = generateProgramName;
exports.generateProgramNameWithPhase = generateProgramNameWithPhase;
exports.getPhaseDisplayName = getPhaseDisplayName;
exports.getProgramSubtitle = getProgramSubtitle;
exports.getProgressionInfo = getProgressionInfo;
exports.validateProgramName = validateProgramName;
exports.suggestProgramNames = suggestProgramNames;
exports.PHASES = {
    accumulation: {
        id: 'accumulation',
        name: 'Accumulation',
        shortName: 'Build',
        description: 'Building base volume and work capacity',
        weekRange: [1, 2],
        icon: 'layers-outline',
        color: 'primary', // teal
    },
    intensification: {
        id: 'intensification',
        name: 'Intensification',
        shortName: 'Push',
        description: 'Increasing intensity and reducing volume',
        weekRange: [3, 3],
        icon: 'trending-up-outline',
        color: 'intensity', // orange
    },
    peak: {
        id: 'peak',
        name: 'Peak',
        shortName: 'Peak',
        description: 'Testing strength and pushing limits',
        weekRange: [4, 4], // Only in longer cycles
        icon: 'trophy-outline',
        color: 'gold',
    },
    deload: {
        id: 'deload',
        name: 'Deload',
        shortName: 'Recover',
        description: 'Active recovery and adaptation',
        weekRange: [4, 4],
        icon: 'leaf-outline',
        color: 'success', // sage green
    },
};
/**
 * Get the current phase based on week number.
 */
function getCurrentPhase(weekNumber, totalWeeks) {
    // Standard 4-week mesocycle: 2 accumulation, 1 intensification, 1 deload
    // 8-week: 3 accumulation, 2 intensification, 1 peak, 2 deload
    if (totalWeeks === void 0) { totalWeeks = 4; }
    if (totalWeeks <= 4) {
        if (weekNumber <= 2)
            return 'accumulation';
        if (weekNumber === 3)
            return 'intensification';
        return 'deload';
    }
    // Longer cycles
    var position = weekNumber / totalWeeks;
    if (position <= 0.375)
        return 'accumulation'; // First ~37.5%
    if (position <= 0.625)
        return 'intensification'; // Next ~25%
    if (position <= 0.75)
        return 'peak'; // Next ~12.5%
    return 'deload'; // Final ~25%
}
// =============================================================================
// PROGRAM NAME TEMPLATES
// =============================================================================
/**
 * Goal-based program name prefixes.
 */
exports.GOAL_NAMES = {
    hypertrophy: [
        'Muscle Builder',
        'Growth Phase',
        'Size & Strength',
        'Hypertrophy Program',
        'Mass Builder',
    ],
    strength: [
        'Strength Builder',
        'Power Program',
        'Strong Foundations',
        'Strength Focus',
        'Power Phase',
    ],
    general_fitness: [
        'Fitness Foundation',
        'Balanced Training',
        'Total Fitness',
        'Well-Rounded Program',
        'Complete Training',
    ],
    fat_loss: [
        'Lean & Strong',
        'Cut Phase',
        'Shred Program',
        'Fat Burning Focus',
        'Metabolic Training',
    ],
    athletic: [
        'Athletic Performance',
        'Sport Ready',
        'Performance Program',
        'Athletic Training',
        'Peak Performance',
    ],
};
/**
 * Experience-based descriptors.
 */
exports.EXPERIENCE_DESCRIPTORS = {
    beginner: ['Foundation', 'Starter', 'Intro', 'Beginner'],
    intermediate: ['Progressive', 'Builder', 'Growth', 'Development'],
    advanced: ['Advanced', 'Elite', 'Intensive', 'Expert'],
};
/**
 * Split-based name components.
 */
exports.SPLIT_DESCRIPTORS = {
    full_body_2x: 'Full Body',
    full_body_3x: 'Full Body',
    upper_lower_4x: 'Upper/Lower',
    ppl_5x: 'Push Pull Legs',
    ppl_6x: 'Push Pull Legs',
    bro_split_5x: 'Body Part Split',
};
// =============================================================================
// PROGRAM NAME GENERATORS
// =============================================================================
/**
 * Generate a personalized program name.
 *
 * @param options - Configuration for name generation
 * @returns A program name like "Troy's Strength Builder" or "Foundation Hypertrophy"
 */
function generateProgramName(options) {
    var firstName = options.firstName, _a = options.goal, goal = _a === void 0 ? 'general_fitness' : _a, _b = options.experience, experience = _b === void 0 ? 'intermediate' : _b, _c = options.includePersonalName, includePersonalName = _c === void 0 ? !!firstName : _c;
    // Get a goal-based name
    var goalNames = exports.GOAL_NAMES[goal];
    var goalName = goalNames[Math.floor(Math.random() * goalNames.length)];
    if (includePersonalName && firstName) {
        // "Troy's Strength Builder"
        var possessive = firstName.endsWith('s') ? "".concat(firstName, "'") : "".concat(firstName, "'s");
        return "".concat(possessive, " ").concat(goalName);
    }
    // Without personal name, use experience descriptor
    var expDescriptors = exports.EXPERIENCE_DESCRIPTORS[experience];
    var expDescriptor = expDescriptors[Math.floor(Math.random() * expDescriptors.length)];
    // "Progressive Strength Builder" or "Foundation Hypertrophy"
    return "".concat(expDescriptor, " ").concat(goalName);
}
/**
 * Generate a program name with phase information.
 *
 * @returns Something like "Hypertrophy - Accumulation Block"
 */
function generateProgramNameWithPhase(options) {
    var firstName = options.firstName, _a = options.goal, goal = _a === void 0 ? 'general_fitness' : _a, currentWeek = options.currentWeek, _b = options.totalWeeks, totalWeeks = _b === void 0 ? 4 : _b;
    var phase = getCurrentPhase(currentWeek, totalWeeks);
    var phaseInfo = exports.PHASES[phase];
    // Build the name
    var name;
    if (firstName) {
        var possessive = firstName.endsWith('s') ? "".concat(firstName, "'") : "".concat(firstName, "'s");
        name = "".concat(possessive, " ").concat(exports.GOAL_NAMES[goal][0]);
    }
    else {
        name = exports.GOAL_NAMES[goal][0];
    }
    return {
        name: name,
        phaseName: phaseInfo.name,
        phaseDescription: phaseInfo.description,
        weekDisplay: "Week ".concat(currentWeek, " of ").concat(totalWeeks),
    };
}
// =============================================================================
// PHASE-BASED PROGRAM NAMES
// =============================================================================
/**
 * Phase-specific program names for display.
 */
function getPhaseDisplayName(phase, goal) {
    if (goal === void 0) { goal = 'general_fitness'; }
    var goalShortNames = {
        hypertrophy: 'Hypertrophy',
        strength: 'Strength',
        general_fitness: 'Fitness',
        fat_loss: 'Lean',
        athletic: 'Athletic',
    };
    var goalShort = goalShortNames[goal];
    var phaseInfo = exports.PHASES[phase];
    return "".concat(goalShort, " ").concat(phaseInfo.name);
}
/**
 * Full program subtitle for UI display.
 * Example: "Week 2 - Building Volume"
 */
function getProgramSubtitle(currentWeek, totalWeeks) {
    if (totalWeeks === void 0) { totalWeeks = 4; }
    var phase = getCurrentPhase(currentWeek, totalWeeks);
    var phaseInfo = exports.PHASES[phase];
    return "Week ".concat(currentWeek, " - ").concat(phaseInfo.description);
}
/**
 * Get detailed progression information.
 */
function getProgressionInfo(currentWeek, totalWeeks) {
    if (totalWeeks === void 0) { totalWeeks = 4; }
    var currentPhase = getCurrentPhase(currentWeek, totalWeeks);
    var currentPhaseInfo = exports.PHASES[currentPhase];
    // Determine next phase
    var phases = ['accumulation', 'intensification', 'peak', 'deload'];
    var currentIndex = phases.indexOf(currentPhase);
    var nextPhase = currentIndex < phases.length - 1 ? phases[currentIndex + 1] : null;
    // Calculate weeks until next phase
    var weeksUntilNextPhase = 0;
    if (totalWeeks <= 4) {
        // Standard 4-week cycle
        if (currentPhase === 'accumulation')
            weeksUntilNextPhase = 3 - currentWeek;
        else if (currentPhase === 'intensification')
            weeksUntilNextPhase = 4 - currentWeek;
        else
            weeksUntilNextPhase = 0;
    }
    else {
        // Longer cycles - estimate
        var nextPhaseWeek = Math.ceil(totalWeeks * (currentIndex + 1) / 4);
        weeksUntilNextPhase = Math.max(0, nextPhaseWeek - currentWeek);
    }
    return {
        currentPhase: currentPhaseInfo,
        nextPhase: nextPhase ? exports.PHASES[nextPhase] : null,
        weeksUntilNextPhase: weeksUntilNextPhase,
        overallProgress: currentWeek / totalWeeks,
        phaseProgress: calculatePhaseProgress(currentWeek, totalWeeks, currentPhase),
    };
}
function calculatePhaseProgress(week, total, phase) {
    // Simplified - assumes equal phase lengths
    var phaseLengths = { accumulation: 2, intensification: 1, peak: 0, deload: 1 };
    var phaseStart = {
        accumulation: 1,
        intensification: 3,
        peak: total > 4 ? 4 : total,
        deload: total > 4 ? total - 1 : 4,
    };
    var start = phaseStart[phase];
    var length = phaseLengths[phase] || 1;
    return Math.min(1, (week - start + 1) / length);
}
// =============================================================================
// EDITABLE PROGRAM NAME HELPERS
// =============================================================================
/**
 * Validate a custom program name.
 */
function validateProgramName(name) {
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Program name cannot be empty' };
    }
    if (name.length > 50) {
        return { valid: false, error: 'Program name must be 50 characters or less' };
    }
    if (name.length < 3) {
        return { valid: false, error: 'Program name must be at least 3 characters' };
    }
    return { valid: true };
}
/**
 * Suggest program names based on user profile.
 */
function suggestProgramNames(options) {
    var firstName = options.firstName, _a = options.goal, goal = _a === void 0 ? 'general_fitness' : _a, _b = options.experience, experience = _b === void 0 ? 'intermediate' : _b, _c = options.count, count = _c === void 0 ? 5 : _c;
    var suggestions = [];
    var goalNames = exports.GOAL_NAMES[goal];
    var expDescriptors = exports.EXPERIENCE_DESCRIPTORS[experience];
    // Personal names
    if (firstName) {
        var possessive = firstName.endsWith('s') ? "".concat(firstName, "'") : "".concat(firstName, "'s");
        suggestions.push("".concat(possessive, " ").concat(goalNames[0]));
        suggestions.push("".concat(possessive, " Training Plan"));
        suggestions.push("".concat(possessive, " Fitness Journey"));
    }
    // Goal + experience combinations
    for (var _i = 0, _d = goalNames.slice(0, 3); _i < _d.length; _i++) {
        var goalName = _d[_i];
        for (var _e = 0, _f = expDescriptors.slice(0, 2); _e < _f.length; _e++) {
            var expDesc = _f[_e];
            suggestions.push("".concat(expDesc, " ").concat(goalName));
        }
    }
    // Simple goal names
    suggestions.push.apply(suggestions, goalNames);
    // Return unique suggestions
    return __spreadArray([], new Set(suggestions), true).slice(0, count);
}
// =============================================================================
// EXPORTS FOR UI
// =============================================================================
exports.PHASE_ORDER = ['accumulation', 'intensification', 'peak', 'deload'];
exports.PHASE_COLORS = {
    accumulation: '#00C9B7', // primary teal
    intensification: '#FF6B35', // intensity orange
    peak: '#FFD700', // gold
    deload: '#7FA07F', // sage green
};
exports.PHASE_ICONS = {
    accumulation: 'layers-outline',
    intensification: 'trending-up-outline',
    peak: 'trophy-outline',
    deload: 'leaf-outline',
};
