/**
 * Coach Rationale Engine
 *
 * Generates human-readable explanations for workout programming decisions.
 * This is a key differentiator: no competitor explains WHY exercises,
 * weights, and programming were chosen for the user.
 */

// =============================================================================
// TYPES
// =============================================================================

export type RationaleType = "adaptation" | "progression" | "recovery" | "selection";

export type RationaleItem = {
  /** Ionicons icon name */
  icon: string;
  /** Short headline (3-6 words) */
  title: string;
  /** 1-2 sentence explanation */
  detail: string;
  /** Category for color-coding in the UI */
  type: RationaleType;
};

export interface RationaleInput {
  goal: string;
  experience: string;
  limitations: { area: string; severity: string }[];
  weekPhase: "accumulation" | "intensification" | "deload";
  weekNumber: number; // 1-4
  exerciseCount: number;
  excludedCount: number;
  totalVolume: number;
  previousVolume?: number;
}

// =============================================================================
// GOAL DESCRIPTORS
// =============================================================================

const GOAL_DETAILS: Record<string, { label: string; focus: string; repRange: string }> = {
  hypertrophy: {
    label: "muscle growth",
    focus: "moderate-heavy loads with higher volume",
    repRange: "8-12 reps",
  },
  strength: {
    label: "maximal strength",
    focus: "heavy compound lifts with longer rest",
    repRange: "3-6 reps",
  },
  general_fitness: {
    label: "balanced fitness",
    focus: "a mix of strength, endurance, and mobility",
    repRange: "6-15 reps",
  },
  fat_loss: {
    label: "fat loss",
    focus: "shorter rest and higher rep ranges to elevate metabolism",
    repRange: "10-15 reps",
  },
  athletic: {
    label: "athletic performance",
    focus: "explosive movements and varied rep ranges",
    repRange: "3-8 reps",
  },
};

// =============================================================================
// PHASE DESCRIPTORS
// =============================================================================

const PHASE_DETAILS: Record<string, { label: string; purpose: string; icon: string }> = {
  accumulation: {
    label: "Accumulation",
    purpose: "building work capacity and volume tolerance",
    icon: "trending-up-outline",
  },
  intensification: {
    label: "Intensification",
    purpose: "pushing closer to your limits with heavier loads",
    icon: "flame-outline",
  },
  deload: {
    label: "Deload",
    purpose: "active recovery so your body can adapt and grow",
    icon: "leaf-outline",
  },
};

// =============================================================================
// LIMITATION-AWARE EXERCISE SWAPS
// =============================================================================

const LIMITATION_SWAPS: Record<string, { avoided: string; substitution: string }> = {
  lower_back: {
    avoided: "heavy spinal loading movements",
    substitution: "machine and cable alternatives that reduce spinal stress",
  },
  shoulders: {
    avoided: "overhead pressing",
    substitution: "landmine press and lateral raises (safer angle)",
  },
  knees: {
    avoided: "deep squats and lunges",
    substitution: "leg press and hip-dominant movements",
  },
  wrists: {
    avoided: "barbell pressing",
    substitution: "dumbbell neutral-grip alternatives",
  },
  hips: {
    avoided: "wide-stance and deep hip flexion movements",
    substitution: "machine-based leg work with controlled range of motion",
  },
  elbows: {
    avoided: "heavy tricep extensions and close-grip pressing",
    substitution: "cable work with lighter loads and higher reps",
  },
  ankles: {
    avoided: "deep squats requiring ankle mobility",
    substitution: "elevated-heel squats and leg press",
  },
};

// =============================================================================
// MAIN GENERATOR
// =============================================================================

/**
 * Generate 2-4 rationale items explaining the workout programming decisions.
 * Prioritizes the most relevant explanations based on the user's context.
 */
export function generateWorkoutRationale(input: RationaleInput): RationaleItem[] {
  const items: RationaleItem[] = [];

  // Always include phase context -- users should understand where they are in the cycle
  items.push(generatePhaseRationale(input));

  // Limitation-aware rationale takes priority (safety first)
  if (input.limitations.length > 0) {
    items.push(...generateLimitationRationale(input));
  }

  // Progression rationale when we have previous volume to compare
  if (input.previousVolume != null && input.previousVolume > 0) {
    const progressionItem = generateProgressionRationale(input);
    if (progressionItem) {
      items.push(progressionItem);
    }
  }

  // Goal-based selection rationale
  items.push(generateSelectionRationale(input));

  // If excluded exercises are significant, explain
  if (input.excludedCount > 5) {
    items.push(generateExclusionRationale(input));
  }

  // Return the most relevant 2-4 items
  return items.slice(0, 4);
}

// =============================================================================
// INDIVIDUAL RATIONALE GENERATORS
// =============================================================================

function generatePhaseRationale(input: RationaleInput): RationaleItem {
  const phase = PHASE_DETAILS[input.weekPhase] || PHASE_DETAILS.accumulation;

  if (input.weekPhase === "deload") {
    return {
      icon: phase.icon,
      title: "Deload week",
      detail:
        "Volume reduced to ~60% this week. Your muscles grow during recovery, not during training. Trust the process.",
      type: "recovery",
    };
  }

  if (input.weekPhase === "intensification") {
    return {
      icon: phase.icon,
      title: "Time to push harder",
      detail: `Week ${input.weekNumber}: ${phase.label} phase. Weights go up, reps come down slightly. You've built the base — now challenge it.`,
      type: "progression",
    };
  }

  // Accumulation
  return {
    icon: phase.icon,
    title: "Building your base",
    detail: `Week ${input.weekNumber}: ${phase.label} phase — ${phase.purpose}. Consistency here drives long-term results.`,
    type: "progression",
  };
}

function generateLimitationRationale(input: RationaleInput): RationaleItem[] {
  const items: RationaleItem[] = [];

  for (const limitation of input.limitations) {
    const areaLabel = limitation.area.replace(/_/g, " ");
    const swap = LIMITATION_SWAPS[limitation.area];

    if (swap) {
      items.push({
        icon: "shield-checkmark-outline",
        title: `Adapted for your ${areaLabel}`,
        detail:
          limitation.severity === "severe"
            ? `Avoided ${swap.avoided} entirely and used ${swap.substitution}. Your safety is the priority.`
            : `Swapped ${swap.avoided} for ${swap.substitution} to reduce stress on your ${areaLabel}.`,
        type: "adaptation",
      });
    } else {
      items.push({
        icon: "shield-checkmark-outline",
        title: `Modified for ${areaLabel}`,
        detail: `Exercise selection adjusted to minimize stress on your ${areaLabel}. ${input.excludedCount} exercises were filtered out for safety.`,
        type: "adaptation",
      });
    }
  }

  // Only return the most important limitation (keep it concise)
  return items.slice(0, 1);
}

function generateProgressionRationale(input: RationaleInput): RationaleItem | null {
  if (input.previousVolume == null || input.previousVolume === 0) return null;

  const volumeChange = ((input.totalVolume - input.previousVolume) / input.previousVolume) * 100;
  const changeRounded = Math.abs(Math.round(volumeChange));

  if (input.weekPhase === "deload") {
    return {
      icon: "arrow-down-outline",
      title: "Strategic volume drop",
      detail: `Volume reduced ${changeRounded}% from last week. This planned deload lets your nervous system recover so you come back stronger.`,
      type: "recovery",
    };
  }

  if (volumeChange > 0) {
    return {
      icon: "arrow-up-outline",
      title: `Volume up ${changeRounded}%`,
      detail: `Progressive overload: total volume increased from last week. This gradual increase is how your body adapts and gets stronger.`,
      type: "progression",
    };
  }

  if (volumeChange < -5) {
    return {
      icon: "swap-horizontal-outline",
      title: "Volume adjusted down",
      detail: `Slightly less volume this session to balance weekly recovery. Not every session needs to be a PR — smart training wins.`,
      type: "recovery",
    };
  }

  return null;
}

function generateSelectionRationale(input: RationaleInput): RationaleItem {
  const goalInfo = GOAL_DETAILS[input.goal] || GOAL_DETAILS.general_fitness;

  const experienceNotes: Record<string, string> = {
    beginner:
      "Exercises chosen for straightforward technique — master these before progressing.",
    intermediate:
      "Mix of compound and isolation work to keep driving progress.",
    advanced:
      "Advanced exercise variations and higher training density for continued gains.",
  };

  const expNote = experienceNotes[input.experience] || experienceNotes.intermediate;

  return {
    icon: "bulb-outline",
    title: `Optimized for ${goalInfo.label}`,
    detail: `${input.exerciseCount} exercises focused on ${goalInfo.focus} (${goalInfo.repRange}). ${expNote}`,
    type: "selection",
  };
}

function generateExclusionRationale(input: RationaleInput): RationaleItem {
  return {
    icon: "funnel-outline",
    title: "Personalized selection",
    detail: `${input.excludedCount} exercises filtered out based on your equipment, limitations, and experience level. Every exercise in this workout was chosen specifically for you.`,
    type: "selection",
  };
}
