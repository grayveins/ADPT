/**
 * useTargetCalculation Hook
 * 
 * Calculates TARGET suggestions for progressive overload.
 * Rule-based by default, can be overridden by AI coach.
 * 
 * Progression Logic:
 * - RIR 3-4 (easy): +5 lbs
 * - RIR 2 (moderate): +1 rep
 * - RIR 1 (hard): maintain
 * - RIR 0 (failed): -5 lbs
 * - No RIR data: +1 rep
 */

import { useMemo } from "react";

export type PreviousSetInfo = {
  weight: number;
  reps: number;
  rir?: number | null; // Reps in Reserve from last session
};

export type TargetResult = {
  weight: number;
  reps: number;
  source: "rule" | "ai";
  insight?: string;
};

// Calculate target based on previous performance and RIR
export function calculateTarget(
  previous: PreviousSetInfo | null,
  aiOverride?: TargetResult | null
): TargetResult | null {
  // If AI provides an override, use it
  if (aiOverride) {
    return {
      ...aiOverride,
      source: "ai",
    };
  }

  // If no previous data, can't calculate target
  if (!previous || previous.weight <= 0) {
    return null;
  }

  const { weight, reps, rir } = previous;

  // Rule-based progression
  let targetWeight = weight;
  let targetReps = reps;
  let insight: string | undefined;

  if (rir === null || rir === undefined) {
    // No RIR data - suggest +1 rep to be conservative
    targetReps = reps + 1;
    insight = `You hit ${weight}x${reps} last time. Try one more rep.`;
  } else if (rir >= 3) {
    // Easy (RIR 3-4) - increase weight by 5 lbs
    targetWeight = weight + 5;
    insight = `You hit ${weight}x${reps} easily last time. Try +5 lbs.`;
  } else if (rir === 2) {
    // Moderate (RIR 2) - increase reps by 1
    targetReps = reps + 1;
    insight = `Good effort at ${weight}x${reps}. Add one more rep.`;
  } else if (rir === 1) {
    // Hard (RIR 1) - maintain same weight and reps
    insight = `${weight}x${reps} was challenging. Match it again.`;
  } else {
    // Failed (RIR 0) - decrease weight slightly
    targetWeight = Math.max(weight - 5, 0);
    insight = `${weight}x${reps} was a grind. Drop 5 lbs to recover.`;
  }

  return {
    weight: targetWeight,
    reps: targetReps,
    source: "rule",
    insight,
  };
}

/**
 * Hook to calculate targets for all sets of an exercise
 */
export function useTargetCalculation(
  previousSets: PreviousSetInfo[],
  aiOverride?: TargetResult | null
): TargetResult | null {
  return useMemo(() => {
    // Use the first (or best) previous set for target calculation
    // In most cases, all working sets have similar weight/reps
    const firstWorkingSet = previousSets.find((s) => s.weight > 0);
    return calculateTarget(firstWorkingSet || null, aiOverride);
  }, [previousSets, aiOverride]);
}

/**
 * Calculate targets for each individual set
 * Useful if sets have different targets (pyramid, etc.)
 */
export function useTargetCalculationPerSet(
  previousSets: PreviousSetInfo[],
  aiOverrides?: (TargetResult | null)[]
): (TargetResult | null)[] {
  return useMemo(() => {
    return previousSets.map((prev, index) => {
      const aiOverride = aiOverrides?.[index];
      return calculateTarget(prev, aiOverride);
    });
  }, [previousSets, aiOverrides]);
}

export default useTargetCalculation;
