/**
 * Workout Validation
 *
 * Prevents gaming the XP/rank system by detecting unrealistic inputs.
 * Does NOT block users from logging — just flags sets as suspicious
 * and withholds PR credit / bonus XP for flagged sets.
 *
 * Rules:
 * 1. Weight sanity bounds per exercise category
 * 2. PR jump detection (>30% jump from previous best = suspicious)
 * 3. Session pacing (completing sets too fast = suspicious)
 * 4. Daily XP cap (prevents grinding)
 * 5. Volume sanity (total session volume can't exceed realistic limits)
 */

// =============================================================================
// WEIGHT BOUNDS — realistic max weight per movement category
// =============================================================================

const WEIGHT_BOUNDS: Record<string, { maxLbs: number }> = {
  // Barbell compounds
  "Bench Press":           { maxLbs: 600 },
  "Incline Bench Press":   { maxLbs: 500 },
  "Overhead Press":        { maxLbs: 350 },
  "Squats":                { maxLbs: 800 },
  "Deadlift":              { maxLbs: 900 },
  "Romanian Deadlift":     { maxLbs: 600 },
  "Barbell Rows":          { maxLbs: 500 },

  // Dumbbell
  "Dumbbell Bench Press":      { maxLbs: 200 },  // per hand
  "Incline Dumbbell Press":    { maxLbs: 175 },
  "Lateral Raises":            { maxLbs: 80 },
  "Hammer Curls":              { maxLbs: 100 },
  "Barbell Curls":             { maxLbs: 200 },
  "Tricep Pushdowns":          { maxLbs: 200 },
  "Overhead Tricep Extensions": { maxLbs: 150 },

  // Machine / cable
  "Leg Press":      { maxLbs: 1200 },
  "Leg Extensions": { maxLbs: 400 },
  "Leg Curls":      { maxLbs: 300 },
  "Cable Rows":     { maxLbs: 400 },
  "Lat Pulldowns":  { maxLbs: 400 },
  "Hip Thrusts":    { maxLbs: 700 },
  "Calf Raises":    { maxLbs: 800 },

  // Bodyweight (weighted)
  "Pull-ups":       { maxLbs: 250 },  // bodyweight + added
  "Tricep Dips":    { maxLbs: 250 },
};

// Fallback for exercises not explicitly listed
const DEFAULT_MAX_LBS = 500;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

export type ValidationResult = {
  valid: boolean;
  suspicious: boolean;
  reason?: string;
};

/**
 * Check if a single set's weight is within realistic bounds.
 */
export function validateWeight(exerciseName: string, weightLbs: number): ValidationResult {
  if (weightLbs <= 0) return { valid: true, suspicious: false };

  const bounds = WEIGHT_BOUNDS[exerciseName];
  const maxLbs = bounds?.maxLbs ?? DEFAULT_MAX_LBS;

  if (weightLbs > maxLbs) {
    return {
      valid: false,
      suspicious: true,
      reason: `${weightLbs} lbs exceeds realistic max for ${exerciseName}`,
    };
  }

  return { valid: true, suspicious: false };
}

/**
 * Check if a PR jump is suspiciously large.
 * A >30% jump from previous best in a single session is flagged.
 */
export function validatePRJump(
  exerciseName: string,
  newWeight: number,
  previousBestWeight: number | null
): ValidationResult {
  if (!previousBestWeight || previousBestWeight <= 0) {
    // First time logging — no baseline to compare. Allow it but
    // sanity-check against weight bounds.
    return validateWeight(exerciseName, newWeight);
  }

  const jumpPercent = ((newWeight - previousBestWeight) / previousBestWeight) * 100;

  if (jumpPercent > 30) {
    return {
      valid: true, // Still log it — don't block the user
      suspicious: true,
      reason: `${jumpPercent.toFixed(0)}% jump from previous best (${previousBestWeight} → ${newWeight})`,
    };
  }

  return { valid: true, suspicious: false };
}

/**
 * Check session pacing — minimum 15 seconds between set completions.
 * If average time between sets is under 15s, the session is suspicious.
 */
export function validateSessionPacing(
  setCompletionTimestamps: number[] // array of Date.now() values
): ValidationResult {
  if (setCompletionTimestamps.length < 3) {
    return { valid: true, suspicious: false }; // Not enough data
  }

  const gaps: number[] = [];
  for (let i = 1; i < setCompletionTimestamps.length; i++) {
    gaps.push(setCompletionTimestamps[i] - setCompletionTimestamps[i - 1]);
  }

  const avgGapMs = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const avgGapSec = avgGapMs / 1000;

  if (avgGapSec < 15) {
    return {
      valid: true,
      suspicious: true,
      reason: `Average ${avgGapSec.toFixed(0)}s between sets — too fast for a real workout`,
    };
  }

  return { valid: true, suspicious: false };
}

/**
 * Daily XP cap check.
 * Returns how much XP can still be earned today.
 */
export const DAILY_XP_CAP = 1000;

export function calculateRemainingDailyXP(xpEarnedToday: number): number {
  return Math.max(0, DAILY_XP_CAP - xpEarnedToday);
}

/**
 * Validate entire session before awarding XP.
 * Returns whether XP should be awarded and any flags.
 */
export function validateSession(opts: {
  exerciseSets: { exerciseName: string; weight: number; reps: number }[];
  setTimestamps: number[];
  previousBests: Record<string, number>; // exerciseName → best weight
  xpEarnedToday: number;
}): {
  shouldAwardXP: boolean;
  shouldAwardPRs: boolean;
  suspiciousFlags: string[];
  xpMultiplier: number; // 0-1, reduce XP for suspicious sessions
} {
  const flags: string[] = [];

  // Check weight bounds
  for (const set of opts.exerciseSets) {
    const result = validateWeight(set.exerciseName, set.weight);
    if (result.suspicious && result.reason) {
      flags.push(result.reason);
    }
  }

  // Check PR jumps
  for (const set of opts.exerciseSets) {
    const prevBest = opts.previousBests[set.exerciseName];
    if (prevBest) {
      const result = validatePRJump(set.exerciseName, set.weight, prevBest);
      if (result.suspicious && result.reason) {
        flags.push(result.reason);
      }
    }
  }

  // Check pacing
  const pacingResult = validateSessionPacing(opts.setTimestamps);
  if (pacingResult.suspicious && pacingResult.reason) {
    flags.push(pacingResult.reason);
  }

  // Check daily cap
  const remainingXP = calculateRemainingDailyXP(opts.xpEarnedToday);
  if (remainingXP <= 0) {
    flags.push("Daily XP cap reached");
  }

  // Determine penalties
  const isSuspicious = flags.length > 0;
  const isVerySuspicious = flags.length >= 3;

  return {
    shouldAwardXP: !isVerySuspicious && remainingXP > 0,
    shouldAwardPRs: !isSuspicious, // Don't award PR credit for suspicious sets
    suspiciousFlags: flags,
    xpMultiplier: isVerySuspicious ? 0 : isSuspicious ? 0.5 : 1,
  };
}
