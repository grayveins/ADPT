/**
 * Readiness Adapter
 *
 * Pure functions that modify workout parameters based on the daily
 * readiness score. Integrates with the workout generator to auto-adjust
 * volume, intensity (RIR), and rest times so the user trains optimally
 * relative to their recovery state.
 */

// =============================================================================
// TYPES
// =============================================================================

export type ReadinessLevel = "low" | "moderate" | "good" | "peak";

export type WorkoutAdjustment = {
  /** Volume scaling factor (0.6 = -40%, 1.2 = +20%) */
  volumeMultiplier: number;
  /** RIR adjustment: positive = easier, negative = harder */
  intensityAdjustment: number;
  /** Rest period scaling factor */
  restTimeMultiplier: number;
  /** Human-readable explanation for the user */
  suggestion: string;
  /** True if the session should be treated as a deload */
  shouldDeload: boolean;
};

export type MesocyclePhase =
  | "accumulation"
  | "intensification"
  | "deload"
  | "testing"
  | string;

// =============================================================================
// ADJUSTMENT RULES
// =============================================================================

const ADJUSTMENTS: Record<ReadinessLevel, Omit<WorkoutAdjustment, "suggestion" | "shouldDeload">> = {
  low: {
    volumeMultiplier: 0.6,
    intensityAdjustment: 2,
    restTimeMultiplier: 1.3,
  },
  moderate: {
    volumeMultiplier: 0.8,
    intensityAdjustment: 1,
    restTimeMultiplier: 1.15,
  },
  good: {
    volumeMultiplier: 1.0,
    intensityAdjustment: 0,
    restTimeMultiplier: 1.0,
  },
  peak: {
    volumeMultiplier: 1.1,
    intensityAdjustment: -1,
    restTimeMultiplier: 0.9,
  },
};

const SUGGESTIONS: Record<ReadinessLevel, string> = {
  low: "Your body needs recovery. Volume reduced 40%, intensity dialed back, and longer rests to protect gains.",
  moderate: "Slightly fatigued. Volume reduced 20% with an extra rep in reserve — still a productive session.",
  good: "Recovery looks solid. Training as programmed.",
  peak: "You're well recovered. Added 10% volume and pushing closer to failure — make it count.",
};

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Adjusts workout parameters based on the daily readiness score.
 *
 * @param readinessScore  - 0-100 readiness score
 * @param readinessLevel  - Categorical level derived from score
 * @param currentPhase    - Current mesocycle phase (accumulation, intensification, deload, etc.)
 * @returns WorkoutAdjustment with volume/intensity/rest multipliers and guidance
 */
export function adjustWorkoutForReadiness(
  readinessScore: number,
  readinessLevel: ReadinessLevel | string,
  currentPhase: MesocyclePhase = "accumulation",
): WorkoutAdjustment {
  const level = normalizeLevel(readinessLevel);

  // If already in a deload phase, don't reduce further — the program
  // has already prescribed lighter work. Only allow upward adjustments
  // if readiness is peak (user may want to do a bit more).
  if (currentPhase === "deload") {
    return {
      volumeMultiplier: level === "peak" ? 1.0 : 1.0,
      intensityAdjustment: level === "peak" ? 0 : 0,
      restTimeMultiplier: 1.0,
      suggestion: "Deload week — training light as programmed regardless of readiness.",
      shouldDeload: true,
    };
  }

  const base = ADJUSTMENTS[level];

  return {
    volumeMultiplier: base.volumeMultiplier,
    intensityAdjustment: base.intensityAdjustment,
    restTimeMultiplier: base.restTimeMultiplier,
    suggestion: SUGGESTIONS[level],
    shouldDeload: level === "low",
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Converts a score number to its categorical level.
 * Useful when only the numeric score is available.
 */
export function scoreToLevel(score: number): ReadinessLevel {
  if (score <= 30) return "low";
  if (score <= 55) return "moderate";
  if (score <= 75) return "good";
  return "peak";
}

/**
 * Applies volumeMultiplier to a set count, ensuring at least 1 set.
 */
export function adjustSetCount(baseSets: number, multiplier: number): number {
  return Math.max(1, Math.round(baseSets * multiplier));
}

/**
 * Applies restTimeMultiplier to a rest duration in seconds, clamped
 * between 30s and 300s (5 minutes).
 */
export function adjustRestTime(baseRestSeconds: number, multiplier: number): number {
  return Math.max(30, Math.min(300, Math.round(baseRestSeconds * multiplier)));
}

/**
 * Adjusts target RIR (reps in reserve) by the intensity offset.
 * A positive adjustment means more reps in reserve (easier).
 * Result is clamped between 0 and 5.
 */
export function adjustRIR(baseRIR: number, intensityAdjustment: number): number {
  return Math.max(0, Math.min(5, baseRIR + intensityAdjustment));
}

/**
 * Normalizes a string level to a valid ReadinessLevel.
 * Falls back to "good" for unknown values.
 */
function normalizeLevel(level: string): ReadinessLevel {
  const normalized = level.toLowerCase().trim();
  if (
    normalized === "low" ||
    normalized === "moderate" ||
    normalized === "good" ||
    normalized === "peak"
  ) {
    return normalized;
  }
  return "good";
}
