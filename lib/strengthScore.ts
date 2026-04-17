/**
 * ADPT Strength Score Algorithm
 *
 * Calculates a 0-999 score from the user's Big 4 lift PRs
 * relative to their bodyweight, adjusted for sex.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Sex = "male" | "female" | "other" | null;

export type StrengthScoreInput = {
  prs: Map<string, { max_weight_lbs: number; reps_at_max_weight: number }>;
  bodyweightLbs: number;
  sex: Sex;
};

export type LiftScore = {
  liftName: string;
  estimated1RM: number;
  ratio: number;
  points: number; // 0-250
};

export type MilestoneRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type MilestoneCategory = "first_steps" | "plate_club" | "relative_strength" | "total_club" | "score";

export type Milestone = {
  id: string;
  label: string;
  description: string;
  icon: string; // Ionicons name
  rarity: MilestoneRarity;
  category: MilestoneCategory;
  achieved: boolean;
  progress: number; // 0-1
  liftName?: string;
};

export type StrengthScoreResult = {
  totalScore: number; // 0-999
  percentile: number; // 0-99, estimated percentile among gym-goers
  big4Scores: LiftScore[];
  liftsUsed: number;
  liftsTotal: 4;
  milestones: Milestone[];
  nextMilestone: Milestone | null;
  latestMilestone: Milestone | null;
  achievedCount: number;
  missingBodyweight: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

export const BIG_4_EXERCISES = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
] as const;

type Big4Lift = (typeof BIG_4_EXERCISES)[number];

/** Maps common exercise name variants to their canonical Big 4 name */
const EXERCISE_ALIASES: Record<string, Big4Lift> = {
  "Bench Press": "Bench Press",
  "Barbell Bench Press": "Bench Press",
  "Flat Bench Press": "Bench Press",
  "Flat Barbell Bench Press": "Bench Press",
  "Squat": "Squat",
  "Back Squat": "Squat",
  "Barbell Back Squat": "Squat",
  "Barbell Squat": "Squat",
  "Deadlift": "Deadlift",
  "Barbell Deadlift": "Deadlift",
  "Conventional Deadlift": "Deadlift",
  "Overhead Press": "Overhead Press",
  "OHP": "Overhead Press",
  "Military Press": "Overhead Press",
  "Barbell Overhead Press": "Overhead Press",
  "Standing Overhead Press": "Overhead Press",
  "Shoulder Press": "Overhead Press",
  "Barbell Shoulder Press": "Overhead Press",
};

// Strength standard benchmarks: { ratio (1RM / bodyweight), points (0-250) }
type Benchmark = { ratio: number; points: number };

// Male standards
const MALE_STANDARDS: Record<Big4Lift, Benchmark[]> = {
  "Bench Press": [
    { ratio: 0.0, points: 0 },
    { ratio: 0.5, points: 50 },
    { ratio: 0.75, points: 125 },
    { ratio: 1.25, points: 200 },
    { ratio: 1.5, points: 230 },
    { ratio: 2.0, points: 250 },
  ],
  Squat: [
    { ratio: 0.0, points: 0 },
    { ratio: 0.75, points: 50 },
    { ratio: 1.0, points: 125 },
    { ratio: 1.5, points: 200 },
    { ratio: 2.0, points: 230 },
    { ratio: 2.75, points: 250 },
  ],
  Deadlift: [
    { ratio: 0.0, points: 0 },
    { ratio: 0.75, points: 50 },
    { ratio: 1.25, points: 125 },
    { ratio: 1.75, points: 200 },
    { ratio: 2.5, points: 230 },
    { ratio: 3.25, points: 250 },
  ],
  "Overhead Press": [
    { ratio: 0.0, points: 0 },
    { ratio: 0.35, points: 50 },
    { ratio: 0.5, points: 125 },
    { ratio: 0.75, points: 200 },
    { ratio: 1.0, points: 230 },
    { ratio: 1.4, points: 250 },
  ],
};

// Female standards (~60-65% of male ratios, same point mapping)
const FEMALE_STANDARDS: Record<Big4Lift, Benchmark[]> = {
  "Bench Press": [
    { ratio: 0.0, points: 0 },
    { ratio: 0.3, points: 50 },
    { ratio: 0.5, points: 125 },
    { ratio: 0.75, points: 200 },
    { ratio: 1.0, points: 230 },
    { ratio: 1.25, points: 250 },
  ],
  Squat: [
    { ratio: 0.0, points: 0 },
    { ratio: 0.5, points: 50 },
    { ratio: 0.75, points: 125 },
    { ratio: 1.0, points: 200 },
    { ratio: 1.5, points: 230 },
    { ratio: 2.0, points: 250 },
  ],
  Deadlift: [
    { ratio: 0.0, points: 0 },
    { ratio: 0.5, points: 50 },
    { ratio: 0.75, points: 125 },
    { ratio: 1.25, points: 200 },
    { ratio: 1.75, points: 230 },
    { ratio: 2.25, points: 250 },
  ],
  "Overhead Press": [
    { ratio: 0.0, points: 0 },
    { ratio: 0.2, points: 50 },
    { ratio: 0.35, points: 125 },
    { ratio: 0.5, points: 200 },
    { ratio: 0.65, points: 230 },
    { ratio: 0.9, points: 250 },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Epley formula for estimated 1RM (consistent with useStrengthHistory) */
function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Piecewise linear interpolation between benchmarks */
function interpolatePoints(ratio: number, benchmarks: Benchmark[]): number {
  if (ratio <= 0) return 0;

  for (let i = 1; i < benchmarks.length; i++) {
    const prev = benchmarks[i - 1];
    const curr = benchmarks[i];

    if (ratio <= curr.ratio) {
      const t = (ratio - prev.ratio) / (curr.ratio - prev.ratio);
      return prev.points + t * (curr.points - prev.points);
    }
  }

  // Beyond elite — cap at 250
  return 250;
}

/** Get the standards table for a given sex, averaging male/female for "other"/null */
function getStandards(sex: Sex): Record<Big4Lift, Benchmark[]> {
  if (sex === "male") return MALE_STANDARDS;
  if (sex === "female") return FEMALE_STANDARDS;

  // Average male and female benchmarks for "other" or null
  const averaged: Record<string, Benchmark[]> = {};
  for (const lift of BIG_4_EXERCISES) {
    averaged[lift] = MALE_STANDARDS[lift].map((m, i) => ({
      ratio: (m.ratio + FEMALE_STANDARDS[lift][i].ratio) / 2,
      points: m.points, // points are the same in both tables
    }));
  }
  return averaged as Record<Big4Lift, Benchmark[]>;
}

/** Resolve an exercise name to its Big 4 canonical name, or null */
function resolveBig4(exerciseName: string): Big4Lift | null {
  // Direct alias match
  const alias = EXERCISE_ALIASES[exerciseName];
  if (alias) return alias;

  // Case-insensitive fallback
  const lower = exerciseName.toLowerCase();
  for (const [key, value] of Object.entries(EXERCISE_ALIASES)) {
    if (key.toLowerCase() === lower) return value;
  }

  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function calculateStrengthScore(
  input: StrengthScoreInput
): StrengthScoreResult {
  const { prs, bodyweightLbs, sex } = input;
  const standards = getStandards(sex);
  const missingBodyweight = bodyweightLbs <= 0;
  const bw = missingBodyweight ? (sex === "female" ? 140 : 180) : bodyweightLbs;

  // Find the best PR for each Big 4 lift (user may have multiple aliases)
  const best1RM = new Map<Big4Lift, { e1rm: number; weight: number; reps: number }>();

  prs.forEach((pr, name) => {
    const canonical = resolveBig4(name);
    if (!canonical) return;

    const e1rm = estimate1RM(pr.max_weight_lbs, pr.reps_at_max_weight);
    const existing = best1RM.get(canonical);
    if (!existing || e1rm > existing.e1rm) {
      best1RM.set(canonical, {
        e1rm,
        weight: pr.max_weight_lbs,
        reps: pr.reps_at_max_weight,
      });
    }
  });

  // Score each Big 4 lift
  const big4Scores: LiftScore[] = [];
  let totalPoints = 0;
  let liftsUsed = 0;

  for (const lift of BIG_4_EXERCISES) {
    const data = best1RM.get(lift);
    if (!data) {
      big4Scores.push({
        liftName: lift,
        estimated1RM: 0,
        ratio: 0,
        points: 0,
      });
      continue;
    }

    const ratio = data.e1rm / bw;
    const points = interpolatePoints(ratio, standards[lift]);

    big4Scores.push({
      liftName: lift,
      estimated1RM: Math.round(data.e1rm),
      ratio: Math.round(ratio * 100) / 100,
      points: Math.round(points),
    });

    totalPoints += points;
    liftsUsed++;
  }

  // Scale proportionally for missing lifts
  let finalScore: number;
  if (liftsUsed === 0) {
    finalScore = 0;
  } else {
    finalScore = Math.round((totalPoints / liftsUsed) * 4);
    // Minimum 50 if any data exists
    finalScore = Math.max(50, finalScore);
  }

  // Cap at 999
  finalScore = Math.min(999, finalScore);

  // Calculate milestones
  const milestones = calculateMilestones(big4Scores, finalScore);
  const achieved = milestones.filter((m) => m.achieved);
  const unachieved = milestones.filter((m) => !m.achieved);

  // Next milestone = closest to completion among unachieved
  const nextMilestone = unachieved.length > 0
    ? unachieved.reduce((best, m) => (m.progress > best.progress ? m : best), unachieved[0])
    : null;

  return {
    totalScore: finalScore,
    percentile: estimatePercentile(finalScore),
    big4Scores,
    liftsUsed,
    liftsTotal: 4,
    milestones,
    nextMilestone,
    latestMilestone: achieved[achieved.length - 1] || null,
    achievedCount: achieved.length,
    missingBodyweight,
  };
}

// ─── Percentile ──────────────────────────────────────────────────────────────

/**
 * Estimates percentile among gym-going population based on ADPT score.
 *
 * Uses a sigmoid curve calibrated to strength standard distributions:
 * - Score ~200 (untrained)  → ~15th percentile of gym-goers
 * - Score ~400 (beginner)   → ~40th percentile
 * - Score ~600 (intermediate) → ~70th percentile
 * - Score ~800 (advanced)   → ~92nd percentile
 * - Score ~950 (elite)      → ~99th percentile
 *
 * The curve intentionally flatters early (endowed progress effect)
 * and compresses at the top (scarcity / aspiration).
 */
function estimatePercentile(score: number): number {
  if (score <= 0) return 0;

  // Sigmoid: percentile = 99 / (1 + e^(-k*(score - midpoint)))
  // Midpoint at 450, k tuned so 200→15, 600→70, 800→92
  const k = 0.0085;
  const midpoint = 450;
  const raw = 99 / (1 + Math.exp(-k * (score - midpoint)));

  // Floor to avoid showing "0%" for any real score, cap at 99
  return Math.max(1, Math.min(99, Math.round(raw)));
}

// ─── Milestones ──────────────────────────────────────────────────────────────

/** Rarity colors — mapped in UI, defined here for reference:
 *  common:    success  (#7FA07F)  — most lifters hit these within months
 *  uncommon:  primary  (#3B82F6)  — consistent training required
 *  rare:      info     (#60A5FA)  — intermediate to advanced
 *  epic:      intensity (#FF6B35) — advanced lifters
 *  legendary: gold     (#FFD700)  — elite achievement
 */

export const RARITY_ORDER: MilestoneRarity[] = [
  "common", "uncommon", "rare", "epic", "legendary",
];

export const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  first_steps: "First Steps",
  plate_club: "Plate Club",
  relative_strength: "Relative Strength",
  total_club: "Total Club",
  score: "Score",
};

export const CATEGORY_ORDER: MilestoneCategory[] = [
  "first_steps", "plate_club", "relative_strength", "total_club", "score",
];

type MilestoneDef = {
  id: string;
  label: string;
  description: string;
  icon: string;
  rarity: MilestoneRarity;
  category: MilestoneCategory;
  liftName?: string;
  check: (scores: LiftScore[], totalScore: number) => boolean;
  getProgress: (scores: LiftScore[], totalScore: number) => number;
};

// ─── Helpers for milestone definitions ───────────────────────────────────────

function liftRatio(scores: LiftScore[], lift: string): number {
  return scores.find((l) => l.liftName === lift)?.ratio ?? 0;
}

function lift1RM(scores: LiftScore[], lift: string): number {
  return scores.find((l) => l.liftName === lift)?.estimated1RM ?? 0;
}

function big3Total(scores: LiftScore[]): number {
  return scores
    .filter((s) => s.liftName !== "Overhead Press")
    .reduce((sum, s) => sum + s.estimated1RM, 0);
}

function liftsWithData(scores: LiftScore[]): number {
  return scores.filter((s) => s.estimated1RM > 0).length;
}

/** Clamp progress to 0-1 */
function prog(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(1, Math.max(0, current / target));
}

// ─── Milestone Definitions ───────────────────────────────────────────────────

const MILESTONE_DEFS: MilestoneDef[] = [
  // ── First Steps ──────────────────────────────────────────────────────────
  {
    id: "first_pr",
    label: "First Blood",
    description: "Log your first Big 4 lift",
    icon: "flash",
    rarity: "common",
    category: "first_steps",
    check: (s) => liftsWithData(s) >= 1,
    getProgress: (s) => prog(liftsWithData(s), 1),
  },
  {
    id: "all_four",
    label: "Well Rounded",
    description: "Have PRs in all 4 lifts",
    icon: "apps",
    rarity: "common",
    category: "first_steps",
    check: (s) => liftsWithData(s) >= 4,
    getProgress: (s) => prog(liftsWithData(s), 4),
  },

  // ── Plate Club (45 lb plates per side) ───────────────────────────────────
  {
    id: "plate_1_bench",
    label: "One Plate Bench",
    description: "Bench 135 lbs (1 plate per side)",
    icon: "barbell",
    rarity: "common",
    category: "plate_club",
    liftName: "Bench Press",
    check: (s) => lift1RM(s, "Bench Press") >= 135,
    getProgress: (s) => prog(lift1RM(s, "Bench Press"), 135),
  },
  {
    id: "plate_1_ohp",
    label: "One Plate OHP",
    description: "Overhead press 135 lbs",
    icon: "arrow-up",
    rarity: "uncommon",
    category: "plate_club",
    liftName: "Overhead Press",
    check: (s) => lift1RM(s, "Overhead Press") >= 135,
    getProgress: (s) => prog(lift1RM(s, "Overhead Press"), 135),
  },
  {
    id: "plate_2_squat",
    label: "Two Plate Squat",
    description: "Squat 225 lbs (2 plates per side)",
    icon: "barbell",
    rarity: "common",
    category: "plate_club",
    liftName: "Squat",
    check: (s) => lift1RM(s, "Squat") >= 225,
    getProgress: (s) => prog(lift1RM(s, "Squat"), 225),
  },
  {
    id: "plate_2_bench",
    label: "Two Plate Bench",
    description: "Bench 225 lbs (2 plates per side)",
    icon: "barbell",
    rarity: "uncommon",
    category: "plate_club",
    liftName: "Bench Press",
    check: (s) => lift1RM(s, "Bench Press") >= 225,
    getProgress: (s) => prog(lift1RM(s, "Bench Press"), 225),
  },
  {
    id: "plate_2_deadlift",
    label: "Two Plate Deadlift",
    description: "Deadlift 225 lbs (2 plates per side)",
    icon: "barbell",
    rarity: "common",
    category: "plate_club",
    liftName: "Deadlift",
    check: (s) => lift1RM(s, "Deadlift") >= 225,
    getProgress: (s) => prog(lift1RM(s, "Deadlift"), 225),
  },
  {
    id: "plate_3_squat",
    label: "Three Plate Squat",
    description: "Squat 315 lbs (3 plates per side)",
    icon: "barbell",
    rarity: "uncommon",
    category: "plate_club",
    liftName: "Squat",
    check: (s) => lift1RM(s, "Squat") >= 315,
    getProgress: (s) => prog(lift1RM(s, "Squat"), 315),
  },
  {
    id: "plate_3_deadlift",
    label: "Three Plate Deadlift",
    description: "Deadlift 315 lbs (3 plates per side)",
    icon: "barbell",
    rarity: "uncommon",
    category: "plate_club",
    liftName: "Deadlift",
    check: (s) => lift1RM(s, "Deadlift") >= 315,
    getProgress: (s) => prog(lift1RM(s, "Deadlift"), 315),
  },
  {
    id: "plate_3_bench",
    label: "Three Plate Bench",
    description: "Bench 315 lbs (3 plates per side)",
    icon: "barbell",
    rarity: "rare",
    category: "plate_club",
    liftName: "Bench Press",
    check: (s) => lift1RM(s, "Bench Press") >= 315,
    getProgress: (s) => prog(lift1RM(s, "Bench Press"), 315),
  },
  {
    id: "plate_4_squat",
    label: "Four Plate Squat",
    description: "Squat 405 lbs (4 plates per side)",
    icon: "barbell",
    rarity: "rare",
    category: "plate_club",
    liftName: "Squat",
    check: (s) => lift1RM(s, "Squat") >= 405,
    getProgress: (s) => prog(lift1RM(s, "Squat"), 405),
  },
  {
    id: "plate_4_deadlift",
    label: "Four Plate Deadlift",
    description: "Deadlift 405 lbs (4 plates per side)",
    icon: "barbell",
    rarity: "rare",
    category: "plate_club",
    liftName: "Deadlift",
    check: (s) => lift1RM(s, "Deadlift") >= 405,
    getProgress: (s) => prog(lift1RM(s, "Deadlift"), 405),
  },
  {
    id: "plate_5_deadlift",
    label: "Five Plate Deadlift",
    description: "Deadlift 495 lbs (5 plates per side)",
    icon: "barbell",
    rarity: "epic",
    category: "plate_club",
    liftName: "Deadlift",
    check: (s) => lift1RM(s, "Deadlift") >= 495,
    getProgress: (s) => prog(lift1RM(s, "Deadlift"), 495),
  },
  {
    id: "plate_4_bench",
    label: "Four Plate Bench",
    description: "Bench 405 lbs (4 plates per side)",
    icon: "barbell",
    rarity: "legendary",
    category: "plate_club",
    liftName: "Bench Press",
    check: (s) => lift1RM(s, "Bench Press") >= 405,
    getProgress: (s) => prog(lift1RM(s, "Bench Press"), 405),
  },
  {
    id: "plate_5_squat",
    label: "Five Plate Squat",
    description: "Squat 495 lbs (5 plates per side)",
    icon: "barbell",
    rarity: "epic",
    category: "plate_club",
    liftName: "Squat",
    check: (s) => lift1RM(s, "Squat") >= 495,
    getProgress: (s) => prog(lift1RM(s, "Squat"), 495),
  },
  {
    id: "plate_6_deadlift",
    label: "Six Plate Deadlift",
    description: "Deadlift 585 lbs (6 plates per side)",
    icon: "barbell",
    rarity: "legendary",
    category: "plate_club",
    liftName: "Deadlift",
    check: (s) => lift1RM(s, "Deadlift") >= 585,
    getProgress: (s) => prog(lift1RM(s, "Deadlift"), 585),
  },

  // ── Relative Strength (BW ratios) ────────────────────────────────────────
  {
    id: "ohp_half_bw",
    label: "Half BW Press",
    description: "Press half your bodyweight overhead",
    icon: "arrow-up",
    rarity: "common",
    category: "relative_strength",
    liftName: "Overhead Press",
    check: (s) => liftRatio(s, "Overhead Press") >= 0.5,
    getProgress: (s) => prog(liftRatio(s, "Overhead Press"), 0.5),
  },
  {
    id: "squat_bw",
    label: "Bodyweight Squat",
    description: "Squat your own bodyweight",
    icon: "fitness",
    rarity: "common",
    category: "relative_strength",
    liftName: "Squat",
    check: (s) => liftRatio(s, "Squat") >= 1.0,
    getProgress: (s) => prog(liftRatio(s, "Squat"), 1.0),
  },
  {
    id: "deadlift_bw",
    label: "Bodyweight Deadlift",
    description: "Deadlift your own bodyweight",
    icon: "fitness",
    rarity: "common",
    category: "relative_strength",
    liftName: "Deadlift",
    check: (s) => liftRatio(s, "Deadlift") >= 1.0,
    getProgress: (s) => prog(liftRatio(s, "Deadlift"), 1.0),
  },
  {
    id: "bench_bw",
    label: "Bodyweight Bench",
    description: "Bench your own bodyweight",
    icon: "fitness",
    rarity: "uncommon",
    category: "relative_strength",
    liftName: "Bench Press",
    check: (s) => liftRatio(s, "Bench Press") >= 1.0,
    getProgress: (s) => prog(liftRatio(s, "Bench Press"), 1.0),
  },
  {
    id: "ohp_075_bw",
    label: "0.75x BW Press",
    description: "Press 75% of your bodyweight overhead",
    icon: "arrow-up",
    rarity: "uncommon",
    category: "relative_strength",
    liftName: "Overhead Press",
    check: (s) => liftRatio(s, "Overhead Press") >= 0.75,
    getProgress: (s) => prog(liftRatio(s, "Overhead Press"), 0.75),
  },
  {
    id: "squat_1_5x",
    label: "1.5x BW Squat",
    description: "Squat 1.5 times your bodyweight",
    icon: "trending-up",
    rarity: "uncommon",
    category: "relative_strength",
    liftName: "Squat",
    check: (s) => liftRatio(s, "Squat") >= 1.5,
    getProgress: (s) => prog(liftRatio(s, "Squat"), 1.5),
  },
  {
    id: "deadlift_1_5x",
    label: "1.5x BW Deadlift",
    description: "Deadlift 1.5 times your bodyweight",
    icon: "trending-up",
    rarity: "uncommon",
    category: "relative_strength",
    liftName: "Deadlift",
    check: (s) => liftRatio(s, "Deadlift") >= 1.5,
    getProgress: (s) => prog(liftRatio(s, "Deadlift"), 1.5),
  },
  {
    id: "bench_1_25x",
    label: "1.25x BW Bench",
    description: "Bench 1.25 times your bodyweight",
    icon: "trending-up",
    rarity: "rare",
    category: "relative_strength",
    liftName: "Bench Press",
    check: (s) => liftRatio(s, "Bench Press") >= 1.25,
    getProgress: (s) => prog(liftRatio(s, "Bench Press"), 1.25),
  },
  {
    id: "squat_2x",
    label: "2x BW Squat",
    description: "Squat double your bodyweight",
    icon: "flame",
    rarity: "rare",
    category: "relative_strength",
    liftName: "Squat",
    check: (s) => liftRatio(s, "Squat") >= 2.0,
    getProgress: (s) => prog(liftRatio(s, "Squat"), 2.0),
  },
  {
    id: "deadlift_2x",
    label: "2x BW Deadlift",
    description: "Deadlift double your bodyweight",
    icon: "flame",
    rarity: "rare",
    category: "relative_strength",
    liftName: "Deadlift",
    check: (s) => liftRatio(s, "Deadlift") >= 2.0,
    getProgress: (s) => prog(liftRatio(s, "Deadlift"), 2.0),
  },
  {
    id: "bench_1_5x",
    label: "1.5x BW Bench",
    description: "Bench 1.5 times your bodyweight",
    icon: "flame",
    rarity: "rare",
    category: "relative_strength",
    liftName: "Bench Press",
    check: (s) => liftRatio(s, "Bench Press") >= 1.5,
    getProgress: (s) => prog(liftRatio(s, "Bench Press"), 1.5),
  },
  {
    id: "ohp_bw",
    label: "Bodyweight OHP",
    description: "Press your own bodyweight overhead",
    icon: "star",
    rarity: "epic",
    category: "relative_strength",
    liftName: "Overhead Press",
    check: (s) => liftRatio(s, "Overhead Press") >= 1.0,
    getProgress: (s) => prog(liftRatio(s, "Overhead Press"), 1.0),
  },
  {
    id: "squat_2_5x",
    label: "2.5x BW Squat",
    description: "Squat 2.5 times your bodyweight",
    icon: "star",
    rarity: "epic",
    category: "relative_strength",
    liftName: "Squat",
    check: (s) => liftRatio(s, "Squat") >= 2.5,
    getProgress: (s) => prog(liftRatio(s, "Squat"), 2.5),
  },
  {
    id: "deadlift_2_5x",
    label: "2.5x BW Deadlift",
    description: "Deadlift 2.5 times your bodyweight",
    icon: "star",
    rarity: "epic",
    category: "relative_strength",
    liftName: "Deadlift",
    check: (s) => liftRatio(s, "Deadlift") >= 2.5,
    getProgress: (s) => prog(liftRatio(s, "Deadlift"), 2.5),
  },
  {
    id: "bench_2x",
    label: "2x BW Bench",
    description: "Bench double your bodyweight",
    icon: "star",
    rarity: "epic",
    category: "relative_strength",
    liftName: "Bench Press",
    check: (s) => liftRatio(s, "Bench Press") >= 2.0,
    getProgress: (s) => prog(liftRatio(s, "Bench Press"), 2.0),
  },
  {
    id: "deadlift_3x",
    label: "3x BW Deadlift",
    description: "Deadlift triple your bodyweight",
    icon: "trophy",
    rarity: "legendary",
    category: "relative_strength",
    liftName: "Deadlift",
    check: (s) => liftRatio(s, "Deadlift") >= 3.0,
    getProgress: (s) => prog(liftRatio(s, "Deadlift"), 3.0),
  },

  // ── Total Club (Big 3 combined) ──────────────────────────────────────────
  {
    id: "total_500",
    label: "500 Club",
    description: "Big 3 total hits 500 lbs",
    icon: "medal-outline",
    rarity: "common",
    category: "total_club",
    check: (s) => big3Total(s) >= 500,
    getProgress: (s) => prog(big3Total(s), 500),
  },
  {
    id: "total_750",
    label: "750 Club",
    description: "Big 3 total hits 750 lbs",
    icon: "medal-outline",
    rarity: "uncommon",
    category: "total_club",
    check: (s) => big3Total(s) >= 750,
    getProgress: (s) => prog(big3Total(s), 750),
  },
  {
    id: "total_1000",
    label: "1000 lb Club",
    description: "Big 3 total hits 1000 lbs",
    icon: "trophy",
    rarity: "rare",
    category: "total_club",
    check: (s) => big3Total(s) >= 1000,
    getProgress: (s) => prog(big3Total(s), 1000),
  },
  {
    id: "total_1250",
    label: "1250 Club",
    description: "Big 3 total hits 1250 lbs",
    icon: "trophy",
    rarity: "epic",
    category: "total_club",
    check: (s) => big3Total(s) >= 1250,
    getProgress: (s) => prog(big3Total(s), 1250),
  },
  {
    id: "total_1500",
    label: "1500 Club",
    description: "Big 3 total hits 1500 lbs",
    icon: "trophy",
    rarity: "legendary",
    category: "total_club",
    check: (s) => big3Total(s) >= 1500,
    getProgress: (s) => prog(big3Total(s), 1500),
  },

  // ── Score Milestones ─────────────────────────────────────────────────────
  {
    id: "score_100",
    label: "Triple Digits",
    description: "Reach an ADPT Score of 100",
    icon: "sparkles",
    rarity: "common",
    category: "score",
    check: (_, t) => t >= 100,
    getProgress: (_, t) => prog(t, 100),
  },
  {
    id: "score_250",
    label: "Rising",
    description: "Reach an ADPT Score of 250",
    icon: "sparkles",
    rarity: "common",
    category: "score",
    check: (_, t) => t >= 250,
    getProgress: (_, t) => prog(t, 250),
  },
  {
    id: "score_500",
    label: "Half K",
    description: "Reach an ADPT Score of 500",
    icon: "sparkles",
    rarity: "uncommon",
    category: "score",
    check: (_, t) => t >= 500,
    getProgress: (_, t) => prog(t, 500),
  },
  {
    id: "score_750",
    label: "Seven-Fifty",
    description: "Reach an ADPT Score of 750",
    icon: "sparkles",
    rarity: "rare",
    category: "score",
    check: (_, t) => t >= 750,
    getProgress: (_, t) => prog(t, 750),
  },
  {
    id: "score_900",
    label: "Nine Hundred",
    description: "Reach an ADPT Score of 900",
    icon: "sparkles",
    rarity: "epic",
    category: "score",
    check: (_, t) => t >= 900,
    getProgress: (_, t) => prog(t, 900),
  },
];

export const TOTAL_MILESTONES = MILESTONE_DEFS.length;

function calculateMilestones(
  scores: LiftScore[],
  totalScore: number
): Milestone[] {
  return MILESTONE_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    description: def.description,
    icon: def.icon,
    rarity: def.rarity,
    category: def.category,
    liftName: def.liftName,
    achieved: def.check(scores, totalScore),
    progress: def.getProgress(scores, totalScore),
  }));
}
