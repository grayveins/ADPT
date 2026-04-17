/**
 * Exercise-Level Rank System
 *
 * Each exercise gets its own rank (Beginner → Legend) based on the user's
 * weight lifted relative to bodyweight. Creates micro-goals per exercise:
 * "Your bench is Intermediate — 15 lbs to Advanced".
 *
 * Inspired by Liftoff's ranking system. Standards based on well-known
 * strength benchmarks (e.g., Symmetric Strength, ExRx).
 */

export type Sex = "male" | "female" | null;

export type ExerciseRank = {
  name: string;
  color: string;
  icon: string;
  image: any; // require() image source
  minMultiplier: number;
};

// ---------------------------------------------------------------------------
// Rank Badge Images
// ---------------------------------------------------------------------------

const EXERCISE_RANK_IMAGES = {
  beginner: require("@/assets/ranks/bronze.png"),
  intermediate: require("@/assets/ranks/silver.png"),
  advanced: require("@/assets/ranks/gold.png"),
  elite: require("@/assets/ranks/platinum.png"),
  legend: require("@/assets/ranks/evolved.png"),
};

// ---------------------------------------------------------------------------
// Rank Tiers
// ---------------------------------------------------------------------------

const RANK_TIERS: Omit<ExerciseRank, "minMultiplier">[] = [
  { name: "Beginner",     color: "#737373", icon: "shield-outline", image: EXERCISE_RANK_IMAGES.beginner },
  { name: "Intermediate", color: "#3B82F6", icon: "shield-half-outline", image: EXERCISE_RANK_IMAGES.intermediate },
  { name: "Advanced",     color: "#C0C0C0", icon: "shield", image: EXERCISE_RANK_IMAGES.advanced },
  { name: "Elite",        color: "#FFD700", icon: "diamond-outline", image: EXERCISE_RANK_IMAGES.elite },
  { name: "Legend",        color: "#FF6B35", icon: "flame", image: EXERCISE_RANK_IMAGES.legend },
];

// ---------------------------------------------------------------------------
// Multiplier Tables — [Beginner, Intermediate, Advanced, Elite, Legend]
// ---------------------------------------------------------------------------

type MultiplierRow = [number, number, number, number, number];

interface SexStandards {
  male: MultiplierRow;
  female: MultiplierRow;
}

const EXERCISE_STANDARDS: Record<string, SexStandards> = {
  // Compound barbell
  "bench press":       { male: [0.5,  0.75, 1.0,  1.25, 1.5],  female: [0.25, 0.5,  0.75, 1.0,  1.25] },
  "barbell bench press": { male: [0.5,  0.75, 1.0,  1.25, 1.5],  female: [0.25, 0.5,  0.75, 1.0,  1.25] },
  "incline bench press": { male: [0.4,  0.65, 0.85, 1.1,  1.35], female: [0.2,  0.4,  0.6,  0.85, 1.1]  },
  "squat":             { male: [0.75, 1.0,  1.5,  2.0,  2.5],  female: [0.5,  0.75, 1.0,  1.5,  2.0]  },
  "back squat":        { male: [0.75, 1.0,  1.5,  2.0,  2.5],  female: [0.5,  0.75, 1.0,  1.5,  2.0]  },
  "barbell squat":     { male: [0.75, 1.0,  1.5,  2.0,  2.5],  female: [0.5,  0.75, 1.0,  1.5,  2.0]  },
  "front squat":       { male: [0.6,  0.85, 1.25, 1.65, 2.0],  female: [0.4,  0.6,  0.85, 1.25, 1.65] },
  "deadlift":          { male: [1.0,  1.25, 1.75, 2.25, 2.75], female: [0.75, 1.0,  1.25, 1.75, 2.25] },
  "conventional deadlift": { male: [1.0,  1.25, 1.75, 2.25, 2.75], female: [0.75, 1.0,  1.25, 1.75, 2.25] },
  "sumo deadlift":     { male: [1.0,  1.25, 1.75, 2.25, 2.75], female: [0.75, 1.0,  1.25, 1.75, 2.25] },
  "romanian deadlift": { male: [0.65, 0.85, 1.15, 1.5,  1.85], female: [0.45, 0.65, 0.85, 1.15, 1.5]  },
  "overhead press":    { male: [0.35, 0.5,  0.75, 1.0,  1.25], female: [0.2,  0.35, 0.5,  0.65, 0.85] },
  "military press":    { male: [0.35, 0.5,  0.75, 1.0,  1.25], female: [0.2,  0.35, 0.5,  0.65, 0.85] },
  "barbell row":       { male: [0.5,  0.75, 1.0,  1.25, 1.5],  female: [0.3,  0.5,  0.65, 0.85, 1.1]  },
  "bent over row":     { male: [0.5,  0.75, 1.0,  1.25, 1.5],  female: [0.3,  0.5,  0.65, 0.85, 1.1]  },
  "pendlay row":       { male: [0.5,  0.75, 1.0,  1.25, 1.5],  female: [0.3,  0.5,  0.65, 0.85, 1.1]  },

  // Dumbbell
  "dumbbell bench press":  { male: [0.25, 0.4,  0.55, 0.7,  0.85], female: [0.15, 0.25, 0.4,  0.55, 0.7]  },
  "dumbbell shoulder press": { male: [0.2,  0.3,  0.4,  0.55, 0.7],  female: [0.12, 0.2,  0.3,  0.4,  0.55] },
  "dumbbell row":      { male: [0.25, 0.4,  0.55, 0.7,  0.85], female: [0.15, 0.25, 0.4,  0.55, 0.7]  },
  "dumbbell curl":     { male: [0.1,  0.2,  0.3,  0.4,  0.5],  female: [0.06, 0.12, 0.2,  0.28, 0.35] },

  // Legs
  "leg press":         { male: [1.5,  2.0,  3.0,  4.0,  5.0],  female: [1.0,  1.5,  2.0,  3.0,  4.0]  },
  "hip thrust":        { male: [0.75, 1.0,  1.5,  2.0,  2.5],  female: [0.5,  0.75, 1.25, 1.75, 2.25] },
  "bulgarian split squat": { male: [0.35, 0.5, 0.7, 0.9, 1.1], female: [0.2,  0.35, 0.5,  0.7,  0.9]  },
  "lunges":            { male: [0.35, 0.5,  0.7,  0.9,  1.1],  female: [0.2,  0.35, 0.5,  0.7,  0.9]  },
};

// Generic fallback for exercises not in the map
const GENERIC_STANDARDS: SexStandards = {
  male:   [0.25, 0.5, 0.75, 1.0, 1.25],
  female: [0.15, 0.3, 0.5,  0.75, 1.0],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStandards(exerciseName: string): SexStandards {
  const key = exerciseName.toLowerCase().trim();
  return EXERCISE_STANDARDS[key] || GENERIC_STANDARDS;
}

function getMultipliers(exerciseName: string, sex: Sex): MultiplierRow {
  const standards = getStandards(exerciseName);
  return sex === "female" ? standards.female : standards.male;
}

function buildRank(tierIndex: number, multiplier: number): ExerciseRank {
  const tier = RANK_TIERS[tierIndex];
  return { ...tier, minMultiplier: multiplier };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the current rank for a given exercise based on weight lifted
 * relative to bodyweight.
 */
export function getExerciseRank(
  exerciseName: string,
  weightLbs: number,
  bodyweightLbs: number,
  sex: Sex,
): ExerciseRank {
  // Edge case: no bodyweight data — return Beginner
  if (!bodyweightLbs || bodyweightLbs <= 0) {
    return buildRank(0, 0);
  }

  const multiplier = weightLbs / bodyweightLbs;
  const thresholds = getMultipliers(exerciseName, sex);

  // Walk backwards from Legend to find the highest achieved rank
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (multiplier >= thresholds[i]) {
      return buildRank(i, thresholds[i]);
    }
  }

  // Below all thresholds — still Beginner
  return buildRank(0, thresholds[0]);
}

/**
 * Returns the next rank and how many more pounds are needed to reach it.
 * Returns null if the user is already Legend.
 */
export function getNextExerciseRank(
  exerciseName: string,
  weightLbs: number,
  bodyweightLbs: number,
  sex: Sex,
): { rank: ExerciseRank; weightNeeded: number } | null {
  if (!bodyweightLbs || bodyweightLbs <= 0) {
    return null;
  }

  const multiplier = weightLbs / bodyweightLbs;
  const thresholds = getMultipliers(exerciseName, sex);

  // Find the first threshold above the current multiplier
  for (let i = 0; i < thresholds.length; i++) {
    if (multiplier < thresholds[i]) {
      const targetWeight = Math.ceil(thresholds[i] * bodyweightLbs);
      const needed = Math.max(targetWeight - weightLbs, 1);
      return {
        rank: buildRank(i, thresholds[i]),
        weightNeeded: needed,
      };
    }
  }

  // Already Legend
  return null;
}

/**
 * Returns all 5 rank tiers with their multipliers for a specific exercise
 * and sex. Useful for rendering a full rank ladder UI.
 */
export function getExerciseRankLadder(
  exerciseName: string,
  sex: Sex,
): ExerciseRank[] {
  const thresholds = getMultipliers(exerciseName, sex);
  return thresholds.map((mult, i) => buildRank(i, mult));
}
